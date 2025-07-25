import { Tenant, User } from "@/context/auth-context";
import { apiServer } from "@/lib/api-server";
import {
  ProdutoListResponse,
  ProdutoResponse,
} from "@/rxjs/produto/produto.model";
import { redirect } from "next/navigation";
import React from "react";
import Vendas from "../vendas";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { CategoriaAdicionalListResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { PedidoClienteDTO } from "@/rxjs/pedido/pedido.model";
async function page() {
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_vendas ?? 0) !== 1) {
    redirect("/sem-permissao");
  }

  const tenant = await apiServer<Tenant>("/users/tenant/" + user.tenant_id);
  let defaultCliente: PedidoClienteDTO | null | undefined = null;
  if (tenant?.id_cliente_padrao) {
    defaultCliente = await apiServer<PedidoClienteDTO>(
      "/clientes/" + tenant.id_cliente_padrao
    );
  }

  let page: ProdutoListResponse | null | undefined = null;
  let categorias: ICoreCategoria[] | null | undefined = null;
  let adicionais: CategoriaAdicionalListResponse | null | undefined = null;
  try {
    page = await apiServer<ProdutoListResponse | null | undefined>(
      "/produtos?limit=2147483647"
    );
    categorias = await apiServer<ICoreCategoria[] | null | undefined>(
      "/categorias"
    );
    adicionais = await apiServer<
      CategoriaAdicionalListResponse | null | undefined
    >("/categoria-adicionais/tenant/" + user.tenant_id + "?limit=2147483647");
  } catch (error) {
    console.error(error);
  }
  let produtodata: ProdutoResponse[] = [];
  if (page) {
    produtodata = page.produtos;
  }
  console.log(tenant);
  return (
    <Vendas
      produtos={produtodata}
      user={user}
      categorias={categorias ?? []}
      adicionais={adicionais?.adicionais ?? []}
      pedido={null}
      defaultCliente={defaultCliente}
      tenant={tenant}
    />
  );
}

export default page;
