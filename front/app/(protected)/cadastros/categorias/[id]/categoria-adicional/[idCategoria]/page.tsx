import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import FormCategoriaAdicional from "@/components/formularios/form-categoria-adicional";
import Loader from "@/components/my/Loader";

export const dynamic = "force-dynamic";

export default async function CategoriaAdicionalEditPage({
  params,
}: {
  params: { id: string; idCategoria: string };
}) {
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_adicional ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  try {
    const dataCategorias = await apiServer<ICoreCategoria[]>(`/categorias`);
    const data = await apiServer<CategoriaAdicionalResponse>(
      `/categoria-adicionais/${params.id}`
    );

    if (!data) {
      redirect(
        `/cadastros/categorias/${params.idCategoria}/categoria-adicional`
      );
    }

    return (
      <FormCategoriaAdicional
        user={user}
        data={data}
        dataCategorias={dataCategorias}
      />
    );
  } catch (error) {
    redirect(`/cadastros/categorias/${params.idCategoria}/categoria-adicional`);
  }
}
