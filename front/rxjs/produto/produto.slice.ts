import { createSlice } from "@reduxjs/toolkit";
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
import { ActionType, getType, PayloadAction } from "typesafe-actions";
import { RootState } from "../store";
import {
  listProdutosAction,
  getProdutoByIdAction,
  createProdutoAction,
  updateProdutoAction,
  deleteProdutoAction,
  createProdutoPrecoAction,
  updateProdutoPrecoAction,
  deleteProdutoPrecoAction,
  updateProdutoPrecoDisponibilidadeAction,
  updateProdutoStatusAction,
  updateProdutoOrdemAction,
} from "./produto.action";

export type ProdutoState = {
  produtos: ProdutoListResponse;
  listProdutosActionState: null | "pending" | "completed" | "error";
  removeProdutoByIdActionState: null | "pending" | "completed" | "error";
  postOrPutProdutoActionState: null | "pending" | "completed" | "error";
  getProdutoByIdActionState: null | "pending" | "completed" | "error";
  createProdutoActionState: null | "pending" | "completed" | "error";
  updateProdutoActionState: null | "pending" | "completed" | "error";
  deleteProdutoActionState: null | "pending" | "completed" | "error";
  updateProdutoStatusActionState: null | "pending" | "completed" | "error";
  updateProdutoOrdemActionState: null | "pending" | "completed" | "error";
  createProdutoPrecoActionState: null | "pending" | "completed" | "error";
  updateProdutoPrecoActionState: null | "pending" | "completed" | "error";
  deleteProdutoPrecoActionState: null | "pending" | "completed" | "error";
  updateProdutoPrecoDisponibilidadeActionState:
    | null
    | "pending"
    | "completed"
    | "error";
  idCategoria?: string;
  nome?: string;
  limit: number;
  offset: number;
  totalCount: number;
};

const initialState: ProdutoState = {
  produtos: {
    produtos: [],
    total_count: 0,
    limit: 20,
    offset: 0,
  },
  listProdutosActionState: null,
  removeProdutoByIdActionState: null,
  postOrPutProdutoActionState: null,
  getProdutoByIdActionState: null,
  createProdutoActionState: null,
  updateProdutoActionState: null,
  deleteProdutoActionState: null,
  updateProdutoStatusActionState: null,
  updateProdutoOrdemActionState: null,
  createProdutoPrecoActionState: null,
  updateProdutoPrecoActionState: null,
  deleteProdutoPrecoActionState: null,
  updateProdutoPrecoDisponibilidadeActionState: null,
  idCategoria: undefined,
  nome: undefined,
  limit: 20,
  offset: 0,
  totalCount: 0,
};

export const produtoSlice = createSlice({
  name: "produto",
  initialState,
  reducers: {
    initializeState: (state, action) => {
      state.produtos = action.payload.produtos;
      state.listProdutosActionState = null;
      state.removeProdutoByIdActionState = null;
      state.postOrPutProdutoActionState = null;
      state.getProdutoByIdActionState = null;
      state.createProdutoActionState = null;
      state.updateProdutoActionState = null;
      state.deleteProdutoActionState = null;
      state.updateProdutoStatusActionState = null;
      state.updateProdutoOrdemActionState = null;
      state.createProdutoPrecoActionState = null;
      state.updateProdutoPrecoActionState = null;
      state.deleteProdutoPrecoActionState = null;
      state.updateProdutoPrecoDisponibilidadeActionState = null;
      state.idCategoria = action.payload.idCategoria;
      state.nome = undefined;
      state.limit = action.payload.limit;
      state.offset = action.payload.offset;
      state.totalCount = action.payload.totalCount;
    },
    clearProdutoState: (state) => {
      state.produtos = {
        produtos: [],
        total_count: 0,
        limit: 20,
        offset: 0,
      };
      state.listProdutosActionState = null;
      state.removeProdutoByIdActionState = null;
      state.postOrPutProdutoActionState = null;
      state.getProdutoByIdActionState = null;
      state.createProdutoActionState = null;
      state.updateProdutoActionState = null;
      state.deleteProdutoActionState = null;
      state.updateProdutoStatusActionState = null;
      state.updateProdutoOrdemActionState = null;
      state.createProdutoPrecoActionState = null;
      state.updateProdutoPrecoActionState = null;
      state.deleteProdutoPrecoActionState = null;
      state.updateProdutoPrecoDisponibilidadeActionState = null;
      state.idCategoria = undefined;
      state.limit = 20;
      state.offset = 0;
      state.totalCount = 0;
      state.nome = undefined;
    },
    resetListProdutoActionState: (state) => {
      state.listProdutosActionState = null;
    },
    resetRemoveProdutoByIdActionState: (state) => {
      state.removeProdutoByIdActionState = null;
    },
    resetPostOrPutProdutoActionState: (state) => {
      state.postOrPutProdutoActionState = null;
    },
    resetGetProdutoByIdActionState: (state) => {
      state.getProdutoByIdActionState = null;
    },
    resetCreateProdutoActionState: (state) => {
      state.createProdutoActionState = null;
    },
    resetUpdateProdutoActionState: (state) => {
      state.updateProdutoActionState = null;
    },
    resetDeleteProdutoActionState: (state) => {
      state.deleteProdutoActionState = null;
    },
    resetUpdateProdutoStatusActionState: (state) => {
      state.updateProdutoStatusActionState = null;
    },
    resetUpdateProdutoOrdemActionState: (state) => {
      state.updateProdutoOrdemActionState = null;
    },
    resetCreateProdutoPrecoActionState: (state) => {
      state.createProdutoPrecoActionState = null;
    },
    resetUpdateProdutoPrecoActionState: (state) => {
      state.updateProdutoPrecoActionState = null;
    },
    resetDeleteProdutoPrecoActionState: (state) => {
      state.deleteProdutoPrecoActionState = null;
    },
    resetUpdateProdutoPrecoDisponibilidadeActionState: (state) => {
      state.updateProdutoPrecoDisponibilidadeActionState = null;
    },
    setIdCategoria: (state, action) => {
      state.idCategoria = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    setOffset: (state, action) => {
      state.offset = action.payload;
    },
    setNome: (state, action) => {
      state.nome = action.payload;
    },
  },
  extraReducers: (builder) => {
    // List produtos
    builder.addCase(getType(listProdutosAction.request), (state) => {
      state.listProdutosActionState = "pending";
    });
    builder.addCase(
      getType(listProdutosAction.success),
      (state, action: ActionType<typeof listProdutosAction.success>) => {
        state.listProdutosActionState = "completed";
        state.produtos = action.payload;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.totalCount = action.payload.total_count;
      }
    );
    builder.addCase(getType(listProdutosAction.failure), (state) => {
      state.listProdutosActionState = "error";
    });

    // Get produto by id
    builder.addCase(getType(getProdutoByIdAction.request), (state) => {
      state.getProdutoByIdActionState = "pending";
    });
    builder.addCase(
      getType(getProdutoByIdAction.success),
      (state, action: ActionType<typeof getProdutoByIdAction.success>) => {
        state.getProdutoByIdActionState = "completed";
        const index = state.produtos.produtos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index >= 0) {
          state.produtos.produtos[index] = action.payload;
        } else {
          state.produtos.produtos.push(action.payload);
        }
      }
    );
    builder.addCase(getType(getProdutoByIdAction.failure), (state) => {
      state.getProdutoByIdActionState = "error";
    });

    // Create produto
    builder.addCase(getType(createProdutoAction.request), (state) => {
      state.createProdutoActionState = "pending";
      state.postOrPutProdutoActionState = "pending";
    });
    builder.addCase(
      getType(createProdutoAction.success),
      (state, action: ActionType<typeof createProdutoAction.success>) => {
        state.createProdutoActionState = "completed";
        state.postOrPutProdutoActionState = "completed";
        state.produtos.produtos.push(action.payload);
      }
    );
    builder.addCase(getType(createProdutoAction.failure), (state) => {
      state.createProdutoActionState = "error";
      state.postOrPutProdutoActionState = "error";
    });

    // Update produto
    builder.addCase(getType(updateProdutoAction.request), (state) => {
      state.updateProdutoActionState = "pending";
      state.postOrPutProdutoActionState = "pending";
    });
    builder.addCase(
      getType(updateProdutoAction.success),
      (state, action: ActionType<typeof updateProdutoAction.success>) => {
        state.updateProdutoActionState = "completed";
        state.postOrPutProdutoActionState = "completed";
        const index = state.produtos.produtos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index >= 0) {
          state.produtos.produtos[index] = action.payload;
        }
      }
    );
    builder.addCase(getType(updateProdutoAction.failure), (state) => {
      state.updateProdutoActionState = "error";
      state.postOrPutProdutoActionState = "error";
    });

    // Delete produto
    builder.addCase(getType(deleteProdutoAction.request), (state) => {
      state.deleteProdutoActionState = "pending";
      state.removeProdutoByIdActionState = "pending";
    });
    builder.addCase(
      getType(deleteProdutoAction.success),
      (state, action: ActionType<typeof deleteProdutoAction.success>) => {
        state.deleteProdutoActionState = "completed";
        state.removeProdutoByIdActionState = "completed";
        state.produtos.produtos = state.produtos.produtos.filter(
          (p) => p.id !== action.payload.id
        );
      }
    );
    builder.addCase(getType(deleteProdutoAction.failure), (state) => {
      state.deleteProdutoActionState = "error";
      state.removeProdutoByIdActionState = "error";
    });

    // Update produto status
    builder.addCase(getType(updateProdutoStatusAction.request), (state) => {
      state.updateProdutoStatusActionState = "pending";
    });
    builder.addCase(getType(updateProdutoStatusAction.success), (state) => {
      state.updateProdutoStatusActionState = "completed";
    });
    builder.addCase(getType(updateProdutoStatusAction.failure), (state) => {
      state.updateProdutoStatusActionState = "error";
    });

    // Update produto ordem
    builder.addCase(getType(updateProdutoOrdemAction.request), (state) => {
      state.updateProdutoOrdemActionState = "pending";
    });
    builder.addCase(getType(updateProdutoOrdemAction.success), (state) => {
      state.updateProdutoOrdemActionState = "completed";
    });
    builder.addCase(getType(updateProdutoOrdemAction.failure), (state) => {
      state.updateProdutoOrdemActionState = "error";
    });

    // Create produto preco
    builder.addCase(getType(createProdutoPrecoAction.request), (state) => {
      state.createProdutoPrecoActionState = "pending";
    });
    builder.addCase(
      getType(createProdutoPrecoAction.success),
      (state, action: ActionType<typeof createProdutoPrecoAction.success>) => {
        state.createProdutoPrecoActionState = "completed";
        const produtoIndex = state.produtos.produtos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (produtoIndex >= 0) {
          if (!state.produtos.produtos[produtoIndex].precos) {
            state.produtos.produtos[produtoIndex].precos = [];
          }
          state.produtos.produtos[produtoIndex].precos!.push(action.payload);
        }
      }
    );
    builder.addCase(getType(createProdutoPrecoAction.failure), (state) => {
      state.createProdutoPrecoActionState = "error";
    });

    // Update produto preco
    builder.addCase(getType(updateProdutoPrecoAction.request), (state) => {
      state.updateProdutoPrecoActionState = "pending";
    });
    builder.addCase(
      getType(updateProdutoPrecoAction.success),
      (state, action: ActionType<typeof updateProdutoPrecoAction.success>) => {
        state.updateProdutoPrecoActionState = "completed";
        const produtoIndex = state.produtos.produtos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (produtoIndex >= 0 && state.produtos.produtos[produtoIndex].precos) {
          const precoIndex = state.produtos.produtos[
            produtoIndex
          ].precos!.findIndex((p) => p.id === action.payload.id);
          if (precoIndex >= 0) {
            state.produtos.produtos[produtoIndex].precos![precoIndex] =
              action.payload;
          }
        }
      }
    );
    builder.addCase(getType(updateProdutoPrecoAction.failure), (state) => {
      state.updateProdutoPrecoActionState = "error";
    });

    // Delete produto preco
    builder.addCase(getType(deleteProdutoPrecoAction.request), (state) => {
      state.deleteProdutoPrecoActionState = "pending";
    });
    builder.addCase(
      getType(deleteProdutoPrecoAction.success),
      (state, action: ActionType<typeof deleteProdutoPrecoAction.success>) => {
        state.deleteProdutoPrecoActionState = "completed";
        const produtoIndex = state.produtos.produtos.findIndex(
          (p) => p.id === action.payload.id
        );
        if (produtoIndex >= 0 && state.produtos.produtos[produtoIndex].precos) {
          state.produtos.produtos[produtoIndex].precos =
            state.produtos.produtos[produtoIndex].precos!.filter(
              (p) => p.id !== action.payload.id
            );
        }
      }
    );
    builder.addCase(getType(deleteProdutoPrecoAction.failure), (state) => {
      state.deleteProdutoPrecoActionState = "error";
    });

    // Update produto preco disponibilidade
    builder.addCase(
      getType(updateProdutoPrecoDisponibilidadeAction.request),
      (state) => {
        state.updateProdutoPrecoDisponibilidadeActionState = "pending";
      }
    );
    builder.addCase(
      getType(updateProdutoPrecoDisponibilidadeAction.success),
      (state) => {
        state.updateProdutoPrecoDisponibilidadeActionState = "completed";
      }
    );
    builder.addCase(
      getType(updateProdutoPrecoDisponibilidadeAction.failure),
      (state) => {
        state.updateProdutoPrecoDisponibilidadeActionState = "error";
      }
    );
  },
});

export const selectProdutoState = (state: RootState) => state.produto;
export const selectListProdutoActionState = (state: RootState) =>
  state.produto.listProdutosActionState;
export const selectRemoveProdutoByIdActionState = (state: RootState) =>
  state.produto.removeProdutoByIdActionState;
export const selectGetProdutoByIdActionState = (state: RootState) =>
  state.produto.getProdutoByIdActionState;
export const selectCreateProdutoActionState = (state: RootState) =>
  state.produto.createProdutoActionState;
export const selectUpdateProdutoActionState = (state: RootState) =>
  state.produto.updateProdutoActionState;
export const selectDeleteProdutoActionState = (state: RootState) =>
  state.produto.deleteProdutoActionState;
export const selectUpdateProdutoStatusActionState = (state: RootState) =>
  state.produto.updateProdutoStatusActionState;
export const selectUpdateProdutoOrdemActionState = (state: RootState) =>
  state.produto.updateProdutoOrdemActionState;
export const selectCreateProdutoPrecoActionState = (state: RootState) =>
  state.produto.createProdutoPrecoActionState;
export const selectUpdateProdutoPrecoActionState = (state: RootState) =>
  state.produto.updateProdutoPrecoActionState;
export const selectDeleteProdutoPrecoActionState = (state: RootState) =>
  state.produto.deleteProdutoPrecoActionState;
export const selectUpdateProdutoPrecoDisponibilidadeActionState = (
  state: RootState
) => state.produto.updateProdutoPrecoDisponibilidadeActionState;
export const selectIdCategoria = (state: RootState) =>
  state.produto.idCategoria;
export const selectLimit = (state: RootState) => state.produto.limit;
export const selectOffset = (state: RootState) => state.produto.offset;

export const {
  clearProdutoState,
  resetListProdutoActionState,
  resetRemoveProdutoByIdActionState,
  resetPostOrPutProdutoActionState,
  resetGetProdutoByIdActionState,
  resetCreateProdutoActionState,
  resetUpdateProdutoActionState,
  resetDeleteProdutoActionState,
  resetUpdateProdutoStatusActionState,
  resetUpdateProdutoOrdemActionState,
  resetCreateProdutoPrecoActionState,
  resetUpdateProdutoPrecoActionState,
  resetDeleteProdutoPrecoActionState,
  resetUpdateProdutoPrecoDisponibilidadeActionState,
  setIdCategoria,
  setLimit,
  setOffset,
  initializeState,
  setNome,
} = produtoSlice.actions;

export const produtoReducer = produtoSlice.reducer;
