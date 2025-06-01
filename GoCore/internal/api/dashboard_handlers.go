package api

import (
	"gobid/internal/jsonutils"
	"net/http"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (api *Api) handleDashboard_GetTotalBrutoAndTotalPago(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	totals, err := api.DashboardService.GetTotalBrutoAndTotalPago(r.Context(), tenantID)
	if err != nil {
		api.Logger.Error("erro ao buscar totais do dashboard", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, totals)
}

func (api *Api) handleDashboard_GetTotalBrutoAndTotalPagoDetailed(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	details, err := api.DashboardService.GetTotalBrutoAndTotalPagoDetailed(r.Context(), tenantID)
	if err != nil {
		api.Logger.Error("erro ao buscar detalhes do dashboard", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, details)
}

func (api *Api) handleDashboard_GetPagamentosPorDiaECategoria(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	payments, err := api.DashboardService.GetPagamentosResumoUlt3Meses(r.Context(), tenantID)
	if err != nil {
		api.Logger.Error("erro ao buscar pagamentos por dia e categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, payments)
}

func (api *Api) handleDashboard_GetPagamentosResumoUlt3Meses(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	payments, err := api.DashboardService.GetPagamentosDetalhadosUlt3Meses(r.Context(), tenantID)
	if err != nil {
		api.Logger.Error("erro ao buscar pagamentos detalhados últimos 3 meses", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, payments)
}
