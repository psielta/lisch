package api

import (
	"gobid/internal/dto"
	"gobid/internal/jsonutils"
	"net/http"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (api *Api) handleCaixas_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	caixas, err := api.CaixaService.GetCaixaAbertosPorTenant(r.Context(), tenantID)
	if err != nil {
		api.Logger.Error("erro ao listar caixas", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, caixas)
}

func (api *Api) handleCaixas_Post(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	data, problems, err := jsonutils.DecodeValidJsonV10[dto.InsertCaixaParams](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	caixa, err := api.CaixaService.CreateCaixa(r.Context(), data)
	if err != nil {
		api.Logger.Error("erro ao criar caixa", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, caixa)
}
