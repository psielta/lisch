import api from "@/lib/api";
import { PedidoDetalhadoDto } from "@/types/payments";

export async function getPagamentosResumoUlt3Meses(): Promise<PedidoDetalhadoDto> {
  const response = await api.get<PedidoDetalhadoDto>(
    "/dashboard/get-pagamentos-resumo-ult-3-meses"
  );
  return response.data;
}
