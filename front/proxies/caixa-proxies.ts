import api from "@/lib/api";

export interface InsertCaixaParams {
  tenant_id: string;
  id_operador: string;
  valor_abertura?: number | null;
  observacao_abertura?: string | null;
  status: string;
}

export interface CaixaResponseDto {
  id: string;
  seq_id: number;
  tenant_id: string;
  id_operador: string;
  data_abertura: string;
  data_fechamento?: string | null;
  valor_abertura?: number | null;
  observacao_abertura?: string | null;
  observacao_fechamento?: string | null;
  status: "A" | "F"; // Union type para maior segurança
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export async function insertCaixa(
  insertCaixaParams: InsertCaixaParams
): Promise<CaixaResponseDto> {
  const responseAxios = await api.post<CaixaResponseDto>(
    "/caixas",
    insertCaixaParams
  );

  return responseAxios.data;
}

export async function getCaixasAbertos(): Promise<CaixaResponseDto[]> {
  const responseAxios = await api.get<CaixaResponseDto[]>(`/caixas/abertos`);
  return responseAxios.data;
}
