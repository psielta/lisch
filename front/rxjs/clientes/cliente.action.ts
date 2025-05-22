import { createAsyncAction } from "typesafe-actions";
import {
  ClienteResponse,
  CreateClienteDTO,
  UpdateClienteDTO,
  PaginatedResponse,
} from "./cliente.model";

// List clientes action
export const listClienteAction = createAsyncAction(
  "cliente/list/pending",
  "cliente/list/fulfilled",
  "cliente/list/rejected"
)<void, PaginatedResponse<ClienteResponse>, void>();

// Get cliente by ID action
export const getClienteByIdAction = createAsyncAction(
  "cliente/getClienteById/pending",
  "cliente/getClienteById/fulfilled",
  "cliente/getClienteById/rejected"
)<string, ClienteResponse, void>();

// Delete cliente action
export const removeClienteByIdAction = createAsyncAction(
  "cliente/removeClienteById/pending",
  "cliente/removeClienteById/fulfilled",
  "cliente/removeClienteById/rejected"
)<string, string, void>();

// Create/Update cliente action
export const postOrPutClienteAction = createAsyncAction(
  "cliente/postOrPutCliente/pending",
  "cliente/postOrPutCliente/fulfilled",
  "cliente/postOrPutCliente/rejected"
)<CreateClienteDTO | UpdateClienteDTO, ClienteResponse, void>();
