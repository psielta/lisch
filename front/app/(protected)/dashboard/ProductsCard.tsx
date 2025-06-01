"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Skeleton,
  Chip,
  Divider,
} from "@mui/material";
import {
  Inventory,
  TrendingUp,
  Visibility,
  AttachMoney,
  ShoppingCart,
} from "@mui/icons-material";

import { ProductMaisVendidosItem, TicketMedio } from "@/types/Products";
import { getProdutosMaisVendidos30Dias } from "@/proxies/dashboard/get-produtos-mais-vendidos-30-dias";
import { getTicketMedio30Dias } from "@/proxies/dashboard/get-ticket-medio-30-dias";
import ProductsDetailModal from "./ProductsDetailModal";

export default function ProductsCard() {
  const [topProducts, setTopProducts] = useState<ProductMaisVendidosItem[]>([]);
  const [ticketMedio, setTicketMedio] = useState<TicketMedio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Carregar dados dos produtos e ticket médio
  const loadProductsData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [productsData, ticketData] = await Promise.all([
        getProdutosMaisVendidos30Dias(),
        getTicketMedio30Dias(),
      ]);

      setTopProducts(productsData || []);
      setTicketMedio(ticketData[0] || null);
    } catch (error) {
      console.error("Erro ao carregar dados de produtos:", error);
      setTopProducts([]);
      setTicketMedio(null);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadProductsData();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleModalOpen = (): void => {
    setModalOpen(true);
  };

  const handleModalClose = (): void => {
    setModalOpen(false);
  };

  // Pegar apenas os 5 primeiros produtos
  const displayTopProducts = topProducts.slice(0, 5);

  return (
    <>
      <Card elevation={2} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Inventory sx={{ color: "primary.main", fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Produtos
            </Typography>
          </Box>

          {/* Seção Produtos Mais Vendidos */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp sx={{ color: "success.main", fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Top Vendidos (30d)
                </Typography>
              </Box>
              {topProducts.length > 5 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={handleModalOpen}
                  startIcon={<Visibility />}
                  sx={{ fontSize: "12px", minWidth: "auto", px: 1 }}
                >
                  Ver todos
                </Button>
              )}
            </Box>

            {loading ? (
              <Box sx={{ space: 1 }}>
                {[...Array(5)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Skeleton variant="circular" width={24} height={24} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" height={16} />
                      <Skeleton variant="text" width="50%" height={14} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : displayTopProducts.length > 0 ? (
              <Box sx={{ space: 1 }}>
                {displayTopProducts.map((product, index) => (
                  <Box
                    key={product.id_produto}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      backgroundColor:
                        index === 0 ? "success.50" : "transparent",
                      border: index === 0 ? "1px solid" : "none",
                      borderColor: index === 0 ? "success.200" : "transparent",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor:
                          index === 0 ? "success.main" : "primary.main",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: index === 0 ? 600 : 500,
                          fontSize: "13px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          mb: 0.5,
                        }}
                      >
                        {product.produto}
                      </Typography>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "success.main",
                            fontWeight: 600,
                            fontSize: "11px",
                          }}
                        >
                          {formatCurrency(product.valor_liquido)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontSize: "11px",
                          }}
                        >
                          • {product.unidades} un.
                        </Typography>
                      </Box>
                    </Box>
                    {index === 0 && (
                      <Chip
                        label="TOP"
                        size="small"
                        color="success"
                        sx={{
                          height: 20,
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "13px" }}
              >
                Nenhum produto encontrado
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Seção Ticket Médio */}
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1.5,
              }}
            >
              <AttachMoney sx={{ color: "info.main", fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Ticket Médio (30d)
              </Typography>
            </Box>

            {loading ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: "info.50",
                  border: "1px solid",
                  borderColor: "info.200",
                }}
              >
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton
                  variant="text"
                  width="40%"
                  height={16}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ) : ticketMedio ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: "info.50",
                  border: "1px solid",
                  borderColor: "info.200",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "info.main",
                    mb: 0.5,
                  }}
                >
                  {formatCurrency(ticketMedio.ticket_medio_30d)}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <ShoppingCart
                    sx={{ color: "text.secondary", fontSize: 16 }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                    }}
                  >
                    {ticketMedio.qtde_pedidos_30d} pedidos
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "13px" }}
              >
                Dados do ticket médio não disponíveis
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <ProductsDetailModal
        open={modalOpen}
        onClose={handleModalClose}
        products={topProducts}
      />
    </>
  );
}
