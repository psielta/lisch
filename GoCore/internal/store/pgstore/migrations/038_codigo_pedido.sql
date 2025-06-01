-- Write your migrate up statements here
/* =========================================================
   UP – gera código de pedido inteligente
   ========================================================= */

------------------------------------------------------------
-- 0) Remover a view que depende de codigo_pedido
------------------------------------------------------------
DROP VIEW IF EXISTS public.pedidos_view;

------------------------------------------------------------
-- 1) Sequência inteira ÚNICA para cada tenant
------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.tenants_seq_id_seq;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS seq_id BIGINT
  NOT NULL
  DEFAULT nextval('public.tenants_seq_id_seq');

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_seq_id_key UNIQUE (seq_id);

UPDATE public.tenants                 -- garante seq_id p/ registros antigos
   SET seq_id = nextval('public.tenants_seq_id_seq')
 WHERE seq_id IS NULL;

------------------------------------------------------------
-- 2) Aumentar o campo que guarda o código
------------------------------------------------------------
ALTER TABLE public.pedidos
  ALTER COLUMN codigo_pedido TYPE VARCHAR(40);

------------------------------------------------------------
-- 3) Tabela para controle da sequência diária
------------------------------------------------------------
CREATE TABLE public.pedido_seq_diaria (
    tenant_id UUID  NOT NULL,
    dia       DATE  NOT NULL,
    seq       INT   NOT NULL,
    PRIMARY KEY (tenant_id, dia)
);

------------------------------------------------------------
-- 4) Função + trigger que montam o código
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gen_codigo_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_seq BIGINT;
    v_daily_seq  INT;
    v_data       DATE;
    v_hora       TEXT;
BEGIN
    SELECT seq_id INTO v_tenant_seq
      FROM public.tenants
     WHERE id = NEW.tenant_id;

    IF v_tenant_seq IS NULL THEN
        RAISE EXCEPTION 'Tenant % não possui seq_id', NEW.tenant_id
              USING ERRCODE = 'P0001';
    END IF;

    v_data := COALESCE(NEW.data_pedido, now())::date;

    INSERT INTO public.pedido_seq_diaria (tenant_id, dia, seq)
         VALUES (NEW.tenant_id, v_data, 1)
    ON CONFLICT (tenant_id, dia)
       DO UPDATE SET seq = pedido_seq_diaria.seq + 1
    RETURNING seq INTO v_daily_seq;

    v_hora := to_char(COALESCE(NEW.data_pedido, now()), 'HH24MISS');

    NEW.codigo_pedido :=
        format('P-%s-%s-%s-%s',
               v_tenant_seq,
               to_char(v_data, 'YYYYMMDD'),
               v_hora,
               v_daily_seq);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gen_codigo_pedido ON public.pedidos;

CREATE TRIGGER trg_gen_codigo_pedido
BEFORE INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.gen_codigo_pedido();

------------------------------------------------------------
-- 5) Recriar a view após a alteração
------------------------------------------------------------
CREATE VIEW public.pedidos_view AS
SELECT  id,
        seq_id,
        tenant_id,
        id_cliente,
        codigo_pedido,
        data_pedido,
        gmt,
        pedido_pronto,
        data_pedido_pronto,
        cupom,
        tipo_entrega,
        prazo,
        prazo_min,
        prazo_max,
        categoria_pagamento,
        forma_pagamento,
        valor_total,
        observacao,
        taxa_entrega,
        nome_taxa_entrega,
        id_status,
        lat,
        lng,
        created_at,
        updated_at,
        deleted_at
  FROM public.pedidos
 WHERE deleted_at IS NULL;

---- create above / drop below ----
/* =========================================================
   DOWN – rollback completo
   ========================================================= */

------------------------------------------------------------
-- 0) Remover a view antes de desfazer alterações
------------------------------------------------------------
DROP VIEW IF EXISTS public.pedidos_view;

------------------------------------------------------------
-- 1) Desligar trigger e função
------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_gen_codigo_pedido ON public.pedidos;
DROP FUNCTION IF EXISTS public.gen_codigo_pedido();

------------------------------------------------------------
-- 2) Apagar tabela da sequência diária
------------------------------------------------------------
DROP TABLE IF EXISTS public.pedido_seq_diaria;

------------------------------------------------------------
-- 3) Voltar o tamanho antigo do código
------------------------------------------------------------
ALTER TABLE public.pedidos
  ALTER COLUMN codigo_pedido TYPE VARCHAR(20);

------------------------------------------------------------
-- 4) Remover seq_id do tenant
------------------------------------------------------------
ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_seq_id_key;

ALTER TABLE public.tenants
  DROP COLUMN IF EXISTS seq_id;

DROP SEQUENCE IF EXISTS public.tenants_seq_id_seq;

------------------------------------------------------------
-- 5) Recriar a view exatamente como era (20 caracteres)
------------------------------------------------------------
CREATE VIEW public.pedidos_view AS
SELECT  id,
        seq_id,
        tenant_id,
        id_cliente,
        codigo_pedido,
        data_pedido,
        gmt,
        pedido_pronto,
        data_pedido_pronto,
        cupom,
        tipo_entrega,
        prazo,
        prazo_min,
        prazo_max,
        categoria_pagamento,
        forma_pagamento,
        valor_total,
        observacao,
        taxa_entrega,
        nome_taxa_entrega,
        id_status,
        lat,
        lng,
        created_at,
        updated_at,
        deleted_at
  FROM public.pedidos
 WHERE deleted_at IS NULL;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
