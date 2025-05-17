-- Write your migrate up statements here
/* =========================================
   SEQUÊNCIAS
========================================= */
CREATE SEQUENCE public.categoria_adicionais_seq_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE SEQUENCE public.categoria_adicional_opcoes_seq_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

/* =========================================
   TABELA – TIPOS DE ADICIONAIS POR CATEGORIA
========================================= */
CREATE TABLE public.categoria_adicionais (
  id                uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
  seq_id            bigint          NOT NULL,
  id_categoria      uuid            NOT NULL REFERENCES public.categorias(id),
  codigo_tipo       varchar(100),                -- código externo (opcional)
  nome              varchar(100)    NOT NULL,    -- título exibido ao usuário
  selecao           char(1)         NOT NULL,    -- U, M ou Q
  minimo            integer,                     -- usado somente quando selecao = 'Q'
  limite            integer,                     -- limite de opções permitidas
  status            smallint        DEFAULT 1 NOT NULL,
  created_at        timestamptz     DEFAULT now() NOT NULL,
  updated_at        timestamptz     DEFAULT now() NOT NULL,
  deleted_at        timestamptz
);

COMMENT ON TABLE  public.categoria_adicionais IS
  'Tipos de adicionais disponíveis em cada categoria do cardápio';
COMMENT ON COLUMN public.categoria_adicionais.seq_id      IS
  'Identificador sequencial para facilitar CRUD';
COMMENT ON COLUMN public.categoria_adicionais.selecao     IS
  'U = Único (obrigatório escolher 1) | M = Múltiplo | Q = Quantidade múltipla';
COMMENT ON COLUMN public.categoria_adicionais.status      IS
  '1 = ativo | 0 = inativo';

/* vincula seq_id à sequence */
ALTER SEQUENCE public.categoria_adicionais_seq_id_seq
  OWNED BY public.categoria_adicionais.seq_id;

/* =========================================
   TABELA – OPÇÕES DE CADA ADICIONAL
========================================= */
CREATE TABLE public.categoria_adicional_opcoes (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  seq_id                bigint      NOT NULL,
  id_categoria_adicional uuid       NOT NULL REFERENCES public.categoria_adicionais(id),
  codigo                varchar(100),           -- código externo (opcional)
  nome                  varchar(100) NOT NULL,
  valor                 numeric(10,2) NOT NULL, -- preço do adicional
  status                smallint    DEFAULT 1 NOT NULL,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL,
  deleted_at            timestamptz
);

COMMENT ON TABLE  public.categoria_adicional_opcoes IS
  'Cada linha representa uma opção (ex.: “Cheddar”, “Bacon”) de um tipo de adicional';
COMMENT ON COLUMN public.categoria_adicional_opcoes.seq_id IS
  'Identificador sequencial para facilitar CRUD';

ALTER SEQUENCE public.categoria_adicional_opcoes_seq_id_seq
  OWNED BY public.categoria_adicional_opcoes.seq_id;

/* =========================================
   TRIGGERS – manter updated_at e soft delete
========================================= */
CREATE TRIGGER trg_cat_adicionais_upd_at
  BEFORE UPDATE ON public.categoria_adicionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_cat_adicionais_soft_delete
  BEFORE UPDATE ON public.categoria_adicionais
  FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.soft_delete_record();

CREATE TRIGGER trg_cat_add_opcoes_upd_at
  BEFORE UPDATE ON public.categoria_adicional_opcoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_cat_add_opcoes_soft_delete
  BEFORE UPDATE ON public.categoria_adicional_opcoes
  FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.soft_delete_record();

/* =========================================
   VIEWS – somente registros não excluídos
========================================= */
CREATE VIEW public.categoria_adicionais_view AS
SELECT *
  FROM public.categoria_adicionais
 WHERE deleted_at IS NULL;

CREATE VIEW public.categoria_adicional_opcoes_view AS
SELECT *
  FROM public.categoria_adicional_opcoes
 WHERE deleted_at IS NULL;

/* =========================================
   ÍNDICES ÚTEIS
========================================= */
-- evita códigos duplicados por categoria
CREATE UNIQUE INDEX idx_cat_adicionais_codigo
  ON public.categoria_adicionais (id_categoria, codigo_tipo)
  WHERE deleted_at IS NULL;

-- acelera consultas por adicional e status
CREATE INDEX idx_cat_add_opcoes_add_status
  ON public.categoria_adicional_opcoes (id_categoria_adicional, status)
  WHERE deleted_at IS NULL;

---- create above / drop below ----
/* =========================================
   ROLLBACK – Views
========================================= */
DROP VIEW IF EXISTS public.categoria_adicional_opcoes_view;
DROP VIEW IF EXISTS public.categoria_adicionais_view;

/* =========================================
   ROLLBACK – Triggers
========================================= */
DROP TRIGGER IF EXISTS trg_cat_add_opcoes_soft_delete ON public.categoria_adicional_opcoes;
DROP TRIGGER IF EXISTS trg_cat_add_opcoes_upd_at      ON public.categoria_adicional_opcoes;

DROP TRIGGER IF EXISTS trg_cat_adicionais_soft_delete ON public.categoria_adicionais;
DROP TRIGGER IF EXISTS trg_cat_adicionais_upd_at      ON public.categoria_adicionais;

/* =========================================
   ROLLBACK – Indexes
========================================= */
DROP INDEX IF EXISTS public.idx_cat_add_opcoes_add_status;
DROP INDEX IF EXISTS public.idx_cat_adicionais_codigo;

/* =========================================
   ROLLBACK – Tables
========================================= */
DROP TABLE IF EXISTS public.categoria_adicional_opcoes;
DROP TABLE IF EXISTS public.categoria_adicionais;

/* =========================================
   ROLLBACK – Sequences
========================================= */
DROP SEQUENCE IF EXISTS public.categoria_adicional_opcoes_seq_id_seq;
DROP SEQUENCE IF EXISTS public.categoria_adicionais_seq_id_seq;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
