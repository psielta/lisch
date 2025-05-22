import { combineEpics, ofType, Epic } from "redux-observable";
import { from, of } from "rxjs";
import { map, catchError, switchMap } from "rxjs/operators";
import { RootState } from "../store";
import api from "@/lib/api";
import { getType } from "typesafe-actions";
import { ClienteResponse } from "./cliente.model";
import {
  listClienteAction,
  getClienteByIdAction,
  postOrPutClienteAction,
  removeClienteByIdAction,
} from "./cliente.action";
import { ClienteService } from "./cliente.service";

const listClientes: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(listClienteAction.request)),
    switchMap(() => {
      let currentState = state.value;
      let filtroNome = currentState.cliente.filtroNome;
      let filtroFantasia = currentState.cliente.filtroFantasia;
      let filtroCpf = currentState.cliente.filtroCpf;
      let filtroCnpj = currentState.cliente.filtroCnpj;
      let page = currentState.cliente.page;
      let limit = currentState.cliente.limit;
      let sort = currentState.cliente.sort;
      let order = currentState.cliente.order;
      let service = new ClienteService(api);
      return from(
        service.listClientes(
          page,
          limit,
          sort,
          order,
          undefined,
          filtroNome ?? undefined,
          filtroFantasia ?? undefined,
          filtroCpf ?? undefined,
          filtroCnpj ?? undefined
        )
      ).pipe(
        map((data) => listClienteAction.success(data)),
        catchError((err) => {
          console.error("Erro ao listar clientes", err);
          return of(listClienteAction.failure());
        })
      );
    })
  );

const getClienteById: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(getClienteByIdAction.request)),
    switchMap((action) => {
      const service = new ClienteService(api);
      return from(service.getCliente(action.payload)).pipe(
        map((data) => getClienteByIdAction.success(data)),
        catchError((err) => {
          console.error("Erro ao buscar cliente por ID", err);
          return of(getClienteByIdAction.failure());
        })
      );
    })
  );

const postOrPutCliente: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(postOrPutClienteAction.request)),
    switchMap((action) => {
      const service = new ClienteService(api);
      const data = action.payload;

      if ("id" in data) {
        return from(service.updateCliente(data.id, data)).pipe(
          map((response) => postOrPutClienteAction.success(response)),
          catchError((err) => {
            console.error("Erro ao atualizar cliente", err);
            return of(postOrPutClienteAction.failure());
          })
        );
      } else {
        return from(service.createCliente(data)).pipe(
          map((response) => postOrPutClienteAction.success(response)),
          catchError((err) => {
            console.error("Erro ao criar cliente", err);
            return of(postOrPutClienteAction.failure());
          })
        );
      }
    })
  );

const removeClienteById: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(removeClienteByIdAction.request)),
    switchMap((action) => {
      const service = new ClienteService(api);
      return from(service.deleteCliente(action.payload)).pipe(
        map((response) => removeClienteByIdAction.success(action.payload)),
        catchError((err) => {
          console.error("Erro ao remover cliente", err);
          return of(removeClienteByIdAction.failure());
        })
      );
    })
  );

export const clienteEpic = combineEpics(
  listClientes,
  getClienteById,
  postOrPutCliente,
  removeClienteById
);
