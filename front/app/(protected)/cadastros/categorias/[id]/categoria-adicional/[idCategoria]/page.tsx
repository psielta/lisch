import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";
import { User } from "@/context/auth-context";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import FormCategoriaAdicional from "@/components/formularios/form-categoria-adicional";
import Loader from "@/components/my/Loader";

export const dynamic = "force-dynamic";
type Params = Promise<{ id: string; idCategoria: string }>;
export default async function CategoriaAdicionalEditPage(props: {
  params: Params;
}) {
  const { id, idCategoria } = await props.params;
  console.log("id", id);
  console.log("idCategoria", idCategoria);
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_adicional ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  try {
    const dataCategorias = await apiServer<ICoreCategoria[]>(`/categorias`);
    const data = await apiServer<CategoriaAdicionalResponse>(
      `/categoria-adicionais/${idCategoria}`
    );
    console.log("data >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", data);

    if (!data) {
      redirect(`/cadastros/categorias/${idCategoria}/categoria-adicional`);
    }

    return (
      <FormCategoriaAdicional
        user={user}
        data={data}
        dataCategorias={dataCategorias}
        defaultIdCategoria={idCategoria}
      />
    );
  } catch (error) {
    redirect(`/cadastros/categorias/${idCategoria}/categoria-adicional`);
  }
}
