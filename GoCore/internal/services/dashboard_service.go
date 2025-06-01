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

// -----------------------------------------------------------------------------
// Clientes mais faturados – últimos 30 dias
// -----------------------------------------------------------------------------

// GetClientesMaisFaturados30Dias retorna os 100 clientes que mais faturaram nos últimos 30 dias
func (ds *DashboardService) GetClientesMaisFaturados30Dias(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardClienteMaisFaturadoRow, error) {

	rows, err := ds.queries.GetClientesMaisFaturados30Dias(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.ClienteMaisFaturadoRowsToDTO(rows), nil
}

// -----------------------------------------------------------------------------
// Aniversariantes da semana
// -----------------------------------------------------------------------------

// GetAniversariantes retorna os clientes que fazem aniversário em +/- 7 dias
func (ds *DashboardService) GetAniversariantes(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardAniversarianteRow, error) {

	rows, err := ds.queries.GetAniversariantes(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.AniversarianteRowsToDTO(rows), nil
}

// -----------------------------------------------------------------------------
// Produtos mais vendidos – últimos 30 dias
// -----------------------------------------------------------------------------

// GetTop100ProdutosMaisVendidos30Dias retorna os 100 produtos mais vendidos nos últimos 30 dias
func (ds *DashboardService) GetTop100ProdutosMaisVendidos30Dias(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardProdutoMaisVendidoRow, error) {

	rows, err := ds.queries.GetTop100ProdutosMaisVendidos30Dias(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.ProdutoMaisVendidoRowsToDTO(rows), nil
}

// -----------------------------------------------------------------------------
// Ticket médio – últimos 30 dias
// -----------------------------------------------------------------------------

// GetTicketMedio30Dias retorna o ticket médio dos últimos 30 dias
func (ds *DashboardService) GetTicketMedio30Dias(
	ctx context.Context, tenantID uuid.UUID,
) ([]dto.DashboardTicketMedioRow, error) {

	rows, err := ds.queries.GetTicketMedio30Dias(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.TicketMedioRowsToDTO(rows), nil
}
