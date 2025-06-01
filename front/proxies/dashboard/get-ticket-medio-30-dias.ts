// endpoint: /dashboard/get-ticket-medio-30-dias

import { TicketMedio } from "@/types/Products";
import api from "@/lib/api";

export const getTicketMedio30Dias = async (): Promise<TicketMedio[]> => {
  const response = await api.get("/dashboard/get-ticket-medio-30-dias");
  return response.data;
};
