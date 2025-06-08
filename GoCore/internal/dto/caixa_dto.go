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
	ValorAbertura      *float64  `json:"valor_abertura"`
	ObservacaoAbertura *string   `json:"observacao_abertura"`
	Status             string    `json:"status"`
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

func InsertCaixaParamsToInsertCaixaParams(dto InsertCaixaParams) (pgstore.InsertCaixaParams, error) {
	var valorAberturaValue pgtype.Numeric
	if dto.ValorAbertura != nil {
		// converte  e.g. 123.45 → "123.45"
		s := strconv.FormatFloat(*dto.ValorAbertura, 'f', -1, 64)
		if err := valorAberturaValue.Scan(s); err != nil {
			return pgstore.InsertCaixaParams{}, fmt.Errorf("falha ao converter ValorAbertura para NUMERIC: %w", err)
		}
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
