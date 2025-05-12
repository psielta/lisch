import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import CategoriaTableClient from "./list-categorias";

export const dynamic = "force-dynamic"; // (opcional) nunca cachear

export default async function MovimentosEstoquePage() {
  const user = await apiServer<User>("/users/me");

  // autorização
  if (user.admin !== 1 && (user.permission_categoria ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  const data = await apiServer<ICoreCategoria[]>(`/categorias`);

  return <CategoriaTableClient user={user} data={data} />;
}
