package services

import (
	"context"
	"gobid/internal/dto"
	"gobid/internal/store/pgstore"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DashboardService struct {
	pool    *pgxpool.Pool
	queries *pgstore.Queries
}

func NewDashboardService(pool *pgxpool.Pool) DashboardService {
	return DashboardService{
		pool:    pool,
		queries: pgstore.New(pool),
	}
}

func (ds *DashboardService) GetTotalBrutoAndTotalPago(ctx context.Context, tenantID uuid.UUID) ([]dto.DashboardTotalRow, error) {
	rows, err := ds.queries.GetTotalBrutoAndTotalPago(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.TotalRowsToDTO(rows), nil
}

func (ds *DashboardService) GetTotalBrutoAndTotalPagoDetailed(ctx context.Context, tenantID uuid.UUID) ([]dto.DashboardDetailedRow, error) {
	rows, err := ds.queries.GetTotalBrutoAndTotalPagoDetailed(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.DetailedRowsToDTO(rows), nil
}
