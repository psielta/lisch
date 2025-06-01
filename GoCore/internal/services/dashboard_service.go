package services

import (
	"context"
	"gobid/internal/dto"
	"gobid/internal/store/pgstore"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DashboardService centraliza as consultas usadas no painel
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

// -----------------------------------------------------------------------------
// Vendas (pedidos) – cards e modal
// -----------------------------------------------------------------------------

// GetTotalBrutoAndTotalPago devolve o agregado diário (card)
func (ds *DashboardService) GetTotalBrutoAndTotalPago(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardTotalRow, error) {

	rows, err := ds.queries.GetTotalBrutoAndTotalPago(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.TotalRowsToDTO(rows), nil
}

// GetTotalBrutoAndTotalPagoDetailed devolve cada pedido individual (modal)
func (ds *DashboardService) GetTotalBrutoAndTotalPagoDetailed(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardDetailedRow, error) {

	rows, err := ds.queries.GetTotalBrutoAndTotalPagoDetailed(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.DetailedRowsToDTO(rows), nil
}

// -----------------------------------------------------------------------------
// Pagamentos – gráfico de barras e modal
// -----------------------------------------------------------------------------

// GetPagamentosResumoUlt3Meses devolve o agregado (gráfico de barras)
func (ds *DashboardService) GetPagamentosResumoUlt3Meses(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardPaymentResumoRow, error) {

	rows, err := ds.queries.GetPagamentosPorDiaECategoria(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.PaymentResumoRowsToDTO(rows), nil
}

// GetPagamentosDetalhadosUlt3Meses devolve cada pagamento individual (modal)
func (ds *DashboardService) GetPagamentosDetalhadosUlt3Meses(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardPaymentDetalhadoRow, error) {

	rows, err := ds.queries.GetPagamentosDetalhadosUlt3Meses(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.PaymentDetalhadoRowsToDTO(rows), nil
}
