import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import TableCliente from "./table-cliente";
import {
  PaginatedResponse,
  ClienteResponse,
} from "@/rxjs/clientes/cliente.model";

export const dynamic = "force-dynamic"; // (opcional) nunca cachear

export default async function ClientesPage() {
  const user = await apiServer<User>("/users/me");

  // autorização
  if (user.admin !== 1 && (user.permission_cliente ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  const page = 1;
  const limit = 10;
  const sort = "nome";
  const order = "asc";
  const endpoint = `/clientes?page=${page}&limit=${limit}&sort=${sort}&order=${order}`;
  const data = await apiServer<PaginatedResponse<ClienteResponse>>(endpoint);

  return <TableCliente user={user} data={data} />;
}
