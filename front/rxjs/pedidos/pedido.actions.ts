import { createAsyncAction } from "typesafe-actions";
import { Pedido, InputPedido } from "./pedido.model";
import { PaginationInput2 } from "@/dto/pagination";
import {
  GetPedidosResponse,
  Pedido as PedidoResponse,
} from "./pedido.model.get";

export const listPedidosAction = createAsyncAction(
  "pedido/list/pending",
  "pedido/list/fulfilled",
  "pedido/list/rejected"
)<PaginationInput2, GetPedidosResponse, void>();

export const getPedidoByIdAction = createAsyncAction(
  "pedido/getById/pending",
  "pedido/getById/fulfilled",
  "pedido/getById/rejected"
)<string, PedidoResponse, void>();

export const removePedidoByIdAction = createAsyncAction(
  "pedido/removeById/pending",
  "pedido/removeById/fulfilled",
  "pedido/removeById/rejected"
)<string, string, void>();

export const postOrPutPedidoAction = createAsyncAction(
  "pedido/postOrPut/pending",
  "pedido/postOrPut/fulfilled",
  "pedido/postOrPut/rejected"
)<InputPedido, PedidoResponse, void>();

export interface AlterarDadosListagemPedidoInput {
  id: string;
  status?: string;
  observacao?: string;
  codigo_manual?: string;
  cliente_id?: string;
  representada_id?: string;
  vendedor_id?: string;
  deposito_id?: string;
}

export const alterarDadosListagemPedidoAction = createAsyncAction(
  "pedido/alterarDadosListagem/pending",
  "pedido/alterarDadosListagem/fulfilled",
  "pedido/alterarDadosListagem/rejected"
)<AlterarDadosListagemPedidoInput, PedidoResponse, void>();
