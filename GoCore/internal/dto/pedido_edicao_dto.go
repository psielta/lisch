// internal/dto/pedido_edicao_dto.go
package dto

import (
	"gobid/internal/models_sql_boiler"
)

// PedidoEdicaoResponse contém todos os dados necessários para edição de um pedido
// Inclui o pedido completo + dados relacionados (mesmo se soft-deleted)
type PedidoEdicaoResponse struct {
	Pedido     PedidoResponseDTO            `json:"pedido"`
	Categorias []CoreCategoriaResponseDTO   `json:"categorias"` // Categorias dos produtos do pedido (incluindo soft-deleted)
	Produtos   []ProdutoResponse            `json:"produtos"`   // Produtos do pedido (incluindo soft-deleted)
	Adicionais []CategoriaAdicionalResponse `json:"adicionais"` // Adicionais dos produtos do pedido (incluindo soft-deleted)
}

// ConvertPedidoToEdicaoResponse converte os dados do pedido para o DTO de edição
func ConvertPedidoToEdicaoResponse(
	pedido *models_sql_boiler.Pedido,
	categorias models_sql_boiler.CategoriaSlice,
	produtos models_sql_boiler.ProdutoSlice,
	adicionais models_sql_boiler.CategoriaAdicionalSlice,
) PedidoEdicaoResponse {

	// Converter pedido
	pedidoDTO := PedidoModelToResponse(pedido)

	// Converter categorias (reutilizando DTO existente)
	categoriasDTO := make([]CoreCategoriaResponseDTO, len(categorias))
	for i, categoria := range categorias {
		categoriasDTO[i] = ConvertSQLBoilerCategoriaToCoreDTO(categoria)
	}

	// Converter produtos (reutilizando DTO existente)
	produtosDTO := make([]ProdutoResponse, len(produtos))
	for i, produto := range produtos {
		produtosDTO[i] = ConvertSQLBoilerProdutoToDTO(produto)
	}

	// Converter adicionais (reutilizando DTO existente)
	adicionaisDTO := make([]CategoriaAdicionalResponse, len(adicionais))
	for i, adicional := range adicionais {
		adicionaisDTO[i] = ConvertSQLBoilerCategoriaAdicionalToDTO(adicional)
	}

	return PedidoEdicaoResponse{
		Pedido:     *pedidoDTO,
		Categorias: categoriasDTO,
		Produtos:   produtosDTO,
		Adicionais: adicionaisDTO,
	}
}
