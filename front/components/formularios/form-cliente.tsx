"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@/context/auth-context";
import {
  ClienteResponse,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "@/rxjs/clientes/cliente.model";
import { useDispatch, useSelector } from "react-redux";
import { postOrPutClienteAction } from "@/rxjs/clientes/cliente.action";
import { selectpostOrPutClienteActionState } from "@/rxjs/clientes/cliente.slice";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "../catalyst-ui-kit/button";
import { toast } from "sonner";

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number(cpf.charAt(10));
}

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const t = cnpj.length - 2;
  const d = cnpj.substring(t);
  const calc = (x: number[]) =>
    x.reduce((a, b, i) => a + b * Number(cnpj.charAt(i)), 0);
  const dv = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let d1 = calc(dv.slice(1)) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  if (d1 !== Number(d.charAt(0))) return false;
  let d2 = calc(dv) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return d2 === Number(d.charAt(1));
}

// Schema de validação com Zod para Clientes
const clienteSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid("Tenant ID é obrigatório"),
  tipo_pessoa: z.enum(["F", "J"], {
    required_error: "Tipo de pessoa é obrigatório",
  }),
  nome_razao_social: z
    .string()
    .min(3, "Mín. 3 caracteres")
    .max(255, "Máx. 255 caracteres"),
  nome_fantasia: z.string().max(255, "Máx. 255 caracteres").optional(),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || validarCPF(val), {
      message: "CPF inválido",
    }),
  cnpj: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || validarCNPJ(val), {
      message: "CNPJ inválido",
    }),
  rg: z.string().max(20, "Máx. 20 caracteres").optional(),
  ie: z.string().max(20, "Máx. 20 caracteres").optional(),
  im: z.string().max(20, "Máx. 20 caracteres").optional(),
  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("E-mail inválido")
    .max(255, "Máx. 255 caracteres")
    .optional()
    .or(z.literal("")),
  telefone: z.string().max(20, "Máx. 20 caracteres").optional(),
  celular: z.string().max(20, "Máx. 20 caracteres").optional(),
  cep: z
    .string()
    .regex(/^\d{8}$/, "CEP deve ter 8 dígitos")
    .optional()
    .or(z.literal("")),
  logradouro: z.string().max(255, "Máx. 255 caracteres").optional(),
  numero: z.string().max(10, "Máx. 10 caracteres").optional(),
  complemento: z.string().max(100, "Máx. 100 caracteres").optional(),
  bairro: z.string().max(100, "Máx. 100 caracteres").optional(),
  cidade: z.string().max(100, "Máx. 100 caracteres").optional(),
  uf: z
    .string()
    .length(2, "UF deve ter 2 caracteres")
    .optional()
    .or(z.literal("")),
});
type ClienteFormValues = z.infer<typeof clienteSchema>;

// Estados brasileiros
const estadosBrasileiros = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

function FormCliente({
  user,
  data,
}: {
  user: User;
  data: ClienteResponse | undefined;
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const postOrPutClienteState = useSelector(selectpostOrPutClienteActionState);
  const isEditing = (data?.id ?? "") !== "" && (data?.id?.length ?? 0) > 10;
  const isSubmitting = postOrPutClienteState === "pending";

  // Valores padrão para o formulário
  const defaultValues: ClienteFormValues = {
    id: data?.id || undefined,
    tenant_id: user.tenant_id,
    tipo_pessoa: data?.tipo_pessoa || "F",
    nome_razao_social: data?.nome_razao_social || "",
    nome_fantasia: data?.nome_fantasia || "",
    cpf: data?.cpf || "",
    cnpj: data?.cnpj || "",
    rg: data?.rg || "",
    ie: data?.ie || "",
    im: data?.im || "",
    data_nascimento: data?.data_nascimento || "",
    email: data?.email || "",
    telefone: data?.telefone || "",
    celular: data?.celular || "",
    cep: data?.cep || "",
    logradouro: data?.logradouro || "",
    numero: data?.numero || "",
    complemento: data?.complemento || "",
    bairro: data?.bairro || "",
    cidade: data?.cidade || "",
    uf: data?.uf || "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  });

  const tipoPessoa = watch("tipo_pessoa");

  // Efeito para lidar com o sucesso no envio do formulário
  useEffect(() => {
    if (postOrPutClienteState === "completed") {
      router.push("/cadastros/clientes");
      toast.success("Cliente salvo com sucesso");
    }
  }, [postOrPutClienteState, router]);

  // Função para enviar o formulário
  const onSubmit = (data: ClienteFormValues) => {
    const cleanedData = {
      ...data,
      nome_fantasia: data.nome_fantasia || undefined,
      cpf: data.cpf || undefined,
      cnpj: data.cnpj || undefined,
      rg: data.rg || undefined,
      ie: data.ie || undefined,
      im: data.im || undefined,
      data_nascimento: data.data_nascimento || undefined,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      celular: data.celular || undefined,
      cep: data.cep || undefined,
      logradouro: data.logradouro || undefined,
      numero: data.numero || undefined,
      complemento: data.complemento || undefined,
      bairro: data.bairro || undefined,
      cidade: data.cidade || undefined,
      uf: data.uf || undefined,
    };

    if (isEditing && cleanedData.id) {
      dispatch(postOrPutClienteAction.request(cleanedData as UpdateClienteDTO));
    } else {
      const { id, ...rest } = cleanedData;
      dispatch(postOrPutClienteAction.request(rest as CreateClienteDTO));
    }
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 11);
  };

  // Formatação de CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 14);
  };

  // Formatação de CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 8);
  };

  // Formatação de telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 11);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-12 sm:space-y-16">
        <div>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold leading-7 text-foreground">
                {isEditing ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isEditing
                  ? "Altere os dados do cliente conforme necessário."
                  : "Preencha os dados para criar um novo cliente."}
              </p>
            </div>
            <Button onClick={() => router.push("/cadastros/clientes")}>
              Voltar
            </Button>
          </div>

          <div className="mt-10 space-y-8 border-b border-border pb-12 sm:space-y-0 sm:divide-y sm:divide-border sm:border-t sm:pb-0">
            {/* Campo oculto para ID */}
            <Controller
              name="id"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Campo oculto para tenant_id */}
            <Controller
              name="tenant_id"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Tipo de Pessoa */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="tipo_pessoa"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                Tipo de Pessoa
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="tipo_pessoa"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="tipo_pessoa"
                      className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input focus:ring-2 focus:ring-inset focus:ring-ring sm:max-w-xs sm:text-sm sm:leading-6"
                      {...field}
                    >
                      <option value="F">Pessoa Física</option>
                      <option value="J">Pessoa Jurídica</option>
                    </select>
                  )}
                />
                {errors.tipo_pessoa && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.tipo_pessoa.message}
                  </p>
                )}
              </div>
            </div>

            {/* Nome/Razão Social */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="nome_razao_social"
                className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
              >
                {tipoPessoa === "F" ? "Nome Completo" : "Razão Social"}
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <Controller
                  name="nome_razao_social"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      id="nome_razao_social"
                      autoComplete="name"
                      className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:max-w-md sm:text-sm sm:leading-6"
                      {...field}
                    />
                  )}
                />
                {errors.nome_razao_social && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.nome_razao_social.message}
                  </p>
                )}
              </div>
            </div>

            {/* Nome Fantasia (apenas para PJ) */}
            {tipoPessoa === "J" && (
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label
                  htmlFor="nome_fantasia"
                  className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
                >
                  Nome Fantasia
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <Controller
                    name="nome_fantasia"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        id="nome_fantasia"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:max-w-md sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                  {errors.nome_fantasia && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.nome_fantasia.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* CPF/CNPJ e RG/IE */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5">
                Documentos
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CPF ou CNPJ */}
                <div>
                  <label
                    htmlFor={tipoPessoa === "F" ? "cpf" : "cnpj"}
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    {tipoPessoa === "F" ? "CPF" : "CNPJ"}
                  </label>
                  {tipoPessoa === "F" ? (
                    <Controller
                      name="cpf"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="cpf"
                          placeholder="00000000000"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                          onChange={(e) =>
                            field.onChange(formatCPF(e.target.value))
                          }
                        />
                      )}
                    />
                  ) : (
                    <Controller
                      name="cnpj"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="cnpj"
                          placeholder="00000000000000"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                          onChange={(e) =>
                            field.onChange(formatCNPJ(e.target.value))
                          }
                        />
                      )}
                    />
                  )}
                  {(errors.cpf || errors.cnpj) && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.cpf?.message || errors.cnpj?.message}
                    </p>
                  )}
                </div>

                {/* RG ou IE */}
                <div>
                  <label
                    htmlFor={tipoPessoa === "F" ? "rg" : "ie"}
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    {tipoPessoa === "F" ? "RG" : "Inscrição Estadual"}
                  </label>
                  {tipoPessoa === "F" ? (
                    <Controller
                      name="rg"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="rg"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                  ) : (
                    <Controller
                      name="ie"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="ie"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                  )}
                  {(errors.rg || errors.ie) && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.rg?.message || errors.ie?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Inscrição Municipal (apenas para PJ) */}
            {tipoPessoa === "J" && (
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label
                  htmlFor="im"
                  className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
                >
                  Inscrição Municipal
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <Controller
                    name="im"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        id="im"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:max-w-md sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                  {errors.im && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.im.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Data de Nascimento (apenas para PF) */}
            {tipoPessoa === "F" && (
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label
                  htmlFor="data_nascimento"
                  className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5"
                >
                  Data de Nascimento
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <Controller
                    name="data_nascimento"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="date"
                        id="data_nascimento"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:max-w-md sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                  {errors.data_nascimento && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.data_nascimento.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Contato */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5">
                Contato
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 space-y-4">
                {/* E-mail */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    E-mail
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="email"
                        id="email"
                        autoComplete="email"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Telefones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="hidden">
                    <label
                      htmlFor="telefone"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      Telefone
                    </label>
                    <Controller
                      name="telefone"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="telefone"
                          autoComplete="tel"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                          onChange={(e) =>
                            field.onChange(formatTelefone(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.telefone && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.telefone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="celular"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      Celular ou Telefone
                    </label>
                    <Controller
                      name="celular"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="celular"
                          autoComplete="tel"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                          onChange={(e) =>
                            field.onChange(formatTelefone(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.celular && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.celular.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label className="block text-sm font-medium leading-6 text-foreground sm:pt-1.5">
                Endereço
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 space-y-4">
                {/* CEP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="cep"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      CEP
                    </label>
                    <Controller
                      name="cep"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="cep"
                          placeholder="00000000"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                          onChange={(e) =>
                            field.onChange(formatCEP(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.cep && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.cep.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Logradouro e Número */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="logradouro"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      Logradouro
                    </label>
                    <Controller
                      name="logradouro"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="logradouro"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                    {errors.logradouro && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.logradouro.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="numero"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      Número
                    </label>
                    <Controller
                      name="numero"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="numero"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                    {errors.numero && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.numero.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Complemento */}
                <div>
                  <label
                    htmlFor="complemento"
                    className="block text-sm text-muted-foreground mb-1"
                  >
                    Complemento
                  </label>
                  <Controller
                    name="complemento"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        id="complemento"
                        className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                        {...field}
                      />
                    )}
                  />
                  {errors.complemento && (
                    <p className="mt-2 text-sm text-destructive">
                      {errors.complemento.message}
                    </p>
                  )}
                </div>

                {/* Bairro, Cidade e UF */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="bairro"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      Bairro
                    </label>
                    <Controller
                      name="bairro"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="bairro"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                    {errors.bairro && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.bairro.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="cidade"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      Cidade
                    </label>
                    <Controller
                      name="cidade"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          id="cidade"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        />
                      )}
                    />
                    {errors.cidade && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.cidade.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="uf"
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      UF
                    </label>
                    <Controller
                      name="uf"
                      control={control}
                      render={({ field }) => (
                        <select
                          id="uf"
                          className="block w-full rounded-md border-0 py-1.5 bg-background text-foreground shadow-sm ring-1 ring-inset ring-input focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                          {...field}
                        >
                          <option value="">Selecione</option>
                          {estadosBrasileiros.map((estado) => (
                            <option key={estado.sigla} value={estado.sigla}>
                              {estado.sigla} - {estado.nome}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.uf && (
                      <p className="mt-2 text-sm text-destructive">
                        {errors.uf.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
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

export default FormCliente;
