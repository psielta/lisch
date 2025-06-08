import api from "@/lib/api";

/**
 * Tipo para os possíveis tipos de movimentação de caixa
 * S = Sangria (saída)
 * U = Suprimento (entrada)
 * P = Pagamento (entrada)
 */
export type TipoMovimentacao = "S" | "U" | "P";

/**
 * DTO para movimentação de caixa
 */
export interface CaixaMovimentacaoDto {
  id: string;
  seq_id: number;
  id_caixa: string;
  tipo: TipoMovimentacao;
  id_forma_pagamento: number;
  valor: number;
  observacao?: string;
  id_pagamento: string;
  autorizado_por: string;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  deleted_at?: string | null; // ISO 8601 date string ou null
}

/**
 * DTO para suprimento de caixa
 */
export interface SuprimentoCaixaDto {
  id_caixa: string;
  valor: number;
  observacao?: string;
  autorizado_por: string;
}

export async function insertSuprimentoCaixa(
  suprimento: SuprimentoCaixaDto
): Promise<CaixaMovimentacaoDto> {
  const response = await api.post("/caixas/suprimento", suprimento);
  return response.data;
}

export async function removeSuprimentoCaixa(id: string): Promise<void> {
  const response = await api.delete(`/caixas/suprimento/${id}`);
  return response.data;
}

/**
 * DTO para sangria de caixa
 */
export interface SangriaCaixaDto {
  id_caixa: string;
  valor: number;
  observacao?: string;
  autorizado_por: string;
}

export async function insertSangriaCaixa(
  sangria: SangriaCaixaDto
): Promise<CaixaMovimentacaoDto> {
  const response = await api.post("/caixas/sangria", sangria);
  return response.data;
}

export async function removeSangriaCaixa(id: string): Promise<void> {
  const response = await api.delete(`/caixas/sangria/${id}`);
  return response.data;
}

/**
 * DTO para valor esperado por forma de pagamento
 */
export interface ValorEsperadoFormaDto {
  id_forma_pagamento: number;
  codigo_forma: string;
  nome_forma: string;
  valor_esperado: number;
}

export async function getResumoCaixa(
  id_caixa: string
): Promise<ValorEsperadoFormaDto[]> {
  const response = await api.get(`/caixas/resumo/${id_caixa}`);
  return response.data;
}
