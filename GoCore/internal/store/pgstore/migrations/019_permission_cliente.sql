-- Write your migrate up statements here
ALTER TABLE users ADD COLUMN permission_cliente INTEGER DEFAULT 0;

---- create above / drop below ----
ALTER TABLE users DROP COLUMN permission_cliente;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
