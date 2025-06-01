// types/sales.ts
export interface SalesDataSummary {
  dia: string;
  total_bruto: string | number;
  total_pago: string | number;
}

export interface SalesDataDetailed {
  id: string;
  seq_id: number;
  tenant_id: string;
  id_cliente: string;
  codigo_pedido: string;
  data_pedido: string;
  gmt: number;
  pedido_pronto: number;
  data_pedido_pronto: string;
  tipo_entrega: string;
  valor_total: number;
  valor_pago: number;
  id_status: number;
  lat: number;
  lng: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  finalizado: boolean;
  valor_bruto: number;
  data_pedido_br: string;
  dia: string;
  status_descr: string;
  cliente: string;
  taxa_entrega?: number;
  categoria_pagamento?: string;
  troco_para?: number;
  acrescimo?: number;
}

export type FilterPeriod =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "last3months";

export interface FilterOption {
  value: FilterPeriod;
  label: string;
}

export interface SalesTotals {
  totalBruto: number;
  totalPago: number;
}
