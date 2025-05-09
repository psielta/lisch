import { createAsyncAction } from "typesafe-actions";
import {
  MovimentoEstoque,
  InputMovimentoEstoque,
} from "./movimentos-estoque.model";
import { PaginatedResponse, PaginationInput } from "@/dto/pagination";

export interface SearchMovimentosEstoqueInput {
  search: string;
  page?: number;
  page_size?: number;
}

// 1 - listMovimentosEstoqueAction
export const listMovimentosEstoqueAction = createAsyncAction(
  "movimentos-estoque/list/pending",
  "movimentos-estoque/list/fulfilled",
  "movimentos-estoque/list/rejected"
)<PaginationInput, PaginatedResponse<MovimentoEstoque>, void>();

// 2 - searchMovimentoByNomeProduto
export const searchMovimentosEstoqueByNomeProdutoAction = createAsyncAction(
  "movimentos-estoque/searchMovimentosEstoqueByNomeProduto/pending",
  "movimentos-estoque/searchMovimentosEstoqueByNomeProduto/fulfilled",
  "movimentos-estoque/searchMovimentosEstoqueByNomeProduto/rejected"
)<SearchMovimentosEstoqueInput, PaginatedResponse<MovimentoEstoque>, void>();

// 3 - searchCidadeActionByCodigoProduto
export const searchMovimentosEstoqueActionByCodigoProdutoAction =
  createAsyncAction(
    "movimentos-estoque/searchMovimentosEstoqueByCodigoProduto/pending",
    "movimentos-estoque/searchMovimentosEstoqueByCodigoProduto/fulfilled",
    "movimentos-estoque/searchMovimentosEstoqueByCodigoProduto/rejected"
  )<SearchMovimentosEstoqueInput, PaginatedResponse<MovimentoEstoque>, void>();

// 4 - searchMovimentoByCodigoExternoProduto
export const searchMovimentosEstoqueActionByCodigoExternoProdutoAction =
  createAsyncAction(
    "movimentos-estoque/searchMovimentosEstoqueByCodigoExternoProduto/pending",
    "movimentos-estoque/searchMovimentosEstoqueByCodigoExternoProduto/fulfilled",
    "movimentos-estoque/searchMovimentosEstoqueByCodigoExternoProduto/rejected"
  )<SearchMovimentosEstoqueInput, PaginatedResponse<MovimentoEstoque>, void>();

// 5 - getMovimentosEstoqueByIdAction
export const getMovimentosEstoqueByIdAction = createAsyncAction(
  "movimentos-estoque/getMovimentosEstoqueById/pending",
  "movimentos-estoque/getMovimentosEstoqueById/fulfilled",
  "movimentos-estoque/getMovimentosEstoqueById/rejected"
)<string, MovimentoEstoque, void>();

// 6 - removeCidadeByIdAction
export const removeMovimentosEstoqueByIdAction = createAsyncAction(
  "movimentos-estoque/removeMovimentosEstoqueById/pending",
  "movimentos-estoque/removeMovimentosEstoqueById/fulfilled",
  "movimentos-estoque/removeMovimentosEstoqueById/rejected"
)<string, string, void>();

// 7 - postOrPutMovimentosEstoqueAction
export const postOrPutMovimentosEstoqueAction = createAsyncAction(
  "movimentos-estoque/postOrPutMovimentosEstoque/pending",
  "movimentos-estoque/postOrPutMovimentosEstoque/fulfilled",
  "movimentos-estoque/postOrPutMovimentosEstoque/rejected"
)<InputMovimentoEstoque, MovimentoEstoque, void>();
