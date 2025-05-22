package dto

import (
	"time"

	"github.com/go-playground/validator/v10"
	null "github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/types"

	models "gobid/internal/models_sql_boiler"
)

/* ---------------- helpers & validator ---------------- */

var validate = validator.New()

/* ---------------- DTOs aninhados -------------------- */

type PedidoItemAdicionalDTO struct {
	IDAdicionalOpcao string        `json:"id_adicional_opcao" validate:"required,uuid4"`
	Valor            types.Decimal `json:"valor"              validate:"required"`
	Quantidade       int           `json:"quantidade"         validate:"required,min=1"`
}

type PedidoProdutoDTO struct {
	IDCategoria      string                   `json:"id_categoria"       validate:"required,uuid4"`
	IDCategoriaOpcao *string                  `json:"id_categoria_opcao,omitempty" validate:"omitempty,uuid4"`
	IDProduto        string                   `json:"id_produto"         validate:"required,uuid4"`
	IDProduto2       *string                  `json:"id_produto_2,omitempty" validate:"omitempty,uuid4"`
	Observacao       *string                  `json:"observacao,omitempty"`
	Valor            types.Decimal            `json:"valor"              validate:"required"`
	Quantidade       int                      `json:"quantidade"         validate:"required,min=1"`
	Adicionais       []PedidoItemAdicionalDTO `json:"adicionais"         validate:"dive"`
}

type PedidoStatusDTO struct {
	ID     int16  `json:"id"`
	Status string `json:"status"`
}

type PedidoClienteDTO struct {
	ID        string `json:"id"`
	Nome      string `json:"nome"`
	Telefone  string `json:"telefone"`
	Documento string `json:"documento"`
}

/* ---------------- CREATE / UPDATE -------------------- */

type PedidoCreateDTO struct {
	IDEstabelecimento  string             `json:"id_estabelecimento" validate:"required,uuid4"`
	IDCliente          string             `json:"id_cliente"         validate:"required,uuid4"`
	CodPedido          string             `json:"cod_pedido"         validate:"required,max=20"`
	Data               time.Time          `json:"data"               validate:"required"`
	GMT                int16              `json:"gmt"                validate:"required"`
	Cupom              *string            `json:"cupom,omitempty"`
	TipoEntrega        string             `json:"tipo_entrega"       validate:"required,oneof=Delivery Retirada"`
	Prazo              *int               `json:"prazo,omitempty"`
	PrazoMin           *int               `json:"prazo_min,omitempty"`
	PrazoMax           *int               `json:"prazo_max,omitempty"`
	CategoriaPagamento *string            `json:"categoria_pagamento,omitempty"`
	FormaPagamento     *string            `json:"forma_pagamento,omitempty"`
	ValorTotal         types.Decimal      `json:"valor_total"        validate:"required"`
	Observacao         *string            `json:"observacao,omitempty"`
	TaxaEntrega        types.Decimal      `json:"taxa_entrega"       validate:"required"`
	NomeTaxaEntrega    *string            `json:"nome_taxa_entrega,omitempty"`
	IDStatus           int16              `json:"id_status"          validate:"required"`
	Lat                *types.NullDecimal `json:"lat,omitempty"`
	Lng                *types.NullDecimal `json:"lng,omitempty"`
	Produtos           []PedidoProdutoDTO `json:"produtos"           validate:"required,dive"`
}

type PedidoUpdateDTO struct {
	ID string `json:"id" validate:"required,uuid4"`
	PedidoCreateDTO
}

func (d *PedidoCreateDTO) Validate() error { return validate.Struct(d) }
func (d *PedidoUpdateDTO) Validate() error { return validate.Struct(d) }

/* ---------------- RESPONSE --------------------------- */

type PedidoResponseDTO struct {
	IDEstabelecimento  string             `json:"id_estabelecimento"`
	CodPedido          string             `json:"cod_pedido"`
	Data               time.Time          `json:"data"`
	GMT                int16              `json:"gmt"`
	PedidoPronto       int16              `json:"pedido_pronto"`
	DataPedidoPronto   *time.Time         `json:"data_pedido_pronto,omitempty"`
	Cupom              *string            `json:"cupom,omitempty"`
	TipoEntrega        string             `json:"tipo_entrega"`
	Prazo              *int               `json:"prazo,omitempty"`
	PrazoMin           *int               `json:"prazo_min,omitempty"`
	PrazoMax           *int               `json:"prazo_max,omitempty"`
	CategoriaPagamento *string            `json:"categoria_pagamento,omitempty"`
	FormaPagamento     *string            `json:"forma_pagamento,omitempty"`
	ValorTotal         types.Decimal      `json:"valor_total"`
	Observacao         *string            `json:"observacao,omitempty"`
	TaxaEntrega        types.Decimal      `json:"taxa_entrega"`
	NomeTaxaEntrega    *string            `json:"nome_taxa_entrega,omitempty"`
	Status             PedidoStatusDTO    `json:"status"`
	Produtos           []PedidoProdutoDTO `json:"produtos"`
	Cliente            PedidoClienteDTO   `json:"cliente"`
}

/* ---------------- DTO ➜ modelos ---------------------- */

func (d *PedidoCreateDTO) ToModels() (*models.Pedido, []*models.PedidoItem, []*models.PedidoItemAdicional, error) {
	if err := d.Validate(); err != nil {
		return nil, nil, nil, err
	}

	pedido := &models.Pedido{
		TenantID:           d.IDEstabelecimento,
		IDCliente:          d.IDCliente,
		CodigoPedido:       d.CodPedido,
		DataPedido:         d.Data,
		GMT:                d.GMT,
		PedidoPronto:       0,
		Cupom:              toNullString(d.Cupom),
		TipoEntrega:        d.TipoEntrega,
		Prazo:              toNullInt(d.Prazo),
		PrazoMin:           toNullInt(d.PrazoMin),
		PrazoMax:           toNullInt(d.PrazoMax),
		CategoriaPagamento: toNullString(d.CategoriaPagamento),
		FormaPagamento:     toNullString(d.FormaPagamento),
		ValorTotal:         d.ValorTotal,
		Observacao:         toNullString(d.Observacao),
		TaxaEntrega:        d.TaxaEntrega,
		NomeTaxaEntrega:    toNullString(d.NomeTaxaEntrega),
		IDStatus:           d.IDStatus,
		Lat:                derefNullDecimal(d.Lat),
		LNG:                derefNullDecimal(d.Lng),
	}

	var itens []*models.PedidoItem
	var adds []*models.PedidoItemAdicional

	for _, item := range d.Produtos {
		it := &models.PedidoItem{
			IDCategoria:      item.IDCategoria,
			IDCategoriaOpcao: toNullString(item.IDCategoriaOpcao),
			IDProduto:        item.IDProduto,
			IDProduto2:       toNullString(item.IDProduto2),
			Observacao:       toNullString(item.Observacao),
			ValorUnitario:    item.Valor,
			Quantidade:       item.Quantidade,
		}
		itens = append(itens, it)

		for _, ad := range item.Adicionais {
			adds = append(adds, &models.PedidoItemAdicional{
				IDAdicionalOpcao: ad.IDAdicionalOpcao,
				Valor:            ad.Valor,
				Quantidade:       ad.Quantidade,
			})
		}
	}

	return pedido, itens, adds, nil
}

func (d *PedidoUpdateDTO) ToModels() (*models.Pedido, []*models.PedidoItem, []*models.PedidoItemAdicional, error) {
	p, its, ads, err := d.PedidoCreateDTO.ToModels()
	if err != nil {
		return nil, nil, nil, err
	}
	p.ID = d.ID
	return p, its, ads, nil
}

/* ---------------- modelos ➜ DTO ---------------------- */

func PedidoModelToResponse(p *models.Pedido) *PedidoResponseDTO {
	// Status
	st := PedidoStatusDTO{ID: p.IDStatus}
	if p.R != nil && p.R.IDStatusPedidoStatus != nil {
		st.Status = p.R.IDStatusPedidoStatus.Descricao
	}

	// Cliente
	cli := PedidoClienteDTO{}
	if p.R != nil && p.R.IDClienteCliente != nil {
		c := p.R.IDClienteCliente
		cli.ID = c.ID
		cli.Nome = c.NomeRazaoSocial
		if c.Celular.Valid {
			cli.Telefone = c.Celular.String
		} else if c.Telefone.Valid {
			cli.Telefone = c.Telefone.String
		}
		if c.CPF.Valid {
			cli.Documento = c.CPF.String
		} else if c.CNPJ.Valid {
			cli.Documento = c.CNPJ.String
		}
	}

	// Itens
	var itens []PedidoProdutoDTO
	if p.R != nil {
		for _, it := range p.R.IDPedidoPedidoItens {
			dto := PedidoProdutoDTO{
				IDCategoria:      it.IDCategoria,
				IDCategoriaOpcao: ptr(it.IDCategoriaOpcao),
				IDProduto:        it.IDProduto,
				IDProduto2:       ptr(it.IDProduto2),
				Observacao:       ptr(it.Observacao),
				Valor:            it.ValorUnitario,
				Quantidade:       it.Quantidade,
			}
			for _, ad := range it.R.IDPedidoItemPedidoItemAdicionais {
				dto.Adicionais = append(dto.Adicionais, PedidoItemAdicionalDTO{
					IDAdicionalOpcao: ad.IDAdicionalOpcao,
					Valor:            ad.Valor,
					Quantidade:       ad.Quantidade,
				})
			}
			itens = append(itens, dto)
		}
	}

	resp := &PedidoResponseDTO{
		IDEstabelecimento: p.TenantID,
		CodPedido:         p.CodigoPedido,
		Data:              p.DataPedido,
		GMT:               p.GMT,
		PedidoPronto:      p.PedidoPronto,
		TipoEntrega:       p.TipoEntrega,
		Prazo:             intPtr(p.Prazo),
		PrazoMin:          intPtr(p.PrazoMin),
		PrazoMax:          intPtr(p.PrazoMax),
		ValorTotal:        p.ValorTotal,
		TaxaEntrega:       p.TaxaEntrega,
		Status:            st,
		Produtos:          itens,
		Cliente:           cli,
		Observacao:        ptr(p.Observacao),
		NomeTaxaEntrega:   ptr(p.NomeTaxaEntrega),
	}

	if p.Cupom.Valid {
		resp.Cupom = &p.Cupom.String
	}
	if p.CategoriaPagamento.Valid {
		resp.CategoriaPagamento = &p.CategoriaPagamento.String
	}
	if p.FormaPagamento.Valid {
		resp.FormaPagamento = &p.FormaPagamento.String
	}
	if p.DataPedidoPronto.Valid {
		t := p.DataPedidoPronto.Time
		resp.DataPedidoPronto = &t
	}

	return resp
}

/* ---------------- utilidades ------------------------ */

func toNullString(s *string) null.String {
	if s == nil {
		return null.String{}
	}
	return null.StringFrom(*s)
}
func toNullInt(i *int) null.Int {
	if i == nil {
		return null.Int{}
	}
	return null.IntFrom(*i)
}
func derefNullDecimal(nd *types.NullDecimal) types.NullDecimal {
	if nd == nil {
		return types.NullDecimal{}
	}
	return *nd
}
func ptr(ns null.String) *string {
	if !ns.Valid {
		return nil
	}
	s := ns.String
	return &s
}
func intPtr(ni null.Int) *int {
	if !ni.Valid {
		return nil
	}
	v := int(ni.Int)
	return &v
}
