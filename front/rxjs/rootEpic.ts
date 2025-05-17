import { combineEpics } from "redux-observable";
import { cidadeEpics } from "./cidade/cidade.epic";
import { categoriaEpics } from "./categoria/categoria.epic";
import { produtoEpics } from "./produto/produto.epic";

export const rootEpic = combineEpics(cidadeEpics, categoriaEpics, produtoEpics);
