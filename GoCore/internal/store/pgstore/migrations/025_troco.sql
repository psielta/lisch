-- Write your migrate up statements here
ALTER TABLE public.pedidos
  ADD COLUMN troco_para NUMERIC(10,2);
---- create above / drop below ----
ALTER TABLE public.pedidos
  ADD COLUMN troco_para NUMERIC(10,2);
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
