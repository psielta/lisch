// (1) Definimos um tipo para os índices de 1 a 24
export type OneTo24 =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;

// (2) Interface principal com os campos únicos
interface RepresentadaRow {
  id: string;
  tenant_id: string;
  codigo: number;
  nome: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade_id: string;
  cep: string;
  fone: string;

  // valores textuais que podem vir como null
  fax: string | null;
  email: string | null;
  cnpj: string | null;
  ie: string | null;
  nome_curto: string | null;

  // observações gerais
  obs_tabela: string | null;

  // metadados
  created_at: string; // ISO timestamp
  cidade_nome: string;
  uf: string;
  ibge_code: number;
}

export type Precos = Record<`preco${OneTo24}`, string | null>;
export type CalPrecos = Record<`cal_preco${OneTo24}`, string | null>;
export type ComissR = Record<`comiss_r${OneTo24}`, number | null>;
export type ComissV = Record<`comiss_v${OneTo24}`, number | null>;

type Representada = RepresentadaRow & Precos & CalPrecos & ComissR & ComissV;

export default Representada;
