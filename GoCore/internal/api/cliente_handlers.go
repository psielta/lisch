package api

import (
	"gobid/internal/dto"
	"gobid/internal/jsonutils"
	"net/http"
	"regexp"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (api *Api) handleCreateCliente(w http.ResponseWriter, r *http.Request) {
	data, problems, err := jsonutils.DecodeValidJsonV10[dto.CreateClienteDTO](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	// Definir o tenant_id no DTO
	data.TenantID = tenantID

	cliente, err := api.ClienteService.CreateCliente(r.Context(), data)
	if err != nil {
		api.Logger.Error("erro ao criar cliente", zap.Error(err))

		// Verificar erros específicos (duplicação de CPF/CNPJ/Telefones)
		if err.Error() == "CPF já cadastrado" ||
			err.Error() == "CNPJ já cadastrado" ||
			err.Error() == "Telefone já cadastrado" ||
			err.Error() == "Celular já cadastrado" {
			jsonutils.EncodeJson(w, r, http.StatusConflict, map[string]any{
				"error": err.Error(),
			})
			return
		}

		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	_ = jsonutils.EncodeJson(w, r, http.StatusCreated, cliente)
}

func (api *Api) handleUpdateCliente(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	clienteID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "invalid cliente id",
		})
		return
	}

	data, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateClienteDTO](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	// Definir ID e tenant_id no DTO
	data.ID = clienteID
	data.TenantID = tenantID

	cliente, err := api.ClienteService.UpdateCliente(r.Context(), data)
	if err != nil {
		api.Logger.Error("erro ao atualizar cliente", zap.Error(err))

		// Verificar erros específicos
		if err.Error() == "cliente not found" {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
				"error": "cliente not found",
			})
			return
		}
		if err.Error() == "CPF já cadastrado" ||
			err.Error() == "CNPJ já cadastrado" ||
			err.Error() == "Telefone já cadastrado" ||
			err.Error() == "Celular já cadastrado" {
			jsonutils.EncodeJson(w, r, http.StatusConflict, map[string]any{
				"error": err.Error(),
			})
			return
		}

		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, cliente)
}

func (api *Api) handleDeleteCliente(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	clienteID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "invalid cliente id",
		})
		return
	}

	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	err = api.ClienteService.DeleteCliente(r.Context(), clienteID, tenantID)
	if err != nil {
		api.Logger.Error("erro ao deletar cliente", zap.Error(err))
		if err.Error() == "cliente not found" {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
				"error": "cliente not found",
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"message": "cliente deleted successfully",
	})
}

func (api *Api) handleGetCliente(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	clienteID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "invalid cliente id",
		})
		return
	}

	cliente, err := api.ClienteService.GetClienteById(r.Context(), clienteID)
	if err != nil {
		if err.Error() == "cliente not found" {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
				"error": "cliente not found",
			})
			return
		}

		api.Logger.Error("erro ao buscar cliente", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, cliente)
}

func (api *Api) handleGetClienteByCPF(w http.ResponseWriter, r *http.Request) {
	cpf := chi.URLParam(r, "cpf")
	if cpf == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "CPF is required",
		})
		return
	}

	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	cliente, err := api.ClienteService.GetClienteByCPF(r.Context(), cpf, tenantID)
	if err != nil {
		if err.Error() == "cliente not found" {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
				"error": "cliente not found",
			})
			return
		}

		api.Logger.Error("erro ao buscar cliente por CPF", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, cliente)
}

func (api *Api) handleGetClienteByCNPJ(w http.ResponseWriter, r *http.Request) {
	cnpj := chi.URLParam(r, "cnpj")
	if cnpj == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "CNPJ is required",
		})
		return
	}

	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	cliente, err := api.ClienteService.GetClienteByCNPJ(r.Context(), cnpj, tenantID)
	if err != nil {
		if err.Error() == "cliente not found" {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
				"error": "cliente not found",
			})
			return
		}

		api.Logger.Error("erro ao buscar cliente por CNPJ", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, cliente)
}

func (api *Api) handleListClientes(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	// Parse query parameters para paginação
	query := r.URL.Query()

	// Parâmetros de paginação
	page := 1
	if pageStr := query.Get("page"); pageStr != "" {
		if parsedPage, err := strconv.Atoi(pageStr); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	pageSize := 10
	if limitStr := query.Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			pageSize = parsedLimit
		}
	}

	// Parâmetros de ordenação
	sortBy := query.Get("sort")
	if sortBy == "" {
		sortBy = "nome"
	}

	sortOrder := query.Get("order")
	if sortOrder == "" {
		sortOrder = "asc"
	}

	// Parâmetros de filtro
	searchTerm := query.Get("q")
	nome := query.Get("nome")
	nomeFantasia := query.Get("fantasia")
	cpf := query.Get("cpf")
	if cpf != "" {
		cpf = regexp.MustCompile(`[^\d]`).ReplaceAllString(cpf, "")
	}
	cnpj := query.Get("cnpj")
	if cnpj != "" {
		cnpj = regexp.MustCompile(`[^\d]`).ReplaceAllString(cnpj, "")
	}
	telefone := query.Get("telefone")
	if telefone != "" {
		telefone = regexp.MustCompile(`[^\d]`).ReplaceAllString(telefone, "")
	}
	celular := query.Get("celular")
	if celular != "" {
		celular = regexp.MustCompile(`[^\d]`).ReplaceAllString(celular, "")
	}
	cidade := query.Get("cidade")
	uf := query.Get("uf")
	tipoPessoa := query.Get("tipo_pessoa")

	clientes, err := api.ClienteService.ListClientesPaginated(
		r.Context(),
		tenantID,
		page,
		pageSize,
		sortBy,
		sortOrder,
		searchTerm,
		nome,
		nomeFantasia,
		cpf,
		cnpj,
		cidade,
		uf,
		tipoPessoa,
		telefone,
		celular,
	)

	if err != nil {
		api.Logger.Error("erro ao listar clientes", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, clientes)
}

func (api *Api) handleListClientesSmartSearch(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	// Parse query parameters
	query := r.URL.Query()

	page := 1
	if pageStr := query.Get("page"); pageStr != "" {
		if parsedPage, err := strconv.Atoi(pageStr); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	pageSize := 10
	if pageSizeStr := query.Get("page_size"); pageSizeStr != "" {
		if parsedPageSize, err := strconv.Atoi(pageSizeStr); err == nil && parsedPageSize > 0 {
			pageSize = parsedPageSize
		}
	}

	searchTerm := query.Get("search")

	clientes, err := api.ClienteService.ListClientesSmartSearch(r.Context(), tenantID, page, pageSize, searchTerm)
	if err != nil {
		api.Logger.Error("erro ao buscar clientes", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, clientes)
}

func (api *Api) handleListClientesSimple(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	// Parse query parameters
	query := r.URL.Query()

	limit := int32(10)
	if limitStr := query.Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = int32(parsedLimit)
		}
	}

	offset := int32(0)
	if offsetStr := query.Get("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = int32(parsedOffset)
		}
	}

	clientes, err := api.ClienteService.ListClientesByTenant(r.Context(), tenantID, limit, offset)
	if err != nil {
		api.Logger.Error("erro ao listar clientes", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	if clientes == nil {
		jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
			"error": "clientes not found",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, clientes)
}

func (api *Api) handleCountClientes(w http.ResponseWriter, r *http.Request) {
	// Obter tenant_id do contexto da sessão
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "unauthorized",
		})
		return
	}

	count, err := api.ClienteService.CountClientesByTenant(r.Context(), tenantID)
	if err != nil {
		api.Logger.Error("erro ao contar clientes", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"count": count,
	})
}

// Função auxiliar para verificar se uma string contém uma substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		(len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
			func() bool {
				for i := 1; i <= len(s)-len(substr); i++ {
					if s[i:i+len(substr)] == substr {
						return true
					}
				}
				return false
			}())))
}

func (api *Api) handleUpsertCliente(w http.ResponseWriter, r *http.Request) {
	data, problems, err := jsonutils.DecodeValidJsonV10[dto.UpsertClienteDTO](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	cliente, err := api.ClienteService.UpsertCliente(r.Context(), data)
	if err != nil {
		api.Logger.Error("erro ao upsertar cliente", zap.Error(err))
		if err.Error() == "CPF já cadastrado" ||
			err.Error() == "CNPJ já cadastrado" ||
			err.Error() == "Telefone já cadastrado" ||
			err.Error() == "Celular já cadastrado" {
			jsonutils.EncodeJson(w, r, http.StatusConflict, map[string]any{
				"error": err.Error(),
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, cliente)
}
