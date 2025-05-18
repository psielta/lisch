// internal/dto/categoria_adicional_opcao_dto.go
package dto

import (
	"gobid/internal/models_sql_boiler"
	"time"
)

// ---------- Requests ----------

type CreateCategoriaAdicionalOpcaoRequest struct {
	IDCategoriaAdicional string  `json:"id_categoria_adicional" validate:"omitempty,uuid"`
	Codigo               *string `json:"codigo" validate:"omitempty,max=100"`
	Nome                 string  `json:"nome" validate:"required,min=1,max=100"`
	Valor                string  `json:"valor" validate:"required,numeric"` // string p/ validação
	Status               int16   `json:"status" validate:"oneof=0 1"`
}

type UpdateCategoriaAdicionalOpcaoRequest struct {
	Codigo *string `json:"codigo" validate:"omitempty,max=100"`
	Nome   string  `json:"nome" validate:"required,min=1,max=100"`
	Valor  string  `json:"valor" validate:"required,numeric"`
	Status int16   `json:"status" validate:"oneof=0 1"`
}

// ---------- Responses ----------

type CategoriaAdicionalOpcaoResponse struct {
	ID                   string     `json:"id"`
	SeqID                int64      `json:"seq_id"`
	IDCategoriaAdicional string     `json:"id_categoria_adicional"`
	Codigo               *string    `json:"codigo,omitempty"`
	Nome                 string     `json:"nome"`
	Valor                string     `json:"valor"` // string (formatado)
	Status               int16      `json:"status"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
	DeletedAt            *time.Time `json:"deleted_at,omitempty"`
}

type CategoriaAdicionalOpcaoListResponse struct {
	Opcoes     []CategoriaAdicionalOpcaoResponse `json:"opcoes"`
	TotalCount int64                             `json:"total_count"`
	Limit      int32                             `json:"limit"`
	Offset     int32                             `json:"offset"`
}

// ---------- Conversões ----------

func ConvertSQLBoilerCategoriaAdicionalOpcaoToDTO(
	opc *models_sql_boiler.CategoriaAdicionalOpcao,
) CategoriaAdicionalOpcaoResponse {

	resp := CategoriaAdicionalOpcaoResponse{
		ID:                   opc.ID,
		SeqID:                opc.SeqID,
		IDCategoriaAdicional: opc.IDCategoriaAdicional,
		Nome:                 opc.Nome,
		Valor:                opc.Valor.String(), // Decimal -> string
		Status:               opc.Status,
		CreatedAt:            opc.CreatedAt,
		UpdatedAt:            opc.UpdatedAt,
	}

	if opc.Codigo.Valid {
		resp.Codigo = &opc.Codigo.String
	}
	if opc.DeletedAt.Valid {
		resp.DeletedAt = &opc.DeletedAt.Time
	}

	return resp
}

func ConvertSQLBoilerCategoriaAdicionalOpcoesListToDTO(
	list models_sql_boiler.CategoriaAdicionalOpcaoSlice,
	total int64, limit, offset int32,
) CategoriaAdicionalOpcaoListResponse {

	out := CategoriaAdicionalOpcaoListResponse{
		Opcoes:     make([]CategoriaAdicionalOpcaoResponse, len(list)),
		TotalCount: total,
		Limit:      limit,
		Offset:     offset,
	}

	for i, opc := range list {
		out.Opcoes[i] = ConvertSQLBoilerCategoriaAdicionalOpcaoToDTO(opc)
	}

	return out
}
