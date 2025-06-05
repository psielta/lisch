-- SQLC Queries para Outbox Event
-- ******************************

-- name: CreateOutboxEvent :one
INSERT INTO outbox_event (
    tenant_id,
    user_id,
    aggregate_type,
    aggregate_id,
    event_type,
    payload         -- jsonb
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING id, tenant_id, user_id, aggregate_type, aggregate_id, event_type, payload,
          created_at, processed, attempts, last_error;

-- name: GetOutboxEvent :one
SELECT
    id, tenant_id, user_id, aggregate_type, aggregate_id, event_type, payload,
    created_at, processed, attempts, last_error
FROM outbox_event
WHERE id = $1;

-- name: ListUnprocessedOutboxEventsForProcessing :many
/*
Seleciona em lote, preservando ordem de commit, bloqueando
as linhas para evitar processamento em paralelo. Use LIMIT
para controlar o tamanho do lote (ex.: 100).            */
WITH to_send AS (
    SELECT id, tenant_id, user_id, aggregate_type, aggregate_id, event_type, payload
    FROM   outbox_event
    WHERE  processed = false
    ORDER  BY created_at
    LIMIT  $1
    FOR UPDATE SKIP LOCKED
)
SELECT id, tenant_id, user_id, aggregate_type, aggregate_id, event_type, payload
FROM   to_send;

-- name: MarkOutboxEventProcessed :exec
UPDATE outbox_event
SET    processed = true,
       attempts  = attempts + 1,
       last_error = NULL
WHERE  id = $1;

-- name: MarkOutboxEventError :exec
/*
Grava o motivo da falha e incrementa o número de tentativas.
O serviço de publisher decide se reprocessa ou envia para
DLQ depois de N tentativas.                               */
UPDATE outbox_event
SET    attempts   = attempts + 1,
       last_error = $2          -- texto do erro
WHERE  id = $1;

-- name: DeleteProcessedOutboxEventsOlderThan :exec
/* Limpeza: remova eventos já processados e antigos.
   Ex.: call passando NOW() - interval '30 days'.        */
DELETE FROM outbox_event
WHERE processed = true
  AND created_at < $1;
