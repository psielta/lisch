import { createAsyncAction } from "typesafe-actions";
import {
  ICategoriaStatusUpdate,
  ICoreCategoria,
  ICoreCategoriaCreate,
  ICoreCategoriaUpdate,
  ICategoriaOrdemUpdate,
  ICategoriaOpcaoStatusUpdate,
} from "./categoria.model";
// 1 - listCategoriaAction
export const listCategoriaAction = createAsyncAction(
  "categoria/list/pending",
  "categoria/list/fulfilled",
  "categoria/list/rejected"
)<void, ICoreCategoria[], void>();

// 3 - getCategoriaByIdAction
export const getCategoriaByIdAction = createAsyncAction(
  "categoria/getCategoriaById/pending",
  "categoria/getCategoriaById/fulfilled",
  "categoria/getCategoriaById/rejected"
)<string, ICoreCategoria, void>();

// 4 - removeCategoriaByIdAction
export const removeCategoriaByIdAction = createAsyncAction(
  "categoria/removeCategoriaById/pending",
  "categoria/removeCategoriaById/fulfilled",
  "categoria/removeCategoriaById/rejected"
)<string, string, void>();

// 5 - postOrPutCategoriaAction
export const postOrPutCategoriaAction = createAsyncAction(
  "categoria/postOrPutCategoria/pending",
  "categoria/postOrPutCategoria/fulfilled",
  "categoria/postOrPutCategoria/rejected"
)<ICoreCategoriaCreate | ICoreCategoriaUpdate, ICoreCategoria, void>();

export const alterarStatusCategoriaAction = createAsyncAction(
  "categoria/alterarStatusCategoria/pending",
  "categoria/alterarStatusCategoria/fulfilled",
  "categoria/alterarStatusCategoria/rejected"
)<ICategoriaStatusUpdate, ICategoriaStatusUpdate, void>();

export const alterarOrdemCategoriaAction = createAsyncAction(
  "categoria/alterarOrdemCategoria/pending",
  "categoria/alterarOrdemCategoria/fulfilled",
  "categoria/alterarOrdemCategoria/rejected"
)<ICategoriaOrdemUpdate, ICategoriaOrdemUpdate, void>();

export const alterarOpcaoStatusCategoriaAction = createAsyncAction(
  "categoria/alterarOpcaoStatusCategoria/pending",
  "categoria/alterarOpcaoStatusCategoria/fulfilled",
  "categoria/alterarOpcaoStatusCategoria/rejected"
)<ICategoriaOpcaoStatusUpdate, ICategoriaOpcaoStatusUpdate, void>();
