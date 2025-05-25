"use client";

import { useAuth, User } from "@/context/auth-context";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { useState, useCallback, useEffect, useMemo } from "react";
import { ShoppingCart, Package, Menu, X, Search } from "lucide-react";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import debounce from "lodash.debounce";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
  useTheme,
  Card,
  CardContent,
  Divider,
  TextField,
  Button,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  IconButton,
  InputAdornment,
  Paper,
  Grid,
} from "@mui/material";

import { ItemModal as NewItemModal } from "../vendas/ItemModal";

import {
  Receipt,
  LocalShipping,
  Restaurant,
  Storefront,
  Person,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Edit,
  Delete,
  Add,
  Remove,
} from "@mui/icons-material";
import {
  PedidoClienteDTO,
  PedidoResponse,
  CreatePedidoRequest,
  PedidoItemDTO,
  PedidoItemAdicionalDTO,
  UpdatePedidoRequest,
} from "@/rxjs/pedido/pedido.model";
import api from "@/lib/api";
import { Formik, Form, FormikProps } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import {
  createPedidoAction,
  updatePedidoAction,
} from "@/rxjs/pedido/pedido.action";
import { PaginatedResponse } from "@/rxjs/clientes/cliente.model";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RootState } from "@/rxjs/store";
import {
  clearPedidoState,
  selectPedidoState,
} from "@/rxjs/pedido/pedido.slice";
// Validation Schema
const pedidoValidationSchema = Yup.object({
  id: Yup.string().optional().nullable(),
  id_cliente: Yup.string().required("Cliente é obrigatório"),
  codigo_pedido: Yup.string().required("Código do pedido é obrigatório"),
  tipo_entrega: Yup.string()
    .oneOf(["Delivery", "Balcão", "Retirada"])
    .required("Tipo de entrega é obrigatório"),
  categoria_pagamento: Yup.string().oneOf([
    "Cartão",
    "Dinheiro",
    "Pix",
    "Prazo",
  ]),
  forma_pagamento: Yup.string(),
  observacao: Yup.string(),
  nome_taxa_entrega: Yup.string(),
  taxa_entrega: Yup.number()
    .min(0, "Taxa deve ser maior ou igual a zero")
    .default(0),
  id_status: Yup.number().default(2),
  troco_para: Yup.string(),
  itens: Yup.array().of(
    Yup.object({
      id_categoria: Yup.string().required(),
      id_categoria_opcao: Yup.string().required(),
      id_produto: Yup.string().required(),
      id_produto_2: Yup.string(),
      observacao: Yup.string(),
      valor_unitario: Yup.string().required(),
      quantidade: Yup.number().min(1).required(),
      adicionais: Yup.array().of(
        Yup.object({
          id_adicional_opcao: Yup.string().required(),
          valor: Yup.string().required(),
          quantidade: Yup.number().min(1).required(),
        })
      ),
    })
  ),
});

interface PedidoFormValues {
  id?: string;
  tenant_id: string;
  id_cliente: string;
  codigo_pedido: string;
  data_pedido: string;
  gmt: number;
  cupom?: string;
  tipo_entrega: "Delivery" | "Retirada" | "Balcão";
  prazo?: number;
  prazo_min?: number;
  prazo_max?: number;
  categoria_pagamento?: string;
  forma_pagamento?: string;
  valor_total: string;
  observacao?: string;
  taxa_entrega: string;
  nome_taxa_entrega?: string;
  id_status: number;
  lat?: string;
  lng?: string;
  troco_para?: string;
  itens: PedidoItemDTO[];
}

interface ItemModalData {
  produto: ProdutoResponse;
  item?: PedidoItemDTO;
  index?: number;
}

export function buildItemSchema(adicionais: CategoriaAdicionalResponse[]) {
  const shape: any = {
    id_categoria_opcao: Yup.string().required("Selecione o preço"),
    quantidade: Yup.number().min(1),
    observacao: Yup.string(),
  };

  adicionais.forEach((add) => {
    if (add.selecao === "U") {
      shape[`u_${add.id}`] = Yup.string()
        .oneOf(add.opcoes!.map((o) => o.id))
        .required(`Escolha uma opção em ${add.nome}`);
    }

    if (add.selecao === "Q") {
      const opShape: any = {};
      add.opcoes!.forEach((o) => (opShape[o.id] = Yup.number().min(0)));

      shape[`q_${add.id}`] = Yup.object(opShape).test(
        "min-max",
        "Fora do intervalo",
        function (value) {
          const total = Object.values(value || {}).reduce(
            (s, n: any) => s + (n as number),
            0
          );
          if (total < (add.minimo || 0))
            return this.createError({
              message: `Mínimo ${add.minimo} em ${add.nome}`,
            });
          if (add.limite && total > add.limite)
            return this.createError({
              message: `Máximo ${add.limite} em ${add.nome}`,
            });
          return true;
        }
      );
    }
  });

  return Yup.object(shape);
}

function Vendas({
  produtos,
  user,
  categorias,
  adicionais,
  pedido,
  defaultCliente,
}: {
  produtos: ProdutoResponse[];
  user: User;
  categorias: ICoreCategoria[];
  adicionais: CategoriaAdicionalResponse[];
  pedido?: PedidoResponse | null;
  defaultCliente: PedidoClienteDTO | null | undefined;
}) {
  const { tenant } = useAuth();
  const router = useRouter();
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteOptions, setClienteOptions] = useState<PedidoClienteDTO[]>(
    defaultCliente ? [defaultCliente] : pedido?.cliente ? [pedido.cliente] : []
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ItemModalData | null>(null);
  const theme = useTheme();

  const getCodigoPadrao = () => {
    return `P${new Date().getFullYear()}${new Date().getMonth()}${new Date().getDate()}-${new Date().getHours()}${new Date().getMinutes()}${new Date().getSeconds()}`;
  };

  const initialValues: PedidoFormValues = {
    id: pedido?.id || undefined,
    tenant_id: user.tenant_id || "",
    id_cliente: pedido?.id_cliente || defaultCliente?.id || "",
    codigo_pedido: pedido?.codigo_pedido || getCodigoPadrao(),
    data_pedido: pedido?.data_pedido || new Date().toISOString(),
    gmt: pedido?.gmt || -3,
    cupom: pedido?.cupom || "",
    tipo_entrega: (pedido?.tipo_entrega as any) || "Balcão",
    prazo: pedido?.prazo || undefined,
    prazo_min: pedido?.prazo_min || undefined,
    prazo_max: pedido?.prazo_max || undefined,
    categoria_pagamento: pedido?.categoria_pagamento || "",
    forma_pagamento: pedido?.forma_pagamento || "",
    valor_total: pedido?.valor_total || "0.00",
    observacao: pedido?.observacao || "",
    taxa_entrega: pedido?.taxa_entrega || "0.00",
    nome_taxa_entrega: pedido?.nome_taxa_entrega || "",
    id_status: pedido?.id_status || 2,
    lat: pedido?.lat || "-20.924730",
    lng: pedido?.lng || "-49.454230",
    troco_para: pedido?.troco_para || "0.00",
    itens:
      pedido?.itens?.map((item) => ({
        id_categoria: item.id_categoria,
        id_categoria_opcao: item.id_categoria_opcao,
        id_produto: item.id_produto,
        id_produto_2: item.id_produto_2,
        observacao: item.observacao,
        valor_unitario: item.valor_unitario,
        quantidade: item.quantidade,
        adicionais:
          item.adicionais?.map((add) => ({
            id_adicional_opcao: add.id_adicional_opcao,
            valor: add.valor,
            quantidade: add.quantidade,
          })) || [],
      })) || [],
  };

  const getClienteBySearch = useCallback(
    async (search: string): Promise<PedidoClienteDTO[]> => {
      try {
        const response = await api.get<PaginatedResponse<PedidoClienteDTO>>(
          `/clientes?nome=${search}`
        );
        return response.data.items;
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        return [];
      }
    },
    []
  );

  const getStatusColor = (tipoEntrega: string) => {
    switch (tipoEntrega) {
      case "Delivery":
        return theme.palette.primary.main;
      case "Balcão":
        return theme.palette.secondary.main;
      case "Retirada":
        return theme.palette.success.main;
      default:
        return theme.palette.text.primary;
    }
  };

  const getStatusIcon = (tipoEntrega: string) => {
    switch (tipoEntrega) {
      case "Delivery":
        return <LocalShipping sx={{ fontSize: 18 }} />;
      case "Balcão":
        return <Restaurant sx={{ fontSize: 18 }} />;
      case "Retirada":
        return <Storefront sx={{ fontSize: 18 }} />;
      default:
        return <Receipt sx={{ fontSize: 18 }} />;
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const filteredProdutos =
    produtos?.filter((produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleAddItem = (produto: ProdutoResponse) => {
    setModalData({ produto });
    setModalOpen(true);
  };

  const handleEditItem = (item: PedidoItemDTO, index: number) => {
    const produto = produtos.find((p) => p.id === item.id_produto);
    if (produto) {
      setModalData({ produto, item, index });
      setModalOpen(true);
    }
  };

  const calculateItemTotal = (values: PedidoFormValues) => {
    return (
      values.itens.reduce((total, item) => {
        // Soma total dos adicionais
        const adicionaisTotal = (item.adicionais || []).reduce(
          (addTotal, adicional) =>
            addTotal + parseFloat(adicional.valor) * adicional.quantidade,
          0
        );

        // Soma valor unitário + total adicionais e multiplica pela quantidade
        const itemTotal =
          (parseFloat(item.valor_unitario) + adicionaisTotal) * item.quantidade;

        return total + itemTotal;
      }, 0) + parseFloat(values.taxa_entrega || "0")
    );
  };

  const dispatch = useDispatch();
  const postOrPutPedidoState = useSelector(
    (state: RootState) => state.pedido.postOrPutPedidoActionState
  );
  // Limpar o store
  useEffect(() => {
    dispatch(clearPedidoState());
  }, [dispatch]);
  const clienteInicial =
    pedido?.cliente?.nome_razao_social ??
    defaultCliente?.nome_razao_social ??
    "";
  const [inputValue, setInputValue] = useState(clienteInicial);
  const fetchClientes = useMemo(
    () =>
      debounce(async (query: string) => {
        const resp = await api.get<PaginatedResponse<PedidoClienteDTO>>(
          `/clientes?nome=${query}`
        );
        setClienteOptions(resp.data.items);
      }, 300),
    []
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={pedidoValidationSchema}
      onSubmit={(values) => {
        if (values.id) {
          dispatch(
            updatePedidoAction.request({
              id: values.id,
              data: {
                ...values,
                troco_para: (values.troco_para ?? "0.00").toString(),
              } as UpdatePedidoRequest,
            })
          );
        } else {
          dispatch(createPedidoAction.request(values));
        }
      }}
      // enableReinitialize
    >
      {(formik: FormikProps<PedidoFormValues>) => {
        // Efeito para lidar com o sucesso no envio do formulário
        useEffect(() => {
          if (postOrPutPedidoState === "completed") {
            //limpar store
            dispatch(clearPedidoState());
            router.push("/gerenciar-vendas");
            toast.success("Pedido salvo com sucesso");
          } else if (postOrPutPedidoState === "error") {
            toast.error("Erro ao salvar pedido");
          }
        }, [postOrPutPedidoState, router]);
        return (
          <Form className="flex h-full">
            {/* Left Sidebar - Resumo do Pedido */}
            <aside className="hidden lg:block w-96 border-r border-border bg-card">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-xl flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    {formik.values.codigo_pedido
                      ? `Dados do Pedido`
                      : "Novo Pedido"}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {formik.values.itens.length > 0 ? (
                    <div className="space-y-6">
                      {/* Header do pedido */}
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <Typography
                            variant="h6"
                            className="font-bold text-foreground"
                          >
                            Pedido #{formik.values.codigo_pedido || "Novo"}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(formik.values.tipo_entrega)}
                            label={formik.values.tipo_entrega}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(
                                formik.values.tipo_entrega
                              ),
                              color: "white",
                              fontWeight: 500,
                            }}
                          />
                        </div>
                      </div>

                      {/* Resumo Financeiro */}
                      <Card
                        elevation={0}
                        sx={{
                          backgroundColor: "background.paper",
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <CardContent sx={{ padding: 3 }}>
                          <Typography
                            variant="h6"
                            className="font-semibold mb-3"
                          >
                            Resumo Financeiro
                          </Typography>
                          <div className="space-y-2">
                            {parseFloat(formik.values.taxa_entrega) > 0 && (
                              <div className="flex justify-between">
                                <Typography variant="body2">
                                  {formik.values.nome_taxa_entrega ||
                                    "Taxa de entrega"}
                                </Typography>
                                <Typography variant="body2">
                                  {formatCurrency(formik.values.taxa_entrega)}
                                </Typography>
                              </div>
                            )}
                            <Divider />
                            <div className="flex justify-between items-center">
                              <Typography variant="h6" className="font-bold">
                                Total
                              </Typography>
                              <Typography
                                variant="h6"
                                className="font-bold text-primary"
                              >
                                {formatCurrency(
                                  calculateItemTotal(formik.values).toString()
                                )}
                              </Typography>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Itens do Pedido */}
                      <Card
                        elevation={0}
                        sx={{
                          backgroundColor: "background.paper",
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <CardContent sx={{ padding: 3 }}>
                          <Typography
                            variant="h6"
                            className="font-semibold mb-3 flex items-center gap-2"
                          >
                            <Receipt sx={{ fontSize: 20 }} />
                            Itens do Pedido
                          </Typography>
                          <div className="space-y-4">
                            {formik.values.itens.map((item, index) => {
                              const produto = produtos.find(
                                (p) => p.id === item.id_produto
                              );
                              const categoria = categorias.find(
                                (c) => c.id === item.id_categoria
                              );

                              const valorItemComAdicional =
                                parseFloat(item.valor_unitario) +
                                (item.adicionais || []).reduce(
                                  (acc, adicional) =>
                                    acc +
                                    parseFloat(adicional.valor) *
                                      adicional.quantidade,
                                  0
                                );

                              return (
                                <div
                                  key={index}
                                  className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <Typography
                                        variant="subtitle2"
                                        className="font-medium"
                                      >
                                        {produto?.nome ||
                                          "Produto não encontrado"}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {categoria?.nome}
                                      </Typography>
                                      {item.observacao && (
                                        <Typography
                                          variant="caption"
                                          className="block text-amber-600 mt-1"
                                        >
                                          Obs: {item.observacao}
                                        </Typography>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleEditItem(item, index)
                                        }
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          const newItens = [
                                            ...formik.values.itens,
                                          ];
                                          newItens.splice(index, 1);
                                          formik.setFieldValue(
                                            "itens",
                                            newItens
                                          );
                                        }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <Typography
                                      variant="body2"
                                      className="font-medium"
                                    >
                                      {item.quantidade}x{" "}
                                      {formatCurrency(
                                        valorItemComAdicional.toString()
                                      )}
                                    </Typography>
                                  </div>

                                  {/* Adicionais */}
                                  {item.adicionais &&
                                    item.adicionais.length > 0 && (
                                      <div className="ml-4 mt-2 space-y-1">
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          className="font-medium"
                                        >
                                          Adicionais:
                                        </Typography>
                                        {item.adicionais.map(
                                          (adicional, addIndex) => {
                                            // Buscar o adicional nos dados
                                            let adicionalData = null;
                                            for (const adicionalGroup of adicionais) {
                                              const opcao =
                                                adicionalGroup.opcoes?.find(
                                                  (o) =>
                                                    o.id ===
                                                    adicional.id_adicional_opcao
                                                );
                                              if (opcao) {
                                                adicionalData = {
                                                  adicional: adicionalGroup,
                                                  opcao,
                                                };
                                                break;
                                              }
                                            }

                                            return (
                                              <div
                                                key={addIndex}
                                                className="flex justify-between items-center text-sm"
                                              >
                                                <span className="text-muted-foreground">
                                                  •{" "}
                                                  {adicionalData?.opcao.nome ||
                                                    "Adicional não encontrado"}
                                                  {` (${
                                                    adicional.quantidade ?? 0
                                                  }x)`}
                                                </span>
                                                <span className="text-muted-foreground">
                                                  {formatCurrency(
                                                    adicional.valor
                                                  )}
                                                </span>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="h-full min-h-[80vh] flex items-center justify-center">
                      <div className="text-center">
                        <Receipt
                          sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          className="mb-2"
                        >
                          Adicione produtos para começar uma venda
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Clique em um produto na barra lateral para começar uma
                          venda
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Content - Formulário */}
            <div className="flex-1 flex flex-col min-w-0">
              <main className="flex-1 overflow-auto p-6">
                <Card
                  elevation={0}
                  sx={{ border: "none", backgroundColor: "background.paper" }}
                >
                  <CardContent sx={{ padding: 3 }}>
                    <Grid container spacing={3}>
                      {/* Cliente */}
                      <Grid size={12}>
                        <Autocomplete
                          size="small"
                          options={clienteOptions}
                          value={
                            clienteOptions.find(
                              (c) => c.id === formik.values.id_cliente
                            ) ?? null
                          }
                          inputValue={inputValue}
                          getOptionKey={(option) => option.id}
                          onInputChange={(_, newInput, reason) => {
                            if (reason === "input") {
                              setInputValue(newInput);
                              if (newInput.length >= 3) fetchClientes(newInput);
                            }
                          }}
                          onChange={(_, option) => {
                            formik.setFieldValue(
                              "id_cliente",
                              option?.id ?? ""
                            );
                            setInputValue(
                              option ? option.nome_razao_social : ""
                            ); // << aqui!
                          }}
                          getOptionLabel={(opt) => opt.nome_razao_social}
                          isOptionEqualToValue={(opt, val) => opt.id === val.id}
                          loading={
                            inputValue.length >= 3 &&
                            clienteOptions.length === 0
                          }
                          onBlur={() => {
                            const selecionado = clienteOptions.find(
                              (c) => c.id === formik.values.id_cliente
                            );
                            setInputValue(
                              selecionado ? selecionado.nome_razao_social : ""
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Cliente"
                              required
                              error={
                                formik.touched.id_cliente &&
                                Boolean(formik.errors.id_cliente)
                              }
                              helperText={
                                formik.touched.id_cliente &&
                                formik.errors.id_cliente
                              }
                            />
                          )}
                        />
                      </Grid>

                      {/* Código do Pedido */}
                      <Grid size={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Código do Pedido"
                          name="codigo_pedido"
                          value={formik.values.codigo_pedido}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.codigo_pedido &&
                            Boolean(formik.errors.codigo_pedido)
                          }
                          helperText={
                            formik.touched.codigo_pedido &&
                            formik.errors.codigo_pedido
                          }
                          required
                        />
                      </Grid>

                      {/* Tipo de Entrega */}
                      <Grid size={12}>
                        <FormControl fullWidth required>
                          <InputLabel>Tipo de Entrega</InputLabel>
                          <Select
                            name="tipo_entrega"
                            value={formik.values.tipo_entrega}
                            onChange={(e) => {
                              formik.handleChange(e);
                              if (e.target.value !== "Delivery") {
                                formik.setFieldValue("taxa_entrega", "0.00");
                              }
                            }}
                            label="Tipo de Entrega"
                          >
                            <MenuItem value="Balcão">Balcão</MenuItem>
                            <MenuItem value="Delivery">Delivery</MenuItem>
                            <MenuItem value="Retirada">Retirada</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Categoria de Pagamento */}
                      <Grid size={12}>
                        <FormControl fullWidth>
                          <InputLabel>Categoria de Pagamento</InputLabel>
                          <Select
                            name="categoria_pagamento"
                            value={formik.values.categoria_pagamento}
                            onChange={(e) => {
                              formik.handleChange(e);
                              if (e.target.value !== "Dinheiro") {
                                formik.setFieldValue("troco_para", "0.00");
                              }
                            }}
                            label="Categoria de Pagamento"
                          >
                            <MenuItem value="Cartão">Cartão</MenuItem>
                            <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                            <MenuItem value="Pix">Pix</MenuItem>
                            <MenuItem value="Prazo">Prazo</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Forma de Pagamento */}
                      <Grid size={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Forma de Pagamento"
                          name="forma_pagamento"
                          value={formik.values.forma_pagamento}
                          onChange={formik.handleChange}
                        />
                      </Grid>

                      {/* Nome da Taxa de Entrega, Troco Para e Valor do Troco */}
                      <Grid size={12}>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Taxa de Entrega"
                            name="taxa_entrega"
                            type="number"
                            value={formik.values.taxa_entrega}
                            onChange={formik.handleChange}
                            error={
                              formik.touched.taxa_entrega &&
                              Boolean(formik.errors.taxa_entrega)
                            }
                            helperText={
                              formik.touched.taxa_entrega &&
                              formik.errors.taxa_entrega
                            }
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  R$
                                </InputAdornment>
                              ),
                            }}
                            disabled={formik.values.tipo_entrega !== "Delivery"}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            label="Troco Para"
                            name="troco_para"
                            type="number"
                            disabled={
                              formik.values.categoria_pagamento !== "Dinheiro"
                            }
                            value={formik.values.troco_para}
                            onChange={formik.handleChange}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  R$
                                </InputAdornment>
                              ),
                            }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            label="Valor do Troco"
                            disabled
                            value={
                              formik.values.categoria_pagamento === "Dinheiro"
                                ? (
                                    parseFloat(
                                      formik.values.troco_para || "0"
                                    ) - calculateItemTotal(formik.values)
                                  ).toFixed(2)
                                : "0.00"
                            }
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  R$
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                      </Grid>

                      {/* Taxa de Entrega */}
                      <Grid size={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Nome da Taxa de Entrega"
                          name="nome_taxa_entrega"
                          value={formik.values.nome_taxa_entrega}
                          onChange={formik.handleChange}
                        />
                      </Grid>

                      {/* Observação */}
                      <Grid size={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Observação"
                          name="observacao"
                          multiline
                          rows={3}
                          value={formik.values.observacao}
                          onChange={formik.handleChange}
                        />
                      </Grid>
                    </Grid>

                    {/* Submit Button */}
                    <Box
                      sx={{
                        mt: 4,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2,
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => router.push("/gerenciar-vendas")}
                      >
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={
                          !formik.isValid || formik.values.itens.length === 0
                        }
                      >
                        {pedido ? "Atualizar Pedido" : "Criar Pedido"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </main>
            </div>

            {/* Right Sidebar - Produtos */}
            <aside className="hidden lg:block w-96 border-l border-border bg-card">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-xl flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {produtos && produtos.length > 0 ? (
                    filteredProdutos.length > 0 ? (
                      <List sx={{ padding: 0 }}>
                        {filteredProdutos.map((produto) => (
                          <ListItem key={produto.id} disablePadding>
                            <ListItemButton
                              onClick={() => handleAddItem(produto)}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                                padding: "12px 16px",
                              }}
                            >
                              <ListItemText
                                primary={produto.nome}
                                secondary={produto.descricao}
                                primaryTypographyProps={{
                                  fontSize: "14px",
                                  fontWeight: 400,
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "200px",
                          padding: "40px 0",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          textAlign="center"
                        >
                          Nenhum produto encontrado
                        </Typography>
                      </Box>
                    )
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "200px",
                        padding: "40px 0",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                      >
                        Nenhum produto encontrado
                      </Typography>
                    </Box>
                  )}
                </div>

                <div className="p-3 border-t border-border">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full py-2 pl-8 pr-3 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </aside>

            {/* Modal para Adicionar/Editar Item */}
            <NewItemModal
              open={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setModalData(null);
              }}
              modalData={modalData}
              adicionais={adicionais}
              onSave={(item) => {
                if (modalData?.index !== undefined) {
                  // Editar item existente
                  const newItens = [...formik.values.itens];
                  newItens[modalData.index] = item;
                  formik.setFieldValue("itens", newItens);
                } else {
                  // Adicionar novo item
                  formik.setFieldValue("itens", [...formik.values.itens, item]);
                }
                setModalOpen(false);
                setModalData(null);
              }}
            />
          </Form>
        );
      }}
    </Formik>
  );
}

// Modal Component for Adding/Editing Items
interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  modalData: ItemModalData | null;
  adicionais: CategoriaAdicionalResponse[];
  onSave: (item: PedidoItemDTO) => void;
}

function ItemModal({
  open,
  onClose,
  modalData,
  adicionais,
  onSave,
}: ItemModalProps) {
  const [selectedPreco, setSelectedPreco] = useState<string>("");
  const [selectedAdicionais, setSelectedAdicionais] = useState<{
    [key: string]: any;
  }>({});
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>("");

  // Reset modal state when opening
  useEffect(() => {
    if (open && modalData) {
      if (modalData.item) {
        // Editing existing item
        setSelectedPreco(modalData.item.id_categoria_opcao || "");
        setQuantidade(modalData.item.quantidade);
        setObservacao(modalData.item.observacao || "");
        // Set adicionais state based on existing item
        const addState: { [key: string]: any } = {};
        modalData.item?.adicionais?.forEach((add) => {
          addState[add.id_adicional_opcao] = add.quantidade;

          // preciso descobrir a qual adicional essa opção pertence
          const grupo = adicionais.find((a) =>
            a.opcoes?.some((o) => o.id === add.id_adicional_opcao)
          );
          if (grupo?.selecao === "U") {
            addState[`group_${grupo.id}`] = add.id_adicional_opcao; //  ⭐ novo
          }
        });
        setSelectedAdicionais(addState);
      } else {
        // Adding new item
        setSelectedPreco("");
        setSelectedAdicionais({});
        setQuantidade(1);
        setObservacao("");
      }
    }
  }, [open, modalData]);

  const handleSave = () => {
    if (!modalData?.produto || !selectedPreco) return;

    const selectedPrecoData = modalData.produto.precos?.find(
      (p) => p.id_categoria_opcao === selectedPreco
    );
    if (!selectedPrecoData) return;

    const adicionaisArray: PedidoItemAdicionalDTO[] = [];
    Object.entries(selectedAdicionais).forEach(([opcaoId, qtd]) => {
      if (qtd > 0) {
        // Find the adicional option to get its value
        for (const adicional of adicionais) {
          const opcao = adicional.opcoes?.find((o) => o.id === opcaoId);
          if (opcao) {
            adicionaisArray.push({
              id_adicional_opcao: opcaoId,
              valor: opcao.valor,
              quantidade: typeof qtd === "number" ? qtd : 1,
            });
            break;
          }
        }
      }
    });

    if (!selectedPreco) {
      toast.error("Selecione uma opção de preço");
      return;
    }

    const item: PedidoItemDTO = {
      id_categoria: modalData.produto.id_categoria,
      id_categoria_opcao: selectedPreco,
      id_produto: modalData.produto.id,
      observacao: observacao || undefined,
      valor_unitario: selectedPrecoData.preco_base,
      quantidade: quantidade,
      adicionais: adicionaisArray,
    };

    onSave(item);
  };

  const calculateModalTotal = () => {
    if (!modalData?.produto || !selectedPreco) return 0;

    const selectedPrecoData = modalData.produto.precos?.find(
      (p) => p.id_categoria_opcao === selectedPreco
    );
    if (!selectedPrecoData) return 0;

    let total = parseFloat(selectedPrecoData.preco_base);

    // Add adicionais values
    Object.entries(selectedAdicionais).forEach(([opcaoId, qtd]) => {
      if (qtd > 0) {
        for (const adicional of adicionais) {
          const opcao = adicional.opcoes?.find((o) => o.id === opcaoId);
          if (opcao) {
            total +=
              parseFloat(opcao.valor) * (typeof qtd === "number" ? qtd : 1);
            break;
          }
        }
      }
    });

    return total * quantidade;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const renderAdicionalControl = (adicional: CategoriaAdicionalResponse) => {
    if (!adicional.opcoes || adicional.opcoes.length === 0) return null;

    const isRequired = adicional.minimo && adicional.minimo > 0;

    switch (adicional.selecao) {
      case "U": // Único (Radio)
        return (
          <div key={adicional.id} className="mb-6">
            <Typography variant="h6" className="mb-2">
              {adicional.nome}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Typography>
            <RadioGroup
              value={selectedAdicionais[`group_${adicional.id}`] || ""}
              onChange={(e) => {
                const newState = { ...selectedAdicionais };
                // Clear previous selections for this group
                adicional.opcoes?.forEach((opcao) => {
                  delete newState[opcao.id];
                });
                // Set new selection
                if (e.target.value) {
                  newState[e.target.value] = 1;
                  newState[`group_${adicional.id}`] = e.target.value;
                }
                setSelectedAdicionais(newState);
              }}
            >
              {adicional.opcoes.map((opcao) => (
                <FormControlLabel
                  key={opcao.id}
                  value={opcao.id}
                  control={<Radio />}
                  label={
                    <div className="flex justify-between items-center w-full">
                      <span>{opcao.nome}</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(parseFloat(opcao.valor))}
                      </span>
                    </div>
                  }
                />
              ))}
            </RadioGroup>
          </div>
        );

      case "M": // Múltiplo (Checkbox)
        const hasLimit = adicional.limite && adicional.limite > 0;
        const selectedCount = adicional.opcoes.filter(
          (opcao) => selectedAdicionais[opcao.id] > 0
        ).length;

        return (
          <div key={adicional.id} className="mb-6">
            <Typography variant="h6" className="mb-2">
              {adicional.nome}
              {isRequired ? (
                <span className="text-red-500 ml-1">
                  * (MIN {adicional.minimo})
                </span>
              ) : (
                <span className="text-gray-500 ml-1">
                  Opcional{hasLimit && ` (MÁX ${adicional.limite})`}
                </span>
              )}
            </Typography>
            <FormGroup>
              {adicional.opcoes.map((opcao) => {
                const isChecked = selectedAdicionais[opcao.id] > 0;
                const canSelect =
                  !hasLimit || selectedCount < adicional.limite! || isChecked;

                return (
                  <FormControlLabel
                    key={opcao.id}
                    control={
                      <Checkbox
                        checked={isChecked}
                        disabled={!canSelect}
                        onChange={(e) => {
                          const newState = { ...selectedAdicionais };
                          newState[opcao.id] = e.target.checked ? 1 : 0;
                          setSelectedAdicionais(newState);
                        }}
                      />
                    }
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>{opcao.nome}</span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(parseFloat(opcao.valor))}
                        </span>
                      </div>
                    }
                  />
                );
              })}
            </FormGroup>
          </div>
        );

      case "Q": // Quantidade (Number Input)
        return (
          <div key={adicional.id} className="mb-6">
            <Typography variant="h6" className="mb-2">
              {adicional.nome}
              {isRequired ? (
                <span className="text-red-500 ml-1">
                  * (MIN {adicional.minimo} - MÁX {adicional.limite})
                </span>
              ) : (
                <span className="text-gray-500 ml-1">
                  Opcional (MÁX {adicional.limite})
                </span>
              )}
            </Typography>
            <div className="space-y-3">
              {adicional.opcoes.map((opcao) => {
                const currentValue = selectedAdicionais[opcao.id] || 0;
                const maxValue = adicional.limite || 99;
                const minValue = isRequired ? adicional.minimo || 0 : 0;

                return (
                  <div
                    key={opcao.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Typography variant="body1">{opcao.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(parseFloat(opcao.valor))}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newValue = Math.max(0, currentValue - 1);
                          const newState = { ...selectedAdicionais };
                          newState[opcao.id] = newValue;
                          setSelectedAdicionais(newState);
                        }}
                        disabled={currentValue <= 0}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <TextField
                        size="small"
                        type="number"
                        value={currentValue}
                        onChange={(e) => {
                          const value = Math.max(
                            0,
                            Math.min(maxValue, parseInt(e.target.value) || 0)
                          );
                          const newState = { ...selectedAdicionais };
                          newState[opcao.id] = value;
                          setSelectedAdicionais(newState);
                        }}
                        inputProps={{
                          min: 0,
                          max: maxValue,
                          style: { textAlign: "center", width: "60px" },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newValue = Math.min(maxValue, currentValue + 1);
                          const newState = { ...selectedAdicionais };
                          newState[opcao.id] = newValue;
                          setSelectedAdicionais(newState);
                        }}
                        disabled={currentValue >= maxValue}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!modalData) return null;

  // Filter adicionais for the current product's category
  const relevantAdicionais = adicionais.filter(
    (adicional) => adicional.id_categoria === modalData.produto.id_categoria
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex justify-between items-center">
          <Typography variant="h6">
            {modalData.item ? "Editar Item" : "Adicionar Item"}
          </Typography>
          <IconButton onClick={onClose}>
            <X />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Typography variant="h6" className="mb-2">
              {modalData.produto.nome}
            </Typography>
            {modalData.produto.descricao && (
              <Typography variant="body2" color="text.secondary">
                {modalData.produto.descricao}
              </Typography>
            )}
          </div>

          {/* Price Selection */}
          {modalData.produto.precos && modalData.produto.precos.length > 0 && (
            <div>
              <Typography variant="h6" className="mb-3">
                Seleciona uma opção
                <span className="text-red-500 ml-1">*</span>
              </Typography>
              <RadioGroup
                value={selectedPreco}
                onChange={(e) => setSelectedPreco(e.target.value)}
              >
                {modalData.produto.precos.map((preco) => (
                  <FormControlLabel
                    key={preco.id_categoria_opcao}
                    value={preco.id_categoria_opcao}
                    control={<Radio />}
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>
                          {preco.nome_opcao || `Opção ${preco.seq_id}`}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(parseFloat(preco.preco_base))}
                        </span>
                      </div>
                    }
                  />
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Adicionais */}
          {relevantAdicionais.map((adicional) =>
            renderAdicionalControl(adicional)
          )}

          {/* Observação */}
          <div>
            <Typography variant="h6" className="mb-2">
              Alguma observação?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Qual a sua observação?"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              inputProps={{ maxLength: 1000 }}
            />
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
            disabled={quantidade <= 1}
          >
            <Remove />
          </IconButton>
          <TextField
            size="small"
            type="number"
            value={quantidade}
            onChange={(e) =>
              setQuantidade(Math.max(1, parseInt(e.target.value) || 1))
            }
            inputProps={{
              min: 1,
              max: 100,
              style: { textAlign: "center", width: "60px" },
            }}
          />
          <IconButton
            onClick={() => setQuantidade(Math.min(100, quantidade + 1))}
            disabled={quantidade >= 100}
          >
            <Add />
          </IconButton>
        </div>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedPreco}
          size="large"
        >
          {modalData.item ? "Atualizar" : "Adicionar ao carrinho"}{" "}
          {formatCurrency(calculateModalTotal())}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Vendas;
