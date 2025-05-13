import { CulinariaDTO } from "@/dto/culinaria-dto";
import api from "@/lib/api";
import { apiServer } from "@/lib/api-server";

export async function getCulinaria(): Promise<CulinariaDTO[]> {
  const response = await api.get<CulinariaDTO[]>(`/culinarias`);

  return response.data;
}

export async function getCulinariaFromServer(): Promise<CulinariaDTO[]> {
  const response = await apiServer<CulinariaDTO[]>("/culinarias");

  return response;
}
