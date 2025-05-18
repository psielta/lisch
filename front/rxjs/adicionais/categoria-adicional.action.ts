import { createAsyncAction } from "typesafe-actions";
import {
  // Grupos
  CategoriaAdicionalResponse,
  CategoriaAdicionalListResponse,
  CreateCategoriaAdicionalRequest,
  UpdateCategoriaAdicionalRequest,
  UpdateCategoriaAdicionalStatusRequest,
  // Opções
  CategoriaAdicionalOpcaoResponse,
  CreateCategoriaAdicionalOpcaoRequest,
  UpdateCategoriaAdicionalOpcaoRequest,
  UpdateCategoriaAdicionalOpcaoStatusRequest,
} from "./categoria-adicional.model";

/* -----------------------------  GRUPOS  ---------------------------- */

export const listCategoriaAdicionaisAction = createAsyncAction(
  "categoriaAdicional/list/pending",
  "categoriaAdicional/list/fulfilled",
  "categoriaAdicional/list/rejected"
)<void, CategoriaAdicionalListResponse, void>();

export const getCategoriaAdicionalByIdAction = createAsyncAction(
  "categoriaAdicional/getById/pending",
  "categoriaAdicional/getById/fulfilled",
  "categoriaAdicional/getById/rejected"
)<string, CategoriaAdicionalResponse, void>();

export const createCategoriaAdicionalAction = createAsyncAction(
  "categoriaAdicional/create/pending",
  "categoriaAdicional/create/fulfilled",
  "categoriaAdicional/create/rejected"
)<CreateCategoriaAdicionalRequest, CategoriaAdicionalResponse, void>();

export const updateCategoriaAdicionalAction = createAsyncAction(
  "categoriaAdicional/update/pending",
  "categoriaAdicional/update/fulfilled",
  "categoriaAdicional/update/rejected"
)<
  { id: string; data: UpdateCategoriaAdicionalRequest },
  CategoriaAdicionalResponse,
  void
>();

export const deleteCategoriaAdicionalAction = createAsyncAction(
  "categoriaAdicional/delete/pending",
  "categoriaAdicional/delete/fulfilled",
  "categoriaAdicional/delete/rejected"
)<string, { message: string; id: string }, void>();

export const updateCategoriaAdicionalStatusAction = createAsyncAction(
  "categoriaAdicional/updateStatus/pending",
  "categoriaAdicional/updateStatus/fulfilled",
  "categoriaAdicional/updateStatus/rejected"
)<
  { id: string; data: UpdateCategoriaAdicionalStatusRequest },
  { message: string },
  void
>();

/* -----------------------------  OPÇÕES  ---------------------------- */

export const createCategoriaAdicionalOpcaoAction = createAsyncAction(
  "categoriaAdicional/opcao/create/pending",
  "categoriaAdicional/opcao/create/fulfilled",
  "categoriaAdicional/opcao/create/rejected"
)<
  { adicionalId: string; data: CreateCategoriaAdicionalOpcaoRequest },
  CategoriaAdicionalOpcaoResponse,
  void
>();

export const updateCategoriaAdicionalOpcaoAction = createAsyncAction(
  "categoriaAdicional/opcao/update/pending",
  "categoriaAdicional/opcao/update/fulfilled",
  "categoriaAdicional/opcao/update/rejected"
)<
  {
    adicionalId: string;
    opcaoId: string;
    data: UpdateCategoriaAdicionalOpcaoRequest;
  },
  CategoriaAdicionalOpcaoResponse,
  void
>();

export const deleteCategoriaAdicionalOpcaoAction = createAsyncAction(
  "categoriaAdicional/opcao/delete/pending",
  "categoriaAdicional/opcao/delete/fulfilled",
  "categoriaAdicional/opcao/delete/rejected"
)<
  { adicionalId: string; opcaoId: string },
  { message: string; opcaoId: string; adicionalId: string },
  void
>();

export const updateCategoriaAdicionalOpcaoStatusAction = createAsyncAction(
  "categoriaAdicional/opcao/updateStatus/pending",
  "categoriaAdicional/opcao/updateStatus/fulfilled",
  "categoriaAdicional/opcao/updateStatus/rejected"
)<
  {
    adicionalId: string;
    opcaoId: string;
    data: UpdateCategoriaAdicionalOpcaoStatusRequest;
  },
  { message: string },
  void
>();
