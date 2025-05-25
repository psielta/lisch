package dto

import (
	"gobid/internal/models_sql_boiler"
	"time"

	"github.com/google/uuid"
)

// CoreCategoriaCreateDTO representa os dados necessários para criar uma nova categoria com suas opções
type CoreCategoriaCreateDTO struct {
	IDTenant          uuid.UUID `json:"id_tenant" validate:"required"`
	IDCulinaria       int32     `json:"id_culinaria" validate:"required"`
	Nome              string    `json:"nome" validate:"required,min=2,max=100"`
	Descricao         *string   `json:"descricao"`
	Inicio            *string   `json:"inicio" validate:"omitempty,datetime=15:04:05"`
	Fim               *string   `json:"fim" validate:"omitempty,datetime=15:04:05"`
	Ativo             *int16    `json:"ativo" validate:"omitempty,oneof=0 1"`
	OpcaoMeia         *string   `json:"opcao_meia" validate:"omitempty,max=1,oneof=M V ''"`
	Ordem             *int32    `json:"ordem"`
	DisponivelDomingo *int16    `json:"disponivel_domingo" validate:"omitempty,oneof=0 1"`
	DisponivelSegunda *int16    `json:"disponivel_segunda" validate:"omitempty,oneof=0 1"`
	DisponivelTerca   *int16    `json:"disponivel_terca" validate:"omitempty,oneof=0 1"`
	DisponivelQuarta  *int16    `json:"disponivel_quarta" validate:"omitempty,oneof=0 1"`
	DisponivelQuinta  *int16    `json:"disponivel_quinta" validate:"omitempty,oneof=0 1"`
	DisponivelSexta   *int16    `json:"disponivel_sexta" validate:"omitempty,oneof=0 1"`
	DisponivelSabado  *int16    `json:"disponivel_sabado" validate:"omitempty,oneof=0 1"`
	Opcoes            []struct {
		Nome   string `json:"nome" validate:"required,min=2,max=100"`
		Status *int16 `json:"status" validate:"omitempty,oneof=0 1"`
	} `json:"opcoes" validate:"required,min=1,dive"`
}

// CoreCategoriaUpdateDTO representa os dados necessários para atualizar uma categoria existente com suas opções
type CoreCategoriaUpdateDTO struct {
	ID                string  `json:"id" validate:"required,uuid"`
	IDCulinaria       int32   `json:"id_culinaria" validate:"required"`
	Nome              string  `json:"nome" validate:"required,min=2,max=100"`
	Descricao         *string `json:"descricao"`
	Inicio            *string `json:"inicio" validate:"omitempty,datetime=15:04:05"`
	Fim               *string `json:"fim" validate:"omitempty,datetime=15:04:05"`
	Ativo             *int16  `json:"ativo" validate:"omitempty,oneof=0 1"`
	OpcaoMeia         *string `json:"opcao_meia" validate:"omitempty,max=1,oneof=M V ''"`
	Ordem             *int32  `json:"ordem"`
	DisponivelDomingo *int16  `json:"disponivel_domingo" validate:"omitempty,oneof=0 1"`
	DisponivelSegunda *int16  `json:"disponivel_segunda" validate:"omitempty,oneof=0 1"`
	DisponivelTerca   *int16  `json:"disponivel_terca" validate:"omitempty,oneof=0 1"`
	DisponivelQuarta  *int16  `json:"disponivel_quarta" validate:"omitempty,oneof=0 1"`
	DisponivelQuinta  *int16  `json:"disponivel_quinta" validate:"omitempty,oneof=0 1"`
	DisponivelSexta   *int16  `json:"disponivel_sexta" validate:"omitempty,oneof=0 1"`
	DisponivelSabado  *int16  `json:"disponivel_sabado" validate:"omitempty,oneof=0 1"`
	Opcoes            []struct {
		ID     string `json:"id,omitempty"`
		Nome   string `json:"nome" validate:"required,min=2,max=100"`
		Status *int16 `json:"status" validate:"omitempty,oneof=0 1"`
	} `json:"opcoes" validate:"required,min=1,dive"`
}

// CategoriaOpcaoItem representa uma opção de categoria para respostas
type CategoriaOpcaoItem struct {
	ID          uuid.UUID  `json:"id"`
	SeqID       int64      `json:"seq_id"`
	IDCategoria uuid.UUID  `json:"id_categoria"`
	Nome        string     `json:"nome"`
	Status      int16      `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

// CoreCategoriaResponseDTO representa os dados completos de uma categoria com suas opções para resposta
type CoreCategoriaResponseDTO struct {
	ID                uuid.UUID            `json:"id"`
	SeqID             int64                `json:"seq_id"`
	IDTenant          uuid.UUID            `json:"id_tenant"`
	IDCulinaria       int32                `json:"id_culinaria"`
	Nome              string               `json:"nome"`
	Descricao         *string              `json:"descricao"`
	Inicio            string               `json:"inicio"`
	Fim               string               `json:"fim"`
	Ativo             int16                `json:"ativo"`
	OpcaoMeia         string               `json:"opcao_meia"`
	Ordem             *int32               `json:"ordem"`
	DisponivelDomingo int16                `json:"disponivel_domingo"`
	DisponivelSegunda int16                `json:"disponivel_segunda"`
	DisponivelTerca   int16                `json:"disponivel_terca"`
	DisponivelQuarta  int16                `json:"disponivel_quarta"`
	DisponivelQuinta  int16                `json:"disponivel_quinta"`
	DisponivelSexta   int16                `json:"disponivel_sexta"`
	DisponivelSabado  int16                `json:"disponivel_sabado"`
	CreatedAt         time.Time            `json:"created_at"`
	UpdatedAt         time.Time            `json:"updated_at"`
	DeletedAt         *time.Time           `json:"deleted_at,omitempty"`
	Opcoes            []CategoriaOpcaoItem `json:"opcoes"`
}

// convertSQLBoilerCategoriaToCoreDTO converte um modelo de categoria do SQLBoiler para o DTO Core de resposta
func ConvertSQLBoilerCategoriaToCoreDTO(categoria *models_sql_boiler.Categoria) CoreCategoriaResponseDTO {
	// Converter string UUID para uuid.UUID
	id, _ := uuid.Parse(categoria.ID)
	idTenant, _ := uuid.Parse(categoria.IDTenant)

	// Criar o DTO base
	response := CoreCategoriaResponseDTO{
		ID:                id,
		SeqID:             categoria.SeqID,
		IDTenant:          idTenant,
		IDCulinaria:       int32(categoria.IDCulinaria),
		Nome:              categoria.Nome,
		Inicio:            formatTime(categoria.Inicio),
		Fim:               formatTime(categoria.Fim),
		Ativo:             categoria.Ativo,
		DisponivelDomingo: categoria.DisponivelDomingo,
		DisponivelSegunda: categoria.DisponivelSegunda,
		DisponivelTerca:   categoria.DisponivelTerca,
		DisponivelQuarta:  categoria.DisponivelQuarta,
		DisponivelQuinta:  categoria.DisponivelQuinta,
		DisponivelSexta:   categoria.DisponivelSexta,
		DisponivelSabado:  categoria.DisponivelSabado,
		CreatedAt:         categoria.CreatedAt,
		UpdatedAt:         categoria.UpdatedAt,
	}

	// Converter campos opcionais
	if categoria.Descricao.Valid {
		desc := categoria.Descricao.String
		response.Descricao = &desc
	}

	if categoria.OpcaoMeia.Valid {
		response.OpcaoMeia = categoria.OpcaoMeia.String
	} else {
		response.OpcaoMeia = ""
	}

	if categoria.Ordem.Valid {
		ordem := int32(categoria.Ordem.Int)
		response.Ordem = &ordem
	}

	if categoria.DeletedAt.Valid {
		deletedAt := categoria.DeletedAt.Time
		response.DeletedAt = &deletedAt
	}

	// Verificar se há opções relacionadas e convertê-las
	if categoria.R != nil && categoria.R.CategoriaOpcoes != nil {
		response.Opcoes = make([]CategoriaOpcaoItem, len(categoria.R.CategoriaOpcoes))

		for i, opcao := range categoria.R.CategoriaOpcoes {
			response.Opcoes[i] = ConvertSQLBoilerCategoriaOpcaoToDTO(opcao)
		}
	} else {
		response.Opcoes = []CategoriaOpcaoItem{}
	}

	return response
}

// convertSQLBoilerCategoriaOpcaoToDTO converte um modelo de opção de categoria do SQLBoiler para o DTO
func ConvertSQLBoilerCategoriaOpcaoToDTO(opcao *models_sql_boiler.CategoriaOpcao) CategoriaOpcaoItem {
	// Converter string UUID para uuid.UUID
	id, _ := uuid.Parse(opcao.ID)
	idCategoria, _ := uuid.Parse(opcao.IDCategoria)

	// Criar o DTO base
	response := CategoriaOpcaoItem{
		ID:          id,
		SeqID:       opcao.SeqID,
		IDCategoria: idCategoria,
		Nome:        opcao.Nome,
		Status:      opcao.Status,
		CreatedAt:   opcao.CreatedAt,
		UpdatedAt:   opcao.UpdatedAt,
	}

	// Converter campo opcional deletedAt
	if opcao.DeletedAt.Valid {
		deletedAt := opcao.DeletedAt.Time
		response.DeletedAt = &deletedAt
	}

	return response
}

// formatTime formata uma hora do tipo time.Time para string no formato "15:04:05"
func formatTime(t time.Time) string {
	return t.Format("15:04:05")
}

// ConvertSQLBoilerCategoriasListToCoreDTO converte uma lista de categorias do SQLBoiler para uma lista de DTO Core
func ConvertSQLBoilerCategoriasListToCoreDTO(categorias models_sql_boiler.CategoriaSlice) []CoreCategoriaResponseDTO {
	result := make([]CoreCategoriaResponseDTO, len(categorias))

	for i, categoria := range categorias {
		result[i] = ConvertSQLBoilerCategoriaToCoreDTO(categoria)
	}

	return result
}

// CategoriaOpcaoStatusUpdateDTO representa os dados necessários para atualizar o status de uma opção de categoria
type CategoriaOpcaoStatusUpdateDTO struct {
	Status *int16 `json:"status" validate:"required,oneof=0 1"`
}

// CategoriaStatusUpdateDTO representa os dados necessários para atualizar o status de uma categoria
type CategoriaStatusUpdateDTO struct {
	Ativo *int16 `json:"ativo" validate:"required,oneof=0 1"`
}

// CategoriaOrdemUpdateDTO representa os dados necessários para atualizar a ordem de uma categoria
type CategoriaOrdemUpdateDTO struct {
	Ordem *int32 `json:"ordem" validate:"required"`
}
