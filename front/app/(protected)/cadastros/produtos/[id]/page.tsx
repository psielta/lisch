import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import FormProduto from "@/components/formularios/form-produto";

export const dynamic = "force-dynamic"; // (opcional) nunca cachear

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await apiServer<User>("/users/me");

  // autorização
  if (user.admin !== 1 && (user.permission_produto ?? 0) !== 1) {
    redirect("/sem-permissao");
  }
  const dataCategorias = await apiServer<ICoreCategoria[]>(`/categorias`);
  const endpoint = `/produtos/${id}`;
  const data = await apiServer<ProdutoResponse>(endpoint);

  return (
    <FormProduto user={user} data={data} dataCategorias={dataCategorias} />
  );
}
