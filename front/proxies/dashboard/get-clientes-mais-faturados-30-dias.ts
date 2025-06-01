// endpoint: /dashboard/get-clientes-mais-faturados-30-dias

import { ClienteMaisFaturadosNosUltimos30Dias_Item } from "@/types/clients";
import api from "@/lib/api";

export const getClientesMaisFaturados30Dias = async (): Promise<
  ClienteMaisFaturadosNosUltimos30Dias_Item[]
> => {
  const response = await api.get<ClienteMaisFaturadosNosUltimos30Dias_Item[]>(
    "/dashboard/get-clientes-mais-faturados-30-dias"
  );
  return response.data;
};
