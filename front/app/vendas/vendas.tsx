"use client";
import { Print } from "@mui/icons-material";
import { useAuth, User, Tenant } from "@/context/auth-context";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import DialogCliente from "@/components/dialogs/DialogCliente";
import ClienteSearchDialog from "@/components/dialogs/ClienteSearchDialog";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { ShoppingCart, Package, Menu, X, Search, Pizza } from "lucide-react";
// Imports adicionais necessários
import { MultiItemModal } from "./MultiItemModal";
import { AdicionaisSecundariosDialog } from "./AdicionaisSecundariosDialog";
import {
  ICoreCategoria,
  ICategoriaOpcao,
} from "@/rxjs/categoria/categoria.model";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  IconButton,
  InputAdornment,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";

import { ItemModal as NewItemModal } from "../vendas/ItemModal";
// Importe o PizzaMeiaModal que você criou
// import { PizzaMeiaModal } from "../vendas/PizzaMeiaModal";

import {
  Receipt,
  LocalShipping,
  Restaurant,
  PersonAdd,
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
import {
  ClienteResponse,
  PaginatedResponse,
} from "@/rxjs/clientes/cliente.model";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RootState } from "@/rxjs/store";
import {
  clearPedidoState,
  selectPedidoState,
} from "@/rxjs/pedido/pedido.slice";
import { Badge } from "@/components/catalyst-ui-kit/badge";
import { PizzaMeiaModal } from "./PizzaMeiaModal";
import { getClientesPorCelular } from "@/proxies/getclientesporcelular";
import { upsertCliente, UpsertClienteDTO } from "@/proxies/upsertcliente";
import { onlyDigits } from "@/utils/onlyDigits";
import { isUuid } from "@/lib/utils";

// Interfaces
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
  desconto: string;
  acrescimo: string;
  observacao?: string;
  taxa_entrega: string;
  nome_taxa_entrega?: string;
  id_status: number;
  lat?: string;
  lng?: string;
  troco_para?: string;
  itens: PedidoItemDTO[];
  finalizado?: boolean;
  quitado?: boolean;
  cliente_celular: string;
  cliente_nome_razao_social: string;
  cliente_logradouro?: string;
  cliente_numero?: string;
  cliente_bairro?: string;
  cliente_complemento?: string;
}

interface ItemModalData {
  produto: ProdutoResponse;
  item?: PedidoItemDTO;
  index?: number;
}

// Nova interface para pizza meio a meio
interface PizzaMeiaModalData {
  categoria: ICoreCategoria;
  categoriaOpcao: ICategoriaOpcao;
  item?: PedidoItemDTO;
  index?: number;
}

interface MultiItemModalData {
  produto: ProdutoResponse;
  items?: PedidoItemDTO[];
}

// Interface para itens da sidebar
interface SidebarItem {
  type: "produto" | "pizza-meia";
  id: string;
  nome: string;
  descricao?: string;
  data:
    | ProdutoResponse
    | { categoria: ICoreCategoria; categoriaOpcao: ICategoriaOpcao };
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
  tenant,
}: {
  produtos: ProdutoResponse[];
  user: User;
  categorias: ICoreCategoria[];
  adicionais: CategoriaAdicionalResponse[];
  pedido?: PedidoResponse | null;
  defaultCliente: PedidoClienteDTO | null | undefined;
  tenant: Tenant;
}) {
  let pedidoValidationSchema = Yup.object({
    id: Yup.string().optional().nullable(),
    id_cliente: Yup.string().test(
      "cliente-prazo-valido",
      "Para venda a prazo, selecione um cliente diferente",
      function (value) {
        const categoria_pagamento = this.parent.categoria_pagamento;
        if (categoria_pagamento === "Prazo" && defaultCliente?.id === value) {
          return false;
        }
        return true;
      }
    ),
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
    desconto: Yup.number().default(0),
    acrescimo: Yup.number().default(0),
    cliente_celular: Yup.string()
      .transform((v) => onlyDigits(v || ""))
      .min(8, "Celular inválido")
      .test("celular-required", "Celular é obrigatório", function (value) {
        const id_cliente = this.parent.id_cliente;
        if (id_cliente === defaultCliente?.id) {
          return true;
        }
        return Boolean(value);
      }),
    cliente_nome_razao_social: Yup.string().required("Nome é obrigatório"),
    cliente_logradouro: Yup.string().optional(),
    cliente_numero: Yup.string().optional(),
    cliente_bairro: Yup.string().optional(),
    cliente_complemento: Yup.string().optional(),
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

  console.log(produtos);
  const router = useRouter();

  // Estados de loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [clienteOptions, setClienteOptions] = useState<PedidoClienteDTO[]>(
    defaultCliente && pedido?.cliente
      ? [defaultCliente, pedido.cliente]
      : defaultCliente
      ? [defaultCliente]
      : pedido?.cliente
      ? [pedido.cliente]
      : []
  );

  // Estados para modais
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ItemModalData | null>(null);
  const [pizzaMeiaModalOpen, setPizzaMeiaModalOpen] = useState(false);
  const [pizzaMeiaModalData, setPizzaMeiaModalData] =
    useState<PizzaMeiaModalData | null>(null);
  const [multiItemModalOpen, setMultiItemModalOpen] = useState(false);
  const [multiItemModalData, setMultiItemModalData] =
    useState<MultiItemModalData | null>(null);
  const theme = useTheme();
  const [dialogClienteOpen, setDialogClienteOpen] = useState(false);
  const [clienteParaEdicao, setClienteParaEdicao] =
    useState<PedidoClienteDTO | null>(null);
  const [buscarNomeOpen, setBuscarNomeOpen] = useState(false);
  const [clienteStatus, setClienteStatus] = useState<
    "idle" | "searching" | "found" | "not-found"
  >("idle");
  const formikRef = useRef<FormikProps<PedidoFormValues>>(null);

  const getCodigoPadrao = () => {
    const now = new Date();
    return `P${format(now, "yyyyMMdd-HHmmss")}`;
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
    desconto: pedido?.desconto || "0.00",
    acrescimo: pedido?.acrescimo || "0.00",
    finalizado: pedido?.finalizado || false,
    quitado: pedido?.quitado || false,
    cliente_celular: onlyDigits(
      pedido?.cliente?.celular || defaultCliente?.celular || ""
    ),
    cliente_nome_razao_social:
      pedido?.cliente?.nome_razao_social ||
      defaultCliente?.nome_razao_social ||
      "",
    cliente_logradouro:
      pedido?.cliente?.logradouro || defaultCliente?.logradouro || "",
    cliente_numero: pedido?.cliente?.numero || defaultCliente?.numero || "",
    cliente_bairro: pedido?.cliente?.bairro || defaultCliente?.bairro || "",
    cliente_complemento:
      pedido?.cliente?.complemento || defaultCliente?.complemento || "",
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
          `/clientes/smartsearch?search=${search}&page_size=250`
        );
        return response.data.items;
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        return [];
      }
    },
    []
  );

  const fetchClientePorCelular = useMemo(
    () =>
      debounce(async (cel: string) => {
        if (!cel) {
          setClienteStatus("idle");
          return;
        }
        try {
          setClienteStatus("searching");
          const res = await getClientesPorCelular(cel);
          const cliente = res.items[0];
          if (cliente) {
            setClienteOptions((prev) => {
              const idx = prev.findIndex((c) => c.id === cliente.id);
              if (idx >= 0) {
                const clone = [...prev];
                clone[idx] = cliente;
                return clone;
              }
              return [...prev, cliente];
            });
            formikRef?.current?.setFieldValue("id_cliente", cliente.id);
            formikRef?.current?.setFieldValue(
              "cliente_nome_razao_social",
              cliente.nome_razao_social
            );
            formikRef?.current?.setFieldValue(
              "cliente_logradouro",
              cliente.logradouro || ""
            );
            formikRef?.current?.setFieldValue(
              "cliente_numero",
              cliente.numero || ""
            );
            formikRef?.current?.setFieldValue(
              "cliente_bairro",
              cliente.bairro || ""
            );
            formikRef?.current?.setFieldValue(
              "cliente_complemento",
              cliente.complemento || ""
            );
            setClienteStatus("found");
          } else {
            formikRef?.current?.setFieldValue("id_cliente", "");
            setClienteStatus("not-found");
          }
        } catch (err) {
          console.error(err);
          setClienteStatus("not-found");
        }
      }, 500),
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

  // Gerar itens da sidebar incluindo opções de pizza meio a meio
  const sidebarItems = useMemo(() => {
    const items: SidebarItem[] = [];

    // Adicionar opções de pizza meio a meio primeiro
    categorias.forEach((categoria) => {
      if (categoria.opcao_meia === "M" || categoria.opcao_meia === "V") {
        categoria.opcoes?.forEach((opcao) => {
          const nome = `02 Sabores (Meio a Meio) - ${categoria.nome} - ${opcao.nome}`;

          if (nome.toLowerCase().includes(searchTerm.toLowerCase())) {
            items.push({
              type: "pizza-meia",
              id: `pizza-meia-${categoria.id}-${opcao.id}`,
              nome,
              descricao: `Pizza meio a meio ${categoria.nome} ${opcao.nome}`,
              data: { categoria, categoriaOpcao: opcao },
            });
          }
        });
      }
    });

    // Adicionar produtos normais depois
    const filteredProdutos =
      produtos?.filter((produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

    filteredProdutos.forEach((produto) => {
      items.push({
        type: "produto",
        id: `produto-${produto.id}`,
        nome: produto.nome,
        descricao: produto.descricao,
        data: produto,
      });
    });

    return items;
  }, [produtos, categorias, searchTerm]);

  // Função para verificar se deve usar o modal multi-item APENAS PARA ADIÇÃO
  const shouldUseMultiItemModal = (produto: ProdutoResponse): boolean => {
    const categoria = categorias.find((c) => c.id === produto.id_categoria);

    if (!categoria) return false;
    if (categoria.tipo_visualizacao !== 1) return false;

    // Pizza meio a meio NÃO pode usar MultiItemModal na sidebar (tem modal próprio)
    // Mas pizza inteira SIM pode usar se atender as regras
    // Como estamos na função de adicionar produto individual, pode usar

    const hasMainAdicional = adicionais.some(
      (a) => a.id_categoria === categoria.id && a.is_main === true
    );

    return hasMainAdicional;
  };
  // Função para ADICIONAR item - pode usar MultiItemModal se atender às regras
  const handleAddItem = (produto: ProdutoResponse) => {
    if (shouldUseMultiItemModal(produto)) {
      setMultiItemModalData({ produto });
      setMultiItemModalOpen(true);
    } else {
      setModalData({ produto });
      setModalOpen(true);
    }
  };

  const handleAddPizzaMeia = (
    categoria: ICoreCategoria,
    categoriaOpcao: ICategoriaOpcao
  ) => {
    setPizzaMeiaModalData({ categoria, categoriaOpcao });
    setPizzaMeiaModalOpen(true);
  };

  // Função para EDITAR item - SEMPRE usa modais originais
  const handleEditItem = async (item: PedidoItemDTO, index: number) => {
    if (item.id_produto_2) {
      // Pizza meio a meio - usa PizzaMeiaModal
      const categoria = categorias.find((c) => c.id === item.id_categoria);
      const categoriaOpcao = categoria?.opcoes?.find(
        (o) => o.id === item.id_categoria_opcao
      );

      if (categoria && categoriaOpcao) {
        setPizzaMeiaModalData({ categoria, categoriaOpcao, item, index });
        setPizzaMeiaModalOpen(true);
      } else {
        toast.error("Categoria ou opção não encontrada para esta pizza");
      }
      return;
    }

    // Produto normal - SEMPRE usa ItemModal na edição
    let produto = produtos.find((p) => p.id === item.id_produto);

    if (!produto) {
      try {
        const resp = await api.get<ProdutoResponse>(
          `/produtos/${item.id_produto}`
        );
        produto = resp.data;
      } catch {
        toast.error("Não foi possível carregar os dados do produto.");
        return;
      }
    }

    // Na EDIÇÃO, sempre usar o modal original (ItemModal)
    setModalData({ produto, item, index });
    setModalOpen(true);
  };

  // Função modificada para click na sidebar
  const handleSidebarItemClick = (item: SidebarItem) => {
    if (item.type === "produto") {
      const produto = item.data as ProdutoResponse;
      handleAddItem(produto); // Já verifica internamente se deve usar multi-item
    } else if (item.type === "pizza-meia") {
      const { categoria, categoriaOpcao } = item.data as {
        categoria: ICoreCategoria;
        categoriaOpcao: ICategoriaOpcao;
      };
      handleAddPizzaMeia(categoria, categoriaOpcao);
    }
  };

  const calculateItemTotal = (values: PedidoFormValues) => {
    return (
      values.itens.reduce((total, item) => {
        const adicionaisTotal = (item.adicionais || []).reduce(
          (addTotal, adicional) =>
            addTotal + parseFloat(adicional.valor) * adicional.quantidade,
          0
        );

        const itemTotal =
          (parseFloat(item.valor_unitario) + adicionaisTotal) * item.quantidade;

        return total + itemTotal;
      }, 0) +
      parseFloat(values.taxa_entrega || "0") -
      parseFloat(values.desconto || "0") +
      parseFloat(values.acrescimo || "0")
    );
  };

  const calculateItemSubTotal = (values: PedidoFormValues) => {
    return values.itens.reduce((total, item) => {
      const adicionaisTotal = (item.adicionais || []).reduce(
        (addTotal, adicional) =>
          addTotal + parseFloat(adicional.valor) * adicional.quantidade,
        0
      );

      const itemTotal =
        (parseFloat(item.valor_unitario) + adicionaisTotal) * item.quantidade;

      return total + itemTotal;
    }, 0);
  };

  const dispatch = useDispatch();
  const postOrPutPedidoState = useSelector(
    (state: RootState) => state.pedido.postOrPutPedidoActionState
  );

  // Detectar quando está em loading do Redux
  const isReduxLoading = postOrPutPedidoState === "pending";

  useEffect(() => {
    dispatch(clearPedidoState());
  }, [dispatch]);

  // Função para imprimir pedido com loading
  const handlePrintPedido = async (pedidoId: string) => {
    if (!pedidoId) {
      toast.error("Pedido não encontrado");
      return;
    }

    try {
      setIsPrintLoading(true);
      const response = await api.get(`/pedidos/relatorio/${pedidoId}`, {
        responseType: "blob",
      });

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(pdfUrl);
      printWindow?.print();

      printWindow?.addEventListener("afterprint", () => {
        URL.revokeObjectURL(pdfUrl);
        printWindow.close();
      });
    } catch (error) {
      console.error("Erro ao gerar comprovante:", error);
      toast.error("Erro ao gerar comprovante para impressão");
    } finally {
      setIsPrintLoading(false);
    }
  };

  return (
    <>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={pedidoValidationSchema}
        onSubmit={async (values) => {
          try {
            setIsSubmitting(true);
            debugger;

            const clientePayload: UpsertClienteDTO = {
              id: values.id_cliente || null,
              tenant_id: user.tenant_id,
              nome_razao_social: values.cliente_nome_razao_social,
              celular: onlyDigits(values.cliente_celular),
              logradouro: values.cliente_logradouro,
              numero: values.cliente_numero,
              bairro: values.cliente_bairro,
              complemento: values.cliente_complemento,
              tipo_pessoa: "F",
            };
            // so deve fazer upsert se o cliente for diferente do default cliente
            let savedCliente: PedidoClienteDTO | null | undefined =
              defaultCliente;

            if (values.id_cliente !== defaultCliente?.id) {
              savedCliente = await upsertCliente(clientePayload);
            }
            values.id_cliente = savedCliente?.id || "";

            if (!values.id_cliente || !isUuid(values.id_cliente)) {
              throw new Error("Cliente inválido");
            }

            if (values.id) {
              dispatch(
                updatePedidoAction.request({
                  id: values.id,
                  data: {
                    ...values,
                    troco_para: (values.troco_para ?? "0.00").toString(),
                    desconto: (values.desconto ?? "0.00").toString(),
                    acrescimo: (values.acrescimo ?? "0.00").toString(),
                  } as UpdatePedidoRequest,
                })
              );
            } else {
              dispatch(createPedidoAction.request(values));
            }
          } catch (error) {
            setIsSubmitting(false);
            toast.error("Erro ao processar pedido");
          }
        }}
      >
        {(formik: FormikProps<PedidoFormValues>) => {
          // Função para salvar múltiplos itens
          //const handleSaveMultiItems = (items: PedidoItemDTO[]) => {
          //  if (multiItemModalData?.items?.length === 1) {
          //    // Editando um item existente
          //    const originalItem = multiItemModalData.items[0];
          //    const itemIndex = formik.values.itens.findIndex(
          //      (item) =>
          //        item.id_produto === originalItem.id_produto &&
          //        item.id_categoria_opcao === originalItem.id_categoria_opcao &&
          //        item.observacao === originalItem.observacao
          //    );
          //
          //    if (itemIndex !== -1) {
          //      const newItens = [...formik.values.itens];
          //      newItens[itemIndex] = items[0]; // Apenas o primeiro item para edição
          //      formik.setFieldValue("itens", newItens);
          //    }
          //  } else {
          //    // Adicionando novos itens
          //    formik.setFieldValue("itens", [...formik.values.itens, ...items]);
          //  }
          //
          //  setMultiItemModalOpen(false);
          //  setMultiItemModalData(null);
          //};

          const handleSaveMultiItems = (items: PedidoItemDTO[]) => {
            // MultiItemModal é APENAS para adição, nunca para edição
            // Sempre adiciona novos itens
            formik.setFieldValue("itens", [...formik.values.itens, ...items]);

            setMultiItemModalOpen(false);
            setMultiItemModalData(null);
          };

          const handleAbrirDialogNovoCliente = () => {
            setClienteParaEdicao(null);
            setDialogClienteOpen(true);
          };

          const handleAbrirDialogEditarCliente = async () => {
            let clienteSelecionado = clienteOptions.find(
              (c) => c.id === formik.values.id_cliente
            );

            if (!clienteSelecionado && formik.values.id_cliente) {
              try {
                const resp = await api.get<ClienteResponse>(
                  `/clientes/${formik.values.id_cliente}`
                );
                clienteSelecionado = resp.data;
                setClienteOptions((prev) => {
                  const idx = prev.findIndex((c) => c.id === resp.data.id);
                  if (idx >= 0) {
                    const clone = [...prev];
                    clone[idx] = resp.data;
                    return clone;
                  }
                  return [...prev, resp.data];
                });
              } catch (err) {
                console.error(err);
              }
            }

            if (clienteSelecionado) {
              setClienteParaEdicao(clienteSelecionado);
              setDialogClienteOpen(true);
            } else {
              toast.error("Selecione um cliente para editar");
            }
          };

          const handleClienteSalvo = (clienteSalvo: any) => {
            const clienteExiste = clienteOptions.find(
              (c) => c.id === clienteSalvo.id
            );

            if (clienteExiste) {
              setClienteOptions((prev) =>
                prev.map((c) => (c.id === clienteSalvo.id ? clienteSalvo : c))
              );
            } else {
              setClienteOptions((prev) => [...prev, clienteSalvo]);
            }

            formik.setFieldValue("id_cliente", clienteSalvo.id);
            formik.setFieldValue(
              "cliente_celular",
              onlyDigits(clienteSalvo.celular || "")
            );
            formik.setFieldValue(
              "cliente_nome_razao_social",
              clienteSalvo.nome_razao_social
            );
            formik.setFieldValue(
              "cliente_logradouro",
              clienteSalvo.logradouro || ""
            );
            formik.setFieldValue("cliente_numero", clienteSalvo.numero || "");
            formik.setFieldValue("cliente_bairro", clienteSalvo.bairro || "");
            formik.setFieldValue(
              "cliente_complemento",
              clienteSalvo.complemento || ""
            );
            toast.success("Cliente salvo e selecionado com sucesso!");
          };

          useEffect(() => {
            const cel = onlyDigits(formik.values.cliente_celular);
            if (cel.length >= 8) {
              fetchClientePorCelular(cel);
            } else {
              setClienteStatus("idle");
            }
          }, [formik.values.cliente_celular]);

          const pedidoStateFromRedux = useSelector(selectPedidoState);

          useEffect(() => {
            if (postOrPutPedidoState === "completed") {
              let pedidoId = formik.values.id;
              if (
                !pedidoId &&
                pedidoStateFromRedux.pedidos.pedidos.length > 0
              ) {
                const pedidos = pedidoStateFromRedux.pedidos.pedidos;
                pedidoId = pedidos[pedidos.length - 1].id;
              }

              dispatch(clearPedidoState());

              if (shouldPrint && pedidoId) {
                handlePrintPedido(pedidoId).finally(() => {
                  setIsNavigating(true);
                  router.push("/gerenciar-vendas");
                  toast.success(
                    "Pedido salvo com sucesso e enviado para impressão"
                  );
                  setShouldPrint(false);
                  setIsSubmitting(false);
                });
              } else {
                setIsNavigating(true);
                router.push("/gerenciar-vendas");
                toast.success("Pedido salvo com sucesso");
                setIsSubmitting(false);
              }
            } else if (postOrPutPedidoState === "error") {
              setShouldPrint(false);
              setIsSubmitting(false);
              toast.error("Erro ao salvar pedido");
            }
          }, [postOrPutPedidoState, router, shouldPrint, formik.values.id]);

          // Verificar se qualquer operação está em andamento
          const isAnyLoading =
            isSubmitting || isReduxLoading || isPrintLoading || isNavigating;
          const isFormDisabled =
            isAnyLoading ||
            formik.values.finalizado === true ||
            formik.values.quitado === true;

          return (
            <>
              <Form className="flex h-screen overflow-hidden">
                {/* Left Sidebar - Resumo do Pedido */}
                <aside className="hidden lg:flex w-80 md:w-56 xl:w-80 flex-col border-r border-border overflow-y-auto">
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
                          <div className="bg-gradient-to-r from-primary/25 to-primary/34 rounded-lg p-2 sm:p-3 border border-primary/20">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Typography
                                variant="h6"
                                className="font-bold text-sm sm:text-base"
                              >
                                {formik.values.id
                                  ? `#${formik.values.codigo_pedido}`
                                  : "Novo Pedido"}
                              </Typography>
                              <Chip
                                icon={getStatusIcon(formik.values.tipo_entrega)}
                                label={formik.values.tipo_entrega}
                                size="small"
                                sx={{
                                  bgcolor: getStatusColor(
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

                              <div className="space-y-1">
                                {formik.values.categoria_pagamento && (
                                  <div className="flex justify-between">
                                    <Typography variant="body2">
                                      Categoria de pagamento
                                    </Typography>
                                    <Typography variant="body2">
                                      {formik.values.categoria_pagamento}
                                    </Typography>
                                  </div>
                                )}
                                {formik.values.forma_pagamento && (
                                  <div className="flex justify-between">
                                    <Typography variant="body2">
                                      Forma de pagamento
                                    </Typography>
                                    <Typography variant="body2">
                                      {formik.values.forma_pagamento}
                                    </Typography>
                                  </div>
                                )}
                                <Divider />
                                <div className="flex justify-between">
                                  <Typography variant="body2">
                                    Valor total
                                  </Typography>
                                  <Typography variant="body2">
                                    {formatCurrency(
                                      calculateItemSubTotal(
                                        formik.values
                                      ).toString()
                                    )}
                                  </Typography>
                                </div>

                                {formik.values.desconto !== "0.00" && (
                                  <div className="flex justify-between text-red-600">
                                    <Typography variant="body2">
                                      Desconto
                                    </Typography>
                                    <Typography variant="body2">
                                      -{formatCurrency(formik.values.desconto)}
                                    </Typography>
                                  </div>
                                )}

                                {formik.values.acrescimo !== "0.00" && (
                                  <div className="flex justify-between text-green-600">
                                    <Typography variant="body2">
                                      Acréscimo
                                    </Typography>
                                    <Typography variant="body2">
                                      +{formatCurrency(formik.values.acrescimo)}
                                    </Typography>
                                  </div>
                                )}

                                {formik.values.taxa_entrega !== "0.00" && (
                                  <div className="flex justify-between text-green-600">
                                    <Typography variant="body2">
                                      {formik.values.nome_taxa_entrega ||
                                        "Taxa de entrega"}
                                    </Typography>
                                    <Typography variant="body2">
                                      +
                                      {formatCurrency(
                                        formik.values.taxa_entrega
                                      )}
                                    </Typography>
                                  </div>
                                )}
                                <Divider />
                                <div className="flex justify-between items-center">
                                  <Typography
                                    variant="h6"
                                    className="font-bold"
                                  >
                                    Total
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    className="font-bold text-primary"
                                  >
                                    {formatCurrency(
                                      calculateItemTotal(
                                        formik.values
                                      ).toString()
                                    )}
                                  </Typography>
                                </div>
                                {formik.values.troco_para &&
                                formik.values.troco_para !== "0.00" ? (
                                  <div className="flex justify-between">
                                    <Typography variant="body2">
                                      Troco para
                                    </Typography>
                                    <Typography variant="body2">
                                      {formatCurrency(formik.values.troco_para)}
                                    </Typography>
                                  </div>
                                ) : (
                                  <></>
                                )}
                                {formik.values.troco_para &&
                                formik.values.troco_para !== "0.00" ? (
                                  <div className="flex justify-between">
                                    <Typography variant="subtitle2">
                                      Valor troco esperado
                                    </Typography>
                                    <Typography variant="subtitle2">
                                      {formatCurrency(
                                        (
                                          -(
                                            parseFloat(
                                              formik.values.valor_total
                                            ) +
                                            parseFloat(
                                              formik.values.taxa_entrega
                                            )
                                          ) +
                                          parseFloat(formik.values.troco_para)
                                        ).toString()
                                      )}
                                    </Typography>
                                  </div>
                                ) : (
                                  <></>
                                )}
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
                                  const produto2 = item.id_produto_2
                                    ? produtos.find(
                                        (p) => p.id === item.id_produto_2
                                      )
                                    : null;
                                  const categoria = categorias.find(
                                    (c) => c.id === item.id_categoria
                                  );

                                  const valorItemComAdicional =
                                    parseFloat(item.valor_unitario) +
                                    (item.adicionais || []).reduce(
                                      (acc, adicional) =>
                                        acc + parseFloat(adicional.valor),
                                      0
                                    );

                                  const isPizzaMeia = !!item.id_produto_2;

                                  return (
                                    <div
                                      key={index}
                                      className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                                    >
                                      <div className="flex justify-between items-start mb-2 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                          {isPizzaMeia ? (
                                            <Typography
                                              variant="subtitle2"
                                              className="font-medium flex items-center gap-1"
                                            >
                                              <Pizza className="h-4 w-4 text-orange-500" />
                                              Pizza Meio a Meio
                                            </Typography>
                                          ) : (
                                            <Typography
                                              variant="subtitle2"
                                              className="font-medium"
                                            >
                                              {produto?.nome ||
                                                "Produto não encontrado ou excluído do sistema"}
                                            </Typography>
                                          )}
                                          {/* <Typography
                                            variant="caption"
                                            color="primary"
                                          >
                                            {categoria?.nome}
                                          </Typography> */}
                                        </div>
                                        <div className="text-right ml-4 shrink-0">
                                          <Typography
                                            variant="body2"
                                            className="font-medium"
                                          >
                                            {item.quantidade}x{" "}
                                            {formatCurrency(
                                              valorItemComAdicional.toString()
                                            )}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {formatCurrency(
                                              item.valor_unitario
                                            )}
                                          </Typography>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2 shrink-0">
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              handleEditItem(item, index)
                                            }
                                            disabled={isFormDisabled}
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
                                            disabled={isFormDisabled}
                                          >
                                            <Delete fontSize="small" />
                                          </IconButton>
                                        </div>
                                      </div>

                                      {/* Sabores da Pizza */}
                                      {isPizzaMeia && (
                                        <div className="ml-4 mt-2 space-y-1">
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            className="font-medium"
                                          >
                                            Sabores:
                                          </Typography>
                                          <div className="text-sm text-muted-foreground">
                                            •{" "}
                                            {produto?.nome ||
                                              "Produto não encontrado"}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            •{" "}
                                            {produto2?.nome ||
                                              "Produto não encontrado"}
                                          </div>
                                        </div>
                                      )}

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
                                                      {adicionalData?.opcao
                                                        .nome ||
                                                        "Adicional não encontrado ou excluído do sistema"}
                                                      {adicional.quantidade >
                                                        1 &&
                                                        ` (${adicional.quantidade}x)`}
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
                                      {/* Observação */}
                                      {item.observacao && (
                                        <div className="ml-4 mt-2 space-y-1">
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            className="font-medium"
                                          >
                                            Observação:
                                          </Typography>
                                          <div className="text-sm font-semibold text-primary">
                                            • {item.observacao}
                                          </div>
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
                        <div className="h-full min-h-[80vh] flex items-center justify-center animate-bounce duration-1500 ">
                          <div className="text-center">
                            <Restaurant
                              sx={{
                                fontSize: 48,
                                mb: 2,
                              }}
                              color="primary"
                            />
                            <Typography
                              variant="h6"
                              color="text.primary"
                              className="mb-2"
                            >
                              Adicione produtos para começar uma venda
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Clique em um produto na barra lateral para começar
                              uma venda
                            </Typography>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>

                {/* Main Content - Formulário */}
                {/* Main Content - Formulário */}
                <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
                  <main className="flex-1 overflow-auto p-2 md:p-4">
                    <div className="max-w-full mx-auto">
                      {/* Header Section */}
                      <div>
                        <div className="flex items-center justify-between">
                          {/* <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            <Typography variant="h6" className="font-semibold">
                              {formik.values.id
                                ? "Editar Pedido"
                                : "Novo Pedido"}
                            </Typography>
                            {formik.values.codigo_pedido && (
                              <Chip
                                label={`#${formik.values.codigo_pedido}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </div> */}

                          {(formik.values.finalizado === true ||
                            formik.values.quitado === true) && (
                            <div className="flex items-center gap-2">
                              <Badge color="green">Finalizado</Badge>
                              <Badge color="orange">Não Editável</Badge>
                            </div>
                          )}
                        </div>

                        {/* Loading indicator */}
                        {isAnyLoading && (
                          <div className="flex items-center justify-center mb-3 gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <CircularProgress size={18} />
                            <Typography
                              variant="body2"
                              color="primary"
                              className="font-medium"
                            >
                              {isPrintLoading && "Gerando comprovante..."}
                              {isSubmitting &&
                                !isPrintLoading &&
                                "Salvando pedido..."}
                              {isReduxLoading &&
                                !isSubmitting &&
                                "Processando..."}
                              {isNavigating && "Redirecionando..."}
                            </Typography>
                          </div>
                        )}
                      </div>

                      {/* Form Content */}
                      <div className="space-y-4">
                        {/* Actions Section */}
                        <Card
                          elevation={0}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            borderRadius: 2,
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <div className="flex flex-col gap-3">
                              {/* Print Button */}
                              {formik.values.id && (
                                <div className="w-full">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    startIcon={
                                      isPrintLoading ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <Print />
                                      )
                                    }
                                    onClick={() =>
                                      handlePrintPedido(formik.values.id || "")
                                    }
                                    disabled={isPrintLoading || isAnyLoading}
                                  >
                                    {isPrintLoading
                                      ? "Imprimindo..."
                                      : "Reimprimir"}
                                  </Button>
                                </div>
                              )}

                              {/* Main Action Buttons */}
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  onClick={() =>
                                    router.push("/gerenciar-vendas")
                                  }
                                  disabled={isAnyLoading}
                                >
                                  Voltar
                                </Button>

                                <Button
                                  type="submit"
                                  variant="contained"
                                  size="small"
                                  fullWidth
                                  disabled={
                                    !formik.isValid ||
                                    formik.values.itens.length === 0 ||
                                    isAnyLoading ||
                                    formik.values.quitado == true ||
                                    formik.values.finalizado == true
                                  }
                                  onClick={() => setShouldPrint(false)}
                                  startIcon={
                                    isSubmitting && !shouldPrint ? (
                                      <CircularProgress size={16} />
                                    ) : null
                                  }
                                >
                                  {isSubmitting && !shouldPrint
                                    ? "Salvando..."
                                    : pedido
                                    ? "Atualizar"
                                    : "Criar Pedido"}
                                </Button>

                                <Button
                                  variant="contained"
                                  size="small"
                                  color="secondary"
                                  fullWidth
                                  disabled={
                                    !formik.isValid ||
                                    formik.values.itens.length === 0 ||
                                    isAnyLoading ||
                                    formik.values.quitado == true ||
                                    formik.values.finalizado == true
                                  }
                                  startIcon={
                                    isSubmitting && shouldPrint ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <Print />
                                    )
                                  }
                                  onClick={() => {
                                    setShouldPrint(true);
                                    formik.handleSubmit();
                                  }}
                                >
                                  {isSubmitting && shouldPrint
                                    ? "Salvando..."
                                    : "Salvar e Imprimir"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Cliente Section */}
                        <Card
                          elevation={0}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            borderRadius: 2,
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Person className="h-4 w-4 text-primary" />
                                <Typography
                                  variant="subtitle1"
                                  className="font-semibold"
                                >
                                  Dados do Cliente
                                </Typography>

                                {/* Status do Cliente */}
                                {clienteStatus !== "idle" &&
                                  !formik.values.quitado &&
                                  !formik.values.finalizado && (
                                    <div>
                                      {clienteStatus === "found" && (
                                        <Badge color="green">Encontrado</Badge>
                                      )}
                                      {clienteStatus === "not-found" && (
                                        <Badge color="red">
                                          Não encontrado
                                        </Badge>
                                      )}
                                      {clienteStatus === "searching" && (
                                        <Badge color="blue">Buscando...</Badge>
                                      )}
                                    </div>
                                  )}
                              </div>

                              {/* Botões de ação do cliente */}
                              <div className="flex gap-1">
                                <IconButton
                                  size="small"
                                  onClick={() => setBuscarNomeOpen(true)}
                                  title="Buscar por nome"
                                  disabled={isFormDisabled}
                                  sx={{
                                    bgcolor: "info.main",
                                    color: "white",
                                    "&:hover": { bgcolor: "info.dark" },
                                    "&:disabled": {
                                      bgcolor: "action.disabled",
                                    },
                                  }}
                                >
                                  <Search className="h-5 w-6" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  onClick={handleAbrirDialogNovoCliente}
                                  title="Novo Cliente"
                                  disabled={isFormDisabled}
                                  sx={{
                                    bgcolor: "success.main",
                                    color: "white",
                                    "&:hover": { bgcolor: "success.dark" },
                                    "&:disabled": {
                                      bgcolor: "action.disabled",
                                    },
                                  }}
                                >
                                  <PersonAdd className="h-5 w-6" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  onClick={handleAbrirDialogEditarCliente}
                                  title="Editar Cliente"
                                  disabled={
                                    !formik.values.id_cliente || isFormDisabled
                                  }
                                  sx={{
                                    bgcolor: "warning.main",
                                    color: "white",
                                    "&:hover": { bgcolor: "warning.dark" },
                                    "&:disabled": {
                                      bgcolor: "action.disabled",
                                    },
                                  }}
                                >
                                  <Edit className="h-5 w-6" />
                                </IconButton>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {/* Linha 1: Celular e Nome */}
                              <div className="flex flex-col gap-3">
                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Celular"
                                  name="cliente_celular"
                                  value={formik.values.cliente_celular}
                                  onChange={(e) =>
                                    formik.setFieldValue(
                                      "cliente_celular",
                                      onlyDigits(e.target.value)
                                    )
                                  }
                                  onBlur={formik.handleBlur}
                                  error={
                                    formik.touched.cliente_celular &&
                                    Boolean(formik.errors.cliente_celular)
                                  }
                                  helperText={
                                    formik.touched.cliente_celular &&
                                    (formik.errors.cliente_celular as any)
                                  }
                                  disabled={isFormDisabled}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <Phone className="h-4 w-4" />
                                      </InputAdornment>
                                    ),
                                  }}
                                />

                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Nome completo"
                                  name="cliente_nome_razao_social"
                                  value={
                                    formik.values.cliente_nome_razao_social
                                  }
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  error={
                                    formik.touched.cliente_nome_razao_social &&
                                    Boolean(
                                      formik.errors.cliente_nome_razao_social
                                    )
                                  }
                                  helperText={
                                    formik.touched.cliente_nome_razao_social &&
                                    (formik.errors
                                      .cliente_nome_razao_social as any)
                                  }
                                  disabled={isFormDisabled}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <Person className="h-4 w-4" />
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              </div>

                              {/* Linha 2: Endereço */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                                <div className="md:col-span-7">
                                  <TextField
                                    size="small"
                                    fullWidth
                                    label="Logradouro"
                                    name="cliente_logradouro"
                                    value={formik.values.cliente_logradouro}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={
                                      formik.touched.cliente_logradouro &&
                                      Boolean(formik.errors.cliente_logradouro)
                                    }
                                    helperText={
                                      formik.touched.cliente_logradouro &&
                                      (formik.errors.cliente_logradouro as any)
                                    }
                                    disabled={isFormDisabled}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <LocationOn className="h-4 w-4" />
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <TextField
                                    size="small"
                                    fullWidth
                                    label="Número"
                                    name="cliente_numero"
                                    value={formik.values.cliente_numero}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={
                                      formik.touched.cliente_numero &&
                                      Boolean(formik.errors.cliente_numero)
                                    }
                                    helperText={
                                      formik.touched.cliente_numero &&
                                      (formik.errors.cliente_numero as any)
                                    }
                                    disabled={isFormDisabled}
                                  />
                                </div>

                                <div className="md:col-span-3">
                                  <TextField
                                    size="small"
                                    fullWidth
                                    label="Bairro"
                                    name="cliente_bairro"
                                    value={formik.values.cliente_bairro}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={
                                      formik.touched.cliente_bairro &&
                                      Boolean(formik.errors.cliente_bairro)
                                    }
                                    helperText={
                                      formik.touched.cliente_bairro &&
                                      (formik.errors.cliente_bairro as any)
                                    }
                                    disabled={isFormDisabled}
                                  />
                                </div>
                              </div>

                              {/* Linha 3: Complemento */}
                              <TextField
                                size="small"
                                fullWidth
                                label="Complemento"
                                name="cliente_complemento"
                                value={formik.values.cliente_complemento}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={
                                  formik.touched.cliente_complemento &&
                                  Boolean(formik.errors.cliente_complemento)
                                }
                                helperText={
                                  formik.touched.cliente_complemento &&
                                  (formik.errors.cliente_complemento as any)
                                }
                                disabled={isFormDisabled}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Entrega e Pagamento Section */}
                        <Card
                          elevation={0}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            borderRadius: 2,
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <div className="flex items-center gap-2 mb-3">
                              <LocalShipping className="h-4 w-4 text-primary" />
                              <Typography
                                variant="subtitle1"
                                className="font-semibold"
                              >
                                Entrega e Pagamento
                              </Typography>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Tipo de Entrega */}
                              <FormControl fullWidth required size="small">
                                <InputLabel>Tipo de Entrega</InputLabel>
                                <Select
                                  name="tipo_entrega"
                                  value={formik.values.tipo_entrega}
                                  onChange={(e) => {
                                    formik.handleChange(e);
                                    if (e.target.value !== "Delivery") {
                                      formik.setFieldValue(
                                        "taxa_entrega",
                                        "0.00"
                                      );
                                    } else if (
                                      (tenant?.taxa_entrega_padrao ?? 0) > 0
                                    ) {
                                      formik.setFieldValue(
                                        "taxa_entrega",
                                        (
                                          tenant?.taxa_entrega_padrao ?? 0
                                        ).toFixed(2)
                                      );
                                    }
                                  }}
                                  label="Tipo de Entrega"
                                  disabled={isFormDisabled}
                                >
                                  <MenuItem value="Balcão">
                                    <div className="flex items-center gap-2">
                                      <Restaurant
                                        className="h-4 w-4"
                                        color="secondary"
                                      />
                                      Balcão
                                    </div>
                                  </MenuItem>
                                  <MenuItem value="Delivery">
                                    <div className="flex items-center gap-2">
                                      <LocalShipping
                                        className="h-4 w-4"
                                        color="secondary"
                                      />
                                      Delivery
                                    </div>
                                  </MenuItem>
                                  <MenuItem value="Retirada">
                                    <div className="flex items-center gap-2">
                                      <Storefront
                                        className="h-4 w-4"
                                        color="secondary"
                                      />
                                      Retirada
                                    </div>
                                  </MenuItem>
                                </Select>
                              </FormControl>

                              {/* Categoria de Pagamento */}
                              <FormControl fullWidth size="small">
                                <InputLabel>Categoria de Pagamento</InputLabel>
                                <Select
                                  name="categoria_pagamento"
                                  value={formik.values.categoria_pagamento}
                                  onChange={(e) => {
                                    formik.handleChange(e);
                                    if (e.target.value !== "Dinheiro") {
                                      formik.setFieldValue(
                                        "troco_para",
                                        "0.00"
                                      );
                                    }
                                  }}
                                  label="Categoria de Pagamento"
                                  disabled={isFormDisabled}
                                >
                                  <MenuItem value="Cartão">Cartão</MenuItem>
                                  <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                                  <MenuItem value="Pix">Pix</MenuItem>
                                  <MenuItem value="Prazo">Prazo</MenuItem>
                                </Select>
                              </FormControl>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Valores Section */}
                        <Card
                          elevation={0}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            borderRadius: 2,
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <div className="flex items-center gap-2 mb-3">
                              <Receipt className="h-4 w-4 text-primary" />
                              <Typography
                                variant="subtitle1"
                                className="font-semibold"
                              >
                                Valores e Taxas
                              </Typography>
                            </div>

                            <div className="space-y-3">
                              {/* Taxa de Entrega e Nome */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                  disabled={
                                    formik.values.tipo_entrega !== "Delivery" ||
                                    isFormDisabled
                                  }
                                />

                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Nome da Taxa de Entrega"
                                  name="nome_taxa_entrega"
                                  value={formik.values.nome_taxa_entrega}
                                  onChange={formik.handleChange}
                                  disabled={
                                    formik.values.tipo_entrega !== "Delivery" ||
                                    isFormDisabled
                                  }
                                />
                              </div>

                              {/* Desconto e Acréscimo */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Desconto"
                                  name="desconto"
                                  type="number"
                                  value={formik.values.desconto}
                                  onChange={formik.handleChange}
                                  disabled={isFormDisabled}
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
                                  label="Acréscimo"
                                  name="acrescimo"
                                  type="number"
                                  value={formik.values.acrescimo}
                                  onChange={formik.handleChange}
                                  disabled={isFormDisabled}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        R$
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              </div>

                              {/* Troco */}
                              {formik.values.categoria_pagamento ===
                                "Dinheiro" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                  <TextField
                                    size="small"
                                    fullWidth
                                    label="Troco Para"
                                    name="troco_para"
                                    type="number"
                                    value={formik.values.troco_para}
                                    onChange={formik.handleChange}
                                    disabled={isFormDisabled}
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
                                    value={(
                                      parseFloat(
                                        formik.values.troco_para || "0"
                                      ) - calculateItemTotal(formik.values)
                                    ).toFixed(2)}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          R$
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Observações Section */}
                        <Card
                          elevation={0}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            borderRadius: 2,
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                            <div className="flex items-center gap-2 mb-3">
                              <Edit className="h-4 w-4 text-primary" />
                              <Typography
                                variant="subtitle1"
                                className="font-semibold"
                              >
                                Observações
                              </Typography>
                            </div>

                            <TextField
                              size="small"
                              fullWidth
                              label="Observações do pedido"
                              name="observacao"
                              multiline
                              rows={3}
                              value={formik.values.observacao}
                              onChange={formik.handleChange}
                              disabled={isFormDisabled}
                              placeholder="Digite observações especiais para este pedido..."
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </main>
                </div>

                {/* Right Sidebar - Produtos e Pizza Meio a Meio */}
                <aside className="hidden lg:flex w-80 md:w-56 xl:w-80 flex-col border-l border-border bg-card overflow-y-auto">
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-border">
                      <h2 className="font-semibold text-xl flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Produtos & Pizzas
                      </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {sidebarItems && sidebarItems.length > 0 ? (
                        <List sx={{ padding: 0 }}>
                          {sidebarItems.map((item) => (
                            <ListItem key={item.id} disablePadding>
                              <ListItemButton
                                onClick={() => handleSidebarItemClick(item)}
                                disabled={isFormDisabled}
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                  },
                                  padding: "12px 16px",
                                  borderLeft:
                                    item.type === "pizza-meia"
                                      ? "3px solid"
                                      : "none",
                                  borderLeftColor:
                                    item.type === "pizza-meia"
                                      ? "orange"
                                      : "transparent",
                                }}
                              >
                                <div className="flex items-start gap-2 w-full">
                                  {item.type === "pizza-meia" && (
                                    <Pizza className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                                  )}
                                  <ListItemText
                                    primary={item.nome}
                                    secondary={item.descricao}
                                    primaryTypographyProps={{
                                      fontSize: "14px",
                                      fontWeight:
                                        item.type === "pizza-meia" ? 500 : 400,
                                      color:
                                        item.type === "pizza-meia"
                                          ? "orange"
                                          : "inherit",
                                    }}
                                    secondaryTypographyProps={{
                                      fontSize: "12px",
                                      color:
                                        item.type === "pizza-meia"
                                          ? "text.secondary"
                                          : "text.secondary",
                                    }}
                                  />
                                </div>
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
                            {searchTerm
                              ? "Nenhum item encontrado"
                              : "Nenhum produto disponível"}
                          </Typography>
                        </Box>
                      )}
                    </div>

                    <div className="p-3 border-t border-border">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar produtos e pizzas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          disabled={isFormDisabled}
                          className="w-full py-2 pl-8 pr-3 disabled:opacity-50 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Modal para Adicionar/Editar Item Normal */}
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
                      formik.setFieldValue("itens", [
                        ...formik.values.itens,
                        item,
                      ]);
                    }
                    setModalOpen(false);
                    setModalData(null);
                  }}
                  categorias={categorias}
                />

                <PizzaMeiaModal
                  open={pizzaMeiaModalOpen}
                  onClose={() => {
                    setPizzaMeiaModalOpen(false);
                    setPizzaMeiaModalData(null);
                  }}
                  modalData={pizzaMeiaModalData}
                  produtos={produtos}
                  adicionais={adicionais}
                  onSave={(item) => {
                    if (pizzaMeiaModalData?.index !== undefined) {
                      // Editar item existente
                      const newItens = [...formik.values.itens];
                      newItens[pizzaMeiaModalData.index] = item;
                      formik.setFieldValue("itens", newItens);
                    } else {
                      // Adicionar novo item
                      formik.setFieldValue("itens", [
                        ...formik.values.itens,
                        item,
                      ]);
                    }
                    setPizzaMeiaModalOpen(false);
                    setPizzaMeiaModalData(null);
                  }}
                />
                {/* Novo modal multi-item */}
                <MultiItemModal
                  open={multiItemModalOpen}
                  onClose={() => {
                    setMultiItemModalOpen(false);
                    setMultiItemModalData(null);
                  }}
                  modalData={multiItemModalData}
                  adicionais={adicionais}
                  categorias={categorias}
                  onSave={handleSaveMultiItems}
                />
              </Form>
              <DialogCliente
                open={dialogClienteOpen}
                onClose={() => setDialogClienteOpen(false)}
                user={user}
                cliente={clienteParaEdicao as ClienteResponse}
                onClienteSaved={handleClienteSalvo}
              />
              <ClienteSearchDialog
                open={buscarNomeOpen}
                onClose={() => setBuscarNomeOpen(false)}
                onSelect={(option) => {
                  formik.setFieldValue("id_cliente", option.id);
                  formik.setFieldValue(
                    "cliente_celular",
                    onlyDigits(option.celular || "")
                  );
                  formik.setFieldValue(
                    "cliente_nome_razao_social",
                    option.nome_razao_social
                  );
                  formik.setFieldValue(
                    "cliente_logradouro",
                    option.logradouro || ""
                  );
                  formik.setFieldValue("cliente_numero", option.numero || "");
                  formik.setFieldValue("cliente_bairro", option.bairro || "");
                  formik.setFieldValue(
                    "cliente_complemento",
                    option.complemento || ""
                  );
                }}
              />
            </>
          );
        }}
      </Formik>
    </>
  );
}

export default Vendas;
