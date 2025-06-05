package dto

import (
	"encoding/json"
	"time"

	"gobid/internal/store/pgstore"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

/* ---------- DTOs de ENTRADA ---------- */

// agora com tenant_id obrigatório
type CreateOutboxEventDTO struct {
	TenantID      uuid.UUID       `json:"tenant_id"      validate:"required"`
	UserID        uuid.UUID       `json:"user_id"        validate:"required"`
	AggregateType string          `json:"aggregate_type" validate:"required,min=1,max=100"`
	AggregateID   string          `json:"aggregate_id"   validate:"required,min=1,max=100"`
	EventType     string          `json:"event_type"     validate:"required,min=1,max=100"`
	Payload       json.RawMessage `json:"payload"        validate:"required"` // JSON livre
}

// DTO → params sqlc
func CreateOutboxDTOToParams(in *CreateOutboxEventDTO) pgstore.CreateOutboxEventParams {
	return pgstore.CreateOutboxEventParams{
		TenantID:      in.TenantID,
		UserID:        in.UserID,
		AggregateType: in.AggregateType,
		AggregateID:   in.AggregateID,
		EventType:     in.EventType,
		Payload:       in.Payload,
	}
}

/* ---------- DTOs de SAÍDA ---------- */

type OutboxEventResponse struct {
	ID            int64           `json:"id"`
	TenantID      uuid.UUID       `json:"tenant_id"`
	UserID        uuid.UUID       `json:"user_id"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   string          `json:"aggregate_id"`
	EventType     string          `json:"event_type"`
	Payload       json.RawMessage `json:"payload"`
	CreatedAt     time.Time       `json:"created_at"`
	Processed     bool            `json:"processed"`
	Attempts      int32           `json:"attempts"`
	LastError     string          `json:"last_error,omitempty"`
}

// model sqlc → response
func OutboxEventToResponse(ev pgstore.GetOutboxEventRow) OutboxEventResponse {
	resp := OutboxEventResponse{
		ID:            ev.ID,
		TenantID:      ev.TenantID,
		UserID:        ev.UserID,
		AggregateType: ev.AggregateType,
		AggregateID:   ev.AggregateID,
		EventType:     ev.EventType,
		Payload:       ev.Payload,
		CreatedAt:     ev.CreatedAt,
		Processed:     ev.Processed,
		Attempts:      ev.Attempts,
	}
	if ev.LastError.Valid {
		resp.LastError = ev.LastError.String
	}
	return resp
}

// linhas da listagem → slice de resposta
func OutboxEventRowsToResponses(rows []pgstore.ListUnprocessedOutboxEventsForProcessingRow) []OutboxEventResponse {
	out := make([]OutboxEventResponse, len(rows))
	for i, r := range rows {
		out[i] = OutboxEventResponse{
			ID:            r.ID,
			TenantID:      r.TenantID,
			UserID:        r.UserID,
			AggregateType: r.AggregateType,
			AggregateID:   r.AggregateID,
			EventType:     r.EventType,
			Payload:       r.Payload,
			Processed:     false,
			Attempts:      0,
		}
	}
	return out
}

/* ---------- Helper genérico ---------- */

func TextOrNull(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}
