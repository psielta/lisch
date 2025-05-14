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

// handleProdutos_List busca todos os produtos de uma categoria
func (api *Api) handleProdutos_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Verificar se há um ID de categoria na query
	categoriaID := r.URL.Query().Get("id_categoria")

	// Parse limit e offset para paginação
	limit := 20 // Default
	offset := 0 // Default

	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

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
	var queryMods []qm.QueryMod

	// Condição para filtrar por categoria
	if categoriaID != "" {
		queryMods = append(queryMods, qm.Where("id_categoria = ?", categoriaID))

		// Verificar se a categoria pertence ao tenant do usuário
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

		// Verificar se a categoria pertence ao tenant
		if categoria.IDTenant != tenantID.String() {
			jsonutils.EncodeJson(w, r, http.StatusForbidden, map[string]any{"error": "access denied"})
			return
		}
	} else {
		// Se não for filtrado por categoria, filtrar pelo tenant via join com categoria
		queryMods = append(queryMods, qm.InnerJoin("categorias c on c.id = produtos.id_categoria"))
		queryMods = append(queryMods, qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()))
	}

	// Condições básicas
	queryMods = append(queryMods, qm.Where("produtos.deleted_at IS NULL"))

	// Contar total usando as condições básicas (sem ordenação)
	total, err := models_sql_boiler.Produtos(queryMods...).Count(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao contar produtos", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Adicionar ordenação para a consulta principal
	queryMods = append(queryMods, qm.OrderBy("produtos.ordem NULLS LAST, produtos.nome"))

	// Carregar relacionamentos
	queryMods = append(queryMods, qm.Load(models_sql_boiler.ProdutoRels.IDProdutoProdutoPrecos,
		qm.Where("deleted_at IS NULL"),
		qm.Load(models_sql_boiler.ProdutoPrecoRels.IDCategoriaOpcaoCategoriaOpco)))

	// Adicionar paginação
	queryMods = append(queryMods, qm.Limit(limit))
	queryMods = append(queryMods, qm.Offset(offset))

	// Buscar produtos paginados
	produtos, err := models_sql_boiler.Produtos(queryMods...).All(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao buscar produtos", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.ConvertSQLBoilerProdutosListToDTO(produtos, total, int32(limit), int32(offset))

	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleProdutos_Get busca um produto por ID
func (api *Api) handleProdutos_Get(w http.ResponseWriter, r *http.Request) {
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

	// Buscar produto com seus preços
	produto, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", id), // <-- Mudança aqui
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
		qm.Load(models_sql_boiler.ProdutoRels.IDProdutoProdutoPrecos,
			qm.Where("deleted_at IS NULL"),
			qm.Load(models_sql_boiler.ProdutoPrecoRels.IDCategoriaOpcaoCategoriaOpco)),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found"})
			return
		}
		api.Logger.Error("erro ao buscar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.ConvertSQLBoilerProdutoToDTO(produto)

	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleProdutos_Post cria um novo produto
func (api *Api) handleProdutos_Post(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutos_Post")

	// Obter o tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	createDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CreateProdutoRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se a categoria existe e pertence ao tenant
	categoria, err := models_sql_boiler.Categorias(
		qm.Where("id = ?", createDTO.IDCategoria),
		qm.Where("id_tenant = ?", tenantID.String()),
		qm.Where("deleted_at IS NULL"),
		qm.Load(models_sql_boiler.CategoriaRels.CategoriaOpcoes, qm.Where("deleted_at IS NULL")),
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

	// Criar um mapa de opções de categoria para validação dos preços
	opcoesMap := make(map[string]bool)
	if categoria.R != nil && categoria.R.CategoriaOpcoes != nil {
		for _, opcao := range categoria.R.CategoriaOpcoes {
			opcoesMap[opcao.ID] = true
		}
	}

	// Validar que as opções de categoria nos preços pertencem à categoria selecionada
	for _, preco := range createDTO.Precos {
		if !opcoesMap[preco.IDCategoriaOpcao] {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest,
				map[string]any{"error": "categoria_opcao_id não pertence à categoria selecionada"})
			return
		}
	}

	// Iniciar transação
	tx, err := api.SQLBoilerDB.GetDB().BeginTx(r.Context(), nil)
	if err != nil {
		api.Logger.Error("erro ao iniciar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}
	defer tx.Rollback()

	// Criar o produto
	produto := &models_sql_boiler.Produto{
		ID:          uuid.New().String(),
		IDCategoria: createDTO.IDCategoria,
		Nome:        createDTO.Nome,
		Status:      createDTO.Status,
	}

	// Definir campos opcionais
	if createDTO.Descricao != nil {
		produto.Descricao.SetValid(*createDTO.Descricao)
	}

	if createDTO.CodigoExterno != nil {
		produto.CodigoExterno.SetValid(*createDTO.CodigoExterno)
	}

	if createDTO.SKU != nil {
		produto.Sku.SetValid(*createDTO.SKU)
	}

	if createDTO.PermiteObservacao != nil {
		produto.PermiteObservacao.SetValid(*createDTO.PermiteObservacao)
	} else {
		// Valor padrão é TRUE
		produto.PermiteObservacao.SetValid(true)
	}

	if createDTO.Ordem != nil {
		produto.Ordem.SetValid(int(*createDTO.Ordem))
	}

	if createDTO.ImagemURL != nil {
		produto.ImagemURL.SetValid(*createDTO.ImagemURL)
	}

	// Inserir o produto
	if err := produto.Insert(r.Context(), tx, boil.Infer()); err != nil {
		api.Logger.Error("erro ao inserir produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating product"})
		return
	}

	// Inserir preços do produto
	for _, precoDTO := range createDTO.Precos {
		preco := &models_sql_boiler.ProdutoPreco{
			ID:               uuid.New().String(),
			IDProduto:        produto.ID,
			IDCategoriaOpcao: precoDTO.IDCategoriaOpcao,
			Disponivel:       precoDTO.Disponivel,
		}

		// Converter e definir preço base
		precoBase, err := decimalutils.FromString(precoDTO.PrecoBase)
		if err != nil {
			api.Logger.Error("erro ao converter preço base", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco_base format"})
			return
		}
		preco.PrecoBase = precoBase

		// Converter e definir preço promocional, se fornecido
		if precoDTO.PrecoPromocional != nil {
			precoPromocional, err := decimalutils.FromStringToNullDecimal(*precoDTO.PrecoPromocional)
			if err != nil {
				api.Logger.Error("erro ao converter preço promocional", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco_promocional format"})
				return
			}
			preco.PrecoPromocional = precoPromocional
		}

		// Definir código externo, se fornecido
		if precoDTO.CodigoExternoOpcaoPreco != nil {
			preco.CodigoExternoOpcaoPreco.SetValid(*precoDTO.CodigoExternoOpcaoPreco)
		}

		// Inserir o preço
		if err := preco.Insert(r.Context(), tx, boil.Infer()); err != nil {
			api.Logger.Error("erro ao inserir preço", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating product price"})
			return
		}
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar o produto completo para resposta
	produtoCompleto, err := models_sql_boiler.Produtos(
		qm.Where("id = ?", produto.ID),
		qm.Load(models_sql_boiler.ProdutoRels.IDProdutoProdutoPrecos,
			qm.Load(models_sql_boiler.ProdutoPrecoRels.IDCategoriaOpcaoCategoriaOpco)),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar produto criado", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusCreated, map[string]any{"message": "produto created successfully", "id": produto.ID})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerProdutoToDTO(produtoCompleto)
	jsonutils.EncodeJson(w, r, http.StatusCreated, resp)
}

// handleProdutos_Put atualiza um produto existente
func (api *Api) handleProdutos_Put(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutos_Put")

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
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateProdutoRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se a categoria existe e pertence ao tenant
	_, err = models_sql_boiler.Categorias(
		qm.Where("id = ?", updateDTO.IDCategoria),
		qm.Where("id_tenant = ?", tenantID.String()),
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

	// Buscar produto existente
	produtoExistente, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", id), // <-- Mudança aqui: agora explicitamente mencionando produtos.id
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar dados do produto
	produtoExistente.IDCategoria = updateDTO.IDCategoria
	produtoExistente.Nome = updateDTO.Nome
	produtoExistente.Status = updateDTO.Status

	// Atualizar campos opcionais
	if updateDTO.Descricao != nil {
		produtoExistente.Descricao.SetValid(*updateDTO.Descricao)
	} else {
		produtoExistente.Descricao.Valid = false
	}

	if updateDTO.CodigoExterno != nil {
		produtoExistente.CodigoExterno.SetValid(*updateDTO.CodigoExterno)
	} else {
		produtoExistente.CodigoExterno.Valid = false
	}

	if updateDTO.SKU != nil {
		produtoExistente.Sku.SetValid(*updateDTO.SKU)
	} else {
		produtoExistente.Sku.Valid = false
	}

	if updateDTO.PermiteObservacao != nil {
		produtoExistente.PermiteObservacao.SetValid(*updateDTO.PermiteObservacao)
	}

	if updateDTO.Ordem != nil {
		produtoExistente.Ordem.SetValid(int(*updateDTO.Ordem))
	} else {
		produtoExistente.Ordem.Valid = false
	}

	if updateDTO.ImagemURL != nil {
		produtoExistente.ImagemURL.SetValid(*updateDTO.ImagemURL)
	} else {
		produtoExistente.ImagemURL.Valid = false
	}

	// Atualizar produto no banco
	_, err = produtoExistente.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating product"})
		return
	}

	// Buscar produto atualizado com preços
	produtoAtualizado, err := models_sql_boiler.Produtos(
		qm.Where("id = ?", id),
		qm.Load(models_sql_boiler.ProdutoRels.IDProdutoProdutoPrecos,
			qm.Where("deleted_at IS NULL"),
			qm.Load(models_sql_boiler.ProdutoPrecoRels.IDCategoriaOpcaoCategoriaOpco)),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar produto atualizado", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "produto updated successfully", "id": id})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerProdutoToDTO(produtoAtualizado)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleProdutos_Delete realiza a exclusão lógica de um produto
func (api *Api) handleProdutos_Delete(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutos_Delete")

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

	// Verificar se o produto existe e pertence ao tenant
	// Buscar produto existente
	produto, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", id), // <-- Mudança aqui
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar produto", zap.Error(err))
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

	// Buscar todos os preços do produto
	precos, err := models_sql_boiler.ProdutoPrecos(
		qm.Where("id_produto = ?", id),
		qm.Where("deleted_at IS NULL"),
	).All(r.Context(), tx)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		api.Logger.Error("erro ao buscar preços do produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Realizar soft delete dos preços
	for _, preco := range precos {
		preco.DeletedAt.SetValid(time.Now())
		_, err = preco.Update(r.Context(), tx, boil.Infer())
		if err != nil {
			api.Logger.Error("erro ao deletar preço", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting product prices"})
			return
		}
	}

	// Realizar soft delete do produto
	produto.DeletedAt.SetValid(time.Now())
	_, err = produto.Update(r.Context(), tx, boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao deletar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting product"})
		return
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "produto deleted successfully"})
}

// handleProdutos_PutStatus atualiza o status de um produto (ativo/inativo)
func (api *Api) handleProdutos_PutStatus(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutos_PutStatus")

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
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateProdutoStatusRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Buscar produto existente
	produto, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", id),
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// handleProdutos_PutStatus (continuação)
	// Atualizar status
	produto.Status = updateDTO.Status

	// Salvar alterações
	_, err = produto.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar status do produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "status updated successfully"})
}

// handleProdutos_PutOrdem atualiza a ordem de exibição de um produto
func (api *Api) handleProdutos_PutOrdem(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutos_PutOrdem")

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
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateProdutoOrdemRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Buscar produto existente
	// Buscar produto existente
	produto, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", id), // <-- Mudança aqui
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar ordem
	produto.Ordem.SetValid(int(updateDTO.Ordem))

	// Salvar alterações
	_, err = produto.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar ordem do produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "ordem updated successfully"})
}

// handleProdutoPrecos_Post adiciona um novo preço a um produto existente
func (api *Api) handleProdutoPrecos_Post(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutoPrecos_Post")

	// Obter ID do produto da URL
	produtoID := chi.URLParam(r, "id")
	if produtoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "produto id is required"})
		return
	}

	// Validar UUID
	_, err := uuid.Parse(produtoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid produto id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	createDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.CreateProdutoPrecoRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o ID do produto na URL corresponde ao ID no DTO
	if produtoID != createDTO.IDProduto {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "path id and body id_produto mismatch"})
		return
	}

	// Verificar se o produto existe e pertence ao tenant
	// Verificar se o produto existe e pertence ao tenant
	produto, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", produtoID), // <-- Mudança aqui
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se a categoria_opcao existe e pertence à categoria do produto
	_, err = models_sql_boiler.CategoriaOpcoes(
		qm.Where("id = ?", createDTO.IDCategoriaOpcao),
		qm.Where("deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = categoria_opcoes.id_categoria"),
		qm.Where("c.id = ? AND c.deleted_at IS NULL", produto.IDCategoria),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "categoria_opcao not found or not associated with product category"})
			return
		}
		api.Logger.Error("erro ao buscar opção de categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se já existe um preço ativo para essa combinação de produto e opção
	existente, err := models_sql_boiler.ProdutoPrecos(
		qm.Where("id_produto = ?", produtoID),
		qm.Where("id_categoria_opcao = ?", createDTO.IDCategoriaOpcao),
		qm.Where("deleted_at IS NULL"),
	).Exists(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao verificar preço existente", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	if existente {
		jsonutils.EncodeJson(w, r, http.StatusConflict, map[string]any{"error": "already exists a price for this product and option"})
		return
	}

	// Criar o novo preço
	preco := &models_sql_boiler.ProdutoPreco{
		ID:               uuid.New().String(),
		IDProduto:        produtoID,
		IDCategoriaOpcao: createDTO.IDCategoriaOpcao,
		Disponivel:       createDTO.Disponivel,
	}

	// Converter e definir preço base
	precoBase, err := decimalutils.FromString(createDTO.PrecoBase)
	if err != nil {
		api.Logger.Error("erro ao converter preço base", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco_base format"})
		return
	}
	preco.PrecoBase = precoBase

	// Converter e definir preço promocional, se fornecido
	if createDTO.PrecoPromocional != nil {
		precoPromocional, err := decimalutils.FromStringToNullDecimal(*createDTO.PrecoPromocional)
		if err != nil {
			api.Logger.Error("erro ao converter preço promocional", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco_promocional format"})
			return
		}
		preco.PrecoPromocional = precoPromocional
	}

	// Definir código externo, se fornecido
	if createDTO.CodigoExternoOpcaoPreco != nil {
		preco.CodigoExternoOpcaoPreco.SetValid(*createDTO.CodigoExternoOpcaoPreco)
	}

	// Inserir o preço
	if err := preco.Insert(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer()); err != nil {
		api.Logger.Error("erro ao inserir preço", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating product price"})
		return
	}

	// Em vez de atribuir manualmente o relacionamento, buscar o preço com relacionamentos
	precoCompleto, err := models_sql_boiler.ProdutoPrecos(
		qm.Where("id = ?", preco.ID),
		qm.Load(models_sql_boiler.ProdutoPrecoRels.IDCategoriaOpcaoCategoriaOpco),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar preço criado", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusCreated, map[string]any{"message": "preco created successfully", "id": preco.ID})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerProdutoPrecoToDTO(precoCompleto)
	jsonutils.EncodeJson(w, r, http.StatusCreated, resp)
}

// handleProdutoPrecos_Put atualiza um preço existente
func (api *Api) handleProdutoPrecos_Put(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutoPrecos_Put")

	// Obter ID do produto e do preço da URL
	produtoID := chi.URLParam(r, "id")
	precoID := chi.URLParam(r, "precoId")
	if produtoID == "" || precoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "produto id and preco id are required"})
		return
	}

	// Validar UUIDs
	_, err := uuid.Parse(produtoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid produto id format"})
		return
	}
	_, err = uuid.Parse(precoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateProdutoPrecoRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o produto existe e pertence ao tenant
	produto, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", produtoID),
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se o preço existe e pertence ao produto
	preco, err := models_sql_boiler.ProdutoPrecos(
		qm.Where("id = ?", precoID),
		qm.Where("id_produto = ?", produtoID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "preco not found or not associated with this produto"})
			return
		}
		api.Logger.Error("erro ao buscar preço", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se a categoria_opcao existe e pertence à categoria do produto
	_, err = models_sql_boiler.CategoriaOpcoes(
		qm.Where("id = ?", updateDTO.IDCategoriaOpcao),
		qm.Where("deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = categoria_opcoes.id_categoria"),
		qm.Where("c.id = ? AND c.deleted_at IS NULL", produto.IDCategoria),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "categoria_opcao not found or not associated with product category"})
			return
		}
		api.Logger.Error("erro ao buscar opção de categoria", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se já existe outro preço ativo para a mesma combinação de produto e opção (exceto o atual)
	if updateDTO.IDCategoriaOpcao != preco.IDCategoriaOpcao {
		existente, err := models_sql_boiler.ProdutoPrecos(
			qm.Where("id_produto = ?", produtoID),
			qm.Where("id_categoria_opcao = ?", updateDTO.IDCategoriaOpcao),
			qm.Where("id != ?", precoID),
			qm.Where("deleted_at IS NULL"),
		).Exists(r.Context(), api.SQLBoilerDB.GetDB())

		if err != nil {
			api.Logger.Error("erro ao verificar preço existente", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
			return
		}

		if existente {
			jsonutils.EncodeJson(w, r, http.StatusConflict, map[string]any{"error": "already exists a price for this product and option"})
			return
		}
	}

	// Atualizar dados do preço
	preco.IDCategoriaOpcao = updateDTO.IDCategoriaOpcao
	preco.Disponivel = updateDTO.Disponivel

	// Converter e definir preço base
	precoBase, err := decimalutils.FromString(updateDTO.PrecoBase)
	if err != nil {
		api.Logger.Error("erro ao converter preço base", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco_base format"})
		return
	}
	preco.PrecoBase = precoBase

	// Converter e definir preço promocional, se fornecido
	if updateDTO.PrecoPromocional != nil {
		precoPromocional, err := decimalutils.FromStringToNullDecimal(*updateDTO.PrecoPromocional)
		if err != nil {
			api.Logger.Error("erro ao converter preço promocional", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco_promocional format"})
			return
		}
		preco.PrecoPromocional = precoPromocional
	}

	// Definir código externo, se fornecido
	if updateDTO.CodigoExternoOpcaoPreco != nil {
		preco.CodigoExternoOpcaoPreco.SetValid(*updateDTO.CodigoExternoOpcaoPreco)
	}

	// Atualizar o preço
	_, err = preco.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar preço", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating product price"})
		return
	}

	// Buscar o preço atualizado com relacionamentos
	precoAtualizado, err := models_sql_boiler.ProdutoPrecos(
		qm.Where("id = ?", precoID),
		qm.Load(models_sql_boiler.ProdutoPrecoRels.IDCategoriaOpcaoCategoriaOpco),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar preço atualizado", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "price updated successfully", "id": precoID})
		return
	}

	// Converter e retornar
	resp := dto.ConvertSQLBoilerProdutoPrecoToDTO(precoAtualizado)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handleProdutoPrecos_Delete realiza a exclusão lógica de um preço
func (api *Api) handleProdutoPrecos_Delete(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutoPrecos_Delete")

	// Obter ID do produto e do preço da URL
	produtoID := chi.URLParam(r, "id")
	precoID := chi.URLParam(r, "precoId")
	if produtoID == "" || precoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "produto id and preco id are required"})
		return
	}

	// Validar UUIDs
	_, err := uuid.Parse(produtoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid produto id format"})
		return
	}
	_, err = uuid.Parse(precoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Verificar se o produto existe e pertence ao tenant
	existe, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", produtoID),
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).Exists(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao verificar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	if !existe {
		jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
		return
	}

	// Verificar se o preço existe e pertence ao produto
	preco, err := models_sql_boiler.ProdutoPrecos(
		qm.Where("id = ?", precoID),
		qm.Where("id_produto = ?", produtoID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "preco not found or not associated with this produto"})
			return
		}
		api.Logger.Error("erro ao buscar preço", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Realizar soft delete do preço
	preco.DeletedAt.SetValid(time.Now())
	_, err = preco.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao deletar preço", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting product price"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "preco deleted successfully"})
}

// handleProdutoPrecos_PutDisponibilidade atualiza a disponibilidade de um preço
func (api *Api) handleProdutoPrecos_PutDisponibilidade(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handleProdutoPrecos_PutDisponibilidade")

	// Obter ID do produto e do preço da URL
	produtoID := chi.URLParam(r, "id")
	precoID := chi.URLParam(r, "precoId")
	if produtoID == "" || precoID == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "produto id and preco id are required"})
		return
	}

	// Validar UUIDs
	_, err := uuid.Parse(produtoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid produto id format"})
		return
	}
	_, err = uuid.Parse(precoID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid preco id format"})
		return
	}

	// Obter tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.UpdateProdutoPrecoDisponibilidadeRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o produto existe e pertence ao tenant
	existe, err := models_sql_boiler.Produtos(
		qm.Where("produtos.id = ?", produtoID),
		qm.Where("produtos.deleted_at IS NULL"),
		qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
		qm.Where("c.id_tenant = ? AND c.deleted_at IS NULL", tenantID.String()),
	).Exists(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao verificar produto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	if !existe {
		jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "produto not found or not authorized"})
		return
	}

	// Verificar se o preço existe e pertence ao produto
	preco, err := models_sql_boiler.ProdutoPrecos(
		qm.Where("id = ?", precoID),
		qm.Where("id_produto = ?", produtoID),
		qm.Where("deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "preco not found or not associated with this produto"})
			return
		}
		api.Logger.Error("erro ao buscar preço", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar disponibilidade
	preco.Disponivel = updateDTO.Disponivel

	// Salvar alterações
	_, err = preco.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar disponibilidade do preço", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "disponibilidade updated successfully"})
}
