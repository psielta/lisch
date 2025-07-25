// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.29.0
// source: caixa.sql

package pgstore

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const fecharCaixa = `-- name: FecharCaixa :exec
UPDATE caixas
SET status = 'F',
    data_fechamento = now(),
    observacao_fechamento = $2
WHERE id = $1
`

type FecharCaixaParams struct {
	ID                   uuid.UUID   `json:"id"`
	ObservacaoFechamento pgtype.Text `json:"observacao_fechamento"`
}

func (q *Queries) FecharCaixa(ctx context.Context, arg FecharCaixaParams) error {
	_, err := q.db.Exec(ctx, fecharCaixa, arg.ID, arg.ObservacaoFechamento)
	return err
}

const getCaixaAbertosPorTenant = `-- name: GetCaixaAbertosPorTenant :many
SELECT id, seq_id, tenant_id, id_operador, data_abertura, data_fechamento, valor_abertura, observacao_abertura, observacao_fechamento, status, created_at, updated_at, deleted_at FROM caixas WHERE tenant_id = $1 AND status = 'A' AND deleted_at IS NULL
`

func (q *Queries) GetCaixaAbertosPorTenant(ctx context.Context, tenantID uuid.UUID) ([]Caixa, error) {
	rows, err := q.db.Query(ctx, getCaixaAbertosPorTenant, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Caixa
	for rows.Next() {
		var i Caixa
		if err := rows.Scan(
			&i.ID,
			&i.SeqID,
			&i.TenantID,
			&i.IDOperador,
			&i.DataAbertura,
			&i.DataFechamento,
			&i.ValorAbertura,
			&i.ObservacaoAbertura,
			&i.ObservacaoFechamento,
			&i.Status,
			&i.CreatedAt,
			&i.UpdatedAt,
			&i.DeletedAt,
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

const inserirValoresInformados = `-- name: InserirValoresInformados :exec
INSERT INTO caixa_fechamento_formas (id_caixa, id_forma_pagamento, valor_informado)
VALUES
  ($1, $2, $3)
`

type InserirValoresInformadosParams struct {
	IDCaixa          uuid.UUID      `json:"id_caixa"`
	IDFormaPagamento int16          `json:"id_forma_pagamento"`
	ValorInformado   pgtype.Numeric `json:"valor_informado"`
}

func (q *Queries) InserirValoresInformados(ctx context.Context, arg InserirValoresInformadosParams) error {
	_, err := q.db.Exec(ctx, inserirValoresInformados, arg.IDCaixa, arg.IDFormaPagamento, arg.ValorInformado)
	return err
}

const insertCaixa = `-- name: InsertCaixa :one
INSERT INTO caixas (tenant_id, id_operador, valor_abertura, observacao_abertura, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, seq_id, tenant_id, id_operador, data_abertura, data_fechamento, valor_abertura, observacao_abertura, observacao_fechamento, status, created_at, updated_at, deleted_at
`

type InsertCaixaParams struct {
	TenantID           uuid.UUID      `json:"tenant_id"`
	IDOperador         uuid.UUID      `json:"id_operador"`
	ValorAbertura      pgtype.Numeric `json:"valor_abertura"`
	ObservacaoAbertura pgtype.Text    `json:"observacao_abertura"`
	Status             StatusCaixa    `json:"status"`
}

func (q *Queries) InsertCaixa(ctx context.Context, arg InsertCaixaParams) (Caixa, error) {
	row := q.db.QueryRow(ctx, insertCaixa,
		arg.TenantID,
		arg.IDOperador,
		arg.ValorAbertura,
		arg.ObservacaoAbertura,
		arg.Status,
	)
	var i Caixa
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.TenantID,
		&i.IDOperador,
		&i.DataAbertura,
		&i.DataFechamento,
		&i.ValorAbertura,
		&i.ObservacaoAbertura,
		&i.ObservacaoFechamento,
		&i.Status,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const removeSangriaCaixa = `-- name: RemoveSangriaCaixa :exec
UPDATE caixa_movimentacoes
    set deleted_at = now()
    where id = $1
`

func (q *Queries) RemoveSangriaCaixa(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, removeSangriaCaixa, id)
	return err
}

const removeSuprimentoCaixa = `-- name: RemoveSuprimentoCaixa :exec
UPDATE caixa_movimentacoes
    set deleted_at = now()
    where id = $1
`

func (q *Queries) RemoveSuprimentoCaixa(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, removeSuprimentoCaixa, id)
	return err
}

const resumoCaixaAberto = `-- name: ResumoCaixaAberto :many
SELECT calcular_valores_esperados_caixa
FROM calcular_valores_esperados_caixa($1)
`

func (q *Queries) ResumoCaixaAberto(ctx context.Context, pCaixaID uuid.UUID) ([]interface{}, error) {
	rows, err := q.db.Query(ctx, resumoCaixaAberto, pCaixaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []interface{}
	for rows.Next() {
		var calcular_valores_esperados_caixa interface{}
		if err := rows.Scan(&calcular_valores_esperados_caixa); err != nil {
			return nil, err
		}
		items = append(items, calcular_valores_esperados_caixa)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const sangriaCaixa = `-- name: SangriaCaixa :one
INSERT INTO caixa_movimentacoes
(id_caixa, tipo, valor, observacao, autorizado_por)
VALUES
($1, 'S', $2, $3, $4)
RETURNING id, seq_id, id_caixa, tipo, id_forma_pagamento, valor, observacao, id_pagamento, autorizado_por, created_at, updated_at, deleted_at
`

type SangriaCaixaParams struct {
	IDCaixa       uuid.UUID      `json:"id_caixa"`
	Valor         pgtype.Numeric `json:"valor"`
	Observacao    pgtype.Text    `json:"observacao"`
	AutorizadoPor pgtype.UUID    `json:"autorizado_por"`
}

func (q *Queries) SangriaCaixa(ctx context.Context, arg SangriaCaixaParams) (CaixaMovimentaco, error) {
	row := q.db.QueryRow(ctx, sangriaCaixa,
		arg.IDCaixa,
		arg.Valor,
		arg.Observacao,
		arg.AutorizadoPor,
	)
	var i CaixaMovimentaco
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCaixa,
		&i.Tipo,
		&i.IDFormaPagamento,
		&i.Valor,
		&i.Observacao,
		&i.IDPagamento,
		&i.AutorizadoPor,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}

const suprimentoCaixa = `-- name: SuprimentoCaixa :one
INSERT INTO caixa_movimentacoes
(id_caixa, tipo, valor, observacao, autorizado_por)
VALUES
($1, 'U', $2, $3, $4)
RETURNING id, seq_id, id_caixa, tipo, id_forma_pagamento, valor, observacao, id_pagamento, autorizado_por, created_at, updated_at, deleted_at
`

type SuprimentoCaixaParams struct {
	IDCaixa       uuid.UUID      `json:"id_caixa"`
	Valor         pgtype.Numeric `json:"valor"`
	Observacao    pgtype.Text    `json:"observacao"`
	AutorizadoPor pgtype.UUID    `json:"autorizado_por"`
}

func (q *Queries) SuprimentoCaixa(ctx context.Context, arg SuprimentoCaixaParams) (CaixaMovimentaco, error) {
	row := q.db.QueryRow(ctx, suprimentoCaixa,
		arg.IDCaixa,
		arg.Valor,
		arg.Observacao,
		arg.AutorizadoPor,
	)
	var i CaixaMovimentaco
	err := row.Scan(
		&i.ID,
		&i.SeqID,
		&i.IDCaixa,
		&i.Tipo,
		&i.IDFormaPagamento,
		&i.Valor,
		&i.Observacao,
		&i.IDPagamento,
		&i.AutorizadoPor,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.DeletedAt,
	)
	return i, err
}
