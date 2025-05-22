import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import FormCliente from "@/components/formularios/form-cliente";

export const dynamic = "force-dynamic"; // (opcional) nunca cachear

export default async function NewClientePage() {
  const user = await apiServer<User>("/users/me");

  // autorização
  if (user.admin !== 1 && (user.permission_cliente ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  return <FormCliente user={user} data={undefined} />;
}
