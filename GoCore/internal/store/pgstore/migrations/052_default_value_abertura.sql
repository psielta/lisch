-- Write your migrate up statements here
ALTER TABLE public.caixas
  ALTER COLUMN data_abertura SET DEFAULT now();
---- create above / drop below ----
ALTER TABLE public.caixas
  ALTER COLUMN data_abertura DROP DEFAULT;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
