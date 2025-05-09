import { combineEpics, Epic, ofType } from "redux-observable";
import { RootState } from "../store";
import { getType } from "typesafe-actions";
import { PaginatedResponse } from "@/dto/pagination";
import api from "@/lib/api";
import { from, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { switchMap } from "rxjs/operators";
import { GetPedidosResponse, Pedido } from "./pedido.model.get";
import {
  alterarDadosListagemPedidoAction,
  AlterarDadosListagemPedidoInput,
  getPedidoByIdAction,
  listPedidosAction,
  postOrPutPedidoAction,
  removePedidoByIdAction,
} from "./pedido.actions";
import { InputPedido } from "./pedido.model";

const listPedidos: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(listPedidosAction.request)),
    switchMap(({ payload }) => {
      const current = state.value.pedidos;

      // Get all possible filters from state
      const nomeCliente = current.searchNomeClienteFilter;
      const status = current.searchStatusFilter;
      const dataInicio = current.searchDataInicioFilter;
      const dataFim = current.searchDataFimFilter;
      const representadaId = current.searchRepresentadaIdFilter;

      // Build query params
      const queryParams = new URLSearchParams();

      // Add pagination params
      queryParams.append("page", payload?.page?.toString() || "1");
      queryParams.append("limit", payload?.page_size?.toString() || "20");

      // Add filters if they exist
      if (status) queryParams.append("status", status);
      if (nomeCliente) queryParams.append("cliente_nome", nomeCliente);
      if (dataInicio) queryParams.append("data_inicio", dataInicio);
      if (dataFim) queryParams.append("data_fim", dataFim);
      if (representadaId) queryParams.append("representada_id", representadaId);

      const url = `/pedido/pagination?${queryParams.toString()}`;

      return from(api.get<GetPedidosResponse>(url)).pipe(
        map((response) => listPedidosAction.success(response.data)),
        catchError((error) => of(listPedidosAction.failure(error)))
      );
    })
  );

const postOrPutPedido: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(postOrPutPedidoAction.request)),
    switchMap(({ payload }: { payload: InputPedido }) => {
      let promise: Promise<any>;
      if (payload.id) {
        promise = api.put<Pedido>(`/pedido/${payload.id}`, payload);
      } else {
        promise = api.post<Pedido>(`/pedido`, payload);
      }
      return from(promise).pipe(
        map((data) => postOrPutPedidoAction.success(data.data)),
        catchError((err) => of(postOrPutPedidoAction.failure(err)))
      );
    })
  );

const removePedidoById: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(removePedidoByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.delete(`/pedido/${payload}`);
      return from(promise).pipe(
        map((data) => removePedidoByIdAction.success(payload)),
        catchError((err) => of(removePedidoByIdAction.failure(err)))
      );
    })
  );

const getPedidoById: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(getPedidoByIdAction.request)),
    switchMap(({ payload }: { payload: string }) => {
      let promise = api.get<Pedido>(`/pedido/${payload}`);
      return from(promise).pipe(
        map((data) => getPedidoByIdAction.success(data.data)),
        catchError((err) => of(getPedidoByIdAction.failure(err)))
      );
    })
  );

const alterarDadosListagemPedido: Epic<any, any, RootState> = (
  action$,
  state
) =>
  action$.pipe(
    ofType(getType(alterarDadosListagemPedidoAction.request)),
    switchMap(({ payload }: { payload: AlterarDadosListagemPedidoInput }) => {
      let promise = api.post<Pedido>(
        `/pedido/${payload.id}/alterar-dados-listagem`,
        payload
      );
      return from(promise).pipe(
        map((data) => alterarDadosListagemPedidoAction.success(data.data)),
        catchError((err) => of(alterarDadosListagemPedidoAction.failure(err)))
      );
    })
  );

export const pedidoEpics = combineEpics(
  listPedidos,
  postOrPutPedido,
  removePedidoById,
  getPedidoById,
  alterarDadosListagemPedido
);
