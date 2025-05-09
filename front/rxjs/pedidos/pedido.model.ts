export interface Pedido {
  id: string;
  representada_id: string;
  vendedor_id: string;
  cliente_id: string;
  deposito_id: string;
  price_list: number; // int16
  observacao?: string | null;
  status?: string | null;
  codigo_manual?: string | null;
  items: PedidoItem[];
}

export interface PedidoItem {
  id: string;
  produto_id: string;
  quantity: string; // decimal
  unit_price: string;
  discount: string;
  total_price: string;
  quantity_box?: string | number | null;
  unit_price_dif?: string | number | null;
  discount_dif?: string | number | null;
  total_price_dif?: string | number | null;
  faturado: boolean;
}

export type InputPedidoItem = Omit<PedidoItem, "id"> & {
  id?: string;
};

export type InputPedido = Omit<Pedido, "id"> & {
  id?: string;
  items: InputPedidoItem[];
};
