import { User } from "@/context/auth-context";
import { apiServer } from "@/lib/api-server";
import {
  ProdutoListResponse,
  ProdutoResponse,
} from "@/rxjs/produto/produto.model";
import { redirect } from "next/navigation";
import React from "react";
import Vendas from "./vendas";

async function page() {
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_vendas ?? 0) !== 1) {
    redirect("/sem-permissao");
  }
  let page: ProdutoListResponse | null | undefined = null;
  try {
    page = await apiServer<ProdutoListResponse | null | undefined>(
      "/produtos?limit=2147483647"
    );
  } catch (error) {
    console.error(error);
  }
  let produtodata: ProdutoResponse[] = [];
  if (page) {
    produtodata = page.produtos;
  }
  return <Vendas produtos={produtodata} user={user} />;
}

export default page;
