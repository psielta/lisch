package api

import (
	"database/sql"
	"errors"
	"gobid/internal/dto"
	"gobid/internal/jsonutils"
	"gobid/internal/models_sql_boiler"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
	"go.uber.org/zap"
)

// handlePedidos_List busca pedidos com filtros e paginação
func (api *Api) handlePedidos_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Parse parâmetros de query
	clienteID := r.URL.Query().Get("id_cliente")
	status := r.URL.Query().Get("status")
	tipoEntrega := r.URL.Query().Get("tipo_entrega")
	dataInicio := r.URL.Query().Get("data_inicio")
	dataFim := r.URL.Query().Get("data_fim")
	codigoPedido := strings.TrimSpace(r.URL.Query().Get("codigo_pedido"))
	finalizado := r.URL.Query().Get("finalizado")
	quitado := r.URL.Query().Get("quitado")

	// Parse limit e offset para paginação
	limit := 20 // Default
	offset := 0 // Default

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Montar as condições de busca
	var queryMods []qm.QueryMod

	// Filtro por tenant
	queryMods = append(queryMods, qm.Where("pedidos.tenant_id = ?", tenantID.String()))
	queryMods = append(queryMods, qm.Where("pedidos.deleted_at IS NULL"))

	// Filtros opcionais
	if clienteID != "" {
		if _, err := uuid.Parse(clienteID); err == nil {
			queryMods = append(queryMods, qm.Where("pedidos.id_cliente = ?", clienteID))
		}
	}

	if status != "" {
		if statusInt, err := strconv.Atoi(status); err == nil {
			queryMods = append(queryMods, qm.Where("pedidos.id_status = ?", statusInt))
		}
	}

	if tipoEntrega != "" && (tipoEntrega == "Delivery" || tipoEntrega == "Retirada") {
		queryMods = append(queryMods, qm.Where("pedidos.tipo_entrega = ?", tipoEntrega))
	}

	if codigoPedido != "" {
		queryMods = append(queryMods, qm.Where("pedidos.codigo_pedido ILIKE ?", "%"+codigoPedido+"%"))
	}

	// Filtros de data
	if dataInicio != "" {
		if data, err := time.Parse("2006-01-02", dataInicio); err == nil {
			queryMods = append(queryMods, qm.Where("pedidos.created_at >= ?", data))
		}
	}

	if dataFim != "" {
		if data, err := time.Parse("2006-01-02", dataFim); err == nil {
			// Adicionar um dia para incluir todo o dia final
			dataFimFinal := data.AddDate(0, 0, 1)
			queryMods = append(queryMods, qm.Where("pedidos.created_at < ?", dataFimFinal))
		}
	}

	if finalizado != "" {
		if finalizadoInt, err := strconv.ParseBool(finalizado); err == nil {
			queryMods = append(queryMods, qm.Where("COALESCE(pedidos.finalizado, false) = ?", finalizadoInt))
		}
	}

	if quitado != "" {
		if quitadoInt, err := strconv.ParseBool(quitado); err == nil {
			queryMods = append(queryMods, qm.Where("COALESCE(pedidos.quitado, false) = ?", quitadoInt))
		}
	}

	// Contar total
	total, err := models_sql_boiler.Pedidos(queryMods...).Count(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao contar pedidos", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Adicionar ordenação e relacionamentos
	queryMods = append(queryMods, qm.OrderBy("pedidos.data_pedido DESC"))
	queryMods = append(queryMods,
		qm.Load(
			qm.Rels(
				models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
				models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
			),
			qm.Where("pedido_item_adicionais.deleted_at IS NULL"),
		),
		// se quiser filtrar deleted_at dos itens,
		// faça outro Load só pros itens:
		qm.Load(
			models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
			qm.Where("pedido_itens.deleted_at IS NULL"),
		),
		qm.Load(models_sql_boiler.PedidoRels.IDClienteCliente),
		qm.Load(models_sql_boiler.PedidoRels.IDStatusPedidoStatus),
	)

	// Adicionar paginação
	queryMods = append(queryMods, qm.Limit(limit))
	queryMods = append(queryMods, qm.Offset(offset))

	// Buscar pedidos
	pedidos, err := models_sql_boiler.Pedidos(queryMods...).All(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao buscar pedidos", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	pedidosDTO := make([]*dto.PedidoResponseDTO, len(pedidos))
	for i, pedido := range pedidos {
		pedidosDTO[i] = dto.PedidoModelToResponse(pedido)
	}

	response := map[string]any{
		"pedidos": pedidosDTO,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, response)
}

// handlePedidos_Get busca um pedido por ID
func (api *Api) handlePedidos_Get(w http.ResponseWriter, r *http.Request) {
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

	// Buscar pedido completo com relacionamentos
	pedido, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", id),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL"),
		qm.Load(
			qm.Rels(
				models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
				models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
			),
			qm.Where("pedido_item_adicionais.deleted_at IS NULL"),
		),
		qm.Load(
			models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
			qm.Where("pedido_itens.deleted_at IS NULL"),
		),
		qm.Load(models_sql_boiler.PedidoRels.IDClienteCliente),
		qm.Load(models_sql_boiler.PedidoRels.IDStatusPedidoStatus),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "pedido not found"})
			return
		}
		api.Logger.Error("erro ao buscar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.PedidoModelToResponse(pedido)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handlePedidos_Post cria um novo pedido
func (api *Api) handlePedidos_Post(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handlePedidos_Post")

	// Obter o tenant ID do contexto
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Decodificar e validar o payload JSON
	createDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.PedidoCreateDTO](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Definir o tenant ID no DTO
	createDTO.TenantID = tenantID.String()

	// Verificar se o cliente existe e pertence ao tenant
	_, err = models_sql_boiler.Clientes(
		qm.Where("id = ?", createDTO.IDCliente),
		qm.Where("tenant_id = ?", tenantID.String()),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "cliente not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar cliente", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se o status existe
	_, err = models_sql_boiler.PedidoStatuses(
		qm.Where("id = ?", createDTO.IDStatus),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "status not found"})
			return
		}
		api.Logger.Error("erro ao buscar status", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se o código do pedido já existe para este tenant
	exists, err := models_sql_boiler.Pedidos(
		qm.Where("codigo_pedido = ?", createDTO.CodigoPedido),
		qm.Where("tenant_id = ?", tenantID.String()),
		qm.Where("deleted_at IS NULL"),
	).Exists(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao verificar código do pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	if exists {
		jsonutils.EncodeJson(w, r, http.StatusConflict, map[string]any{"error": "codigo_pedido already exists"})
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

	// Converter DTO para modelos SQLBoiler
	pedido, itens, _, err := createDTO.ToModels()
	if err != nil {
		api.Logger.Error("erro ao converter DTO para modelo", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid data"})
		return
	}

	// Gerar ID único para o pedido
	pedido.ID = uuid.New().String()

	// Inserir o pedido
	if err := pedido.Insert(r.Context(), tx, boil.Infer()); err != nil {
		api.Logger.Error("erro ao inserir pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating pedido"})
		return
	}

	// Inserir itens do pedido
	for i, item := range itens {
		item.ID = uuid.New().String()
		item.IDPedido = pedido.ID

		if err := item.Insert(r.Context(), tx, boil.Infer()); err != nil {
			api.Logger.Error("erro ao inserir item do pedido", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating pedido item"})
			return
		}

		// Inserir adicionais do item (se houver)
		produtoIndex := i
		if produtoIndex < len(createDTO.Itens) {
			for _, adicionalDTO := range createDTO.Itens[produtoIndex].Adicionais {
				adicional := &models_sql_boiler.PedidoItemAdicional{
					ID:               uuid.New().String(),
					IDPedidoItem:     item.ID,
					IDAdicionalOpcao: adicionalDTO.IDAdicionalOpcao,
					Valor:            adicionalDTO.Valor,
					Quantidade:       adicionalDTO.Quantidade,
				}

				if err := adicional.Insert(r.Context(), tx, boil.Infer()); err != nil {
					api.Logger.Error("erro ao inserir adicional do item", zap.Error(err))
					jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error creating pedido item adicional"})
					return
				}
			}
		}
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar o pedido completo para resposta
	pedidoCompleto, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", pedido.ID),
		qm.Load(
			qm.Rels(
				models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
				models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
			),
			qm.Where("pedido_item_adicionais.deleted_at IS NULL"),
		),
		qm.Load(
			models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
			qm.Where("pedido_itens.deleted_at IS NULL"),
		),
		qm.Load(models_sql_boiler.PedidoRels.IDClienteCliente),
		qm.Load(models_sql_boiler.PedidoRels.IDStatusPedidoStatus),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar pedido criado", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusCreated, map[string]any{"message": "pedido created successfully", "id": pedido.ID})
		return
	}

	// Converter e retornar
	resp := dto.PedidoModelToResponse(pedidoCompleto)
	jsonutils.EncodeJson(w, r, http.StatusCreated, resp)
}

// handlePedidos_Put atualiza um pedido existente
func (api *Api) handlePedidos_Put(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handlePedidos_Put")

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
	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[dto.PedidoUpdateDTO](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Definir o ID e tenant no DTO
	updateDTO.ID = id
	updateDTO.TenantID = tenantID.String()

	// Verificar se o pedido exists e pertence ao tenant
	pedidoExistente, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", id),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL"),
		qm.Load(
			qm.Rels(
				models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
				models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
			),
			qm.Where("pedido_item_adicionais.deleted_at IS NULL"),
		),
		qm.Load(
			models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
			qm.Where("pedido_itens.deleted_at IS NULL"),
		),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "pedido not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Verificar se o código do pedido já existe para outro pedido do mesmo tenant
	if updateDTO.CodigoPedido != pedidoExistente.CodigoPedido {
		exists, err := models_sql_boiler.Pedidos(
			qm.Where("codigo_pedido = ?", updateDTO.CodigoPedido),
			qm.Where("tenant_id = ?", tenantID.String()),
			qm.Where("id != ?", id),
			qm.Where("deleted_at IS NULL"),
		).Exists(r.Context(), api.SQLBoilerDB.GetDB())

		if err != nil {
			api.Logger.Error("erro ao verificar código do pedido", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
			return
		}

		if exists {
			jsonutils.EncodeJson(w, r, http.StatusConflict, map[string]any{"error": "codigo_pedido already exists"})
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

	// Converter DTO para modelos
	pedido, novosItens, _, err := updateDTO.ToModels()
	if err != nil {
		api.Logger.Error("erro ao converter DTO para modelo", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid data"})
		return
	}

	// Atualizar dados do pedido
	_, err = pedido.Update(r.Context(), tx, boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating pedido"})
		return
	}

	// Remover itens e adicionais existentes (soft delete)
	if pedidoExistente.R != nil && pedidoExistente.R.IDPedidoPedidoItens != nil {
		for _, itemExistente := range pedidoExistente.R.IDPedidoPedidoItens {
			// Remover adicionais do item
			if itemExistente.R != nil && itemExistente.R.IDPedidoItemPedidoItemAdicionais != nil {
				for _, adicionalExistente := range itemExistente.R.IDPedidoItemPedidoItemAdicionais {
					adicionalExistente.DeletedAt.SetValid(time.Now())
					_, err = adicionalExistente.Update(r.Context(), tx, boil.Infer())
					if err != nil {
						api.Logger.Error("erro ao remover adicional existente", zap.Error(err))
						jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating pedido"})
						return
					}
				}
			}

			// Remover item
			itemExistente.DeletedAt.SetValid(time.Now())
			_, err = itemExistente.Update(r.Context(), tx, boil.Infer())
			if err != nil {
				api.Logger.Error("erro ao remover item existente", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating pedido"})
				return
			}
		}
	}

	// Inserir novos itens e adicionais
	for i, item := range novosItens {
		item.ID = uuid.New().String()
		item.IDPedido = id

		if err := item.Insert(r.Context(), tx, boil.Infer()); err != nil {
			api.Logger.Error("erro ao inserir novo item do pedido", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating pedido"})
			return
		}

		// Inserir adicionais do item
		produtoIndex := i
		if produtoIndex < len(updateDTO.Itens) {
			for _, adicionalDTO := range updateDTO.Itens[produtoIndex].Adicionais {
				adicional := &models_sql_boiler.PedidoItemAdicional{
					ID:               uuid.New().String(),
					IDPedidoItem:     item.ID,
					IDAdicionalOpcao: adicionalDTO.IDAdicionalOpcao,
					Valor:            adicionalDTO.Valor,
					Quantidade:       adicionalDTO.Quantidade,
				}

				if err := adicional.Insert(r.Context(), tx, boil.Infer()); err != nil {
					api.Logger.Error("erro ao inserir novo adicional", zap.Error(err))
					jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error updating pedido"})
					return
				}
			}
		}
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar pedido atualizado
	pedidoAtualizado, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", id),
		qm.Load(
			qm.Rels(
				models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
				models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
			),
			qm.Where("pedido_item_adicionais.deleted_at IS NULL"),
		),
		qm.Load(
			models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
			qm.Where("pedido_itens.deleted_at IS NULL"),
		),
		qm.Load(models_sql_boiler.PedidoRels.IDClienteCliente),
		qm.Load(models_sql_boiler.PedidoRels.IDStatusPedidoStatus),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		api.Logger.Error("erro ao buscar pedido atualizado", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "pedido updated successfully", "id": id})
		return
	}

	// Converter e retornar
	resp := dto.PedidoModelToResponse(pedidoAtualizado)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handlePedidos_Delete realiza a exclusão lógica de um pedido
func (api *Api) handlePedidos_Delete(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handlePedidos_Delete")

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

	// Verificar se o pedido exists e pertence ao tenant
	pedido, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", id),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL"),
		qm.Load(models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
			qm.Where("deleted_at IS NULL"),
			qm.Load(models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
				qm.Where("deleted_at IS NULL"))),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "pedido not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar pedido", zap.Error(err))
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

	// Remover adicionais dos itens
	if pedido.R != nil && pedido.R.IDPedidoPedidoItens != nil {
		for _, item := range pedido.R.IDPedidoPedidoItens {
			if item.R != nil && item.R.IDPedidoItemPedidoItemAdicionais != nil {
				for _, adicional := range item.R.IDPedidoItemPedidoItemAdicionais {
					adicional.DeletedAt.SetValid(time.Now())
					_, err = adicional.Update(r.Context(), tx, boil.Infer())
					if err != nil {
						api.Logger.Error("erro ao deletar adicional", zap.Error(err))
						jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting pedido"})
						return
					}
				}
			}

			// Remover item
			item.DeletedAt.SetValid(time.Now())
			_, err = item.Update(r.Context(), tx, boil.Infer())
			if err != nil {
				api.Logger.Error("erro ao deletar item", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting pedido"})
				return
			}
		}
	}

	// Realizar soft delete do pedido
	pedido.DeletedAt.SetValid(time.Now())
	_, err = pedido.Update(r.Context(), tx, boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao deletar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "error deleting pedido"})
		return
	}

	// Confirmar transação
	if err := tx.Commit(); err != nil {
		api.Logger.Error("erro ao confirmar transação", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "pedido deleted successfully"})
}

// handlePedidos_PutStatus atualiza o status de um pedido
func (api *Api) handlePedidos_PutStatus(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handlePedidos_PutStatus")

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
	type UpdateStatusRequest struct {
		IDStatus int16 `json:"id_status" validate:"required"`
	}

	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[UpdateStatusRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Verificar se o status existe
	_, err = models_sql_boiler.PedidoStatuses(
		qm.Where("id = ?", updateDTO.IDStatus),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "status not found"})
			return
		}
		api.Logger.Error("erro ao buscar status", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Buscar pedido existente
	pedido, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", id),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "pedido not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar status
	pedido.IDStatus = updateDTO.IDStatus

	// Salvar alterações
	_, err = pedido.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar status do pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "status updated successfully"})
}

// handlePedidos_PutPedidoPronto marca pedido como pronto ou não pronto
func (api *Api) handlePedidos_PutPedidoPronto(w http.ResponseWriter, r *http.Request) {
	api.Logger.Info("handlePedidos_PutPedidoPronto")

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
	type UpdatePedidoProntoRequest struct {
		PedidoPronto int16 `json:"pedido_pronto" validate:"required,oneof=0 1"`
	}

	updateDTO, problems, err := jsonutils.DecodeValidJsonV10[UpdatePedidoProntoRequest](r)
	if err != nil {
		api.Logger.Error("erro ao decodificar/validar JSON", zap.Error(err))
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "invalid request body"})
		}
		return
	}

	// Buscar pedido existente
	pedido, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", id),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL"),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "pedido not found or not authorized"})
			return
		}
		api.Logger.Error("erro ao buscar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Atualizar pedido_pronto
	pedido.PedidoPronto = updateDTO.PedidoPronto

	// Se está marcando como pronto, definir data_pedido_pronto
	if updateDTO.PedidoPronto == 1 {
		pedido.DataPedidoPronto.SetValid(time.Now())
	} else {
		// Se está desmarcando como pronto, limpar data_pedido_pronto
		pedido.DataPedidoPronto.Valid = false
	}

	// Salvar alterações
	_, err = pedido.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer())
	if err != nil {
		api.Logger.Error("erro ao atualizar pedido_pronto", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"message": "pedido_pronto updated successfully"})
}

// handlePedidos_GetByCodigoPedido busca um pedido pelo código
func (api *Api) handlePedidos_GetByCodigoPedido(w http.ResponseWriter, r *http.Request) {
	codigoPedido := chi.URLParam(r, "codigo")
	if codigoPedido == "" {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{"error": "codigo is required"})
		return
	}

	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Buscar pedido pelo código
	pedido, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.codigo_pedido = ?", codigoPedido),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL"),
		qm.Load(
			qm.Rels(
				models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
				models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
			),
			qm.Where("pedido_item_adicionais.deleted_at IS NULL"),
		),
		qm.Load(
			models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
			qm.Where("pedido_itens.deleted_at IS NULL"),
		),
		qm.Load(models_sql_boiler.PedidoRels.IDClienteCliente),
		qm.Load(models_sql_boiler.PedidoRels.IDStatusPedidoStatus),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "pedido not found"})
			return
		}
		api.Logger.Error("erro ao buscar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// Converter para DTO
	resp := dto.PedidoModelToResponse(pedido)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}

// handlePedidos_Count retorna a contagem de pedidos com filtros
func (api *Api) handlePedidos_Count(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	// Parse parâmetros de query (mesmos filtros do List)
	clienteID := r.URL.Query().Get("id_cliente")
	status := r.URL.Query().Get("status")
	tipoEntrega := r.URL.Query().Get("tipo_entrega")
	dataInicio := r.URL.Query().Get("data_inicio")
	dataFim := r.URL.Query().Get("data_fim")
	codigoPedido := strings.TrimSpace(r.URL.Query().Get("codigo_pedido"))

	// Montar as condições de busca
	var queryMods []qm.QueryMod

	// Filtro por tenant
	queryMods = append(queryMods, qm.Where("pedidos.tenant_id = ?", tenantID.String()))
	queryMods = append(queryMods, qm.Where("pedidos.deleted_at IS NULL"))

	// Filtros opcionais (mesma lógica do List)
	if clienteID != "" {
		if _, err := uuid.Parse(clienteID); err == nil {
			queryMods = append(queryMods, qm.Where("pedidos.id_cliente = ?", clienteID))
		}
	}

	if status != "" {
		if statusInt, err := strconv.Atoi(status); err == nil {
			queryMods = append(queryMods, qm.Where("pedidos.id_status = ?", statusInt))
		}
	}

	if tipoEntrega != "" && (tipoEntrega == "Delivery" || tipoEntrega == "Retirada") {
		queryMods = append(queryMods, qm.Where("pedidos.tipo_entrega = ?", tipoEntrega))
	}

	if codigoPedido != "" {
		queryMods = append(queryMods, qm.Where("pedidos.codigo_pedido ILIKE ?", "%"+codigoPedido+"%"))
	}

	// Filtros de data
	if dataInicio != "" {
		if data, err := time.Parse("2006-01-02", dataInicio); err == nil {
			queryMods = append(queryMods, qm.Where("pedidos.data_pedido >= ?", data))
		}
	}

	if dataFim != "" {
		if data, err := time.Parse("2006-01-02", dataFim); err == nil {
			dataFimFinal := data.AddDate(0, 0, 1)
			queryMods = append(queryMods, qm.Where("pedidos.data_pedido < ?", dataFimFinal))
		}
	}

	// Contar total
	total, err := models_sql_boiler.Pedidos(queryMods...).Count(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("erro ao contar pedidos", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{"count": total})
}

// Adicionar ao arquivo pedido_handlers.go

// handlePedidos_GetDadosEdicao busca todos os dados necessários para edição de um pedido
// Inclui o pedido + categorias, produtos e adicionais relacionados (mesmo se soft-deleted)
func (api *Api) handlePedidos_GetDadosEdicao(w http.ResponseWriter, r *http.Request) {
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

	// 1. Buscar pedido completo com relacionamentos
	pedido, err := models_sql_boiler.Pedidos(
		qm.Where("pedidos.id = ?", id),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL"),
		qm.Load(
			qm.Rels(
				models_sql_boiler.PedidoRels.IDPedidoPedidoItens,
				models_sql_boiler.PedidoItemRels.IDPedidoItemPedidoItemAdicionais,
			),
		),
		qm.Load(models_sql_boiler.PedidoRels.IDPedidoPedidoItens),
		qm.Load(models_sql_boiler.PedidoRels.IDClienteCliente),
		qm.Load(models_sql_boiler.PedidoRels.IDStatusPedidoStatus),
	).One(r.Context(), api.SQLBoilerDB.GetDB())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "pedido not found"})
			return
		}
		api.Logger.Error("erro ao buscar pedido", zap.Error(err))
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
		return
	}

	// 2. Filtrar itens do pedido não deletados (fazer manualmente após carregar)
	if pedido.R != nil && pedido.R.IDPedidoPedidoItens != nil {
		itensAtivos := make([]*models_sql_boiler.PedidoItem, 0)
		for _, item := range pedido.R.IDPedidoPedidoItens {
			// Incluir apenas itens não deletados
			if !item.DeletedAt.Valid {
				itensAtivos = append(itensAtivos, item)
			}
		}
		pedido.R.IDPedidoPedidoItens = itensAtivos
	}

	// 3. Extrair IDs únicos dos itens ativos do pedido
	categoriaIDs := make([]string, 0)
	produtoIDs := make([]string, 0)
	categoriaOpcaoIDs := make([]string, 0)
	adicionalOpcaoIDs := make([]string, 0)

	if pedido.R != nil && pedido.R.IDPedidoPedidoItens != nil {
		for _, item := range pedido.R.IDPedidoPedidoItens {
			// Coletar categoria IDs
			categoriaIDs = append(categoriaIDs, item.IDCategoria)

			// Coletar produto IDs
			produtoIDs = append(produtoIDs, item.IDProduto)
			if item.IDProduto2.Valid {
				produtoIDs = append(produtoIDs, item.IDProduto2.String)
			}

			// Coletar categoria opcao IDs (importante para buscar preços corretos)
			if item.IDCategoriaOpcao.Valid {
				categoriaOpcaoIDs = append(categoriaOpcaoIDs, item.IDCategoriaOpcao.String)
			}

			// Coletar adicional opcao IDs
			if item.R != nil && item.R.IDPedidoItemPedidoItemAdicionais != nil {
				for _, adicional := range item.R.IDPedidoItemPedidoItemAdicionais {
					adicionalOpcaoIDs = append(adicionalOpcaoIDs, adicional.IDAdicionalOpcao)
				}
			}
		}
	}

	// Remover duplicatas
	categoriaIDs = api.removeDuplicateStrings(categoriaIDs)
	produtoIDs = api.removeDuplicateStrings(produtoIDs)
	categoriaOpcaoIDs = api.removeDuplicateStrings(categoriaOpcaoIDs)
	adicionalOpcaoIDs = api.removeDuplicateStrings(adicionalOpcaoIDs)

	// 4. Buscar categorias relacionadas (incluindo soft-deleted) com opções específicas
	var categorias models_sql_boiler.CategoriaSlice
	if len(categoriaIDs) > 0 && len(categoriaOpcaoIDs) > 0 {
		categorias, err = models_sql_boiler.Categorias(
			qm.WhereIn("id IN ?", api.convertStringsToInterfaces(categoriaIDs)...),
			qm.Where("id_tenant = ?", tenantID.String()),
			// IMPORTANTE: NÃO filtrar por deleted_at - queremos incluir soft-deleted
			qm.Load(models_sql_boiler.CategoriaRels.CategoriaOpcoes,
				// Carregar APENAS as opções usadas no pedido
				qm.WhereIn("id IN ?", api.convertStringsToInterfaces(categoriaOpcaoIDs)...)),
		).All(r.Context(), api.SQLBoilerDB.GetDB())

		if err != nil {
			api.Logger.Error("erro ao buscar categorias", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
			return
		}
	}

	// 5. Buscar produtos relacionados (incluindo soft-deleted) com preços específicos
	var produtos models_sql_boiler.ProdutoSlice
	if len(produtoIDs) > 0 && len(categoriaOpcaoIDs) > 0 {
		produtos, err = models_sql_boiler.Produtos(
			qm.WhereIn("produtos.id IN ?", api.convertStringsToInterfaces(produtoIDs)...),
			// IMPORTANTE: NÃO filtrar por deleted_at - queremos incluir soft-deleted
			qm.InnerJoin("categorias c on c.id = produtos.id_categoria"),
			qm.Where("c.id_tenant = ?", tenantID.String()),
			qm.Load(models_sql_boiler.ProdutoRels.IDProdutoProdutoPrecos,
				// Carregar APENAS os preços das opções usadas no pedido
				qm.WhereIn("id_categoria_opcao IN ?", api.convertStringsToInterfaces(categoriaOpcaoIDs)...),
				// NÃO filtrar por deleted_at para incluir preços soft-deleted
				qm.Load(models_sql_boiler.ProdutoPrecoRels.IDCategoriaOpcaoCategoriaOpco)),
		).All(r.Context(), api.SQLBoilerDB.GetDB())

		if err != nil {
			api.Logger.Error("erro ao buscar produtos", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
			return
		}
	}

	// 6. Buscar adicionais relacionados (incluindo soft-deleted) com opções específicas
	var adicionais models_sql_boiler.CategoriaAdicionalSlice
	if len(adicionalOpcaoIDs) > 0 {
		// Primeiro, buscar os IDs dos adicionais a partir das opções ESPECÍFICAS do pedido
		adicionalIDs, err := models_sql_boiler.CategoriaAdicionalOpcoes(
			qm.Select("DISTINCT id_categoria_adicional"),
			qm.WhereIn("id IN ?", api.convertStringsToInterfaces(adicionalOpcaoIDs)...),
			// IMPORTANTE: NÃO filtrar por deleted_at para pegar opções soft-deleted
		).All(r.Context(), api.SQLBoilerDB.GetDB())

		if err != nil {
			api.Logger.Error("erro ao buscar IDs de adicionais", zap.Error(err))
			jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
			return
		}

		if len(adicionalIDs) > 0 {
			adicionalIDsStrings := make([]string, len(adicionalIDs))
			for i, adicionalID := range adicionalIDs {
				adicionalIDsStrings[i] = adicionalID.IDCategoriaAdicional
			}

			adicionais, err = models_sql_boiler.CategoriaAdicionais(
				qm.WhereIn("categoria_adicionais.id IN ?", api.convertStringsToInterfaces(adicionalIDsStrings)...),
				// IMPORTANTE: NÃO filtrar por deleted_at para pegar adicionais soft-deleted
				qm.InnerJoin("categorias c on c.id = categoria_adicionais.id_categoria"),
				qm.Where("c.id_tenant = ?", tenantID.String()),
				qm.Load(models_sql_boiler.CategoriaAdicionalRels.IDCategoriaAdicionalCategoriaAdicionalOpcoes,
					// Carregar APENAS as opções usadas no pedido
					qm.WhereIn("id IN ?", api.convertStringsToInterfaces(adicionalOpcaoIDs)...)),
			).All(r.Context(), api.SQLBoilerDB.GetDB())

			if err != nil {
				api.Logger.Error("erro ao buscar adicionais", zap.Error(err))
				jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "internal server error"})
				return
			}
		}
	}

	// 7. Converter para DTO e retornar
	resp := dto.ConvertPedidoToEdicaoResponse(pedido, categorias, produtos, adicionais)
	jsonutils.EncodeJson(w, r, http.StatusOK, resp)
}
