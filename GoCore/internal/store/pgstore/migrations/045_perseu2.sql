-- Write your migrate up statements here
ALTER TABLE public.produtos
  DROP COLUMN tipo_visualizacao;
ALTER TABLE public.categorias
  ADD COLUMN tipo_visualizacao INTEGER DEFAULT 0;
---- create above / drop below ----
ALTER TABLE public.produtos
  ADD COLUMN tipo_visualizacao INTEGER DEFAULT 0;
ALTER TABLE public.categorias
  DROP COLUMN tipo_visualizacao;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
