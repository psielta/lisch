import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api-server";

import { User } from "@/context/auth-context";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { CategoriaAdicionalListResponse } from "@/rxjs/adicionais/categoria-adicional.model";

import TableCategoriaAdicional from "./list-categoria-adicional";

export const dynamic = "force-dynamic"; // não cachear

export default async function CategoriaAdicionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  /* ---------------------------------------------------------------
   *  1. Autenticação & Autorização
   * --------------------------------------------------------------*/
  const user = await apiServer<User>("/users/me");

  // Ajuste o campo de permissão conforme existe no seu User (ex.: permission_adicional)
  if (user.admin !== 1 && (user.permission_adicional ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  /* ---------------------------------------------------------------
   *  2. Dados auxiliares (categorias) — usados em filtros/colunas
   * --------------------------------------------------------------*/
  const dataCategorias = await apiServer<ICoreCategoria[]>(`/categorias`);

  /* ---------------------------------------------------------------
   *  3. Listagem inicial de Categoria-Adicionais
   *     A API requer id_categoria → usaremos o primeiro da lista
   * --------------------------------------------------------------*/
  const limit = 20;
  const offset = 0;

  // Se não houver categorias, enviamos listagem vazia
  let data: CategoriaAdicionalListResponse = {
    adicionais: [],
    total_count: 0,
    limit,
    offset,
  };

  let defaultIdCategoria: string | undefined = id ?? undefined;

  console.log("dataCategorias.length", dataCategorias.length);
  if (dataCategorias.length) {
    if (!defaultIdCategoria) {
      defaultIdCategoria = dataCategorias[0].id;
    }

    const endpoint = `/categoria-adicionais?limit=${limit}&offset=${offset}&id_categoria=${defaultIdCategoria}`;
    data = await apiServer<CategoriaAdicionalListResponse>(endpoint);
  }

  console.log(data);

  /* ---------------------------------------------------------------
   *  4. Render
   * --------------------------------------------------------------*/
  return (
    <TableCategoriaAdicional
      user={user}
      data={data}
      dataCategorias={dataCategorias}
      defaultIdCategoria={defaultIdCategoria}
    />
  );
}
