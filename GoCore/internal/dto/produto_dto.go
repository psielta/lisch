// internal/dto/produto_dto.go
package dto

import (
	"gobid/internal/models_sql_boiler"
	"time"
)

// --- Produto DTOs ---

type CreateProdutoRequest struct {
	IDCategoria       string                         `json:"id_categoria" validate:"required,uuid"`
	Nome              string                         `json:"nome" validate:"required,min=1,max=255"`
	Descricao         *string                        `json:"descricao"`
	CodigoExterno     *string                        `json:"codigo_externo" validate:"omitempty,max=100"`
	SKU               *string                        `json:"sku" validate:"omitempty,max=100"`
	PermiteObservacao *bool                          `json:"permite_observacao"` // Default é TRUE no DB
	Ordem             *int32                         `json:"ordem"`
	ImagemURL         *string                        `json:"imagem_url" validate:"omitempty,url,max=2048"`
	Status            int16                          `json:"status" validate:"oneof=0 1"`      // 0 Inativo, 1 Ativo
	Precos            []CreateProdutoPrecoRequestDTO `json:"precos" validate:"omitempty,dive"` // Para criar preços junto com o produto
}

// Usado internamente ao criar produto com preços
type CreateProdutoPrecoRequestDTO struct {
	IDCategoriaOpcao        string  `json:"id_categoria_opcao" validate:"required,uuid"`
	CodigoExternoOpcaoPreco *string `json:"codigo_externo_opcao_preco" validate:"omitempty,max=100"`
	PrecoBase               string  `json:"preco_base" validate:"required,numeric"`         // Usar string para validação e converter depois
	PrecoPromocional        *string `json:"preco_promocional" validate:"omitempty,numeric"` // Usar string para validação
	Disponivel              int16   `json:"disponivel" validate:"oneof=0 1"`
}

type UpdateProdutoRequest struct {
	IDCategoria       string                         `json:"id_categoria" validate:"required,uuid"`
	Nome              string                         `json:"nome" validate:"required,min=1,max=255"`
	Descricao         *string                        `json:"descricao"`
	CodigoExterno     *string                        `json:"codigo_externo" validate:"omitempty,max=100"`
	SKU               *string                        `json:"sku" validate:"omitempty,max=100"`
	PermiteObservacao *bool                          `json:"permite_observacao"`
	Ordem             *int32                         `json:"ordem"`
	ImagemURL         *string                        `json:"imagem_url" validate:"omitempty,url,max=2048"`
	Status            int16                          `json:"status" validate:"oneof=0 1"`
	Precos            []CreateProdutoPrecoRequestDTO `json:"precos" validate:"omitempty,dive"`
}

type ProdutoResponse struct {
	ID                string                 `json:"id"`
	SeqID             int64                  `json:"seq_id"`
	IDCategoria       string                 `json:"id_categoria"`
	Nome              string                 `json:"nome"`
	Descricao         *string                `json:"descricao,omitempty"`
	CodigoExterno     *string                `json:"codigo_externo,omitempty"`
	SKU               *string                `json:"sku,omitempty"`
	PermiteObservacao *bool                  `json:"permite_observacao"`
	Ordem             *int32                 `json:"ordem,omitempty"`
	ImagemURL         *string                `json:"imagem_url,omitempty"`
	Status            int16                  `json:"status"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
	DeletedAt         *time.Time             `json:"deleted_at,omitempty"`
	Precos            []ProdutoPrecoResponse `json:"precos,omitempty"` // Incluir preços ao retornar um produto
}

type ProdutoListResponse struct {
	Produtos   []ProdutoResponse `json:"produtos"`
	TotalCount int64             `json:"total_count"`
	Limit      int32             `json:"limit"`
	Offset     int32             `json:"offset"`
}

type UpdateProdutoStatusRequest struct {
	Status int16 `json:"status" validate:"required,oneof=0 1"`
}

type UpdateProdutoOrdemRequest struct {
	Ordem int32 `json:"ordem" validate:"required,gte=0"`
}

// ConvertSQLBoilerProdutoToDTO converte um modelo de produto do SQLBoiler para o DTO
func ConvertSQLBoilerProdutoToDTO(produto *models_sql_boiler.Produto) ProdutoResponse {
	response := ProdutoResponse{
		ID:          produto.ID,
		SeqID:       produto.SeqID,
		IDCategoria: produto.IDCategoria,
		Nome:        produto.Nome,
		Status:      produto.Status,
		CreatedAt:   produto.CreatedAt,
		UpdatedAt:   produto.UpdatedAt,
	}

	// Converter campos opcionais
	if produto.Descricao.Valid {
		response.Descricao = &produto.Descricao.String
	}

	if produto.CodigoExterno.Valid {
		response.CodigoExterno = &produto.CodigoExterno.String
	}

	if produto.Sku.Valid {
		response.SKU = &produto.Sku.String
	}

	if produto.PermiteObservacao.Valid {
		response.PermiteObservacao = &produto.PermiteObservacao.Bool
	}

	if produto.Ordem.Valid {
		ordem := int32(produto.Ordem.Int)
		response.Ordem = &ordem
	}

	if produto.ImagemURL.Valid {
		response.ImagemURL = &produto.ImagemURL.String
	}

	if produto.DeletedAt.Valid {
		response.DeletedAt = &produto.DeletedAt.Time
	}

	// Converter preços relacionados, se disponíveis
	if produto.R != nil && produto.R.IDProdutoProdutoPrecos != nil {
		response.Precos = make([]ProdutoPrecoResponse, len(produto.R.IDProdutoProdutoPrecos))
		for i, preco := range produto.R.IDProdutoProdutoPrecos {
			response.Precos[i] = ConvertSQLBoilerProdutoPrecoToDTO(preco)
		}
	} else {
		response.Precos = []ProdutoPrecoResponse{}
	}

	return response
}

// ConvertSQLBoilerProdutosListToDTO converte uma lista de produtos do SQLBoiler para DTO
func ConvertSQLBoilerProdutosListToDTO(produtos models_sql_boiler.ProdutoSlice, totalCount int64, limit, offset int32) ProdutoListResponse {
	result := ProdutoListResponse{
		Produtos:   make([]ProdutoResponse, len(produtos)),
		TotalCount: totalCount,
		Limit:      limit,
		Offset:     offset,
	}

	for i, produto := range produtos {
		result.Produtos[i] = ConvertSQLBoilerProdutoToDTO(produto)
	}

	return result
}
