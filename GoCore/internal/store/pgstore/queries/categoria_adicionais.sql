-- ***********************
-- CATEGORIA_ADICIONAIS
-- ***********************

-- name: CreateCategoriaAdicional :one
INSERT INTO categoria_adicionais (
    id_categoria,
    codigo_tipo,
    nome,
    selecao,
    minimo,
    limite,
    status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, seq_id, id_categoria, codigo_tipo, nome, selecao,
          minimo, limite, status, created_at, updated_at;

-- name: GetCategoriaAdicional :one
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at,
    c.id_tenant
FROM categoria_adicionais ca
JOIN categorias c ON ca.id_categoria = c.id
WHERE ca.id = $1
  AND ca.deleted_at IS NULL;

-- name: GetCategoriaAdicionalBySeqID :one
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at,
    c.id_tenant
FROM categoria_adicionais ca
JOIN categorias c ON ca.id_categoria = c.id
WHERE ca.seq_id = $1
  AND ca.deleted_at IS NULL;

-- name: GetCategoriaAdicionalByCodigoTipoAndTenant :one
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at,
    c.id_tenant
FROM categoria_adicionais ca
JOIN categorias c ON ca.id_categoria = c.id
WHERE ca.codigo_tipo = $1
  AND c.id_tenant   = $2
  AND ca.deleted_at IS NULL;

-- name: ListCategoriaAdicionaisByCategoria :many
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at
FROM categoria_adicionais ca
WHERE ca.id_categoria = $1
  AND ca.deleted_at IS NULL
ORDER BY ca.nome
LIMIT  $2 OFFSET $3;

-- name: ListCategoriaAdicionaisByTenant :many
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at,
    c.id_tenant
FROM categoria_adicionais ca
JOIN categorias c ON ca.id_categoria = c.id
WHERE c.id_tenant   = $1
  AND ca.deleted_at IS NULL
ORDER BY c.nome, ca.nome
LIMIT  $2 OFFSET $3;

-- name: UpdateCategoriaAdicional :one
UPDATE categoria_adicionais ca
SET
    id_categoria = $3,
    codigo_tipo  = $4,
    nome         = $5,
    selecao      = $6,
    minimo       = $7,
    limite       = $8,
    status       = $9,
    updated_at   = now()
FROM categorias c
WHERE ca.id_categoria = c.id
  AND ca.id        = $1
  AND c.id_tenant  = $2
  AND ca.deleted_at IS NULL
RETURNING ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
          ca.selecao, ca.minimo, ca.limite, ca.status,
          ca.created_at, ca.updated_at;

-- name: SoftDeleteCategoriaAdicional :exec
UPDATE categoria_adicionais ca
SET deleted_at = now()
FROM categorias c
WHERE ca.id_categoria = c.id
  AND ca.id        = $1
  AND c.id_tenant  = $2
  AND ca.deleted_at IS NULL;

-- name: HardDeleteCategoriaAdicional :exec
DELETE FROM categoria_adicionais ca
USING categorias c
WHERE ca.id_categoria = c.id
  AND ca.id        = $1
  AND c.id_tenant  = $2;

-- name: UpdateCategoriaAdicionalStatus :one
UPDATE categoria_adicionais ca
SET
    status     = $3,
    updated_at = now()
FROM categorias c
WHERE ca.id_categoria = c.id
  AND ca.id        = $1
  AND c.id_tenant  = $2
  AND ca.deleted_at IS NULL
RETURNING ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
          ca.selecao, ca.minimo, ca.limite, ca.status,
          ca.created_at, ca.updated_at;

-- name: RestoreCategoriaAdicional :one
UPDATE categoria_adicionais ca
SET deleted_at = NULL,
    updated_at = now()
FROM categorias c
WHERE ca.id_categoria = c.id
  AND ca.id        = $1
  AND c.id_tenant  = $2
  AND ca.deleted_at IS NOT NULL
RETURNING ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
          ca.selecao, ca.minimo, ca.limite, ca.status,
          ca.created_at, ca.updated_at;

-- name: CountCategoriaAdicionaisByCategoria :one
SELECT COUNT(*)
FROM categoria_adicionais
WHERE id_categoria = $1
  AND deleted_at IS NULL;
