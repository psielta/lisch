package services

import (
	"context"
	"time"

	"gobid/internal/dto"
	"gobid/internal/store/pgstore"

	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OutboxService struct {
	pool     *pgxpool.Pool
	queries  *pgstore.Queries
	validate *validator.Validate
}

func NewOutboxService(pool *pgxpool.Pool) OutboxService {
	return OutboxService{
		pool:     pool,
		queries:  pgstore.New(pool),
		validate: validator.New(),
	}
}

/* -------------------- Create -------------------- */

func (os *OutboxService) CreateEvent(ctx context.Context, in dto.CreateOutboxEventDTO) (dto.OutboxEventResponse, error) {
	if err := os.validate.Struct(in); err != nil {
		return dto.OutboxEventResponse{}, err
	}

	params := dto.CreateOutboxDTOToParams(&in)

	row, err := os.queries.CreateOutboxEvent(ctx, params)
	if err != nil {
		return dto.OutboxEventResponse{}, err
	}
	// CreateOutboxEvent agora devolve CreateOutboxEventRow (sem TenantID),
	// então convertemos manualmente.
	return dto.OutboxEventResponse{
		ID:            row.ID,
		TenantID:      in.TenantID,
		UserID:        in.UserID,
		AggregateType: row.AggregateType,
		AggregateID:   row.AggregateID,
		EventType:     row.EventType,
		Payload:       row.Payload,
		CreatedAt:     row.CreatedAt,
		Processed:     row.Processed,
		Attempts:      row.Attempts,
	}, nil
}

/* -------------------- List -------------------- */

func (os *OutboxService) ListUnprocessed(ctx context.Context, limit int32) ([]dto.OutboxEventResponse, error) {
	rows, err := os.queries.ListUnprocessedOutboxEventsForProcessing(ctx, limit)
	if err != nil {
		return nil, err
	}
	return dto.OutboxEventRowsToResponses(rows), nil
}

/* -------------------- Marks & cleanup -------------------- */

func (os *OutboxService) MarkProcessed(ctx context.Context, id int64) error {
	return os.queries.MarkOutboxEventProcessed(ctx, id)
}

func (os *OutboxService) MarkError(ctx context.Context, id int64, reason string) error {
	return os.queries.MarkOutboxEventError(ctx, pgstore.MarkOutboxEventErrorParams{
		ID:        id,
		LastError: dto.TextOrNull(reason),
	})
}

func (os *OutboxService) DeleteProcessedOlderThan(ctx context.Context, olderThan time.Time) error {
	return os.queries.DeleteProcessedOutboxEventsOlderThan(ctx, olderThan)
}

/* -------------------- Get -------------------- */

func (os *OutboxService) GetEvent(ctx context.Context, id int64) (dto.OutboxEventResponse, error) {
	ev, err := os.queries.GetOutboxEvent(ctx, id)
	if err != nil {
		return dto.OutboxEventResponse{}, err
	}
	return dto.OutboxEventToResponse(ev), nil
}
