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
	IDAdicionalOpcao string        `json:"id_adicional_opcao" validate:"required,uuid"`
	Valor            types.Decimal `json:"valor"              validate:"required"`
	Quantidade       int           `json:"quantidade"         validate:"required,min=1"`
}

type PedidoProdutoDTO struct {
	IDCategoria      string                   `json:"id_categoria"       validate:"required,uuid"`
	IDCategoriaOpcao *string                  `json:"id_categoria_opcao" validate:"omitempty,uuid"`
	IDProduto        string                   `json:"id_produto"         validate:"required,uuid"`
	IDProduto2       *string                  `json:"id_produto_2" validate:"omitempty,uuid"`
	Observacao       *string                  `json:"observacao"`
	Valor            types.Decimal            `json:"valor"              validate:"required"`
	Quantidade       int                      `json:"quantidade"         validate:"required,min=1"`
	Adicionais       []PedidoItemAdicionalDTO `json:"adicionais"         validate:"dive"`
}

type PedidoStatusDTO struct {
	ID        int16  `json:"id"`
	Descricao string `json:"descricao"`
}

type PedidoClienteDTO struct {
	ID              string     `json:"id"`
	TenantID        string     `json:"tenant_id"`
	TipoPessoa      string     `json:"tipo_pessoa"`
	NomeRazaoSocial string     `json:"nome_razao_social"`
	NomeFantasia    *string    `json:"nome_fantasia"`
	CPF             *string    `json:"cpf"`
	CNPJ            *string    `json:"cnpj"`
	RG              *string    `json:"rg"`
	Ie              *string    `json:"ie"`
	Im              *string    `json:"im"`
	DataNascimento  *time.Time `json:"data_nascimento"`
	Email           *string    `json:"email"`
	Telefone        *string    `json:"telefone"`
	Celular         *string    `json:"celular"`
	Cep             *string    `json:"cep"`
	Logradouro      *string    `json:"logradouro"`
	Numero          *string    `json:"numero"`
	Complemento     *string    `json:"complemento"`
	Bairro          *string    `json:"bairro"`
	Cidade          *string    `json:"cidade"`
	Uf              *string    `json:"uf"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

// DTO para os itens na resposta completa (com todos os campos da tabela)
type PedidoItemResponseDTO struct {
	ID               string                       `json:"id"`
	SeqID            int64                        `json:"seq_id"`
	IDPedido         string                       `json:"id_pedido"`
	IDProduto        string                       `json:"id_produto"`
	IDProduto2       *string                      `json:"id_produto_2"`
	IDCategoria      string                       `json:"id_categoria"`
	IDCategoriaOpcao *string                      `json:"id_categoria_opcao"`
	Observacao       *string                      `json:"observacao"`
	ValorUnitario    types.Decimal                `json:"valor_unitario"`
	Quantidade       int                          `json:"quantidade"`
	CreatedAt        time.Time                    `json:"created_at"`
	UpdatedAt        time.Time                    `json:"updated_at"`
	DeletedAt        *time.Time                   `json:"deleted_at"`
	Adicionais       []PedidoItemAdicionalFullDTO `json:"adicionais"`
}

// DTO para os adicionais na resposta completa (com todos os campos da tabela)
type PedidoItemAdicionalFullDTO struct {
	ID               string        `json:"id"`
	SeqID            int64         `json:"seq_id"`
	IDPedidoItem     string        `json:"id_pedido_item"`
	IDAdicionalOpcao string        `json:"id_adicional_opcao"`
	Valor            types.Decimal `json:"valor"`
	Quantidade       int           `json:"quantidade"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
	DeletedAt        *time.Time    `json:"deleted_at"`
}

/* ---------------- CREATE / UPDATE -------------------- */

type PedidoCreateDTO struct {
	IDEstabelecimento  string             `json:"id_estabelecimento" validate:"required,uuid"`
	IDCliente          string             `json:"id_cliente"         validate:"required,uuid"`
	CodPedido          string             `json:"cod_pedido"         validate:"required,max=20"`
	Data               time.Time          `json:"data"               validate:"required"`
	GMT                int16              `json:"gmt"                validate:"required"`
	Cupom              *string            `json:"cupom"`
	TipoEntrega        string             `json:"tipo_entrega"       validate:"required,oneof=Delivery Retirada"`
	Prazo              *int               `json:"prazo"`
	PrazoMin           *int               `json:"prazo_min"`
	PrazoMax           *int               `json:"prazo_max"`
	CategoriaPagamento *string            `json:"categoria_pagamento"`
	FormaPagamento     *string            `json:"forma_pagamento"`
	ValorTotal         types.Decimal      `json:"valor_total"        validate:"required"`
	Observacao         *string            `json:"observacao"`
	TaxaEntrega        types.Decimal      `json:"taxa_entrega"       validate:"required"`
	NomeTaxaEntrega    *string            `json:"nome_taxa_entrega"`
	IDStatus           int16              `json:"id_status"          validate:"required"`
	Lat                *types.NullDecimal `json:"lat"`
	Lng                *types.NullDecimal `json:"lng"`
	Produtos           []PedidoProdutoDTO `json:"produtos"           validate:"required,dive"`
}

type PedidoUpdateDTO struct {
	ID string `json:"id" validate:"required,uuid"`
	PedidoCreateDTO
}

func (d *PedidoCreateDTO) Validate() error { return validate.Struct(d) }
func (d *PedidoUpdateDTO) Validate() error { return validate.Struct(d) }

/* ---------------- RESPONSE --------------------------- */

type PedidoResponseDTO struct {
	ID                 string             `json:"id"`
	SeqID              int64              `json:"seq_id"`
	TenantID           string             `json:"tenant_id"`
	IDCliente          string             `json:"id_cliente"`
	CodigoPedido       string             `json:"codigo_pedido"`
	DataPedido         time.Time          `json:"data_pedido"`
	GMT                int16              `json:"gmt"`
	PedidoPronto       int16              `json:"pedido_pronto"`
	DataPedidoPronto   *time.Time         `json:"data_pedido_pronto"`
	Cupom              *string            `json:"cupom"`
	TipoEntrega        string             `json:"tipo_entrega"`
	Prazo              *int               `json:"prazo"`
	PrazoMin           *int               `json:"prazo_min"`
	PrazoMax           *int               `json:"prazo_max"`
	CategoriaPagamento *string            `json:"categoria_pagamento"`
	FormaPagamento     *string            `json:"forma_pagamento"`
	ValorTotal         types.Decimal      `json:"valor_total"`
	Observacao         *string            `json:"observacao"`
	TaxaEntrega        types.Decimal      `json:"taxa_entrega"`
	NomeTaxaEntrega    *string            `json:"nome_taxa_entrega"`
	IDStatus           int16              `json:"id_status"`
	Lat                *types.NullDecimal `json:"lat"`
	LNG                *types.NullDecimal `json:"lng"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
	DeletedAt          *time.Time         `json:"deleted_at"`
	// Relacionamentos
	Status  PedidoStatusDTO         `json:"status"`
	Cliente PedidoClienteDTO        `json:"cliente"`
	Itens   []PedidoItemResponseDTO `json:"itens"`
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
		st.Descricao = p.R.IDStatusPedidoStatus.Descricao
	}

	// Cliente
	cli := PedidoClienteDTO{
		ID:              "",
		TenantID:        "",
		TipoPessoa:      "",
		NomeRazaoSocial: "",
		CreatedAt:       time.Time{},
		UpdatedAt:       time.Time{},
	}
	if p.R != nil && p.R.IDClienteCliente != nil {
		c := p.R.IDClienteCliente
		cli.ID = c.ID
		cli.TenantID = c.TenantID
		cli.TipoPessoa = c.TipoPessoa
		cli.NomeRazaoSocial = c.NomeRazaoSocial
		cli.NomeFantasia = nullStringToPtr(c.NomeFantasia)
		cli.CPF = nullStringToPtr(c.CPF)
		cli.CNPJ = nullStringToPtr(c.CNPJ)
		cli.RG = nullStringToPtr(c.RG)
		cli.Ie = nullStringToPtr(c.Ie)
		cli.Im = nullStringToPtr(c.Im)
		cli.DataNascimento = nullTimeToPtr(c.DataNascimento)
		cli.Email = nullStringToPtr(c.Email)
		cli.Telefone = nullStringToPtr(c.Telefone)
		cli.Celular = nullStringToPtr(c.Celular)
		cli.Cep = nullStringToPtr(c.Cep)
		cli.Logradouro = nullStringToPtr(c.Logradouro)
		cli.Numero = nullStringToPtr(c.Numero)
		cli.Complemento = nullStringToPtr(c.Complemento)
		cli.Bairro = nullStringToPtr(c.Bairro)
		cli.Cidade = nullStringToPtr(c.Cidade)
		cli.Uf = nullStringToPtr(c.Uf)
		cli.CreatedAt = c.CreatedAt
		cli.UpdatedAt = c.UpdatedAt
	}

	// Itens
	var itens []PedidoItemResponseDTO
	if p.R != nil {
		for _, it := range p.R.IDPedidoPedidoItens {
			// Adicionais do item
			var adicionais []PedidoItemAdicionalFullDTO
			if it.R != nil {
				for _, ad := range it.R.IDPedidoItemPedidoItemAdicionais {
					adicionais = append(adicionais, PedidoItemAdicionalFullDTO{
						ID:               ad.ID,
						SeqID:            ad.SeqID,
						IDPedidoItem:     ad.IDPedidoItem,
						IDAdicionalOpcao: ad.IDAdicionalOpcao,
						Valor:            ad.Valor,
						Quantidade:       ad.Quantidade,
						CreatedAt:        ad.CreatedAt,
						UpdatedAt:        ad.UpdatedAt,
						DeletedAt:        nullTimeToPtr(ad.DeletedAt),
					})
				}
			}

			// Item completo
			itemDTO := PedidoItemResponseDTO{
				ID:               it.ID,
				SeqID:            it.SeqID,
				IDPedido:         it.IDPedido,
				IDProduto:        it.IDProduto,
				IDProduto2:       nullStringToPtr(it.IDProduto2),
				IDCategoria:      it.IDCategoria,
				IDCategoriaOpcao: nullStringToPtr(it.IDCategoriaOpcao),
				Observacao:       nullStringToPtr(it.Observacao),
				ValorUnitario:    it.ValorUnitario,
				Quantidade:       it.Quantidade,
				CreatedAt:        it.CreatedAt,
				UpdatedAt:        it.UpdatedAt,
				DeletedAt:        nullTimeToPtr(it.DeletedAt),
				Adicionais:       adicionais,
			}
			itens = append(itens, itemDTO)
		}
	}

	// Construir resposta completa
	resp := &PedidoResponseDTO{
		ID:                 p.ID,
		SeqID:              p.SeqID,
		TenantID:           p.TenantID,
		IDCliente:          p.IDCliente,
		CodigoPedido:       p.CodigoPedido,
		DataPedido:         p.DataPedido,
		GMT:                p.GMT,
		PedidoPronto:       p.PedidoPronto,
		DataPedidoPronto:   nullTimeToPtr(p.DataPedidoPronto),
		Cupom:              nullStringToPtr(p.Cupom),
		TipoEntrega:        p.TipoEntrega,
		Prazo:              nullIntToPtr(p.Prazo),
		PrazoMin:           nullIntToPtr(p.PrazoMin),
		PrazoMax:           nullIntToPtr(p.PrazoMax),
		CategoriaPagamento: nullStringToPtr(p.CategoriaPagamento),
		FormaPagamento:     nullStringToPtr(p.FormaPagamento),
		ValorTotal:         p.ValorTotal,
		Observacao:         nullStringToPtr(p.Observacao),
		TaxaEntrega:        p.TaxaEntrega,
		NomeTaxaEntrega:    nullStringToPtr(p.NomeTaxaEntrega),
		IDStatus:           p.IDStatus,
		Lat:                &p.Lat,
		LNG:                &p.LNG,
		CreatedAt:          p.CreatedAt,
		UpdatedAt:          p.UpdatedAt,
		DeletedAt:          nullTimeToPtr(p.DeletedAt),
		Status:             st,
		Cliente:            cli,
		Itens:              itens,
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

func nullStringToPtr(ns null.String) *string {
	if !ns.Valid {
		return nil
	}
	return &ns.String
}

func nullTimeToPtr(nt null.Time) *time.Time {
	if !nt.Valid {
		return nil
	}
	return &nt.Time
}

func nullIntToPtr(ni null.Int) *int {
	if !ni.Valid {
		return nil
	}
	v := int(ni.Int)
	return &v
}

func nullDecimalToPtr(nd types.NullDecimal) *types.NullDecimal {
	// types.NullDecimal já tem sua lógica interna de null/valid
	// Sempre retornamos o ponteiro, pois o próprio tipo gerencia isso
	return &nd
}

// Funções auxiliares mantidas para compatibilidade
func ptr(ns null.String) *string {
	return nullStringToPtr(ns)
}

func intPtr(ni null.Int) *int {
	return nullIntToPtr(ni)
}
