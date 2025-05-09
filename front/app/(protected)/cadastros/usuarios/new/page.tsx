import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import NewUsuario from "./new-usuario";

export default async function NewUsuarioPage() {
  const user = await apiServer<User>("/users/me");
  if (user.admin !== 1 && (user.permission_users ?? 0) !== 1)
    redirect("/sem-permissao");

  return <NewUsuario user={user} />;
}
