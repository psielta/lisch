-- Write your migrate up statements here
ALTER TABLE public.tenants
  ADD COLUMN taxa_entrega_padrao NUMERIC(19,2) DEFAULT 0;
---- create above / drop below ----
-- down
ALTER TABLE public.tenants
  DROP COLUMN taxa_entrega_padrao;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
