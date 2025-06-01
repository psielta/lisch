// endpoint: /dashboard/get-aniversariantes

import { ClienteAniversario } from "@/types/clients";
import api from "@/lib/api";

export const getAniversariantes = async (): Promise<ClienteAniversario[]> => {
  const response = await api.get<ClienteAniversario[]>(
    "/dashboard/get-aniversariantes"
  );
  return response.data;
};
