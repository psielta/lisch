import FormCategoria from "@/components/formularios/form-categoria";
import { getCulinariaFromServer } from "@/proxies/get-culinaria";
import { User } from "@/context/auth-context";
import { apiServer } from "@/lib/api-server";

export default async function CategoriaPage() {
  const culinarias = await getCulinariaFromServer();
  const me = await apiServer<User>("/users/me");

  return <FormCategoria categoria={null} culinarias={culinarias} me={me} />;
}
