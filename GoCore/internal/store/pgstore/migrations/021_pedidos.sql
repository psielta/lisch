-- Write your migrate up statements here
/* ---------- Tabela de status do pedido ---------- */
CREATE TABLE public.pedido_status (
    id           smallint PRIMARY KEY,
    descricao    varchar(100) NOT NULL
);

/* Alguns valores de exemplo */
INSERT INTO public.pedido_status (id, descricao) VALUES
 (1,'Confirmado'),
 (2,'Em preparação'),
 (3,'Pronto'),
 (4,'Saiu para entrega'),
 (5,'Concluído'),
 (6,'Cancelado');

/* ---------- Pedidos ---------- */
CREATE SEQUENCE public.pedidos_seq_id_seq;

CREATE TABLE public.pedidos (
    id                  uuid        DEFAULT gen_random_uuid() NOT NULL,
    seq_id              bigint      NOT NULL DEFAULT nextval('public.pedidos_seq_id_seq'),
    tenant_id           uuid        NOT NULL,
    id_cliente          uuid        NOT NULL,
    codigo_pedido       varchar(20) NOT NULL UNIQUE,
    data_pedido         timestamptz NOT NULL,
    gmt                 smallint    NOT NULL,
    pedido_pronto       smallint    DEFAULT 0 NOT NULL, -- 0 = não, 1 = sim
    data_pedido_pronto  timestamptz,
    cupom               varchar(100),
    tipo_entrega        varchar(20) NOT NULL,           -- Delivery / Retirada
    prazo               integer,
    prazo_min           integer,
    prazo_max           integer,
    categoria_pagamento varchar(50),
    forma_pagamento     varchar(100),
    valor_total         numeric(10,2) NOT NULL,
    observacao          text,
    taxa_entrega        numeric(10,2) DEFAULT 0 NOT NULL,
    nome_taxa_entrega   varchar(100),
    id_status           smallint     NOT NULL,
    lat                 numeric(9,6),
    lng                 numeric(9,6),
    created_at          timestamptz  DEFAULT now() NOT NULL,
    updated_at          timestamptz  DEFAULT now() NOT NULL,
    deleted_at          timestamptz,
    CONSTRAINT pedidos_pkey            PRIMARY KEY(id),
    CONSTRAINT fk_pedidos_status       FOREIGN KEY(id_status)   REFERENCES public.pedido_status(id),
    CONSTRAINT fk_pedidos_clientes     FOREIGN KEY(id_cliente)  REFERENCES public.clientes(id),
    CONSTRAINT fk_pedidos_tenant       FOREIGN KEY(tenant_id)   REFERENCES public.tenants(id)
);

/* Gatilhos de auditoria / soft-delete */
CREATE TRIGGER trg_pedidos_update_updated_at
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();    -- :contentReference[oaicite:3]{index=3}

CREATE TRIGGER trg_pedidos_soft_delete
    BEFORE DELETE ON public.pedidos
    FOR EACH ROW EXECUTE FUNCTION public.soft_delete_record();

/* ---------- Itens do pedido ---------- */
CREATE SEQUENCE public.pedido_itens_seq_id_seq;

CREATE TABLE public.pedido_itens (
    id                    uuid    DEFAULT gen_random_uuid() NOT NULL,
    seq_id                bigint  NOT NULL DEFAULT nextval('public.pedido_itens_seq_id_seq'),
    id_pedido             uuid    NOT NULL,
    id_produto            uuid    NOT NULL,
    id_produto_2          uuid,
    id_categoria          uuid    NOT NULL,
    id_categoria_opcao    uuid,
    observacao            text,
    valor_unitario        numeric(10,2) NOT NULL,
    quantidade            integer       NOT NULL,
    created_at            timestamptz   DEFAULT now() NOT NULL,
    updated_at            timestamptz   DEFAULT now() NOT NULL,
    deleted_at            timestamptz,
    CONSTRAINT pedido_itens_pkey             PRIMARY KEY(id),
    CONSTRAINT fk_pi_pedido                  FOREIGN KEY(id_pedido)          REFERENCES public.pedidos(id)           ON DELETE CASCADE,
    CONSTRAINT fk_pi_produto                 FOREIGN KEY(id_produto)         REFERENCES public.produtos(id),
    CONSTRAINT fk_pi_produto_2               FOREIGN KEY(id_produto_2)       REFERENCES public.produtos(id),
    CONSTRAINT fk_pi_categoria               FOREIGN KEY(id_categoria)       REFERENCES public.categorias(id),
    CONSTRAINT fk_pi_categoria_opcao         FOREIGN KEY(id_categoria_opcao) REFERENCES public.categoria_opcoes(id)
);

CREATE TRIGGER trg_pedido_itens_update_updated_at
    BEFORE UPDATE ON public.pedido_itens
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_pedido_itens_soft_delete
    BEFORE DELETE ON public.pedido_itens
    FOR EACH ROW EXECUTE FUNCTION public.soft_delete_record();

/* ---------- Adicionais dos itens ---------- */
CREATE SEQUENCE public.pedido_item_adicionais_seq_id_seq;

CREATE TABLE public.pedido_item_adicionais (
    id                   uuid   DEFAULT gen_random_uuid() NOT NULL,
    seq_id               bigint NOT NULL DEFAULT nextval('public.pedido_item_adicionais_seq_id_seq'),
    id_pedido_item       uuid   NOT NULL,
    id_adicional_opcao   uuid   NOT NULL,
    valor                numeric(10,2) NOT NULL,
    quantidade           integer        NOT NULL,
    created_at           timestamptz    DEFAULT now() NOT NULL,
    updated_at           timestamptz    DEFAULT now() NOT NULL,
    deleted_at           timestamptz,
    CONSTRAINT pedido_item_adicionais_pkey      PRIMARY KEY(id),
    CONSTRAINT fk_pia_pedido_item              FOREIGN KEY(id_pedido_item)    REFERENCES public.pedido_itens(id) ON DELETE CASCADE,
    CONSTRAINT fk_pia_adicional_opcao          FOREIGN KEY(id_adicional_opcao)REFERENCES public.categoria_adicional_opcoes(id)
);

CREATE TRIGGER trg_pia_update_updated_at
    BEFORE UPDATE ON public.pedido_item_adicionais
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_pia_soft_delete
    BEFORE DELETE ON public.pedido_item_adicionais
    FOR EACH ROW EXECUTE FUNCTION public.soft_delete_record();

/* ---------- Visões úteis sem registros excluídos ---------- */
CREATE VIEW public.pedidos_view AS
SELECT *
  FROM public.pedidos
 WHERE deleted_at IS NULL;

CREATE VIEW public.pedido_itens_view AS
SELECT *
  FROM public.pedido_itens
 WHERE deleted_at IS NULL;

CREATE VIEW public.pedido_item_adicionais_view AS
SELECT *
  FROM public.pedido_item_adicionais
 WHERE deleted_at IS NULL;

---- create above / drop below ----
DROP VIEW IF EXISTS public.pedido_item_adicionais_view;
DROP VIEW IF EXISTS public.pedido_itens_view;
DROP VIEW IF EXISTS public.pedidos_view;

DROP TRIGGER IF EXISTS trg_pia_soft_delete ON public.pedido_item_adicionais;
DROP TRIGGER IF EXISTS trg_pia_update_updated_at ON public.pedido_item_adicionais;

DROP TABLE IF EXISTS public.pedido_item_adicionais;
DROP SEQUENCE IF EXISTS public.pedido_item_adicionais_seq_id_seq;

DROP TRIGGER IF EXISTS trg_pedido_itens_soft_delete ON public.pedido_itens;
DROP TRIGGER IF EXISTS trg_pedido_itens_update_updated_at ON public.pedido_itens;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
