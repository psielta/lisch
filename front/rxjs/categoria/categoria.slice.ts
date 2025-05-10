import { createSlice } from "@reduxjs/toolkit";
import { ICoreCategoria } from "./categoria.model";
import { ActionType, getType } from "typesafe-actions";
import { RootState } from "../store";
import {
  alterarOpcaoStatusCategoriaAction,
  alterarOrdemCategoriaAction,
  alterarStatusCategoriaAction,
  getCategoriaByIdAction,
  listCategoriaAction,
  removeCategoriaByIdAction,
  postOrPutCategoriaAction,
} from "./categoria.actions";
import { PaginatedResponse } from "@/dto/pagination";
export type CategoriaState = {
  categorias: ICoreCategoria[];
  listCategoriaActionState: null | "pending" | "completed" | "error";
  removeCategoriaByIdActionState: null | "pending" | "completed" | "error";
  postOrPutCategoriaActionState: null | "pending" | "completed" | "error";
  getCategoriaByIdActionState: null | "pending" | "completed" | "error";
  alterarStatusCategoriaActionState: null | "pending" | "completed" | "error";
  alterarOrdemCategoriaActionState: null | "pending" | "completed" | "error";
  alterarOpcaoStatusCategoriaActionState:
    | null
    | "pending"
    | "completed"
    | "error";
};

const initialState: CategoriaState = {
  categorias: [],
  listCategoriaActionState: null,
  removeCategoriaByIdActionState: null,
  postOrPutCategoriaActionState: null,
  getCategoriaByIdActionState: null,
  alterarStatusCategoriaActionState: null,
  alterarOrdemCategoriaActionState: null,
  alterarOpcaoStatusCategoriaActionState: null,
};

export const categoriaSlice = createSlice({
  name: "categoria",
  initialState,
  reducers: {
    clearCategoriaState: (state) => {
      state.categorias = [];
      state.listCategoriaActionState = null;
      state.removeCategoriaByIdActionState = null;
      state.postOrPutCategoriaActionState = null;
      state.getCategoriaByIdActionState = null;
      state.alterarStatusCategoriaActionState = null;
      state.alterarOrdemCategoriaActionState = null;
      state.alterarOpcaoStatusCategoriaActionState = null;
    },
    resetListCategoriaActionState: (state) => {
      state.listCategoriaActionState = null;
    },
    resetRemoveCategoriaByIdActionState: (state) => {
      state.removeCategoriaByIdActionState = null;
    },
    resetPostOrPutCategoriaActionState: (state) => {
      state.postOrPutCategoriaActionState = null;
    },
    resetGetCategoriaByIdActionState: (state) => {
      state.getCategoriaByIdActionState = null;
    },
    resetAlterarStatusCategoriaActionState: (state) => {
      state.alterarStatusCategoriaActionState = null;
    },
    resetAlterarOrdemCategoriaActionState: (state) => {
      state.alterarOrdemCategoriaActionState = null;
    },
    resetAlterarOpcaoStatusCategoriaActionState: (state) => {
      state.alterarOpcaoStatusCategoriaActionState = null;
    },
  },
  extraReducers: (builder) => {
    // 1 - getCidadeByTenantIdAction
    builder
      .addCase(getType(listCategoriaAction.request), (state) => {
        state.listCategoriaActionState = "pending";
      })
      .addCase(
        getType(listCategoriaAction.success),
        (state, action: ActionType<typeof listCategoriaAction.success>) => {
          state.categorias = action.payload;
          state.listCategoriaActionState = "completed";
        }
      )
      .addCase(
        getType(listCategoriaAction.failure),
        (state, action: ActionType<typeof listCategoriaAction.failure>) => {
          state.listCategoriaActionState = "error";
        }
      );

    // 3 - getCategoriaByIdAction
    builder
      .addCase(getType(getCategoriaByIdAction.request), (state) => {
        state.getCategoriaByIdActionState = "pending";
      })
      .addCase(
        getType(getCategoriaByIdAction.success),
        (state, action: ActionType<typeof getCategoriaByIdAction.success>) => {
          state.getCategoriaByIdActionState = "completed";
          const index = state.categorias.findIndex(
            (categoria) => categoria.id === action.payload.id
          );
          if (index >= 0) {
            state.categorias[index] = action.payload;
          } else {
            state.categorias.push(action.payload);
          }
        }
      )
      .addCase(
        getType(getCategoriaByIdAction.failure),
        (state, action: ActionType<typeof getCategoriaByIdAction.failure>) => {
          state.getCategoriaByIdActionState = "error";
        }
      );
    // 4 - removeCategoriaByIdAction
    builder
      .addCase(getType(removeCategoriaByIdAction.request), (state) => {
        state.removeCategoriaByIdActionState = "pending";
      })
      .addCase(
        getType(removeCategoriaByIdAction.success),
        (
          state,
          action: ActionType<typeof removeCategoriaByIdAction.success>
        ) => {
          state.removeCategoriaByIdActionState = "completed";
          const index = state.categorias.findIndex(
            (categoria) => categoria.id === action.payload
          );
          if (index >= 0) {
            state.categorias.splice(index, 1);
          }
        }
      )
      .addCase(
        getType(removeCategoriaByIdAction.failure),
        (
          state,
          action: ActionType<typeof removeCategoriaByIdAction.failure>
        ) => {
          state.removeCategoriaByIdActionState = "error";
        }
      );
    // 5 - postOrPutCategoriaAction
    builder
      .addCase(getType(postOrPutCategoriaAction.request), (state) => {
        state.postOrPutCategoriaActionState = "pending";
      })
      .addCase(
        getType(postOrPutCategoriaAction.success),
        (
          state,
          action: ActionType<typeof postOrPutCategoriaAction.success>
        ) => {
          state.postOrPutCategoriaActionState = "completed";
          const index = state.categorias.findIndex(
            (categoria) => categoria.id === action.payload.id
          );
          if (index >= 0) {
            state.categorias[index] = action.payload;
          } else {
            state.categorias.push(action.payload);
          }
        }
      )
      .addCase(
        getType(postOrPutCategoriaAction.failure),
        (
          state,
          action: ActionType<typeof postOrPutCategoriaAction.failure>
        ) => {
          state.postOrPutCategoriaActionState = "error";
        }
      );
    // 6 - alterarStatusCategoriaAction
    builder
      .addCase(getType(alterarStatusCategoriaAction.request), (state) => {
        state.alterarStatusCategoriaActionState = "pending";
      })
      .addCase(
        getType(alterarStatusCategoriaAction.success),
        (
          state,
          action: ActionType<typeof alterarStatusCategoriaAction.success>
        ) => {
          state.alterarStatusCategoriaActionState = "completed";
          const index = state.categorias.findIndex(
            (categoria) => categoria.id === action.payload.id
          );
          if (index >= 0) {
            state.categorias[index].ativo = action.payload.ativo;
          }
        }
      )
      .addCase(
        getType(alterarStatusCategoriaAction.failure),
        (
          state,
          action: ActionType<typeof alterarStatusCategoriaAction.failure>
        ) => {
          state.alterarStatusCategoriaActionState = "error";
        }
      );
    // 7 - alterarOrdemCategoriaAction
    builder
      .addCase(getType(alterarOrdemCategoriaAction.request), (state) => {
        state.alterarOrdemCategoriaActionState = "pending";
      })
      .addCase(
        getType(alterarOrdemCategoriaAction.success),
        (
          state,
          action: ActionType<typeof alterarOrdemCategoriaAction.success>
        ) => {
          state.alterarOrdemCategoriaActionState = "completed";
          const index = state.categorias.findIndex(
            (categoria) => categoria.id === action.payload.id
          );
          if (index >= 0) {
            state.categorias[index].ordem = action.payload.ordem;
          }
        }
      )
      .addCase(
        getType(alterarOrdemCategoriaAction.failure),
        (
          state,
          action: ActionType<typeof alterarOrdemCategoriaAction.failure>
        ) => {
          state.alterarOrdemCategoriaActionState = "error";
        }
      );
    // 8 - alterarOpcaoStatusCategoriaAction
    builder
      .addCase(getType(alterarOpcaoStatusCategoriaAction.request), (state) => {
        state.alterarOpcaoStatusCategoriaActionState = "pending";
      })
      .addCase(
        getType(alterarOpcaoStatusCategoriaAction.success),
        (
          state,
          action: ActionType<typeof alterarOpcaoStatusCategoriaAction.success>
        ) => {
          state.alterarOpcaoStatusCategoriaActionState = "completed";
          const index = state.categorias.findIndex(
            (categoria) => categoria.id === action.payload.id_categoria
          );
          if (index >= 0) {
            const opcao = state.categorias[index].opcoes.find(
              (opcao) => opcao.id === action.payload.id
            );
            if (opcao) {
              opcao.status = action.payload.status;
            }
          }
        }
      )
      .addCase(
        getType(alterarOpcaoStatusCategoriaAction.failure),
        (
          state,
          action: ActionType<typeof alterarOpcaoStatusCategoriaAction.failure>
        ) => {
          state.alterarOpcaoStatusCategoriaActionState = "error";
        }
      );
  },
});

export const selectCategoriaState = (state: RootState) => state.categoria;
export const selectlistCategoriaActionState = (state: RootState) =>
  state.categoria.listCategoriaActionState;
export const selectremoveCategoriaByIdActionState = (state: RootState) =>
  state.categoria.removeCategoriaByIdActionState;
export const selectpostOrPutCategoriaActionState = (state: RootState) =>
  state.categoria.postOrPutCategoriaActionState;
export const selectgetCategoriaByIdActionState = (state: RootState) =>
  state.categoria.getCategoriaByIdActionState;
export const selectalterarStatusCategoriaActionState = (state: RootState) =>
  state.categoria.alterarStatusCategoriaActionState;
export const selectalterarOrdemCategoriaActionState = (state: RootState) =>
  state.categoria.alterarOrdemCategoriaActionState;
export const selectalterarOpcaoStatusCategoriaActionState = (
  state: RootState
) => state.categoria.alterarOpcaoStatusCategoriaActionState;

export const {
  clearCategoriaState,
  resetListCategoriaActionState,
  resetRemoveCategoriaByIdActionState,
  resetPostOrPutCategoriaActionState,
  resetGetCategoriaByIdActionState,
  resetAlterarStatusCategoriaActionState,
  resetAlterarOrdemCategoriaActionState,
  resetAlterarOpcaoStatusCategoriaActionState,
} = categoriaSlice.actions;
export default categoriaSlice.reducer;
