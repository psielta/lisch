import { combineEpics, ofType, Epic } from "redux-observable";
import { from, of } from "rxjs";
import { map, catchError, switchMap } from "rxjs/operators";
import { RootState } from "../store";
import api from "@/lib/api";
import { getType } from "typesafe-actions";
import {
  ICategoriaOpcaoStatusUpdate,
  ICategoriaOrdemUpdate,
  ICategoriaStatusUpdate,
  ICoreCategoria,
  ICoreCategoriaCreate,
  ICoreCategoriaUpdate,
} from "./categoria.model";
import {
  alterarOpcaoStatusCategoriaAction,
  alterarOrdemCategoriaAction,
  alterarStatusCategoriaAction,
  getCategoriaByIdAction,
  postOrPutCategoriaAction,
  removeCategoriaByIdAction,
  listCategoriaAction,
} from "./categoria.actions";

const listCategoria: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(listCategoriaAction.request)),
    switchMap(({ payload }) => {
      let promise = api.get<ICoreCategoria[]>(`/categorias`);
      return from(promise).pipe(
        map((data) => listCategoriaAction.success(data.data)),
        catchError((err) => {
          console.error("Erro ao listar categorias", err);
          return of(listCategoriaAction.failure(err));
        })
      );
    })
  );

const postOrPutCategoria: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(postOrPutCategoriaAction.request)),
    switchMap(
      ({
        payload,
      }: {
        payload: ICoreCategoriaCreate | ICoreCategoriaUpdate;
      }) => {
        let promise: Promise<any>;
        if ("id" in payload && payload.id && payload.id.length > 0) {
          promise = api.put<ICoreCategoria>(
            `/categorias/${payload.id}`,
            payload
          );
        } else {
          promise = api.post<ICoreCategoria>(`/categorias`, payload);
        }
        return from(promise).pipe(
          map((data) => postOrPutCategoriaAction.success(data.data)),
          catchError((err) => {
            console.error("Erro ao criar ou atualizar categoria", err);
            return of(postOrPutCategoriaAction.failure(err));
          })
        );
      }
    )
  );

const removeCategoriaById: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(removeCategoriaByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.delete(`/categorias/${payload}`);
      return from(promise).pipe(
        map((data) => removeCategoriaByIdAction.success(payload)),
        catchError((err) => {
          console.error("Erro ao remover categoria", err);
          return of(removeCategoriaByIdAction.failure(err));
        })
      );
    })
  );

const getCategoriaById: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(getCategoriaByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.get<ICoreCategoria>(`/categorias/${payload}`);
      return from(promise).pipe(
        map((data) => getCategoriaByIdAction.success(data.data)),
        catchError((err) => {
          console.error("Erro ao buscar categoria", err);
          return of(getCategoriaByIdAction.failure(err));
        })
      );
    })
  );

const alterarStatusCategoria: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(alterarStatusCategoriaAction.request)),
    switchMap(({ payload }: { payload: ICategoriaStatusUpdate }) => {
      let promise = api.put(`/categorias/${payload.id}/status`, payload);
      return from(promise).pipe(
        map((data) => alterarStatusCategoriaAction.success(payload)),
        catchError((err) => {
          console.error("Erro ao alterar status da categoria", err);
          return of(alterarStatusCategoriaAction.failure(err));
        })
      );
    })
  );

const alterarOrdemCategoria: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(alterarOrdemCategoriaAction.request)),
    switchMap(({ payload }: { payload: ICategoriaOrdemUpdate }) => {
      let promise = api.put(`/categorias/${payload.id}/ordem`, payload);
      return from(promise).pipe(
        map((data) => alterarOrdemCategoriaAction.success(payload)),
        catchError((err) => {
          console.error("Erro ao alterar ordem da categoria", err);
          return of(alterarOrdemCategoriaAction.failure(err));
        })
      );
    })
  );

const alterarOpcaoStatusCategoria: Epic<any, any, RootState> = (
  action$,
  state
) =>
  action$.pipe(
    ofType(getType(alterarOpcaoStatusCategoriaAction.request)),
    switchMap(({ payload }: { payload: ICategoriaOpcaoStatusUpdate }) => {
      let promise = api.put(
        `/categorias/${payload.id}/opcoes/${payload.id}/status`,
        payload
      );
      return from(promise).pipe(
        map((data) => alterarOpcaoStatusCategoriaAction.success(payload)),
        catchError((err) => {
          console.error("Erro ao alterar status da opção da categoria", err);
          return of(alterarOpcaoStatusCategoriaAction.failure(err));
        })
      );
    })
  );

export const categoriaEpics = combineEpics(
  listCategoria,
  postOrPutCategoria,
  removeCategoriaById,
  getCategoriaById,
  alterarStatusCategoria,
  alterarOrdemCategoria,
  alterarOpcaoStatusCategoria
);
