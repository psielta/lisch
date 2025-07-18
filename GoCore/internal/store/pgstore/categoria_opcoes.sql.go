// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.29.0
// source: categoria_opcoes.sql

package pgstore

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const bulkCreateCategoriaOpcoes = `-- name: BulkCreateCategoriaOpcoes :many
INSERT INTO categoria_opcoes (
    id_categoria,
    nome,
    status
)
SELECT
    unnest($1::uuid[]),
    unnest($2::varchar[]),
    unnest($3::smallint[])
        RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at
`

type BulkCreateCategoriaOpcoesParams struct {
	Column1 []uuid.UUID `json:"column_1"`
	Column2 []string    `json:"column_2"`
	Column3 []int16     `json:"column_3"`
}

type BulkCreateCategoriaOpcoesRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) BulkCreateCategoriaOpcoes(ctx context.Context, arg BulkCreateCategoriaOpcoesParams) ([]BulkCreateCategoriaOpcoesRow, error) {
	rows, err := q.db.Query(ctx, bulkCreateCategoriaOpcoes, arg.Column1, arg.Column2, arg.Column3)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []BulkCreateCategoriaOpcoesRow
	for rows.Next() {
		var i BulkCreateCategoriaOpcoesRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDCategoria,
			&i.Nome,
			&i.Status,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const countCategoriaOpcoesByCategoria = `-- name: CountCategoriaOpcoesByCategoria :one
SELECT COUNT(*)
FROM categoria_opcoes
WHERE id_categoria = $1 AND deleted_at IS NULL
`

func (q *Queries) CountCategoriaOpcoesByCategoria(ctx context.Context, idCategoria uuid.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countCategoriaOpcoesByCategoria, idCategoria)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const createCategoriaOpcao = `-- name: CreateCategoriaOpcao :one


INSERT INTO categoria_opcoes (
    id_categoria,
    nome,
    status
) VALUES (
             $1, $2, $3
         )
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at
`

type CreateCategoriaOpcaoParams struct {
	IDCategoria uuid.UUID `json:"id_categoria"`
	Nome        string    `json:"nome"`
	Status      int16     `json:"status"`
}

type CreateCategoriaOpcaoRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

// SQLC Queries para Categoria Opcoes
// ***********************
// CATEGORIA_OPCOES
// ***********************
func (q *Queries) CreateCategoriaOpcao(ctx context.Context, arg CreateCategoriaOpcaoParams) (CreateCategoriaOpcaoRow, error) {
	row := q.db.QueryRow(ctx, createCategoriaOpcao, arg.IDCategoria, arg.Nome, arg.Status)
	var i CreateCategoriaOpcaoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.Nome,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteCategoriaOpcoesByCategoria = `-- name: DeleteCategoriaOpcoesByCategoria :exec
UPDATE categoria_opcoes
SET deleted_at = now()
WHERE id_categoria = $1 AND deleted_at IS NULL
`

func (q *Queries) DeleteCategoriaOpcoesByCategoria(ctx context.Context, idCategoria uuid.UUID) error {
	_, err := q.db.Exec(ctx, deleteCategoriaOpcoesByCategoria, idCategoria)
	return err
}

const getCategoriaOpcao = `-- name: GetCategoriaOpcao :one
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE id = $1 AND deleted_at IS NULL
`

type GetCategoriaOpcaoRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) GetCategoriaOpcao(ctx context.Context, id uuid.UUID) (GetCategoriaOpcaoRow, error) {
	row := q.db.QueryRow(ctx, getCategoriaOpcao, id)
	var i GetCategoriaOpcaoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.Nome,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getCategoriaOpcaoByNome = `-- name: GetCategoriaOpcaoByNome :one
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE nome = $1 AND id_categoria = $2 AND deleted_at IS NULL
`

type GetCategoriaOpcaoByNomeParams struct {
	Nome        string    `json:"nome"`
	IDCategoria uuid.UUID `json:"id_categoria"`
}

type GetCategoriaOpcaoByNomeRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) GetCategoriaOpcaoByNome(ctx context.Context, arg GetCategoriaOpcaoByNomeParams) (GetCategoriaOpcaoByNomeRow, error) {
	row := q.db.QueryRow(ctx, getCategoriaOpcaoByNome, arg.Nome, arg.IDCategoria)
	var i GetCategoriaOpcaoByNomeRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.Nome,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getCategoriaOpcaoBySeqID = `-- name: GetCategoriaOpcaoBySeqID :one
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE seq_id = $1 AND deleted_at IS NULL
`

type GetCategoriaOpcaoBySeqIDRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) GetCategoriaOpcaoBySeqID(ctx context.Context, seqID pgtype.Int8) (GetCategoriaOpcaoBySeqIDRow, error) {
	row := q.db.QueryRow(ctx, getCategoriaOpcaoBySeqID, seqID)
	var i GetCategoriaOpcaoBySeqIDRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.Nome,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const hardDeleteCategoriaOpcao = `-- name: HardDeleteCategoriaOpcao :exec
DELETE FROM categoria_opcoes
WHERE id = $1
`

func (q *Queries) HardDeleteCategoriaOpcao(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, hardDeleteCategoriaOpcao, id)
	return err
}

const listCategoriaOpcoes = `-- name: ListCategoriaOpcoes :many
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE deleted_at IS NULL
ORDER BY nome
    LIMIT $1 OFFSET $2
`

type ListCategoriaOpcoesParams struct {
	Limit  int32 `json:"limit"`
	Offset int32 `json:"offset"`
}

type ListCategoriaOpcoesRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) ListCategoriaOpcoes(ctx context.Context, arg ListCategoriaOpcoesParams) ([]ListCategoriaOpcoesRow, error) {
	rows, err := q.db.Query(ctx, listCategoriaOpcoes, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListCategoriaOpcoesRow
	for rows.Next() {
		var i ListCategoriaOpcoesRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDCategoria,
			&i.Nome,
			&i.Status,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listCategoriaOpcoesAtivas = `-- name: ListCategoriaOpcoesAtivas :many
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE id_categoria = $1 AND status = 1 AND deleted_at IS NULL
ORDER BY nome
`

type ListCategoriaOpcoesAtivasRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) ListCategoriaOpcoesAtivas(ctx context.Context, idCategoria uuid.UUID) ([]ListCategoriaOpcoesAtivasRow, error) {
	rows, err := q.db.Query(ctx, listCategoriaOpcoesAtivas, idCategoria)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListCategoriaOpcoesAtivasRow
	for rows.Next() {
		var i ListCategoriaOpcoesAtivasRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDCategoria,
			&i.Nome,
			&i.Status,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listCategoriaOpcoesByCategoria = `-- name: ListCategoriaOpcoesByCategoria :many
SELECT
    id, seq_id, id_categoria, nome, status, created_at, updated_at
FROM categoria_opcoes
WHERE id_categoria = $1 AND deleted_at IS NULL
ORDER BY nome
    LIMIT $2 OFFSET $3
`

type ListCategoriaOpcoesByCategoriaParams struct {
	IDCategoria uuid.UUID `json:"id_categoria"`
	Limit       int32     `json:"limit"`
	Offset      int32     `json:"offset"`
}

type ListCategoriaOpcoesByCategoriaRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) ListCategoriaOpcoesByCategoria(ctx context.Context, arg ListCategoriaOpcoesByCategoriaParams) ([]ListCategoriaOpcoesByCategoriaRow, error) {
	rows, err := q.db.Query(ctx, listCategoriaOpcoesByCategoria, arg.IDCategoria, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListCategoriaOpcoesByCategoriaRow
	for rows.Next() {
		var i ListCategoriaOpcoesByCategoriaRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDCategoria,
			&i.Nome,
			&i.Status,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const restoreCategoriaOpcao = `-- name: RestoreCategoriaOpcao :one
UPDATE categoria_opcoes
SET deleted_at = NULL
WHERE id = $1
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at
`

type RestoreCategoriaOpcaoRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) RestoreCategoriaOpcao(ctx context.Context, id uuid.UUID) (RestoreCategoriaOpcaoRow, error) {
	row := q.db.QueryRow(ctx, restoreCategoriaOpcao, id)
	var i RestoreCategoriaOpcaoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.Nome,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const softDeleteCategoriaOpcao = `-- name: SoftDeleteCategoriaOpcao :exec
UPDATE categoria_opcoes
SET deleted_at = now()
WHERE id = $1 AND deleted_at IS NULL
`

func (q *Queries) SoftDeleteCategoriaOpcao(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, softDeleteCategoriaOpcao, id)
	return err
}

const updateCategoriaOpcao = `-- name: UpdateCategoriaOpcao :one
UPDATE categoria_opcoes
SET
    nome = $2,
    status = $3,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at
`

type UpdateCategoriaOpcaoParams struct {
	ID     uuid.UUID `json:"id"`
	Nome   string    `json:"nome"`
	Status int16     `json:"status"`
}

type UpdateCategoriaOpcaoRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) UpdateCategoriaOpcao(ctx context.Context, arg UpdateCategoriaOpcaoParams) (UpdateCategoriaOpcaoRow, error) {
	row := q.db.QueryRow(ctx, updateCategoriaOpcao, arg.ID, arg.Nome, arg.Status)
	var i UpdateCategoriaOpcaoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.Nome,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateCategoriaOpcaoStatus = `-- name: UpdateCategoriaOpcaoStatus :one
UPDATE categoria_opcoes
SET
    status = $2,
    updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, seq_id, id_categoria, nome, status, created_at, updated_at
`

type UpdateCategoriaOpcaoStatusParams struct {
	ID     uuid.UUID `json:"id"`
	Status int16     `json:"status"`
}

type UpdateCategoriaOpcaoStatusRow struct {
	ID          uuid.UUID          `json:"id"`
	SeqID       pgtype.Int8        `json:"seq_id"`
	IDCategoria uuid.UUID          `json:"id_categoria"`
	Nome        string             `json:"nome"`
	Status      int16              `json:"status"`
	CreatedAt   pgtype.Timestamptz `json:"created_at"`
	UpdatedAt   pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) UpdateCategoriaOpcaoStatus(ctx context.Context, arg UpdateCategoriaOpcaoStatusParams) (UpdateCategoriaOpcaoStatusRow, error) {
	row := q.db.QueryRow(ctx, updateCategoriaOpcaoStatus, arg.ID, arg.Status)
	var i UpdateCategoriaOpcaoStatusRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.Nome,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
