-- SQLC Queries para Categorias

-- ***********************
-- CATEGORIAS
-- ***********************

-- name: CreateCategoria :one
INSERT INTO categorias (
    id_tenant,
    id_culinaria,
    nome,
    descricao,
    inicio,
    fim,
    ativo,
    opcao_meia,
    ordem,
    disponivel_domingo,
    disponivel_segunda,
    disponivel_terca,
    disponivel_quarta,
    disponivel_quinta,
    disponivel_sexta,
    disponivel_sabado
) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
         )
    RETURNING id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
  ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
  disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at;

-- name: GetCategoria :one
SELECT
    id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
    ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
    disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at
FROM categorias
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetCategoriaBySeqID :one
SELECT
    id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
    ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
    disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at
FROM categorias
WHERE seq_id = $1 AND deleted_at IS NULL;

-- name: ListCategorias :many
SELECT
    id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
    ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
    disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at
FROM categorias
WHERE id_tenant = $1 AND deleted_at IS NULL
ORDER BY ordem NULLS LAST, nome
    LIMIT $2 OFFSET $3;

-- name: ListCategoriasByCulinaria :many
SELECT
    id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
    ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
    disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at
FROM categorias
WHERE id_tenant = $1 AND id_culinaria = $2 AND deleted_at IS NULL
ORDER BY ordem NULLS LAST, nome
    LIMIT $3 OFFSET $4;

-- name: ListCategoriasDisponiveis :many
SELECT
    id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
    ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
    disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at
FROM categorias
WHERE
    id_tenant = $1 AND
    ativo = 1 AND
    deleted_at IS NULL AND
    (
        (EXTRACT(DOW FROM $2::timestamp) = 0 AND disponivel_domingo = 1) OR
        (EXTRACT(DOW FROM $2::timestamp) = 1 AND disponivel_segunda = 1) OR
        (EXTRACT(DOW FROM $2::timestamp) = 2 AND disponivel_terca = 1) OR
        (EXTRACT(DOW FROM $2::timestamp) = 3 AND disponivel_quarta = 1) OR
        (EXTRACT(DOW FROM $2::timestamp) = 4 AND disponivel_quinta = 1) OR
        (EXTRACT(DOW FROM $2::timestamp) = 5 AND disponivel_sexta = 1) OR
        (EXTRACT(DOW FROM $2::timestamp) = 6 AND disponivel_sabado = 1)
        ) AND
    ($2::time >= inicio OR inicio = '00:00:00') AND
    ($2::time <= fim OR fim = '00:00:00')
ORDER BY ordem NULLS LAST, nome;

-- name: UpdateCategoria :one
UPDATE categorias
SET
    id_culinaria = $3,
    nome = $4,
    descricao = $5,
    inicio = $6,
    fim = $7,
    ativo = $8,
    opcao_meia = $9,
    ordem = $10,
    disponivel_domingo = $11,
    disponivel_segunda = $12,
    disponivel_terca = $13,
    disponivel_quarta = $14,
    disponivel_quinta = $15,
    disponivel_sexta = $16,
    disponivel_sabado = $17,
    updated_at = now()
WHERE id = $1 AND id_tenant = $2 AND deleted_at IS NULL
    RETURNING id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
  ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
  disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at;

-- name: SoftDeleteCategoria :exec
UPDATE categorias
SET deleted_at = now()
WHERE id = $1 AND id_tenant = $2 AND deleted_at IS NULL;

-- name: HardDeleteCategoria :exec
DELETE FROM categorias
WHERE id = $1 AND id_tenant = $2;

-- name: CountCategoriasByCulinaria :one
SELECT COUNT(*)
FROM categorias
WHERE id_culinaria = $1 AND id_tenant = $2 AND deleted_at IS NULL;

-- name: GetCategoriaByNome :one
SELECT
    id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
    ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
    disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at
FROM categorias
WHERE nome = $1 AND id_tenant = $2 AND deleted_at IS NULL;

-- name: UpdateCategoriaStatus :one
UPDATE categorias
SET
    ativo = $3,
    updated_at = now()
WHERE id = $1 AND id_tenant = $2 AND deleted_at IS NULL
    RETURNING id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
  ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
  disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at;

-- name: UpdateCategoriaOrdem :one
UPDATE categorias
SET
    ordem = $3,
    updated_at = now()
WHERE id = $1 AND id_tenant = $2 AND deleted_at IS NULL
    RETURNING id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
  ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
  disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at;

-- name: RestoreCategoria :one
UPDATE categorias
SET deleted_at = NULL
WHERE id = $1 AND id_tenant = $2
    RETURNING id, seq_id, id_tenant, id_culinaria, nome, descricao, inicio, fim, ativo, opcao_meia,
  ordem, disponivel_domingo, disponivel_segunda, disponivel_terca, disponivel_quarta,
  disponivel_quinta, disponivel_sexta, disponivel_sabado, created_at, updated_at;