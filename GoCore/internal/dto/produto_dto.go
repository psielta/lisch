// internal/dto/produto_dto.go
package dto

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// --- Produto DTOs ---

type CreateProdutoRequest struct {
	IDCategoria       uuid.UUID                      `json:"id_categoria" validate:"required,uuid"`
	Nome              string                         `json:"nome" validate:"required,min=1,max=255"`
	Descricao         pgtype.Text                    `json:"descricao"`
	CodigoExterno     pgtype.Text                    `json:"codigo_externo" validate:"omitempty,max=100"`
	SKU               pgtype.Text                    `json:"sku" validate:"omitempty,max=100"`
	PermiteObservacao pgtype.Bool                    `json:"permite_observacao"` // Default é TRUE no DB
	Ordem             pgtype.Int4                    `json:"ordem"`
	ImagemURL         pgtype.Text                    `json:"imagem_url" validate:"omitempty,url,max=2048"`
	Status            int16                          `json:"status" validate:"oneof=0 1"`      // 0 Inativo, 1 Ativo
	Precos            []CreateProdutoPrecoRequestDTO `json:"precos" validate:"omitempty,dive"` // Para criar preços junto com o produto
}

// Usado internamente ao criar produto com preços
type CreateProdutoPrecoRequestDTO struct {
	IDCategoriaOpcao        uuid.UUID   `json:"id_categoria_opcao" validate:"required,uuid"`
	CodigoExternoOpcaoPreco pgtype.Text `json:"codigo_externo_opcao_preco" validate:"omitempty,max=100"`
	PrecoBaseStr            string      `json:"preco_base" validate:"required,numeric"`         // Usar string para validação e converter para pgtype.Numeric
	PrecoPromocionalStr     pgtype.Text `json:"preco_promocional" validate:"omitempty,numeric"` // Usar string para validação
	Disponivel              int16       `json:"disponivel" validate:"oneof=0 1"`
}

type UpdateProdutoRequest struct {
	IDCategoria       uuid.UUID   `json:"id_categoria" validate:"required,uuid"`
	Nome              string      `json:"nome" validate:"required,min=1,max=255"`
	Descricao         pgtype.Text `json:"descricao"`
	CodigoExterno     pgtype.Text `json:"codigo_externo" validate:"omitempty,max=100"`
	SKU               pgtype.Text `json:"sku" validate:"omitempty,max=100"`
	PermiteObservacao pgtype.Bool `json:"permite_observacao"`
	Ordem             pgtype.Int4 `json:"ordem"`
	ImagemURL         pgtype.Text `json:"imagem_url" validate:"omitempty,url,max=2048"`
	Status            int16       `json:"status" validate:"oneof=0 1"`
	// Preços são gerenciados separadamente na atualização para maior controle,
	// ou pode-se adicionar uma lógica para sincronizar/atualizar preços aqui.
}

type ProdutoResponse struct {
	ID                uuid.UUID              `json:"id"`
	SeqID             int64                  `json:"seq_id"`
	IDCategoria       uuid.UUID              `json:"id_categoria"`
	Nome              string                 `json:"nome"`
	Descricao         string                 `json:"descricao,omitempty"`
	CodigoExterno     string                 `json:"codigo_externo,omitempty"`
	SKU               string                 `json:"sku,omitempty"`
	PermiteObservacao bool                   `json:"permite_observacao"`
	Ordem             int32                  `json:"ordem,omitempty"`
	ImagemURL         string                 `json:"imagem_url,omitempty"`
	Status            int16                  `json:"status"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
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
