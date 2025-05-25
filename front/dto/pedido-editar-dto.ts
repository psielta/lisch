import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { PedidoResponse } from "@/rxjs/pedido/pedido.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";

export interface PedidoEditarDTO {
  pedido: PedidoResponse;
  categorias: ICoreCategoria[];
  adicionais: CategoriaAdicionalResponse[];
  produtos: ProdutoResponse[];
}
