import { createAsyncAction } from "typesafe-actions";
import {
  PedidoResponse,
  PedidoListResponse,
  CreatePedidoRequest,
  UpdatePedidoRequest,
  UpdatePedidoStatusRequest,
  UpdatePedidoProntoRequest,
} from "./pedido.model";

// List pedidos
export const listPedidosAction = createAsyncAction(
  "pedidos/list/pending",
  "pedidos/list/fulfilled",
  "pedidos/list/rejected"
)<void, PedidoListResponse, void>();

// Count pedidos
export const countPedidosAction = createAsyncAction(
  "pedidos/count/pending",
  "pedidos/count/fulfilled",
  "pedidos/count/rejected"
)<void, { count: number }, void>();

// Get pedido by id
export const getPedidoByIdAction = createAsyncAction(
  "pedidos/getPedidoById/pending",
  "pedidos/getPedidoById/fulfilled",
  "pedidos/getPedidoById/rejected"
)<string, PedidoResponse, void>();

// Get pedido by codigo
export const getPedidoByCodigoAction = createAsyncAction(
  "pedidos/getPedidoByCodigo/pending",
  "pedidos/getPedidoByCodigo/fulfilled",
  "pedidos/getPedidoByCodigo/rejected"
)<string, PedidoResponse, void>();

// Create pedido
export const createPedidoAction = createAsyncAction(
  "pedidos/createPedido/pending",
  "pedidos/createPedido/fulfilled",
  "pedidos/createPedido/rejected"
)<CreatePedidoRequest, PedidoResponse, void>();

// Update pedido
export const updatePedidoAction = createAsyncAction(
  "pedidos/updatePedido/pending",
  "pedidos/updatePedido/fulfilled",
  "pedidos/updatePedido/rejected"
)<{ id: string; data: UpdatePedidoRequest }, PedidoResponse, void>();

// Delete pedido
export const deletePedidoAction = createAsyncAction(
  "pedidos/deletePedido/pending",
  "pedidos/deletePedido/fulfilled",
  "pedidos/deletePedido/rejected"
)<string, { message: string; id: string }, void>();

// Update pedido status
export const updatePedidoStatusAction = createAsyncAction(
  "pedidos/updateStatus/pending",
  "pedidos/updateStatus/fulfilled",
  "pedidos/updateStatus/rejected"
)<{ id: string; data: UpdatePedidoStatusRequest }, { message: string }, void>();

// Update pedido pronto
export const updatePedidoProntoAction = createAsyncAction(
  "pedidos/updatePronto/pending",
  "pedidos/updatePronto/fulfilled",
  "pedidos/updatePronto/rejected"
)<{ id: string; data: UpdatePedidoProntoRequest }, { message: string }, void>();
