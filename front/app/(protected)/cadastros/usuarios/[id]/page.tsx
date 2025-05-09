import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import EditUsuario from "./edit-usuario";

export default async function EditUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const user = await apiServer<User>("/users/me");
  if (user.admin !== 1 && (user.permission_users ?? 0) !== 1)
    redirect("/sem-permissao");

  const usuario = await apiServer<User>(`/users/get/${resolvedParams.id}`);

  return <EditUsuario usuario={usuario} user={user} />;
}
