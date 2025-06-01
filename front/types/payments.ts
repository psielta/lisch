/* =========================
   1) VENDAS DIÁRIAS – CARD
   ========================= */

export interface VendasDiariasDto {
  /** Dia da venda (YYYY-MM-DD, já no fuso de Brasília) */
  dia: string;

  /** Categoria de pagamento (Cartão, Pix, Dinheiro, etc.) */
  categoria_pagamento: string;

  /** Valor líquido do pagamento */
  valor_liquido: number;
}

/* =========================
       2) PEDIDO DETALHADO – MODAL
       ========================= */

export interface PedidoDetalhadoDto {
  id: string; // "7e2e9a48-e200-435a-a12c-1672b1e3b144"
  id_pedido: string; // "98da5e12-e828-453e-ae22-350cb3128b05"
  categoria_pagamento: string; // "Cartão"
  valor_pago: number; // 64.5
  valor_liquido: number; // 64.5
  created_br: string; // "2025-06-01T12:59:54.822091Z"
  dia: string; // "2025-06-01T00:00:00Z"
  codigo_pedido: string; // "P2025431-163527"
  data_pedido_br: string; // "2025-05-31T16:35:27.65Z"
  cliente: string; // "CONSUMIDORX"
}

/* =========================
     3) TIPOS AUXILIARES PARA FILTROS
     ========================= */

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
