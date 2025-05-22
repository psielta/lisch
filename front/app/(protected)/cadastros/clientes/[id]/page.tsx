import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import { ClienteResponse } from "@/rxjs/clientes/cliente.model";
import FormCliente from "@/components/formularios/form-cliente";

export const dynamic = "force-dynamic"; // (opcional) nunca cachear

export default async function EditClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await apiServer<User>("/users/me");

  // autorização
  if (user.admin !== 1 && (user.permission_cliente ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  const endpoint = `/clientes/${id}`;
  const data = await apiServer<ClienteResponse>(endpoint);

  return <FormCliente user={user} data={data} />;
}
