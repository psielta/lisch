package dto

import (
	"fmt"
	"gobid/internal/store/pgstore"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type InsertCaixaParams struct {
	TenantID           uuid.UUID `json:"tenant_id"`
	IDOperador         uuid.UUID `json:"id_operador"`
	ValorAbertura      float64   `json:"valor_abertura"`
	ObservacaoAbertura *string   `json:"observacao_abertura"`
	Status             string    `json:"status"`
}

type SuprimentoCaixaDto struct {
	IDCaixa       uuid.UUID `json:"id_caixa" validate:"required"`
	Valor         float64   `json:"valor" validate:"required,min=0"`
	Observacao    string    `json:"observacao"`
	AutorizadoPor uuid.UUID `json:"autorizado_por" validate:"required"`
}

type SangriaCaixaDto struct {
	IDCaixa       uuid.UUID `json:"id_caixa" validate:"required"`
	Valor         float64   `json:"valor" validate:"required,min=0"`
	Observacao    string    `json:"observacao"`
	AutorizadoPor uuid.UUID `json:"autorizado_por" validate:"required"`
}

type ValorEsperadoFormaDto struct {
	IDFormaPagamento int16   `json:"id_forma_pagamento"`
	CodigoForma      string  `json:"codigo_forma"`
	NomeForma        string  `json:"nome_forma"`
	ValorEsperado    float64 `json:"valor_esperado"`
}

type CaixaResponseDto struct {
	ID                   uuid.UUID  `json:"id"`
	SeqID                int64      `json:"seq_id"`
	TenantID             uuid.UUID  `json:"tenant_id"`
	IDOperador           uuid.UUID  `json:"id_operador"`
	DataAbertura         time.Time  `json:"data_abertura"`
	DataFechamento       *time.Time `json:"data_fechamento"`
	ValorAbertura        *float64   `json:"valor_abertura"`
	ObservacaoAbertura   *string    `json:"observacao_abertura"`
	ObservacaoFechamento *string    `json:"observacao_fechamento"`
	// A=Aberto, F=Fechado
	Status    string     `json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at"`
}

type CaixaMovimentacoDto struct {
	ID      uuid.UUID `json:"id"`
	SeqID   int64     `json:"seq_id"`
	IDCaixa uuid.UUID `json:"id_caixa"`
	// S=Sangria (saída), U=Suprimento (entrada), P=Pagamento (entrada)
	Tipo             string     `json:"tipo"`
	IDFormaPagamento int16      `json:"id_forma_pagamento"`
	Valor            float64    `json:"valor"`
	Observacao       string     `json:"observacao"`
	IDPagamento      uuid.UUID  `json:"id_pagamento"`
	AutorizadoPor    uuid.UUID  `json:"autorizado_por"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at"`
}

func InsertCaixaParamsToInsertCaixaParams(dto InsertCaixaParams) (pgstore.InsertCaixaParams, error) {
	var valorAberturaValue pgtype.Numeric
	// converte  e.g. 123.45 → "123.45"
	s := strconv.FormatFloat(dto.ValorAbertura, 'f', -1, 64)
	if err := valorAberturaValue.Scan(s); err != nil {
		return pgstore.InsertCaixaParams{}, fmt.Errorf("falha ao converter ValorAbertura para NUMERIC: %w", err)
	}

	var observacaoAberturaValue pgtype.Text
	if dto.ObservacaoAbertura != nil {
		observacaoAberturaValue = pgtype.Text{String: *dto.ObservacaoAbertura, Valid: true}
	}

	return pgstore.InsertCaixaParams{
		TenantID:           dto.TenantID,
		IDOperador:         dto.IDOperador,
		ValorAbertura:      valorAberturaValue,
		ObservacaoAbertura: observacaoAberturaValue,
		Status:             pgstore.StatusCaixa(dto.Status),
	}, nil
}

func CaixaResponseDtoToCaixaResponseDto(caixa pgstore.Caixa) (dto CaixaResponseDto) {
	// ValorAbertura → *float64
	if caixa.ValorAbertura.Valid {
		// Float64Value() → (pgtype.Float8, error)
		if f8, err := caixa.ValorAbertura.Float64Value(); err == nil && f8.Valid {
			v := f8.Float64
			dto.ValorAbertura = &v
		}
	}

	// Observação de abertura → *string
	if caixa.ObservacaoAbertura.Valid {
		s := caixa.ObservacaoAbertura.String
		dto.ObservacaoAbertura = &s
	}

	// DataFechamento → *time.Time
	// (supondo que caixa.DataFechamento é um pgtype.Timestamp ou Timestamptz)
	// e que ele tem .Time e .Valid)
	if caixa.DataFechamento.Valid {
		t := caixa.DataFechamento.Time
		dto.DataFechamento = &t
	}

	// Observação de fechamento → *string
	if caixa.ObservacaoFechamento.Valid {
		s := caixa.ObservacaoFechamento.String
		dto.ObservacaoFechamento = &s
	}

	// DeletedAt → *time.Time
	if caixa.DeletedAt.Valid {
		t := caixa.DeletedAt.Time
		dto.DeletedAt = &t
	}

	// Campos sempre presentes
	dto.ID = caixa.ID
	dto.SeqID = caixa.SeqID
	dto.TenantID = caixa.TenantID
	dto.IDOperador = caixa.IDOperador
	dto.DataAbertura = caixa.DataAbertura
	dto.Status = string(caixa.Status)
	dto.CreatedAt = caixa.CreatedAt
	dto.UpdatedAt = caixa.UpdatedAt

	return dto
}

func CaixasToCaixasResponseDto(caixas []pgstore.Caixa) []CaixaResponseDto {
	var dto []CaixaResponseDto
	for _, caixa := range caixas {
		dto = append(dto, CaixaResponseDtoToCaixaResponseDto(caixa))
	}
	return dto
}

func SuprimentoCaixaDtoToSuprimentoCaixaParams(dto SuprimentoCaixaDto) (pgstore.SuprimentoCaixaParams, error) {

	var valorPgType pgtype.Numeric
	s := strconv.FormatFloat(dto.Valor, 'f', -1, 64)
	if err := valorPgType.Scan(s); err != nil {
		return pgstore.SuprimentoCaixaParams{}, fmt.Errorf("falha ao converter Valor para NUMERIC: %w", err)
	}

	var observacaoPgType pgtype.Text = pgtype.Text{String: "Suprimento", Valid: true}
	if dto.Observacao != "" {
		observacaoPgType = pgtype.Text{String: dto.Observacao, Valid: true}
	}

	var autorizadoPorPgType pgtype.UUID
	if err := autorizadoPorPgType.Scan(dto.AutorizadoPor.String()); err != nil {
		return pgstore.SuprimentoCaixaParams{}, fmt.Errorf("falha ao converter AutorizadoPor para UUID: %w", err)
	}

	return pgstore.SuprimentoCaixaParams{
		IDCaixa:       dto.IDCaixa,
		Valor:         valorPgType,
		Observacao:    observacaoPgType,
		AutorizadoPor: autorizadoPorPgType,
	}, nil
}

func SangriaCaixaDtoToSangriaCaixaParams(dto SangriaCaixaDto) (pgstore.SangriaCaixaParams, error) {
	var valorPgType pgtype.Numeric
	s := strconv.FormatFloat(dto.Valor, 'f', -1, 64)
	if err := valorPgType.Scan(s); err != nil {
		return pgstore.SangriaCaixaParams{}, fmt.Errorf("falha ao converter Valor para NUMERIC: %w", err)
	}

	var observacaoPgType pgtype.Text = pgtype.Text{String: "Sangria", Valid: true}
	if dto.Observacao != "" {
		observacaoPgType = pgtype.Text{String: dto.Observacao, Valid: true}
	}

	var autorizadoPorPgType pgtype.UUID
	if err := autorizadoPorPgType.Scan(dto.AutorizadoPor.String()); err != nil {
		return pgstore.SangriaCaixaParams{}, fmt.Errorf("falha ao converter AutorizadoPor para UUID: %w", err)
	}

	return pgstore.SangriaCaixaParams{
		IDCaixa:       dto.IDCaixa,
		Valor:         valorPgType,
		Observacao:    observacaoPgType,
		AutorizadoPor: autorizadoPorPgType,
	}, nil
}

func InterfaceToValorEsperadoFormaDto(i interface{}) ([]ValorEsperadoFormaDto, error) {
	// A interface retornada pelo sqlc é um []interface{}
	rows, ok := i.([]interface{})
	if !ok {
		return nil, fmt.Errorf("falha ao converter interface para slice: %v", i)
	}

	result := make([]ValorEsperadoFormaDto, 0, len(rows))

	for _, row := range rows {
		// Cada linha pode ser um slice de valores ou um map, dependendo de como o PostgreSQL retorna
		// Vamos tentar primeiro como slice de valores
		if rowSlice, ok := row.([]interface{}); ok && len(rowSlice) == 4 {
			// Formato: [id_forma_pagamento, codigo_forma, nome_forma, valor_esperado]
			dto, err := convertSliceToDto(rowSlice)
			if err != nil {
				return nil, fmt.Errorf("falha ao converter slice para DTO: %w", err)
			}
			result = append(result, dto)
			continue
		}

		// Se não for slice, tenta como map
		m, ok := row.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("falha ao converter linha para map ou slice: %v", row)
		}

		dto, err := convertMapToDto(m)
		if err != nil {
			return nil, fmt.Errorf("falha ao converter map para DTO: %w", err)
		}
		result = append(result, dto)
	}

	return result, nil
}

func convertSliceToDto(rowSlice []interface{}) (ValorEsperadoFormaDto, error) {
	// id_forma_pagamento (índice 0)
	idFormaPagamento, err := convertToInt16(rowSlice[0])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter id_forma_pagamento: %w", err)
	}

	// codigo_forma (índice 1)
	codigoForma, err := convertToString(rowSlice[1])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter codigo_forma: %w", err)
	}

	// nome_forma (índice 2)
	nomeForma, err := convertToString(rowSlice[2])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter nome_forma: %w", err)
	}

	// valor_esperado (índice 3)
	valorEsperado, err := convertToFloat64(rowSlice[3])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter valor_esperado: %w", err)
	}

	return ValorEsperadoFormaDto{
		IDFormaPagamento: idFormaPagamento,
		CodigoForma:      codigoForma,
		NomeForma:        nomeForma,
		ValorEsperado:    valorEsperado,
	}, nil
}

func convertMapToDto(m map[string]interface{}) (ValorEsperadoFormaDto, error) {
	// id_forma_pagamento
	idFormaPagamento, err := convertToInt16(m["id_forma_pagamento"])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter id_forma_pagamento: %w", err)
	}

	// codigo_forma
	codigoForma, err := convertToString(m["codigo_forma"])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter codigo_forma: %w", err)
	}

	// nome_forma
	nomeForma, err := convertToString(m["nome_forma"])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter nome_forma: %w", err)
	}

	// valor_esperado
	valorEsperado, err := convertToFloat64(m["valor_esperado"])
	if err != nil {
		return ValorEsperadoFormaDto{}, fmt.Errorf("falha ao converter valor_esperado: %w", err)
	}

	return ValorEsperadoFormaDto{
		IDFormaPagamento: idFormaPagamento,
		CodigoForma:      codigoForma,
		NomeForma:        nomeForma,
		ValorEsperado:    valorEsperado,
	}, nil
}

// Função auxiliar para converter para int16
func convertToInt16(value interface{}) (int16, error) {
	switch v := value.(type) {
	case int16:
		return v, nil
	case int:
		return int16(v), nil
	case int32:
		return int16(v), nil
	case int64:
		return int16(v), nil
	case float64:
		return int16(v), nil
	default:
		return 0, fmt.Errorf("tipo não suportado para int16: %T", value)
	}
}

// Função auxiliar para converter para string
func convertToString(value interface{}) (string, error) {
	switch v := value.(type) {
	case string:
		return v, nil
	case []byte:
		return string(v), nil
	default:
		return "", fmt.Errorf("tipo não suportado para string: %T", value)
	}
}

// Função auxiliar para converter para float64
func convertToFloat64(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case float32:
		return float64(v), nil
	case int:
		return float64(v), nil
	case int32:
		return float64(v), nil
	case int64:
		return float64(v), nil
	case string:
		return strconv.ParseFloat(v, 64)
	case pgtype.Numeric:
		// Converte pgtype.Numeric para float64
		if !v.Valid {
			return 0, nil
		}
		if f8, err := v.Float64Value(); err == nil && f8.Valid {
			return f8.Float64, nil
		}
		return 0, fmt.Errorf("pgtype.Numeric inválido")
	default:
		// Tenta converter usando fmt.Sprintf como último recurso
		str := fmt.Sprintf("%v", value)
		if f, err := strconv.ParseFloat(str, 64); err == nil {
			return f, nil
		}
		return 0, fmt.Errorf("tipo não suportado para float64: %T, valor: %v", value, value)
	}
}

func CaixaMovimentacoToCaixaMovimentacoDto(caixaMovimentaco pgstore.CaixaMovimentaco) CaixaMovimentacoDto {

	var idFormaPagamento int16
	if caixaMovimentaco.IDFormaPagamento.Valid {
		idFormaPagamento = int16(caixaMovimentaco.IDFormaPagamento.Int16)
	}

	var valor float64
	if caixaMovimentaco.Valor.Valid {
		// Float64Value() → (pgtype.Float8, error)
		if f8, err := caixaMovimentaco.Valor.Float64Value(); err == nil && f8.Valid {
			valor = f8.Float64
		}
	}

	var idPagamento uuid.UUID
	if caixaMovimentaco.IDPagamento.Valid {
		idPagamento = caixaMovimentaco.IDPagamento.Bytes
	}

	var autorizadoPor uuid.UUID
	if caixaMovimentaco.AutorizadoPor.Valid {
		autorizadoPor = caixaMovimentaco.AutorizadoPor.Bytes
	}

	var deletedAt *time.Time
	if caixaMovimentaco.DeletedAt.Valid {
		deletedAt = &caixaMovimentaco.DeletedAt.Time
	}

	return CaixaMovimentacoDto{
		ID:               caixaMovimentaco.ID,
		SeqID:            caixaMovimentaco.SeqID,
		IDCaixa:          caixaMovimentaco.IDCaixa,
		Tipo:             caixaMovimentaco.Tipo,
		IDFormaPagamento: idFormaPagamento,
		Valor:            valor,
		Observacao:       caixaMovimentaco.Observacao.String,
		IDPagamento:      idPagamento,
		AutorizadoPor:    autorizadoPor,
		CreatedAt:        caixaMovimentaco.CreatedAt,
		UpdatedAt:        caixaMovimentaco.UpdatedAt,
		DeletedAt:        deletedAt,
	}
}
