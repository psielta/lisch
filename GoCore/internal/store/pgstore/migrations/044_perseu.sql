-- Write your migrate up statements here
ALTER TABLE public.produtos
  ADD COLUMN tipo_visualizacao INTEGER DEFAULT 0;
ALTER TABLE public.categoria_adicionais
  ADD COLUMN is_main BOOLEAN DEFAULT false;
---- create above / drop below ----
ALTER TABLE public.produtos
  DROP COLUMN tipo_visualizacao;
ALTER TABLE public.categoria_adicionais
  DROP COLUMN is_main;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
