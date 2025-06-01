"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Autocomplete,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  AccessTime,
  Add,
  CheckCircle,
  Edit,
  Email,
  FilterList,
  LocalShipping,
  LocationOn,
  Person,
  Phone,
  Print,
  Receipt,
  Restaurant,
  Storefront,
} from "@mui/icons-material";
import DialogCliente from "@/components/dialogs/DialogCliente";
import { ClienteResponse } from "@/rxjs/clientes/cliente.model";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import {
  PedidoClienteDTO,
  PedidoListResponse,
  PedidoResponse,
} from "@/rxjs/pedido/pedido.model";
import { useRouter } from "next/navigation";
import FinalizarPedido from "./finalizar-pedido";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import api from "@/lib/api";
import debounce from "lodash.debounce";
import { PaginatedResponse } from "@/rxjs/clientes/cliente.model";
import { User } from "@/context/auth-context";

// Interface para os filtros
interface FiltroPedidos {
  id_cliente?: string;
  status?: string;
  tipo_entrega?: string;
  data_inicio?: string;
  data_fim?: string;
  codigo_pedido?: string;
  finalizado?: boolean;
  quitado?: boolean;
  limit?: number;
  offset?: number;
}

// Schema de validação para os filtros
const filtroSchema = Yup.object({
  id_cliente: Yup.string()
    .uuid("ID do cliente deve ser um UUID válido")
    .optional(),
  status: Yup.number()
    .integer("Status deve ser um número inteiro")
    .positive("Status deve ser positivo")
    .optional(),
  tipo_entrega: Yup.string()
    .oneOf(["Delivery", "Retirada"], "Tipo de entrega inválido")
    .optional(),
  data_inicio: Yup.date()
    .transform((value, originalValue) =>
      originalValue ? new Date(originalValue) : null
    )
    .nullable()
    .optional(),
  data_fim: Yup.date()
    .transform((value, originalValue) =>
      originalValue ? new Date(originalValue) : null
    )
    .nullable()
    .min(Yup.ref("data_inicio"), "Data final deve ser posterior à data inicial")
    .optional(),
  codigo_pedido: Yup.string().optional(),
  finalizado: Yup.string().optional(),
  quitado: Yup.string().optional(),
  limit: Yup.number()
    .integer("Limite deve ser um número inteiro")
    .positive("Limite deve ser positivo")
    .max(1000, "Limite máximo é 1000")
    .default(20),
  offset: Yup.number()
    .integer("Offset deve ser um número inteiro")
    .min(0, "Offset não pode ser negativo")
    .default(0),
});

export default function GerenciarVendas({
  pedidos: initialPedidos,
  produtos,
  categorias,
  adicionais,
  idPedidoSelecionado,
  user,
}: {
  pedidos: PedidoResponse[];
  produtos: ProdutoResponse[];
  categorias: ICoreCategoria[];
  adicionais: CategoriaAdicionalResponse[];
  idPedidoSelecionado: string | null;
  user: User;
}) {
  const theme = useTheme();
  const router = useRouter();
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(
    idPedidoSelecionado
  );
  const [pedidos, setPedidos] = useState<PedidoResponse[]>(initialPedidos);
  const [openFiltroDialog, setOpenFiltroDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [clienteOptions, setClienteOptions] = useState<PedidoClienteDTO[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [dialogClienteOpen, setDialogClienteOpen] = useState(false);
  const [clienteParaEdicao, setClienteParaEdicao] =
    useState<PedidoClienteDTO | null>(null);
  const handleAbrirDialogEditarCliente = () => {
    if (selectedPedido?.cliente) {
      setClienteParaEdicao(selectedPedido.cliente);
      setDialogClienteOpen(true);
    } else {
      toast.error("Nenhum pedido selecionado");
    }
  };

  const handleClienteSalvo = (clienteSalvo: any) => {
    // Atualizar o cliente no pedido selecionado
    if (selectedPedido) {
      const pedidosAtualizados = pedidos.map((pedido) =>
        pedido.id === selectedPedido.id
          ? { ...pedido, cliente: clienteSalvo }
          : pedido
      );
      setPedidos(pedidosAtualizados);
    }

    toast.success("Cliente atualizado com sucesso!");
    setDialogClienteOpen(false);
    setClienteParaEdicao(null);
  };

  // Função para buscar clientes com debounce
  const fetchClientes = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          const response = await api.get<PaginatedResponse<PedidoClienteDTO>>(
            `/clientes/smartsearch?search=${query}&page_size=250`
          );
          setClienteOptions(response.data.items);
        } catch (error) {
          console.error("Erro ao buscar clientes:", error);
          toast.error("Erro ao carregar clientes");
        }
      }, 300),
    []
  );

  // Função para buscar pedidos com filtros
  const fetchPedidos = async (filtros: FiltroPedidos) => {
    try {
      const queryParams = new URLSearchParams();
      if (filtros.id_cliente)
        queryParams.append("id_cliente", filtros.id_cliente);
      if (filtros.status) queryParams.append("status", filtros.status);
      if (filtros.tipo_entrega)
        queryParams.append("tipo_entrega", filtros.tipo_entrega);
      if (filtros.data_inicio)
        queryParams.append(
          "data_inicio",
          new Date(filtros.data_inicio).toISOString().split("T")[0]
        );
      if (filtros.data_fim)
        queryParams.append(
          "data_fim",
          new Date(filtros.data_fim).toISOString().split("T")[0]
        );
      if (filtros.codigo_pedido)
        queryParams.append("codigo_pedido", filtros.codigo_pedido);
      if (filtros.finalizado !== undefined)
        queryParams.append("finalizado", filtros.finalizado.toString());
      if (filtros.quitado !== undefined)
        queryParams.append("quitado", filtros.quitado.toString());
      queryParams.append("limit", (filtros.limit || 20).toString());
      queryParams.append("offset", (filtros.offset || 0).toString());

      const response = await api.get<PedidoListResponse>(
        `/pedidos?${queryParams.toString()}`
      );
      setPedidos(response?.data?.pedidos || []);
      toast.success("Pedidos filtrados com sucesso!");
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast.error("Erro ao aplicar filtros");
    }
  };

  // Função para limpar filtros
  const limparFiltros = async () => {
    try {
      const response = await api.get<PedidoListResponse>(
        "/pedidos?limit=1000&finalizado=false"
      );
      setPedidos(response?.data?.pedidos || []);
      setClienteOptions([]);
      setInputValue("");
      toast.success("Filtros limpos!");
    } catch (error) {
      console.error("Erro ao limpar filtros:", error);
      toast.error("Erro ao limpar filtros");
    }
  };

  // Handlers do menu
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const selectedPedido = useMemo(() => {
    return pedidos.find((p) => p.id === selectedPedidoId);
  }, [pedidos, selectedPedidoId]);

  // Helper functions
  const getProdutoById = (id: string) => {
    return produtos.find((p) => p.id === id);
  };

  const getCategoriaById = (id: string) => {
    return categorias.find((c) => c.id === id);
  };

  const getCategoriaOpcaoById = (categoriaId: string, opcaoId: string) => {
    const categoria = getCategoriaById(categoriaId);
    return categoria?.opcoes.find((o) => o.id === opcaoId);
  };

  const getAdicionalOpcaoById = (opcaoId: string) => {
    for (const adicional of adicionais) {
      const opcao = adicional.opcoes?.find((o) => o.id === opcaoId);
      if (opcao) {
        return { adicional, opcao };
      }
    }
    return null;
  };

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="flex min-h-screen h-screen w-full">
      <div className="w-full h-full grow lg:flex">
        <div className="flex-1 h-full flex">
          <div className="h-full flex flex-col border-b border-border py-6 px-3 md:w-56 xl:w-80 xl:shrink-0 xl:border-r xl:border-b-0 bg-card">
            <div className="border-b border-border pb-4 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-start text-foreground">
                  Pedidos em aberto
                </h2>
                <p className="text-sm text-muted-foreground">
                  {pedidos.length} pedidos
                </p>
              </div>
              <Tooltip title="Filtrar pedidos">
                <IconButton
                  onClick={() => {
                    setOpenFiltroDialog(true);
                    setInputValue("");
                    setClienteOptions([]);
                  }}
                  color="primary"
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            </div>

            <List sx={{ padding: 0, flex: 1, overflowY: "auto" }}>
              {pedidos
                .sort((a, b) => {
                  return (
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
                  );
                })
                .map((pedido) => (
                  <Tooltip
                    key={pedido.id}
                    title={pedido.tipo_entrega}
                    placement="right"
                    arrow
                    enterDelay={500}
                    leaveDelay={200}
                  >
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => setSelectedPedidoId(pedido.id)}
                        onDoubleClick={() =>
                          router.push(`/vendas/${pedido.id}`)
                        }
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedPedidoId(pedido.id);
                          setAnchorEl(e.currentTarget);
                        }}
                        sx={{
                          "&:hover": {
                            backgroundColor: theme.palette.action.focusOpacity,
                            color: theme.palette.action.active,
                          },
                          backgroundColor:
                            selectedPedidoId === pedido.id
                              ? theme.palette.primary.main
                              : "transparent",
                          color:
                            selectedPedidoId === pedido.id
                              ? theme.palette.primary.contrastText
                              : getStatusColor(pedido.tipo_entrega),
                          padding: "16px",
                          borderRadius: "12px",
                          marginBottom: "8px",
                          border:
                            selectedPedidoId === pedido.id
                              ? `2px solid ${theme.palette.primary.main}`
                              : "2px solid transparent",
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          {getStatusIcon(pedido.tipo_entrega)}
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  color: "inherit",
                                }}
                              >
                                #{pedido.codigo_pedido}
                              </Typography>
                              {pedido.quitado && (
                                <Box
                                  sx={{
                                    backgroundColor: theme.palette.success.main,
                                    color: theme.palette.success.contrastText,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.25,
                                    }}
                                  >
                                    <CheckCircle sx={{ fontSize: 12 }} />
                                    <span>PAGO</span>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "12px",
                                opacity: 0.8,
                                color: "inherit",
                              }}
                            >
                              {pedido.cliente?.nome_razao_social ?? ""}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "11px",
                                opacity: 0.7,
                                color: "inherit",
                                display: "block",
                              }}
                            >
                              {formatCurrency(
                                (
                                  parseFloat(pedido.valor_total ?? "0") +
                                  parseFloat(pedido.taxa_entrega ?? "0") -
                                  parseFloat(pedido.desconto ?? "0") +
                                  parseFloat(pedido.acrescimo ?? "0")
                                ).toString()
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                ))}
            </List>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              MenuListProps={{
                "aria-labelledby": "basic-menu",
              }}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  router.push(`/vendas/${selectedPedidoId}`);
                }}
              >
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText>Editar</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  handleMenuClose();
                  try {
                    const response = await api.get(
                      `/pedidos/relatorio/${selectedPedidoId}`,
                      {
                        responseType: "blob",
                      }
                    );

                    // Criar URL do blob PDF
                    const pdfBlob = new Blob([response.data], {
                      type: "application/pdf",
                    });
                    const pdfUrl = URL.createObjectURL(pdfBlob);

                    // Abrir em nova aba para impressão
                    const printWindow = window.open(pdfUrl);
                    printWindow?.print();

                    // Limpar URL do blob após impressão
                    printWindow?.addEventListener("afterprint", () => {
                      URL.revokeObjectURL(pdfUrl);
                      printWindow.close();
                    });
                  } catch (error) {
                    console.error("Erro ao gerar comprovante:", error);
                    toast.error("Erro ao gerar comprovante para impressão");
                  }
                }}
              >
                <ListItemIcon>
                  <Print fontSize="small" />
                </ListItemIcon>
                <ListItemText>Imprimir</ListItemText>
              </MenuItem>
            </Menu>

            <div className="mt-4 space-y-3 text-sm border-t border-border pt-4">
              <Typography
                variant="subtitle2"
                className="text-foreground font-medium mb-2"
              >
                Legenda
              </Typography>
              <div className="flex items-center gap-2">
                <LocalShipping
                  sx={{ fontSize: 16, color: theme.palette.primary.main }}
                />
                <span className="text-foreground">Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Restaurant
                  sx={{ fontSize: 16, color: theme.palette.secondary.main }}
                />
                <span className="text-foreground">Balcão</span>
              </div>
              <div className="flex items-center gap-2">
                <Storefront
                  sx={{ fontSize: 16, color: theme.palette.success.main }}
                />
                <span className="text-foreground">Retirada</span>
              </div>
            </div>
          </div>

          <div className="h-full px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 bg-card">
            <main className="h-full">
              {selectedPedido ? (
                <FinalizarPedido
                  pedido={selectedPedido}
                  onFinished={() => router.refresh()}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Typography variant="h6">
                    Selecione um pedido à esquerda
                  </Typography>
                </div>
              )}
            </main>
          </div>
        </div>

        <div className="h-full shrink-0 border-t border-border w-100 md:w-60 xl:w-80 2xl:w-100 px-3 py-6 lg:border-t-0 lg:border-l bg-card overflow-y-auto">
          {selectedPedido ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <Typography
                    variant="h6"
                    className="font-bold text-foreground"
                  >
                    Pedido #{selectedPedido.codigo_pedido}
                  </Typography>
                  <div className="flex flex-col items-end gap-2">
                    <Chip
                      icon={getStatusIcon(selectedPedido.tipo_entrega)}
                      label={selectedPedido.tipo_entrega}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(
                          selectedPedido.tipo_entrega
                        ),
                        color: "white",
                        fontWeight: 500,
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit fontSize="small" />}
                      onClick={() =>
                        router.push(`/vendas/${selectedPedido.id}`)
                      }
                    >
                      Editar
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AccessTime sx={{ fontSize: 16 }} />
                  <span>{formatDateTime(selectedPedido.data_pedido)}</span>
                </div>
              </div>
              <Card
                elevation={0}
                sx={{
                  backgroundColor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ padding: 3 }}>
                  <Typography variant="h6" className="font-semibold mb-3">
                    Resumo Financeiro
                  </Typography>
                  <div className="space-y-1">
                    {selectedPedido.categoria_pagamento && (
                      <div className="flex justify-between">
                        <Typography variant="body2">
                          Categoria de pagamento
                        </Typography>
                        <Typography variant="body2">
                          {selectedPedido.categoria_pagamento}
                        </Typography>
                      </div>
                    )}
                    {selectedPedido.forma_pagamento && (
                      <div className="flex justify-between">
                        <Typography variant="body2">
                          Forma de pagamento
                        </Typography>
                        <Typography variant="body2">
                          {selectedPedido.forma_pagamento}
                        </Typography>
                      </div>
                    )}
                    <Divider />
                    <div className="flex justify-between">
                      <Typography variant="body2">Valor total</Typography>
                      <Typography variant="body2">
                        {formatCurrency(selectedPedido.valor_total)}
                      </Typography>
                    </div>
                    {selectedPedido.desconto !== "0.00" && (
                      <div className="flex justify-between text-red-600">
                        <Typography variant="body2">Desconto</Typography>
                        <Typography variant="body2">
                          -{formatCurrency(selectedPedido.desconto)}
                        </Typography>
                      </div>
                    )}
                    {selectedPedido.acrescimo !== "0.00" && (
                      <div className="flex justify-between text-green-600">
                        <Typography variant="body2">Acréscimo</Typography>
                        <Typography variant="body2">
                          +{formatCurrency(selectedPedido.acrescimo)}
                        </Typography>
                      </div>
                    )}
                    {selectedPedido.taxa_entrega !== "0.00" && (
                      <div className="flex justify-between text-green-600">
                        <Typography variant="body2">
                          {selectedPedido.nome_taxa_entrega ||
                            "Taxa de entrega"}
                        </Typography>
                        <Typography variant="body2">
                          +{formatCurrency(selectedPedido.taxa_entrega)}
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
                          (
                            parseFloat(selectedPedido.valor_total ?? "0") +
                            parseFloat(selectedPedido.taxa_entrega ?? "0") -
                            parseFloat(selectedPedido.desconto ?? "0") +
                            parseFloat(selectedPedido.acrescimo ?? "0")
                          ).toString()
                        )}
                      </Typography>
                    </div>
                    {selectedPedido.troco_para &&
                    selectedPedido.troco_para !== "0.00" ? (
                      <div className="flex justify-between">
                        <Typography variant="body2">Troco para</Typography>
                        <Typography variant="body2">
                          {formatCurrency(selectedPedido.troco_para ?? "0.00")}
                        </Typography>
                      </div>
                    ) : (
                      <></>
                    )}
                    {selectedPedido.troco_para &&
                    selectedPedido.troco_para !== "0.00" ? (
                      <div className="flex justify-between">
                        <Typography variant="subtitle2">
                          Valor troco esperado
                        </Typography>
                        <Typography variant="subtitle2">
                          {formatCurrency(
                            (
                              -(
                                parseFloat(selectedPedido.valor_total ?? "0") +
                                parseFloat(selectedPedido.taxa_entrega ?? "0")
                              ) + parseFloat(selectedPedido.troco_para ?? "0")
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
              {(selectedPedido.observacao || selectedPedido.prazo) && (
                <Card
                  elevation={0}
                  sx={{
                    backgroundColor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <CardContent sx={{ padding: 3 }}>
                    <Typography variant="h6" className="font-semibold mb-3">
                      Informações Adicionais
                    </Typography>
                    <div className="space-y-2">
                      {selectedPedido.observacao && (
                        <div>
                          <Typography
                            variant="body2"
                            className="font-medium mb-1"
                          >
                            Observações:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedPedido.observacao}
                          </Typography>
                        </div>
                      )}
                      {selectedPedido.prazo && (
                        <div>
                          <Typography
                            variant="body2"
                            className="font-medium mb-1"
                          >
                            Prazo de entrega:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedPedido.prazo} minutos
                            {selectedPedido.prazo_min &&
                              selectedPedido.prazo_max &&
                              ` (${selectedPedido.prazo_min} - ${selectedPedido.prazo_max} min)`}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card
                elevation={0}
                sx={{
                  backgroundColor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardContent sx={{ padding: 3 }}>
                  <div className="flex items-center justify-between mb-3">
                    <Typography
                      variant="h6"
                      className="font-semibold flex items-center gap-2"
                    >
                      <Person sx={{ fontSize: 20 }} />
                      Cliente
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit fontSize="small" />}
                      onClick={handleAbrirDialogEditarCliente}
                      disabled={!selectedPedido}
                    >
                      Editar Cliente
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Typography variant="body2" className="font-medium">
                      {selectedPedido.cliente.nome_razao_social}
                    </Typography>
                    {selectedPedido.cliente.nome_fantasia && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedPedido.cliente.nome_fantasia}
                      </Typography>
                    )}
                    {selectedPedido.cliente.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {selectedPedido.cliente.telefone}
                        </Typography>
                      </div>
                    )}
                    {selectedPedido.cliente.email && (
                      <div className="flex items-center gap-2">
                        <Email sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {selectedPedido.cliente.email}
                        </Typography>
                      </div>
                    )}
                    {selectedPedido.cliente.logradouro && (
                      <div className="flex items-start gap-2">
                        <LocationOn
                          sx={{
                            fontSize: 16,
                            color: "text.secondary",
                            mt: 0.5,
                          }}
                        />
                        <Typography variant="body2" className="flex-1">
                          {`${selectedPedido.cliente.logradouro}${
                            selectedPedido.cliente.numero
                              ? `, ${selectedPedido.cliente.numero}`
                              : ""
                          }${
                            selectedPedido.cliente.complemento
                              ? ` ${selectedPedido.cliente.complemento}`
                              : ""
                          }`}
                          <br />
                          {`${selectedPedido.cliente.bairro}, ${selectedPedido.cliente.cidade} - ${selectedPedido.cliente.uf}`}
                          {selectedPedido.cliente.cep &&
                            ` • ${selectedPedido.cliente.cep}`}
                        </Typography>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card
                elevation={0}
                sx={{
                  backgroundColor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  width: "100%",
                }}
              >
                <CardContent sx={{ padding: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    className="font-semibold mb-3 flex items-center gap-2 text-base sm:text-lg"
                  >
                    <Receipt sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    Itens do Pedido
                  </Typography>
                  <div className="space-y-4">
                    {selectedPedido.itens.map((item, index) => {
                      const produto = getProdutoById(item.id_produto);
                      const produto2 = item.id_produto_2
                        ? getProdutoById(item.id_produto_2)
                        : null;
                      const categoria = getCategoriaById(item.id_categoria);
                      const categoriaOpcao = item.id_categoria_opcao
                        ? getCategoriaOpcaoById(
                            item.id_categoria,
                            item.id_categoria_opcao
                          )
                        : null;

                      const valorItemComAdicional =
                        parseFloat(item.valor_unitario) +
                        (item.adicionais ?? []).reduce(
                          (acc: number, adicional: any) =>
                            acc + parseFloat(adicional.valor),
                          0
                        );

                      return (
                        <div
                          key={index}
                          className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <Typography
                                variant="subtitle2"
                                className="font-medium text-sm sm:text-base break-words"
                              >
                                {produto?.nome || "Produto não encontrado"}
                                {produto2 && ` + ${produto2.nome}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                className="block text-xs sm:text-sm"
                              >
                                {categoria?.nome}{" "}
                                {categoriaOpcao && `• ${categoriaOpcao.nome}`}
                              </Typography>
                              {item.observacao && (
                                <Typography
                                  variant="caption"
                                  className="block text-amber-600 mt-1 text-xs sm:text-sm"
                                >
                                  Obs: {item.observacao}
                                </Typography>
                              )}
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <Typography
                                variant="body2"
                                className="font-medium text-sm sm:text-base"
                              >
                                {item.quantidade}x{" "}
                                {formatCurrency(
                                  valorItemComAdicional.toString()
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                className="text-xs sm:text-sm"
                              >
                                {formatCurrency(
                                  parseFloat(item.valor_unitario).toString()
                                )}
                              </Typography>
                            </div>
                          </div>
                          {item.adicionais && item.adicionais.length > 0 && (
                            <div className="ml-2 sm:ml-4 mt-2 space-y-1">
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                className="font-medium text-xs sm:text-sm"
                              >
                                Adicionais:
                              </Typography>
                              {item.adicionais.map((adicional, addIndex) => {
                                const adicionalData = getAdicionalOpcaoById(
                                  adicional.id_adicional_opcao
                                );
                                return (
                                  <div
                                    key={addIndex}
                                    className="flex justify-between items-center text-xs sm:text-sm"
                                  >
                                    <span className="text-muted-foreground break-words pr-2">
                                      •{" "}
                                      {adicionalData?.opcao.nome ||
                                        "Adicional não encontrado"}
                                      {adicional.quantidade > 1 &&
                                        ` (${adicional.quantidade}x)`}
                                    </span>
                                    <span className="text-muted-foreground shrink-0">
                                      {formatCurrency(adicional.valor)}
                                    </span>
                                  </div>
                                );
                              })}
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
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Receipt
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography
                  variant="h6"
                  color="text.secondary"
                  className="mb-2"
                >
                  Selecione um pedido
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clique em um pedido da lista para ver os detalhes
                </Typography>
              </div>
            </div>
          )}
        </div>
      </div>

      <Fab
        color="primary"
        aria-label="Adicionar novo pedido"
        onClick={() => router.push("/vendas/new")}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Add />
      </Fab>

      {/* Diálogo de Filtros */}
      <Dialog
        open={openFiltroDialog}
        onClose={() => setOpenFiltroDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filtrar Pedidos</DialogTitle>
        <Formik
          initialValues={{
            id_cliente: "",
            status: "",
            tipo_entrega: "",
            data_inicio: "",
            data_fim: "",
            codigo_pedido: "",
            finalizado: "",
            quitado: "",
            limit: 250,
            offset: 0,
          }}
          validationSchema={filtroSchema}
          onSubmit={async (values) => {
            const filtros: FiltroPedidos = {
              id_cliente: values.id_cliente || undefined,
              status: values.status || undefined,
              tipo_entrega: values.tipo_entrega || undefined,
              data_inicio: values.data_inicio || undefined,
              data_fim: values.data_fim || undefined,
              codigo_pedido: values.codigo_pedido || undefined,
              finalizado:
                values.finalizado === ""
                  ? undefined
                  : values.finalizado === "true",
              quitado:
                values.quitado === "" ? undefined : values.quitado === "true",
              limit: values.limit,
              offset: values.offset,
            };
            await fetchPedidos(filtros);
            setOpenFiltroDialog(false);
          }}
        >
          {({
            values,
            handleChange,
            setFieldValue,
            errors,
            touched,
            isSubmitting,
          }) => (
            <Form>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      name="codigo_pedido"
                      label="Código do Pedido"
                      value={values.codigo_pedido}
                      onChange={handleChange}
                      error={touched.codigo_pedido && !!errors.codigo_pedido}
                      helperText={touched.codigo_pedido && errors.codigo_pedido}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Autocomplete
                      size="small"
                      options={clienteOptions}
                      value={
                        clienteOptions.find(
                          (c) => c.id === values.id_cliente
                        ) ?? null
                      }
                      filterOptions={(options) => options}
                      inputValue={inputValue}
                      getOptionKey={(option) => option.id}
                      onInputChange={(_, newInput, reason) => {
                        if (reason === "input") {
                          setInputValue(newInput);
                          if (newInput.length >= 3) fetchClientes(newInput);
                        }
                      }}
                      onChange={(_, option) => {
                        setFieldValue("id_cliente", option?.id ?? "");
                        setInputValue(option ? option.nome_razao_social : "");
                      }}
                      getOptionLabel={(opt) => {
                        const telefone =
                          opt.telefone?.match(/\d+/g)?.join("") || "";
                        const celular =
                          opt.celular?.match(/\d+/g)?.join("") || "";
                        return `${opt.nome_razao_social} - ${telefone} - ${celular}`;
                      }}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      loading={
                        inputValue.length >= 3 && clienteOptions.length === 0
                      }
                      onBlur={() => {
                        const selecionado = clienteOptions.find(
                          (c) => c.id === values.id_cliente
                        );
                        setInputValue(
                          selecionado ? selecionado.nome_razao_social : ""
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cliente"
                          error={touched.id_cliente && !!errors.id_cliente}
                          helperText={touched.id_cliente && errors.id_cliente}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      name="status"
                      label="Status (ID)"
                      type="number"
                      value={values.status}
                      onChange={handleChange}
                      error={touched.status && !!errors.status}
                      helperText={touched.status && errors.status}
                    />
                  </Grid>
                  <Grid size={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de Entrega</InputLabel>
                      <Select
                        name="tipo_entrega"
                        value={values.tipo_entrega}
                        onChange={handleChange}
                        label="Tipo de Entrega"
                      >
                        <MenuItem value="">Nenhum</MenuItem>
                        <MenuItem value="Delivery">Delivery</MenuItem>
                        <MenuItem value="Retirada">Retirada</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      name="data_inicio"
                      label="Data Início"
                      type="date"
                      value={values.data_inicio}
                      onChange={handleChange}
                      error={touched.data_inicio && !!errors.data_inicio}
                      helperText={touched.data_inicio && errors.data_inicio}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      name="data_fim"
                      label="Data Fim"
                      type="date"
                      value={values.data_fim}
                      onChange={handleChange}
                      error={touched.data_fim && !!errors.data_fim}
                      helperText={touched.data_fim && errors.data_fim}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Finalizado</InputLabel>
                      <Select
                        name="finalizado"
                        value={values.finalizado}
                        onChange={handleChange}
                        label="Finalizado"
                      >
                        <MenuItem value="">Nenhum</MenuItem>
                        <MenuItem value="true">Sim</MenuItem>
                        <MenuItem value="false">Não</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Quitado</InputLabel>
                      <Select
                        name="quitado"
                        value={values.quitado}
                        onChange={handleChange}
                        label="Quitado"
                      >
                        <MenuItem value="">Nenhum</MenuItem>
                        <MenuItem value="true">Sim</MenuItem>
                        <MenuItem value="false">Não</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      name="limit"
                      label="Limite"
                      type="number"
                      value={values.limit}
                      onChange={handleChange}
                      error={touched.limit && !!errors.limit}
                      helperText={touched.limit && errors.limit}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      name="offset"
                      label="Offset"
                      type="number"
                      value={values.offset}
                      onChange={handleChange}
                      error={touched.offset && !!errors.offset}
                      helperText={touched.offset && errors.offset}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    limparFiltros();
                    setOpenFiltroDialog(false);
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button onClick={() => setOpenFiltroDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Aplicando..." : "Aplicar Filtros"}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <DialogCliente
        open={dialogClienteOpen}
        onClose={() => {
          setDialogClienteOpen(false);
          setClienteParaEdicao(null);
        }}
        user={user} // Você precisará passar o user como prop para o componente
        cliente={clienteParaEdicao as ClienteResponse}
        onClienteSaved={handleClienteSalvo}
      />
    </div>
  );
}
