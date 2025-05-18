"use client";
import React, { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";

import { User } from "@/context/auth-context";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import {
  CategoriaAdicionalResponse,
  CreateCategoriaAdicionalRequest,
  UpdateCategoriaAdicionalRequest,
} from "@/rxjs/adicionais/categoria-adicional.model";
import {
  createCategoriaAdicionalAction,
  updateCategoriaAdicionalAction,
} from "@/rxjs/adicionais/categoria-adicional.action";
import {
  selectCrudActionState,
  clearState as clearCategoriaAdicionalState,
} from "@/rxjs/adicionais/categoria-adicional.slice";
import { Button } from "@/components/catalyst-ui-kit/button";
import { Badge } from "@/components/catalyst-ui-kit/badge";

/* ------------------------------------------------------------------
 *  Zod Schemas
 * -----------------------------------------------------------------*/

const opcaoSchema = z.object({
  id: z.string().uuid().optional(),

  codigo: z
    .string()
    .max(100, "Máx. 100 caracteres")
    .optional()
    .or(z.literal("")),

  nome: z.string().min(1, "Obrigatório").max(100, "Máx. 100 caracteres"),

  valor: z.preprocess(
    (v) => (typeof v === "string" ? parseFloat(v) : v),
    z
      .number({ invalid_type_error: "Valor numérico obrigatório" })
      .positive("Valor deve ser > 0")
      .max(99_999_999.99, "Acima do limite")
      .refine(
        (n) => Number.isFinite(n) && /^\d+(\.\d{1,2})?$/.test(n.toString()),
        "Máx. 2 casas decimais"
      )
  ),

  status: z.union([z.literal(0), z.literal(1)]).default(1),
});

const adicionalSchema = z
  .object({
    id: z.string().uuid().optional(),

    id_categoria: z.string().uuid("Categoria inválida"),

    codigo_tipo: z
      .string()
      .max(100, "Máx. 100 caracteres")
      .optional()
      .or(z.literal("")),

    nome: z
      .string()
      .min(3, "Mín. 3 caracteres")
      .max(100, "Máx. 100 caracteres"),

    selecao: z.enum(["U", "M", "Q"], {
      errorMap: () => ({ message: "Seleção inválida" }),
    }),

    minimo: z.preprocess(
      (v) => (v === "" || v === null ? undefined : Number(v)),
      z
        .number({ invalid_type_error: "Número inválido" })
        .int("Inteiro")
        .nonnegative(">= 0")
        .optional()
    ),

    limite: z.preprocess(
      (v) => (v === "" || v === null ? undefined : Number(v)),
      z
        .number({ invalid_type_error: "Número inválido" })
        .int("Inteiro")
        .nonnegative(">= 0")
        .optional()
    ),

    status: z.union([z.literal(0), z.literal(1)]).default(1),

    opcoes: z.array(opcaoSchema).min(1, "Adicione pelo menos uma opção"),
  })
  .superRefine((val, ctx) => {
    /* regras específicas quando selecao === 'Q' */
    if (val.selecao === "Q") {
      if (val.minimo === undefined || val.limite === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Mínimo e Limite são obrigatórios para seleção por quantidade",
          path: ["minimo"],
        });
      } else if (val.minimo > val.limite) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo não pode ser maior que o Limite",
          path: ["minimo"],
        });
      }
    }
    /* impedir nomes duplicados nas opções */
    const dup = new Set<string>();
    val.opcoes.forEach((o, i) => {
      if (dup.has(o.nome.trim().toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Opção duplicada",
          path: ["opcoes", i, "nome"],
        });
      } else {
        dup.add(o.nome.trim().toLowerCase());
      }
    });
  });

type AdicionalFormValues = z.infer<typeof adicionalSchema>;

/* ------------------------------------------------------------------
 *  Formulário
 * -----------------------------------------------------------------*/

function FormCategoriaAdicional({
  user,
  data,
  dataCategorias,
}: {
  user: User;
  data: CategoriaAdicionalResponse | undefined;
  dataCategorias: ICoreCategoria[];
}) {
  const dispatch = useDispatch();
  const router = useRouter();

  const crudState = useSelector(selectCrudActionState);
  const isEditing = Boolean(data?.id);
  const isSubmitting = crudState === "pending";

  const defaultValues: AdicionalFormValues = {
    id: data?.id,
    id_categoria: data?.id_categoria ?? "",
    codigo_tipo: data?.codigo_tipo ?? "",
    nome: data?.nome ?? "",
    selecao: (data?.selecao as "U" | "M" | "Q") ?? "U",
    minimo: data?.minimo ?? undefined,
    limite: data?.limite ?? undefined,
    status: (data?.status ?? 1) as 0 | 1,
    opcoes: data?.opcoes?.map((o) => ({
      id: o.id,
      codigo: o.codigo ?? "",
      nome: o.nome,
      valor: parseFloat(o.valor),
      status: (o.status ?? 1) as 0 | 1,
    })) ?? [
      {
        nome: "",
        valor: 0,
        codigo: "",
        status: 1 as 0 | 1,
      },
    ],
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AdicionalFormValues>({
    resolver: zodResolver(adicionalSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "opcoes",
  });

  /* --------------------------------------------------------------
   *  Efeito pós-CRUD
   * -------------------------------------------------------------*/
  useEffect(() => {
    if (crudState === "completed") {
      dispatch(clearCategoriaAdicionalState());
      router.push("/cadastros/categoria-adicional");
    }
  }, [crudState, dispatch, router]);

  /* --------------------------------------------------------------
   *  Manipular seleção para habilitar Mín/Lim
   * -------------------------------------------------------------*/
  const selecao = watch("selecao");
  useEffect(() => {
    if (selecao !== "Q") {
      setValue("minimo", undefined);
      setValue("limite", undefined);
    }
  }, [selecao, setValue]);

  /* --------------------------------------------------------------
   *  Submissão
   * -------------------------------------------------------------*/
  const onSubmit = (values: AdicionalFormValues) => {
    const payloadBase = {
      ...values,
      codigo_tipo:
        values.codigo_tipo === "" ? undefined : values.codigo_tipo?.trim(),
      minimo: values.selecao === "Q" ? values.minimo : undefined,
      limite: values.selecao === "Q" ? values.limite : undefined,
      opcoes: values.opcoes.map((o) => ({
        ...o,
        codigo: o.codigo === "" ? undefined : o.codigo?.trim(),
        valor: o.valor.toFixed(2), // string p/ API
      })),
    };

    if (isEditing && payloadBase.id) {
      const { id, ...rest } = payloadBase;
      dispatch(
        updateCategoriaAdicionalAction.request({
          id,
          data: rest as UpdateCategoriaAdicionalRequest,
        })
      );
    } else {
      const { id, ...rest } = payloadBase;
      dispatch(
        createCategoriaAdicionalAction.request(
          rest as CreateCategoriaAdicionalRequest
        )
      );
    }
  };

  /* --------------------------------------------------------------
   *  JSX
   * -------------------------------------------------------------*/
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Adicional" : "Novo Adicional"}
        </h1>
        <Button onClick={() => router.push("/cadastros/categoria-adicional")}>
          Voltar
        </Button>
      </div>

      {/* ---------- Dados do adicional ---------- */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Categoria */}
        <div>
          <label className="block mb-1 text-sm font-medium">Categoria</label>
          <Controller
            name="id_categoria"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                disabled={isEditing}
                className="w-full rounded-md border-input bg-background p-2 text-sm"
              >
                <option value="">Selecione…</option>
                {dataCategorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.id_categoria && (
            <p className="mt-1 text-sm text-destructive">
              {errors.id_categoria.message}
            </p>
          )}
        </div>

        {/* Código Tipo */}
        <div>
          <label className="block mb-1 text-sm font-medium">Código Tipo</label>
          <Controller
            name="codigo_tipo"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full rounded-md border-input bg-background p-2 text-sm"
              />
            )}
          />
          {errors.codigo_tipo && (
            <p className="mt-1 text-sm text-destructive">
              {errors.codigo_tipo.message}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block mb-1 text-sm font-medium">Status</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select
                value={String(field.value)}
                onChange={(e) => field.onChange(e.target.value === "1" ? 1 : 0)}
                className="w-full rounded-md border-input bg-background p-2 text-sm"
              >
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            )}
          />
        </div>

        {/* Nome */}
        <div className="sm:col-span-2">
          <label className="block mb-1 mt-4 sm:mt-0 text-sm font-medium">
            Nome
          </label>
          <Controller
            name="nome"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full rounded-md border-input bg-background p-2 text-sm"
              />
            )}
          />
          {errors.nome && (
            <p className="mt-1 text-sm text-destructive">
              {errors.nome.message}
            </p>
          )}
        </div>

        {/* Tipo de Seleção */}
        <div className="mt-4 sm:mt-0">
          <label className="block mb-1 text-sm font-medium">
            Tipo de Seleção
          </label>
          <Controller
            name="selecao"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full rounded-md border-input bg-background p-2 text-sm"
              >
                <option value="U">Única (1 obrigatória)</option>
                <option value="M">Múltipla</option>
                <option value="Q">Quantidade</option>
              </select>
            )}
          />
        </div>

        {/* Mínimo / Limite (somente para Q) */}
        {selecao === "Q" && (
          <>
            <div>
              <label className="block mb-1 text-sm font-medium">Mínimo</label>
              <Controller
                name="minimo"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    min="0"
                    {...field}
                    className="w-full rounded-md border-input bg-background p-2 text-sm"
                  />
                )}
              />
              {errors.minimo && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.minimo.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Limite</label>
              <Controller
                name="limite"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    min="0"
                    {...field}
                    className="w-full rounded-md border-input bg-background p-2 text-sm"
                  />
                )}
              />
              {errors.limite && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.limite.message}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ---------- Opções ---------- */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Opções</h2>

        {fields.map((f, idx) => (
          <div
            key={f.id}
            className="grid gap-4 items-start md:grid-cols-12 border rounded p-4"
          >
            {/* Nome */}
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <Controller
                name={`opcoes.${idx}.nome`}
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full rounded-md border-input bg-background p-2 text-sm"
                  />
                )}
              />
              {errors.opcoes?.[idx]?.nome && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.opcoes[idx]?.nome?.message}
                </p>
              )}
            </div>

            {/* Valor */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Valor</label>
              <Controller
                name={`opcoes.${idx}.valor`}
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...field}
                    className="w-full rounded-md border-input bg-background p-2 text-sm"
                  />
                )}
              />
              {errors.opcoes?.[idx]?.valor && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.opcoes[idx]?.valor?.message}
                </p>
              )}
            </div>

            {/* Código */}
            <div className="md:col-span-3">
              <label className="mb-1 block text-sm font-medium">Código</label>
              <Controller
                name={`opcoes.${idx}.codigo`}
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full rounded-md border-input bg-background p-2 text-sm"
                  />
                )}
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Status</label>
              <Controller
                name={`opcoes.${idx}.status`}
                control={control}
                render={({ field }) => (
                  <select
                    value={String(field.value)}
                    onChange={(e) =>
                      field.onChange(e.target.value === "1" ? 1 : 0)
                    }
                    className="w-full rounded-md border-input bg-background p-2 text-sm"
                  >
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </select>
                )}
              />
            </div>

            {/* Remover */}
            <div className="md:col-span-2 flex items-end">
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={fields.length <= 1}
                className="rounded-full bg-destructive text-white p-2 disabled:opacity-40"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={() =>
            append({
              nome: "",
              valor: 0,
              codigo: "",
              status: 1,
            })
          }
          color="red"
          className="inline-flex items-center gap-1"
        >
          <PlusIcon className="w-5 h-5" />
          Adicionar Opção
        </Button>
      </div>

      {/* ---------- Ações ---------- */}
      <div className="flex justify-end gap-4 mt-8">
        <Button
          type="button"
          outline
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

export default FormCategoriaAdicional;
