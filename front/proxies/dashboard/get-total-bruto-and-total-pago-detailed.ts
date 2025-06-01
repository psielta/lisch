import api from "@/lib/api";

export interface Order {
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

export async function getTotalBrutoAndTotalPagoDetailed() {
  const axiosResponse = await api.get<Order[]>(
    "/dashboard/get-total-bruto-and-total-pago-detailed"
  );
  return axiosResponse.data;
}
