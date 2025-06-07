import { ClienteResponse } from "@/rxjs/clientes/cliente.model";
import api from "../lib/api";

export interface UpsertClienteDTO {
  id: string | null; // enviar null para criar um novo cliente ou enviar o id do cliente existente para atualizar
  tenant_id: string; // UUID como string
  nome_razao_social: string;
  celular?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  tipo_pessoa: "F" | "J"; // Tipo nao nulo no backend enviar F como padrao
}

export async function upsertCliente(
  cliente: UpsertClienteDTO
): Promise<ClienteResponse> {
  const responseAxios = await api.post("/clientes/upsert", cliente);
  return responseAxios.data;
}
