import { createSlice } from "@reduxjs/toolkit";
import { ActionType, getType } from "typesafe-actions";
import { RootState } from "../store";
import {
  // modelos
  CategoriaAdicionalListResponse,
  CategoriaAdicionalResponse,
  CategoriaAdicionalOpcaoResponse,
} from "./categoria-adicional.model";
import {
  // ações de grupo
  listCategoriaAdicionaisAction,
  getCategoriaAdicionalByIdAction,
  createCategoriaAdicionalAction,
  updateCategoriaAdicionalAction,
  deleteCategoriaAdicionalAction,
  updateCategoriaAdicionalStatusAction,
  // ações de opção
  createCategoriaAdicionalOpcaoAction,
  updateCategoriaAdicionalOpcaoAction,
  deleteCategoriaAdicionalOpcaoAction,
  updateCategoriaAdicionalOpcaoStatusAction,
} from "./categoria-adicional.action";

/* --------------------  STATE TYPE -------------------- */

export type CategoriaAdicionalState = {
  adicionais: CategoriaAdicionalListResponse;
  /* action states */
  listActionState: null | "pending" | "completed" | "error";
  crudActionState: null | "pending" | "completed" | "error";
  /* pagination / filtros */
  idCategoria?: string;
  limit: number;
  offset: number;
  totalCount: number;
};

/* --------------------  INITIAL -------------------- */

const initialState: CategoriaAdicionalState = {
  adicionais: {
    adicionais: [],
    total_count: 0,
    limit: 20,
    offset: 0,
  },
  listActionState: null,
  crudActionState: null,
  idCategoria: undefined,
  limit: 20,
  offset: 0,
  totalCount: 0,
};

/* --------------------  SLICE -------------------- */

export const categoriaAdicionalSlice = createSlice({
  name: "categoriaAdicional",
  initialState,
  reducers: {
    clearState: (state) => {
      Object.assign(state, initialState);
    },
    setIdCategoria: (state, action) => {
      state.idCategoria = action.payload;
    },
    setPagination: (state, action) => {
      state.limit = action.payload.limit;
      state.offset = action.payload.offset;
    },
  },
  extraReducers: (builder) => {
    /* ---------- LIST ---------- */
    builder.addCase(getType(listCategoriaAdicionaisAction.request), (state) => {
      state.listActionState = "pending";
    });
    builder.addCase(
      getType(listCategoriaAdicionaisAction.success),
      (
        state,
        action: ActionType<typeof listCategoriaAdicionaisAction.success>
      ) => {
        state.listActionState = "completed";
        state.adicionais = action.payload;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.totalCount = action.payload.total_count;
      }
    );
    builder.addCase(getType(listCategoriaAdicionaisAction.failure), (state) => {
      state.listActionState = "error";
    });

    /* ---------- GET BY ID ---------- */
    builder.addCase(
      getType(getCategoriaAdicionalByIdAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(getCategoriaAdicionalByIdAction.success),
      (
        state,
        action: ActionType<typeof getCategoriaAdicionalByIdAction.success>
      ) => {
        state.crudActionState = "completed";
        const idx = state.adicionais.adicionais.findIndex(
          (a) => a.id === action.payload.id
        );
        if (idx >= 0) state.adicionais.adicionais[idx] = action.payload;
        else state.adicionais.adicionais.push(action.payload);
      }
    );
    builder.addCase(
      getType(getCategoriaAdicionalByIdAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    /* ---------- CREATE ---------- */
    builder.addCase(
      getType(createCategoriaAdicionalAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(createCategoriaAdicionalAction.success),
      (
        state,
        action: ActionType<typeof createCategoriaAdicionalAction.success>
      ) => {
        state.crudActionState = "completed";
        state.adicionais.adicionais.push(action.payload);
      }
    );
    builder.addCase(
      getType(createCategoriaAdicionalAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    /* ---------- UPDATE ---------- */
    builder.addCase(
      getType(updateCategoriaAdicionalAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalAction.success),
      (
        state,
        action: ActionType<typeof updateCategoriaAdicionalAction.success>
      ) => {
        state.crudActionState = "completed";
        const idx = state.adicionais.adicionais.findIndex(
          (a) => a.id === action.payload.id
        );
        if (idx >= 0) state.adicionais.adicionais[idx] = action.payload;
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    /* ---------- DELETE ---------- */
    builder.addCase(
      getType(deleteCategoriaAdicionalAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(deleteCategoriaAdicionalAction.success),
      (
        state,
        action: ActionType<typeof deleteCategoriaAdicionalAction.success>
      ) => {
        state.crudActionState = "completed";
        state.adicionais.adicionais = state.adicionais.adicionais.filter(
          (a) => a.id !== action.payload.id
        );
      }
    );
    builder.addCase(
      getType(deleteCategoriaAdicionalAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    /* ---------- UPDATE STATUS ---------- */
    builder.addCase(
      getType(updateCategoriaAdicionalStatusAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalStatusAction.success),
      (state) => {
        state.crudActionState = "completed";
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalStatusAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    /* ---------- OPÇÕES (CRUD) ---------- */

    const onOpcaoSuccess = (
      state: CategoriaAdicionalState,
      adicionalId: string,
      fn: (opcoes: CategoriaAdicionalOpcaoResponse[]) => void
    ) => {
      const idx = state.adicionais.adicionais.findIndex(
        (a) => a.id === adicionalId
      );
      if (idx >= 0) {
        if (!state.adicionais.adicionais[idx].opcoes)
          state.adicionais.adicionais[idx].opcoes = [];
        fn(state.adicionais.adicionais[idx].opcoes!);
      }
    };

    // CREATE
    builder.addCase(
      getType(createCategoriaAdicionalOpcaoAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(createCategoriaAdicionalOpcaoAction.success),
      (
        state,
        action: ActionType<typeof createCategoriaAdicionalOpcaoAction.success>
      ) => {
        state.crudActionState = "completed";
        onOpcaoSuccess(
          state,
          action.payload.id_categoria_adicional,
          (opcoes) => {
            opcoes.push(action.payload);
          }
        );
      }
    );
    builder.addCase(
      getType(createCategoriaAdicionalOpcaoAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    // UPDATE
    builder.addCase(
      getType(updateCategoriaAdicionalOpcaoAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalOpcaoAction.success),
      (
        state,
        action: ActionType<typeof updateCategoriaAdicionalOpcaoAction.success>
      ) => {
        state.crudActionState = "completed";
        onOpcaoSuccess(
          state,
          action.payload.id_categoria_adicional,
          (opcoes) => {
            const ix = opcoes.findIndex((o) => o.id === action.payload.id);
            if (ix >= 0) opcoes[ix] = action.payload;
          }
        );
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalOpcaoAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    // DELETE
    builder.addCase(
      getType(deleteCategoriaAdicionalOpcaoAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(deleteCategoriaAdicionalOpcaoAction.success),
      (
        state,
        action: ActionType<typeof deleteCategoriaAdicionalOpcaoAction.success>
      ) => {
        state.crudActionState = "completed";
        onOpcaoSuccess(state, action.payload.adicionalId, (opcoes) => {
          const ix = opcoes.findIndex((o) => o.id === action.payload.opcaoId);
          if (ix >= 0) opcoes.splice(ix, 1);
        });
      }
    );
    builder.addCase(
      getType(deleteCategoriaAdicionalOpcaoAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );

    // UPDATE STATUS
    builder.addCase(
      getType(updateCategoriaAdicionalOpcaoStatusAction.request),
      (state) => {
        state.crudActionState = "pending";
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalOpcaoStatusAction.success),
      (state) => {
        state.crudActionState = "completed";
      }
    );
    builder.addCase(
      getType(updateCategoriaAdicionalOpcaoStatusAction.failure),
      (state) => {
        state.crudActionState = "error";
      }
    );
  },
});

/* -------------  EXPORT SELECTORS & REDUCER ------------- */

export const selectCategoriaAdicionalState = (state: RootState) =>
  state.categoriaAdicional;
export const selectListActionState = (state: RootState) =>
  state.categoriaAdicional.listActionState;
export const selectCrudActionState = (state: RootState) =>
  state.categoriaAdicional.crudActionState;
export const selectIdCategoria = (state: RootState) =>
  state.categoriaAdicional.idCategoria;
export const selectPagination = (state: RootState) => ({
  limit: state.categoriaAdicional.limit,
  offset: state.categoriaAdicional.offset,
});

export const { clearState, setIdCategoria, setPagination } =
  categoriaAdicionalSlice.actions;

export const categoriaAdicionalReducer = categoriaAdicionalSlice.reducer;
