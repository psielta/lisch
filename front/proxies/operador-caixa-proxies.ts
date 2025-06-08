// Tipos TypeScript equivalentes aos tipos Go

import api from "@/lib/api";

export interface UpsertOperadorCaixaDTO {
  tenant_id: string;
  id_usuario: string;
  nome: string;
  codigo?: string | null;
  ativo: number;
}

export interface OperadorCaixaResponse {
  id: string;
  seq_id: number;
  tenant_id: string;
  id_usuario: string;
  nome: string;
  codigo: string | null;
  ativo: number;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

export async function upsertOperadorCaixa(
  upsertOperadorCaixaDTO: UpsertOperadorCaixaDTO
): Promise<OperadorCaixaResponse> {
  const responseAxios = await api.post<OperadorCaixaResponse>(
    `/users/${upsertOperadorCaixaDTO.id_usuario}/operador-caixa`,
    upsertOperadorCaixaDTO
  );

  return responseAxios.data;
}

export async function getOperadorCaixa(
  idUsuario: string
): Promise<OperadorCaixaResponse> {
  const responseAxios = await api.get<OperadorCaixaResponse>(
    `/users/${idUsuario}/operador-caixa`
  );

  return responseAxios.data;
}
