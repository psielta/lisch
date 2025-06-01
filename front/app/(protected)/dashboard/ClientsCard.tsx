"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Skeleton,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  People,
  CakeOutlined,
  TrendingUp,
  Visibility,
} from "@mui/icons-material";

import {
  ClienteMaisFaturadosNosUltimos30Dias_Item,
  ClienteAniversario,
} from "@/types/clients";
import { getClientesMaisFaturados30Dias } from "@/proxies/dashboard/get-clientes-mais-faturados-30-dias";
import { getAniversariantes } from "@/proxies/dashboard/get-aniversariantes";
import ClientsDetailModal from "./ClientsDetailModal";

export default function ClientsCard() {
  const [topClients, setTopClients] = useState<
    ClienteMaisFaturadosNosUltimos30Dias_Item[]
  >([]);
  const [birthdayClients, setBirthdayClients] = useState<ClienteAniversario[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"faturados" | "aniversarios">(
    "faturados"
  );

  // Carregar dados dos clientes
  const loadClientsData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [faturadosData, aniversariantesData] = await Promise.all([
        getClientesMaisFaturados30Dias(),
        getAniversariantes(),
      ]);

      setTopClients(faturadosData || []);
      setBirthdayClients(aniversariantesData || []);
    } catch (error) {
      console.error("Erro ao carregar dados de clientes:", error);
      setTopClients([]);
      setBirthdayClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadClientsData();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleModalOpen = (type: "faturados" | "aniversarios"): void => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleModalClose = (): void => {
    setModalOpen(false);
  };

  // Pegar apenas os 3 primeiros de cada categoria
  const displayTopClients = topClients.slice(0, 3);
  const displayBirthdayClients = birthdayClients.slice(0, 3);

  return (
    <>
      <Card elevation={2} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <People sx={{ color: "primary.main", fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Clientes
            </Typography>
          </Box>

          {/* Seção Clientes Mais Faturados */}
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
                  Top Faturamento (30d)
                </Typography>
              </Box>
              {topClients.length > 3 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => handleModalOpen("faturados")}
                  startIcon={<Visibility />}
                  sx={{ fontSize: "12px", minWidth: "auto", px: 1 }}
                >
                  Ver todos
                </Button>
              )}
            </Box>

            {loading ? (
              <Box sx={{ space: 1 }}>
                {[...Array(3)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="circular" width={32} height={32} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={16} />
                      <Skeleton variant="text" width="40%" height={14} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : displayTopClients.length > 0 ? (
              <Box sx={{ space: 1 }}>
                {displayTopClients.map((client, index) => (
                  <Box
                    key={client.id_cliente}
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
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "12px",
                        bgcolor: index === 0 ? "success.main" : "primary.main",
                      }}
                    >
                      {getInitials(client.cliente)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: index === 0 ? 600 : 500,
                          fontSize: "13px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {client.cliente}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "success.main",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                      >
                        {formatCurrency(client.valor_liquido)}
                      </Typography>
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
                Nenhum cliente encontrado
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Seção Aniversariantes */}
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CakeOutlined sx={{ color: "warning.main", fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Aniversários (7d)
                </Typography>
              </Box>
              {birthdayClients.length > 3 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => handleModalOpen("aniversarios")}
                  startIcon={<Visibility />}
                  sx={{ fontSize: "12px", minWidth: "auto", px: 1 }}
                >
                  Ver todos
                </Button>
              )}
            </Box>

            {loading ? (
              <Box sx={{ space: 1 }}>
                {[...Array(3)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="circular" width={32} height={32} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={16} />
                      <Skeleton variant="text" width="30%" height={14} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : displayBirthdayClients.length > 0 ? (
              <Box sx={{ space: 1 }}>
                {displayBirthdayClients.map((client) => (
                  <Box
                    key={client.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: "warning.50",
                      border: "1px solid",
                      borderColor: "warning.200",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "12px",
                        bgcolor: "warning.main",
                      }}
                    >
                      {getInitials(client.cliente)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: "13px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {client.cliente}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "warning.main",
                          fontWeight: 600,
                          fontSize: "12px",
                        }}
                      >
                        {formatDate(client.proximo_aniversario)}
                      </Typography>
                    </Box>
                    <CakeOutlined
                      sx={{
                        color: "warning.main",
                        fontSize: 18,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "13px" }}
              >
                Nenhum aniversariante encontrado
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <ClientsDetailModal
        open={modalOpen}
        onClose={handleModalClose}
        type={modalType}
        topClients={topClients}
        birthdayClients={birthdayClients}
      />
    </>
  );
}
