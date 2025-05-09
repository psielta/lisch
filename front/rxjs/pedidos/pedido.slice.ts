import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { ActionType, getType } from "typesafe-actions";
import { RootState } from "../store";
import { PaginatedResponse } from "@/dto/pagination";
import { GetPedidosResponse } from "./pedido.model.get";
import {
  alterarDadosListagemPedidoAction,
  getPedidoByIdAction,
  listPedidosAction,
  postOrPutPedidoAction,
  removePedidoByIdAction,
} from "./pedido.actions";
export type PedidosState = {
  pedidos: GetPedidosResponse;
  listPedidosActionState: null | "pending" | "completed" | "error";
  removeByIdActionState: null | "pending" | "completed" | "error";
  postOrPutActionState: null | "pending" | "completed" | "error";
  alterarDadosListagemActionState: null | "pending" | "completed" | "error";

  getByIdActionState: null | "pending" | "completed" | "error";
  /*Filtros */
  searchNomeClienteFilter?: string;
  searchStatusFilter?: string;
  searchDataInicioFilter?: string;
  searchDataFimFilter?: string;
  searchRepresentadaIdFilter?: string;
};

const initialState: PedidosState = {
  pedidos: {
    data: [],
    meta: {
      limit: 20,
      page: 1,
      total: 0,
    },
  },
  listPedidosActionState: null,
  removeByIdActionState: null,
  postOrPutActionState: null,
  getByIdActionState: null,
  alterarDadosListagemActionState: null,
  /*Filtros */
  searchNomeClienteFilter: undefined,
  searchStatusFilter: undefined,
  searchDataInicioFilter: undefined,
  searchDataFimFilter: undefined,
  searchRepresentadaIdFilter: undefined,
};

export const pedidosSlice = createSlice({
  name: "pedidos",
  initialState,
  reducers: {
    setSearchNomeClienteFilter: (state, action) => {
      state.searchNomeClienteFilter = action.payload;
    },
    setSearchStatusFilter: (state, action) => {
      state.searchStatusFilter = action.payload;
    },
    setSearchDataInicioFilter: (state, action) => {
      state.searchDataInicioFilter = action.payload;
    },
    setSearchDataFimFilter: (state, action) => {
      state.searchDataFimFilter = action.payload;
    },
    setSearchRepresentadaIdFilter: (state, action) => {
      state.searchRepresentadaIdFilter = action.payload;
    },
    clearPedidosState: (state) => {
      state.pedidos = {
        data: [],
        meta: {
          limit: 20,
          page: 1,
          total: 0,
        },
      };
      state.listPedidosActionState = null;
      state.removeByIdActionState = null;
      state.postOrPutActionState = null;
      state.alterarDadosListagemActionState = null;
      state.searchNomeClienteFilter = undefined;
      state.searchStatusFilter = undefined;
      state.searchDataInicioFilter = undefined;
      state.searchDataFimFilter = undefined;
      state.searchRepresentadaIdFilter = undefined;
    },
    resetAllStates: (state) => {
      state.listPedidosActionState = null;
      state.removeByIdActionState = null;
      state.postOrPutActionState = null;
      state.alterarDadosListagemActionState = null;
      state.searchNomeClienteFilter = undefined;
      state.searchStatusFilter = undefined;
      state.searchDataInicioFilter = undefined;
      state.searchDataFimFilter = undefined;
      state.searchRepresentadaIdFilter = undefined;
    },
    setPedidos: (state, action: PayloadAction<GetPedidosResponse>) => {
      state.pedidos = action.payload;
    },
    resetListPedidosActionState: (state) => {
      state.listPedidosActionState = null;
    },
    resetRemoveByIdActionState: (state) => {
      state.removeByIdActionState = null;
    },
    resetPostOrPutActionState: (state) => {
      state.postOrPutActionState = null;
    },
    resetGetByIdActionState: (state) => {
      state.getByIdActionState = null;
    },
    resetSearchNomeClienteFilter: (state) => {
      state.searchNomeClienteFilter = undefined;
    },
    resetSearchStatusFilter: (state) => {
      state.searchStatusFilter = undefined;
    },
    resetSearchDataInicioFilter: (state) => {
      state.searchDataInicioFilter = undefined;
    },
    resetSearchDataFimFilter: (state) => {
      state.searchDataFimFilter = undefined;
    },
    resetSearchRepresentadaIdFilter: (state) => {
      state.searchRepresentadaIdFilter = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getType(listPedidosAction.request), (state) => {
        state.listPedidosActionState = "pending";
      })
      .addCase(
        getType(listPedidosAction.success),
        (state, action: ActionType<typeof listPedidosAction.success>) => {
          state.pedidos = action.payload;
          state.listPedidosActionState = "completed";
        }
      )
      .addCase(
        getType(listPedidosAction.failure),
        (state, action: ActionType<typeof listPedidosAction.failure>) => {
          state.listPedidosActionState = "error";
        }
      );

    builder
      .addCase(getType(postOrPutPedidoAction.request), (state) => {
        state.postOrPutActionState = "pending";
      })
      .addCase(
        getType(postOrPutPedidoAction.success),
        (state, action: ActionType<typeof postOrPutPedidoAction.success>) => {
          state.postOrPutActionState = "completed";

          // Initialize data array if it doesn't exist
          if (!state.pedidos?.data) {
            state.pedidos = {
              data: [],
              meta: { limit: 20, page: 1, total: 0 },
            };
          }

          const index = state.pedidos.data.findIndex(
            (pedido) => pedido.id === action.payload.id
          );
          if (index >= 0) {
            state.pedidos.data[index] = action.payload;
          } else {
            state.pedidos.data.push(action.payload);
          }
        }
      )
      .addCase(
        getType(postOrPutPedidoAction.failure),
        (state, action: ActionType<typeof postOrPutPedidoAction.failure>) => {
          state.postOrPutActionState = "error";
        }
      );

    builder
      .addCase(getType(removePedidoByIdAction.request), (state) => {
        state.removeByIdActionState = "pending";
      })
      .addCase(
        getType(removePedidoByIdAction.success),
        (state, action: ActionType<typeof removePedidoByIdAction.success>) => {
          state.removeByIdActionState = "completed";
          const index = state.pedidos.data.findIndex(
            (pedido) => pedido.id === action.payload
          );
          if (index >= 0) {
            state.pedidos.data.splice(index, 1);
          }
        }
      )
      .addCase(
        getType(removePedidoByIdAction.failure),
        (state, action: ActionType<typeof removePedidoByIdAction.failure>) => {
          state.removeByIdActionState = "error";
        }
      );

    builder
      .addCase(getType(getPedidoByIdAction.request), (state) => {
        state.getByIdActionState = "pending";
      })
      .addCase(
        getType(getPedidoByIdAction.success),
        (state, action: ActionType<typeof getPedidoByIdAction.success>) => {
          state.getByIdActionState = "completed";
          const index = state.pedidos.data.findIndex(
            (pedido) => pedido.id === action.payload.id
          );
          if (index >= 0) {
            state.pedidos.data[index] = action.payload;
          } else {
            state.pedidos.data.push(action.payload);
          }
        }
      )
      .addCase(
        getType(getPedidoByIdAction.failure),
        (state, action: ActionType<typeof getPedidoByIdAction.failure>) => {
          state.getByIdActionState = "error";
        }
      );

    builder
      .addCase(getType(alterarDadosListagemPedidoAction.request), (state) => {
        state.alterarDadosListagemActionState = "pending";
      })
      .addCase(
        getType(alterarDadosListagemPedidoAction.success),
        (
          state,
          action: ActionType<typeof alterarDadosListagemPedidoAction.success>
        ) => {
          state.alterarDadosListagemActionState = "completed";
          const index = state.pedidos.data.findIndex(
            (pedido) => pedido.id === action.payload.id
          );
          if (index >= 0) {
            console.log(action.payload);
            state.pedidos.data[index] = action.payload;
          }
        }
      )
      .addCase(
        getType(alterarDadosListagemPedidoAction.failure),
        (
          state,
          action: ActionType<typeof alterarDadosListagemPedidoAction.failure>
        ) => {
          state.alterarDadosListagemActionState = "error";
        }
      );
  },
});

export const selectPedidosState = (state: RootState) => state.pedidos;
export const selectPedidosPagination = (state: RootState) =>
  state.pedidos.pedidos;
export const selectListPedidosActionState = (state: RootState) =>
  state.pedidos.listPedidosActionState;
export const selectRemoveByIdActionState = (state: RootState) =>
  state.pedidos.removeByIdActionState;
export const selectPostOrPutActionState = (state: RootState) =>
  state.pedidos.postOrPutActionState;
export const selectSearchNomeClienteFilter = (state: RootState) =>
  state.pedidos.searchNomeClienteFilter;
export const selectSearchStatusFilter = (state: RootState) =>
  state.pedidos.searchStatusFilter;
export const selectSearchDataInicioFilter = (state: RootState) =>
  state.pedidos.searchDataInicioFilter;
export const selectSearchDataFimFilter = (state: RootState) =>
  state.pedidos.searchDataFimFilter;
export const selectSearchRepresentadaIdFilter = (state: RootState) =>
  state.pedidos.searchRepresentadaIdFilter;
export const selectGetByIdActionState = (state: RootState) =>
  state.pedidos.getByIdActionState;

export const {
  clearPedidosState,
  resetListPedidosActionState,
  resetRemoveByIdActionState,
  resetPostOrPutActionState,
  resetSearchNomeClienteFilter,
  resetSearchStatusFilter,
  resetSearchDataInicioFilter,
  resetSearchDataFimFilter,
  resetSearchRepresentadaIdFilter,
  resetAllStates,
  setPedidos,
  setSearchNomeClienteFilter,
  setSearchStatusFilter,
  setSearchDataInicioFilter,
  setSearchDataFimFilter,
  setSearchRepresentadaIdFilter,
} = pedidosSlice.actions;
export default pedidosSlice.reducer;
