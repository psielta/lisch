package api

import (
	"database/sql"
	"errors"
	"gobid/internal/decimalutils"
	"gobid/internal/dto"
	"gobid/internal/jsonutils"
	"gobid/internal/models_sql_boiler"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
	"go.uber.org/zap"
)

// Constante para limite máximo de paginação
const MAX_LIMIT = 200

// Helper para carregar um adicional verificando permissão por tenant
func (api *Api) loadAdicional(ctx *http.Request, id string, tenantID uuid.UUID) (*models_sql_boiler.CategoriaAdicional, error) {
	adicional, err := models_sql_boiler.CategoriaAdicionais(
		qm.Where("categoria_adicionais.id = ?", id),
		qm.Where("categoria_adicionais.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = categoria_adicionais.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID),
	).One(ctx.Context(), api.SQLBoilerDB.GetDB())

	return adicional, err
}

// handleCategoriaAdicionais_List busca todos os grupos de adicionais de uma categoria
func (api *Api) handleCategoriaAdicionais_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Verificar se há um ID de categoria na query
	categoriaID := r.URL.Query().Get("id_categoria")
	if categoriaID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "id_categoria is required"})
		return
	}

	// Verificar se a categoria pertence ao tenant do usuário
	_, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", categoriaID),
		qm.Where("id_tenant = ?", tenantID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "categoria not found"})
			return
		}
		api.Logger.Error("erro ao buscar categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Parse limit e offset para paginação
	limit := 20 // Default
	offset := 0 // Default

	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
			// Aplicar limite máximo para evitar queries muito grandes
			if limit > MAX_LIMIT {
				limit = MAX_LIMIT
			}
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Montar as condições de busca
	queryMods := []qm.QueryMod{
		qm.Where("id_categoria = ?", categoriaID),
		qm.Where("deleted_at IS NULL"),
	}

	// Contar total usando as condições básicas
	total, err := models_sql_boiler.CategoriaAdicionais(queryMods...).Count(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao contar adicionais", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Adicionar ordenação para a consulta principal
	queryMods = append(queryMods, qm.OrderBy("seq_id"))

	// Carregar relacionamentos
	queryMods = append(queryMods, qm.Load(models_sql_boiler.CategoriaAdicionalRels.IDCategoriaAdicionalCategoriaAdicionalOpcoes,
		qm.Where("deleted_at IS NULL"),
		qm.OrderBy("seq_id"),
	))

	// Adicionar paginação
	queryMods = append(queryMods, qm.Limit(limit))
	queryMods = append(queryMods, qm.Offset(offset))

	// Buscar adicionais paginados
	adicionais, err := models_sql_boiler.CategoriaAdicionais(queryMods...).All(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao buscar adicionais", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.ConvertSQLBoilerCategoriaAdicionaisListToDTO(adicionais, total, int32(limit), int32(offset))

	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleCategoriaAdicionais_ListByTenant lista os grupos de adicionais por tenant ID
func (api *Api) handleCategoriaAdicionais_ListByTenant(w http.ResponseWriter, r *http.Request) {
	tenantId := chi.URLParam(r, "tenantId")
	if tenantId == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "tenant_id is required"})
		return
	}

	// Validar UUID do tenant
	_, err := uuid.Parse(tenantId)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid tenant_id format"})
		return
	}

	// Parâmetros de paginação
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 100 // limite padrão
	offset := 0  // offset padrão

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Montar as condições de busca
	queryMods := []qm.QueryMod{
		qm.InnerJoin("categorias c on c.id = categoria_adicionais.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantId),
		qm.Where("categoria_adicionais.deleted_at IS NULL"),
	}

	// Contar total usando as condições básicas
	total, err := models_sql_boiler.CategoriaAdicionais(queryMods...).Count(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao contar adicionais", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Adicionar ordenação para a consulta principal
	queryMods = append(queryMods, qm.OrderBy("categoria_adicionais.seq_id"))

	// Carregar relacionamentos
	queryMods = append(queryMods, qm.Load(models_sql_boiler.CategoriaAdicionalRels.IDCategoriaAdicionalCategoriaAdicionalOpcoes,
		qm.Where("deleted_at IS NULL"),
		qm.OrderBy("seq_id"),
	))

	// Adicionar paginação
	queryMods = append(queryMods, qm.Limit(limit))
	queryMods = append(queryMods, qm.Offset(offset))

	// Buscar adicionais paginados
	adicionais, err := models_sql_boiler.CategoriaAdicionais(queryMods...).All(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao buscar adicionais", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.ConvertSQLBoilerCategoriaAdicionaisListToDTO(adicionais, total, int32(limit), int32(offset))

	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleCategoriaAdicionais_Get busca um grupo de adicionais por ID
func (api *Api) handleCategoriaAdicionais_Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "id is required"})
		return
	}

	// Validar UUID
	_, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid id format"})
		return
	}

	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Buscar adicional com suas opções
	adicional, err := models_sql_boiler.CategoriaAdicionais(
		qm.Where("categoria_adicionais.id = ?", id),
		qm.Where("categoria_adicionais.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = categoria_adicionais.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID),
		qm.Load(models_sql_boiler.CategoriaAdicionalRels.IDCategoriaAdicionalCategoriaAdicionalOpcoes,
			qm.Where("deleted_at IS NULL"),
			qm.OrderBy("seq_id")),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "adicional not found"})
			return
		}
		api.Logger.Error("erro ao buscar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.ConvertSQLBoilerCategoriaAdicionalToDTO(adicional)

	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleCategoriaAdicionais_Post cria um novo grupo de adicionais
func (api *Api) handleCategoriaAdicionais_Post(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionais_Post")

	// Obter o tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	createDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CreateCategoriaAdicionalRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Validações específicas para o tipo de seleção
	if createDTO.Selecao == "Q" {
		if createDTO.Minimo == nil || createDTO.Limite == nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "minimo and limite are required for selecao=Q"})
			return
		}
		if *createDTO.Minimo > *createDTO.Limite {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "minimo cannot be greater than limite"})
			return
		}
	}

	// Verificar se a categoria existe e pertence ao tenant
	categoria, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", createDTO.IDCategoria),
		qm.Where("id_tenant = ?", tenantID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "categoria not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Iniciar transação
	tx, err := api.SQLBoilerDB.GetDB().BeginTx(r.Context(), nil)
	if err != nil {
		api.Logger.Error("erro ao iniciar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}
	defer tx.Rollback()

	// Obter próximo seq_id para categoria_adicionais dentro da transação
	var nextSeqID int64
	query := "SELECT COALESCE(MAX(seq_id), 0) + 1 FROM categoria_adicionais WHERE id_categoria = $1"
	err = tx.QueryRow(query, categoria.ID).Scan(&nextSeqID)
	if err != nil {
		api.Logger.Error("erro ao obter next seq_id", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Criar o adicional
	adicional := &models_sql_boiler.CategoriaAdicional{
		ID:          uuid.New().String(),
		SeqID:       nextSeqID,
		IDCategoria: createDTO.IDCategoria,
		Nome:        createDTO.Nome,
		Selecao:     createDTO.Selecao,
		Status:      createDTO.Status,
	}

	// Definir campos opcionais
	if createDTO.CodigoTipo != nil {
		adicional.CodigoTipo.SetValid(*createDTO.CodigoTipo)
	}

	if createDTO.Minimo != nil {
		adicional.Minimo.SetValid(int(*createDTO.Minimo))
	}

	if createDTO.Limite != nil {
		adicional.Limite.SetValid(int(*createDTO.Limite))
	}

	// Inserir o adicional
	if err := adicional.Insert(r.Context(), tx, boil.Infer()); err != nil {
		api.Logger.Error("erro ao inserir adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating adicional"})
		return
	}

	// Inserir opções do adicional
	for i, opcaoDTO := range createDTO.Opcoes {
		opcao := &models_sql_boiler.CategoriaAdicionalOpcao{
			ID:                   uuid.New().String(),
			SeqID:                int64(i + 1),
			IDCategoriaAdicional: adicional.ID,
			Nome:                 opcaoDTO.Nome,
			Status:               opcaoDTO.Status,
		}

		// Converter valor
		valor, err := decimalutils.FromString(opcaoDTO.Valor)
		if err != nil {
			api.Logger.Error("erro ao converter valor", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid valor format"})
			return
		}
		opcao.Valor = valor

		// Definir campos opcionais
		if opcaoDTO.Codigo != nil {
			opcao.Codigo.SetValid(*opcaoDTO.Codigo)
		}

		// Inserir a opção
		if err := opcao.Insert(r.Context(), tx, boil.Infer()); err != nil {
			api.Logger.Error("erro ao inserir opção", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating adicional option"})
			return
		}
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar o adicional completo para resposta
	adicionalCompleto, err := models_sql_boiler.CategoriaAdicionais(
		qm.Where("id = ?", adicional.ID),
		qm.Load(models_sql_boiler.CategoriaAdicionalRels.IDCategoriaAdicionalCategoriaAdicionalOpcoes,
			qm.Where("deleted_at IS NULL"),
			qm.OrderBy("seq_id")),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar adicional criado", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusCreated, map[string]any{"message": "adicional created successfully", "id": adicional.ID})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerCategoriaAdicionalToDTO(adicionalCompleto)
	jsonutils.EncodeJson(w, r, http.StatusCreated, resp)
}

// handleCategoriaAdicionais_Put atualiza um grupo de adicionais sem recriar todas as opções
func (api *Api) handleCategoriaAdicionais_Put(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionais_Put")

	id := chi.URLParam(r, "id")
	if id == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "id is required"})
		return
	}
	if _, err := uuid.Parse(id); err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid id format"})
		return
	}

	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// ── 1. Decodifica / valida JSON ──────────────────────────────────────────────
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateCategoriaAdicionalRequest](r)
	if err != nil {
		api.Logger.Error("decode/validate", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	if updateDTO.Selecao == "Q" && (updateDTO.Minimo == nil || updateDTO.Limite == nil || *updateDTO.Minimo > *updateDTO.Limite) {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "minimo/limite inválidos"})
		return
	}

	// ── 2. Carrega adicional + categoria (garantia de permissão) ────────────────
	adicional, err := api.loadAdicional(r, id, tenantID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, sql.ErrNoRows) {
			status = http.StatusNotFound
		}
		jsonutils.EncodeJson(w, r, status, map[string]any{"error": "adicional not found or not authorized"})
		return
	}

	// ── 3. Inicia transação ─────────────────────────────────────────────────────
	tx, err := api.SQLBoilerDB.GetDB().BeginTx(r.Context(), nil)
	if err != nil {
		api.Logger.Error("begin tx", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}
	defer tx.Rollback()

	// ── 4. Atualiza campos do adicional -------------------------------------------------
	adicional.IDCategoria = updateDTO.IDCategoria
	adicional.Nome = updateDTO.Nome
	adicional.Selecao = updateDTO.Selecao
	adicional.Status = updateDTO.Status

	if updateDTO.CodigoTipo != nil {
		adicional.CodigoTipo.SetValid(*updateDTO.CodigoTipo)
	} else {
		adicional.CodigoTipo.Valid = false
	}
	if updateDTO.Minimo != nil {
		adicional.Minimo.SetValid(int(*updateDTO.Minimo))
	} else {
		adicional.Minimo.Valid = false
	}
	if updateDTO.Limite != nil {
		adicional.Limite.SetValid(int(*updateDTO.Limite))
	} else {
		adicional.Limite.Valid = false
	}

	if _, err = adicional.Update(r.Context(), tx, boil.Infer()); err != nil {
		api.Logger.Error("update adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating adicional"})
		return
	}

	// ── 5. Carrega todas as opções existentes (mapa por ID) ─────────────────────
	existentesSlice, err := models_sql_boiler.CategoriaAdicionalOpcoes(
		qm.Where("id_categoria_adicional = ?", id),
		qm.Where("deleted_at IS NULL"),
	).All(r.Context(), tx)
	if err != nil {
		api.Logger.Error("load options", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	existentes := make(map[string]*models_sql_boiler.CategoriaAdicionalOpcao, len(existentesSlice))
	maxSeqID := int64(0)
	for _, op := range existentesSlice {
		existentes[op.ID] = op
		if op.SeqID > maxSeqID {
			maxSeqID = op.SeqID
		}
	}

	// ── 6. Percorre DTO -> atualiza ou insere ───────────────────────────────────
	processados := make(map[string]bool)

	for _, dtoOpc := range updateDTO.Opcoes {
		var opcao *models_sql_boiler.CategoriaAdicionalOpcao

		// --- a) Já existia? -----------------------------------------------------
		if dtoOpc.ID != nil && existentes[*dtoOpc.ID] != nil {
			opcao = existentes[*dtoOpc.ID]
		} else {
			// nova opção
			maxSeqID++
			opcao = &models_sql_boiler.CategoriaAdicionalOpcao{
				ID:                   uuid.NewString(),
				SeqID:                maxSeqID,
				IDCategoriaAdicional: id,
			}
		}

		// campos comuns
		opcao.Nome = dtoOpc.Nome
		opcao.Status = dtoOpc.Status

		// Valor decimal
		valor, err := decimalutils.FromString(dtoOpc.Valor)
		if err != nil {
			api.Logger.Error("valor inválido", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "valor inválido"})
			return
		}
		opcao.Valor = valor

		if dtoOpc.Codigo != nil {
			opcao.Codigo.SetValid(*dtoOpc.Codigo)
		} else {
			opcao.Codigo.Valid = false
		}

		// persiste
		if dtoOpc.ID != nil && existentes[*dtoOpc.ID] != nil {
			if _, err := opcao.Update(r.Context(), tx, boil.Infer()); err != nil {
				api.Logger.Error("update opcao", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating option"})
				return
			}
		} else {
			if err := opcao.Insert(r.Context(), tx, boil.Infer()); err != nil {
				api.Logger.Error("insert opcao", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error inserting option"})
				return
			}
		}

		processados[opcao.ID] = true
	}

	// ── 7. Soft-delete das opções que não vieram no DTO -------------------------
	for idOpt, op := range existentes {
		if !processados[idOpt] {
			op.DeletedAt.SetValid(time.Now().UTC())
			if _, err := op.Update(r.Context(), tx, boil.Infer()); err != nil {
				api.Logger.Error("soft-delete opcao", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting option"})
				return
			}
		}
	}

	// ── 8. Commit e resposta ----------------------------------------------------
	if err := tx.Commit(); err != nil {
		api.Logger.Error("commit", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// carrega adicional completo com opções para devolver
	adicionalAtualizado, _ := models_sql_boiler.CategoriaAdicionais(
		qm.Where("id = ?", id),
		qm.Load(models_sql_boiler.CategoriaAdicionalRels.IDCategoriaAdicionalCategoriaAdicionalOpcoes,
			qm.Where("deleted_at IS NULL"),
			qm.OrderBy("seq_id")),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	resp := dto.ConvertSQLBoilerCategoriaAdicionalToDTO(adicionalAtualizado)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleCategoriaAdicionais_Delete realiza a exclusão lógica de um grupo de adicionais
func (api *Api) handleCategoriaAdicionais_Delete(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionais_Delete")

	// Obter ID da URL
	id := chi.URLParam(r, "id")
	if id == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "id is required"})
		return
	}

	// Validar UUID
	_, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Verificar se o adicional existe e pertence a uma categoria do tenant
	adicional, err := api.loadAdicional(r, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "adicional not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Iniciar transação
	tx, err := api.SQLBoilerDB.GetDB().BeginTx(r.Context(), nil)
	if err != nil {
		api.Logger.Error("erro ao iniciar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}
	defer tx.Rollback()

	// Buscar todas as opções do adicional
	opcoes, err := models_sql_boiler.CategoriaAdicionalOpcoes(
		qm.Where("id_categoria_adicional = ?", id),
		qm.Where("deleted_at IS NULL"),
	).All(r.Context(), tx)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		api.Logger.Error("erro ao buscar opções do adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Realizar soft delete das opções
	for _, opcao := range opcoes {
		opcao.DeletedAt.SetValid(time.Now().UTC())
		_, err = opcao.Update(r.Context(), tx, boil.Infer())
		if err != nil {
			api.Logger.Error("erro ao deletar opção", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting adicional options"})
			return
		}
	}

	// Realizar soft delete do adicional
	adicional.DeletedAt.SetValid(time.Now().UTC())
	_, err = adicional.Update(r.Context(), tx, boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao deletar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting adicional"})
		return
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "adicional deleted successfully"})
}

// handleCategoriaAdicionais_PutStatus atualiza o status de um grupo de adicionais
func (api *Api) handleCategoriaAdicionais_PutStatus(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionais_PutStatus")

	// Obter ID da URL
	id := chi.URLParam(r, "id")
	if id == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "id is required"})
		return
	}

	// Validar UUID
	_, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Estrutura para o payload
	type StatusRequest struct {
		Status int16 `json:"status" validate:"oneof=0 1"`
	}

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[StatusRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o adicional existe e pertence a uma categoria do tenant
	adicional, err := api.loadAdicional(r, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "adicional not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar status
	adicional.Status = updateDTO.Status

	// Salvar alterações
	_, err = adicional.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar status do adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "status updated successfully"})
}

// handleCategoriaAdicionalOpcoes_PutStatus atualiza o status de uma opção de adicional
func (api *Api) handleCategoriaAdicionalOpcoes_PutStatus(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionalOpcoes_PutStatus")

	// Obter IDs da URL
	adicionalID := chi.URLParam(r, "id")
	opcaoID := chi.URLParam(r, "opcaoId")
	if adicionalID == "" || opcaoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "adicional id and opcao id are required"})
		return
	}

	// Validar UUIDs
	_, err := uuid.Parse(adicionalID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid adicional id format"})
		return
	}
	_, err = uuid.Parse(opcaoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid opcao id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Estrutura para o payload
	type StatusRequest struct {
		Status int16 `json:"status" validate:"oneof=0 1"`
	}

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[StatusRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o adicional existe e pertence a uma categoria do tenant
	_, err = api.loadAdicional(r, adicionalID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "adicional not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar opção
	opcao, err := models_sql_boiler.CategoriaAdicionalOpcoes(
		qm.Where("id = ?", opcaoID),
		qm.Where("id_categoria_adicional = ?", adicionalID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "opcao not found"})
			return
		}
		api.Logger.Error("erro ao buscar opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar status
	opcao.Status = updateDTO.Status

	// Salvar alterações
	_, err = opcao.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar status da opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "opcao status updated successfully"})
}

// handleCategoriaAdicionalOpcoes_Put atualiza uma opção de adicional
func (api *Api) handleCategoriaAdicionalOpcoes_Put(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionalOpcoes_Put")

	// Obter IDs da URL
	adicionalID := chi.URLParam(r, "id")
	opcaoID := chi.URLParam(r, "opcaoId")
	if adicionalID == "" || opcaoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "adicional id and opcao id are required"})
		return
	}

	// Validar UUIDs
	_, err := uuid.Parse(adicionalID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid adicional id format"})
		return
	}
	_, err = uuid.Parse(opcaoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid opcao id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateCategoriaAdicionalOpcaoRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o adicional existe e pertence a uma categoria do tenant
	_, err = api.loadAdicional(r, adicionalID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "adicional not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar opção
	opcao, err := models_sql_boiler.CategoriaAdicionalOpcoes(
		qm.Where("id = ?", opcaoID),
		qm.Where("id_categoria_adicional = ?", adicionalID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "opcao not found"})
			return
		}
		api.Logger.Error("erro ao buscar opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar dados da opção
	opcao.Nome = updateDTO.Nome
	opcao.Status = updateDTO.Status

	// Converter valor
	valor, err := decimalutils.FromString(updateDTO.Valor)
	if err != nil {
		api.Logger.Error("erro ao converter valor", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid valor format"})
		return
	}
	opcao.Valor = valor

	// Atualizar campo opcional
	if updateDTO.Codigo != nil {
		opcao.Codigo.SetValid(*updateDTO.Codigo)
	} else {
		opcao.Codigo.Valid = false
	}

	// Salvar alterações
	_, err = opcao.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar a opção atualizada
	opcaoAtualizada, err := models_sql_boiler.CategoriaAdicionalOpcoes(
		qm.Where("id = ?", opcaoID),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar opção atualizada", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "opcao updated successfully", "id": opcaoID})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerCategoriaAdicionalOpcaoToDTO(opcaoAtualizada)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleCategoriaAdicionalOpcoes_Post adiciona uma nova opção a um adicional existente
func (api *Api) handleCategoriaAdicionalOpcoes_Post(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionalOpcoes_Post")

	// Obter ID do adicional da URL
	adicionalID := chi.URLParam(r, "id")
	if adicionalID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "adicional id is required"})
		return
	}

	// Validar UUID
	_, err := uuid.Parse(adicionalID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid adicional id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	createDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CreateCategoriaAdicionalOpcaoRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o ID do adicional na URL corresponde ao ID no DTO
	if adicionalID != createDTO.IDCategoriaAdicional {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "path id and body id_categoria_adicional mismatch"})
		return
	}

	// Verificar se o adicional existe e pertence a uma categoria do tenant
	_, err = api.loadAdicional(r, adicionalID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "adicional not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Iniciar transação para obter seq_id de forma segura
	tx, err := api.SQLBoilerDB.GetDB().BeginTx(r.Context(), nil)
	if err != nil {
		api.Logger.Error("erro ao iniciar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}
	defer tx.Rollback()

	// Obter próximo seq_id para opcoes
	var nextSeqID int64
	query := "SELECT COALESCE(MAX(seq_id), 0) + 1 FROM categoria_adicional_opcoes WHERE id_categoria_adicional = $1"
	err = tx.QueryRow(query, adicionalID).Scan(&nextSeqID)
	if err != nil {
		api.Logger.Error("erro ao obter next seq_id", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Criar a nova opção
	opcao := &models_sql_boiler.CategoriaAdicionalOpcao{
		ID:                   uuid.New().String(),
		SeqID:                nextSeqID,
		IDCategoriaAdicional: adicionalID,
		Nome:                 createDTO.Nome,
		Status:               createDTO.Status,
	}

	// Converter valor
	valor, err := decimalutils.FromString(createDTO.Valor)
	if err != nil {
		api.Logger.Error("erro ao converter valor", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid valor format"})
		return
	}
	opcao.Valor = valor

	// Definir campo opcional
	if createDTO.Codigo != nil {
		opcao.Codigo.SetValid(*createDTO.Codigo)
	}

	// Inserir a opção
	if err := opcao.Insert(r.Context(), tx, boil.Infer()); err != nil {
		api.Logger.Error("erro ao inserir opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating adicional option"})
		return
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar a opção criada
	opcaoCriada, err := models_sql_boiler.CategoriaAdicionalOpcoes(
		qm.Where("id = ?", opcao.ID),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar opção criada", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusCreated, map[string]any{"message": "opcao created successfully", "id": opcao.ID})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerCategoriaAdicionalOpcaoToDTO(opcaoCriada)
	jsonutils.EncodeJson(w, r, http.StatusCreated, resp)
}

// handleCategoriaAdicionalOpcoes_Delete realiza a exclusão lógica de uma opção de adicional
func (api *Api) handleCategoriaAdicionalOpcoes_Delete(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategoriaAdicionalOpcoes_Delete")

	// Obter IDs da URL
	adicionalID := chi.URLParam(r, "id")
	opcaoID := chi.URLParam(r, "opcaoId")
	if adicionalID == "" || opcaoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "adicional id and opcao id are required"})
		return
	}

	// Validar UUIDs
	_, err := uuid.Parse(adicionalID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid adicional id format"})
		return
	}
	_, err = uuid.Parse(opcaoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid opcao id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Verificar se o adicional existe e pertence a uma categoria do tenant
	existe, err := models_sql_boiler.CategoriaAdicionais(
		qm.Where("categoria_adicionais.id = ?", adicionalID),
		qm.Where("categoria_adicionais.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = categoria_adicionais.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID),
	).Exists(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao verificar adicional", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	if !existe {
		jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "adicional not found or not authorized"})
		return
	}

	// Verificar se a opção existe e pertence ao adicional
	opcao, err := models_sql_boiler.CategoriaAdicionalOpcoes(
		qm.Where("id = ?", opcaoID),
		qm.Where("id_categoria_adicional = ?", adicionalID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "opcao not found or not associated with this adicional"})
			return
		}
		api.Logger.Error("erro ao buscar opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Realizar soft delete da opção
	opcao.DeletedAt.SetValid(time.Now().UTC())
	_, err = opcao.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao deletar opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting adicional option"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "opcao deleted successfully"})
}
