-- Write your migrate up statements here
CREATE EXTENSION IF NOT EXISTS unaccent;
---- create above / drop below ----
DROP EXTENSION IF EXISTS unaccent;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
