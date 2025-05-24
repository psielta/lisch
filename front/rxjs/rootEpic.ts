import { combineEpics } from "redux-observable";
import { cidadeEpics } from "./cidade/cidade.epic";
import { categoriaEpics } from "./categoria/categoria.epic";
import { produtoEpics } from "./produto/produto.epic";
import { categoriaAdicionalEpics } from "./adicionais/categoria-adicional.epic";
import { clienteEpic } from "./clientes/cliente.epic";
import { pedidoEpics } from "./pedido/pedido.epic";
export const rootEpic = combineEpics(
  cidadeEpics,
  categoriaEpics,
  produtoEpics,
  categoriaAdicionalEpics,
  clienteEpic,
  pedidoEpics
);
