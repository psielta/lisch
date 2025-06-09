-- name: InsertCaixa :one
INSERT INTO caixas (tenant_id, id_operador, valor_abertura, observacao_abertura, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetCaixaAbertosPorTenant :many
SELECT * FROM caixas WHERE tenant_id = $1 AND status = 'A' AND deleted_at IS NULL;

-- name: SuprimentoCaixa :one
INSERT INTO caixa_movimentacoes
(id_caixa, tipo, valor, observacao, autorizado_por)
VALUES
($1, 'U', $2, $3, $4)
RETURNING *;

-- name: RemoveSuprimentoCaixa :exec
UPDATE caixa_movimentacoes
    set deleted_at = now()
    where id = $1;

-- name: SangriaCaixa :one
INSERT INTO caixa_movimentacoes
(id_caixa, tipo, valor, observacao, autorizado_por)
VALUES
($1, 'S', $2, $3, $4)
RETURNING *;

-- name: RemoveSangriaCaixa :exec
UPDATE caixa_movimentacoes
    set deleted_at = now()
    where id = $1;

-- name: ResumoCaixaAberto :many
SELECT *
FROM calcular_valores_esperados_caixa($1);

-- name: InserirValoresInformados :exec
INSERT INTO caixa_fechamento_formas (id_caixa, id_forma_pagamento, valor_informado)
VALUES
  ($1, $2, $3);

-- name: FecharCaixa :exec
UPDATE caixas
SET status = 'F',
    data_fechamento = now(),
    observacao_fechamento = $2
WHERE id = $1;