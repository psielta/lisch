import { createSlice } from "@reduxjs/toolkit";
import {
  PedidoResponse,
  PedidoListResponse,
  CreatePedidoRequest,
  UpdatePedidoRequest,
  UpdatePedidoStatusRequest,
  UpdatePedidoProntoRequest,
} from "./pedido.model";
import { ActionType, getType } from "typesafe-actions";
import { RootState } from "../store";
import {
  listPedidosAction,
  countPedidosAction,
  getPedidoByIdAction,
  getPedidoByCodigoAction,
  createPedidoAction,
  updatePedidoAction,
  deletePedidoAction,
  updatePedidoStatusAction,
  updatePedidoProntoAction,
} from "./pedido.action";

export type PedidoState = {
  pedidos: PedidoListResponse;
  listPedidosActionState: null | "pending" | "completed" | "error";
  countPedidosActionState: null | "pending" | "completed" | "error";
  getPedidoByIdActionState: null | "pending" | "completed" | "error";
  getPedidoByCodigoActionState: null | "pending" | "completed" | "error";
  createPedidoActionState: null | "pending" | "completed" | "error";
  updatePedidoActionState: null | "pending" | "completed" | "error";
  deletePedidoActionState: null | "pending" | "completed" | "error";
  updatePedidoStatusActionState: null | "pending" | "completed" | "error";
  updatePedidoProntoActionState: null | "pending" | "completed" | "error";
  postOrPutPedidoActionState: null | "pending" | "completed" | "error";
  removePedidoByIdActionState: null | "pending" | "completed" | "error";
  idCliente?: string;
  status?: string;
  tipoEntrega?: "Delivery" | "Retirada";
  dataInicio?: string;
  dataFim?: string;
  codigoPedido?: string;
  limit: number;
  offset: number;
  totalCount: number;
};

const initialState: PedidoState = {
  pedidos: {
    pedidos: [],
    total: 0,
    limit: 20,
    offset: 0,
  },
  listPedidosActionState: null,
  countPedidosActionState: null,
  getPedidoByIdActionState: null,
  getPedidoByCodigoActionState: null,
  createPedidoActionState: null,
  updatePedidoActionState: null,
  deletePedidoActionState: null,
  updatePedidoStatusActionState: null,
  updatePedidoProntoActionState: null,
  postOrPutPedidoActionState: null,
  removePedidoByIdActionState: null,
  idCliente: undefined,
  status: undefined,
  tipoEntrega: undefined,
  dataInicio: undefined,
  dataFim: undefined,
  codigoPedido: undefined,
  limit: 20,
  offset: 0,
  totalCount: 0,
};

export const pedidoSlice = createSlice({
  name: "pedido",
  initialState,
  reducers: {
    initializeState: (state, action) => {
      state.pedidos = action.payload.pedidos;
      state.listPedidosActionState = null;
      state.countPedidosActionState = null;
      state.getPedidoByIdActionState = null;
      state.getPedidoByCodigoActionState = null;
      state.createPedidoActionState = null;
      state.updatePedidoActionState = null;
      state.deletePedidoActionState = null;
      state.updatePedidoStatusActionState = null;
      state.updatePedidoProntoActionState = null;
      state.postOrPutPedidoActionState = null;
      state.removePedidoByIdActionState = null;
      state.idCliente = action.payload.idCliente;
      state.status = action.payload.status;
      state.tipoEntrega = action.payload.tipoEntrega;
      state.dataInicio = action.payload.dataInicio;
      state.dataFim = action.payload.dataFim;
      state.codigoPedido = action.payload.codigoPedido;
      state.limit = action.payload.limit;
      state.offset = action.payload.offset;
      state.totalCount = action.payload.totalCount;
    },
    clearPedidoState: (state) => {
      state.pedidos = {
        pedidos: [],
        total: 0,
        limit: 20,
        offset: 0,
      };
      state.listPedidosActionState = null;
      state.countPedidosActionState = null;
      state.getPedidoByIdActionState = null;
      state.getPedidoByCodigoActionState = null;
      state.createPedidoActionState = null;
      state.updatePedidoActionState = null;
      state.deletePedidoActionState = null;
      state.updatePedidoStatusActionState = null;
      state.updatePedidoProntoActionState = null;
      state.postOrPutPedidoActionState = null;
      state.removePedidoByIdActionState = null;
      state.idCliente = undefined;
      state.status = undefined;
      state.tipoEntrega = undefined;
      state.dataInicio = undefined;
      state.dataFim = undefined;
      state.codigoPedido = undefined;
      state.limit = 20;
      state.offset = 0;
      state.totalCount = 0;
    },
    resetListPedidosActionState: (state) => {
      state.listPedidosActionState = null;
    },
    resetCountPedidosActionState: (state) => {
      state.countPedidosActionState = null;
    },
    resetGetPedidoByIdActionState: (state) => {
      state.getPedidoByIdActionState = null;
    },
    resetGetPedidoByCodigoActionState: (state) => {
      state.getPedidoByCodigoActionState = null;
    },
    resetCreatePedidoActionState: (state) => {
      state.createPedidoActionState = null;
    },
    resetUpdatePedidoActionState: (state) => {
      state.updatePedidoActionState = null;
    },
    resetDeletePedidoActionState: (state) => {
      state.deletePedidoActionState = null;
    },
    resetUpdatePedidoStatusActionState: (state) => {
      state.updatePedidoStatusActionState = null;
    },
    resetUpdatePedidoProntoActionState: (state) => {
      state.updatePedidoProntoActionState = null;
    },
    resetPostOrPutPedidoActionState: (state) => {
      state.postOrPutPedidoActionState = null;
    },
    resetRemovePedidoByIdActionState: (state) => {
      state.removePedidoByIdActionState = null;
    },
    setIdCliente: (state, action) => {
      state.idCliente = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setTipoEntrega: (state, action) => {
      state.tipoEntrega = action.payload;
    },
    setDataInicio: (state, action) => {
      state.dataInicio = action.payload;
    },
    setDataFim: (state, action) => {
      state.dataFim = action.payload;
    },
    setCodigoPedido: (state, action) => {
      state.codigoPedido = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    setOffset: (state, action) => {
      state.offset = action.payload;
    },
  },
  extraReducers: (builder) => {
    // List pedidos
    builder.addCase(getType(listPedidosAction.request), (state) => {
      state.listPedidosActionState = "pending";
    });
    builder.addCase(
      getType(listPedidosAction.success),
      (state, action: ActionType<typeof listPedidosAction.success>) => {
        state.listPedidosActionState = "completed";
        state.pedidos = action.payload;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.totalCount = action.payload.total;
      }
    );
    builder.addCase(getType(listPedidosAction.failure), (state) => {
      state.listPedidosActionState = "error";
    });

    // Count pedidos
    builder.addCase(getType(countPedidosAction.request), (state) => {
      state.countPedidosActionState = "pending";
    });
    builder.addCase(
      getType(countPedidosAction.success),
      (state, action: ActionType<typeof countPedidosAction.success>) => {
        state.countPedidosActionState = "completed";
        state.totalCount = action.payload.count;
      }
    );
    builder.addCase(getType(countPedidosAction.failure), (state) => {
      state.countPedidosActionState = "error";
    });

    // Get pedido by id
    builder.addCase(getType(getPedidoByIdAction.request), (state) => {
      state.getPedidoByIdActionState = "pending";
    });
    builder.addCase(
      getType(getPedidoByIdAction.success),
      (state, action: ActionType<typeof getPedidoByIdAction.success>) => {
        state.getPedidoByIdActionState = "completed";
        const index = state.pedidos.pedidos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index >= 0) {
          state.pedidos.pedidos[index] = action.payload;
        } else {
          state.pedidos.pedidos.push(action.payload);
        }
      }
    );
    builder.addCase(getType(getPedidoByIdAction.failure), (state) => {
      state.getPedidoByIdActionState = "error";
    });

    // Get pedido by codigo
    builder.addCase(getType(getPedidoByCodigoAction.request), (state) => {
      state.getPedidoByCodigoActionState = "pending";
    });
    builder.addCase(
      getType(getPedidoByCodigoAction.success),
      (state, action: ActionType<typeof getPedidoByCodigoAction.success>) => {
        state.getPedidoByCodigoActionState = "completed";
        const index = state.pedidos.pedidos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index >= 0) {
          state.pedidos.pedidos[index] = action.payload;
        } else {
          state.pedidos.pedidos.push(action.payload);
        }
      }
    );
    builder.addCase(getType(getPedidoByCodigoAction.failure), (state) => {
      state.getPedidoByCodigoActionState = "error";
    });

    // Create pedido
    builder.addCase(getType(createPedidoAction.request), (state) => {
      state.createPedidoActionState = "pending";
      state.postOrPutPedidoActionState = "pending";
    });
    builder.addCase(
      getType(createPedidoAction.success),
      (state, action: ActionType<typeof createPedidoAction.success>) => {
        state.createPedidoActionState = "completed";
        state.postOrPutPedidoActionState = "completed";
        state.pedidos.pedidos.push(action.payload);
      }
    );
    builder.addCase(getType(createPedidoAction.failure), (state) => {
      state.createPedidoActionState = "error";
      state.postOrPutPedidoActionState = "error";
    });

    // Update pedido
    builder.addCase(getType(updatePedidoAction.request), (state) => {
      state.updatePedidoActionState = "pending";
      state.postOrPutPedidoActionState = "pending";
    });
    builder.addCase(
      getType(updatePedidoAction.success),
      (state, action: ActionType<typeof updatePedidoAction.success>) => {
        state.updatePedidoActionState = "completed";
        state.postOrPutPedidoActionState = "completed";
        const index = state.pedidos.pedidos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index >= 0) {
          state.pedidos.pedidos[index] = action.payload;
        }
      }
    );
    builder.addCase(getType(updatePedidoAction.failure), (state) => {
      state.updatePedidoActionState = "error";
      state.postOrPutPedidoActionState = "error";
    });

    // Delete pedido
    builder.addCase(getType(deletePedidoAction.request), (state) => {
      state.deletePedidoActionState = "pending";
      state.removePedidoByIdActionState = "pending";
    });
    builder.addCase(
      getType(deletePedidoAction.success),
      (state, action: ActionType<typeof deletePedidoAction.success>) => {
        state.deletePedidoActionState = "completed";
        state.removePedidoByIdActionState = "completed";
        state.pedidos.pedidos = state.pedidos.pedidos.filter(
          (p) => p.id !== action.payload.id
        );
      }
    );
    builder.addCase(getType(deletePedidoAction.failure), (state) => {
      state.deletePedidoActionState = "error";
      state.removePedidoByIdActionState = "error";
    });

    // Update pedido status
    builder.addCase(getType(updatePedidoStatusAction.request), (state) => {
      state.updatePedidoStatusActionState = "pending";
    });
    builder.addCase(getType(updatePedidoStatusAction.success), (state) => {
      state.updatePedidoStatusActionState = "completed";
    });
    builder.addCase(getType(updatePedidoStatusAction.failure), (state) => {
      state.updatePedidoStatusActionState = "error";
    });

    // Update pedido pronto
    builder.addCase(getType(updatePedidoProntoAction.request), (state) => {
      state.updatePedidoProntoActionState = "pending";
    });
    builder.addCase(getType(updatePedidoProntoAction.success), (state) => {
      state.updatePedidoProntoActionState = "completed";
    });
    builder.addCase(getType(updatePedidoProntoAction.failure), (state) => {
      state.updatePedidoProntoActionState = "error";
    });
  },
});

export const selectPedidoState = (state: RootState) => state.pedido;
export const selectListPedidosActionState = (state: RootState) =>
  state.pedido.listPedidosActionState;
export const selectCountPedidosActionState = (state: RootState) =>
  state.pedido.countPedidosActionState;
export const selectGetPedidoByIdActionState = (state: RootState) =>
  state.pedido.getPedidoByIdActionState;
export const selectGetPedidoByCodigoActionState = (state: RootState) =>
  state.pedido.getPedidoByCodigoActionState;
export const selectCreatePedidoActionState = (state: RootState) =>
  state.pedido.createPedidoActionState;
export const selectUpdatePedidoActionState = (state: RootState) =>
  state.pedido.updatePedidoActionState;
export const selectDeletePedidoActionState = (state: RootState) =>
  state.pedido.deletePedidoActionState;
export const selectUpdatePedidoStatusActionState = (state: RootState) =>
  state.pedido.updatePedidoStatusActionState;
export const selectUpdatePedidoProntoActionState = (state: RootState) =>
  state.pedido.updatePedidoProntoActionState;
export const selectPostOrPutPedidoActionState = (state: RootState) =>
  state.pedido.postOrPutPedidoActionState;
export const selectRemovePedidoByIdActionState = (state: RootState) =>
  state.pedido.removePedidoByIdActionState;
export const selectIdCliente = (state: RootState) => state.pedido.idCliente;
export const selectStatus = (state: RootState) => state.pedido.status;
export const selectTipoEntrega = (state: RootState) => state.pedido.tipoEntrega;
export const selectDataInicio = (state: RootState) => state.pedido.dataInicio;
export const selectDataFim = (state: RootState) => state.pedido.dataFim;
export const selectCodigoPedido = (state: RootState) =>
  state.pedido.codigoPedido;
export const selectLimit = (state: RootState) => state.pedido.limit;
export const selectOffset = (state: RootState) => state.pedido.offset;

export const {
  initializeState,
  clearPedidoState,
  resetListPedidosActionState,
  resetCountPedidosActionState,
  resetGetPedidoByIdActionState,
  resetGetPedidoByCodigoActionState,
  resetCreatePedidoActionState,
  resetUpdatePedidoActionState,
  resetDeletePedidoActionState,
  resetUpdatePedidoStatusActionState,
  resetUpdatePedidoProntoActionState,
  resetPostOrPutPedidoActionState,
  resetRemovePedidoByIdActionState,
  setIdCliente,
  setStatus,
  setTipoEntrega,
  setDataInicio,
  setDataFim,
  setCodigoPedido,
  setLimit,
  setOffset,
} = pedidoSlice.actions;

export const pedidoReducer = pedidoSlice.reducer;
