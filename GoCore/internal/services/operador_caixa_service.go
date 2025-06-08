package services

import (
	"context"
	"gobid/internal/store/pgstore"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OperadorCaixaService struct {
	pool    *pgxpool.Pool
	queries *pgstore.Queries
}

func NewOperadorCaixaService(pool *pgxpool.Pool) OperadorCaixaService {
	return OperadorCaixaService{
		pool:    pool,
		queries: pgstore.New(pool),
	}
}

func (ocs *OperadorCaixaService) UpsertOperadorCaixaCompleto(ctx context.Context, operadorCaixa pgstore.UpsertOperadorCaixaCompletoParams) (pgstore.UpsertOperadorCaixaCompletoRow, error) {
	operadorCaixaDB, err := ocs.queries.UpsertOperadorCaixaCompleto(ctx, operadorCaixa)
	if err != nil {
		return pgstore.UpsertOperadorCaixaCompletoRow{}, err
	}
	return operadorCaixaDB, nil
}

func (ocs *OperadorCaixaService) GetOperadorCaixa(ctx context.Context, idUsuario uuid.UUID, tenantID uuid.UUID) (pgstore.GetOprRow, error) {
	operadorCaixaDB, err := ocs.queries.GetOpr(ctx, pgstore.GetOprParams{
		IDUsuario: idUsuario,
		TenantID:  tenantID,
	})
	if err != nil {
		return pgstore.GetOprRow{}, err
	}
	return operadorCaixaDB, nil
}
