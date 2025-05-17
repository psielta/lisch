// internal/dto/categoria_adicional_dto.go
package dto

import (
	"gobid/internal/models_sql_boiler"
	"time"
)

// ---------- Requests ----------

// Criação de um grupo de adicionais
type CreateCategoriaAdicionalRequest struct {
	IDCategoria string                                 `json:"id_categoria" validate:"required,uuid"`
	CodigoTipo  *string                                `json:"codigo_tipo" validate:"omitempty,max=100"`
	Nome        string                                 `json:"nome" validate:"required,min=1,max=100"`
	Selecao     string                                 `json:"selecao" validate:"required,oneof=U M Q"`
	Minimo      *int32                                 `json:"minimo" validate:"omitempty,gte=0"`
	Limite      *int32                                 `json:"limite" validate:"omitempty,gte=0"`
	Status      int16                                  `json:"status" validate:"oneof=0 1"`
	Opcoes      []CreateCategoriaAdicionalOpcaoRequest `json:"opcoes" validate:"omitempty,dive"`
}

// Atualização (PUT) de um grupo de adicionais
type UpdateCategoriaAdicionalRequest struct {
	IDCategoria string                                 `json:"id_categoria" validate:"required,uuid"`
	CodigoTipo  *string                                `json:"codigo_tipo" validate:"omitempty,max=100"`
	Nome        string                                 `json:"nome" validate:"required,min=1,max=100"`
	Selecao     string                                 `json:"selecao" validate:"required,oneof=U M Q"`
	Minimo      *int32                                 `json:"minimo" validate:"omitempty,gte=0"`
	Limite      *int32                                 `json:"limite" validate:"omitempty,gte=0"`
	Status      int16                                  `json:"status" validate:"oneof=0 1"`
	Opcoes      []CreateCategoriaAdicionalOpcaoRequest `json:"opcoes" validate:"omitempty,dive"`
}

// ---------- Responses ----------

type CategoriaAdicionalResponse struct {
	ID          string                            `json:"id"`
	SeqID       int64                             `json:"seq_id"`
	IDCategoria string                            `json:"id_categoria"`
	CodigoTipo  *string                           `json:"codigo_tipo,omitempty"`
	Nome        string                            `json:"nome"`
	Selecao     string                            `json:"selecao"`
	Minimo      *int32                            `json:"minimo,omitempty"`
	Limite      *int32                            `json:"limite,omitempty"`
	Status      int16                             `json:"status"`
	CreatedAt   time.Time                         `json:"created_at"`
	UpdatedAt   time.Time                         `json:"updated_at"`
	DeletedAt   *time.Time                        `json:"deleted_at,omitempty"`
	Opcoes      []CategoriaAdicionalOpcaoResponse `json:"opcoes,omitempty"`
}

type CategoriaAdicionalListResponse struct {
	Adicionais []CategoriaAdicionalResponse `json:"adicionais"`
	TotalCount int64                        `json:"total_count"`
	Limit      int32                        `json:"limit"`
	Offset     int32                        `json:"offset"`
}

// ---------- Conversões ----------

// ConvertSQLBoilerCategoriaAdicionalToDTO converte model SQLBoiler -> DTO
func ConvertSQLBoilerCategoriaAdicionalToDTO(add *models_sql_boiler.CategoriaAdicional) CategoriaAdicionalResponse {
	resp := CategoriaAdicionalResponse{
		ID:          add.ID,
		SeqID:       add.SeqID,
		IDCategoria: add.IDCategoria,
		Nome:        add.Nome,
		Selecao:     add.Selecao,
		Status:      add.Status,
		CreatedAt:   add.CreatedAt,
		UpdatedAt:   add.UpdatedAt,
	}

	// Campos opcionais
	if add.CodigoTipo.Valid {
		resp.CodigoTipo = &add.CodigoTipo.String
	}
	if add.Minimo.Valid {
		v := int32(add.Minimo.Int)
		resp.Minimo = &v
	}
	if add.Limite.Valid {
		v := int32(add.Limite.Int)
		resp.Limite = &v
	}
	if add.DeletedAt.Valid {
		resp.DeletedAt = &add.DeletedAt.Time
	}

	// Opções carregadas via eager-load
	if add.R != nil && len(add.R.IDCategoriaAdicionalCategoriaAdicionalOpcoes) > 0 {
		resp.Opcoes = make([]CategoriaAdicionalOpcaoResponse, len(add.R.IDCategoriaAdicionalCategoriaAdicionalOpcoes))
		for i, opc := range add.R.IDCategoriaAdicionalCategoriaAdicionalOpcoes {
			resp.Opcoes[i] = ConvertSQLBoilerCategoriaAdicionalOpcaoToDTO(opc)
		}
	}

	return resp
}

// ConvertSQLBoilerCategoriaAdicionaisListToDTO converte slice + paginação
func ConvertSQLBoilerCategoriaAdicionaisListToDTO(
	list models_sql_boiler.CategoriaAdicionalSlice,
	total int64, limit, offset int32,
) CategoriaAdicionalListResponse {

	out := CategoriaAdicionalListResponse{
		Adicionais: make([]CategoriaAdicionalResponse, len(list)),
		TotalCount: total,
		Limit:      limit,
		Offset:     offset,
	}

	for i, add := range list {
		out.Adicionais[i] = ConvertSQLBoilerCategoriaAdicionalToDTO(add)
	}

	return out
}
