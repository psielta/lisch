package api

import (
	"database/sql"
	"errors"
	"gobid/internal/dto"
	"gobid/internal/jsonutils"
	"gobid/internal/models_sql_boiler"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
	"go.uber.org/zap"
)

// handleCategorias_List busca todas as categorias de um tenant
func (api *Api) handleCategorias_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Buscar categorias com suas opções
	categoriasList, err := models_sql_boiler.Categorias(
		qm.Where("id_tenant = ?", tenantID.String()),
		qm.Where("deleted_at IS NULL"),
		qm.Load(models_sql_boiler.CategoriaRels.CategoriaOpcoes, qm.Where("deleted_at IS NULL")),
		qm.OrderBy("ordem NULLS LAST, nome"),
	).All(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar categorias", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter a lista para DTOs
	resp := dto.ConvertSQLBoilerCategoriasListToCoreDTO(categoriasList)

	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleCulinarias_List busca todas as culinarias de um tenant
func (api *Api) handleCulinarias_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Buscar culinarias
	culinariasList, err := models_sql_boiler.Culinarias().All(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar culinarias", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.ConvertSQLBoilerCulinariasListToDTO(culinariasList)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleCategorias_Get busca uma categoria por ID
func (api *Api) handleCategorias_Get(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handlePedidoGetByID")
	id := chi.URLParam(r, "id")
	if id == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "id is required"})
		return
	}

	c, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", id),
		qm.Where("deleted_at IS NULL"),
		qm.Load(models_sql_boiler.CategoriaRels.CategoriaOpcoes),
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

	tenantID := api.getTenantIDFromContext(r)
	if c.IDTenant != tenantID.String() {
		jsonutils.EncodeJson(w, r, http.StatusForbidden, map[string]any{"error": "access denied"})
		return
	}

	// monta o response
	resp := dto.ConvertSQLBoilerCategoriaToCoreDTO(c)

	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

func (api *Api) handleCategorias_Post(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategorias_Post")

	// Obter o tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	createDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CoreCategoriaCreateDTO](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o tenantID do token corresponde ao tenantID do DTO
	if tenantID != createDTO.IDTenant {
		jsonutils.EncodeJson(w, r, http.StatusForbidden, map[string]any{"error": "access denied"})
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

	// Criar a categoria
	categoria := &models_sql_boiler.Categoria{
		ID:                uuid.New().String(),
		IDTenant:          tenantID.String(),
		IDCulinaria:       int(createDTO.IDCulinaria),
		Nome:              createDTO.Nome,
		Inicio:            time.Now(), // Valor padrão, será atualizado abaixo se fornecido
		Fim:               time.Now(), // Valor padrão, será atualizado abaixo se fornecido
		Ativo:             1,          // Valor padrão ativo
		DisponivelDomingo: 1,          // Valores padrão para disponibilidade
		DisponivelSegunda: 1,
		DisponivelTerca:   1,
		DisponivelQuarta:  1,
		DisponivelQuinta:  1,
		DisponivelSexta:   1,
		DisponivelSabado:  1,
	}

	// Atualizar campos opcionais se fornecidos
	if createDTO.Descricao != nil {
		categoria.Descricao.SetValid(*createDTO.Descricao)
	}

	if createDTO.Inicio != nil {
		t, err := time.Parse("15:04:05", *createDTO.Inicio)
		if err == nil {
			categoria.Inicio = t
		}
	}

	if createDTO.Fim != nil {
		t, err := time.Parse("15:04:05", *createDTO.Fim)
		if err == nil {
			categoria.Fim = t
		}
	}

	if createDTO.Ativo != nil {
		categoria.Ativo = *createDTO.Ativo
	}

	if createDTO.OpcaoMeia != nil {
		categoria.OpcaoMeia.SetValid(*createDTO.OpcaoMeia)
	}

	if createDTO.Ordem != nil {
		categoria.Ordem.SetValid(int(*createDTO.Ordem))
	}

	// Dias disponíveis
	if createDTO.DisponivelDomingo != nil {
		categoria.DisponivelDomingo = *createDTO.DisponivelDomingo
	}
	if createDTO.DisponivelSegunda != nil {
		categoria.DisponivelSegunda = *createDTO.DisponivelSegunda
	}
	if createDTO.DisponivelTerca != nil {
		categoria.DisponivelTerca = *createDTO.DisponivelTerca
	}
	if createDTO.DisponivelQuarta != nil {
		categoria.DisponivelQuarta = *createDTO.DisponivelQuarta
	}
	if createDTO.DisponivelQuinta != nil {
		categoria.DisponivelQuinta = *createDTO.DisponivelQuinta
	}
	if createDTO.DisponivelSexta != nil {
		categoria.DisponivelSexta = *createDTO.DisponivelSexta
	}
	if createDTO.DisponivelSabado != nil {
		categoria.DisponivelSabado = *createDTO.DisponivelSabado
	}

	// Inserir categoria no banco
	if err := categoria.Insert(r.Context(), tx, boil.Infer()); err != nil {
		api.Logger.Error("erro ao inserir categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating categoria"})
		return
	}
	// Inserir opções da categoria
	for _, opcaoDTO := range createDTO.Opcoes {
		opcao := &models_sql_boiler.CategoriaOpcao{
			ID:          uuid.New().String(),
			IDCategoria: categoria.ID,
			Nome:        opcaoDTO.Nome,
			Status:      1, // Padrão ativo
		}

		if opcaoDTO.Status != nil {
			opcao.Status = *opcaoDTO.Status
		}

		if err := opcao.Insert(r.Context(), tx, boil.Infer()); err != nil {
			api.Logger.Error("erro ao inserir opção", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating categoria option"})
			return
		}
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar categoria completa com opções para resposta
	categoriaCompleta, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", categoria.ID),
		qm.Load(models_sql_boiler.CategoriaRels.CategoriaOpcoes),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar categoria criada", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "categoria created successfully", "id": categoria.ID})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerCategoriaToCoreDTO(categoriaCompleta)
	jsonutils.EncodeJson(w, r, http.StatusCreated, resp)
}

func (api *Api) handleCategorias_Put(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategorias_Put")

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

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CoreCategoriaUpdateDTO](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o ID no path corresponde ao ID no DTO
	if id != updateDTO.ID {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "path id and body id mismatch"})
		return
	}

	// Buscar categoria existente para verificar permissão
	categoriaExistente, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", id),
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

	// Verificar se o tenant da categoria corresponde ao tenant do usuário
	if tenantID.String() != categoriaExistente.IDTenant {
		jsonutils.EncodeJson(w, r, http.StatusForbidden, map[string]any{"error": "access denied"})
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

	// Atualizar dados da categoria
	categoriaExistente.IDCulinaria = int(updateDTO.IDCulinaria)
	categoriaExistente.Nome = updateDTO.Nome

	// Atualizar campos opcionais
	if updateDTO.Descricao != nil {
		categoriaExistente.Descricao.SetValid(*updateDTO.Descricao)
	} else {
		categoriaExistente.Descricao.Valid = false
	}

	if updateDTO.Inicio != nil {
		t, err := time.Parse("15:04:05", *updateDTO.Inicio)
		if err == nil {
			categoriaExistente.Inicio = t
		}
	}

	if updateDTO.Fim != nil {
		t, err := time.Parse("15:04:05", *updateDTO.Fim)
		if err == nil {
			categoriaExistente.Fim = t
		}
	}

	if updateDTO.Ativo != nil {
		categoriaExistente.Ativo = *updateDTO.Ativo
	}

	if updateDTO.OpcaoMeia != nil {
		categoriaExistente.OpcaoMeia.SetValid(*updateDTO.OpcaoMeia)
	} else {
		categoriaExistente.OpcaoMeia.Valid = false
	}

	if updateDTO.Ordem != nil {
		categoriaExistente.Ordem.SetValid(int(*updateDTO.Ordem))
	} else {
		categoriaExistente.Ordem.Valid = false
	}

	// Dias disponíveis
	if updateDTO.DisponivelDomingo != nil {
		categoriaExistente.DisponivelDomingo = *updateDTO.DisponivelDomingo
	}
	if updateDTO.DisponivelSegunda != nil {
		categoriaExistente.DisponivelSegunda = *updateDTO.DisponivelSegunda
	}
	if updateDTO.DisponivelTerca != nil {
		categoriaExistente.DisponivelTerca = *updateDTO.DisponivelTerca
	}
	if updateDTO.DisponivelQuarta != nil {
		categoriaExistente.DisponivelQuarta = *updateDTO.DisponivelQuarta
	}
	if updateDTO.DisponivelQuinta != nil {
		categoriaExistente.DisponivelQuinta = *updateDTO.DisponivelQuinta
	}
	if updateDTO.DisponivelSexta != nil {
		categoriaExistente.DisponivelSexta = *updateDTO.DisponivelSexta
	}
	if updateDTO.DisponivelSabado != nil {
		categoriaExistente.DisponivelSabado = *updateDTO.DisponivelSabado
	}

	// Atualizar categoria no banco
	_, err = categoriaExistente.Update(r.Context(), tx, boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating categoria"})
		return
	}

	// Buscar todas as opções existentes da categoria
	opcoesExistentes, err := models_sql_boiler.CategoriaOpcoes(
		qm.Where("id_categoria = ?", id),
		qm.Where("deleted_at IS NULL"),
	).All(r.Context(), tx)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		api.Logger.Error("erro ao buscar opções existentes", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Mapas para controle
	opcoesAtuais := make(map[string]*models_sql_boiler.CategoriaOpcao)
	for _, opcao := range opcoesExistentes {
		opcoesAtuais[opcao.ID] = opcao
	}

	// IDs de opções processadas
	opcoesProcessadas := make(map[string]bool)

	// Processar opções do DTO
	for _, opcaoDTO := range updateDTO.Opcoes {
		// Se tem ID, atualiza opção existente
		if opcaoDTO.ID != "" {
			opcao, existe := opcoesAtuais[opcaoDTO.ID]
			if existe {
				// Marcar como processada
				opcoesProcessadas[opcao.ID] = true

				// Atualizar dados
				opcao.Nome = opcaoDTO.Nome
				if opcaoDTO.Status != nil {
					opcao.Status = *opcaoDTO.Status
				}

				// Salvar atualização
				_, err = opcao.Update(r.Context(), tx, boil.Infer())
				if err != nil {
					api.Logger.Error("erro ao atualizar opção", zap.Error(err))
					jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating categoria option"})
					return
				}
			}
		} else {
			// Criar nova opção
			novaOpcao := &models_sql_boiler.CategoriaOpcao{
				ID:          uuid.New().String(),
				IDCategoria: id,
				Nome:        opcaoDTO.Nome,
				Status:      1, // Padrão ativo
			}

			if opcaoDTO.Status != nil {
				novaOpcao.Status = *opcaoDTO.Status
			}

			if err := novaOpcao.Insert(r.Context(), tx, boil.Infer()); err != nil {
				api.Logger.Error("erro ao inserir nova opção", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating categoria option"})
				return
			}
		}
	}

	// Desativar opções que não foram enviadas no DTO (soft delete)
	for id, opcao := range opcoesAtuais {
		if !opcoesProcessadas[id] {
			opcao.DeletedAt.SetValid(time.Now())
			_, err = opcao.Update(r.Context(), tx, boil.Infer())
			if err != nil {
				api.Logger.Error("erro ao realizar soft delete de opção", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error removing categoria option"})
				return
			}
		}
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar categoria atualizada com opções para resposta
	categoriaAtualizada, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", id),
		qm.Load(models_sql_boiler.CategoriaRels.CategoriaOpcoes, qm.Where("deleted_at IS NULL")),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar categoria atualizada", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "categoria updated successfully", "id": id})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerCategoriaToCoreDTO(categoriaAtualizada)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

func (api *Api) handleCategorias_PutStatus(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategorias_PutStatus")

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

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CategoriaStatusUpdateDTO](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Buscar categoria existente
	categoria, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", id),
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

	// Verificar se o tenant da categoria corresponde ao tenant do usuário
	if tenantID.String() != categoria.IDTenant {
		jsonutils.EncodeJson(w, r, http.StatusForbidden, map[string]any{"error": "access denied"})
		return
	}

	// Atualizar status
	categoria.Ativo = *updateDTO.Ativo

	// Salvar alterações
	_, err = categoria.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar status da categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "status updated successfully"})
}

func (api *Api) handleCategorias_PutOrdem(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategorias_PutOrdem")

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

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CategoriaOrdemUpdateDTO](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Buscar categoria existente
	categoria, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", id),
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

	// Verificar se o tenant da categoria corresponde ao tenant do usuário
	if tenantID.String() != categoria.IDTenant {
		jsonutils.EncodeJson(w, r, http.StatusForbidden, map[string]any{"error": "access denied"})
		return
	}

	// Atualizar ordem
	categoria.Ordem.SetValid(int(*updateDTO.Ordem))

	// Salvar alterações
	_, err = categoria.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar ordem da categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "ordem updated successfully"})
}

func (api *Api) handleCategorias_PutOpcoesAlterarStatus(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleCategorias_PutOpcoesAlterarStatus")

	// Obter IDs da URL
	categoriaID := chi.URLParam(r, "id")
	opcaoID := chi.URLParam(r, "opcaoId")
	if categoriaID == "" || opcaoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "categoria id and opcao id are required"})
		return
	}

	// Validar UUIDs
	_, err := uuid.Parse(categoriaID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid categoria id format"})
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
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CategoriaOpcaoStatusUpdateDTO](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Buscar categoria e opção existentes
	categoria, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", categoriaID),
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

	// Verificar se o tenant da categoria corresponde ao tenant do usuário
	if tenantID.String() != categoria.IDTenant {
		jsonutils.EncodeJson(w, r, http.StatusForbidden, map[string]any{"error": "access denied"})
		return
	}

	// Buscar opção
	opcao, err := models_sql_boiler.CategoriaOpcoes(
		qm.Where("id = ?", opcaoID),
		qm.Where("id_categoria = ?", categoriaID),
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
	opcao.Status = *updateDTO.Status

	// Salvar alterações
	_, err = opcao.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar status da opção", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "opcao status updated successfully"})
}
