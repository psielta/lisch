import { User } from "@/context/auth-context";
import { apiServer } from "@/lib/api-server";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { redirect } from "next/navigation";
import React from "react";
import Vendas from "./vendas";

async function page() {
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_vendas ?? 0) !== 1) {
    redirect("/sem-permissao");
  }
  let produtos = await apiServer<ProdutoResponse[]>("/produtos");
  return <Vendas produtos={produtos} user={user} />;
}

export default page;
