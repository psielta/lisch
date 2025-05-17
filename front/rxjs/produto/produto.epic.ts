import { combineEpics, ofType, Epic } from "redux-observable";
import { from, of } from "rxjs";
import { map, catchError, switchMap } from "rxjs/operators";
import { RootState } from "../store";
import api from "@/lib/api";
import { getType } from "typesafe-actions";
import {
  ProdutoResponse,
  ProdutoListResponse,
  CreateProdutoRequest,
  UpdateProdutoRequest,
  UpdateProdutoStatusRequest,
  UpdateProdutoOrdemRequest,
  CreateProdutoPrecoRequest,
  UpdateProdutoPrecoRequest,
  ProdutoPrecoResponse,
  UpdateProdutoPrecoDisponibilidadeRequest,
  ProdutoService,
} from "./produto.model";
import {
  listProdutosAction,
  getProdutoByIdAction,
  createProdutoAction,
  updateProdutoAction,
  deleteProdutoAction,
  updateProdutoStatusAction,
  updateProdutoOrdemAction,
  createProdutoPrecoAction,
  updateProdutoPrecoAction,
  deleteProdutoPrecoAction,
  updateProdutoPrecoDisponibilidadeAction,
} from "./produto.action";

const listProdutos: Epic<any, any, RootState> = (action$, state) =>
  action$.pipe(
    ofType(getType(listProdutosAction.request)),
    switchMap(() => {
      let currentState = state.value;
      let idCategoria = currentState.produto.idCategoria;
      let limit = currentState.produto.limit;
      let offset = currentState.produto.offset;
      let nome = currentState.produto.nome;

      let service = new ProdutoService(api);
      return from(service.listProdutos(idCategoria, limit, offset, nome)).pipe(
        map((data) => listProdutosAction.success(data)),
        catchError((err) => {
          console.error("Erro ao listar produtos", err);
          return of(listProdutosAction.failure(err));
        })
      );
    })
  );

const getProdutoById: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(getProdutoByIdAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.getProduto(payload)).pipe(
        map((data) => getProdutoByIdAction.success(data)),
        catchError((err) => {
          console.error("Erro ao obter produto", err);
          return of(getProdutoByIdAction.failure(err));
        })
      );
    })
  );

const createProduto: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(createProdutoAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.createProduto(payload)).pipe(
        map((data) => createProdutoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao criar produto", err);
          return of(createProdutoAction.failure(err));
        })
      );
    })
  );

const updateProduto: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(updateProdutoAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.updateProduto(payload.id, payload.data)).pipe(
        map((data) => updateProdutoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar produto", err);
          return of(updateProdutoAction.failure(err));
        })
      );
    })
  );

const deleteProduto: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(deleteProdutoAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.deleteProduto(payload)).pipe(
        map((data) =>
          deleteProdutoAction.success({ message: data.message, id: payload })
        ),
        catchError((err) => {
          console.error("Erro ao deletar produto", err);
          return of(deleteProdutoAction.failure(err));
        })
      );
    })
  );

const updateProdutoStatus: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(updateProdutoStatusAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.updateProdutoStatus(payload.id, payload.data)).pipe(
        map((data) => updateProdutoStatusAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar status do produto", err);
          return of(updateProdutoStatusAction.failure(err));
        })
      );
    })
  );

const updateProdutoOrdem: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(updateProdutoOrdemAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.updateProdutoOrdem(payload.id, payload.data)).pipe(
        map((data) => updateProdutoOrdemAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar ordem do produto", err);
          return of(updateProdutoOrdemAction.failure(err));
        })
      );
    })
  );

const createProdutoPreco: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(createProdutoPrecoAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.createProdutoPreco(payload.id, payload.data)).pipe(
        map((data) => createProdutoPrecoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao criar preço do produto", err);
          return of(createProdutoPrecoAction.failure(err));
        })
      );
    })
  );

const updateProdutoPreco: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(updateProdutoPrecoAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(
        service.updateProdutoPreco(payload.id, payload.precoId, payload.data)
      ).pipe(
        map((data) => updateProdutoPrecoAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar preço do produto", err);
          return of(updateProdutoPrecoAction.failure(err));
        })
      );
    })
  );

const deleteProdutoPreco: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(getType(deleteProdutoPrecoAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(service.deleteProdutoPreco(payload.id, payload.precoId)).pipe(
        map((data) =>
          deleteProdutoPrecoAction.success({
            message: data.message,
            id: payload.id,
          })
        ),
        catchError((err) => {
          console.error("Erro ao deletar preço do produto", err);
          return of(deleteProdutoPrecoAction.failure(err));
        })
      );
    })
  );

const updateProdutoPrecoDisponibilidade: Epic<any, any, RootState> = (
  action$
) =>
  action$.pipe(
    ofType(getType(updateProdutoPrecoDisponibilidadeAction.request)),
    switchMap(({ payload }) => {
      let service = new ProdutoService(api);
      return from(
        service.updateProdutoPrecoDisponibilidade(
          payload.id,
          payload.precoId,
          payload.data
        )
      ).pipe(
        map((data) => updateProdutoPrecoDisponibilidadeAction.success(data)),
        catchError((err) => {
          console.error("Erro ao atualizar disponibilidade do preço", err);
          return of(updateProdutoPrecoDisponibilidadeAction.failure(err));
        })
      );
    })
  );

export const produtoEpics = combineEpics(
  listProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  deleteProduto,
  updateProdutoStatus,
  updateProdutoOrdem,
  createProdutoPreco,
  updateProdutoPreco,
  deleteProdutoPreco,
  updateProdutoPrecoDisponibilidade
);
