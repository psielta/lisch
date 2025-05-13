import FormCategoria from "@/components/formularios/form-categoria";
import { apiServer } from "@/lib/api-server";
import { getCategoriaFromServer } from "@/proxies/get-categoria";
import { getCulinariaFromServer } from "@/proxies/get-culinaria";
import { User } from "@/context/auth-context";
export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const me = await apiServer<User>("/users/me");
  const culinarias = await getCulinariaFromServer();
  const categoria = await getCategoriaFromServer(id);

  return (
    <FormCategoria categoria={categoria} culinarias={culinarias} me={me} />
  );
}
