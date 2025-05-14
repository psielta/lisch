// internal/dto/produto_preco_dto.go
package dto

import (
	"gobid/internal/models_sql_boiler"
	"time"
)

// --- ProdutoPreco DTOs ---

type CreateProdutoPrecoRequest struct {
	IDProduto               string  `json:"id_produto" validate:"required,uuid"` // Geralmente virá da URL ou contexto
	IDCategoriaOpcao        string  `json:"id_categoria_opcao" validate:"required,uuid"`
	CodigoExternoOpcaoPreco *string `json:"codigo_externo_opcao_preco" validate:"omitempty,max=100"`
	PrecoBase               string  `json:"preco_base" validate:"required,numeric"`
	PrecoPromocional        *string `json:"preco_promocional" validate:"omitempty,numeric"`
	Disponivel              int16   `json:"disponivel" validate:"oneof=0 1"`
}

type UpdateProdutoPrecoRequest struct {
	IDCategoriaOpcao        string  `json:"id_categoria_opcao" validate:"required,uuid"`
	CodigoExternoOpcaoPreco *string `json:"codigo_externo_opcao_preco" validate:"omitempty,max=100"`
	PrecoBase               string  `json:"preco_base" validate:"required,numeric"`
	PrecoPromocional        *string `json:"preco_promocional" validate:"omitempty,numeric"`
	Disponivel              int16   `json:"disponivel" validate:"oneof=0 1"`
}

type ProdutoPrecoResponse struct {
	ID                      string     `json:"id"`
	SeqID                   int64      `json:"seq_id"`
	IDProduto               string     `json:"id_produto"`
	IDCategoriaOpcao        string     `json:"id_categoria_opcao"`
	NomeOpcao               string     `json:"nome_opcao,omitempty"` // Viria de um JOIN com categoria_opcoes
	CodigoExternoOpcaoPreco *string    `json:"codigo_externo_opcao_preco,omitempty"`
	PrecoBase               string     `json:"preco_base"`                  // Retornar como string formatada
	PrecoPromocional        *string    `json:"preco_promocional,omitempty"` // Retornar como string formatada
	Disponivel              int16      `json:"disponivel"`
	CreatedAt               time.Time  `json:"created_at"`
	UpdatedAt               time.Time  `json:"updated_at"`
	DeletedAt               *time.Time `json:"deleted_at,omitempty"`
}

type UpdateProdutoPrecoDisponibilidadeRequest struct {
	Disponivel int16 `json:"disponivel" validate:"required,oneof=0 1"`
}

// ConvertSQLBoilerProdutoPrecoToDTO converte um modelo de preço de produto do SQLBoiler para o DTO
func ConvertSQLBoilerProdutoPrecoToDTO(preco *models_sql_boiler.ProdutoPreco) ProdutoPrecoResponse {
	response := ProdutoPrecoResponse{
		ID:               preco.ID,
		SeqID:            preco.SeqID,
		IDProduto:        preco.IDProduto,
		IDCategoriaOpcao: preco.IDCategoriaOpcao,
		PrecoBase:        preco.PrecoBase.String(), // Converter o Decimal para string
		Disponivel:       preco.Disponivel,
		CreatedAt:        preco.CreatedAt,
		UpdatedAt:        preco.UpdatedAt,
	}

	// Converter campos opcionais
	if preco.CodigoExternoOpcaoPreco.Valid {
		response.CodigoExternoOpcaoPreco = &preco.CodigoExternoOpcaoPreco.String
	}

	if !preco.PrecoPromocional.IsZero() {
		precoPromocional := preco.PrecoPromocional.String()
		response.PrecoPromocional = &precoPromocional
	}

	if preco.DeletedAt.Valid {
		response.DeletedAt = &preco.DeletedAt.Time
	}

	// Adicionar o nome da opção se a relação estiver disponível
	if preco.R != nil && preco.R.IDCategoriaOpcaoCategoriaOpco != nil {
		response.NomeOpcao = preco.R.IDCategoriaOpcaoCategoriaOpco.Nome
	}

	return response
}

// ConvertSQLBoilerProdutoPrecosListToDTO converte uma lista de preços de produto do SQLBoiler para DTOs
func ConvertSQLBoilerProdutoPrecosListToDTO(precos models_sql_boiler.ProdutoPrecoSlice) []ProdutoPrecoResponse {
	result := make([]ProdutoPrecoResponse, len(precos))

	for i, preco := range precos {
		result[i] = ConvertSQLBoilerProdutoPrecoToDTO(preco)
	}

	return result
}
