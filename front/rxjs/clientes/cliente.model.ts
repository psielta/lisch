export interface CreateClienteDTO {
  tenant_id: string;
  tipo_pessoa: "F" | "J";
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  ie?: string;
  im?: string;
  data_nascimento?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface UpdateClienteDTO {
  id: string;
  tenant_id: string;
  tipo_pessoa: "F" | "J";
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  ie?: string;
  im?: string;
  data_nascimento?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface ClienteResponse {
  id: string;
  tenant_id: string;
  tipo_pessoa: "F" | "J";
  nome_razao_social: string;
  nome_fantasia: string;
  cpf: string;
  cnpj: string;
  rg: string;
  ie: string;
  im: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  celular: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  total_pages: number;
  page_size: number;
  total_count: number;
  items: T[];
}
