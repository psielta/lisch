-- Write your migrate up statements here
ALTER TABLE public.tenants
  ADD COLUMN photo BYTEA;
ALTER TABLE public.tenants
  ADD COLUMN telefone VARCHAR(20);
ALTER TABLE public.tenants
  ADD COLUMN endereco VARCHAR(256);
ALTER TABLE public.tenants
  ADD COLUMN bairro VARCHAR(256);
ALTER TABLE public.tenants
  ADD COLUMN cidade VARCHAR(256);
---- create above / drop below ----
-- Down
ALTER TABLE public.tenants
  DROP COLUMN photo;
ALTER TABLE public.tenants
  DROP COLUMN telefone;
ALTER TABLE public.tenants
  DROP COLUMN endereco;
ALTER TABLE public.tenants
  DROP COLUMN bairro;
ALTER TABLE public.tenants
  DROP COLUMN cidade;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
