"use client";
import React, { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
  clearState,
} from "@/rxjs/adicionais/categoria-adicional.slice";
import { useAppDispatch } from "@/rxjs/hooks";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import { Button } from "@/components/catalyst-ui-kit/button";
import { Badge } from "@/components/catalyst-ui-kit/badge";

/* ------------------------------------------------------------------
 *  Zod Schemas
 * -----------------------------------------------------------------*/
const opcaoSchema = z.object({
  id: z.string().uuid().optional(),
  codigo: z.string().max(100).optional().or(z.literal("")),
  nome: z.string().min(1, "Obrigatório").max(100),
  valor: z.preprocess(
    (v) => (typeof v === "string" ? parseFloat(v) : v),
    z
      .number({ invalid_type_error: "Numérico" })
      .nonnegative(" >= 0")
      .max(99_999_999.99)
      .refine((n) => /^\d+(\.\d{1,2})?$/.test(n.toString()), "Máx. 2 decimais")
  ),
  status: z.union([z.literal(0), z.literal(1)]).default(1),
});

const adicionalSchema = z
  .object({
    id: z.string().uuid().optional(),
    id_categoria: z.string().uuid("Categoria inválida"),
    codigo_tipo: z.string().max(100).optional().or(z.literal("")),
    nome: z.string().min(3).max(100),
    selecao: z.enum(["U", "M", "Q"]),
    minimo: z.number().int().nonnegative().optional().or(z.literal("")),
    limite: z.number().int().positive().optional().or(z.literal("")),
    status: z.union([z.literal(0), z.literal(1)]).default(1),
    habilita_limite: z.boolean().optional(), // UI (para seleção M)
    opcoes: z.array(opcaoSchema).min(1, "Adicione ao menos 1 opção"),
  })
  .superRefine((val, ctx) => {
    /* seleção Q exige mínimo & limite válidos */
    if (val.selecao === "Q") {
      if (val.minimo === "" || val.limite === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo e Limite são obrigatórios",
          path: ["minimo"],
        });
      } else if (Number(val.minimo) > Number(val.limite)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mínimo > Limite",
          path: ["minimo"],
        });
      }
    }
    /* seleção M → limite só se habilitado */
    if (val.selecao === "M" && val.habilita_limite) {
      if (val.limite === "" || val.limite === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o limite",
          path: ["limite"],
        });
      }
    }
    /* nomes duplicados */
    const dup = new Set<string>();
    val.opcoes.forEach((o, i) => {
      const key = o.nome.trim().toLowerCase();
      if (dup.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Opção duplicada",
          path: ["opcoes", i, "nome"],
        });
      }
      dup.add(key);
    });
  });

type FormValues = z.infer<typeof adicionalSchema>;

/* ------------------------------------------------------------------
 *  Componente
 * -----------------------------------------------------------------*/
export default function FormCategoriaAdicional({
  user,
  data,
  dataCategorias,
  defaultIdCategoria,
}: {
  user: User;
  data: CategoriaAdicionalResponse | undefined;
  dataCategorias: ICoreCategoria[];
  defaultIdCategoria: string;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const crudState = useSelector(selectCrudActionState);
  const isEditing = Boolean(data?.id);
  const isSubmitting = crudState === "pending";

  /* ---- default values ---- */
  const defaultValues: FormValues = {
    id: data?.id,
    id_categoria: data?.id_categoria ?? defaultIdCategoria,
    codigo_tipo: data?.codigo_tipo ?? "",
    nome: data?.nome ?? "",
    selecao: (data?.selecao as "U" | "M" | "Q") ?? "U",
    minimo: data?.minimo ?? "",
    limite: data?.limite ?? "",
    status: (data?.status ?? 1) as 0 | 1,
    habilita_limite: data?.selecao === "M" && !!data?.limite,
    opcoes: data?.opcoes?.map((o) => ({
      id: o.id,
      codigo: o.codigo ?? "",
      nome: o.nome,
      valor: parseFloat(o.valor),
      status: (o.status ?? 1) as 0 | 1,
    })) ?? [{ nome: "", valor: 0, codigo: "", status: 1 as 0 | 1 }],
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(adicionalSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "opcoes",
  });

  /* pós-envio */
  useEffect(() => {
    if (crudState === "completed") {
      dispatch(clearState());
      toast.success("Adicional salvo com sucesso");
      router.push(
        `/cadastros/categorias/${defaultValues.id_categoria}/categoria-adicional`
      );
    }
  }, [crudState, dispatch, router, defaultIdCategoria]);

  const selecao = watch("selecao");
  const habilitaLimite = watch("habilita_limite");

  /* limpa mínimo/limite quando seleção muda */
  useEffect(() => {
    if (selecao !== "Q") setValue("minimo", "");
    if (selecao === "U") {
      setValue("habilita_limite", false);
      setValue("limite", "");
    }
  }, [selecao, setValue]);

  /* ---------- submit ---------- */
  const onSubmit = (values: FormValues) => {
    const payloadBase = {
      ...values,
      codigo_tipo: values.codigo_tipo || undefined,
      minimo: selecao === "Q" ? Number(values.minimo) : undefined,
      limite:
        selecao === "Q"
          ? Number(values.limite)
          : selecao === "M" && values.habilita_limite
          ? Number(values.limite)
          : undefined,
      opcoes: values.opcoes.map((o) => ({
        ...o,
        valor: o.valor.toFixed(2),
        codigo: o.codigo || undefined,
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

  /* ------------------------------------------------------------------
   *  UI Helpers
   * -----------------------------------------------------------------*/
  const labelCls =
    "block text-sm font-medium leading-6 text-foreground sm:pt-1.5";
  const inputCls =
    "block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6";

  /* ------------------------------------------------------------------
   *  Render
   * -----------------------------------------------------------------*/
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-12 sm:space-y-16">
        {/* -------------------------------- Cabeçalho ------------------------------- */}
        <div>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold leading-7 text-foreground">
                {isEditing ? "Editar Adicional" : "Novo Adicional"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isEditing
                  ? "Altere os dados do adicional."
                  : "Preencha os dados para criar um adicional."}
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(
                  `/cadastros/categorias/${defaultIdCategoria}/categoria-adicional`
                )
              }
            >
              Voltar
            </Button>
          </div>

          <div className="mt-10 space-y-8 border-b border-border pb-12 sm:space-y-0 sm:divide-y sm:divide-border sm:border-t sm:pb-0">
            {/* Categoria */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className={labelCls}>Categoria</label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="id_categoria"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled
                      className={`${inputCls} disabled:opacity-50`}
                    >
                      <option value="">Selecione</option>
                      {dataCategorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.id_categoria && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.id_categoria.message}
                  </p>
                )}
              </div>
            </div>

            {/* Nome */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className={labelCls}>Nome</label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input {...field} className={inputCls} />
                  )}
                />
                {errors.nome && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.nome.message}
                  </p>
                )}
              </div>
            </div>

            {/* Código Tipo e Status */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className={labelCls}>Código / Status</label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 grid grid-cols-2 gap-4">
                <div>
                  <input type="hidden" value={watch("codigo_tipo")} readOnly />
                  <Controller
                    name="codigo_tipo"
                    control={control}
                    render={({ field }) => (
                      <>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Código Tipo
                        </label>
                        <input {...field} className={inputCls} />
                      </>
                    )}
                  />
                  {errors.codigo_tipo && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.codigo_tipo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Status
                  </label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={String(field.value)}
                        onChange={(e) =>
                          field.onChange(e.target.value === "1" ? 1 : 0)
                        }
                        className={inputCls}
                      >
                        <option value="1">Ativo</option>
                        <option value="0">Inativo</option>
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Tipo de Seleção */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className={labelCls}>Tipo de Seleção</label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="selecao"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className={inputCls}>
                      <option value="U">Única (obrigatória)</option>
                      <option value="M">Múltipla</option>
                      <option value="Q">Quantidade</option>
                    </select>
                  )}
                />
              </div>
            </div>

            {/* Mín/Limite para Q ou slider p/ M */}
            {selecao === "Q" && (
              <>
                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                  <label className={labelCls}>Mínimo</label>
                  <div className="mt-2 sm:col-span-2 sm:mt-0">
                    <Controller
                      name="minimo"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          min="0"
                          {...field}
                          className={inputCls}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || value === "0") {
                              field.onChange(0);
                            } else {
                              field.onChange(Number(value));
                            }
                          }}
                        />
                      )}
                    />
                    {errors.minimo && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.minimo.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                  <label className={labelCls}>Limite</label>
                  <div className="mt-2 sm:col-span-2 sm:mt-0">
                    <Controller
                      name="limite"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          min="0"
                          {...field}
                          className={inputCls}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || value === "0") {
                              field.onChange(0);
                            } else {
                              field.onChange(Number(value));
                            }
                          }}
                        />
                      )}
                    />
                    {errors.limite && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.limite.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {selecao === "M" && (
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label className={labelCls}>Limite de adicionais</label>
                <div className="mt-2 sm:col-span-2 sm:mt-0 space-y-2">
                  {/* toggle */}
                  <Controller
                    name="habilita_limite"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="habilita_limite"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
                        />
                        <label
                          htmlFor="habilita_limite"
                          className="text-sm text-foreground"
                        >
                          Ativar limite
                        </label>
                      </div>
                    )}
                  />
                  {/* slider */}
                  {habilitaLimite && (
                    <>
                      <Controller
                        name="limite"
                        control={control}
                        render={({ field }) => (
                          <>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={field.value || 1}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value, 10))
                              }
                              className="w-full"
                            />
                            <span className="text-sm text-muted-foreground">
                              Limite: {field.value || 1}
                            </span>
                          </>
                        )}
                      />
                      {errors.limite && (
                        <p className="text-sm text-destructive">
                          {errors.limite.message}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* -------------------------------- Opções ------------------------------- */}
        <div>
          <h2 className="text-base font-semibold leading-7 text-foreground">
            Opções
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Adicione as opções disponíveis para este adicional.
          </p>

          <div className="mt-10 space-y-8 border-b border-border pb-12">
            {fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 gap-4 items-start">
                <Controller
                  name={`opcoes.${i}.id`}
                  control={control}
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                {/* Nome */}
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-sm mb-1">Nome</label>
                  <Controller
                    name={`opcoes.${i}.nome`}
                    control={control}
                    render={({ field }) => (
                      <input {...field} className={inputCls} />
                    )}
                  />
                  {errors.opcoes?.[i]?.nome && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.opcoes[i]?.nome?.message}
                    </p>
                  )}
                </div>

                {/* Valor */}
                <div className="col-span-12 sm:col-span-2">
                  <label className="block text-sm mb-1">Valor (R$)</label>
                  <Controller
                    name={`opcoes.${i}.valor`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        step="0.01"
                        {...field}
                        className={inputCls}
                      />
                    )}
                  />
                  {errors.opcoes?.[i]?.valor && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.opcoes[i]?.valor?.message}
                    </p>
                  )}
                </div>

                {/* Código */}
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-sm mb-1">Código</label>
                  <Controller
                    name={`opcoes.${i}.codigo`}
                    control={control}
                    render={({ field }) => (
                      <input {...field} className={inputCls} />
                    )}
                  />
                  {errors.opcoes?.[i]?.codigo && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.opcoes[i]?.codigo?.message}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-12 sm:col-span-2">
                  <label className="block text-sm mb-1">Status</label>
                  <Controller
                    name={`opcoes.${i}.status`}
                    control={control}
                    render={({ field }) => (
                      <select
                        value={String(field.value)}
                        onChange={(e) =>
                          field.onChange(e.target.value === "1" ? 1 : 0)
                        }
                        className={inputCls}
                      >
                        <option value="1">Ativo</option>
                        <option value="0">Inativo</option>
                      </select>
                    )}
                  />
                </div>

                {/* Remover */}
                <div className="col-span-12 sm:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(i)}
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
                append({ nome: "", valor: 0, codigo: "", status: 1 })
              }
              className="inline-flex items-center gap-1"
            >
              <PlusIcon className="w-5 h-5" />
              Adicionar Opção
            </Button>
          </div>
        </div>
      </div>

      {/* ----------------------------- Ações ----------------------------- */}
      <div className="mt-8 flex items-center justify-end gap-x-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-semibold leading-6 text-foreground hover:text-foreground/80"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:bg-primary/40"
        >
          {isSubmitting ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
