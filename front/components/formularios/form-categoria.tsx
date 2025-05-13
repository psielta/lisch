"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PhotoIcon, // Não utilizado no código fornecido, mas mantido caso seja usado em outro lugar
  UserCircleIcon, // Não utilizado no código fornecido, mas mantido
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { format, parseISO } from "date-fns";
import {
  ICoreCategoria,
  ICoreCategoriaCreate,
  ICoreCategoriaUpdate,
} from "@/rxjs/categoria/categoria.model"; // Ajuste o caminho se necessário
import { CulinariaDTO } from "@/dto/culinaria-dto"; // Ajuste o caminho se necessário
import { useDispatch, useSelector } from "react-redux";
import {
  postOrPutCategoriaAction,
  // getCategoriaByIdAction, // Não utilizado no código fornecido
} from "@/rxjs/categoria/categoria.actions"; // Ajuste o caminho se necessário
import {
  selectpostOrPutCategoriaActionState,
  resetPostOrPutCategoriaActionState,
} from "@/rxjs/categoria/categoria.slice"; // Ajuste o caminho se necessário
import { useRouter } from "next/navigation";
import { User } from "@/context/auth-context"; // Ajuste o caminho se necessário

// Schema de validação com Zod revisado
const categoriaSchema = z.object({
  id: z.string().optional(),
  id_tenant: z.string().min(1, "ID do tenant é obrigatório"),
  id_culinaria: z.coerce // Usar coerce para conversão e melhor inferência de tipo
    .number({
      invalid_type_error: "ID da culinária deve ser um número.",
      required_error: "Selecione uma culinária.", // Embora min(1) já cubra isso para números
    })
    .min(1, "Selecione uma culinária"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  inicio: z.string().optional(),
  fim: z.string().optional(),
  ativo: z.number().optional(),
  opcao_meia: z.string().optional(),
  ordem: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? parseInt(val, 10)
        : val,
    z.number({ invalid_type_error: "Ordem deve ser um número." }).optional()
  ),
  disponivel_domingo: z.number().optional(),
  disponivel_segunda: z.number().optional(),
  disponivel_terca: z.number().optional(),
  disponivel_quarta: z.number().optional(),
  disponivel_quinta: z.number().optional(),
  disponivel_sexta: z.number().optional(),
  disponivel_sabado: z.number().optional(),
  opcoes: z
    .array(
      z.object({
        id: z.string().optional(),
        nome: z.string().min(1, "Nome da opção é obrigatório"),
        status: z.number().optional(),
      })
    )
    .min(1, "Adicione pelo menos uma opção"),
});

type CategoriaFormValues = z.infer<typeof categoriaSchema>;

interface FormCategoriaProps {
  categoria: ICoreCategoria | null;
  culinarias: CulinariaDTO[];
  me: User;
}

export default function FormCategoria({
  categoria,
  culinarias,
  me,
}: FormCategoriaProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const postOrPutState = useSelector(selectpostOrPutCategoriaActionState);

  // Valores padrão para o formulário
  const defaultValues: CategoriaFormValues = {
    id: categoria?.id || undefined, // Melhor usar undefined para campos opcionais não presentes
    id_tenant: categoria?.id_tenant || me.tenant_id,
    id_culinaria: categoria?.id_culinaria || 0, // Se 0 não for uma ID válida, a validação min(1) pegará.
    nome: categoria?.nome || "",
    descricao: categoria?.descricao || "",
    inicio: categoria?.inicio || "00:00:00",
    fim: categoria?.fim || "00:00:00",
    ativo: categoria?.ativo === undefined ? 1 : Number(categoria.ativo), // Default para 1 (Ativo) se não definido
    opcao_meia: categoria?.opcao_meia || "",
    ordem: categoria?.ordem === undefined ? undefined : Number(categoria.ordem),
    disponivel_domingo:
      categoria?.disponivel_domingo === undefined
        ? 0
        : Number(categoria.disponivel_domingo),
    disponivel_segunda:
      categoria?.disponivel_segunda === undefined
        ? 0
        : Number(categoria.disponivel_segunda),
    disponivel_terca:
      categoria?.disponivel_terca === undefined
        ? 0
        : Number(categoria.disponivel_terca),
    disponivel_quarta:
      categoria?.disponivel_quarta === undefined
        ? 0
        : Number(categoria.disponivel_quarta),
    disponivel_quinta:
      categoria?.disponivel_quinta === undefined
        ? 0
        : Number(categoria.disponivel_quinta),
    disponivel_sexta:
      categoria?.disponivel_sexta === undefined
        ? 0
        : Number(categoria.disponivel_sexta),
    disponivel_sabado:
      categoria?.disponivel_sabado === undefined
        ? 0
        : Number(categoria.disponivel_sabado),
    opcoes: categoria?.opcoes?.map((op) => ({
      id: op.id || undefined,
      nome: op.nome,
      status: op.status === undefined ? 1 : Number(op.status), // Default para 1 (Ativo)
    })) || [{ nome: "", status: 1 }],
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset, // Não utilizado no código fornecido, mas mantido
    watch, // Não utilizado no código fornecido, mas mantido
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "opcoes",
  });

  function FormataEmHoraMinutoSegundo(hora: string): string | undefined {
    if (!hora) {
      return "00:00:00";
    }
    if (hora.length === 5) {
      return hora + ":00";
    }
    if (hora.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      return hora;
    }
    if (hora.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      return hora + ":00";
    }
    return "00:00:00";
  }

  // Efeito para lidar com o sucesso no envio do formulário
  useEffect(() => {
    if (postOrPutState === "completed") {
      router.push("/cadastros/categorias"); // Ajuste a rota se necessário
      dispatch(resetPostOrPutCategoriaActionState());
    }
    // Adicionar dispatch à lista de dependências se for estável (geralmente é)
  }, [postOrPutState, dispatch, router]);

  // Função para enviar o formulário
  const onSubmit = (data: CategoriaFormValues) => {
    const newInicio = FormataEmHoraMinutoSegundo(data.inicio ?? "");
    const newFim = FormataEmHoraMinutoSegundo(data.fim ?? "");

    const cleanData = {
      ...data,
      descricao: data.descricao || undefined,
      inicio: newInicio,
      fim: newFim,
      ordem:
        data.ordem === undefined || isNaN(Number(data.ordem))
          ? undefined
          : Number(data.ordem),
      // Os campos de dias disponíveis e status já são números (0 ou 1) ou undefined
    };

    if (cleanData.id) {
      const updateData: ICoreCategoriaUpdate = {
        ...cleanData,
        id: cleanData.id, // id é string, já está correto
        // id_culinaria já é number pelo schema
        // nome já é string
        // ativo já é number (0 ou 1) ou undefined
        opcoes: cleanData.opcoes.map((op) => ({
          ...op,
          id: op.id || undefined,
          // status já é number (0 ou 1) ou undefined
        })),
      };
      dispatch(postOrPutCategoriaAction.request(updateData));
    } else {
      // Para ICoreCategoriaCreate, não incluir 'id' principal
      const { id, ...restOfData } = cleanData;
      const createData: ICoreCategoriaCreate = {
        ...restOfData,
        // id_tenant já é string
        // id_culinaria já é number
        // nome já é string
        // ativo já é number (0 ou 1) ou undefined
        opcoes: restOfData.opcoes.map((op) => ({
          nome: op.nome, // id da opção não existe na criação
          status: op.status, // status já é number (0 ou 1) ou undefined
        })),
      };
      dispatch(postOrPutCategoriaAction.request(createData));
    }
  };

  const watchedOpcoes = watch("opcoes");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-12 sm:space-y-16">
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            {categoria ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            {categoria
              ? "Altere os dados da categoria conforme necessário."
              : "Preencha os dados para criar uma nova categoria."}
          </p>

          <div className="mt-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
            {/* Campo oculto para ID */}
            <Controller
              name="id"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Campo oculto para ID do tenant */}
            <Controller
              name="id_tenant"
              control={control}
              defaultValue={me.tenant_id} // Definir defaultValue aqui também é uma boa prática
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Culinária */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="id_culinaria"
                className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
              >
                Culinária
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="id_culinaria"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="id_culinaria"
                      {...field}
                      // O valor do select será string. Zod coerce.number() lidará com a conversão.
                      // Para exibir o valor corretamente, especialmente se for 0:
                      value={
                        field.value === undefined || field.value === null
                          ? ""
                          : String(field.value)
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : e.target.value
                        )
                      } // Envia string ou undefined
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                    >
                      <option value="">Selecione uma culinária</option>
                      {culinarias.map((c) => (
                        <option
                          key={c.id_culinaria}
                          value={String(c.id_culinaria)}
                        >
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.id_culinaria && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.id_culinaria.message}
                  </p>
                )}
              </div>
            </div>

            {/* Nome */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="nome"
                className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
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
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-md sm:text-sm sm:leading-6"
                      {...field}
                    />
                  )}
                />
                {errors.nome && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.nome.message}
                  </p>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="descricao"
                className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
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
                      className="block w-full max-w-2xl rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      {...field}
                    />
                  )}
                />
                {errors.descricao && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.descricao.message}
                  </p>
                )}
              </div>
            </div>

            {/* Período de disponibilidade */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="periodo"
                className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
              >
                Período de disponibilidade
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="inicio"
                    className="block text-sm text-gray-600 mb-1"
                  >
                    Início
                  </label>
                  <Controller
                    name="inicio"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="time"
                        id="inicio"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                </div>
                <div>
                  <label
                    htmlFor="fim"
                    className="block text-sm text-gray-600 mb-1"
                  >
                    Fim
                  </label>
                  <Controller
                    name="fim"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="time"
                        id="fim"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Status e Ordem */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                Configurações
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ativo"
                    className="block text-sm text-gray-600 mb-1"
                  >
                    Status
                  </label>
                  <Controller
                    name="ativo"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="ativo"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={
                          field.value === undefined ? "1" : String(field.value)
                        } // Default to "1" (Ativo) if undefined
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
                    className="block text-sm text-gray-600 mb-1"
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
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        {...field}
                        value={field.value === undefined ? "" : field.value} // Para input number, controlar com string vazia para "vazio"
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
                    <p className="mt-2 text-sm text-red-600">
                      {errors.ordem.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Opcao Meia */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="opcao_meia"
                className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5"
              >
                Opção Meia
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="opcao_meia"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="opcao_meia"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                      {...field}
                    >
                      <option value="">Não oferecer opção meio a meio</option>
                      <option value="M">Valor médio</option>
                      <option value="V">Maior Valor</option>
                    </select>
                  )}
                />
              </div>
            </div>

            {/* Dias disponíveis */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                Dias disponíveis
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: "disponivel_domingo", label: "Domingo" },
                  { name: "disponivel_segunda", label: "Segunda" },
                  { name: "disponivel_terca", label: "Terça" },
                  { name: "disponivel_quarta", label: "Quarta" },
                  { name: "disponivel_quinta", label: "Quinta" },
                  { name: "disponivel_sexta", label: "Sexta" },
                  { name: "disponivel_sabado", label: "Sábado" },
                ].map((dia) => (
                  <div className="flex items-center" key={dia.name}>
                    <Controller
                      name={dia.name as keyof CategoriaFormValues} // Cast para garantir tipagem correta
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          id={dia.name}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          checked={!!field.value} // Booleano para 'checked'
                          onChange={(e) =>
                            field.onChange(e.target.checked ? 1 : 0)
                          }
                        />
                      )}
                    />
                    <label
                      htmlFor={dia.name}
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {dia.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Opções da Categoria */}
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Opções da Categoria
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            Adicione as opções disponíveis para esta categoria.
          </p>

          <div className="mt-10 space-y-8 border-b border-gray-900/10 pb-12">
            {fields.map((fieldItem, index) => {
              // Obter os dados atuais desta opção específica do array observado
              const currentOptionData = watchedOpcoes?.[index];
              // Verificar se a opção atual TEM um ID de banco de dados
              const hasDatabaseId = !!currentOptionData?.id;

              // A condição para desabilitar é: ser a última opção OU ter ID do banco
              const isRemoveDisabled = fields.length <= 1 || hasDatabaseId;
              return (
                <div
                  key={fieldItem.id}
                  className="grid grid-cols-12 gap-4 items-start"
                >
                  {/* Campo oculto para ID da opção (se existir) */}
                  <Controller
                    name={`opcoes.${index}.id`}
                    control={control}
                    render={({ field }) => <input type="hidden" {...field} />}
                  />

                  {/* Nome da opção */}
                  <div className="col-span-12 sm:col-span-7 md:col-span-6">
                    {" "}
                    {/* Ajustado para responsividade */}
                    <label
                      htmlFor={`opcao-nome-${index}`}
                      className="block text-sm font-medium leading-6 text-gray-900 mb-1"
                    >
                      Nome da opção
                    </label>
                    <Controller
                      name={`opcoes.${index}.nome`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id={`opcao-nome-${index}`}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                    {errors.opcoes?.[index]?.nome && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.opcoes[index]?.nome?.message}
                      </p>
                    )}
                  </div>

                  {/* Status da opção */}
                  <div className="col-span-8 sm:col-span-3 md:col-span-2">
                    {" "}
                    {/* Ajustado para responsividade */}
                    <label
                      htmlFor={`opcao-status-${index}`}
                      className="block text-sm font-medium leading-6 text-gray-900 mb-1"
                    >
                      Status
                    </label>
                    <Controller
                      name={`opcoes.${index}.status`}
                      control={control}
                      render={({ field }) => (
                        <select
                          id={`opcao-status-${index}`}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={
                            field.value === undefined
                              ? "1"
                              : String(field.value)
                          } // Default "1"
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

                  {/* Botão para remover opção */}
                  <div className="col-span-4 sm:col-span-2 md:col-span-1 pt-7">
                    {" "}
                    {/* Ajustado para alinhar e responsividade */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isRemoveDisabled}
                      className={`rounded-full p-1.5 text-white shadow-sm ${
                        // Aumentado padding
                        isRemoveDisabled
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                      }`}
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Remover opção</span>{" "}
                      {/* Para acessibilidade */}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Erros gerais das opções */}
            {errors.opcoes && !Array.isArray(errors.opcoes) && (
              <p className="mt-2 text-sm text-red-600">
                {errors.opcoes.message}
              </p>
            )}

            {/* Botão para adicionar nova opção */}
            <div className="mt-6">
              {" "}
              {/* Aumentado margin-top */}
              <button
                type="button"
                onClick={() => append({ nome: "", status: 1, id: undefined })} // Adicionar id: undefined para consistência
                className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Adicionar Opção
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="mt-8 flex items-center justify-end gap-x-6">
        {" "}
        {/* Aumentado margin-top */}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={postOrPutState === "pending"}
          className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 disabled:cursor-not-allowed" // Melhorado estado desabilitado
        >
          {postOrPutState === "pending" ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" // Aumentado tamanho do spinner
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
