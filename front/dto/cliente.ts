import { DecimalString, ISODate, Nullable } from "./auxiliares";

export interface ClienteResponse {
  /*--- Chaves primárias / estrangeiras ---*/
  id: string;
  codigo: number;
  tenant_id: string;
  cidade_id: string;
  transportadora_id: Nullable<string>;
  vendedor_id: Nullable<string>;
  regiao_id: Nullable<string>;

  /*--- Dados cadastrais ---*/
  nome: string;
  endereco: Nullable<string>;
  bairro: Nullable<string>;
  numero: Nullable<number>;
  cep: Nullable<string>;
  fone: Nullable<string>;
  fax: Nullable<string>;
  data: ISODate;
  email: Nullable<string>;
  cnpj: Nullable<string>;
  insc: Nullable<string>;
  ativo: boolean;
  situacao_cliente: Nullable<string>;
  excluido: boolean;

  contato: Nullable<string>;
  obs: Nullable<string>;
  fantasia: Nullable<string>;
  fone_recado: Nullable<string>;
  fone_transp_local: Nullable<string>;
  cod_vend_tlmkt: Nullable<string>;

  /*--- Classificações e referências ---*/
  ref_transp: Nullable<string>;
  ramo_atividade: Nullable<string>;
  ref_cont: Nullable<string>;

  /*--- Contabilidade / responsável ---*/
  contabilidade: Nullable<string>;
  fone_cont: Nullable<string>;
  contato_cont: Nullable<string>;

  /*--- Datas diversas ---*/
  aniversario: ISODate;
  fundacao: ISODate;
  data_ult_pedido: ISODate;
  data_ant_pedido: ISODate;
  dt_ult_alt_contrato: ISODate;
  dt_abertura1: ISODate;
  dt_abertura2: ISODate;
  dt_nasc_socio1: ISODate;
  dt_nasc_socio2: ISODate;
  dt_nasc_socio3: ISODate;

  /*--- Valores ---*/
  valor_ult_pedido: DecimalString;
  valor_ant_pedido: DecimalString;
  imovel_mt2: DecimalString;
  valor_imovel: DecimalString;

  /*--- Compras / pagamentos ---*/
  tabela_compra: Nullable<string>;
  contato_compras: Nullable<string>;
  fone_compras: Nullable<string>;
  celular_compras: Nullable<string>;
  contato_pagar: Nullable<string>;
  fone_pagar: Nullable<string>;
  celular_pagar: Nullable<string>;

  /*--- Bancos / referências ---*/
  ref1: Nullable<string>;
  ref2: Nullable<string>;
  ref3: Nullable<string>;
  banco1: Nullable<string>;
  banco2: Nullable<string>;
  ag1: Nullable<string>;
  cc1: Nullable<string>;
  ag2: Nullable<string>;
  cc2: Nullable<string>;
  fone_banco1: Nullable<string>;
  fone_banco2: Nullable<string>;

  /*--- Tele-marketing ---*/
  telemkt: Nullable<boolean>;
  telemkt_horario: Nullable<string>;
  telemkt_dia: Nullable<string>;

  /*--- Fornecedores ---*/
  forn1: Nullable<string>;
  fone_forn1: Nullable<string>;
  forn2: Nullable<string>;
  fone_forn2: Nullable<string>;
  forn3: Nullable<string>;
  fone_forn3: Nullable<string>;

  /*--- Sócios ---*/
  socio1: Nullable<string>;
  cpf_socio1: Nullable<string>;
  cargo_socio1: Nullable<string>;
  socio2: Nullable<string>;
  cpf_socio2: Nullable<string>;
  cargo_socio2: Nullable<string>;
  socio3: Nullable<string>;
  cpf_socio3: Nullable<string>;
  cargo_socio3: Nullable<string>;

  /*--- Outros ---*/
  imovel: Nullable<string>;
  email_xml: Nullable<string>;
  duplicata: Nullable<boolean>;

  /*--- Auditoria ---*/
  created_at: string; // ISO-8601 com timezone
  updated_at: string;

  /*--- Campos derivados (JOINs) ---*/
  cidade_nome: string;
  uf: string; // ex.: "MG"
  ibge_code: number; // inteiro
  transportadora_nome: Nullable<string>;
  vendedor_nome: Nullable<string>;
  regiao_nome: Nullable<string>;
}
