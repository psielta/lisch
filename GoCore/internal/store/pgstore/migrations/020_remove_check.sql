-- Write your migrate up statements here
ALTER TABLE public.clientes
  DROP CONSTRAINT clientes_doc_chk RESTRICT;
---- create above / drop below ----

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
