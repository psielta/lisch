import { combineEpics, ofType, Epic } from "redux-observable";
import { from, of } from "rxjs";
import { map, catchError, switchMap } from "rxjs/operators";
import { RootState } from "../store";
import {
  listCidadeAction,
  postOrPutCidadeAction,
  searchCidadeAction,
  removeCidadeByIdAction,
  getCidadeByIdAction,
} from "./cidade.actions";
import { CidadeState } from "./cidade.slice";
import { api } from "../../services/api";
import { Cidade, InputCidade } from "./cidade.model";
import { getType } from "typesafe-actions";
import { PaginatedResponse } from "../../dto/pagination";

const listCidade: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(listCidadeAction.request)),
    switchMap(({ payload }) => {
      const page = payload?.page || 1;
      const pageSize = payload?.page_size || 20;
      let promise = api.get<PaginatedResponse<Cidade>>(
        `/cidades/pagination/?page=${page}&page_size=${pageSize}`
      );
      return from(promise).pipe(
        map((data) => listCidadeAction.success(data.data)),
        catchError((err) => of(listCidadeAction.failure(err)))
      );
    })
  );

const postOrPutCidade: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(postOrPutCidadeAction.request)),
    switchMap(({ payload }: { payload: InputCidade }) => {
      let promise: Promise<any>;
      if (payload.id) {
        promise = api.put<Cidade>(`/cidades/${payload.id}`, payload);
      } else {
        promise = api.post<Cidade>(`/cidades`, payload);
      }
      return from(promise).pipe(
        map((data) => postOrPutCidadeAction.success(data.data)),
        catchError((err) => of(postOrPutCidadeAction.failure(err)))
      );
    })
  );

const removeCidadeById: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(removeCidadeByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.delete<Cidade>(`/cidades/${payload}`);
      return from(promise).pipe(
        map((data) => removeCidadeByIdAction.success(payload)),
        catchError((err) => of(removeCidadeByIdAction.failure(err)))
      );
    })
  );

const searchCidade: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(searchCidadeAction.request)),
    switchMap(({ payload }) => {
      const page = payload?.page || 1;
      const pageSize = payload?.page_size || 20;
      let promise: Promise<any>;
      if (payload.search.length > 0) {
        promise = api.get<PaginatedResponse<Cidade>>(
          `/cidades/pagination/buscar/${payload.search}?page=${page}&page_size=${pageSize}`
        );
      } else {
        promise = api.get<PaginatedResponse<Cidade>>(
          `/cidades/pagination/?page=${page}&page_size=${pageSize}`
        );
      }
      return from(promise).pipe(
        map((data) => searchCidadeAction.success(data.data)),
        catchError((err) => of(searchCidadeAction.failure(err)))
      );
    })
  );

const getCidadeById: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(getCidadeByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.get<Cidade>(`/cidades/${payload}`);
      return from(promise).pipe(
        map((data) => getCidadeByIdAction.success(data.data)),
        catchError((err) => of(getCidadeByIdAction.failure(err)))
      );
    })
  );

export const cidadeEpics = combineEpics(
  listCidade,
  postOrPutCidade,
  removeCidadeById,
  searchCidade,
  getCidadeById
);
