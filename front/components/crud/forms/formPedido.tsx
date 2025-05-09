"use client";
import { Pedido } from "@/rxjs/pedidos/pedido.model";
import { useAuth, User } from "@/context/auth-context";
import { Produto } from "@/dto/Produto";
import api from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/rxjs/hooks";
import { InputPedido } from "@/rxjs/pedidos/pedido.model";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ClienteResponse as ClienteDto } from "@/dto/cliente";
import {
  resetAllStates,
  selectPostOrPutActionState,
} from "@/rxjs/pedidos/pedido.slice";
import { ArrowBack, Error } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import * as Yup from "yup";
import { postOrPutPedidoAction } from "@/rxjs/pedidos/pedido.actions";
import { Field, Form, Formik } from "formik";
import {
  Cliente,
  Deposito,
  Representada,
  Vendedor,
} from "@/rxjs/pedidos/pedido.model.get";
import PedidoItems from "@/components/my/PedidoItems";
import SeparatorForm from "@/components/my/SeperatorForm";
import { formatCurrency } from "@/lib/currecyUtils";
import ClienteForm from "./ClienteForm";

// Importar o componente de itens do pedido

const isValidDecimal = (value: any) => {
  if (!value) return true;
  return /^-?\d+(\.\d+)?$/.test(String(value));
};

const pedidoItemSchema = Yup.object().shape({
  id: Yup.string().uuid().nullable(),
  produto_id: Yup.string().uuid().required("Produto é obrigatório"),
  quantity: Yup.string()
    .required("Quantidade é obrigatória")
    .test(
      "is-decimal",
      "Quantidade deve ser um número decimal válido",
      isValidDecimal
    )
    .test("is-positive", "Quantidade deve ser maior que zero", (value) =>
      value ? parseFloat(value) > 0 : false
    ),
  unit_price: Yup.string()
    .required("Preço unitário é obrigatório")
    .test(
      "is-decimal",
      "Preço unitário deve ser um número decimal válido",
      isValidDecimal
    ),
  discount: Yup.string()
    .required("Desconto é obrigatório")
    .test(
      "is-decimal",
      "Desconto deve ser um número decimal válido",
      isValidDecimal
    )
    .default("0"),
  total_price: Yup.string()
    .required("Preço total é obrigatório")
    .test(
      "is-decimal",
      "Preço total deve ser um número decimal válido",
      isValidDecimal
    ),
  quantity_box: Yup.mixed()
    .nullable()
    .test(
      "is-valid-decimal",
      "Quantidade por caixa deve ser um número decimal válido",
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        isValidDecimal(value)
    ),
  unit_price_dif: Yup.mixed()
    .nullable()
    .test(
      "is-valid-decimal",
      "Preço unitário diferenciado deve ser um número decimal válido",
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        isValidDecimal(value)
    ),
  discount_dif: Yup.mixed()
    .nullable()
    .test(
      "is-valid-decimal",
      "Desconto diferenciado deve ser um número decimal válido",
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        isValidDecimal(value)
    ),
  total_price_dif: Yup.mixed()
    .nullable()
    .test(
      "is-valid-decimal",
      "Preço total diferenciado deve ser um número decimal válido",
      (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        isValidDecimal(value)
    ),
  faturado: Yup.boolean()
    .required("Status de faturamento é obrigatório")
    .default(true),
});

function FormPedido({
  data,
  user,
  allDepositos,
  allClientes,
  allRepresentadas,
  allProdutos,
  allVendedores,
}: {
  data: Pedido | undefined;
  user: User;
  allDepositos: Deposito[];
  allClientes: Cliente[];
  allRepresentadas: Representada[];
  allProdutos: Produto[];
  allVendedores: Vendedor[];
}) {
  const [produtos, setProdutos] = useState<Produto[]>(allProdutos || []);
  console.log(produtos);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useRouter();
  const dispatch = useAppDispatch();
  const saveState = useAppSelector(selectPostOrPutActionState);
  const { id } = useParams<{ id?: string }>();
  const [dialogo, setDialogo] = useState<
    | { tipo: "cliente"; data: Cliente }
    | { tipo: "representada"; data: Representada }
    | null
  >(null);
  const [clientes, setClientes] = useState<Cliente[]>(allClientes);
  const [representadas, setRepresentadas] =
    useState<Representada[]>(allRepresentadas);
  const [vendedores, setVendedores] = useState<Vendedor[]>(allVendedores);

  let initialValues: InputPedido = {
    id: data?.id ?? "",
    cliente_id: data?.cliente_id ?? "",
    representada_id: data?.representada_id ?? "",
    vendedor_id: data?.vendedor_id ?? "",
    deposito_id: data?.deposito_id ?? "",
    price_list: data?.price_list ?? 1,
    observacao: data?.observacao ?? null,
    status: data?.status ?? "draft",
    codigo_manual: data?.codigo_manual ?? null,
    items: data?.items ?? [],
  };

  useEffect(() => {
    dispatch(resetAllStates());
  }, []);

  useEffect(() => {
    if (saveState === "completed") {
      setSaved(true);
      toast.success("Pedido salvo com sucesso!");
      navigate.push("/movimento/pedido");
    } else if (saveState === "error") {
      toast.error("Erro ao salvar pedido");
    }
  }, [saveState, navigate]);

  const isLoading = saveState === "pending";
  const isError = saveState === "error";

  // Função para obter o cliente pelo ID
  const getClienteById = (clienteId: string) => {
    return clientes.find((cliente) => cliente.id === clienteId) || null;
  };

  // Função para obter a representada pelo ID
  const getRepresentadaById = (representadaId: string) => {
    return (
      representadas.find(
        (representada) => representada.id === representadaId
      ) || null
    );
  };

  // Função para obter o depósito pelo ID
  const getDepositoById = (depositoId: string) => {
    return allDepositos.find((deposito) => deposito.id === depositoId) || null;
  };

  // Função para obter o vendedor pelo ID
  const getVendedorById = (vendedorId: string) => {
    return vendedores.find((vendedor) => vendedor.id === vendedorId) || null;
  };

  // Main pedido schema
  const pedidoSchema = Yup.object().shape({
    id: Yup.string().uuid().nullable(),
    representada_id: Yup.string().uuid().required("Representada é obrigatória"),
    vendedor_id: Yup.string().uuid().required("Vendedor é obrigatório"),
    cliente_id: Yup.string().uuid().required("Cliente é obrigatório"),
    deposito_id: Yup.string().uuid().required("Depósito é obrigatório"),
    price_list: Yup.number()
      .required("Lista de preço é obrigatória")
      .integer("Lista de preço deve ser um número inteiro")
      .min(1, "Lista de preço deve ser entre 1 e 24")
      .max(24, "Lista de preço deve ser entre 1 e 24"),
    observacao: Yup.string().nullable(),
    status: Yup.string().nullable().default("draft"),
    codigo_manual: Yup.string()
      .nullable()
      .max(255, "Código manual deve ter no máximo 255 caracteres"),
    items: Yup.array()
      .of(pedidoItemSchema)
      .min(1, "Adicione pelo menos um item ao pedido")
      .required("Itens são obrigatórios"),
  });

  return (
    <Box className="p-6">
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/movimento/pedido">Pedidos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {id ? (
                <div>
                  Editar Pedido{" "}
                  <span className="text-gray-500 dark:text-gray-400">
                    #{id}
                  </span>
                </div>
              ) : (
                "Novo Pedido"
              )}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Paper className="p-6 shadow-lg">
        <Box className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <Typography variant="h5">
            {id ? (
              <div>
                Editar Pedido •{" "}
                <span className="text-primary dark:text-primary font-bold">
                  {data?.codigo_manual ?? "N/A"}
                </span>
              </div>
            ) : (
              "Novo Pedido"
            )}
          </Typography>
          <Box className="flex items-center gap-4">
            {isError && (
              <Typography
                variant="subtitle1"
                className="text-red-600 font-medium flex items-center gap-2"
              >
                <Error />
                Erro ao salvar pedido
              </Typography>
            )}

            {isLoading && (
              <Typography
                variant="subtitle1"
                className="text-primary font-medium flex items-center gap-2"
              >
                <CircularProgress size={20} color="inherit" />
                Salvando...
              </Typography>
            )}

            <Button
              variant="outlined"
              onClick={() => navigate.push("/movimento/pedido")}
              className="hover:bg-gray-100 transition-colors min-w-[100px]"
              disabled={isLoading}
              startIcon={<ArrowBack />}
            >
              Voltar
            </Button>
          </Box>
        </Box>

        <SeparatorForm title="Dados do Pedido" />

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={pedidoSchema}
          onSubmit={(values: InputPedido) => {
            dispatch(postOrPutPedidoAction.request(values));
          }}
        >
          {({
            errors,
            touched,
            values,
            handleChange,
            handleBlur,
            setFieldValue,
          }) => {
            // Encontrar os objetos selecionados com base nos IDs atuais
            const selectedCliente = getClienteById(values.cliente_id);
            const selectedRepresentada = getRepresentadaById(
              values.representada_id
            );
            const selectedDeposito = getDepositoById(values.deposito_id);
            const selectedVendedor = getVendedorById(values.vendedor_id);

            return (
              <>
                <Form>
                  <div className="space-y-4">
                    {id && <Field type="hidden" name="id" value={values.id} />}

                    <Grid container spacing={3}>
                      {/* Autocomplete para Representada */}
                      <Grid size={6}>
                        <Autocomplete
                          size="small"
                          id="representada-autocomplete"
                          options={allRepresentadas}
                          getOptionLabel={(option) =>
                            `${option.codigo} - ${option.nome}`
                          }
                          value={selectedRepresentada}
                          onChange={(event, newValue) => {
                            setFieldValue(
                              "representada_id",
                              newValue?.id || ""
                            );
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              name="representada_id"
                              label="Representada"
                              variant="outlined"
                              fullWidth
                              error={
                                touched.representada_id &&
                                Boolean(errors.representada_id)
                              }
                              helperText={
                                touched.representada_id &&
                                errors.representada_id
                              }
                              required
                            />
                          )}
                        />
                      </Grid>

                      {/* Autocomplete para Cliente */}
                      <Grid size={6}>
                        <Autocomplete
                          size="small"
                          id="cliente-autocomplete"
                          options={allClientes}
                          getOptionLabel={(option) =>
                            `${option.codigo} - ${option.nome}`
                          }
                          value={selectedCliente}
                          onChange={(event, newValue) => {
                            setFieldValue("cliente_id", newValue?.id || "");
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              name="cliente_id"
                              label="Cliente"
                              variant="outlined"
                              fullWidth
                              error={
                                touched.cliente_id && Boolean(errors.cliente_id)
                              }
                              helperText={
                                touched.cliente_id && errors.cliente_id
                              }
                              required
                            />
                          )}
                        />
                      </Grid>

                      {/* Autocomplete para Depósito */}
                      <Grid size={4}>
                        <Autocomplete
                          id="deposito-autocomplete"
                          size="small"
                          options={allDepositos}
                          getOptionLabel={(option) => option.nome}
                          value={selectedDeposito}
                          onChange={(event, newValue) => {
                            setFieldValue("deposito_id", newValue?.id || "");
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              name="deposito_id"
                              label="Depósito"
                              variant="outlined"
                              fullWidth
                              error={
                                touched.deposito_id &&
                                Boolean(errors.deposito_id)
                              }
                              helperText={
                                touched.deposito_id && errors.deposito_id
                              }
                              required
                            />
                          )}
                        />
                      </Grid>
                      {/* Autocomplete para Vendedor */}
                      <Grid size={4}>
                        <Autocomplete
                          id="vendedor-autocomplete"
                          size="small"
                          options={allVendedores}
                          getOptionLabel={(option) => option.nome}
                          value={selectedVendedor}
                          onChange={(event, newValue) => {
                            setFieldValue("vendedor_id", newValue?.id || "");
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              name="vendedor_id"
                              label="Vendedor"
                              variant="outlined"
                              fullWidth
                              error={
                                touched.vendedor_id &&
                                Boolean(errors.vendedor_id)
                              }
                              helperText={
                                touched.vendedor_id && errors.vendedor_id
                              }
                              required
                            />
                          )}
                        />
                      </Grid>

                      {/* Campo para Lista de Preço */}
                      <Grid size={2}>
                        <TextField
                          name="price_list"
                          size="small"
                          label="Tabela de Preço"
                          type="number"
                          variant="outlined"
                          fullWidth
                          value={values.price_list}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.price_list && Boolean(errors.price_list)
                          }
                          helperText={touched.price_list && errors.price_list}
                          InputProps={{
                            inputProps: { min: 1, max: 24 },
                          }}
                          required
                        />
                      </Grid>

                      {/* Campo para Código Manual */}
                      <Grid size={2}>
                        <TextField
                          name="codigo_manual"
                          label="Código Manual"
                          size="small"
                          variant="outlined"
                          fullWidth
                          value={values.codigo_manual || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.codigo_manual &&
                            Boolean(errors.codigo_manual)
                          }
                          helperText={
                            touched.codigo_manual && errors.codigo_manual
                          }
                        />
                      </Grid>

                      {/* Campo para Observação */}
                      <Grid size={12}>
                        <TextField
                          name="observacao"
                          label="Observação"
                          variant="outlined"
                          size="small"
                          fullWidth
                          multiline
                          rows={4}
                          value={values.observacao || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={
                            touched.observacao && Boolean(errors.observacao)
                          }
                          helperText={touched.observacao && errors.observacao}
                        />
                      </Grid>
                    </Grid>

                    {/* Componente de Itens do Pedido */}
                    <PedidoItems produtos={produtos} />

                    {Object.keys(errors).length > 0 && (
                      <Box sx={{ my: 3 }}>
                        <Paper
                          elevation={3}
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                          }}
                        >
                          <Error color="error" />
                          <Box>
                            <Typography variant="h6" color="error" gutterBottom>
                              Erros no formulário
                            </Typography>
                            <Box component="ul" sx={{ pl: 2 }}>
                              {Object.entries(errors).map(([field, error]) => (
                                <Typography
                                  key={field}
                                  component="li"
                                  color="error"
                                  sx={{ mb: 0.5 }}
                                >
                                  <Box component="strong" sx={{ mr: 1 }}>
                                    {field}:
                                  </Box>
                                  {String(error)}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        </Paper>
                      </Box>
                    )}
                  </div>

                  <SeparatorForm title="Resumo do Pedido" />

                  <div className="mt-8">
                    <h2 className="sr-only">Resumo do Pedido</h2>

                    <div className="rounded-lg bg-primary/10 px-6 py-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-0 lg:py-8 border border-gray-200 dark:border-zinc-700">
                      <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2 md:gap-x-8 lg:col-span-5 lg:pl-8">
                        <div>
                          <dt className="font-medium text-gray-900 dark:text-gray-100">
                            Informações do Cliente
                          </dt>
                          <dd className="mt-3 text-gray-500 dark:text-gray-400">
                            {selectedCliente ? (
                              <>
                                <span className="block">
                                  Nome: {selectedCliente.nome}
                                </span>
                                <span className="block">
                                  CNPJ: {selectedCliente.cnpj}
                                </span>
                                <span className="block">
                                  Código: {selectedCliente.codigo}
                                </span>
                                <span className="block">
                                  Endereço:{" "}
                                  {`${
                                    selectedCliente.endereco ||
                                    "Endereço não informado"
                                  }, ${selectedCliente.numero || "S/N"} - ${
                                    selectedCliente.bairro ||
                                    "Bairro não informado"
                                  }`}
                                </span>
                                <span className="block">
                                  CEP: {selectedCliente.cep}
                                </span>
                                <span className="block">
                                  Telefone: {selectedCliente.fone}
                                </span>
                                <span className="block">
                                  Email: {selectedCliente.email}
                                </span>
                                <div className="mt-2">
                                  <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => {
                                      setDialogo({
                                        tipo: "cliente",
                                        data: selectedCliente,
                                      });
                                      console.log(
                                        "selectedCliente",
                                        selectedCliente
                                      );
                                    }}
                                  >
                                    Alterar Cliente
                                  </Button>
                                </div>
                              </>
                            ) : (
                              "Cliente não selecionado"
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-900 dark:text-gray-100">
                            Informações da Representada
                          </dt>
                          <dd className="mt-3 text-gray-500 dark:text-gray-400">
                            {selectedRepresentada ? (
                              <>
                                <span className="block">
                                  Nome: {selectedRepresentada.nome}
                                </span>
                                <span className="block">
                                  CNPJ: {selectedRepresentada.cnpj}
                                </span>
                                <span className="block">
                                  Código: {selectedRepresentada.codigo}
                                </span>
                                <span className="block">
                                  Endereço:{" "}
                                  {`${
                                    selectedRepresentada.endereco ||
                                    "Endereço não informado"
                                  }, ${
                                    selectedRepresentada.numero || "S/N"
                                  } - ${
                                    selectedRepresentada.bairro ||
                                    "Bairro não informado"
                                  }`}
                                </span>
                                <span className="block">
                                  CEP: {selectedRepresentada.cep}
                                </span>
                                <span className="block">
                                  Telefone: {selectedRepresentada.fone}
                                </span>
                                <span className="block">
                                  Email: {selectedRepresentada.email}
                                </span>
                              </>
                            ) : (
                              "Representada não selecionada"
                            )}
                          </dd>
                        </div>
                      </dl>

                      <dl className="mt-8 divide-y divide-zinc-300 dark:divide-zinc-700 text-sm lg:col-span-7 lg:mt-0 lg:pr-8">
                        {/* ---------------------- NORMAL -------------------------------- */}
                        <div className="flex items-center justify-between pb-4">
                          <dt className="text-gray-600 dark:text-gray-400">
                            Subtotal
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              values.items
                                .filter((i) => i.faturado ?? false)
                                .reduce(
                                  (s, i) =>
                                    s +
                                    parseFloat(i.unit_price) *
                                      parseFloat(i.quantity),
                                  0
                                )
                            )}
                          </dd>
                        </div>

                        <div className="flex items-center justify-between py-4">
                          <dt className="text-gray-600 dark:text-gray-400">
                            Desconto&nbsp;Total
                          </dt>
                          <dd className="font-medium text-red-600 dark:text-red-400">
                            -
                            {formatCurrency(
                              values.items
                                .filter((i) => i.faturado ?? false)
                                .reduce((s, i) => {
                                  const sub =
                                    parseFloat(i.unit_price) *
                                    parseFloat(i.quantity);
                                  return (
                                    s + sub * (parseFloat(i.discount) / 100)
                                  );
                                }, 0)
                            )}
                          </dd>
                        </div>

                        <div className="flex items-center justify-between pt-4 pb-6">
                          <dt className="font-medium text-gray-900 dark:text-gray-100">
                            Total&nbsp;Pedido
                          </dt>
                          <dd className="font-medium text-primary">
                            {formatCurrency(
                              values.items
                                .filter((i) => i.faturado ?? false)
                                .reduce(
                                  (s, i) => s + parseFloat(i.total_price),
                                  0
                                )
                            )}
                          </dd>
                        </div>

                        {/* ---------------- DIFERENCIADO ------------------------------- */}
                        <div className="flex items-center justify-between pt-6 pb-4">
                          <dt className="text-gray-600 dark:text-gray-400">
                            Subtotal&nbsp;Dif.
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(
                              values.items
                                .filter((i) => i.faturado ?? false)
                                .reduce(
                                  (s, i) =>
                                    s +
                                    parseFloat(
                                      i.unit_price_dif?.toString() ?? "0"
                                    ) *
                                      parseFloat(i.quantity),
                                  0
                                )
                            )}
                          </dd>
                        </div>

                        <div className="flex items-center justify-between py-4">
                          <dt className="text-gray-600 dark:text-gray-400">
                            Desconto&nbsp;Dif.
                          </dt>
                          <dd className="font-medium text-red-600 dark:text-red-400">
                            -
                            {formatCurrency(
                              values.items
                                .filter((i) => i.faturado ?? false)
                                .reduce((s, i) => {
                                  const sub =
                                    parseFloat(
                                      i.unit_price_dif?.toString() ?? "0"
                                    ) * parseFloat(i.quantity);
                                  return (
                                    s +
                                    sub *
                                      (parseFloat(
                                        i.discount_dif?.toString() ?? "0"
                                      ) /
                                        100)
                                  );
                                }, 0)
                            )}
                          </dd>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <dt className="font-medium text-gray-900 dark:text-gray-100">
                            Total&nbsp;Dif. do Pedido
                          </dt>
                          <dd className="font-medium text-primary">
                            {formatCurrency(
                              values.items
                                .filter((i) => i.faturado ?? false)
                                .reduce(
                                  (s, i) =>
                                    s +
                                    parseFloat(
                                      i.total_price_dif?.toString() ?? "0"
                                    ),
                                  0
                                )
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <Box className="flex justify-end gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => navigate.push("/movimento/pedido")}
                      startIcon={<ArrowBack />}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <CircularProgress
                            size={20}
                            color="inherit"
                            className="mr-2"
                          />
                          {id ? "Atualizando..." : "Salvando..."}
                        </>
                      ) : id ? (
                        "Atualizar"
                      ) : (
                        "Salvar"
                      )}
                    </Button>
                  </Box>
                </Form>
                <Dialog
                  open={!!dialogo}
                  onClose={() => setDialogo(null)}
                  fullWidth
                  maxWidth="md"
                >
                  {dialogo?.tipo === "cliente" && (
                    <ClienteForm
                      initial={dialogo.data as ClienteDto}
                      onCancel={() => setDialogo(null)}
                      onSaved={(novo) => {
                        // 1. fecha o diálogo
                        console.log("novo", novo);
                        setDialogo(null);
                        // 2. atualiza arrays locais (para autocomplete + resumo)
                        setClientes((antigos) =>
                          antigos.map((c) => (c.id === novo.id ? novo : c))
                        );
                        // 3. põe o id no Formik (caso usuário tenha trocado cliente)
                        setFieldValue("cliente_id", novo.id);
                      }}
                    />
                  )}
                </Dialog>
              </>
            );
          }}
        </Formik>
      </Paper>
    </Box>
  );
}

export default FormPedido;
