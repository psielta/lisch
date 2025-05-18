import { combineEpics } from "redux-observable";
import { cidadeEpics } from "./cidade/cidade.epic";
import { categoriaEpics } from "./categoria/categoria.epic";
import { produtoEpics } from "./produto/produto.epic";
import { categoriaAdicionalEpics } from "./adicionais/categoria-adicional.epic";

export const rootEpic = combineEpics(
  cidadeEpics,
  categoriaEpics,
  produtoEpics,
  categoriaAdicionalEpics
);
