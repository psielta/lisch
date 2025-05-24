import { combineEpics, ofType, Epic } from "redux-observable";
import { from, of } from "rxjs";
import { map, catchError, switchMap } from "rxjs/operators";
import { RootState } from "../store";
import api from "@/lib/api";
import { getType } from "typesafe-actions";
import {
  PedidoResponse,
  PedidoListResponse,
  CreatePedidoRequest,
  UpdatePedidoRequest,
  UpdatePedidoStatusRequest,
  UpdatePedidoProntoRequest,
  PedidoService,
} from "./pedido.model";
import {
  listPedidosAction,
  countPedidosAction,
  getPedidoByIdAction,
  getPedidoByCodigoAction,
  createPedidoAction,
  updatePedidoAction,
  deletePedidoAction,
  updatePedidoStatusAction,
  updatePedidoProntoAction,
} from "./pedido.action";

const listPedidos: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(listPedidosAction.request)),
    switchMap(() => {
      let currentState = state.value;
      let idCliente = currentState.pedido.idCliente;
      let status = currentState.pedido.status;
      let tipoEntrega = currentState.pedido.tipoEntrega;
      let dataInicio = currentState.pedido.dataInicio;
      let dataFim = currentState.pedido.dataFim;
      let codigoPedido = currentState.pedido.codigoPedido;
      let limit = currentState.pedido.limit;
      let offset = currentState.pedido.offset;

      let service = new PedidoService(api);
      return from(
        service.listPedidos(
          idCliente,
          status,
          tipoEntrega,
          dataInicio,
          dataFim,
          codigoPedido,
          limit,
          offset
        )
      ).pipe(
        map((data) => listPedidosAction.success(data)),
        catchError((err) => {
          console.error("Erro ao listar pedidos", err);
          return of(listPedidosAction.failure(err));
        })
      );
    })
  );

const countPedidos: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(countPedidosAction.request)),
    switchMap(() => {
      let currentState = state.value;
      let idCliente = currentState.pedido.idCliente;
      let status = currentState.pedido.status;
      let tipoEntrega = currentState.pedido.tipoEntrega;
      let dataInicio = currentState.pedido.dataInicio;
      let dataFim = currentState.pedido.dataFim;
      let codigoPedido = currentState.pedido.codigoPedido;

      let service = new PedidoService(api);
      return from(
        service.countPedidos(
          idCliente,
          status,
          tipoEntrega,
          dataInicio,
          dataFim,
          codigoPedido
        )
      ).pipe(
        map((data) => countPedidosAction.success(data)),
        catchError((err) => {
          console.error("Erro ao contar pedidos", err);
          return of(countPedidosAction.failure(err));
        })
      );
    })
  );

const getPedidoById: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(getPedidoByIdAction.request)),
    switchMap(({ payload }) => {
      let service = new PedidoService(api);
      return from(service.getPedido(payload)).pipe(
        map((data) => getPedidoByIdAction.success(data)),
        catchError((err) => {
          console.error("Erro ao obter pedido", err);
          return of(getPedidoByIdAction.failure(err));
        })
      );
    })
  );

const getPedidoByCodigo: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(getPedidoByCodigoAction.request)),
    switchMap(({ payload }) => {
      let service = new PedidoService(api);
      return from(service.getPedidoByCodigo(payload)).pipe(
        map((data) => getPedidoByCodigoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao obter pedido por código", err);
          return of(getPedidoByCodigoAction.failure(err));
        })
      );
    })
  );

const createPedido: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(createPedidoAction.request)),
    switchMap(({ payload }) => {
      let service = new PedidoService(api);
      return from(service.createPedido(payload)).pipe(
        map((data) => createPedidoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao criar pedido", err);
          return of(createPedidoAction.failure(err));
        })
      );
    })
  );

const updatePedido: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(updatePedidoAction.request)),
    switchMap(({ payload }) => {
      let service = new PedidoService(api);
      return from(service.updatePedido(payload.id, payload.data)).pipe(
        map((data) => updatePedidoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar pedido", err);
          return of(updatePedidoAction.failure(err));
        })
      );
    })
  );

const deletePedido: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(deletePedidoAction.request)),
    switchMap(({ payload }) => {
      let service = new PedidoService(api);
      return from(service.deletePedido(payload)).pipe(
        map((data) =>
          deletePedidoAction.success({ message: data.message, id: payload })
        ),
        catchError((err) => {
          console.error("Erro ao deletar pedido", err);
          return of(deletePedidoAction.failure(err));
        })
      );
    })
  );

const updatePedidoStatus: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(updatePedidoStatusAction.request)),
    switchMap(({ payload }) => {
      let service = new PedidoService(api);
      return from(service.updatePedidoStatus(payload.id, payload.data)).pipe(
        map((data) => updatePedidoStatusAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar status do pedido", err);
          return of(updatePedidoStatusAction.failure(err));
        })
      );
    })
  );

const updatePedidoPronto: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(updatePedidoProntoAction.request)),
    switchMap(({ payload }) => {
      let service = new PedidoService(api);
      return from(service.updatePedidoPronto(payload.id, payload.data)).pipe(
        map((data) => updatePedidoProntoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar pedido pronto", err);
          return of(updatePedidoProntoAction.failure(err));
        })
      );
    })
  );

export const pedidoEpics = combineEpics(
  listPedidos,
  countPedidos,
  getPedidoById,
  getPedidoByCodigo,
  createPedido,
  updatePedido,
  deletePedido,
  updatePedidoStatus,
  updatePedidoPronto
);
