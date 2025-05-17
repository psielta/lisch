"use client";
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PhotoIcon,
  UserCircleIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { User } from "@/context/auth-context";
import {
  ProdutoResponse,
  CreateProdutoRequest,
  UpdateProdutoRequest,
} from "@/rxjs/produto/produto.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { IsGuid } from "@/lib/guidUtils";
import { useDispatch, useSelector } from "react-redux";
import {
  createProdutoAction,
  updateProdutoAction,
} from "@/rxjs/produto/produto.action";
import {
  selectCreateProdutoActionState,
  selectUpdateProdutoActionState,
  resetCreateProdutoActionState,
  resetUpdateProdutoActionState,
} from "@/rxjs/produto/produto.slice";
import { useRouter } from "next/navigation";
import { z } from "zod";

// Schema de validação com Zod para Produtos
const produtoSchema = z.object({
  id: z.string().optional(),
  id_categoria: z.string().min(1, "Categoria é obrigatória"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  codigo_externo: z.string().optional(),
  sku: z.string().optional(),
  permite_observacao: z.boolean().optional().default(true),
  ordem: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? parseInt(val, 10)
        : val,
    z.number({ invalid_type_error: "Ordem deve ser um número." }).optional()
  ),
  imagem_url: z
    .string()
    .url("URL da imagem inválida")
    .optional()
    .or(z.literal("")),
  status: z.number().optional().default(1),
  precos: z
    .array(
      z.object({
        id: z.string().optional(),
        id_categoria_opcao: z
          .string()
          .min(1, "Opção de categoria é obrigatória"),
        codigo_externo_opcao_preco: z.string().optional(),
        preco_base: z.preprocess(
          (val) => (typeof val === "string" ? parseFloat(val) : val),
          z
            .number({
              invalid_type_error: "Preço base deve ser um número válido.",
            })
            .min(0.01, "Preço base deve ser maior que zero")
        ),
        preco_promocional: z.preprocess(
          (val) =>
            val === "" || val === null || val === undefined
              ? undefined
              : typeof val === "string"
              ? parseFloat(val)
              : val,
          z
            .number({
              invalid_type_error:
                "Preço promocional deve ser um número válido.",
            })
            .min(0.01, "Preço promocional deve ser maior que zero")
            .optional()
        ),
        disponivel: z.number().optional().default(1),
      })
    )
    .min(1, "Adicione pelo menos um preço"),
});

type ProdutoFormValues = z.infer<typeof produtoSchema>;

function FormProduto({
  user,
  data,
  dataCategorias,
}: {
  user: User;
  data: ProdutoResponse | undefined;
  dataCategorias: ICoreCategoria[];
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const createProdutoState = useSelector(selectCreateProdutoActionState);
  const updateProdutoState = useSelector(selectUpdateProdutoActionState);
  const isEditing = IsGuid(data?.id);
  const isSubmitting =
    createProdutoState === "pending" || updateProdutoState === "pending";

  // Valores padrão para o formulário
  const defaultValues: ProdutoFormValues = {
    id: data?.id || undefined,
    id_categoria: data?.id_categoria || "",
    nome: data?.nome || "",
    descricao: data?.descricao || "",
    codigo_externo: data?.codigo_externo || "",
    sku: data?.sku || "",
    permite_observacao:
      data?.permite_observacao === undefined ? true : data.permite_observacao,
    ordem: data?.ordem === undefined ? undefined : Number(data.ordem),
    imagem_url: data?.imagem_url || "",
    status: data?.status === undefined ? 1 : Number(data.status),
    precos: data?.precos?.map((p) => ({
      id: p.id || undefined,
      id_categoria_opcao: p.id_categoria_opcao || "",
      codigo_externo_opcao_preco: p.codigo_externo_opcao_preco || "",
      preco_base: parseFloat(p.preco_base),
      preco_promocional: p.preco_promocional
        ? parseFloat(p.preco_promocional)
        : undefined,
      disponivel: p.disponivel === undefined ? 1 : Number(p.disponivel),
    })) || [{ id_categoria_opcao: "", preco_base: 0, disponivel: 1 }],
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "precos",
  });

  // Efeito para lidar com o sucesso no envio do formulário
  useEffect(() => {
    if (
      createProdutoState === "completed" ||
      updateProdutoState === "completed"
    ) {
      router.push("/cadastros/produtos"); // Ajuste a rota se necessário
      if (createProdutoState === "completed") {
        dispatch(resetCreateProdutoActionState());
      }
      if (updateProdutoState === "completed") {
        dispatch(resetUpdateProdutoActionState());
      }
    }
  }, [createProdutoState, updateProdutoState, dispatch, router]);

  // Função para enviar o formulário
  const onSubmit = (data: ProdutoFormValues) => {
    const cleanedData = {
      ...data,
      ordem:
        data.ordem === undefined || isNaN(Number(data.ordem))
          ? undefined
          : Number(data.ordem),
      imagem_url: data.imagem_url === "" ? undefined : data.imagem_url,
      precos: data.precos.map((preco) => ({
        ...preco,
        id: preco.id || undefined,
        codigo_externo_opcao_preco:
          preco.codigo_externo_opcao_preco || undefined,
        preco_promocional: preco.preco_promocional || undefined,
      })),
    };
    const payload = {
      ...cleanedData,
      status: cleanedData.status as 0 | 1, // ⚠  garante 0 | 1
      precos: cleanedData.precos.map((p) => ({
        ...p,
        preco_base: p.preco_base.toString(), // number → string
        preco_promocional:
          p.preco_promocional !== undefined
            ? p.preco_promocional.toString()
            : undefined,
        disponivel: p.disponivel as 0 | 1,
      })),
    };

    if (isEditing && payload.id) {
      dispatch(updateProdutoAction.request({ id: payload.id, data: payload }));
    } else {
      const { id, ...rest } = payload;
      dispatch(createProdutoAction.request(rest));
    }
  };

  const watchedPrecos = watch("precos");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-12 sm:space-y-16">
        <div>
          <h2 className="text-base font-semibold leading-7 text-foreground">
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isEditing
              ? "Altere os dados do produto conforme necessário."
              : "Preencha os dados para criar um novo produto."}
          </p>

          <div className="mt-10 space-y-8 border-b border-border pb-12 sm:space-y-0 sm:divide-y sm:divide-border sm:border-t sm:pb-0">
            {/* Campo oculto para ID */}
            <Controller
              name="id"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Categoria */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="id_categoria"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                Categoria
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="id_categoria"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="id_categoria"
                      {...field}
                      className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input focus:ring-2 focus:ring-inset focus:ring-ring sm:max-w-xs sm:text-sm sm:leading-6"
                    >
                      <option value="">Selecione uma categoria</option>
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
              <label
                htmlFor="nome"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                Nome
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      id="nome"
                      autoComplete="off"
                      className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:max-w-md sm:text-sm sm:leading-6"
                      {...field}
                    />
                  )}
                />
                {errors.nome && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.nome.message}
                  </p>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="descricao"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                Descrição
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      id="descricao"
                      rows={3}
                      className="block w-full max-w-2xl rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                      {...field}
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.descricao.message}
                  </p>
                )}
              </div>
            </div>

            {/* Código Externo e SKU */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="codigo_externo"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                Códigos
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="codigo_externo"
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    Código Externo
                  </label>
                  <Controller
                    name="codigo_externo"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        id="codigo_externo"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                  {errors.codigo_externo && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.codigo_externo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="sku"
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    SKU
                  </label>
                  <Controller
                    name="sku"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        id="sku"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                  {errors.sku && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.sku.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status e Ordem */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5">
                Configurações
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    Status
                  </label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="status"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                        value={
                          field.value === undefined ? "1" : String(field.value)
                        }
                        onChange={(e) =>
                          field.onChange(e.target.value === "1" ? 1 : 0)
                        }
                      >
                        <option value="1">Ativo</option>
                        <option value="0">Inativo</option>
                      </select>
                    )}
                  />
                </div>
                <div>
                  <label
                    htmlFor="ordem"
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    Ordem
                  </label>
                  <Controller
                    name="ordem"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        id="ordem"
                        min="0"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                        {...field}
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    )}
                  />
                  {errors.ordem && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.ordem.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* URL da Imagem */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="imagem_url"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                URL da Imagem
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="imagem_url"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      id="imagem_url"
                      className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                      placeholder="https://example.com/imagem.jpg"
                      {...field}
                    />
                  )}
                />
                {errors.imagem_url && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.imagem_url.message}
                  </p>
                )}
              </div>
            </div>

            {/* Permite Observação */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="permite_observacao"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                Permite Observação
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="permite_observacao"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="permite_observacao"
                        className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <label
                        htmlFor="permite_observacao"
                        className="ml-2 block text-sm text-foreground"
                      >
                        Cliente pode adicionar observações
                      </label>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preços do Produto */}
        <div>
          <h2 className="text-base font-semibold leading-7 text-foreground">
            Preços do Produto
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Adicione os preços disponíveis para este produto.
          </p>

          <div className="mt-10 space-y-8 border-b border-border pb-12">
            {fields.map((fieldItem, index) => {
              const currentPriceData = watchedPrecos?.[index];
              const hasDatabaseId = !!currentPriceData?.id;
              const isRemoveDisabled = fields.length <= 1 || hasDatabaseId;

              return (
                <div
                  key={fieldItem.id}
                  className="grid grid-cols-12 gap-4 items-start"
                >
                  {/* Campo oculto para ID do preço (se existir) */}
                  <Controller
                    name={`precos.${index}.id`}
                    control={control}
                    render={({ field }) => <input type="hidden" {...field} />}
                  />

                  {/* Opção de Categoria */}
                  <div className="col-span-12 sm:col-span-4">
                    <label
                      htmlFor={`preco-opcao-${index}`}
                      className="block text-sm font-medium leading-6 text-foreground mb-1"
                    >
                      Opção da Categoria
                    </label>
                    <Controller
                      name={`precos.${index}.id_categoria_opcao`}
                      control={control}
                      render={({ field }) => (
                        <select
                          id={`preco-opcao-${index}`}
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        >
                          <option value="">Selecione uma opção</option>
                          {/* Aqui você deve mapear as opções da categoria selecionada */}
                          {dataCategorias
                            .find((cat) => cat.id === watch("id_categoria"))
                            ?.opcoes?.map((opcao) => (
                              <option key={opcao.id} value={opcao.id}>
                                {opcao.nome}
                              </option>
                            ))}
                        </select>
                      )}
                    />
                    {errors.precos?.[index]?.id_categoria_opcao && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.precos[index]?.id_categoria_opcao?.message}
                      </p>
                    )}
                  </div>

                  {/* Código Externo da Opção de Preço */}
                  <div className="col-span-12 sm:col-span-3">
                    <label
                      htmlFor={`preco-codigo-${index}`}
                      className="block text-sm font-medium leading-6 text-foreground mb-1"
                    >
                      Código Externo
                    </label>
                    <Controller
                      name={`precos.${index}.codigo_externo_opcao_preco`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id={`preco-codigo-${index}`}
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  {/* Preço Base */}
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor={`preco-base-${index}`}
                      className="block text-sm font-medium leading-6 text-foreground mb-1"
                    >
                      Preço Base
                    </label>
                    <Controller
                      name={`precos.${index}.preco_base`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          id={`preco-base-${index}`}
                          step="0.01"
                          min="0.01"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                    {errors.precos?.[index]?.preco_base && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.precos[index]?.preco_base?.message}
                      </p>
                    )}
                  </div>

                  {/* Preço Promocional */}
                  <div className="col-span-6 sm:col-span-2">
                    <label
                      htmlFor={`preco-promocional-${index}`}
                      className="block text-sm font-medium leading-6 text-foreground mb-1"
                    >
                      Preço Promocional
                    </label>
                    <Controller
                      name={`precos.${index}.preco_promocional`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          id={`preco-promocional-${index}`}
                          step="0.01"
                          min="0.01"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                        />
                      )}
                    />
                    {errors.precos?.[index]?.preco_promocional && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.precos[index]?.preco_promocional?.message}
                      </p>
                    )}
                  </div>

                  {/* Disponibilidade */}
                  <div className="col-span-8 sm:col-span-1 md:col-span-1 pt-7">
                    <Controller
                      name={`precos.${index}.disponivel`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`preco-disponivel-${index}`}
                            className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
                            checked={!!field.value}
                            onChange={(e) =>
                              field.onChange(e.target.checked ? 1 : 0)
                            }
                          />
                          <label
                            htmlFor={`preco-disponivel-${index}`}
                            className="ml-2 text-sm text-foreground"
                          >
                            Disponível
                          </label>
                        </div>
                      )}
                    />
                  </div>

                  {/* Botão para remover preço */}
                  <div className="col-span-4 sm:col-span-1 md:col-span-1 pt-7">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isRemoveDisabled}
                      className={`rounded-full p-1.5 text-white shadow-sm ${
                        isRemoveDisabled
                          ? "bg-zinc-200 dark:bg-zinc-700 text-muted-foreground cursor-not-allowed"
                          : "bg-destructive hover:bg-destructive/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      }`}
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Remover preço</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Erros gerais dos preços */}
            {errors.precos && !Array.isArray(errors.precos) && (
              <p className="mt-2 text-sm text-destructive">
                {errors.precos.message}
              </p>
            )}

            {/* Botão para adicionar novo preço */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() =>
                  append({
                    id_categoria_opcao: "",
                    preco_base: 0,
                    disponivel: 1,
                    id: undefined,
                    codigo_externo_opcao_preco: "",
                    preco_promocional: undefined,
                  })
                }
                className="inline-flex items-center gap-x-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Adicionar Preço
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="mt-8 flex items-center justify-end gap-x-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-semibold leading-6 text-foreground hover:text-foreground/80 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:bg-primary/40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </button>
      </div>
    </form>
  );
}

export default FormProduto;
