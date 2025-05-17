import { createAsyncAction } from "typesafe-actions";
import {
  ProdutoResponse,
  ProdutoListResponse,
  CreateProdutoRequest,
  UpdateProdutoRequest,
  UpdateProdutoStatusRequest,
  UpdateProdutoOrdemRequest,
  CreateProdutoPrecoRequest,
  UpdateProdutoPrecoRequest,
  ProdutoPrecoResponse,
  UpdateProdutoPrecoDisponibilidadeRequest,
} from "./produto.model";

// List produtos
export const listProdutosAction = createAsyncAction(
  "produtos/list/pending",
  "produtos/list/fulfilled",
  "produtos/list/rejected"
)<void, ProdutoListResponse, void>();

// Get produto by id
export const getProdutoByIdAction = createAsyncAction(
  "produtos/getProdutoById/pending",
  "produtos/getProdutoById/fulfilled",
  "produtos/getProdutoById/rejected"
)<string, ProdutoResponse, void>();

// Create produto
export const createProdutoAction = createAsyncAction(
  "produtos/createProduto/pending",
  "produtos/createProduto/fulfilled",
  "produtos/createProduto/rejected"
)<CreateProdutoRequest, ProdutoResponse, void>();

// Update produto
export const updateProdutoAction = createAsyncAction(
  "produtos/updateProduto/pending",
  "produtos/updateProduto/fulfilled",
  "produtos/updateProduto/rejected"
)<{ id: string; data: UpdateProdutoRequest }, ProdutoResponse, void>();

// Delete produto
export const deleteProdutoAction = createAsyncAction(
  "produtos/deleteProduto/pending",
  "produtos/deleteProduto/fulfilled",
  "produtos/deleteProduto/rejected"
)<string, { message: string; id: string }, void>();

// Update produto status
export const updateProdutoStatusAction = createAsyncAction(
  "produtos/updateStatus/pending",
  "produtos/updateStatus/fulfilled",
  "produtos/updateStatus/rejected"
)<
  { id: string; data: UpdateProdutoStatusRequest },
  { message: string },
  void
>();

// Update produto ordem
export const updateProdutoOrdemAction = createAsyncAction(
  "produtos/updateOrdem/pending",
  "produtos/updateOrdem/fulfilled",
  "produtos/updateOrdem/rejected"
)<{ id: string; data: UpdateProdutoOrdemRequest }, { message: string }, void>();

// Create produto preco
export const createProdutoPrecoAction = createAsyncAction(
  "produtos/createPreco/pending",
  "produtos/createPreco/fulfilled",
  "produtos/createPreco/rejected"
)<
  { id: string; data: CreateProdutoPrecoRequest },
  ProdutoPrecoResponse,
  void
>();

// Update produto preco
export const updateProdutoPrecoAction = createAsyncAction(
  "produtos/updatePreco/pending",
  "produtos/updatePreco/fulfilled",
  "produtos/updatePreco/rejected"
)<
  { id: string; precoId: string; data: UpdateProdutoPrecoRequest },
  ProdutoPrecoResponse,
  void
>();

// Delete produto preco
export const deleteProdutoPrecoAction = createAsyncAction(
  "produtos/deletePreco/pending",
  "produtos/deletePreco/fulfilled",
  "produtos/deletePreco/rejected"
)<{ id: string; precoId: string }, { message: string; id: string }, void>();

// Update produto preco disponibilidade
export const updateProdutoPrecoDisponibilidadeAction = createAsyncAction(
  "produtos/updatePrecoDisponibilidade/pending",
  "produtos/updatePrecoDisponibilidade/fulfilled",
  "produtos/updatePrecoDisponibilidade/rejected"
)<
  {
    id: string;
    precoId: string;
    data: UpdateProdutoPrecoDisponibilidadeRequest;
  },
  { message: string },
  void
>();
