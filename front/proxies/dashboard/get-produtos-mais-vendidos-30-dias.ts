// endpoint: /dashboard/get-produtos-mais-vendidos-30-dias

import { ProductMaisVendidosItem } from "@/types/Products";
import api from "@/lib/api";

export const getProdutosMaisVendidos30Dias = async (): Promise<
  ProductMaisVendidosItem[]
> => {
  const response = await api.get(
    "/dashboard/get-produtos-mais-vendidos-30-dias"
  );
  return response.data;
};
