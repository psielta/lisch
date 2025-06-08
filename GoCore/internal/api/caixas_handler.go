package api

import (
	"gobid/internal/dto"
	"gobid/internal/jsonutils"
	"net/http"

	"github.com/go-chi/chi/v5"
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

	if len(caixas) == 0 {
		// 404
		jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "no caixas abertos found"})
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

func (api *Api) handleCaixas_Suprimento(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}
	data, problems, err := jsonutils.DecodeValidJsonV10[dto.SuprimentoCaixaDto](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	suprimento, err := api.CaixaService.SuprimentoCaixa(r.Context(), data)
	if err != nil {
		api.Logger.Error("erro ao criar suprimento", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}
	jsonutils.EncodeJson(w, r, http.StatusOK, suprimento)
}

func (api *Api) handleCaixas_Sangria(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}
	data, problems, err := jsonutils.DecodeValidJsonV10[dto.SangriaCaixaDto](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	sangria, err := api.CaixaService.SangriaCaixa(r.Context(), data)
	if err != nil {
		api.Logger.Error("erro ao criar sangria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}
	jsonutils.EncodeJson(w, r, http.StatusOK, sangria)
}

func (api *Api) handleCaixas_RemoveSangria(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}
	id := chi.URLParam(r, "id")
	idUUID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{"error": "invalid id"})
		return
	}

	err = api.CaixaService.RemoveSangriaCaixa(r.Context(), idUUID)
	if err != nil {
		api.Logger.Error("erro ao remover sangria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}
	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "sangria removida com sucesso"})
}

func (api *Api) handleCaixas_RemoveSuprimento(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}
	id := chi.URLParam(r, "id")
	idUUID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{"error": "invalid id"})
		return
	}

	err = api.CaixaService.RemoveSuprimentoCaixa(r.Context(), idUUID)
	if err != nil {
		api.Logger.Error("erro ao remover suprimento", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}
	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "suprimento removido com sucesso"})
}

func (api *Api) handleCaixas_Resumo(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}
	id := chi.URLParam(r, "id")
	idUUID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{"error": "invalid id"})
		return
	}

	resumo, err := api.CaixaService.ResumoCaixaAberto(r.Context(), idUUID)
	if err != nil {
		api.Logger.Error("erro ao obter resumo do caixa", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}
	jsonutils.EncodeJson(w, r, http.StatusOK, resumo)
}
