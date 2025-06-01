package dto

import (
	"gobid/internal/store/pgstore"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// Helper functions for type conversion
func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}

	f8, err := n.Float64Value()
	if err != nil || !f8.Valid {
		return 0
	}

	return f8.Float64
}

// DashboardTotalRow representa uma linha de totais do dashboard
type DashboardTotalRow struct {
	Dia        time.Time `json:"dia"`
	TotalBruto float64   `json:"total_bruto"`
	TotalPago  float64   `json:"total_pago"`
}

// DashboardDetailedRow representa uma linha detalhada do dashboard
type DashboardDetailedRow struct {
	ID                 string    `json:"id"`
	SeqID              int64     `json:"seq_id"`
	TenantID           string    `json:"tenant_id"`
	IDCliente          string    `json:"id_cliente"`
	CodigoPedido       string    `json:"codigo_pedido"`
	DataPedido         time.Time `json:"data_pedido"`
	Gmt                int16     `json:"gmt"`
	PedidoPronto       int16     `json:"pedido_pronto"`
	DataPedidoPronto   time.Time `json:"data_pedido_pronto,omitempty"`
	Cupom              string    `json:"cupom,omitempty"`
	TipoEntrega        string    `json:"tipo_entrega"`
	Prazo              int32     `json:"prazo,omitempty"`
	PrazoMin           int32     `json:"prazo_min,omitempty"`
	PrazoMax           int32     `json:"prazo_max,omitempty"`
	CategoriaPagamento string    `json:"categoria_pagamento,omitempty"`
	FormaPagamento     string    `json:"forma_pagamento,omitempty"`
	ValorTotal         float64   `json:"valor_total,omitempty"`
	Observacao         string    `json:"observacao,omitempty"`
	TaxaEntrega        float64   `json:"taxa_entrega,omitempty"`
	NomeTaxaEntrega    string    `json:"nome_taxa_entrega,omitempty"`
	IDStatus           int16     `json:"id_status"`
	Lat                float64   `json:"lat,omitempty"`
	Lng                float64   `json:"lng,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
	DeletedAt          time.Time `json:"deleted_at,omitempty"`
	ValorPago          float64   `json:"valor_pago,omitempty"`
	Quitado            bool      `json:"quitado,omitempty"`
	TrocoPara          float64   `json:"troco_para,omitempty"`
	Desconto           float64   `json:"desconto,omitempty"`
	Acrescimo          float64   `json:"acrescimo,omitempty"`
	Finalizado         bool      `json:"finalizado"`
	ValorBruto         float64   `json:"valor_bruto"`
	DataPedidoBr       time.Time `json:"data_pedido_br"`
	Dia                time.Time `json:"dia"`
	StatusDescr        string    `json:"status_descr,omitempty"`
	Cliente            string    `json:"cliente,omitempty"`
}

// TotalRowToDTO converte uma linha de totais do sqlc para o DTO
func TotalRowToDTO(row pgstore.GetTotalBrutoAndTotalPagoRow) DashboardTotalRow {
	return DashboardTotalRow{
		Dia:        row.Dia.Time,
		TotalBruto: numericToFloat64(row.TotalBruto),
		TotalPago:  numericToFloat64(row.TotalPago),
	}
}

// DetailedRowToDTO converte uma linha detalhada do sqlc para o DTO
func DetailedRowToDTO(row pgstore.GetTotalBrutoAndTotalPagoDetailedRow) DashboardDetailedRow {
	dto := DashboardDetailedRow{
		ID:           row.ID.String(),
		SeqID:        row.SeqID,
		TenantID:     row.TenantID.String(),
		IDCliente:    row.IDCliente.String(),
		CodigoPedido: row.CodigoPedido,
		DataPedido:   row.DataPedido,
		Gmt:          row.Gmt,
		PedidoPronto: row.PedidoPronto,
		TipoEntrega:  row.TipoEntrega,
		IDStatus:     row.IDStatus,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
		Finalizado:   row.Finalizado,
		ValorBruto:   numericToFloat64(row.ValorBruto),
		DataPedidoBr: row.DataPedidoBr.(time.Time),
		Dia:          row.Dia.Time,
	}

	// Campos opcionais
	if row.DataPedidoPronto.Valid {
		dto.DataPedidoPronto = row.DataPedidoPronto.Time
	}
	if row.Cupom.Valid {
		dto.Cupom = row.Cupom.String
	}
	if row.Prazo.Valid {
		dto.Prazo = row.Prazo.Int32
	}
	if row.PrazoMin.Valid {
		dto.PrazoMin = row.PrazoMin.Int32
	}
	if row.PrazoMax.Valid {
		dto.PrazoMax = row.PrazoMax.Int32
	}
	if row.CategoriaPagamento.Valid {
		dto.CategoriaPagamento = row.CategoriaPagamento.String
	}
	if row.FormaPagamento.Valid {
		dto.FormaPagamento = row.FormaPagamento.String
	}
	if row.ValorTotal.Valid {
		dto.ValorTotal = numericToFloat64(row.ValorTotal)
	}
	if row.Observacao.Valid {
		dto.Observacao = row.Observacao.String
	}
	if row.TaxaEntrega.Valid {
		dto.TaxaEntrega = numericToFloat64(row.TaxaEntrega)
	}
	if row.NomeTaxaEntrega.Valid {
		dto.NomeTaxaEntrega = row.NomeTaxaEntrega.String
	}
	if row.Lat.Valid {
		dto.Lat = numericToFloat64(row.Lat)
	}
	if row.Lng.Valid {
		dto.Lng = numericToFloat64(row.Lng)
	}
	if row.DeletedAt.Valid {
		dto.DeletedAt = row.DeletedAt.Time
	}
	if row.ValorPago.Valid {
		dto.ValorPago = numericToFloat64(row.ValorPago)
	}
	if row.Quitado.Valid {
		dto.Quitado = row.Quitado.Bool
	}
	if row.TrocoPara.Valid {
		dto.TrocoPara = numericToFloat64(row.TrocoPara)
	}
	if row.Desconto.Valid {
		dto.Desconto = numericToFloat64(row.Desconto)
	}
	if row.Acrescimo.Valid {
		dto.Acrescimo = numericToFloat64(row.Acrescimo)
	}
	if row.StatusDescr.Valid {
		dto.StatusDescr = row.StatusDescr.String
	}
	if row.Cliente.Valid {
		dto.Cliente = row.Cliente.String
	}

	return dto
}

// TotalRowsToDTO converte um slice de linhas de totais do sqlc para slice de DTOs
func TotalRowsToDTO(rows []pgstore.GetTotalBrutoAndTotalPagoRow) []DashboardTotalRow {
	dtos := make([]DashboardTotalRow, len(rows))
	for i, row := range rows {
		dtos[i] = TotalRowToDTO(row)
	}
	return dtos
}

// DetailedRowsToDTO converte um slice de linhas detalhadas do sqlc para slice de DTOs
func DetailedRowsToDTO(rows []pgstore.GetTotalBrutoAndTotalPagoDetailedRow) []DashboardDetailedRow {
	dtos := make([]DashboardDetailedRow, len(rows))
	for i, row := range rows {
		dtos[i] = DetailedRowToDTO(row)
	}
	return dtos
}

// -----------------------------------------------------------------------------
// Pagamentos – consultas GetPagamentosPorDiaECategoria / GetPagamentosDetalhadosUlt3Meses
// -----------------------------------------------------------------------------

// DashboardPaymentResumoRow representa o agregado de pagamentos (gráfico de barras)
type DashboardPaymentResumoRow struct {
	Dia                time.Time `json:"dia"`
	CategoriaPagamento string    `json:"categoria_pagamento"`
	ValorLiquido       float64   `json:"valor_liquido"`
}

// DashboardPaymentDetalhadoRow representa cada pagamento individual (tabela modal)
type DashboardPaymentDetalhadoRow struct {
	ID                 string    `json:"id"`
	IDPedido           string    `json:"id_pedido"`
	CategoriaPagamento string    `json:"categoria_pagamento,omitempty"`
	ValorPago          float64   `json:"valor_pago,omitempty"`
	Troco              float64   `json:"troco,omitempty"`
	ValorLiquido       float64   `json:"valor_liquido"`
	CreatedBr          time.Time `json:"created_br"`
	Dia                time.Time `json:"dia"`
	CodigoPedido       string    `json:"codigo_pedido"`
	DataPedidoBr       time.Time `json:"data_pedido_br"`
	Cliente            string    `json:"cliente,omitempty"`
}

// -----------------------------------------------------------------------------
// Conversões das structs geradas pelo sqlc para DTOs
// -----------------------------------------------------------------------------

// PaymentResumoRowToDTO converte uma linha agregada do sqlc para o DTO
func PaymentResumoRowToDTO(row pgstore.GetPagamentosPorDiaECategoriaRow) DashboardPaymentResumoRow {
	dto := DashboardPaymentResumoRow{
		Dia:          row.Dia.Time,
		ValorLiquido: numericToFloat64(row.ValorLiquido),
	}

	// categoria_pagamento é pgtype.Text
	if row.CategoriaPagamento.Valid {
		dto.CategoriaPagamento = row.CategoriaPagamento.String
	}

	return dto
}

// PaymentDetalhadoRowToDTO converte uma linha detalhada do sqlc para o DTO
func PaymentDetalhadoRowToDTO(row pgstore.GetPagamentosDetalhadosUlt3MesesRow) DashboardPaymentDetalhadoRow {
	dto := DashboardPaymentDetalhadoRow{
		ID:           row.ID.String(),
		IDPedido:     row.IDPedido.String(),
		ValorLiquido: numericToFloat64(row.ValorLiquido),
		Dia:          row.Dia.Time,
		CodigoPedido: row.CodigoPedido,
	}

	// Campos opcionais / pgtype.*
	if row.CategoriaPagamento.Valid {
		dto.CategoriaPagamento = row.CategoriaPagamento.String
	}

	dto.ValorPago = numericToFloat64(row.ValorPago)
	dto.Troco = numericToFloat64(row.Troco)

	if t, ok := row.CreatedBr.(time.Time); ok {
		dto.CreatedBr = t
	}
	if t, ok := row.DataPedidoBr.(time.Time); ok {
		dto.DataPedidoBr = t
	}
	if row.Cliente.Valid {
		dto.Cliente = row.Cliente.String
	}

	return dto
}

// PaymentResumoRowsToDTO converte slice de linhas agregadas
func PaymentResumoRowsToDTO(rows []pgstore.GetPagamentosPorDiaECategoriaRow) []DashboardPaymentResumoRow {
	dtos := make([]DashboardPaymentResumoRow, len(rows))
	for i, row := range rows {
		dtos[i] = PaymentResumoRowToDTO(row)
	}
	return dtos
}

// PaymentDetalhadoRowsToDTO converte slice de linhas detalhadas
func PaymentDetalhadoRowsToDTO(rows []pgstore.GetPagamentosDetalhadosUlt3MesesRow) []DashboardPaymentDetalhadoRow {
	dtos := make([]DashboardPaymentDetalhadoRow, len(rows))
	for i, row := range rows {
		dtos[i] = PaymentDetalhadoRowToDTO(row)
	}
	return dtos
}
