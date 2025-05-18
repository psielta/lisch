-- Write your migrate up statements here
ALTER TABLE public.categoria_adicional_opcoes
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.categoria_adicionais
  ALTER COLUMN status DROP DEFAULT;

---- create above / drop below ----
-- DOWN
ALTER TABLE public.categoria_adicional_opcoes
  ALTER COLUMN status SET DEFAULT 0;
ALTER TABLE public.categoria_adicionais
  ALTER COLUMN status SET DEFAULT 0;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
