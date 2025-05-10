import { createSlice } from "@reduxjs/toolkit";
import { Cidade } from "./cidade.model";
import {
  getCidadeByIdAction,
  listCidadeAction,
  postOrPutCidadeAction,
  removeCidadeByIdAction,
  searchCidadeAction,
} from "./cidade.actions";
import { ActionType, getType } from "typesafe-actions";
import { RootState } from "../store";
import { PaginatedResponse } from "../../dto/pagination";
export type CidadeState = {
  cidades: PaginatedResponse<Cidade>;
  listCidadeActionState: null | "pending" | "completed" | "error";
  removeCidadeByIdActionState: null | "pending" | "completed" | "error";
  postOrPutCidadeActionState: null | "pending" | "completed" | "error";
  searchCidadeActionState: null | "pending" | "completed" | "error";
  getCidadeByIdActionState: null | "pending" | "completed" | "error";
  searchCidadeFilter?: string;
};

const initialState: CidadeState = {
  cidades: {
    items: [],
    current_page: 1,
    total_pages: 1,
    page_size: 20,
    total_count: 0,
  },
  listCidadeActionState: null,
  removeCidadeByIdActionState: null,
  postOrPutCidadeActionState: null,
  searchCidadeActionState: null,
  getCidadeByIdActionState: null,
  searchCidadeFilter: "",
};

export const cidadeSlice = createSlice({
  name: "cidade",
  initialState,
  reducers: {
    setSearchCidadeFilter: (state, action) => {
      state.searchCidadeFilter = action.payload;
    },
    clearCidadeState: (state) => {
      state.cidades = {
        items: [],
        current_page: 1,
        total_pages: 1,
        page_size: 20,
        total_count: 0,
      };
      state.listCidadeActionState = null;
      state.removeCidadeByIdActionState = null;
      state.postOrPutCidadeActionState = null;
    },
    resetListCidadeActionState: (state) => {
      state.listCidadeActionState = null;
    },
    resetRemoveCidadeByIdActionState: (state) => {
      state.removeCidadeByIdActionState = null;
    },
    resetPostOrPutCidadeActionState: (state) => {
      state.postOrPutCidadeActionState = null;
    },
    resetSearchCidadeActionState: (state) => {
      state.searchCidadeActionState = null;
    },
    resetGetCidadeByIdActionState: (state) => {
      state.getCidadeByIdActionState = null;
    },
  },
  extraReducers: (builder) => {
    // 1 - getCidadeByTenantIdAction
    builder
      .addCase(getType(listCidadeAction.request), (state) => {
        state.listCidadeActionState = "pending";
      })
      .addCase(
        getType(listCidadeAction.success),
        (state, action: ActionType<typeof listCidadeAction.success>) => {
          state.cidades = action.payload;
          state.listCidadeActionState = "completed";
        }
      )
      .addCase(
        getType(listCidadeAction.failure),
        (state, action: ActionType<typeof listCidadeAction.failure>) => {
          state.listCidadeActionState = "error";
        }
      );
    // 2 - searchCidadeAction
    builder
      .addCase(getType(searchCidadeAction.request), (state) => {
        state.searchCidadeActionState = "pending";
      })
      .addCase(
        getType(searchCidadeAction.success),
        (state, action: ActionType<typeof searchCidadeAction.success>) => {
          state.cidades = action.payload;
          state.searchCidadeActionState = "completed";
        }
      )
      .addCase(
        getType(searchCidadeAction.failure),
        (state, action: ActionType<typeof searchCidadeAction.failure>) => {
          state.searchCidadeActionState = "error";
        }
      );
    // 3 - getCidadeByIdAction
    builder
      .addCase(getType(getCidadeByIdAction.request), (state) => {
        state.getCidadeByIdActionState = "pending";
      })
      .addCase(
        getType(getCidadeByIdAction.success),
        (state, action: ActionType<typeof getCidadeByIdAction.success>) => {
          state.getCidadeByIdActionState = "completed";
          const index = state.cidades.items.findIndex(
            (cidade) => cidade.id === action.payload.id
          );
          if (index >= 0) {
            state.cidades.items[index] = action.payload;
          } else {
            state.cidades.items.push(action.payload);
          }
        }
      )
      .addCase(
        getType(getCidadeByIdAction.failure),
        (state, action: ActionType<typeof getCidadeByIdAction.failure>) => {
          state.getCidadeByIdActionState = "error";
        }
      );
    // 4 - removeCidadeByIdAction
    builder
      .addCase(getType(removeCidadeByIdAction.request), (state) => {
        state.removeCidadeByIdActionState = "pending";
      })
      .addCase(
        getType(removeCidadeByIdAction.success),
        (state, action: ActionType<typeof removeCidadeByIdAction.success>) => {
          state.removeCidadeByIdActionState = "completed";
          const index = state.cidades.items.findIndex(
            (cidade) => cidade.id === action.payload
          );
          if (index >= 0) {
            state.cidades.items.splice(index, 1);
          }
        }
      )
      .addCase(
        getType(removeCidadeByIdAction.failure),
        (state, action: ActionType<typeof removeCidadeByIdAction.failure>) => {
          state.removeCidadeByIdActionState = "error";
        }
      );
    // 5 - postOrPutCidadeAction
    builder
      .addCase(getType(postOrPutCidadeAction.request), (state) => {
        state.postOrPutCidadeActionState = "pending";
      })
      .addCase(
        getType(postOrPutCidadeAction.success),
        (state, action: ActionType<typeof postOrPutCidadeAction.success>) => {
          state.postOrPutCidadeActionState = "completed";
          const index = state.cidades.items.findIndex(
            (cidade) => cidade.id === action.payload.id
          );
          if (index >= 0) {
            state.cidades.items[index] = action.payload;
          } else {
            state.cidades.items.push(action.payload);
          }
        }
      )
      .addCase(
        getType(postOrPutCidadeAction.failure),
        (state, action: ActionType<typeof postOrPutCidadeAction.failure>) => {
          state.postOrPutCidadeActionState = "error";
        }
      );
  },
});

export const selectCidadeState = (state: RootState) => state.cidade;
export const selectListCidadeActionState = (state: RootState) =>
  state.cidade.listCidadeActionState;
export const selectRemoveCidadeByIdActionState = (state: RootState) =>
  state.cidade.removeCidadeByIdActionState;
export const selectPostOrPutCidadeActionState = (state: RootState) =>
  state.cidade.postOrPutCidadeActionState;
export const selectSearchCidadeActionState = (state: RootState) =>
  state.cidade.searchCidadeActionState;
export const selectGetCidadeByIdActionState = (state: RootState) =>
  state.cidade.getCidadeByIdActionState;

export const {
  setSearchCidadeFilter,
  clearCidadeState,
  resetListCidadeActionState,
  resetRemoveCidadeByIdActionState,
  resetPostOrPutCidadeActionState,
  resetSearchCidadeActionState,
  resetGetCidadeByIdActionState,
} = cidadeSlice.actions;
export default cidadeSlice.reducer;
