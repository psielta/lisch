-- Write your migrate up statements here
CREATE UNIQUE INDEX operadores_caixa_idx ON public.operadores_caixa
  USING btree (tenant_id, id_usuario);
---- create above / drop below ----
DROP INDEX IF EXISTS public.operadores_caixa_idx;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
