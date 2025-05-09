import { combineEpics, ofType, Epic } from "redux-observable";
import { from, of } from "rxjs";
import { map, catchError, switchMap } from "rxjs/operators";
import { RootState } from "../store";
import {
  listMovimentosEstoqueAction,
  postOrPutMovimentosEstoqueAction,
  searchMovimentosEstoqueActionByCodigoProdutoAction,
  searchMovimentosEstoqueActionByCodigoExternoProdutoAction,
  searchMovimentosEstoqueByNomeProdutoAction,
  removeMovimentosEstoqueByIdAction,
  getMovimentosEstoqueByIdAction,
} from "./movimentos-estoque.actions";
import api from "@/lib/api";
import {
  MovimentoEstoque,
  InputMovimentoEstoque,
} from "./movimentos-estoque.model";
import { getType } from "typesafe-actions";
import { PaginatedResponse } from "@/dto/pagination";
import { MovimentosEstoqueState } from "./movimentos-estoque.slice";

const listMovimentosEstoque: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(listMovimentosEstoqueAction.request)),
    switchMap(({ payload }) => {
      let current: MovimentosEstoqueState = state.value.movimentosEstoque;

      let filter = current.searchMovimentosEstoqueFilter ?? "";
      let filterByCodigoProduto =
        current.searchMovimentosEstoqueByCodigoProdutoFilter ?? "";
      let filterByCodigoExternoProduto =
        current.searchMovimentosEstoqueByCodigoExternoProdutoFilter ?? "";

      const page = payload?.page;
      const pageSize = payload?.page_size;
      let promise;
      if (
        filter === "" &&
        filterByCodigoProduto === "" &&
        filterByCodigoExternoProduto === ""
      ) {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination?page=${page}&page_size=${pageSize}`
        );
      } else if (filterByCodigoProduto !== "") {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination/searchcodigo/${filterByCodigoProduto}?page=${page}&page_size=${pageSize}`
        );
      } else if (filterByCodigoExternoProduto !== "") {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination/searchcodigoext/${filterByCodigoExternoProduto}?page=${page}&page_size=${pageSize}`
        );
      } else if (filter !== "") {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination/search/${filter}?page=${page}&page_size=${pageSize}`
        );
      } else {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination?page=${page}&page_size=${pageSize}`
        );
      }
      return from(promise).pipe(
        map((data) => listMovimentosEstoqueAction.success(data.data)),
        catchError((err) => of(listMovimentosEstoqueAction.failure(err)))
      );
    })
  );

const postOrPutMovimentosEstoque: Epic<any, any, RootState> = (
  action$,
  state
) =>
  action$.pipe(
    ofType(getType(postOrPutMovimentosEstoqueAction.request)),
    switchMap(({ payload }: { payload: InputMovimentoEstoque }) => {
      let promise: Promise<any>;
      if (payload.id) {
        promise = api.put<MovimentoEstoque>(
          `/movimentos-estoque/${payload.id}`,
          payload
        );
      } else {
        promise = api.post<MovimentoEstoque>(`/movimentos-estoque`, payload);
      }
      return from(promise).pipe(
        map((data) => postOrPutMovimentosEstoqueAction.success(data.data)),
        catchError((err) => of(postOrPutMovimentosEstoqueAction.failure(err)))
      );
    })
  );

const removeMovimentosEstoqueById: Epic<any, any, RootState> = (
  action$,
  state
) =>
  action$.pipe(
    ofType(getType(removeMovimentosEstoqueByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.delete(`/movimentos-estoque/${payload}`);
      return from(promise).pipe(
        map((data) => removeMovimentosEstoqueByIdAction.success(payload)),
        catchError((err) => of(removeMovimentosEstoqueByIdAction.failure(err)))
      );
    })
  );

const searchMovimentosEstoqueByNomeProduto: Epic<any, any, RootState> = (
  action$,
  state
) =>
  action$.pipe(
    ofType(getType(searchMovimentosEstoqueByNomeProdutoAction.request)),
    switchMap(({ payload }) => {
      const page = payload?.page || 1;
      const pageSize = payload?.page_size || 20;
      let promise: Promise<any>;
      if (payload.search.length > 0) {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination/search/${payload.search}?page=${page}&page_size=${pageSize}`
        );
      } else {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination?page=${page}&page_size=${pageSize}`
        );
      }
      return from(promise).pipe(
        map((data) =>
          searchMovimentosEstoqueByNomeProdutoAction.success(data.data)
        ),
        catchError((err) =>
          of(searchMovimentosEstoqueByNomeProdutoAction.failure(err))
        )
      );
    })
  );
const searchMovimentosEstoqueByCodigoProduto: Epic<any, any, RootState> = (
  action$,
  state
) =>
  action$.pipe(
    ofType(getType(searchMovimentosEstoqueByNomeProdutoAction.request)),
    switchMap(({ payload }) => {
      const page = payload?.page || 1;
      const pageSize = payload?.page_size || 20;
      let promise: Promise<any>;
      if (payload.search.length > 0) {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination/searchcodigo/${payload.search}?page=${page}&page_size=${pageSize}`
        );
      } else {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination?page=${page}&page_size=${pageSize}`
        );
      }
      return from(promise).pipe(
        map((data) =>
          searchMovimentosEstoqueByNomeProdutoAction.success(data.data)
        ),
        catchError((err) =>
          of(searchMovimentosEstoqueByNomeProdutoAction.failure(err))
        )
      );
    })
  );
const searchMovimentosEstoqueByCodigoExternoProduto: Epic<
  any,
  any,
  RootState
> = (action$, state) =>
  action$.pipe(
    ofType(getType(searchMovimentosEstoqueByNomeProdutoAction.request)),
    switchMap(({ payload }) => {
      const page = payload?.page || 1;
      const pageSize = payload?.page_size || 20;
      let promise: Promise<any>;
      if (payload.search.length > 0) {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination/searchcodigoext/${payload.search}?page=${page}&page_size=${pageSize}`
        );
      } else {
        promise = api.get<PaginatedResponse<MovimentoEstoque>>(
          `/movimentos-estoque/pagination?page=${page}&page_size=${pageSize}`
        );
      }
      return from(promise).pipe(
        map((data) =>
          searchMovimentosEstoqueByNomeProdutoAction.success(data.data)
        ),
        catchError((err) =>
          of(searchMovimentosEstoqueByNomeProdutoAction.failure(err))
        )
      );
    })
  );

const getMovimentosEstoqueById: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(getMovimentosEstoqueByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.get<MovimentoEstoque>(`/movimentos-estoque/${payload}`);
      return from(promise).pipe(
        map((data) => getMovimentosEstoqueByIdAction.success(data.data)),
        catchError((err) => of(getMovimentosEstoqueByIdAction.failure(err)))
      );
    })
  );

export const movimentosEstoqueEpics = combineEpics(
  listMovimentosEstoque,
  postOrPutMovimentosEstoque,
  removeMovimentosEstoqueById,
  searchMovimentosEstoqueByNomeProduto,
  searchMovimentosEstoqueByCodigoProduto,
  searchMovimentosEstoqueByCodigoExternoProduto,
  getMovimentosEstoqueById
);
