-- Write your migrate up statements here
ALTER TABLE public.tenants
  ADD COLUMN id_cliente_padrao UUID;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_fk FOREIGN KEY (id_cliente_padrao)
    REFERENCES public.clientes(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
    NOT DEFERRABLE;
---- create above / drop below ----
-- migrate down
ALTER TABLE public.tenants
  DROP COLUMN id_cliente_padrao;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
