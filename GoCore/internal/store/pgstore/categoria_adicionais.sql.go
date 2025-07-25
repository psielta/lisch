// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.29.0
// source: categoria_adicionais.sql

package pgstore

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const countCategoriaAdicionaisByCategoria = `-- name: CountCategoriaAdicionaisByCategoria :one
SELECT COUNT(*)
FROM categoria_adicionais
WHERE id_categoria = $1
  AND deleted_at IS NULL
`

func (q *Queries) CountCategoriaAdicionaisByCategoria(ctx context.Context, idCategoria uuid.UUID) (int64, error) {
	row := q.db.QueryRow(ctx, countCategoriaAdicionaisByCategoria, idCategoria)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const createCategoriaAdicional = `-- name: CreateCategoriaAdicional :one

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
          minimo, limite, status, created_at, updated_at
`

type CreateCategoriaAdicionalParams struct {
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
}

type CreateCategoriaAdicionalRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// ***********************
// CATEGORIA_ADICIONAIS
// ***********************
func (q *Queries) CreateCategoriaAdicional(ctx context.Context, arg CreateCategoriaAdicionalParams) (CreateCategoriaAdicionalRow, error) {
	row := q.db.QueryRow(ctx, createCategoriaAdicional,
		arg.IDCategoria,
		arg.CodigoTipo,
		arg.Nome,
		arg.Selecao,
		arg.Minimo,
		arg.Limite,
		arg.Status,
	)
	var i CreateCategoriaAdicionalRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.CodigoTipo,
		&i.Nome,
		&i.Selecao,
		&i.Minimo,
		&i.Limite,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getCategoriaAdicional = `-- name: GetCategoriaAdicional :one
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at,
    c.id_tenant
FROM categoria_adicionais ca
JOIN categorias c ON ca.id_categoria = c.id
WHERE ca.id = $1
  AND ca.deleted_at IS NULL
`

type GetCategoriaAdicionalRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
	IDTenant    uuid.UUID   `json:"id_tenant"`
}

func (q *Queries) GetCategoriaAdicional(ctx context.Context, id uuid.UUID) (GetCategoriaAdicionalRow, error) {
	row := q.db.QueryRow(ctx, getCategoriaAdicional, id)
	var i GetCategoriaAdicionalRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.CodigoTipo,
		&i.Nome,
		&i.Selecao,
		&i.Minimo,
		&i.Limite,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.IDTenant,
	)
	return i, err
}

const getCategoriaAdicionalByCodigoTipoAndTenant = `-- name: GetCategoriaAdicionalByCodigoTipoAndTenant :one
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at,
    c.id_tenant
FROM categoria_adicionais ca
JOIN categorias c ON ca.id_categoria = c.id
WHERE ca.codigo_tipo = $1
  AND c.id_tenant   = $2
  AND ca.deleted_at IS NULL
`

type GetCategoriaAdicionalByCodigoTipoAndTenantParams struct {
	CodigoTipo pgtype.Text `json:"codigo_tipo"`
	IDTenant   uuid.UUID   `json:"id_tenant"`
}

type GetCategoriaAdicionalByCodigoTipoAndTenantRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
	IDTenant    uuid.UUID   `json:"id_tenant"`
}

func (q *Queries) GetCategoriaAdicionalByCodigoTipoAndTenant(ctx context.Context, arg GetCategoriaAdicionalByCodigoTipoAndTenantParams) (GetCategoriaAdicionalByCodigoTipoAndTenantRow, error) {
	row := q.db.QueryRow(ctx, getCategoriaAdicionalByCodigoTipoAndTenant, arg.CodigoTipo, arg.IDTenant)
	var i GetCategoriaAdicionalByCodigoTipoAndTenantRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.CodigoTipo,
		&i.Nome,
		&i.Selecao,
		&i.Minimo,
		&i.Limite,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.IDTenant,
	)
	return i, err
}

const getCategoriaAdicionalBySeqID = `-- name: GetCategoriaAdicionalBySeqID :one
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at,
    c.id_tenant
FROM categoria_adicionais ca
JOIN categorias c ON ca.id_categoria = c.id
WHERE ca.seq_id = $1
  AND ca.deleted_at IS NULL
`

type GetCategoriaAdicionalBySeqIDRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
	IDTenant    uuid.UUID   `json:"id_tenant"`
}

func (q *Queries) GetCategoriaAdicionalBySeqID(ctx context.Context, seqID int64) (GetCategoriaAdicionalBySeqIDRow, error) {
	row := q.db.QueryRow(ctx, getCategoriaAdicionalBySeqID, seqID)
	var i GetCategoriaAdicionalBySeqIDRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.CodigoTipo,
		&i.Nome,
		&i.Selecao,
		&i.Minimo,
		&i.Limite,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.IDTenant,
	)
	return i, err
}

const hardDeleteCategoriaAdicional = `-- name: HardDeleteCategoriaAdicional :exec
DELETE FROM categoria_adicionais ca
USING categorias c
WHERE ca.id_categoria = c.id
  AND ca.id        = $1
  AND c.id_tenant  = $2
`

type HardDeleteCategoriaAdicionalParams struct {
	ID       uuid.UUID `json:"id"`
	IDTenant uuid.UUID `json:"id_tenant"`
}

func (q *Queries) HardDeleteCategoriaAdicional(ctx context.Context, arg HardDeleteCategoriaAdicionalParams) error {
	_, err := q.db.Exec(ctx, hardDeleteCategoriaAdicional, arg.ID, arg.IDTenant)
	return err
}

const listCategoriaAdicionaisByCategoria = `-- name: ListCategoriaAdicionaisByCategoria :many
SELECT
    ca.id, ca.seq_id, ca.id_categoria, ca.codigo_tipo, ca.nome,
    ca.selecao, ca.minimo, ca.limite, ca.status,
    ca.created_at, ca.updated_at
FROM categoria_adicionais ca
WHERE ca.id_categoria = $1
  AND ca.deleted_at IS NULL
ORDER BY ca.nome
LIMIT  $2 OFFSET $3
`

type ListCategoriaAdicionaisByCategoriaParams struct {
	IDCategoria uuid.UUID `json:"id_categoria"`
	Limit       int32     `json:"limit"`
	Offset      int32     `json:"offset"`
}

type ListCategoriaAdicionaisByCategoriaRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

func (q *Queries) ListCategoriaAdicionaisByCategoria(ctx context.Context, arg ListCategoriaAdicionaisByCategoriaParams) ([]ListCategoriaAdicionaisByCategoriaRow, error) {
	rows, err := q.db.Query(ctx, listCategoriaAdicionaisByCategoria, arg.IDCategoria, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListCategoriaAdicionaisByCategoriaRow
	for rows.Next() {
		var i ListCategoriaAdicionaisByCategoriaRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDCategoria,
			&i.CodigoTipo,
			&i.Nome,
			&i.Selecao,
			&i.Minimo,
			&i.Limite,
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

const listCategoriaAdicionaisByTenant = `-- name: ListCategoriaAdicionaisByTenant :many
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
LIMIT  $2 OFFSET $3
`

type ListCategoriaAdicionaisByTenantParams struct {
	IDTenant uuid.UUID `json:"id_tenant"`
	Limit    int32     `json:"limit"`
	Offset   int32     `json:"offset"`
}

type ListCategoriaAdicionaisByTenantRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
	IDTenant    uuid.UUID   `json:"id_tenant"`
}

func (q *Queries) ListCategoriaAdicionaisByTenant(ctx context.Context, arg ListCategoriaAdicionaisByTenantParams) ([]ListCategoriaAdicionaisByTenantRow, error) {
	rows, err := q.db.Query(ctx, listCategoriaAdicionaisByTenant, arg.IDTenant, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListCategoriaAdicionaisByTenantRow
	for rows.Next() {
		var i ListCategoriaAdicionaisByTenantRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDCategoria,
			&i.CodigoTipo,
			&i.Nome,
			&i.Selecao,
			&i.Minimo,
			&i.Limite,
			&i.Status,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.IDTenant,
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

const restoreCategoriaAdicional = `-- name: RestoreCategoriaAdicional :one
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
          ca.created_at, ca.updated_at
`

type RestoreCategoriaAdicionalParams struct {
	ID       uuid.UUID `json:"id"`
	IDTenant uuid.UUID `json:"id_tenant"`
}

type RestoreCategoriaAdicionalRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

func (q *Queries) RestoreCategoriaAdicional(ctx context.Context, arg RestoreCategoriaAdicionalParams) (RestoreCategoriaAdicionalRow, error) {
	row := q.db.QueryRow(ctx, restoreCategoriaAdicional, arg.ID, arg.IDTenant)
	var i RestoreCategoriaAdicionalRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.CodigoTipo,
		&i.Nome,
		&i.Selecao,
		&i.Minimo,
		&i.Limite,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const softDeleteCategoriaAdicional = `-- name: SoftDeleteCategoriaAdicional :exec
UPDATE categoria_adicionais ca
SET deleted_at = now()
FROM categorias c
WHERE ca.id_categoria = c.id
  AND ca.id        = $1
  AND c.id_tenant  = $2
  AND ca.deleted_at IS NULL
`

type SoftDeleteCategoriaAdicionalParams struct {
	ID       uuid.UUID `json:"id"`
	IDTenant uuid.UUID `json:"id_tenant"`
}

func (q *Queries) SoftDeleteCategoriaAdicional(ctx context.Context, arg SoftDeleteCategoriaAdicionalParams) error {
	_, err := q.db.Exec(ctx, softDeleteCategoriaAdicional, arg.ID, arg.IDTenant)
	return err
}

const updateCategoriaAdicional = `-- name: UpdateCategoriaAdicional :one
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
          ca.created_at, ca.updated_at
`

type UpdateCategoriaAdicionalParams struct {
	ID          uuid.UUID   `json:"id"`
	IDTenant    uuid.UUID   `json:"id_tenant"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
}

type UpdateCategoriaAdicionalRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

func (q *Queries) UpdateCategoriaAdicional(ctx context.Context, arg UpdateCategoriaAdicionalParams) (UpdateCategoriaAdicionalRow, error) {
	row := q.db.QueryRow(ctx, updateCategoriaAdicional,
		arg.ID,
		arg.IDTenant,
		arg.IDCategoria,
		arg.CodigoTipo,
		arg.Nome,
		arg.Selecao,
		arg.Minimo,
		arg.Limite,
		arg.Status,
	)
	var i UpdateCategoriaAdicionalRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.CodigoTipo,
		&i.Nome,
		&i.Selecao,
		&i.Minimo,
		&i.Limite,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateCategoriaAdicionalStatus = `-- name: UpdateCategoriaAdicionalStatus :one
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
          ca.created_at, ca.updated_at
`

type UpdateCategoriaAdicionalStatusParams struct {
	ID       uuid.UUID `json:"id"`
	IDTenant uuid.UUID `json:"id_tenant"`
	Status   int16     `json:"status"`
}

type UpdateCategoriaAdicionalStatusRow struct {
	ID          uuid.UUID   `json:"id"`
	SeqID       int64       `json:"seq_id"`
	IDCategoria uuid.UUID   `json:"id_categoria"`
	CodigoTipo  pgtype.Text `json:"codigo_tipo"`
	Nome        string      `json:"nome"`
	Selecao     string      `json:"selecao"`
	Minimo      pgtype.Int4 `json:"minimo"`
	Limite      pgtype.Int4 `json:"limite"`
	Status      int16       `json:"status"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

func (q *Queries) UpdateCategoriaAdicionalStatus(ctx context.Context, arg UpdateCategoriaAdicionalStatusParams) (UpdateCategoriaAdicionalStatusRow, error) {
	row := q.db.QueryRow(ctx, updateCategoriaAdicionalStatus, arg.ID, arg.IDTenant, arg.Status)
	var i UpdateCategoriaAdicionalStatusRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCategoria,
		&i.CodigoTipo,
		&i.Nome,
		&i.Selecao,
		&i.Minimo,
		&i.Limite,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
