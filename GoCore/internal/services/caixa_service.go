package services

import (
	"context"
	"gobid/internal/dto"
	"gobid/internal/store/pgstore"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CaixaService struct {
	pool    *pgxpool.Pool
	queries *pgstore.Queries
}

func NewCaixaService(pool *pgxpool.Pool) CaixaService {
	return CaixaService{
		pool:    pool,
		queries: pgstore.New(pool),
	}
}

func (cs *CaixaService) CreateCaixa(ctx context.Context, caixa dto.InsertCaixaParams) (dto.CaixaResponseDto, error) {
	caixaParams, err := dto.InsertCaixaParamsToInsertCaixaParams(caixa)
	if err != nil {
		return dto.CaixaResponseDto{}, err
	}

	caixaDB, err := cs.queries.InsertCaixa(ctx, caixaParams)
	if err != nil {
		return dto.CaixaResponseDto{}, err
	}

	return dto.CaixaResponseDtoToCaixaResponseDto(caixaDB), nil
}

func (cs *CaixaService) GetCaixaAbertosPorTenant(ctx context.Context, tenantID uuid.UUID) ([]dto.CaixaResponseDto, error) {
	caixas, err := cs.queries.GetCaixaAbertosPorTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	return dto.CaixasToCaixasResponseDto(caixas), nil
}
