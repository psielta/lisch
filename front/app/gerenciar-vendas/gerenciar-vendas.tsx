"use client";
import React from "react";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { PedidoResponse } from "@/rxjs/pedido/pedido.model";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  Typography,
  Chip,
  Divider,
  Box,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Fab,
} from "@mui/material";
import {
  Person,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Receipt,
  LocalShipping,
  Restaurant,
  Storefront,
  Edit,
  Add,
} from "@mui/icons-material";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function GerenciarVendas({
  pedidos,
  produtos,
  categorias,
  adicionais,
  idPedidoSelecionado,
}: {
  pedidos: PedidoResponse[];
  produtos: ProdutoResponse[];
  categorias: ICoreCategoria[];
  adicionais: CategoriaAdicionalResponse[];
  idPedidoSelecionado: string | null;
}) {
  const theme = useTheme();
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(
    idPedidoSelecionado
  );
  const router = useRouter();

  // *** Menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const selectedPedido = useMemo(() => {
    return pedidos.find((p) => p.id === selectedPedidoId);
  }, [pedidos, selectedPedidoId]);

  // Helper functions para buscar dados relacionados
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
      {/* 3 column wrapper */}
      <div className="w-full h-full grow lg:flex">
        {/* Left sidebar & main wrapper */}
        <div className="flex-1 h-full xl:flex">
          <div className="h-full flex flex-col border-b border-border px-4 py-6 sm:px-6 lg:pl-8 xl:w-64 xl:shrink-0 xl:border-r xl:border-b-0 xl:pl-6 bg-card">
            <div className="border-b border-border pb-4 mb-4">
              <h2 className="text-lg font-semibold text-start text-foreground">
                Pedidos em aberto
              </h2>
              <p className="text-sm text-muted-foreground">
                {pedidos.length} pedidos
              </p>
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
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "12px",
                                opacity: 0.8,
                                color: "inherit",
                              }}
                            >
                              {pedido.cliente.nome_razao_social}
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
                                  parseFloat(pedido.taxa_entrega ?? "0")
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
              open={open}
              onClose={handleClose}
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
                  handleClose();
                  router.push(`/vendas/${selectedPedidoId}`);
                }}
              >
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText>Editar</ListItemText>
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
            {/* Main area - pode ser usado para outras funcionalidades futuras */}
            <div className="h-full flex items-center justify-center">
              <Typography variant="h6" color="text.secondary">
                Área principal disponível para expansão
              </Typography>
            </div>
          </div>
        </div>

        <div className="h-full shrink-0 border-t border-border px-4 py-6 sm:px-6 lg:w-96 lg:border-t-0 lg:border-l lg:pr-8 xl:pr-6 bg-card overflow-y-auto">
          {/* Right column area - Detalhes do pedido */}
          {selectedPedido ? (
            <div className="space-y-6">
              {/* Header do pedido */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <Typography
                    variant="h6"
                    className="font-bold text-foreground"
                  >
                    Pedido #{selectedPedido.codigo_pedido}
                  </Typography>
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
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AccessTime sx={{ fontSize: 16 }} />
                  <span>{formatDateTime(selectedPedido.data_pedido)}</span>
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
                  <Typography variant="h6" className="font-semibold mb-3">
                    Resumo Financeiro
                  </Typography>
                  <div className="space-y-2">
                    {selectedPedido.taxa_entrega !== "0.00" && (
                      <div className="flex justify-between">
                        <Typography variant="body2">
                          {selectedPedido.nome_taxa_entrega ||
                            "Taxa de entrega"}
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(selectedPedido.taxa_entrega)}
                        </Typography>
                      </div>
                    )}
                    {selectedPedido.cupom && (
                      <div className="flex justify-between text-green-600">
                        <Typography variant="body2">
                          Cupom: {selectedPedido.cupom}
                        </Typography>
                        <Typography variant="body2">
                          Desconto aplicado
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
                            parseFloat(selectedPedido.taxa_entrega ?? "0")
                          ).toString()
                        )}
                      </Typography>
                    </div>
                    {selectedPedido.forma_pagamento && (
                      <Typography variant="caption" color="text.secondary">
                        Forma de pagamento: {selectedPedido.forma_pagamento}
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Informações Adicionais */}
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
              {/* Informações do Cliente */}
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
                    <Person sx={{ fontSize: 20 }} />
                    Cliente
                  </Typography>
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
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <Typography
                                variant="subtitle2"
                                className="font-medium"
                              >
                                {produto?.nome || "Produto não encontrado"}
                                {produto2 && ` + ${produto2.nome}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {categoria?.nome}{" "}
                                {categoriaOpcao && `• ${categoriaOpcao.nome}`}
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
                            <div className="text-right ml-4">
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
                                  parseFloat(item.valor_unitario).toString()
                                )}
                              </Typography>
                            </div>
                          </div>

                          {/* Adicionais */}
                          {item.adicionais && item.adicionais.length > 0 && (
                            <div className="ml-4 mt-2 space-y-1">
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                className="font-medium"
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
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span className="text-muted-foreground">
                                      •{" "}
                                      {adicionalData?.opcao.nome ||
                                        "Adicional não encontrado"}
                                      {adicional.quantidade > 1 &&
                                        ` (${adicional.quantidade}x)`}
                                    </span>
                                    <span className="text-muted-foreground">
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

      {/* Floating Action Button */}
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
    </div>
  );
}
