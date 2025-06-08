package dto

import (
	"gobid/internal/store/pgstore"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UpsertOperadorCaixaDTO struct {
	TenantID  uuid.UUID `json:"tenant_id" validate:"required"`
	IDUsuario uuid.UUID `json:"id_usuario" validate:"required"`
	Nome      string    `json:"nome" validate:"required"`
	Codigo    *string   `json:"codigo,omitempty"`
	Ativo     int16     `json:"ativo" validate:"required"`
}

type OperadorCaixaResponse struct {
	ID        uuid.UUID `json:"id"`
	SeqID     int64     `json:"seq_id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	IDUsuario uuid.UUID `json:"id_usuario"`
	Nome      string    `json:"nome"`
	Codigo    *string   `json:"codigo"`
	Ativo     int16     `json:"ativo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GetOperadorCaixaResponse struct {
	ID        uuid.UUID `json:"id"`
	SeqID     int64     `json:"seq_id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	IDUsuario uuid.UUID `json:"id_usuario"`
	Nome      string    `json:"nome"`
	Codigo    *string   `json:"codigo"`
	Ativo     int16     `json:"ativo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func UpsertOperadorCaixaDTOToUpsertOperadorCaixaCompletoParams(dto UpsertOperadorCaixaDTO) pgstore.UpsertOperadorCaixaCompletoParams {
	var codigo pgtype.Text
	if dto.Codigo != nil && *dto.Codigo != "" {
		codigo = pgtype.Text{String: *dto.Codigo, Valid: true}
	} else if dto.Codigo != nil {
		// codigo presente mas vazio: retorna valor nulo
		codigo = pgtype.Text{}
	}

	return pgstore.UpsertOperadorCaixaCompletoParams{
		TenantID:  dto.TenantID,
		IDUsuario: dto.IDUsuario,
		Nome:      dto.Nome,
		Codigo:    codigo,
		Ativo:     dto.Ativo,
	}
}

func UpsertOperadorCaixaCompletoRowToOperadorCaixaResponse(row pgstore.UpsertOperadorCaixaCompletoRow) OperadorCaixaResponse {
	return OperadorCaixaResponse{
		ID:        row.ID,
		SeqID:     row.SeqID,
		TenantID:  row.TenantID,
		IDUsuario: row.IDUsuario,
		Nome:      row.Nome,
		Codigo:    &row.Codigo.String,
		Ativo:     row.Ativo,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
}

func GetOprRowToGetOperadorCaixaResponse(row pgstore.GetOprRow) GetOperadorCaixaResponse {
	return GetOperadorCaixaResponse{
		ID:        row.ID,
		SeqID:     row.SeqID,
		TenantID:  row.TenantID,
		IDUsuario: row.IDUsuario,
		Nome:      row.Nome,
		Codigo:    &row.Codigo.String,
		Ativo:     row.Ativo,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}
}
