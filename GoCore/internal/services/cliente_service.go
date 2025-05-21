package services

import (
	"context"
	"gobid/internal/dto"
	"gobid/internal/store/pgstore"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ClienteService struct {
	pool    *pgxpool.Pool
	queries *pgstore.Queries
}

func NewClienteService(pool *pgxpool.Pool) ClienteService {
	return ClienteService{
		pool:    pool,
		queries: pgstore.New(pool),
	}
}

func (cs *ClienteService) CreateCliente(ctx context.Context, cliente dto.CreateClienteDTO) (dto.ClienteResponse, error) {
	clienteParams, err := dto.CreateDTOToCreateParams(&cliente)
	if err != nil {
		return dto.ClienteResponse{}, err
	}
	clienteDB, err := cs.queries.CreateCliente(ctx, clienteParams)
	if err != nil {
		return dto.ClienteResponse{}, err
	}
	return dto.ClienteToResponse(clienteDB), nil
}

func (cs *ClienteService) UpdateCliente(ctx context.Context, cliente dto.UpdateClienteDTO) (dto.ClienteResponse, error) {
	clienteParams, err := dto.UpdateDTOToUpdateParams(&cliente)
	if err != nil {
		return dto.ClienteResponse{}, err
	}
	clienteDB, err := cs.queries.UpdateCliente(ctx, clienteParams)
	if err != nil {
		return dto.ClienteResponse{}, err
	}
	return dto.ClienteToResponse(clienteDB), nil
}

func (cs *ClienteService) DeleteCliente(ctx context.Context, id uuid.UUID, tenantID uuid.UUID) error {
	err := cs.queries.DeleteCliente(ctx, pgstore.DeleteClienteParams{
		ID:       id,
		TenantID: tenantID,
	})
	if err != nil {
		return err
	}
	return nil
}

func (cs *ClienteService) GetClienteById(ctx context.Context, id uuid.UUID) (dto.ClienteResponse, error) {
	cliente, err := cs.queries.GetCliente(ctx, id)
	if err != nil {
		return dto.ClienteResponse{}, err
	}
	return dto.ClienteToResponse(cliente), nil
}

func (cs *ClienteService) GetClienteByCPF(ctx context.Context, cpf string, tenantID uuid.UUID) (dto.ClienteResponse, error) {
	cliente, err := cs.queries.GetClienteByCPF(ctx, pgstore.GetClienteByCPFParams{
		Cpf:      pgtype.Text{String: cpf, Valid: true},
		TenantID: tenantID,
	})
	if err != nil {
		return dto.ClienteResponse{}, err
	}
	return dto.ClienteToResponse(cliente), nil
}

func (cs *ClienteService) GetClienteByCNPJ(ctx context.Context, cnpj string, tenantID uuid.UUID) (dto.ClienteResponse, error) {
	cliente, err := cs.queries.GetClienteByCNPJ(ctx, pgstore.GetClienteByCNPJParams{
		Cnpj:     pgtype.Text{String: cnpj, Valid: true},
		TenantID: tenantID,
	})
	if err != nil {
		return dto.ClienteResponse{}, err
	}
	return dto.ClienteToResponse(cliente), nil
}

func (cs *ClienteService) ListClientesByTenant(ctx context.Context, tenantID uuid.UUID, limit int32, offset int32) ([]dto.ClienteResponse, error) {
	clientes, err := cs.queries.ListClientesByTenant(ctx, pgstore.ListClientesByTenantParams{
		TenantID: tenantID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return nil, err
	}

	response := make([]dto.ClienteResponse, len(clientes))
	for i, cliente := range clientes {
		response[i] = dto.ClienteToResponse(cliente)
	}
	return response, nil
}

func (cs *ClienteService) CountClientesByTenant(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	return cs.queries.CountClientesByTenant(ctx, tenantID)
}

func (cs *ClienteService) ListClientesPaginated(
	ctx context.Context,
	tenantID uuid.UUID,
	page,
	pageSize int,
	sortBy,
	sortOrder,
	searchTerm,
	nome,
	nomeFantasia,
	cpf,
	cnpj,
	cidade,
	uf,
	tipoPessoa string,
) (dto.PaginatedResponse[dto.ClienteResponse], error) {

	// Calcula o offset baseado na página atual
	offset := (page - 1) * pageSize

	// Prepara parâmetros para a consulta de contagem
	countParams := pgstore.CountClientesPaginatedParams{
		TenantID: tenantID,
		Column2:  searchTerm,
		Column3:  nome,
		Column4:  nomeFantasia,
		Column5:  cpf,
		Column6:  cnpj,
		Column7:  cidade,
		Column8:  uf,
		Column9:  tipoPessoa,
	}

	// Obtém o total de registros
	total, err := cs.queries.CountClientesPaginated(ctx, countParams)
	if err != nil {
		return dto.PaginatedResponse[dto.ClienteResponse]{}, err
	}

	// Prepara parâmetros para a consulta paginada
	listParams := pgstore.ListClientesPaginatedParams{
		TenantID: tenantID,
		Limit:    int32(pageSize),
		Column3:  sortBy,
		Column4:  sortOrder,
		Column5:  searchTerm,
		Column6:  nome,
		Column7:  nomeFantasia,
		Column8:  cpf,
		Column9:  cnpj,
		Column10: cidade,
		Column11: uf,
		Column12: tipoPessoa,
		Offset:   int32(offset),
	}

	// Obtém os registros da página
	clientes, err := cs.queries.ListClientesPaginated(ctx, listParams)
	if err != nil {
		return dto.PaginatedResponse[dto.ClienteResponse]{}, err
	}

	// Converte os clientes para o formato de resposta
	clientesResponse := make([]dto.ClienteResponse, len(clientes))
	for i, cliente := range clientes {
		clientesResponse[i] = dto.ClienteToResponse(cliente)
	}

	// Retorna a resposta paginada
	return dto.NewPaginated(clientesResponse, page, pageSize, total), nil
}
