import { combineEpics, ofType, Epic } from "redux-observable";
import { from, of } from "rxjs";
import { switchMap, map, catchError } from "rxjs/operators";
import { getType } from "typesafe-actions";
import { RootState } from "../store";
import api from "@/lib/api";
import { CategoriaAdicionalService } from "./categoria-adicional.model";
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

/* instancia única do serviço */
const service = new CategoriaAdicionalService(api);

/* --------------------------  GRUPOS  -------------------------- */

const listCategoriaAdicionais: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(listCategoriaAdicionaisAction.request)),
    switchMap(() => {
      const st = state$.value.categoriaAdicional; // ← slice abaixo
      return from(
        service.listCategoriaAdicionais(st.idCategoria!, st.limit, st.offset)
      ).pipe(
        map((data) => listCategoriaAdicionaisAction.success(data)),
        catchError((err) => of(listCategoriaAdicionaisAction.failure(err)))
      );
    })
  );

const getCategoriaAdicionalById: Epic<any, any, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    ofType(getType(getCategoriaAdicionalByIdAction.request)),
    switchMap(({ payload }) =>
      from(service.getCategoriaAdicional(payload)).pipe(
        map((data) => getCategoriaAdicionalByIdAction.success(data)),
        catchError((err) => of(getCategoriaAdicionalByIdAction.failure(err)))
      )
    )
  );

const createCategoriaAdicional: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(createCategoriaAdicionalAction.request)),
    switchMap(({ payload }) =>
      from(service.createCategoriaAdicional(payload)).pipe(
        map((data) => createCategoriaAdicionalAction.success(data)),
        catchError((err) => of(createCategoriaAdicionalAction.failure(err)))
      )
    )
  );

const updateCategoriaAdicional: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(updateCategoriaAdicionalAction.request)),
    switchMap(({ payload }) =>
      from(service.updateCategoriaAdicional(payload.id, payload.data)).pipe(
        map((data) => updateCategoriaAdicionalAction.success(data)),
        catchError((err) => of(updateCategoriaAdicionalAction.failure(err)))
      )
    )
  );

const deleteCategoriaAdicional: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(deleteCategoriaAdicionalAction.request)),
    switchMap(({ payload }) =>
      from(service.deleteCategoriaAdicional(payload)).pipe(
        map((data) =>
          deleteCategoriaAdicionalAction.success({ ...data, id: payload })
        ),
        catchError((err) => of(deleteCategoriaAdicionalAction.failure(err)))
      )
    )
  );

const updateCategoriaAdicionalStatus: Epic<any, any, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    ofType(getType(updateCategoriaAdicionalStatusAction.request)),
    switchMap(({ payload }) =>
      from(
        service.updateCategoriaAdicionalStatus(payload.id, payload.data)
      ).pipe(
        map((data) => updateCategoriaAdicionalStatusAction.success(data)),
        catchError((err) =>
          of(updateCategoriaAdicionalStatusAction.failure(err))
        )
      )
    )
  );

/* --------------------------  OPÇÕES  -------------------------- */

const createOpcao: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(createCategoriaAdicionalOpcaoAction.request)),
    switchMap(({ payload }) =>
      from(service.createOpcao(payload.adicionalId, payload.data)).pipe(
        map((data) => createCategoriaAdicionalOpcaoAction.success(data)),
        catchError((err) =>
          of(createCategoriaAdicionalOpcaoAction.failure(err))
        )
      )
    )
  );

const updateOpcao: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(updateCategoriaAdicionalOpcaoAction.request)),
    switchMap(({ payload }) =>
      from(
        service.updateOpcao(payload.adicionalId, payload.opcaoId, payload.data)
      ).pipe(
        map((data) => updateCategoriaAdicionalOpcaoAction.success(data)),
        catchError((err) =>
          of(updateCategoriaAdicionalOpcaoAction.failure(err))
        )
      )
    )
  );

const deleteOpcao: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(deleteCategoriaAdicionalOpcaoAction.request)),
    switchMap(({ payload }) =>
      from(service.deleteOpcao(payload.adicionalId, payload.opcaoId)).pipe(
        map((data) =>
          deleteCategoriaAdicionalOpcaoAction.success({
            ...data,
            opcaoId: payload.opcaoId,
            adicionalId: payload.adicionalId,
          })
        ),
        catchError((err) =>
          of(deleteCategoriaAdicionalOpcaoAction.failure(err))
        )
      )
    )
  );

const updateOpcaoStatus: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(getType(updateCategoriaAdicionalOpcaoStatusAction.request)),
    switchMap(({ payload }) =>
      from(
        service.updateOpcaoStatus(
          payload.adicionalId,
          payload.opcaoId,
          payload.data
        )
      ).pipe(
        map((data) => updateCategoriaAdicionalOpcaoStatusAction.success(data)),
        catchError((err) =>
          of(updateCategoriaAdicionalOpcaoStatusAction.failure(err))
        )
      )
    )
  );

/* -----------------------  EXPORT  ----------------------- */

export const categoriaAdicionalEpics = combineEpics(
  listCategoriaAdicionais,
  getCategoriaAdicionalById,
  createCategoriaAdicional,
  updateCategoriaAdicional,
  deleteCategoriaAdicional,
  updateCategoriaAdicionalStatus,
  createOpcao,
  updateOpcao,
  deleteOpcao,
  updateOpcaoStatus
);
