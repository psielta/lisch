-- Write your migrate up statements here
CREATE TABLE outbox_event
(
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- ordenação ✔ :contentReference[oaicite:2]{index=2}
    aggregate_type  text    NOT NULL,   -- ex.: 'product'
    aggregate_id    text    NOT NULL,   -- SKU ou PK da entidade
    event_type      text    NOT NULL,   -- 'UPSERT' | 'DELETE'
    payload         jsonb   NOT NULL,   -- estado ou diff
    created_at      timestamptz NOT NULL DEFAULT now(),
    processed       boolean NOT NULL DEFAULT false,
    attempts        int     NOT NULL DEFAULT 0,
    last_error      text
);

-- Índice rápido para o publicador por polling
CREATE INDEX  idx_outbox_unprocessed
        ON outbox_event (created_at)
     WHERE processed = false;
---- create above / drop below ----
-- Migration Down: Reverter criação da tabela outbox_event
-- Execute este script para desfazer a migration

-- 1. Remover o índice primeiro
DROP INDEX IF EXISTS idx_outbox_unprocessed;

-- 2. Remover a tabela
DROP TABLE IF EXISTS outbox_event;
-- Write your migrate down statements here. If this migration is irreversible
-- Then delete the separator line above.
