import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getMovimentosEstoqueByIdAction,
  listMovimentosEstoqueAction,
  postOrPutMovimentosEstoqueAction,
  removeMovimentosEstoqueByIdAction,
  searchMovimentosEstoqueByNomeProdutoAction,
  searchMovimentosEstoqueActionByCodigoExternoProdutoAction,
  searchMovimentosEstoqueActionByCodigoProdutoAction,
} from "./movimentos-estoque.actions";
import { ActionType, getType } from "typesafe-actions";
import { RootState } from "../store";
import { PaginatedResponse } from "@/dto/pagination";
import { MovimentoEstoque } from "./movimentos-estoque.model";
export type MovimentosEstoqueState = {
  movimentosEstoque: PaginatedResponse<MovimentoEstoque>;
  listMovimentosEstoqueActionState: null | "pending" | "completed" | "error";
  removeMovimentosEstoqueByIdActionState:
    | null
    | "pending"
    | "completed"
    | "error";
  postOrPutMovimentosEstoqueActionState:
    | null
    | "pending"
    | "completed"
    | "error";
  searchMovimentosEstoqueByNomeProdutoActionState:
    | null
    | "pending"
    | "completed"
    | "error";
  searchMovimentosEstoqueActionByCodigoProdutoActionState:
    | null
    | "pending"
    | "completed"
    | "error";
  searchMovimentosEstoqueActionByCodigoExternoProdutoActionState:
    | null
    | "pending"
    | "completed"
    | "error";
  getMovimentosEstoqueByIdActionState: null | "pending" | "completed" | "error";
  /*Filtros */
  searchMovimentosEstoqueFilter?: string;
  searchMovimentosEstoqueByCodigoProdutoFilter?: string;
  searchMovimentosEstoqueByCodigoExternoProdutoFilter?: string;
};

const initialState: MovimentosEstoqueState = {
  movimentosEstoque: {
    items: [],
    current_page: 1,
    total_pages: 1,
    page_size: 20,
    total_count: 0,
  },
  listMovimentosEstoqueActionState: null,
  removeMovimentosEstoqueByIdActionState: null,
  postOrPutMovimentosEstoqueActionState: null,
  searchMovimentosEstoqueByNomeProdutoActionState: null,
  searchMovimentosEstoqueActionByCodigoProdutoActionState: null,
  searchMovimentosEstoqueActionByCodigoExternoProdutoActionState: null,
  getMovimentosEstoqueByIdActionState: null,
  searchMovimentosEstoqueFilter: "",
  searchMovimentosEstoqueByCodigoProdutoFilter: "",
  searchMovimentosEstoqueByCodigoExternoProdutoFilter: "",
};

export const movimentosEstoqueSlice = createSlice({
  name: "movimentosEstoque",
  initialState,
  reducers: {
    setSearchMovimentosEstoqueFilter: (state, action) => {
      state.searchMovimentosEstoqueFilter = action.payload;
    },
    setSearchMovimentosEstoqueByCodigoProdutoFilter: (state, action) => {
      state.searchMovimentosEstoqueByCodigoProdutoFilter = action.payload;
    },
    setSearchMovimentosEstoqueByCodigoExternoProdutoFilter: (state, action) => {
      state.searchMovimentosEstoqueByCodigoExternoProdutoFilter =
        action.payload;
    },
    clearMovimentosEstoqueState: (state) => {
      state.movimentosEstoque = {
        items: [],
        current_page: 1,
        total_pages: 1,
        page_size: 20,
        total_count: 0,
      };
      state.listMovimentosEstoqueActionState = null;
      state.removeMovimentosEstoqueByIdActionState = null;
      state.postOrPutMovimentosEstoqueActionState = null;
      state.searchMovimentosEstoqueByNomeProdutoActionState = null;
      state.searchMovimentosEstoqueActionByCodigoProdutoActionState = null;
      state.searchMovimentosEstoqueActionByCodigoExternoProdutoActionState =
        null;
      state.getMovimentosEstoqueByIdActionState = null;
      state.searchMovimentosEstoqueFilter = "";
      state.searchMovimentosEstoqueByCodigoProdutoFilter = "";
      state.searchMovimentosEstoqueByCodigoExternoProdutoFilter = "";
    },
    resetAllStates: (state) => {
      state.listMovimentosEstoqueActionState = null;
      state.removeMovimentosEstoqueByIdActionState = null;
      state.postOrPutMovimentosEstoqueActionState = null;
      state.searchMovimentosEstoqueByNomeProdutoActionState = null;
      state.searchMovimentosEstoqueActionByCodigoProdutoActionState = null;
      state.searchMovimentosEstoqueActionByCodigoExternoProdutoActionState =
        null;
      state.getMovimentosEstoqueByIdActionState = null;
      state.searchMovimentosEstoqueFilter = "";
      state.searchMovimentosEstoqueByCodigoProdutoFilter = "";
      state.searchMovimentosEstoqueByCodigoExternoProdutoFilter = "";
    },
    setMovimentosEstoque: (
      state,
      action: PayloadAction<PaginatedResponse<MovimentoEstoque>>
    ) => {
      state.movimentosEstoque = action.payload;
    },
    resetListMovimentosEstoqueActionState: (state) => {
      state.listMovimentosEstoqueActionState = null;
    },
    resetRemoveMovimentosEstoqueByIdActionState: (state) => {
      state.removeMovimentosEstoqueByIdActionState = null;
    },
    resetPostOrPutMovimentosEstoqueActionState: (state) => {
      state.postOrPutMovimentosEstoqueActionState = null;
    },
    resetSearchMovimentosEstoqueByNomeProdutoActionState: (state) => {
      state.searchMovimentosEstoqueByNomeProdutoActionState = null;
    },
    resetGetMovimentosEstoqueByIdActionState: (state) => {
      state.getMovimentosEstoqueByIdActionState = null;
    },
    resetSearchMovimentosEstoqueByCodigoProdutoActionState: (state) => {
      state.searchMovimentosEstoqueActionByCodigoProdutoActionState = null;
    },
    resetSearchMovimentosEstoqueByCodigoExternoProdutoActionState: (state) => {
      state.searchMovimentosEstoqueActionByCodigoExternoProdutoActionState =
        null;
    },
    resetSearchMovimentosEstoqueFilter: (state) => {
      state.searchMovimentosEstoqueFilter = "";
    },
    resetSearchMovimentosEstoqueByCodigoProdutoFilter: (state) => {
      state.searchMovimentosEstoqueByCodigoProdutoFilter = "";
    },
    resetSearchMovimentosEstoqueByCodigoExternoProdutoFilter: (state) => {
      state.searchMovimentosEstoqueByCodigoExternoProdutoFilter = "";
    },
  },
  extraReducers: (builder) => {
    // 1 - getCidadeByTenantIdAction
    builder
      .addCase(getType(listMovimentosEstoqueAction.request), (state) => {
        state.listMovimentosEstoqueActionState = "pending";
      })
      .addCase(
        getType(listMovimentosEstoqueAction.success),
        (
          state,
          action: ActionType<typeof listMovimentosEstoqueAction.success>
        ) => {
          state.movimentosEstoque = action.payload;
          state.listMovimentosEstoqueActionState = "completed";
        }
      )
      .addCase(
        getType(listMovimentosEstoqueAction.failure),
        (
          state,
          action: ActionType<typeof listMovimentosEstoqueAction.failure>
        ) => {
          state.listMovimentosEstoqueActionState = "error";
        }
      );
    // 2 - searchMovimentosEstoqueByNomeProdutoAction
    builder
      .addCase(
        getType(searchMovimentosEstoqueByNomeProdutoAction.request),
        (state) => {
          state.searchMovimentosEstoqueByNomeProdutoActionState = "pending";
        }
      )
      .addCase(
        getType(searchMovimentosEstoqueByNomeProdutoAction.success),
        (
          state,
          action: ActionType<
            typeof searchMovimentosEstoqueByNomeProdutoAction.success
          >
        ) => {
          state.movimentosEstoque = action.payload;
          state.searchMovimentosEstoqueByNomeProdutoActionState = "completed";
        }
      )
      .addCase(
        getType(searchMovimentosEstoqueByNomeProdutoAction.failure),
        (
          state,
          action: ActionType<
            typeof searchMovimentosEstoqueByNomeProdutoAction.failure
          >
        ) => {
          state.searchMovimentosEstoqueByNomeProdutoActionState = "error";
        }
      );
    // 3 - searchMovimentosEstoqueActionByCodigoProdutoAction
    builder
      .addCase(
        getType(searchMovimentosEstoqueActionByCodigoProdutoAction.request),
        (state) => {
          state.searchMovimentosEstoqueActionByCodigoProdutoActionState =
            "pending";
        }
      )
      .addCase(
        getType(searchMovimentosEstoqueActionByCodigoProdutoAction.success),
        (
          state,
          action: ActionType<
            typeof searchMovimentosEstoqueActionByCodigoProdutoAction.success
          >
        ) => {
          state.movimentosEstoque = action.payload;
          state.searchMovimentosEstoqueActionByCodigoProdutoActionState =
            "completed";
        }
      )
      .addCase(
        getType(searchMovimentosEstoqueActionByCodigoProdutoAction.failure),
        (
          state,
          action: ActionType<
            typeof searchMovimentosEstoqueActionByCodigoProdutoAction.failure
          >
        ) => {
          state.searchMovimentosEstoqueActionByCodigoProdutoActionState =
            "error";
        }
      );
    // 4 - searchMovimentosEstoqueActionByCodigoExternoProdutoAction
    builder
      .addCase(
        getType(
          searchMovimentosEstoqueActionByCodigoExternoProdutoAction.request
        ),
        (state) => {
          state.searchMovimentosEstoqueActionByCodigoExternoProdutoActionState =
            "pending";
        }
      )
      .addCase(
        getType(
          searchMovimentosEstoqueActionByCodigoExternoProdutoAction.success
        ),
        (
          state,
          action: ActionType<
            typeof searchMovimentosEstoqueActionByCodigoExternoProdutoAction.success
          >
        ) => {
          state.movimentosEstoque = action.payload;
          state.searchMovimentosEstoqueActionByCodigoExternoProdutoActionState =
            "completed";
        }
      )
      .addCase(
        getType(
          searchMovimentosEstoqueActionByCodigoExternoProdutoAction.failure
        ),
        (
          state,
          action: ActionType<
            typeof searchMovimentosEstoqueActionByCodigoExternoProdutoAction.failure
          >
        ) => {
          state.searchMovimentosEstoqueActionByCodigoExternoProdutoActionState =
            "error";
        }
      );
    // 5 - getMovimentosEstoqueByIdAction
    builder
      .addCase(getType(getMovimentosEstoqueByIdAction.request), (state) => {
        state.getMovimentosEstoqueByIdActionState = "pending";
      })
      .addCase(
        getType(getMovimentosEstoqueByIdAction.success),
        (
          state,
          action: ActionType<typeof getMovimentosEstoqueByIdAction.success>
        ) => {
          state.getMovimentosEstoqueByIdActionState = "completed";
          const index = state.movimentosEstoque.items.findIndex(
            (cidade) => cidade.id === action.payload.id
          );
          if (index >= 0) {
            state.movimentosEstoque.items[index] = action.payload;
          } else {
            state.movimentosEstoque.items.push(action.payload);
          }
        }
      )
      .addCase(
        getType(getMovimentosEstoqueByIdAction.failure),
        (
          state,
          action: ActionType<typeof getMovimentosEstoqueByIdAction.failure>
        ) => {
          state.getMovimentosEstoqueByIdActionState = "error";
        }
      );
    // 6 - removeMovimentosEstoqueByIdAction
    builder
      .addCase(getType(removeMovimentosEstoqueByIdAction.request), (state) => {
        state.removeMovimentosEstoqueByIdActionState = "pending";
      })
      .addCase(
        getType(removeMovimentosEstoqueByIdAction.success),
        (
          state,
          action: ActionType<typeof removeMovimentosEstoqueByIdAction.success>
        ) => {
          state.removeMovimentosEstoqueByIdActionState = "completed";
          const index = state.movimentosEstoque.items.findIndex(
            (movimentoEstoque) => movimentoEstoque.id === Number(action.payload)
          );
          if (index >= 0) {
            state.movimentosEstoque.items.splice(index, 1);
          }
        }
      )
      .addCase(
        getType(removeMovimentosEstoqueByIdAction.failure),
        (
          state,
          action: ActionType<typeof removeMovimentosEstoqueByIdAction.failure>
        ) => {
          state.removeMovimentosEstoqueByIdActionState = "error";
        }
      );
    // 7 - postOrPutMovimentosEstoqueAction
    builder
      .addCase(getType(postOrPutMovimentosEstoqueAction.request), (state) => {
        state.postOrPutMovimentosEstoqueActionState = "pending";
      })
      .addCase(
        getType(postOrPutMovimentosEstoqueAction.success),
        (
          state,
          action: ActionType<typeof postOrPutMovimentosEstoqueAction.success>
        ) => {
          state.postOrPutMovimentosEstoqueActionState = "completed";

          // Initialize data array if it doesn't exist
          if (!state.movimentosEstoque) {
            state.movimentosEstoque = {
              items: [],
              current_page: 1,
              total_pages: 1,
              page_size: 20,
              total_count: 0,
            };
          }
          const index = state.movimentosEstoque.items.findIndex(
            (movimentoEstoque) => movimentoEstoque.id === action.payload.id
          );
          if (index >= 0) {
            state.movimentosEstoque.items[index] = action.payload;
          } else {
            state.movimentosEstoque.items.push(action.payload);
          }
        }
      )
      .addCase(
        getType(postOrPutMovimentosEstoqueAction.failure),
        (
          state,
          action: ActionType<typeof postOrPutMovimentosEstoqueAction.failure>
        ) => {
          state.postOrPutMovimentosEstoqueActionState = "error";
        }
      );
  },
});

export const selectMovimentosEstoqueState = (state: RootState) =>
  state.movimentosEstoque;
export const selectMovimentosEstoquePagination = (state: RootState) =>
  state.movimentosEstoque.movimentosEstoque;
export const selectListMovimentosEstoqueActionState = (state: RootState) =>
  state.movimentosEstoque.listMovimentosEstoqueActionState;
export const selectRemoveMovimentosEstoqueByIdActionState = (
  state: RootState
) => state.movimentosEstoque.removeMovimentosEstoqueByIdActionState;
export const selectPostOrPutMovimentosEstoqueActionState = (state: RootState) =>
  state.movimentosEstoque.postOrPutMovimentosEstoqueActionState;
export const selectSearchMovimentosEstoqueByNomeProdutoActionState = (
  state: RootState
) => state.movimentosEstoque.searchMovimentosEstoqueByNomeProdutoActionState;
export const selectSearchMovimentosEstoqueActionByCodigoProdutoActionState = (
  state: RootState
) =>
  state.movimentosEstoque
    .searchMovimentosEstoqueActionByCodigoProdutoActionState;
export const selectSearchMovimentosEstoqueActionByCodigoExternoProdutoActionState =
  (state: RootState) =>
    state.movimentosEstoque
      .searchMovimentosEstoqueActionByCodigoExternoProdutoActionState;
export const selectGetMovimentosEstoqueByIdActionState = (state: RootState) =>
  state.movimentosEstoque.getMovimentosEstoqueByIdActionState;
export const selectSearchMovimentosEstoqueFilter = (state: RootState) =>
  state.movimentosEstoque.searchMovimentosEstoqueFilter;
export const selectSearchMovimentosEstoqueByCodigoProdutoFilter = (
  state: RootState
) => state.movimentosEstoque.searchMovimentosEstoqueByCodigoProdutoFilter;
export const selectSearchMovimentosEstoqueByCodigoExternoProdutoFilter = (
  state: RootState
) =>
  state.movimentosEstoque.searchMovimentosEstoqueByCodigoExternoProdutoFilter;

export const {
  setSearchMovimentosEstoqueFilter,
  clearMovimentosEstoqueState,
  resetListMovimentosEstoqueActionState,
  resetRemoveMovimentosEstoqueByIdActionState,
  resetPostOrPutMovimentosEstoqueActionState,
  resetSearchMovimentosEstoqueByNomeProdutoActionState,
  resetSearchMovimentosEstoqueByCodigoProdutoActionState,
  resetSearchMovimentosEstoqueByCodigoExternoProdutoActionState,
  resetSearchMovimentosEstoqueFilter,
  resetSearchMovimentosEstoqueByCodigoProdutoFilter,
  resetAllStates,
  resetSearchMovimentosEstoqueByCodigoExternoProdutoFilter,
  setMovimentosEstoque,
  setSearchMovimentosEstoqueByCodigoProdutoFilter,
  setSearchMovimentosEstoqueByCodigoExternoProdutoFilter,
} = movimentosEstoqueSlice.actions;
export default movimentosEstoqueSlice.reducer;
