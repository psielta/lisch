package services

import (
	"context"
	"errors"
	"gobid/internal/dto"
	"gobid/internal/store/pgstore"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.ConstraintName {
			case "clientes_cpf_unq":
				return dto.ClienteResponse{}, errors.New("CPF já cadastrado")
			case "clientes_cnpj_unq":
				return dto.ClienteResponse{}, errors.New("CNPJ já cadastrado")
			case "clientes_telefone_digits_unq":
				return dto.ClienteResponse{}, errors.New("Telefone já cadastrado")
			case "clientes_celular_digits_unq":
				return dto.ClienteResponse{}, errors.New("Celular já cadastrado")
			}
		}
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
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.ConstraintName {
			case "clientes_cpf_unq":
				return dto.ClienteResponse{}, errors.New("CPF já cadastrado")
			case "clientes_cnpj_unq":
				return dto.ClienteResponse{}, errors.New("CNPJ já cadastrado")
			case "clientes_telefone_digits_unq":
				return dto.ClienteResponse{}, errors.New("Telefone já cadastrado")
			case "clientes_celular_digits_unq":
				return dto.ClienteResponse{}, errors.New("Celular já cadastrado")
			}
		}
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
		if errors.Is(err, pgx.ErrNoRows) {
			return dto.ClienteResponse{}, errors.New("cliente não encontrado")
		}
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
		if errors.Is(err, pgx.ErrNoRows) {
			return dto.ClienteResponse{}, errors.New("cliente não encontrado")
		}
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
		if errors.Is(err, pgx.ErrNoRows) {
			return dto.ClienteResponse{}, errors.New("cliente não encontrado")
		}
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
	tipoPessoa,
	telefone,
	celular string,
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
		Column10: telefone,
		Column11: celular,
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
		Column13: telefone,
		Column14: celular,
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

func (cs *ClienteService) ListClientesSmartSearch(ctx context.Context, tenantID uuid.UUID, page, pageSize int, searchTerm string) (dto.PaginatedResponse[dto.ClienteResponse], error) {
	// Calcula o offset baseado na página atual
	offset := (page - 1) * pageSize

	// Prepara parâmetros para a consulta de contagem
	countParams := pgstore.CountClientesSmartSearchFuzzyParams{
		TenantID: tenantID,
		Column2:  searchTerm,
	}

	// Obtém o total de registros
	total, err := cs.queries.CountClientesSmartSearchFuzzy(ctx, countParams)
	if err != nil {
		return dto.PaginatedResponse[dto.ClienteResponse]{}, err
	}

	// Prepara parâmetros para a consulta
	params := pgstore.ListClientesSmartSearchFuzzyParams{
		TenantID: tenantID,
		Limit:    int32(pageSize),
		Column3:  searchTerm,
		Offset:   int32(offset),
	}

	// Obtém os registros
	clientes, err := cs.queries.ListClientesSmartSearchFuzzy(ctx, params)
	if err != nil {
		return dto.PaginatedResponse[dto.ClienteResponse]{}, err
	}

	// Converte os clientes para o formato de resposta
	clientesResponse := make([]dto.ClienteResponse, len(clientes))
	for i, cliente := range clientes {
		clientesResponse[i] = dto.ClienteToResponse(pgstore.Cliente{
			ID:              cliente.ID,
			TenantID:        cliente.TenantID,
			TipoPessoa:      cliente.TipoPessoa,
			NomeRazaoSocial: cliente.NomeRazaoSocial,
			NomeFantasia:    cliente.NomeFantasia,
			Cpf:             cliente.Cpf,
			Cnpj:            cliente.Cnpj,
			Rg:              cliente.Rg,
			Ie:              cliente.Ie,
			Im:              cliente.Im,
			DataNascimento:  cliente.DataNascimento,
			Email:           cliente.Email,
			Telefone:        cliente.Telefone,
			Celular:         cliente.Celular,
			Cep:             cliente.Cep,
			Logradouro:      cliente.Logradouro,
			Numero:          cliente.Numero,
			Complemento:     cliente.Complemento,
			Bairro:          cliente.Bairro,
			Cidade:          cliente.Cidade,
			Uf:              cliente.Uf,
			CreatedAt:       cliente.CreatedAt,
			UpdatedAt:       cliente.UpdatedAt,
			DeletedAt:       cliente.DeletedAt,
		})
	}

	// Retorna a resposta paginada
	return dto.NewPaginated(clientesResponse, page, pageSize, total), nil
}

func (cs *ClienteService) UpsertCliente(ctx context.Context, cliente dto.UpsertClienteDTO) (dto.ClienteResponse, error) {
	clienteDB, err := cs.queries.UpsertCliente(ctx, pgstore.UpsertClienteParams{
		Column1:         toPgTypeText(cliente.ID),
		TenantID:        cliente.TenantID,
		NomeRazaoSocial: cliente.NomeRazaoSocial,
		Celular:         pgtype.Text{String: cliente.Celular, Valid: true},
		Logradouro:      pgtype.Text{String: cliente.Logradouro, Valid: true},
		Numero:          pgtype.Text{String: cliente.Numero, Valid: true},
		Complemento:     pgtype.Text{String: cliente.Complemento, Valid: true},
		Bairro:          pgtype.Text{String: cliente.Bairro, Valid: true},
		TipoPessoa:      cliente.TipoPessoa,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.ConstraintName {
			case "clientes_cpf_unq":
				return dto.ClienteResponse{}, errors.New("CPF já cadastrado")
			case "clientes_cnpj_unq":
				return dto.ClienteResponse{}, errors.New("CNPJ já cadastrado")
			case "clientes_telefone_digits_unq":
				return dto.ClienteResponse{}, errors.New("Telefone já cadastrado")
			case "clientes_celular_digits_unq":
				return dto.ClienteResponse{}, errors.New("Celular já cadastrado")
			}
		}
		return dto.ClienteResponse{}, err
	}
	return dto.ClienteToResponse(clienteDB), nil
}

func toPgTypeText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}
