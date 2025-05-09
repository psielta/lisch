// ------------------- Utilitário genérico -------------------
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    limit: number;
    page: number;
    total: number;
  };
}

// ------------------- Pedido (raiz) --------------------------
export interface Pedido {
  id: string;
  cliente_id: string;
  tenant_id: string;
  vendedor_id: string;
  representada_id: string;
  deposito_id: string;
  price_list: number; // int16 no Go
  status: string; // enum livre: draft | ...
  total_amount: string; // decimal serializado como string
  created_at: string; // ISO-8601
  updated_at: string;
  sequencia: number;
  observacao?: string | null;
  codigo_manual?: string | null;
  total_amount_dif?: string | number | null;

  items: PedidoItem[];
  cliente: Cliente;
  representada: Representada;
  deposito: Deposito;
  vendedor: Vendedor | null;
}

// ------------------- Item do pedido ------------------------
export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string;

  quantity: string; // decimal → string
  unit_price: string;
  discount: string;
  total_price: string;

  sequencia: number;
  quantity_box: number;
  faturado: boolean;

  unit_price_dif?: string | number | null;
  discount_dif?: string | number | null;
  total_price_dif?: string | number | null;
}

// ------------------- Cliente --------------------------------
export interface Cliente {
  id: string;
  codigo: number;
  tenant_id: string;
  cidade_id: string;

  transportadora_id?: string | null;
  vendedor_id?: string | null;
  regiao_id?: string | null;

  nome: string;
  endereco?: string | null;
  bairro?: string | null;
  cep?: string | null;
  fone?: string | null;
  fax?: string | null;
  data?: string | null; // null.Time
  email?: string | null;
  cnpj?: string | null;
  insc?: string | null;
  ativo?: boolean | null;
  situacao_cliente?: string | null;
  excluido?: boolean | null;
  contato?: string | null;
  obs?: string | null;
  fantasia?: string | null;
  fone_recado?: string | null;
  fone_transp_local?: string | null;
  cod_vend_tlmkt?: string | null;
  ref_transp?: string | null;
  ramo_atividade?: string | null;
  ref_cont?: string | null;
  contabilidade?: string | null;
  fone_cont?: string | null;
  contato_cont?: string | null;

  aniversario?: string | null; // datas ↓
  fundacao?: string | null;
  data_ult_pedido?: string | null;
  data_ant_pedido?: string | null;
  dt_ult_alt_contrato?: string | null;
  dt_abertura1?: string | null;
  dt_abertura2?: string | null;
  dt_nasc_socio1?: string | null;
  dt_nasc_socio2?: string | null;
  dt_nasc_socio3?: string | null;

  valor_ult_pedido?: string | number | null; // NullDecimal
  valor_ant_pedido?: string | number | null;
  imovel_mt2?: string | number | null;
  valor_imovel?: string | number | null;

  tabela_compra?: string | null;
  contato_compras?: string | null;
  fone_compras?: string | null;
  celular_compras?: string | null;
  contato_pagar?: string | null;
  fone_pagar?: string | null;
  celular_pagar?: string | null;

  ref1?: string | null;
  ref2?: string | null;
  ref3?: string | null;

  banco1?: string | null;
  banco2?: string | null;
  ag1?: string | null;
  cc1?: string | null;
  ag2?: string | null;
  cc2?: string | null;
  fone_banco1?: string | null;
  fone_banco2?: string | null;

  telemkt?: boolean | null;
  telemkt_horario?: string | null;
  telemkt_dia?: string | null;

  forn1?: string | null;
  fone_forn1?: string | null;
  forn2?: string | null;
  fone_forn2?: string | null;
  forn3?: string | null;
  fone_forn3?: string | null;

  socio1?: string | null;
  cpf_socio1?: string | null;
  cargo_socio1?: string | null;
  socio2?: string | null;
  cpf_socio2?: string | null;
  cargo_socio2?: string | null;
  socio3?: string | null;
  cpf_socio3?: string | null;
  cargo_socio3?: string | null;

  imovel?: string | null;
  email_xml?: string | null;
  duplicata?: boolean | null;

  created_at: string;
  updated_at: string;
  numero?: number | null;
} // campos extraídos de clientes.go :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}

// ------------------- Representada ---------------------------
export interface Representada {
  id: string;
  tenant_id: string;
  codigo: number;
  nome: string;

  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade_id: string;
  cep?: string | null;
  fone?: string | null;
  fax?: string | null;
  email?: string | null;
  cnpj?: string | null;
  ie?: string | null;
  nome_curto?: string | null;

  // preços e percentuais (P01…P24 / cal_preco1…24)
  preco1?: string | null;
  preco2?: string | null /* … até preco24 */;
  preco3?: string | null /* … até preco24 */;
  preco4?: string | null /* … até preco24 */;
  preco5?: string | null /* … até preco24 */;
  preco6?: string | null /* … até preco24 */;
  preco7?: string | null /* … até preco24 */;
  preco8?: string | null /* … até preco24 */;
  preco9?: string | null /* … até preco24 */;
  preco10?: string | null /* … até preco24 */;
  preco11?: string | null /* … até preco24 */;
  preco12?: string | null /* … até preco24 */;
  preco13?: string | null /* … até preco24 */;
  preco14?: string | null /* … até preco24 */;
  preco15?: string | null /* … até preco24 */;
  preco16?: string | null /* … até preco24 */;
  preco17?: string | null /* … até preco24 */;
  preco18?: string | null /* … até preco24 */;
  preco19?: string | null /* … até preco24 */;
  preco20?: string | null /* … até preco24 */;
  preco21?: string | null /* … até preco24 */;
  preco22?: string | null /* … até preco24 */;
  preco23?: string | null /* … até preco24 */;
  preco24?: string | null /* … até preco24 */;

  cal_preco1?: string | number | null;
  cal_preco2?: string | number | null /* … até cal_preco24 */;
  cal_preco3?: string | number | null /* … até cal_preco24 */;
  cal_preco4?: string | number | null /* … até cal_preco24 */;
  cal_preco5?: string | number | null /* … até cal_preco24 */;
  cal_preco6?: string | number | null /* … até cal_preco24 */;
  cal_preco7?: string | number | null /* … até cal_preco24 */;
  cal_preco8?: string | number | null /* … até cal_preco24 */;
  cal_preco9?: string | number | null /* … até cal_preco24 */;
  cal_preco10?: string | number | null /* … até cal_preco24 */;
  cal_preco11?: string | number | null /* … até cal_preco24 */;
  cal_preco12?: string | number | null /* … até cal_preco24 */;
  cal_preco13?: string | number | null /* … até cal_preco24 */;
  cal_preco14?: string | number | null /* … até cal_preco24 */;
  cal_preco15?: string | number | null /* … até cal_preco24 */;
  cal_preco16?: string | number | null /* … até cal_preco24 */;
  cal_preco17?: string | number | null /* … até cal_preco24 */;
  cal_preco18?: string | number | null /* … até cal_preco24 */;
  cal_preco19?: string | number | null /* … até cal_preco24 */;
  cal_preco20?: string | number | null /* … até cal_preco24 */;
  cal_preco21?: string | number | null /* … até cal_preco24 */;
  cal_preco22?: string | number | null /* … até cal_preco24 */;
  cal_preco23?: string | number | null /* … até cal_preco24 */;
  cal_preco24?: string | number | null /* … até cal_preco24 */;

  // comissões r1…r24 / v1…v24
  comiss_r1?: string | number | null /* … até comiss_r24 */;
  comiss_r2?: string | number | null /* … até comiss_r24 */;
  comiss_r3?: string | number | null /* … até comiss_r24 */;
  comiss_r4?: string | number | null /* … até comiss_r24 */;
  comiss_r5?: string | number | null /* … até comiss_r24 */;
  comiss_r6?: string | number | null /* … até comiss_r24 */;
  comiss_r7?: string | number | null /* … até comiss_r24 */;
  comiss_r8?: string | number | null /* … até comiss_r24 */;
  comiss_r9?: string | number | null /* … até comiss_r24 */;
  comiss_r10?: string | number | null /* … até comiss_r24 */;
  comiss_r11?: string | number | null /* … até comiss_r24 */;
  comiss_r12?: string | number | null /* … até comiss_r24 */;
  comiss_r13?: string | number | null /* … até comiss_r24 */;
  comiss_r14?: string | number | null /* … até comiss_r24 */;
  comiss_r15?: string | number | null /* … até comiss_r24 */;
  comiss_r16?: string | number | null /* … até comiss_r24 */;
  comiss_r17?: string | number | null /* … até comiss_r24 */;
  comiss_r18?: string | number | null /* … até comiss_r24 */;
  comiss_r19?: string | number | null /* … até comiss_r24 */;
  comiss_r20?: string | number | null /* … até comiss_r24 */;
  comiss_r21?: string | number | null /* … até comiss_r24 */;
  comiss_r22?: string | number | null /* … até comiss_r24 */;
  comiss_r23?: string | number | null /* … até comiss_r24 */;
  comiss_r24?: string | number | null /* … até comiss_r24 */;

  obs_tabela?: string | null;
  created_at: string;
} // campos extraídos de representadas.go :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}

// ------------------- Depósito -------------------------------
export interface Deposito {
  id: string;
  tenant_id: string;
  nome: string;
  codigo?: string | null;
  created_at: string;
  updated_at: string;
} // campos extraídos de depositos.go :contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}

// ------------------- Vendedor -------------------------------
export interface Vendedor {
  id: string;
  tenant_id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

// ------------------- Endpoint especializado -----------------
/** Tipo do payload completo do seu GET /pedidos?page=…&limit=… */
export type GetPedidosResponse = PaginatedResponse<Pedido>;
