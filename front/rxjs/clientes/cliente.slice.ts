import { createSlice } from "@reduxjs/toolkit";
import { ClienteResponse, PaginatedResponse } from "./cliente.model";
import { ActionType, getType } from "typesafe-actions";
import { RootState } from "../store";
import {
  getClienteByIdAction,
  listClienteAction,
  removeClienteByIdAction,
  postOrPutClienteAction,
} from "./cliente.action";
export type ClienteState = {
  clientes: PaginatedResponse<ClienteResponse>;
  listClienteActionState: null | "pending" | "completed" | "error";
  removeClienteByIdActionState: null | "pending" | "completed" | "error";
  postOrPutClienteActionState: null | "pending" | "completed" | "error";
  getClienteByIdActionState: null | "pending" | "completed" | "error";
  filtroNome: string | null;
  filtroFantasia: string | null;
  filtroCpf: string | null;
  filtroCnpj: string | null;
  filtroTelefone: string | null;
  filtroCelular: string | null;
  page: number;
  limit: number;
  sort: string;
  order: string;
};

const initialState: ClienteState = {
  clientes: {
    current_page: 1,
    total_pages: 1,
    page_size: 10,
    total_count: 0,
    items: [],
  },
  listClienteActionState: null,
  removeClienteByIdActionState: null,
  postOrPutClienteActionState: null,
  getClienteByIdActionState: null,
  filtroNome: null,
  filtroFantasia: null,
  filtroCpf: null,
  filtroCnpj: null,
  filtroTelefone: null,
  filtroCelular: null,
  page: 1,
  limit: 10,
  sort: "nome",
  order: "asc",
};

export const clienteSlice = createSlice({
  name: "cliente",
  initialState,
  reducers: {
    clearClienteState: (state) => {
      state.clientes = {
        current_page: 1,
        total_pages: 1,
        page_size: 10,
        total_count: 0,
        items: [],
      };
      state.listClienteActionState = null;
      state.removeClienteByIdActionState = null;
      state.postOrPutClienteActionState = null;
      state.getClienteByIdActionState = null;
      state.filtroNome = null;
      state.filtroFantasia = null;
      state.filtroCpf = null;
      state.filtroCnpj = null;
      state.filtroTelefone = null;
      state.filtroCelular = null;
      state.page = 1;
      state.limit = 10;
      state.sort = "nome";
      state.order = "asc";
    },
    initializeClienteState: (state, action) => {
      state.clientes = action.payload.clientes;
      state.listClienteActionState = action.payload.listClienteActionState;
      state.removeClienteByIdActionState =
        action.payload.removeClienteByIdActionState;
      state.postOrPutClienteActionState =
        action.payload.postOrPutClienteActionState;
      state.getClienteByIdActionState =
        action.payload.getClienteByIdActionState;
      state.filtroNome = action.payload.filtroNome;
      state.filtroFantasia = action.payload.filtroFantasia;
      state.filtroCpf = action.payload.filtroCpf;
      state.filtroCnpj = action.payload.filtroCnpj;
      state.filtroTelefone = action.payload.filtroTelefone;
      state.filtroCelular = action.payload.filtroCelular;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
      state.sort = action.payload.sort;
      state.order = action.payload.order;
    },
    setFiltroNome: (state, action) => {
      state.filtroNome = action.payload;
    },
    setFiltroFantasia: (state, action) => {
      state.filtroFantasia = action.payload;
    },
    setFiltroCpf: (state, action) => {
      state.filtroCpf = action.payload;
    },
    setFiltroCnpj: (state, action) => {
      state.filtroCnpj = action.payload;
    },
    setFiltroTelefone: (state, action) => {
      state.filtroTelefone = action.payload;
    },
    setFiltroCelular: (state, action) => {
      state.filtroCelular = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setOrder: (state, action) => {
      state.order = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getType(listClienteAction.request), (state) => {
        state.listClienteActionState = "pending";
      })
      .addCase(
        getType(listClienteAction.success),
        (state, action: ActionType<typeof listClienteAction.success>) => {
          state.clientes = action.payload;
          state.listClienteActionState = "completed";
        }
      )
      .addCase(
        getType(listClienteAction.failure),
        (state, action: ActionType<typeof listClienteAction.failure>) => {
          state.listClienteActionState = "error";
        }
      );
    builder
      .addCase(getType(getClienteByIdAction.request), (state) => {
        state.getClienteByIdActionState = "pending";
      })
      .addCase(
        getType(getClienteByIdAction.success),
        (state, action: ActionType<typeof getClienteByIdAction.success>) => {
          state.getClienteByIdActionState = "completed";
          const index = state.clientes.items.findIndex(
            (cliente) => cliente.id === action.payload.id
          );
          if (index >= 0) {
            state.clientes.items[index] = action.payload;
          } else {
            state.clientes.items.push(action.payload);
          }
        }
      )
      .addCase(
        getType(getClienteByIdAction.failure),
        (state, action: ActionType<typeof getClienteByIdAction.failure>) => {
          state.getClienteByIdActionState = "error";
        }
      );
    builder
      .addCase(getType(postOrPutClienteAction.request), (state) => {
        state.postOrPutClienteActionState = "pending";
      })
      .addCase(
        getType(postOrPutClienteAction.success),
        (state, action: ActionType<typeof postOrPutClienteAction.success>) => {
          state.postOrPutClienteActionState = "completed";
          const index = state.clientes.items.findIndex(
            (cliente) => cliente.id === action.payload.id
          );
          if (index >= 0) {
            state.clientes.items[index] = action.payload;
          }
        }
      )
      .addCase(
        getType(postOrPutClienteAction.failure),
        (state, action: ActionType<typeof postOrPutClienteAction.failure>) => {
          state.postOrPutClienteActionState = "error";
        }
      );
    builder
      .addCase(getType(removeClienteByIdAction.request), (state) => {
        state.removeClienteByIdActionState = "pending";
      })
      .addCase(
        getType(removeClienteByIdAction.success),
        (state, action: ActionType<typeof removeClienteByIdAction.success>) => {
          state.removeClienteByIdActionState = "completed";
          const index = state.clientes.items.findIndex(
            (cliente) => cliente.id === action.payload
          );
          if (index >= 0) {
            state.clientes.items.splice(index, 1);
          }
        }
      )
      .addCase(
        getType(removeClienteByIdAction.failure),
        (state, action: ActionType<typeof removeClienteByIdAction.failure>) => {
          state.removeClienteByIdActionState = "error";
        }
      );
  },
});

export const selectClienteState = (state: RootState) => state.cliente;
export const selectlistClienteActionState = (state: RootState) =>
  state.cliente.listClienteActionState;
export const selectremoveClienteByIdActionState = (state: RootState) =>
  state.cliente.removeClienteByIdActionState;
export const selectpostOrPutClienteActionState = (state: RootState) =>
  state.cliente.postOrPutClienteActionState;
export const selectgetClienteByIdActionState = (state: RootState) =>
  state.cliente.getClienteByIdActionState;
export const {
  clearClienteState,
  initializeClienteState,
  setFiltroNome,
  setFiltroFantasia,
  setFiltroCpf,
  setFiltroCnpj,
  setFiltroTelefone,
  setFiltroCelular,
  setPage,
  setLimit,
  setSort,
  setOrder,
} = clienteSlice.actions;

export default clienteSlice.reducer;
