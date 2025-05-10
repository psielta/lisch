-- Write your migrate up statements here
BEGIN;

-- 1. Derruba a view que depende das colunas
DROP VIEW IF EXISTS categorias_view;

-- 2. Remove defaults (se existirem) e altera o tipo.
--    Como TIME não tem parte de data, fixamos a data em 1970-01-01.
ALTER TABLE categorias
    ALTER COLUMN inicio DROP DEFAULT,
    ALTER COLUMN fim    DROP DEFAULT,
    ALTER COLUMN inicio TYPE timestamp WITHOUT TIME ZONE
        USING (date '1970-01-01' + inicio),
    ALTER COLUMN fim    TYPE timestamp WITHOUT TIME ZONE
        USING (date '1970-01-01' + fim);

-- 3. Recria a view com a mesma definição anterior.
--    ⬇ Substitua o SELECT abaixo pela definição exata que estava em 010_categoria.sql
CREATE VIEW categorias_view AS
SELECT  c.*
FROM    categorias c
WHERE   c.deleted_at IS NULL;

COMMIT;

---- create above / drop below ----
BEGIN;

DROP VIEW IF EXISTS categorias_view;

ALTER TABLE categorias
    ALTER COLUMN inicio TYPE time WITHOUT TIME ZONE USING inicio::time,
    ALTER COLUMN fim    TYPE time WITHOUT TIME ZONE USING fim::time;

-- recria a view com as colunas no formato antigo
CREATE VIEW categorias_view AS
SELECT  c.*
FROM    categorias c
WHERE   c.deleted_at IS NULL;

COMMIT;

-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
