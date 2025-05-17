-- *****************************
-- CATEGORIA_ADICIONAL_OPCOES
-- *****************************

-- name: CreateCategoriaAdicionalOpcao :one
INSERT INTO categoria_adicional_opcoes (
    id_categoria_adicional,
    codigo,
    nome,
    valor,
    status
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING id, seq_id, id_categoria_adicional, codigo, nome,
          valor, status, created_at, updated_at;

-- name: GetCategoriaAdicionalOpcao :one
SELECT
    cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
    cao.nome, cao.valor, cao.status,
    cao.created_at, cao.updated_at,
    c.id_tenant
FROM categoria_adicional_opcoes cao
JOIN categoria_adicionais       ca  ON cao.id_categoria_adicional = ca.id
JOIN categorias                 c   ON ca.id_categoria            = c.id
WHERE cao.id = $1
  AND cao.deleted_at IS NULL;

-- name: GetCategoriaAdicionalOpcaoBySeqID :one
SELECT
    cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
    cao.nome, cao.valor, cao.status,
    cao.created_at, cao.updated_at,
    c.id_tenant
FROM categoria_adicional_opcoes cao
JOIN categoria_adicionais       ca  ON cao.id_categoria_adicional = ca.id
JOIN categorias                 c   ON ca.id_categoria            = c.id
WHERE cao.seq_id = $1
  AND cao.deleted_at IS NULL;

-- name: GetCategoriaAdicionalOpcaoByCodigoAndTenant :one
SELECT
    cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
    cao.nome, cao.valor, cao.status,
    cao.created_at, cao.updated_at,
    c.id_tenant
FROM categoria_adicional_opcoes cao
JOIN categoria_adicionais       ca  ON cao.id_categoria_adicional = ca.id
JOIN categorias                 c   ON ca.id_categoria            = c.id
WHERE cao.codigo     = $1
  AND c.id_tenant    = $2
  AND cao.deleted_at IS NULL;

-- name: ListCategoriaAdicionalOpcoesByAdicional :many
SELECT
    cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
    cao.nome, cao.valor, cao.status,
    cao.created_at, cao.updated_at
FROM categoria_adicional_opcoes cao
WHERE cao.id_categoria_adicional = $1
  AND cao.deleted_at IS NULL
ORDER BY cao.nome
LIMIT  $2 OFFSET $3;

-- name: ListCategoriaAdicionalOpcoesByTenant :many
SELECT
    cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
    cao.nome, cao.valor, cao.status,
    cao.created_at, cao.updated_at,
    c.id_tenant
FROM categoria_adicional_opcoes cao
JOIN categoria_adicionais       ca  ON cao.id_categoria_adicional = ca.id
JOIN categorias                 c   ON ca.id_categoria            = c.id
WHERE c.id_tenant    = $1
  AND cao.deleted_at IS NULL
ORDER BY ca.nome, cao.nome
LIMIT  $2 OFFSET $3;

-- name: UpdateCategoriaAdicionalOpcao :one
UPDATE categoria_adicional_opcoes cao
SET
    id_categoria_adicional = $3,
    codigo   = $4,
    nome     = $5,
    valor    = $6,
    status   = $7,
    updated_at = now()
FROM categoria_adicionais ca
JOIN categorias       c ON ca.id_categoria = c.id
WHERE cao.id_categoria_adicional = ca.id
  AND cao.id       = $1
  AND c.id_tenant  = $2
  AND cao.deleted_at IS NULL
RETURNING cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
          cao.nome, cao.valor, cao.status,
          cao.created_at, cao.updated_at;

-- name: SoftDeleteCategoriaAdicionalOpcao :exec
UPDATE categoria_adicional_opcoes cao
SET deleted_at = now()
FROM categoria_adicionais ca
JOIN categorias       c ON ca.id_categoria = c.id
WHERE cao.id_categoria_adicional = ca.id
  AND cao.id       = $1
  AND c.id_tenant  = $2
  AND cao.deleted_at IS NULL;

-- name: HardDeleteCategoriaAdicionalOpcao :exec
DELETE FROM categoria_adicional_opcoes cao
USING categoria_adicionais ca
JOIN categorias       c ON ca.id_categoria = c.id
WHERE cao.id_categoria_adicional = ca.id
  AND cao.id       = $1
  AND c.id_tenant  = $2;

-- name: UpdateCategoriaAdicionalOpcaoStatus :one
UPDATE categoria_adicional_opcoes cao
SET
    status     = $3,
    updated_at = now()
FROM categoria_adicionais ca
JOIN categorias       c ON ca.id_categoria = c.id
WHERE cao.id_categoria_adicional = ca.id
  AND cao.id       = $1
  AND c.id_tenant  = $2
  AND cao.deleted_at IS NULL
RETURNING cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
          cao.nome, cao.valor, cao.status,
          cao.created_at, cao.updated_at;

-- name: RestoreCategoriaAdicionalOpcao :one
UPDATE categoria_adicional_opcoes cao
SET deleted_at = NULL,
    updated_at = now()
FROM categoria_adicionais ca
JOIN categorias       c ON ca.id_categoria = c.id
WHERE cao.id_categoria_adicional = ca.id
  AND cao.id       = $1
  AND c.id_tenant  = $2
  AND cao.deleted_at IS NOT NULL
RETURNING cao.id, cao.seq_id, cao.id_categoria_adicional, cao.codigo,
          cao.nome, cao.valor, cao.status,
          cao.created_at, cao.updated_at;

-- name: CountCategoriaAdicionalOpcoesByAdicional :one
SELECT COUNT(*)
FROM categoria_adicional_opcoes
WHERE id_categoria_adicional = $1
  AND deleted_at IS NULL;
