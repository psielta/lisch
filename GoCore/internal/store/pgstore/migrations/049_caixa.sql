-- Write your migrate up statements here
/* ============================================================================
   041_caixas_up.sql
   SISTEMA DE GERENCIAMENTO DE CAIXAS (versão revisada)
   ============================================================================
   Este script cria toda a infraestrutura de abertura/fechamento de caixa
   com melhorias:
   - ENUM status_caixa em vez de CHAR(1)
   - Checks de sinal mais fortes
   - Restrição de um único caixa aberto por tenant
   - Índice composto (id_caixa,tipo)
   - FK de id_pagamento DEFERRABLE
   - Trigger de estorno automático em UPDATE/DELETE de pedido_pagamentos
   ============================================================================
*/

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------
CREATE TYPE public.status_caixa AS ENUM ('A', 'F');

-- ---------------------------------------------------------------------------
-- FORMAS DE PAGAMENTO (se já existir, apenas garante linhas padrão)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
    id     smallint PRIMARY KEY,
    codigo varchar(20)  NOT NULL UNIQUE,
    nome   varchar(50)  NOT NULL,
    tipo   char(1)      NOT NULL CHECK (tipo IN ('D','E','O')),
    ativo  smallint     NOT NULL DEFAULT 1,
    ordem  smallint     DEFAULT 0
);

INSERT INTO public.formas_pagamento (id,codigo,nome,tipo,ordem) VALUES
    (1,'DINHEIRO','Dinheiro','D',1),
    (2,'CARTAO_DEBITO','Cartão de Débito','E',2),
    (3,'CARTAO_CREDITO','Cartão de Crédito','E',3),
    (4,'PIX','PIX','E',4),
    (5,'VALE_ALIMENTACAO','Vale Alimentação','E',5),
    (6,'VALE_REFEICAO','Vale Refeição','E',6),
    (7,'TRANSFERENCIA','Transferência Bancária','E',7),
    (8,'BOLETO','Boleto Bancário','O',8),
    (9,'CHEQUE','Cheque','O',9),
    (10,'CREDIARIO','Crediário','O',10)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- OPERADORES DE CAIXA
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.operadores_caixa_seq_id_seq;

CREATE TABLE public.operadores_caixa (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_id      bigint NOT NULL DEFAULT nextval('public.operadores_caixa_seq_id_seq'),
    tenant_id   uuid NOT NULL,
    id_usuario  uuid NOT NULL,
    nome        varchar(100) NOT NULL,
    codigo      varchar(20),
    ativo       smallint     NOT NULL DEFAULT 1,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),
    deleted_at  timestamptz,

    CONSTRAINT operadores_caixa_seq_id_key UNIQUE (seq_id),
    CONSTRAINT fk_operadores_tenant  FOREIGN KEY (tenant_id)  REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_operadores_usuario FOREIGN KEY (id_usuario) REFERENCES public.users(id)   ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- CAIXAS
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.caixas_seq_id_seq;

CREATE TABLE public.caixas (
    id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_id            bigint NOT NULL DEFAULT nextval('public.caixas_seq_id_seq'),
    tenant_id         uuid NOT NULL,
    id_operador       uuid NOT NULL,
    data_abertura     timestamptz NOT NULL,
    data_fechamento   timestamptz,
    valor_abertura    numeric(10,2) NOT NULL DEFAULT 0,
    observacao_abertura   text,
    observacao_fechamento text,
    status            public.status_caixa NOT NULL DEFAULT 'A',
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz,

    CONSTRAINT caixas_seq_id_key UNIQUE (seq_id),
    CONSTRAINT caixas_valor_abertura_chk CHECK (valor_abertura >= 0),
    CONSTRAINT caixas_fechamento_chk CHECK (
        (status='A' AND data_fechamento IS NULL) OR
        (status='F' AND data_fechamento IS NOT NULL)
    ),
    CONSTRAINT fk_caixas_tenant   FOREIGN KEY (tenant_id)   REFERENCES public.tenants(id)        ON DELETE CASCADE,
    CONSTRAINT fk_caixas_operador FOREIGN KEY (id_operador) REFERENCES public.operadores_caixa(id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- CAIXA_MOVIMENTACOES
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.caixa_movimentacoes_seq_id_seq;

CREATE TABLE public.caixa_movimentacoes (
    id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_id             bigint NOT NULL DEFAULT nextval('public.caixa_movimentacoes_seq_id_seq'),
    id_caixa           uuid NOT NULL,
    tipo               char(1) NOT NULL CHECK (tipo IN ('S','U','P')), -- S=Sangria,U=Suprimento,P=Pagamento
    id_forma_pagamento smallint, -- obrigatório quando tipo='P'
    valor              numeric(10,2) NOT NULL,
    observacao         text,
    id_pagamento       uuid, -- FK para pedido_pagamentos quando tipo='P'
    autorizado_por     uuid,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz,

    CONSTRAINT caixa_movimentacoes_seq_id_key UNIQUE (seq_id),
    CONSTRAINT caixa_mov_valor_sangria_chk      CHECK (tipo <> 'S' OR valor > 0),
    CONSTRAINT caixa_mov_valor_suprimento_chk   CHECK (tipo <> 'U' OR valor > 0),
    CONSTRAINT caixa_mov_valor_pagamento_chk    CHECK (tipo <> 'P' OR valor > 0),
    CONSTRAINT caixa_mov_pagto_forma_chk CHECK (
        (tipo='P' AND id_forma_pagamento IS NOT NULL) OR
        (tipo IN ('S','U') AND id_forma_pagamento IS NULL)
    ),
    CONSTRAINT fk_cm_caixa        FOREIGN KEY (id_caixa)           REFERENCES public.caixas(id)            ON DELETE CASCADE,
    CONSTRAINT fk_cm_forma_pgto   FOREIGN KEY (id_forma_pagamento) REFERENCES public.formas_pagamento(id),
    CONSTRAINT fk_cm_pagamento FOREIGN KEY (id_pagamento) REFERENCES public.pedido_pagamentos(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fk_cm_autorizado   FOREIGN KEY (autorizado_por)     REFERENCES public.users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- CAIXA_FECHAMENTO_FORMAS
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.caixa_fechamento_formas_seq_id_seq;

CREATE TABLE public.caixa_fechamento_formas (
    id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    seq_id             bigint NOT NULL DEFAULT nextval('public.caixa_fechamento_formas_seq_id_seq'),
    id_caixa           uuid NOT NULL,
    id_forma_pagamento smallint NOT NULL,
    valor_esperado     numeric(10,2) NOT NULL DEFAULT 0,
    valor_informado    numeric(10,2) NOT NULL,
    diferenca          numeric(10,2) GENERATED ALWAYS AS (valor_informado - valor_esperado) STORED,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT caixa_fech_formas_seq_id_key UNIQUE (seq_id),
    CONSTRAINT caixa_fech_formas_unique UNIQUE (id_caixa, id_forma_pagamento),
    CONSTRAINT caixa_fech_valor_chk CHECK (valor_informado >= 0),
    CONSTRAINT fk_fech_caixa    FOREIGN KEY (id_caixa)           REFERENCES public.caixas(id)            ON DELETE CASCADE,
    CONSTRAINT fk_fech_forma    FOREIGN KEY (id_forma_pagamento) REFERENCES public.formas_pagamento(id)
);

-- ---------------------------------------------------------------------------
-- VIEWS (apenas filtragem soft-delete)
-- ---------------------------------------------------------------------------
CREATE VIEW public.operadores_caixa_view AS
SELECT * FROM public.operadores_caixa
WHERE deleted_at IS NULL;

CREATE VIEW public.caixas_view AS
SELECT id, seq_id, tenant_id, id_operador, data_abertura, data_fechamento,
       valor_abertura, observacao_abertura, observacao_fechamento, status,
       created_at, updated_at
FROM public.caixas
WHERE deleted_at IS NULL;

CREATE VIEW public.caixa_movimentacoes_view AS
SELECT * FROM public.caixa_movimentacoes
WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- FUNÇÕES DE APOIO
-- ---------------------------------------------------------------------------

-- Função utilitária já existente no seu schema: update_updated_at()
-- Função para mapear forma de pagamento de texto para id
CREATE OR REPLACE FUNCTION public.get_forma_pagamento_id(p_forma_texto text)
RETURNS smallint
LANGUAGE sql
STABLE
AS $$
    SELECT id
      FROM public.formas_pagamento
     WHERE UPPER(nome) = UPPER(p_forma_texto)
        OR UPPER(codigo) = UPPER(p_forma_texto)
     LIMIT 1;
$$;

-- Calcula valor esperado para uma forma de pagamento dentro de um caixa
CREATE OR REPLACE FUNCTION public.calcular_valor_esperado_forma(p_caixa_id uuid, p_forma_pagamento_id smallint)
RETURNS numeric(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total_pagamentos numeric(10,2);
    v_total_sang_sup   numeric(10,2);
    v_valor_abertura   numeric(10,2);
BEGIN
    v_total_pagamentos := 0;
    v_total_sang_sup   := 0;
    v_valor_abertura   := 0;

    IF p_forma_pagamento_id = 1 THEN  -- DINHEIRO
        SELECT valor_abertura INTO v_valor_abertura
          FROM public.caixas
         WHERE id = p_caixa_id;

        SELECT COALESCE(SUM(CASE WHEN tipo='S' THEN -valor WHEN tipo='U' THEN valor END),0)
          INTO v_total_sang_sup
          FROM public.caixa_movimentacoes
         WHERE id_caixa = p_caixa_id
           AND tipo IN ('S','U')
           AND deleted_at IS NULL;
    END IF;

    SELECT COALESCE(SUM(valor),0)
      INTO v_total_pagamentos
      FROM public.caixa_movimentacoes
     WHERE id_caixa = p_caixa_id
       AND tipo = 'P'
       AND id_forma_pagamento = p_forma_pagamento_id
       AND deleted_at IS NULL;

    RETURN v_valor_abertura + v_total_sang_sup + v_total_pagamentos;
END;
$$;

-- Calcula valores esperados para todas as formas
CREATE OR REPLACE FUNCTION public.calcular_valores_esperados_caixa(p_caixa_id uuid)
RETURNS TABLE(id_forma_pagamento smallint, codigo_forma text, nome_forma text, valor_esperado numeric(10,2))
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT fp.id, fp.codigo, fp.nome,
           public.calcular_valor_esperado_forma(p_caixa_id, fp.id)
      FROM public.formas_pagamento fp
     WHERE fp.ativo = 1
     ORDER BY fp.ordem, fp.nome;
END;
$$;

-- Retorna caixa ativo de um tenant
CREATE OR REPLACE FUNCTION public.get_caixa_ativo(p_tenant_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT id
      FROM public.caixas
     WHERE tenant_id = p_tenant_id
       AND status = 'A'
       AND deleted_at IS NULL
     LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- FUNÇÕES DE VALIDAÇÃO / TRIGGERS
-- ---------------------------------------------------------------------------

-- Valida abertura/fechamento
CREATE OR REPLACE FUNCTION public.validar_abertura_caixa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_abertos integer;
BEGIN
    -- impede mais de 1 caixa aberto por tenant
    SELECT COUNT(*) INTO v_abertos
      FROM public.caixas
     WHERE tenant_id = NEW.tenant_id
       AND status = 'A'
       AND deleted_at IS NULL
       AND (TG_OP='INSERT' OR id<>NEW.id);

    IF v_abertos > 0 AND NEW.status='A' THEN
        RAISE EXCEPTION 'Já existe caixa aberto para este tenant';
    END IF;

    -- impede operador ter mais de um
    SELECT COUNT(*) INTO v_abertos
      FROM public.caixas
     WHERE id_operador = NEW.id_operador
       AND status = 'A'
       AND deleted_at IS NULL
       AND (TG_OP='INSERT' OR id<>NEW.id);

    IF v_abertos > 0 AND NEW.status='A' THEN
        RAISE EXCEPTION 'Operador já possui caixa aberto';
    END IF;

    -- fechamento: se mudou pra F sem data, define agora
    IF TG_OP='UPDATE' AND OLD.status='A' AND NEW.status='F' AND NEW.data_fechamento IS NULL THEN
        NEW.data_fechamento := now();
    END IF;

    -- bloqueia reabrir
    IF TG_OP='UPDATE' AND OLD.status='F' AND NEW.status='A' THEN
        RAISE EXCEPTION 'Não é possível reabrir caixa fechado';
    END IF;

    RETURN NEW;
END;
$$;

-- valida movimentação
CREATE OR REPLACE FUNCTION public.validar_movimentacao_caixa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_status public.status_caixa;
BEGIN
    SELECT status INTO v_status
      FROM public.caixas
     WHERE id = NEW.id_caixa;

    IF v_status <> 'A' THEN
        RAISE EXCEPTION 'Não é possível movimentar caixa fechado';
    END IF;

    IF NEW.tipo='P' AND NEW.id_pagamento IS NOT NULL THEN
        PERFORM 1
          FROM public.caixa_movimentacoes
         WHERE id_pagamento = NEW.id_pagamento
           AND deleted_at IS NULL
           AND (TG_OP='INSERT' OR id<>NEW.id);
        IF FOUND THEN
            RAISE EXCEPTION 'Pagamento já vinculado a caixa';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- registra pagamento no caixa ativo
CREATE OR REPLACE FUNCTION public.registrar_pagamento_caixa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_caixa_id uuid;
    v_tenant_id uuid;
    v_forma_id smallint;
    v_liquido numeric(10,2);
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RETURN NEW;
    END IF;

    SELECT p.tenant_id INTO v_tenant_id FROM public.pedidos p WHERE p.id = NEW.id_pedido;

    v_caixa_id := public.get_caixa_ativo(v_tenant_id);
    IF v_caixa_id IS NULL THEN
        RETURN NEW;
    END IF;

    v_forma_id := public.get_forma_pagamento_id(NEW.forma_pagamento);
    IF v_forma_id IS NULL THEN
        RETURN NEW;
    END IF;

    v_liquido := NEW.valor_pago - NEW.troco;
    IF v_liquido <= 0 THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.caixa_movimentacoes
        (id_caixa,tipo,id_forma_pagamento,valor,observacao,id_pagamento)
    VALUES
        (v_caixa_id,'P',v_forma_id,v_liquido,
         'Pagamento automático - '||NEW.forma_pagamento, NEW.id);

    RETURN NEW;
END;
$$;

-- estorna caixa se pagamento alterado ou removido
CREATE OR REPLACE FUNCTION public.estornar_pagamento_caixa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.caixa_movimentacoes
     WHERE id_pagamento = OLD.id
       AND tipo='P'
       AND deleted_at IS NULL;
    RETURN OLD;
END;
$$;

-- atualiza esperado antes de inserir/update fechamento
CREATE OR REPLACE FUNCTION public.atualizar_valores_esperados_fechamento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.valor_esperado := public.calcular_valor_esperado_forma(NEW.id_caixa, NEW.id_forma_pagamento);
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

-- operadores: updated_at
CREATE TRIGGER trg_operadores_upd_at
BEFORE UPDATE ON public.operadores_caixa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- caixas: valida + updated_at
CREATE TRIGGER trg_caixas_valida
BEFORE INSERT OR UPDATE ON public.caixas
FOR EACH ROW EXECUTE FUNCTION public.validar_abertura_caixa();

CREATE TRIGGER trg_caixas_upd_at
BEFORE UPDATE ON public.caixas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- movimentações: valida + updated_at
CREATE TRIGGER trg_cm_valida
BEFORE INSERT OR UPDATE ON public.caixa_movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.validar_movimentacao_caixa();

CREATE TRIGGER trg_cm_upd_at
BEFORE UPDATE ON public.caixa_movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- auto registro pagamento
CREATE TRIGGER trg_pagamento_to_caixa
AFTER INSERT ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.registrar_pagamento_caixa();

-- estorno em update/delete
CREATE TRIGGER trg_pagamento_estorno_caixa
AFTER UPDATE OR DELETE ON public.pedido_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.estornar_pagamento_caixa();

-- caixa_fechamento_formas: calcula esperado + updated_at
CREATE TRIGGER trg_fech_calc
BEFORE INSERT OR UPDATE ON public.caixa_fechamento_formas
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valores_esperados_fechamento();

CREATE TRIGGER trg_fech_upd_at
BEFORE UPDATE ON public.caixa_fechamento_formas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- ÍNDICES ADICIONAIS
-- ---------------------------------------------------------------------------
CREATE INDEX idx_operadores_tenant       ON public.operadores_caixa (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_operadores_usuario      ON public.operadores_caixa (id_usuario) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_operadores_codigo ON public.operadores_caixa(tenant_id,codigo)
    WHERE deleted_at IS NULL AND codigo IS NOT NULL;

CREATE INDEX idx_caixas_tenant           ON public.caixas (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_caixas_operador         ON public.caixas (id_operador) WHERE deleted_at IS NULL;
CREATE INDEX idx_caixas_status           ON public.caixas (status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_caixa_operador_aberto ON public.caixas(id_operador)
    WHERE status='A' AND deleted_at IS NULL;

CREATE INDEX idx_cm_caixa                ON public.caixa_movimentacoes(id_caixa) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_caixa_tipo           ON public.caixa_movimentacoes(id_caixa,tipo) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_forma_pagto          ON public.caixa_movimentacoes(id_forma_pagamento) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_pagamento            ON public.caixa_movimentacoes(id_pagamento)
    WHERE deleted_at IS NULL AND id_pagamento IS NOT NULL;

CREATE INDEX idx_fech_caixa              ON public.caixa_fechamento_formas(id_caixa);
CREATE INDEX idx_fech_forma              ON public.caixa_fechamento_formas(id_forma_pagamento);

-- ---------------------------------------------------------------------------
-- COMENTÁRIOS (documentação)
-- ---------------------------------------------------------------------------
COMMENT ON TABLE public.caixas IS 'Sessões de caixa - abertura & fechamento (status_caixa ENUM)';
COMMENT ON COLUMN public.caixas.status IS 'A=Aberto, F=Fechado';

COMMENT ON TABLE public.caixa_movimentacoes IS 'Movimentações de caixa (pagamento, sangria, suprimento)';
COMMENT ON COLUMN public.caixa_movimentacoes.tipo IS 'S=Sangria (saída), U=Suprimento (entrada), P=Pagamento (entrada)';

COMMENT ON TABLE public.caixa_fechamento_formas IS 'Valores informados no fechamento às cegas por forma de pagamento';


---- create above / drop below ----
/* ============================================================================
   041_caixas_down.sql
   Reverte toda a infraestrutura criada em 041_caixas_up.sql
   ============================================================================
*/

-- ---------------------------------------------------------------------------
-- DROPA TRIGGERS
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_fech_upd_at            ON public.caixa_fechamento_formas;
DROP TRIGGER IF EXISTS trg_fech_calc              ON public.caixa_fechamento_formas;
DROP TRIGGER IF EXISTS trg_pagamento_estorno_caixa ON public.pedido_pagamentos;
DROP TRIGGER IF EXISTS trg_pagamento_to_caixa      ON public.pedido_pagamentos;
DROP TRIGGER IF EXISTS trg_cm_upd_at              ON public.caixa_movimentacoes;
DROP TRIGGER IF EXISTS trg_cm_valida              ON public.caixa_movimentacoes;
DROP TRIGGER IF EXISTS trg_caixas_upd_at          ON public.caixas;
DROP TRIGGER IF EXISTS trg_caixas_valida          ON public.caixas;
DROP TRIGGER IF EXISTS trg_operadores_upd_at      ON public.operadores_caixa;

-- ---------------------------------------------------------------------------
-- DROPA FUNÇÕES
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.atualizar_valores_esperados_fechamento();
DROP FUNCTION IF EXISTS public.estornar_pagamento_caixa();
DROP FUNCTION IF EXISTS public.registrar_pagamento_caixa();
DROP FUNCTION IF EXISTS public.validar_movimentacao_caixa();
DROP FUNCTION IF EXISTS public.validar_abertura_caixa();
DROP FUNCTION IF EXISTS public.get_caixa_ativo(uuid);
DROP FUNCTION IF EXISTS public.calcular_valores_esperados_caixa(uuid);
DROP FUNCTION IF EXISTS public.calcular_valor_esperado_forma(uuid, smallint);
DROP FUNCTION IF EXISTS public.get_forma_pagamento_id(text);

-- ---------------------------------------------------------------------------
-- DROPA VIEWS
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.caixa_movimentacoes_view;
DROP VIEW IF EXISTS public.caixas_view;
DROP VIEW IF EXISTS public.operadores_caixa_view;

-- ---------------------------------------------------------------------------
-- DROPA TABELAS E SEQUENCES
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.caixa_fechamento_formas;
DROP SEQUENCE IF EXISTS public.caixa_fechamento_formas_seq_id_seq;

DROP TABLE IF EXISTS public.caixa_movimentacoes;
DROP SEQUENCE IF EXISTS public.caixa_movimentacoes_seq_id_seq;

DROP TABLE IF EXISTS public.caixas;
DROP SEQUENCE IF EXISTS public.caixas_seq_id_seq;

DROP TABLE IF EXISTS public.operadores_caixa;
DROP SEQUENCE IF EXISTS public.operadores_caixa_seq_id_seq;

-- ---------------------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------------------
DROP TYPE IF EXISTS public.status_caixa;


-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
