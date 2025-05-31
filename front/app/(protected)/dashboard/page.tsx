"use client";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import {
  Box,
  Stack,
  Divider,
  Paper,
  Typography,
  Container,
} from "@mui/material";
import { LocationOn, Phone, CalendarToday } from "@mui/icons-material";

export default function Dashboard() {
  const { user, tenant } = useAuth();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 4, md: 6 },
            borderRadius: 2,
          }}
        >
          <Stack spacing={4}>
            {/* Header com Logo */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              {tenant?.photo && (
                <Box
                  sx={{
                    mb: 3,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={`data:image/jpeg;base64,${tenant.photo}`}
                    alt={tenant?.name || "Logo da empresa"}
                    style={{
                      maxWidth: "250px",
                      height: "auto",
                      borderRadius: "8px",
                    }}
                  />
                </Box>
              )}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {tenant?.name || "Nome da Empresa"}
              </Typography>
              {/* {tenant?.plan && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    fontWeight: 500,
                  }}
                >
                  Plano: {tenant.plan}
                </Typography>
              )} */}
            </Box>

            <Divider />

            {/* Informações de Contato */}
            <Box>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                Informações de Contato
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Phone sx={{ mr: 2, color: "primary.main" }} />
                  <Typography>
                    {tenant?.telefone || "Telefone não cadastrado"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LocationOn sx={{ mr: 2, color: "primary.main" }} />
                  <Typography>
                    {tenant?.endereco && `${tenant.endereco}, `}
                    {tenant?.bairro && `${tenant.bairro}, `}
                    {tenant?.cidade || "Endereço não cadastrado"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarToday sx={{ mr: 2, color: "primary.main" }} />
                  <Typography>
                    Cliente desde:{" "}
                    {tenant?.created_at
                      ? new Date(tenant.created_at).toLocaleDateString()
                      : "Data não disponível"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Suspense>
  );
}
