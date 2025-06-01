import api from "@/lib/api";
import { VendasDiariasDto } from "@/types/payments";

export async function getPagamentosPorDiaECategoria(): Promise<
  VendasDiariasDto[]
> {
  const response = await api.get<VendasDiariasDto[]>(
    "/dashboard/get-pagamentos-por-dia-e-categoria"
  );
  return response.data;
}
