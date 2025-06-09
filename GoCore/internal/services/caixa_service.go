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

func (cs *CaixaService) SuprimentoCaixa(ctx context.Context, suprimento dto.SuprimentoCaixaDto) (dto.CaixaMovimentacoDto, error) {
	suprimentoParams, err := dto.SuprimentoCaixaDtoToSuprimentoCaixaParams(suprimento)
	if err != nil {
		return dto.CaixaMovimentacoDto{}, err
	}

	suprimentoDB, err := cs.queries.SuprimentoCaixa(ctx, suprimentoParams)
	if err != nil {
		return dto.CaixaMovimentacoDto{}, err
	}

	return dto.CaixaMovimentacoToCaixaMovimentacoDto(suprimentoDB), nil
}

func (cs *CaixaService) SangriaCaixa(ctx context.Context, sangria dto.SangriaCaixaDto) (dto.CaixaMovimentacoDto, error) {
	sangriaParams, err := dto.SangriaCaixaDtoToSangriaCaixaParams(sangria)
	if err != nil {
		return dto.CaixaMovimentacoDto{}, err
	}

	sangriaDB, err := cs.queries.SangriaCaixa(ctx, sangriaParams)
	if err != nil {
		return dto.CaixaMovimentacoDto{}, err
	}

	return dto.CaixaMovimentacoToCaixaMovimentacoDto(sangriaDB), nil
}

func (cs *CaixaService) RemoveSangriaCaixa(ctx context.Context, id uuid.UUID) error {
	return cs.queries.RemoveSangriaCaixa(ctx, id)
}

func (cs *CaixaService) RemoveSuprimentoCaixa(ctx context.Context, id uuid.UUID) error {
	return cs.queries.RemoveSuprimentoCaixa(ctx, id)
}

func (cs *CaixaService) ResumoCaixaAberto(ctx context.Context, caixaID uuid.UUID) ([]dto.ValorEsperadoFormaDto, error) {
	resumo, err := cs.queries.ResumoCaixaAberto(ctx, caixaID)
	if err != nil {
		return nil, err
	}
	return dto.InterfaceToValorEsperadoFormaDto(resumo)
}

func (cs *CaixaService) InserirValoresInformados(ctx context.Context, valoresInformados dto.InserirValoresInformadosParams) error {
	valoresInformadosParams, err := dto.InserirValoresInformadosParamsToInserirValoresInformadosParams(valoresInformados)
	if err != nil {
		return err
	}
	return cs.queries.InserirValoresInformados(ctx, valoresInformadosParams)
}

func (cs *CaixaService) FecharCaixa(ctx context.Context, fecharCaixa dto.FecharCaixaParams) error {
	fecharCaixaParams, err := dto.FecharCaixaParamsToFecharCaixaParams(fecharCaixa)
	if err != nil {
		return err
	}
	return cs.queries.FecharCaixa(ctx, fecharCaixaParams)
}
