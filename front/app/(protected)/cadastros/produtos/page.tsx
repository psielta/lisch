import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import TableProduto from "./table-produto";
import { ProdutoListResponse } from "@/rxjs/produto/produto.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";

export const dynamic = "force-dynamic"; // (opcional) nunca cachear

export default async function ProdutosPage() {
  const user = await apiServer<User>("/users/me");

  // autorização
  if (user.admin !== 1 && (user.permission_produto ?? 0) !== 1) {
    redirect("/sem-permissao");
  }
  const dataCategorias = await apiServer<ICoreCategoria[]>(`/categorias`);
  const limit = 20;
  const offset = 0;
  const endpoint = `/produtos?limit=${limit}&offset=${offset}`;
  const data = await apiServer<ProdutoListResponse>(endpoint);
  console.log(data);
  console.log(data.produtos);

  return (
    <TableProduto user={user} data={data} dataCategorias={dataCategorias} />
  );
}
