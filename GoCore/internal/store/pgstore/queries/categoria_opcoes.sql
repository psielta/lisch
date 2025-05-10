-- SQLC Queries para Categoria Opcoes

-- ***********************
-- CATEGORIA_OPCOES
-- ***********************

-- name: CreateCategoriaOpcao :one
INSERT INTO categoria_opcoes (
    id_categoria,
    nome,
    status
) VALUES (
             $1, $2, $3
         )
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at;

-- name: GetCategoriaOpcao :one
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetCategoriaOpcaoBySeqID :one
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE seq_id = $1 AND deleted_at IS NULL;

-- name: ListCategoriaOpcoes :many
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE deleted_at IS NULL
ORDER BY nome
    LIMIT $1 OFFSET $2;

-- name: ListCategoriaOpcoesByCategoria :many
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE id_categoria = $1 AND deleted_at IS NULL
ORDER BY nome
    LIMIT $2 OFFSET $3;

-- name: ListCategoriaOpcoesAtivas :many
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE id_categoria = $1 AND status = 1 AND deleted_at IS NULL
ORDER BY nome;

-- name: UpdateCategoriaOpcao :one
UPDATE categoria_opcoes
SET
    nome = $2,
    status = $3,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at;

-- name: SoftDeleteCategoriaOpcao :exec
UPDATE categoria_opcoes
SET deleted_at = now()
WHERE id = $1 AND deleted_at IS NULL;

-- name: HardDeleteCategoriaOpcao :exec
DELETE FROM categoria_opcoes
WHERE id = $1;

-- name: CountCategoriaOpcoesByCategoria :one
SELECT COUNT(*)
FROM categoria_opcoes
WHERE id_categoria = $1 AND deleted_at IS NULL;

-- name: GetCategoriaOpcaoByNome :one
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE nome = $1 AND id_categoria = $2 AND deleted_at IS NULL;

-- name: UpdateCategoriaOpcaoStatus :one
UPDATE categoria_opcoes
SET
    status = $2,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at;

-- name: RestoreCategoriaOpcao :one
UPDATE categoria_opcoes
SET deleted_at = NULL
WHERE id = $1
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at;

-- name: DeleteCategoriaOpcoesByCategoria :exec
UPDATE categoria_opcoes
SET deleted_at = now()
WHERE id_categoria = $1 AND deleted_at IS NULL;

-- name: BulkCreateCategoriaOpcoes :many
INSERT INTO categoria_opcoes (
    id_categoria,
    nome,
    status
)
SELECT
    unnest($1::uuid[]),
    unnest($2::varchar[]),
    unnest($3::smallint[])
        RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at;