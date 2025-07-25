import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import FormCategoriaAdicional from "@/components/formularios/form-categoria-adicional";

export const dynamic = "force-dynamic";

export default async function CategoriaAdicionalNewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_adicional ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  const dataCategorias = await apiServer<ICoreCategoria[]>(`/categorias`);
  console.log("id >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", id);
  console.log(
    "dataCategorias >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
    dataCategorias
  );
  return (
    <FormCategoriaAdicional
      user={user}
      data={undefined}
      dataCategorias={dataCategorias}
      defaultIdCategoria={id}
    />
  );
}
