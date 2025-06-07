---- tern: disable-tx ----
-- Write your migrate up statements here
/* 1) -------- Coluna de soft-delete ----------------------- */
ALTER TABLE public.clientes
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

/* 2) --------- Remover UNIQUE constraints antigas --------- */
ALTER TABLE public.clientes
    DROP CONSTRAINT IF EXISTS clientes_cpf_unq,
    DROP CONSTRAINT IF EXISTS clientes_cnpj_unq;

/* 3) --------- Remover índices de telefone/celular antigos */
DROP INDEX IF EXISTS public.clientes_telefone_digits_unq;
DROP INDEX IF EXISTS public.clientes_celular_digits_unq;

/* 4) --------- Índice UNIQUE – CPF por tenant (não deletado) */
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS clientes_cpf_unq
    ON public.clientes (tenant_id, cpf)
    WHERE deleted_at IS NULL
      AND cpf IS NOT NULL
      AND cpf <> '';

/* 5) --------- Índice UNIQUE – CNPJ por tenant (não deletado) */
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS clientes_cnpj_unq
    ON public.clientes (tenant_id, cnpj)
    WHERE deleted_at IS NULL
      AND cnpj IS NOT NULL
      AND cnpj <> '';

/* 6) --------- Índice UNIQUE – Telefone (dígitos) ---------- */
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS clientes_telefone_digits_unq
    ON public.clientes
        (tenant_id,
         regexp_replace(telefone, '\D', '', 'g'))
    WHERE deleted_at IS NULL
      AND telefone IS NOT NULL
      AND telefone <> ''
      AND regexp_replace(telefone, '\D', '', 'g') <> '';

/* 7) --------- Índice UNIQUE – Celular (dígitos) ----------- */
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS clientes_celular_digits_unq
    ON public.clientes
        (tenant_id,
         regexp_replace(celular, '\D', '', 'g'))
    WHERE deleted_at IS NULL
      AND celular IS NOT NULL
      AND celular <> ''
      AND regexp_replace(celular, '\D', '', 'g') <> '';
---- create above / drop below ----
/* 1) --------- Remover índices parciais ------------------- */
DROP INDEX IF EXISTS public.clientes_celular_digits_unq;
DROP INDEX IF EXISTS public.clientes_telefone_digits_unq;
DROP INDEX IF EXISTS public.clientes_cnpj_unq;
DROP INDEX IF EXISTS public.clientes_cpf_unq;

/* 2) --------- Restaurar UNIQUE constraints originais ----- */
ALTER TABLE public.clientes
    ADD CONSTRAINT clientes_cpf_unq UNIQUE (tenant_id, cpf),
    ADD CONSTRAINT clientes_cnpj_unq UNIQUE (tenant_id, cnpj);

/* 3) --------- Remover coluna deleted_at ------------------ */
ALTER TABLE public.clientes
    DROP COLUMN IF EXISTS deleted_at;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
