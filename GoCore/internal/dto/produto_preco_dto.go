// internal/dto/produto_preco_dto.go
package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// --- ProdutoPreco DTOs ---

type CreateProdutoPrecoRequest struct {
	IDProduto               uuid.UUID   `json:"id_produto" validate:"required,uuid"` // Geralmente virá da URL ou contexto
	IDCategoriaOpcao        uuid.UUID   `json:"id_categoria_opcao" validate:"required,uuid"`
	CodigoExternoOpcaoPreco pgtype.Text `json:"codigo_externo_opcao_preco" validate:"omitempty,max=100"`
	PrecoBaseStr            string      `json:"preco_base" validate:"required,numeric"`
	PrecoPromocionalStr     pgtype.Text `json:"preco_promocional" validate:"omitempty,numeric"`
	Disponivel              int16       `json:"disponivel" validate:"oneof=0 1"`
}

type UpdateProdutoPrecoRequest struct {
	IDCategoriaOpcao        uuid.UUID   `json:"id_categoria_opcao" validate:"required,uuid"`
	CodigoExternoOpcaoPreco pgtype.Text `json:"codigo_externo_opcao_preco" validate:"omitempty,max=100"`
	PrecoBaseStr            string      `json:"preco_base" validate:"required,numeric"`
	PrecoPromocionalStr     pgtype.Text `json:"preco_promocional" validate:"omitempty,numeric"`
	Disponivel              int16       `json:"disponivel" validate:"oneof=0 1"`
}

type ProdutoPrecoResponse struct {
	ID                      uuid.UUID `json:"id"`
	SeqID                   int64     `json:"seq_id"`
	IDProduto               uuid.UUID `json:"id_produto"`
	IDCategoriaOpcao        uuid.UUID `json:"id_categoria_opcao"`
	NomeOpcao               string    `json:"nome_opcao,omitempty"` // Viria de um JOIN com categoria_opcoes
	CodigoExternoOpcaoPreco string    `json:"codigo_externo_opcao_preco,omitempty"`
	PrecoBase               string    `json:"preco_base"`                  // Retornar como string formatada
	PrecoPromocional        string    `json:"preco_promocional,omitempty"` // Retornar como string formatada
	Disponivel              int16     `json:"disponivel"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

type UpdateProdutoPrecoDisponibilidadeRequest struct {
	Disponivel int16 `json:"disponivel" validate:"required,oneof=0 1"`
}
