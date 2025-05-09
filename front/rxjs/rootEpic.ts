import { combineEpics } from "redux-observable";
import { cidadeEpics } from "./cidade/cidade.epic";
import { movimentosEstoqueEpics } from "./movimentos-estoque/movimentos-estoque.epic";
import { pedidoEpics } from "./pedidos/pedido.epic";

export const rootEpic = combineEpics(
  cidadeEpics,
  movimentosEstoqueEpics,
  pedidoEpics
);
