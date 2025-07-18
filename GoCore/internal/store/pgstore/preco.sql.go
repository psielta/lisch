// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.29.0
// source: preco.sql

package pgstore

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const createProdutoPreco = `-- name: CreateProdutoPreco :one


INSERT INTO produto_precos (
    id_produto,
    id_categoria_opcao,
    codigo_externo_opcao_preco,
    preco_base,
    preco_promocional,
    disponivel
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING id, seq_id, id_produto, id_categoria_opcao, codigo_externo_opcao_preco, preco_base, preco_promocional, disponivel, created_at, updated_at
`

type CreateProdutoPrecoParams struct {
	IDProduto               uuid.UUID      `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID      `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text    `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric `json:"preco_promocional"`
	Disponivel              int16          `json:"disponivel"`
}

type CreateProdutoPrecoRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
}

// SQLC Queries para Preços de Produtos
// ***********************
// PRODUTO_PRECOS
// ***********************
func (q *Queries) CreateProdutoPreco(ctx context.Context, arg CreateProdutoPrecoParams) (CreateProdutoPrecoRow, error) {
	row := q.db.QueryRow(ctx, createProdutoPreco,
		arg.IDProduto,
		arg.IDCategoriaOpcao,
		arg.CodigoExternoOpcaoPreco,
		arg.PrecoBase,
		arg.PrecoPromocional,
		arg.Disponivel,
	)
	var i CreateProdutoPrecoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDProduto,
		&i.IDCategoriaOpcao,
		&i.CodigoExternoOpcaoPreco,
		&i.PrecoBase,
		&i.PrecoPromocional,
		&i.Disponivel,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getProdutoPreco = `-- name: GetProdutoPreco :one
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
FROM produto_precos pp
WHERE pp.id = $1 AND pp.deleted_at IS NULL
`

type GetProdutoPrecoRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) GetProdutoPreco(ctx context.Context, id uuid.UUID) (GetProdutoPrecoRow, error) {
	row := q.db.QueryRow(ctx, getProdutoPreco, id)
	var i GetProdutoPrecoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDProduto,
		&i.IDCategoriaOpcao,
		&i.CodigoExternoOpcaoPreco,
		&i.PrecoBase,
		&i.PrecoPromocional,
		&i.Disponivel,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getProdutoPrecoByCodigoExternoAndProduto = `-- name: GetProdutoPrecoByCodigoExternoAndProduto :one
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
FROM produto_precos pp
WHERE pp.codigo_externo_opcao_preco = $1 AND pp.id_produto = $2 AND pp.deleted_at IS NULL
`

type GetProdutoPrecoByCodigoExternoAndProdutoParams struct {
	CodigoExternoOpcaoPreco pgtype.Text `json:"codigo_externo_opcao_preco"`
	IDProduto               uuid.UUID   `json:"id_produto"`
}

type GetProdutoPrecoByCodigoExternoAndProdutoRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) GetProdutoPrecoByCodigoExternoAndProduto(ctx context.Context, arg GetProdutoPrecoByCodigoExternoAndProdutoParams) (GetProdutoPrecoByCodigoExternoAndProdutoRow, error) {
	row := q.db.QueryRow(ctx, getProdutoPrecoByCodigoExternoAndProduto, arg.CodigoExternoOpcaoPreco, arg.IDProduto)
	var i GetProdutoPrecoByCodigoExternoAndProdutoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDProduto,
		&i.IDCategoriaOpcao,
		&i.CodigoExternoOpcaoPreco,
		&i.PrecoBase,
		&i.PrecoPromocional,
		&i.Disponivel,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getProdutoPrecoBySeqID = `-- name: GetProdutoPrecoBySeqID :one
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
FROM produto_precos pp
WHERE pp.seq_id = $1 AND pp.deleted_at IS NULL
`

type GetProdutoPrecoBySeqIDRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) GetProdutoPrecoBySeqID(ctx context.Context, seqID pgtype.Int8) (GetProdutoPrecoBySeqIDRow, error) {
	row := q.db.QueryRow(ctx, getProdutoPrecoBySeqID, seqID)
	var i GetProdutoPrecoBySeqIDRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDProduto,
		&i.IDCategoriaOpcao,
		&i.CodigoExternoOpcaoPreco,
		&i.PrecoBase,
		&i.PrecoPromocional,
		&i.Disponivel,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const hardDeleteProdutoPreco = `-- name: HardDeleteProdutoPreco :exec
DELETE FROM produto_precos pp
USING produtos p, categorias c
WHERE pp.id_produto = p.id
  AND p.id_categoria = c.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2
`

type HardDeleteProdutoPrecoParams struct {
	ID       uuid.UUID `json:"id"`
	IDTenant uuid.UUID `json:"id_tenant"`
}

// Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
func (q *Queries) HardDeleteProdutoPreco(ctx context.Context, arg HardDeleteProdutoPrecoParams) error {
	_, err := q.db.Exec(ctx, hardDeleteProdutoPreco, arg.ID, arg.IDTenant)
	return err
}

const listProdutoPrecosAtivosByProduto = `-- name: ListProdutoPrecosAtivosByProduto :many
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at,
    co.nome as nome_opcao
FROM produto_precos pp
JOIN categoria_opcoes co ON pp.id_categoria_opcao = co.id
WHERE pp.id_produto = $1 AND pp.disponivel = 1 AND pp.deleted_at IS NULL AND co.deleted_at IS NULL AND co.status = 1
ORDER BY co.nome
`

type ListProdutoPrecosAtivosByProdutoRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
	NomeOpcao               string             `json:"nome_opcao"`
}

func (q *Queries) ListProdutoPrecosAtivosByProduto(ctx context.Context, idProduto uuid.UUID) ([]ListProdutoPrecosAtivosByProdutoRow, error) {
	rows, err := q.db.Query(ctx, listProdutoPrecosAtivosByProduto, idProduto)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListProdutoPrecosAtivosByProdutoRow
	for rows.Next() {
		var i ListProdutoPrecosAtivosByProdutoRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDProduto,
			&i.IDCategoriaOpcao,
			&i.CodigoExternoOpcaoPreco,
			&i.PrecoBase,
			&i.PrecoPromocional,
			&i.Disponivel,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.NomeOpcao,
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

const listProdutoPrecosByProduto = `-- name: ListProdutoPrecosByProduto :many
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at,
    co.nome as nome_opcao -- Incluindo nome da opção da categoria para referência
FROM produto_precos pp
JOIN categoria_opcoes co ON pp.id_categoria_opcao = co.id
WHERE pp.id_produto = $1 AND pp.deleted_at IS NULL AND co.deleted_at IS NULL
ORDER BY co.nome -- Ou alguma outra lógica de ordenação para as opções
LIMIT $2 OFFSET $3
`

type ListProdutoPrecosByProdutoParams struct {
	IDProduto uuid.UUID `json:"id_produto"`
	Limit     int32     `json:"limit"`
	Offset    int32     `json:"offset"`
}

type ListProdutoPrecosByProdutoRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
	NomeOpcao               string             `json:"nome_opcao"`
}

func (q *Queries) ListProdutoPrecosByProduto(ctx context.Context, arg ListProdutoPrecosByProdutoParams) ([]ListProdutoPrecosByProdutoRow, error) {
	rows, err := q.db.Query(ctx, listProdutoPrecosByProduto, arg.IDProduto, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListProdutoPrecosByProdutoRow
	for rows.Next() {
		var i ListProdutoPrecosByProdutoRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDProduto,
			&i.IDCategoriaOpcao,
			&i.CodigoExternoOpcaoPreco,
			&i.PrecoBase,
			&i.PrecoPromocional,
			&i.Disponivel,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.NomeOpcao,
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

const listProdutoPrecosByProdutoAndTenant = `-- name: ListProdutoPrecosByProdutoAndTenant :many
SELECT
    pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco,
    pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at,
    co.nome as nome_opcao,
    cat.id_tenant
FROM produto_precos pp
JOIN produtos p ON pp.id_produto = p.id
JOIN categorias cat ON p.id_categoria = cat.id
JOIN categoria_opcoes co ON pp.id_categoria_opcao = co.id
WHERE pp.id_produto = $1 AND cat.id_tenant = $2 AND pp.deleted_at IS NULL AND p.deleted_at IS NULL AND cat.deleted_at IS NULL AND co.deleted_at IS NULL
ORDER BY co.nome
LIMIT $3 OFFSET $4
`

type ListProdutoPrecosByProdutoAndTenantParams struct {
	IDProduto uuid.UUID `json:"id_produto"`
	IDTenant  uuid.UUID `json:"id_tenant"`
	Limit     int32     `json:"limit"`
	Offset    int32     `json:"offset"`
}

type ListProdutoPrecosByProdutoAndTenantRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
	NomeOpcao               string             `json:"nome_opcao"`
	IDTenant                uuid.UUID          `json:"id_tenant"`
}

func (q *Queries) ListProdutoPrecosByProdutoAndTenant(ctx context.Context, arg ListProdutoPrecosByProdutoAndTenantParams) ([]ListProdutoPrecosByProdutoAndTenantRow, error) {
	rows, err := q.db.Query(ctx, listProdutoPrecosByProdutoAndTenant,
		arg.IDProduto,
		arg.IDTenant,
		arg.Limit,
		arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ListProdutoPrecosByProdutoAndTenantRow
	for rows.Next() {
		var i ListProdutoPrecosByProdutoAndTenantRow
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.IDProduto,
			&i.IDCategoriaOpcao,
			&i.CodigoExternoOpcaoPreco,
			&i.PrecoBase,
			&i.PrecoPromocional,
			&i.Disponivel,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.NomeOpcao,
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

const restoreProdutoPreco = `-- name: RestoreProdutoPreco :one
UPDATE produto_precos pp
SET deleted_at = NULL,
    updated_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2 -- id_tenant
  AND pp.deleted_at IS NOT NULL
RETURNING pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco, pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
`

type RestoreProdutoPrecoParams struct {
	ID       uuid.UUID `json:"id"`
	IDTenant uuid.UUID `json:"id_tenant"`
}

type RestoreProdutoPrecoRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
}

// Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
func (q *Queries) RestoreProdutoPreco(ctx context.Context, arg RestoreProdutoPrecoParams) (RestoreProdutoPrecoRow, error) {
	row := q.db.QueryRow(ctx, restoreProdutoPreco, arg.ID, arg.IDTenant)
	var i RestoreProdutoPrecoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDProduto,
		&i.IDCategoriaOpcao,
		&i.CodigoExternoOpcaoPreco,
		&i.PrecoBase,
		&i.PrecoPromocional,
		&i.Disponivel,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const softDeleteProdutoPreco = `-- name: SoftDeleteProdutoPreco :exec
UPDATE produto_precos pp
SET deleted_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2 -- id_tenant
  AND pp.deleted_at IS NULL
`

type SoftDeleteProdutoPrecoParams struct {
	ID       uuid.UUID `json:"id"`
	IDTenant uuid.UUID `json:"id_tenant"`
}

// Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
func (q *Queries) SoftDeleteProdutoPreco(ctx context.Context, arg SoftDeleteProdutoPrecoParams) error {
	_, err := q.db.Exec(ctx, softDeleteProdutoPreco, arg.ID, arg.IDTenant)
	return err
}

const updateProdutoPreco = `-- name: UpdateProdutoPreco :one
UPDATE produto_precos pp
SET
    id_categoria_opcao = $4,
    codigo_externo_opcao_preco = $5,
    preco_base = $6,
    preco_promocional = $7,
    disponivel = $8,
    updated_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND p.id = $2 -- id_produto (para garantir que o preco é deste produto)
  AND c.id_tenant = $3 -- id_tenant
  AND pp.deleted_at IS NULL
RETURNING pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco, pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
`

type UpdateProdutoPrecoParams struct {
	ID                      uuid.UUID      `json:"id"`
	ID_2                    uuid.UUID      `json:"id_2"`
	IDTenant                uuid.UUID      `json:"id_tenant"`
	IDCategoriaOpcao        uuid.UUID      `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text    `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric `json:"preco_promocional"`
	Disponivel              int16          `json:"disponivel"`
}

type UpdateProdutoPrecoRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
}

// Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
func (q *Queries) UpdateProdutoPreco(ctx context.Context, arg UpdateProdutoPrecoParams) (UpdateProdutoPrecoRow, error) {
	row := q.db.QueryRow(ctx, updateProdutoPreco,
		arg.ID,
		arg.ID_2,
		arg.IDTenant,
		arg.IDCategoriaOpcao,
		arg.CodigoExternoOpcaoPreco,
		arg.PrecoBase,
		arg.PrecoPromocional,
		arg.Disponivel,
	)
	var i UpdateProdutoPrecoRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDProduto,
		&i.IDCategoriaOpcao,
		&i.CodigoExternoOpcaoPreco,
		&i.PrecoBase,
		&i.PrecoPromocional,
		&i.Disponivel,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateProdutoPrecoDisponibilidade = `-- name: UpdateProdutoPrecoDisponibilidade :one

UPDATE produto_precos pp
SET
    disponivel = $3, -- novo_status_disponibilidade
    updated_at = now()
FROM produtos p
JOIN categorias c ON p.id_categoria = c.id
WHERE pp.id_produto = p.id
  AND pp.id = $1 -- id do produto_precos
  AND c.id_tenant = $2 -- id_tenant
  AND pp.deleted_at IS NULL
RETURNING pp.id, pp.seq_id, pp.id_produto, pp.id_categoria_opcao, pp.codigo_externo_opcao_preco, pp.preco_base, pp.preco_promocional, pp.disponivel, pp.created_at, pp.updated_at
`

type UpdateProdutoPrecoDisponibilidadeParams struct {
	ID         uuid.UUID `json:"id"`
	IDTenant   uuid.UUID `json:"id_tenant"`
	Disponivel int16     `json:"disponivel"`
}

type UpdateProdutoPrecoDisponibilidadeRow struct {
	ID                      uuid.UUID          `json:"id"`
	SeqID                   pgtype.Int8        `json:"seq_id"`
	IDProduto               uuid.UUID          `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID          `json:"id_categoria_opcao"`
	CodigoExternoOpcaoPreco pgtype.Text        `json:"codigo_externo_opcao_preco"`
	PrecoBase               pgtype.Numeric     `json:"preco_base"`
	PrecoPromocional        pgtype.Numeric     `json:"preco_promocional"`
	Disponivel              int16              `json:"disponivel"`
	CreatedAt               pgtype.Timestamptz `json:"created_at"`
	UpdatedAt               pgtype.Timestamptz `json:"updated_at"`
}

// id_tenant
// Para garantir a segurança do tenant, o id_tenant é verificado através de joins.
func (q *Queries) UpdateProdutoPrecoDisponibilidade(ctx context.Context, arg UpdateProdutoPrecoDisponibilidadeParams) (UpdateProdutoPrecoDisponibilidadeRow, error) {
	row := q.db.QueryRow(ctx, updateProdutoPrecoDisponibilidade, arg.ID, arg.IDTenant, arg.Disponivel)
	var i UpdateProdutoPrecoDisponibilidadeRow
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDProduto,
		&i.IDCategoriaOpcao,
		&i.CodigoExternoOpcaoPreco,
		&i.PrecoBase,
		&i.PrecoPromocional,
		&i.Disponivel,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
