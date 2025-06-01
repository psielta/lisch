import api from "@/lib/api";

/**
 * {
        "dia": "2025-05-23T00:00:00Z",
        "total_bruto": 1337,
        "total_pago": 1337,
        "total_desconto": 0,
        "total_acrescimo": 0,
        "total_taxa_entrega": 60,
        "total_valor_total": 1277
    }
 */

export interface DailySummary {
  dia: string;
  total_bruto: number;
  total_pago: number;
  total_desconto: number;
  total_acrescimo: number;
  total_taxa_entrega: number;
  total_valor_total: number;
}

export async function getTotalBrutoAndTotalPago() {
  const axiosResponse = await api.get<DailySummary[]>(
    "/dashboard/get-total-bruto-and-total-pago"
  );
  return axiosResponse.data;
}
