-- SQLC Queries para Produtos

-- ***********************
-- PRODUTOS
-- ***********************

-- name: CreateProduto :one
INSERT INTO produtos (
    id_categoria,
    nome,
    descricao,
    codigo_externo,
    sku,
    permite_observacao,
    ordem,
    imagem_url,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
)
RETURNING id, seq_id, id_categoria, nome, descricao, codigo_externo, sku, permite_observacao, ordem, imagem_url, status, created_at, updated_at;

-- name: GetProduto :one
SELECT
    p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku,
    p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at,
    c.id_tenant -- Incluindo id_tenant da categoria para referência
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE p.id = $1 AND p.deleted_at IS NULL;

-- name: GetProdutoBySeqID :one
SELECT
    p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku,
    p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at,
    c.id_tenant
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE p.seq_id = $1 AND p.deleted_at IS NULL;

-- name: GetProdutoByCodigoExternoAndTenant :one
SELECT
    p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku,
    p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at,
    c.id_tenant
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE p.codigo_externo = $1 AND c.id_tenant = $2 AND p.deleted_at IS NULL;

-- name: ListProdutosByCategoria :many
SELECT
    p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku,
    p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at
FROM produtos p
WHERE p.id_categoria = $1 AND p.deleted_at IS NULL
ORDER BY p.ordem NULLS LAST, p.nome
LIMIT $2 OFFSET $3;

-- name: ListProdutosByTenant :many
SELECT
    p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku,
    p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at,
    c.id_tenant
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE c.id_tenant = $1 AND p.deleted_at IS NULL
ORDER BY c.ordem NULLS LAST, c.nome, p.ordem NULLS LAST, p.nome
LIMIT $2 OFFSET $3;

-- name: UpdateProduto :one
UPDATE produtos p
SET
    id_categoria = $3,
    nome = $4,
    descricao = $5,
    codigo_externo = $6,
    sku = $7,
    permite_observacao = $8,
    ordem = $9,
    imagem_url = $10,
    status = $11,
    updated_at = now()
FROM categorias c
WHERE p.id_categoria = c.id
  AND p.id = $1
  AND c.id_tenant = $2
  AND p.deleted_at IS NULL
RETURNING p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku, p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at;

-- name: SoftDeleteProduto :exec
UPDATE produtos p
SET deleted_at = now()
FROM categorias c
WHERE p.id_categoria = c.id
  AND p.id = $1
  AND c.id_tenant = $2
  AND p.deleted_at IS NULL;

-- name: HardDeleteProduto :exec
DELETE FROM produtos p
USING categorias c
WHERE p.id_categoria = c.id
  AND p.id = $1
  AND c.id_tenant = $2;
  -- CUIDADO: Hard delete remove permanentemente. Certifique-se que as FKs em produto_precos estão ON DELETE CASCADE.

-- name: UpdateProdutoStatus :one
UPDATE produtos p
SET
    status = $3,
    updated_at = now()
FROM categorias c
WHERE p.id_categoria = c.id
  AND p.id = $1
  AND c.id_tenant = $2
  AND p.deleted_at IS NULL
RETURNING p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku, p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at;

-- name: UpdateProdutoOrdem :one
UPDATE produtos p
SET
    ordem = $3,
    updated_at = now()
FROM categorias c
WHERE p.id_categoria = c.id
  AND p.id = $1
  AND c.id_tenant = $2
  AND p.deleted_at IS NULL
RETURNING p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku, p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at;

-- name: RestoreProduto :one
UPDATE produtos p
SET deleted_at = NULL,
    updated_at = now()
FROM categorias c
WHERE p.id_categoria = c.id
  AND p.id = $1
  AND c.id_tenant = $2
  AND p.deleted_at IS NOT NULL
RETURNING p.id, p.seq_id, p.id_categoria, p.nome, p.descricao, p.codigo_externo, p.sku, p.permite_observacao, p.ordem, p.imagem_url, p.status, p.created_at, p.updated_at;

-- name: CountProdutosByCategoria :one
SELECT COUNT(*)
FROM produtos
WHERE id_categoria = $1 AND deleted_at IS NULL;