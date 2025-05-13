import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import api from "@/lib/api";
import { apiServer } from "@/lib/api-server";

export async function getCategoria(id: string): Promise<ICoreCategoria> {
  const response = await api.get<ICoreCategoria>(`/categorias/${id}`);
  return response.data;
}

export async function getCategoriaFromServer(
  id: string
): Promise<ICoreCategoria> {
  const response = await apiServer<ICoreCategoria>(`/categorias/${id}`);
  return response;
}
