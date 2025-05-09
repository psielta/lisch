import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import ListUsuarios from "./list-usuarios"; // ⬅️ componente antigo, sem fetch
import { User } from "@/context/auth-context";

export const dynamic = "force-dynamic"; // (opcional) nunca cachear

export default async function UsuariosPage() {
  const user = await apiServer<User>("/users/me");

  // autorização
  if (user.admin !== 1 && (user.permission_users ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  const data = await apiServer<User[]>("/users/list");

  return <ListUsuarios user={user} usuarios={data} />;
}
