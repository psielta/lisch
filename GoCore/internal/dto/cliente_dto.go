package dto

import (
	"gobid/internal/store/pgstore"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// CreateClienteDTO representa os dados para criação de um cliente
type CreateClienteDTO struct {
	TenantID        uuid.UUID `json:"tenant_id" validate:"required"`
	TipoPessoa      string    `json:"tipo_pessoa" validate:"required,oneof=F J"`
	NomeRazaoSocial string    `json:"nome_razao_social" validate:"required,min=2,max=200"`
	NomeFantasia    string    `json:"nome_fantasia,omitempty" validate:"omitempty,max=200"`
	CPF             string    `json:"cpf,omitempty" validate:"omitempty,len=11,cpf"`
	CNPJ            string    `json:"cnpj,omitempty" validate:"omitempty,len=14,cnpj"`
	RG              string    `json:"rg,omitempty" validate:"omitempty,max=20"`
	IE              string    `json:"ie,omitempty" validate:"omitempty,max=20"`
	IM              string    `json:"im,omitempty" validate:"omitempty,max=20"`
	DataNascimento  string    `json:"data_nascimento,omitempty" validate:"omitempty,datetime=2006-01-02"`
	Email           string    `json:"email,omitempty" validate:"omitempty,email,max=100"`
	Telefone        string    `json:"telefone,omitempty" validate:"omitempty,max=30"`
	Celular         string    `json:"celular,omitempty" validate:"omitempty,max=30"`
	CEP             string    `json:"cep,omitempty" validate:"omitempty,len=8,numeric"`
	Logradouro      string    `json:"logradouro,omitempty" validate:"omitempty,max=200"`
	Numero          string    `json:"numero,omitempty" validate:"omitempty,max=10"`
	Complemento     string    `json:"complemento,omitempty" validate:"omitempty,max=200"`
	Bairro          string    `json:"bairro,omitempty" validate:"omitempty,max=100"`
	Cidade          string    `json:"cidade,omitempty" validate:"omitempty,max=100"`
	UF              string    `json:"uf,omitempty" validate:"omitempty,len=2,uppercase"`
}

type UpsertClienteDTO struct {
	ID              *string   `json:"id,omitempty"`
	TenantID        uuid.UUID `json:"tenant_id" validate:"required"`
	NomeRazaoSocial string    `json:"nome_razao_social" validate:"required,min=2,max=200"`
	Celular         string    `json:"celular,omitempty" validate:"omitempty,max=30"`
	Logradouro      string    `json:"logradouro,omitempty" validate:"omitempty,max=200"`
	Numero          string    `json:"numero,omitempty" validate:"omitempty,max=10"`
	Complemento     string    `json:"complemento,omitempty" validate:"omitempty,max=200"`
	Bairro          string    `json:"bairro,omitempty" validate:"omitempty,max=100"`
	TipoPessoa      string    `json:"tipo_pessoa" validate:"required,oneof=F J"`
}

// UpdateClienteDTO representa os dados para atualização de um cliente
type UpdateClienteDTO struct {
	ID              uuid.UUID `json:"id" validate:"required"`
	TenantID        uuid.UUID `json:"tenant_id" validate:"required"`
	TipoPessoa      string    `json:"tipo_pessoa" validate:"required,oneof=F J"`
	NomeRazaoSocial string    `json:"nome_razao_social" validate:"required,min=2,max=200"`
	NomeFantasia    string    `json:"nome_fantasia,omitempty" validate:"omitempty,max=200"`
	CPF             string    `json:"cpf,omitempty" validate:"omitempty,len=11,cpf"`
	CNPJ            string    `json:"cnpj,omitempty" validate:"omitempty,len=14,cnpj"`
	RG              string    `json:"rg,omitempty" validate:"omitempty,max=20"`
	IE              string    `json:"ie,omitempty" validate:"omitempty,max=20"`
	IM              string    `json:"im,omitempty" validate:"omitempty,max=20"`
	DataNascimento  string    `json:"data_nascimento,omitempty" validate:"omitempty,datetime=2006-01-02"`
	Email           string    `json:"email,omitempty" validate:"omitempty,email,max=100"`
	Telefone        string    `json:"telefone,omitempty" validate:"omitempty,max=30"`
	Celular         string    `json:"celular,omitempty" validate:"omitempty,max=30"`
	CEP             string    `json:"cep,omitempty" validate:"omitempty,len=8,numeric"`
	Logradouro      string    `json:"logradouro,omitempty" validate:"omitempty,max=200"`
	Numero          string    `json:"numero,omitempty" validate:"omitempty,max=10"`
	Complemento     string    `json:"complemento,omitempty" validate:"omitempty,max=200"`
	Bairro          string    `json:"bairro,omitempty" validate:"omitempty,max=100"`
	Cidade          string    `json:"cidade,omitempty" validate:"omitempty,max=100"`
	UF              string    `json:"uf,omitempty" validate:"omitempty,len=2,uppercase"`
}

// ClienteResponse representa a resposta de um cliente para o client
type ClienteResponse struct {
	ID              uuid.UUID `json:"id"`
	TenantID        uuid.UUID `json:"tenant_id"`
	TipoPessoa      string    `json:"tipo_pessoa"`
	NomeRazaoSocial string    `json:"nome_razao_social"`
	NomeFantasia    string    `json:"nome_fantasia"`
	CPF             string    `json:"cpf"`
	CNPJ            string    `json:"cnpj"`
	RG              string    `json:"rg"`
	IE              string    `json:"ie"`
	IM              string    `json:"im"`
	DataNascimento  string    `json:"data_nascimento"`
	Email           string    `json:"email"`
	Telefone        string    `json:"telefone"`
	Celular         string    `json:"celular"`
	CEP             string    `json:"cep"`
	Logradouro      string    `json:"logradouro"`
	Numero          string    `json:"numero"`
	Complemento     string    `json:"complemento"`
	Bairro          string    `json:"bairro"`
	Cidade          string    `json:"cidade"`
	UF              string    `json:"uf"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// CreateDTOToCreateParams converte um CreateClienteDTO para pgstore.CreateClienteParams
func CreateDTOToCreateParams(dto *CreateClienteDTO) (pgstore.CreateClienteParams, error) {
	var params pgstore.CreateClienteParams

	// Campos obrigatórios
	params.TenantID = dto.TenantID
	params.TipoPessoa = dto.TipoPessoa
	params.NomeRazaoSocial = dto.NomeRazaoSocial

	// Campos opcionais - convertendo para pgtype.Text
	params.NomeFantasia = textOrNull(dto.NomeFantasia)

	// Conversão específica baseada no tipo de pessoa
	if dto.TipoPessoa == "F" {
		params.Cpf = textOrNull(dto.CPF)
		params.Cnpj = pgtype.Text{} // Valor nulo para CNPJ
	} else {
		params.Cnpj = textOrNull(dto.CNPJ)
		params.Cpf = pgtype.Text{} // Valor nulo para CPF
	}

	// Demais campos opcionais
	params.Rg = textOrNull(dto.RG)
	params.Ie = textOrNull(dto.IE)
	params.Im = textOrNull(dto.IM)
	params.Email = textOrNull(dto.Email)
	params.Telefone = textOrNull(dto.Telefone)
	params.Celular = textOrNull(dto.Celular)
	params.Cep = textOrNull(dto.CEP)
	params.Logradouro = textOrNull(dto.Logradouro)
	params.Numero = textOrNull(dto.Numero)
	params.Complemento = textOrNull(dto.Complemento)
	params.Bairro = textOrNull(dto.Bairro)
	params.Cidade = textOrNull(dto.Cidade)
	params.Uf = textOrNull(dto.UF)

	// Conversão de data de nascimento
	if dto.DataNascimento != "" {
		data, err := time.Parse("2006-01-02", dto.DataNascimento)
		if err != nil {
			return params, err
		}
		params.DataNascimento = pgtype.Date{
			Time:  data,
			Valid: true,
		}
	}

	return params, nil
}

// UpdateDTOToUpdateParams converte um UpdateClienteDTO para pgstore.UpdateClienteParams
func UpdateDTOToUpdateParams(dto *UpdateClienteDTO) (pgstore.UpdateClienteParams, error) {
	var params pgstore.UpdateClienteParams

	// Campos obrigatórios
	params.ID = dto.ID
	params.TenantID = dto.TenantID
	params.TipoPessoa = dto.TipoPessoa
	params.NomeRazaoSocial = dto.NomeRazaoSocial

	// Campos opcionais - convertendo para pgtype.Text
	params.NomeFantasia = textOrNull(dto.NomeFantasia)

	// Conversão específica baseada no tipo de pessoa
	if dto.TipoPessoa == "F" {
		params.Cpf = textOrNull(dto.CPF)
		params.Cnpj = pgtype.Text{} // Valor nulo para CNPJ
	} else {
		params.Cnpj = textOrNull(dto.CNPJ)
		params.Cpf = pgtype.Text{} // Valor nulo para CPF
	}

	// Demais campos opcionais
	params.Rg = textOrNull(dto.RG)
	params.Ie = textOrNull(dto.IE)
	params.Im = textOrNull(dto.IM)
	params.Email = textOrNull(dto.Email)
	params.Telefone = textOrNull(dto.Telefone)
	params.Celular = textOrNull(dto.Celular)
	params.Cep = textOrNull(dto.CEP)
	params.Logradouro = textOrNull(dto.Logradouro)
	params.Numero = textOrNull(dto.Numero)
	params.Complemento = textOrNull(dto.Complemento)
	params.Bairro = textOrNull(dto.Bairro)
	params.Cidade = textOrNull(dto.Cidade)
	params.Uf = textOrNull(dto.UF)

	// Conversão de data de nascimento
	if dto.DataNascimento != "" {
		data, err := time.Parse("2006-01-02", dto.DataNascimento)
		if err != nil {
			return params, err
		}
		params.DataNascimento = pgtype.Date{
			Time:  data,
			Valid: true,
		}
	}

	return params, nil
}

// ClienteToResponse converte um pgstore.Cliente para ClienteResponse
func ClienteToResponse(cliente pgstore.Cliente) ClienteResponse {
	response := ClienteResponse{
		ID:              cliente.ID,
		TenantID:        cliente.TenantID,
		TipoPessoa:      cliente.TipoPessoa,
		NomeRazaoSocial: cliente.NomeRazaoSocial,
		CreatedAt:       cliente.CreatedAt,
		UpdatedAt:       cliente.UpdatedAt,
	}

	// Converter campos pgtype.Text para string se válidos
	if cliente.NomeFantasia.Valid {
		response.NomeFantasia = cliente.NomeFantasia.String
	}

	if cliente.Cpf.Valid {
		response.CPF = cliente.Cpf.String
	}

	if cliente.Cnpj.Valid {
		response.CNPJ = cliente.Cnpj.String
	}

	if cliente.Rg.Valid {
		response.RG = cliente.Rg.String
	}

	if cliente.Ie.Valid {
		response.IE = cliente.Ie.String
	}

	if cliente.Im.Valid {
		response.IM = cliente.Im.String
	}

	if cliente.DataNascimento.Valid {
		response.DataNascimento = cliente.DataNascimento.Time.Format("2006-01-02")
	}

	if cliente.Email.Valid {
		response.Email = cliente.Email.String
	}

	if cliente.Telefone.Valid {
		response.Telefone = cliente.Telefone.String
	}

	if cliente.Celular.Valid {
		response.Celular = cliente.Celular.String
	}

	if cliente.Cep.Valid {
		response.CEP = cliente.Cep.String
	}

	if cliente.Logradouro.Valid {
		response.Logradouro = cliente.Logradouro.String
	}

	if cliente.Numero.Valid {
		response.Numero = cliente.Numero.String
	}

	if cliente.Complemento.Valid {
		response.Complemento = cliente.Complemento.String
	}

	if cliente.Bairro.Valid {
		response.Bairro = cliente.Bairro.String
	}

	if cliente.Cidade.Valid {
		response.Cidade = cliente.Cidade.String
	}

	if cliente.Uf.Valid {
		response.UF = cliente.Uf.String
	}

	return response
}

// textOrNull converte uma string para pgtype.Text
// Se a string for vazia, o campo será marcado como não válido (null)
func textOrNull(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{
		String: s,
		Valid:  true,
	}
}
