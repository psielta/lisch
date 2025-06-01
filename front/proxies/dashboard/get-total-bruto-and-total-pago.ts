import api from "@/lib/api";

export interface DailySummary {
  dia: string;
  total_bruto: number;
  total_pago: number;
}

export async function getTotalBrutoAndTotalPago() {
  const axiosResponse = await api.get<DailySummary[]>(
    "/dashboard/get-total-bruto-and-total-pago"
  );
  return axiosResponse.data;
}
