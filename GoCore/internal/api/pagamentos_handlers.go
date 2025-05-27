package api

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"gobid/internal/jsonutils"
	m "gobid/internal/models_sql_boiler"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
	"go.uber.org/zap"
)

type PedidoPagamentoCreateDTO struct {
	IDPedido       string  `json:"id_pedido"        validate:"required,uuid"`
	IDContaReceber *string `json:"id_conta_receber,omitempty" validate:"omitempty,uuid"`
	Categoria      *string `json:"categoria_pagamento,omitempty"`
	Forma          string  `json:"forma_pagamento"  validate:"required,max=100"`
	ValorPago      string  `json:"valor_pago"       validate:"required,decimal128,max=999999.99"`
	Troco          string  `json:"troco"            validate:"decimal128"`
	Observacao     *string `json:"observacao,omitempty"`
}

// ContasReceberCreateDTO representa geração de parcela/fiado
// ValorPago é opcional – normalmente 0 no início
// Quitado é derivado no banco.
type ContasReceberCreateDTO struct {
	IDPedido    string `json:"id_pedido"   validate:"required,uuid"`
	Parcela     int16  `json:"parcela"     validate:"required,min=1"`
	Vencimento  string `json:"vencimento"  validate:"required,datetime=2006-01-02"`
	ValorDevido string `json:"valor_devido" validate:"required,decimal128,max=999999.99"`
}

type PedidoPagamentoBulkDTO []PedidoPagamentoCreateDTO
type ContasReceberBulkDTO []ContasReceberCreateDTO

func (api *Api) jsonError(w http.ResponseWriter, r *http.Request, code int, msg string) {
	jsonutils.EncodeJson(w, r, code, map[string]any{"error": msg})
}

/*
=========================================================

	Busca segura de pedido por tenant
	=========================================================
*/
func (api *Api) getPedidoByID(r *http.Request, pedidoID string, tenantID uuid.UUID) (*m.Pedido, error) {
	return m.Pedidos(
		qm.Where("pedidos.id = ?", pedidoID),
		qm.Where("pedidos.tenant_id = ?", tenantID.String()),
		qm.Where("pedidos.deleted_at IS NULL")).One(r.Context(), api.SQLBoilerDB.GetDB())
}

/* =========================================================
   Handlers Pedido‑Pagamentos  (/pedido-pagamentos)
   ========================================================= */

func (api *Api) handlePedidoPagamentos_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		api.jsonError(w, r, http.StatusUnauthorized, "unauthorized")
		return
	}

	idPedido := r.URL.Query().Get("id_pedido")
	if _, err := uuid.Parse(idPedido); err != nil {
		api.jsonError(w, r, http.StatusBadRequest, "invalid id_pedido")
		return
	}

	if _, err := api.getPedidoByID(r, idPedido, tenantID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			api.jsonError(w, r, http.StatusNotFound, "pedido not found")
		} else {
			api.Logger.Error("list pagamentos", zap.Error(err))
			api.jsonError(w, r, http.StatusInternalServerError, "internal error")
		}
		return
	}

	pagamentos, err := m.PedidoPagamentos(
		qm.Where("id_pedido = ?", idPedido),
		qm.Where("deleted_at IS NULL"),
		qm.OrderBy("created_at ASC")).All(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("list pagamentos", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "internal error")
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, pagamentos)
}

func (api *Api) handlePedidoPagamentos_Post(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		api.jsonError(w, r, http.StatusUnauthorized, "unauthorized")
		return
	}

	dtoIn, problems, err := jsonutils.DecodeValidJsonV10[PedidoPagamentoCreateDTO](r)
	if err != nil {
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			api.jsonError(w, r, http.StatusBadRequest, "invalid body")
		}
		return
	}

	pedido, err := api.getPedidoByID(r, dtoIn.IDPedido, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			api.jsonError(w, r, http.StatusNotFound, "pedido not found")
		} else {
			api.Logger.Error("pagamento create", zap.Error(err))
			api.jsonError(w, r, http.StatusInternalServerError, "internal error")
		}
		return
	}

	// valida conta‑receber se enviada
	if dtoIn.IDContaReceber != nil {
		if _, err := m.ContasRecebers(
			qm.Where("id = ?", *dtoIn.IDContaReceber),
			qm.Where("id_pedido = ?", pedido.ID)).One(r.Context(), api.SQLBoilerDB.GetDB()); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				api.jsonError(w, r, http.StatusBadRequest, "conta_receber not found for pedido")
			} else {
				api.Logger.Error("pagamento create", zap.Error(err))
				api.jsonError(w, r, http.StatusInternalServerError, "internal error")
			}
			return
		}
	}

	valor, err := api.decimalFromString(dtoIn.ValorPago)
	if err != nil {
		api.jsonError(w, r, http.StatusBadRequest, "valor_pago inválido")
		return
	}
	troco, err := api.nullDecimalFromString(dtoIn.Troco)
	if err != nil {
		api.jsonError(w, r, http.StatusBadRequest, "troco inválido")
		return
	}

	pagamento := &m.PedidoPagamento{
		ID:             uuid.New().String(),
		IDPedido:       pedido.ID,
		FormaPagamento: dtoIn.Forma,
		ValorPago:      valor,
		Troco:          troco,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if dtoIn.IDContaReceber != nil {
		pagamento.IDContaReceber.SetValid(*dtoIn.IDContaReceber)
	}
	if dtoIn.Categoria != nil {
		pagamento.CategoriaPagamento.SetValid(*dtoIn.Categoria)
	}
	if dtoIn.Observacao != nil {
		pagamento.Observacao.SetValid(*dtoIn.Observacao)
	}

	if err := pagamento.Insert(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer()); err != nil {
		api.Logger.Error("pagamento insert", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "error inserting pagamento")
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusCreated, pagamento)
}

func (api *Api) handlePedidoPagamentos_Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	tenantID := api.getTenantIDFromContext(r)
	if _, err := uuid.Parse(id); err != nil || tenantID == uuid.Nil {
		api.jsonError(w, r, http.StatusBadRequest, "invalid id or tenant")
		return
	}

	pagamento, err := m.PedidoPagamentos(qm.Where("id = ?", id)).One(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			api.jsonError(w, r, http.StatusNotFound, "pagamento not found")
		} else {
			api.Logger.Error("pagamento delete", zap.Error(err))
			api.jsonError(w, r, http.StatusInternalServerError, "internal error")
		}
		return
	}

	if _, err := api.getPedidoByID(r, pagamento.IDPedido, tenantID); err != nil {
		api.jsonError(w, r, http.StatusForbidden, "not your pedido")
		return
	}

	pagamento.DeletedAt.Time = time.Now()
	pagamento.DeletedAt.Valid = true
	pagamento.UpdatedAt = time.Now()

	if _, err := pagamento.Update(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer()); err != nil {
		api.Logger.Error("pagamento soft delete", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

/* =========================================================
   Handlers Contas a Receber  (/contas-receber)
   ========================================================= */

func (api *Api) handleContasReceber_Post(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		api.jsonError(w, r, http.StatusUnauthorized, "unauthorized")
		return
	}

	dtoIn, problems, err := jsonutils.DecodeValidJsonV10[ContasReceberCreateDTO](r)
	if err != nil {
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			api.jsonError(w, r, http.StatusBadRequest, "invalid body")
		}
		return
	}

	if _, err := api.getPedidoByID(r, dtoIn.IDPedido, tenantID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			api.jsonError(w, r, http.StatusNotFound, "pedido not found")
		} else {
			api.Logger.Error("conta create", zap.Error(err))
			api.jsonError(w, r, http.StatusInternalServerError, "internal error")
		}
		return
	}

	venc, _ := time.Parse("2006-01-02", dtoIn.Vencimento)
	valor, err := api.decimalFromString(dtoIn.ValorDevido)
	if err != nil {
		api.jsonError(w, r, http.StatusBadRequest, "valor_devido inválido")
		return
	}

	conta := &m.ContasReceber{
		ID:          uuid.New().String(),
		IDPedido:    dtoIn.IDPedido,
		Parcela:     dtoIn.Parcela,
		Vencimento:  venc,
		ValorDevido: valor,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := conta.Insert(r.Context(), api.SQLBoilerDB.GetDB(), boil.Infer()); err != nil {
		api.Logger.Error("conta insert", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "error inserting conta")
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusCreated, conta)
}

func (api *Api) handleContasReceber_List(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		api.jsonError(w, r, http.StatusUnauthorized, "unauthorized")
		return
	}

	idPedido := r.URL.Query().Get("id_pedido")
	mods := []qm.QueryMod{qm.InnerJoin("pedidos ON pedidos.id = contas_receber.id_pedido"), qm.Where("pedidos.tenant_id = ?", tenantID.String())}
	if idPedido != "" {
		mods = append(mods, qm.Where("contas_receber.id_pedido = ?", idPedido))
	}

	contas, err := m.ContasRecebers(mods...).All(r.Context(), api.SQLBoilerDB.GetDB())
	if err != nil {
		api.Logger.Error("contas list", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "internal error")
		return
	}
	jsonutils.EncodeJson(w, r, http.StatusOK, contas)
}

func (api *Api) handleContasReceber_BulkPost(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		api.jsonError(w, r, http.StatusUnauthorized, "unauthorized")
		return
	}

	// ⇣ decodifica array de DTOs
	dtos, problems, err := jsonutils.DecodeValidJsonV10[ContasReceberBulkDTO](r)
	if err != nil {
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			api.jsonError(w, r, http.StatusBadRequest, "invalid body")
		}
		return
	}
	if len(dtos) == 0 {
		api.jsonError(w, r, http.StatusBadRequest, "lista vazia")
		return
	}

	ctx := r.Context()
	db := api.SQLBoilerDB.GetDB()
	tx, _ := db.BeginTx(ctx, nil)
	defer tx.Rollback() // segurança

	// Pré-validação: todos os pedidos existem e pertencem ao tenant
	idsPedido := make([]string, 0, len(dtos))
	for _, d := range dtos {
		idsPedido = append(idsPedido, d.IDPedido)
	}
	idsPedido = api.removeDuplicateStrings(idsPedido)

	count, err := m.Pedidos(
		qm.WhereIn("id IN ?", api.convertStringsToInterfaces(idsPedido)...),
		qm.Where("tenant_id = ?", tenantID.String()),
		qm.Where("deleted_at IS NULL"),
	).Count(ctx, tx)
	if err != nil {
		api.Logger.Error("bulk pre-validação pedidos", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "erro interno")
		return
	}
	if count != int64(len(idsPedido)) {
		api.jsonError(w, r, http.StatusBadRequest, "pedido inexistente ou sem permissão")
		return
	}

	created := make([]*m.ContasReceber, 0, len(dtos))

	for _, dto := range dtos {
		venc, _ := time.Parse("2006-01-02", dto.Vencimento)
		valor, err := api.decimalFromString(dto.ValorDevido)
		if err != nil {
			api.jsonError(w, r, http.StatusBadRequest, "valor_devido inválido")
			return
		}

		cr := &m.ContasReceber{
			ID:          uuid.New().String(),
			IDPedido:    dto.IDPedido,
			Parcela:     dto.Parcela,
			Vencimento:  venc,
			ValorDevido: valor,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		if err := cr.Insert(ctx, tx, boil.Infer()); err != nil {
			api.Logger.Error("conta bulk insert", zap.Error(err))
			api.jsonError(w, r, http.StatusInternalServerError, "erro ao inserir conta")
			return
		}
		created = append(created, cr)
	}

	if err = tx.Commit(); err != nil {
		api.Logger.Error("conta bulk commit", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "erro ao finalizar transação")
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusCreated, created)
}

func (api *Api) handlePedidoPagamentos_BulkPost(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		api.jsonError(w, r, http.StatusUnauthorized, "unauthorized")
		return
	}

	dtos, problems, err := jsonutils.DecodeValidJsonV10[PedidoPagamentoBulkDTO](r)
	if err != nil {
		if problems != nil {
			jsonutils.EncodeJson(w, r, http.StatusBadRequest, problems)
		} else {
			api.jsonError(w, r, http.StatusBadRequest, "invalid body")
		}
		return
	}
	if len(dtos) == 0 {
		api.jsonError(w, r, http.StatusBadRequest, "lista vazia")
		return
	}

	ctx := r.Context()
	db := api.SQLBoilerDB.GetDB()
	tx, _ := db.BeginTx(ctx, nil)
	defer tx.Rollback()

	// valida pedidos de uma vez
	idsPedido := make([]string, 0, len(dtos))
	for _, d := range dtos {
		idsPedido = append(idsPedido, d.IDPedido)
	}
	idsPedido = api.removeDuplicateStrings(idsPedido)

	var count int64
	if count, err = m.Pedidos(
		qm.WhereIn("id IN ?", api.convertStringsToInterfaces(idsPedido)...),
		qm.Where("tenant_id = ?", tenantID.String()),
		qm.Where("deleted_at IS NULL")).
		Count(ctx, tx); err != nil || count != int64(len(idsPedido)) {

		api.jsonError(w, r, http.StatusBadRequest, "pedido inexistente ou sem permissão")
		return
	}

	created := make([]*m.PedidoPagamento, 0, len(dtos))

	for _, dto := range dtos {
		valor, err := api.decimalFromString(dto.ValorPago)
		if err != nil {
			api.jsonError(w, r, http.StatusBadRequest, "valor_pago inválido")
			return
		}
		troco, err := api.nullDecimalFromString(dto.Troco)
		if err != nil {
			api.jsonError(w, r, http.StatusBadRequest, "troco inválido")
			return
		}

		pp := &m.PedidoPagamento{
			ID:             uuid.New().String(),
			IDPedido:       dto.IDPedido,
			FormaPagamento: dto.Forma,
			ValorPago:      valor,
			Troco:          troco,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		if dto.IDContaReceber != nil {
			pp.IDContaReceber.SetValid(*dto.IDContaReceber)
		}
		if dto.Categoria != nil {
			pp.CategoriaPagamento.SetValid(*dto.Categoria)
		}
		if dto.Observacao != nil {
			pp.Observacao.SetValid(*dto.Observacao)
		}

		if err := pp.Insert(ctx, tx, boil.Infer()); err != nil {
			api.Logger.Error("pagamento bulk insert", zap.Error(err))
			api.jsonError(w, r, http.StatusInternalServerError, "erro ao inserir pagamento")
			return
		}
		created = append(created, pp)
	}

	if err = tx.Commit(); err != nil {
		api.Logger.Error("pagamento bulk commit", zap.Error(err))
		api.jsonError(w, r, http.StatusInternalServerError, "erro ao finalizar transação")
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusCreated, created)
}
