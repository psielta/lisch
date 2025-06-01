import { apiServer } from "@/lib/api-server";
import { PedidoListResponse } from "@/rxjs/pedido/pedido.model";
import GerenciarVendas from "../gerenciar-vendas";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { CategoriaAdicionalListResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { ProdutoListResponse } from "@/rxjs/produto/produto.model";
import { redirect } from "next/navigation";
import { User } from "@/context/auth-context";

export default async function Page(
  { params }: { params: Promise<{ id: string }> } // <-- AQUI
) {
  const { id } = await params;
  const user = await apiServer<User>("/users/me");

  if (user.admin !== 1 && (user.permission_vendas ?? 0) !== 1) {
    redirect("/sem-permissao");
  }
  let pedidos: PedidoListResponse | null | undefined;
  let page: ProdutoListResponse | null | undefined = null;
  let categorias: ICoreCategoria[] | null | undefined = null;
  let adicionais: CategoriaAdicionalListResponse | null | undefined = null;
  try {
    pedidos = await apiServer<PedidoListResponse | null | undefined>(
      "/pedidos?limit=2147483647"
    );
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
  return (
    <div>
      <GerenciarVendas
        pedidos={pedidos?.pedidos ?? []}
        produtos={page?.produtos ?? []}
        categorias={categorias ?? []}
        adicionais={adicionais?.adicionais ?? []}
        idPedidoSelecionado={id}
        user={user}
      />
    </div>
  );
}
