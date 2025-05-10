import { createAsyncAction } from "typesafe-actions";
import { Cidade, InputCidade } from "./cidade.model";
import { PaginatedResponse, PaginationInput } from "../../dto/pagination";

export interface SearchCidadeInput {
  search: string;
  page?: number;
  page_size?: number;
}

// 1 - listCidadeAction
export const listCidadeAction = createAsyncAction(
  "cidades/list/pending",
  "cidades/list/fulfilled",
  "cidades/list/rejected"
)<PaginationInput, PaginatedResponse<Cidade>, void>();

// 2 - searchCidadeAction
export const searchCidadeAction = createAsyncAction(
  "cidades/searchCidade/pending",
  "cidades/searchCidade/fulfilled",
  "cidades/searchCidade/rejected"
)<SearchCidadeInput, PaginatedResponse<Cidade>, void>();

// 3 - getCidadeByIdAction
export const getCidadeByIdAction = createAsyncAction(
  "cidades/getCidadeById/pending",
  "cidades/getCidadeById/fulfilled",
  "cidades/getCidadeById/rejected"
)<string, Cidade, void>();

// 4 - removeCidadeByIdAction
export const removeCidadeByIdAction = createAsyncAction(
  "cidades/removeCidadeById/pending",
  "cidades/removeCidadeById/fulfilled",
  "cidades/removeCidadeById/rejected"
)<string, string, void>();

// 5 - postOrPutCidadeAction
export const postOrPutCidadeAction = createAsyncAction(
  "cidades/postOrPutCidade/pending",
  "cidades/postOrPutCidade/fulfilled",
  "cidades/postOrPutCidade/rejected"
)<InputCidade, Cidade, void>();
