"use client";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { Box, Stack, Paper, Typography, Container, Grid } from "@mui/material";
import { LocationOn, Phone, CalendarToday } from "@mui/icons-material";
import SalesCard from "./SalesCard";
import { PaymentsChart } from "./PaymentsChart";

export default function Dashboard() {
  const { user, tenant } = useAuth();

  if (!user) {
    redirect("/login");
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return "N/A";
    }
  };

  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Header Compacto */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Logo e Nome */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {tenant?.photo && (
                  <img
                    src={`data:image/jpeg;base64,${tenant.photo}`}
                    alt={tenant?.name || "Logo da empresa"}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {tenant?.name || "Nome da Empresa"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Informações de Contato Compactas */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="body2" noWrap>
                      {tenant?.telefone || "Não cadastrado"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="body2" noWrap>
                      {tenant?.cidade || "Endereço não cadastrado"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday
                      sx={{ fontSize: 18, color: "primary.main" }}
                    />
                    <Typography variant="body2" noWrap>
                      {formatDate(tenant?.created_at || "")}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Área de Gráficos e Cards */}
        <Grid container spacing={3}>
          {/* Card de Vendas */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <SalesCard />
          </Grid>

          {/* Outros Cards - Você pode adicionar mais cards aqui */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Próximo Card
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Próximo Card
              </Typography>
            </Paper>
          </Grid>

          {/* Gráfico de Pagamentos */}
          <Grid size={{ xs: 12 }}>
            <PaymentsChart />
          </Grid>
        </Grid>
      </Container>
    </Suspense>
  );
}
