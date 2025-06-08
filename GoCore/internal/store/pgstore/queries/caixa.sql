-- name: InsertCaixa :one
INSERT INTO caixas (tenant_id, id_operador, valor_abertura, observacao_abertura, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetCaixaAbertosPorTenant :many
SELECT * FROM caixas WHERE tenant_id = $1 AND status = 'A' AND deleted_at IS NULL;