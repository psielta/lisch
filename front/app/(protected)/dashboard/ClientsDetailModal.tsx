"use client";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Avatar,
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridValueFormatter } from "@mui/x-data-grid";
import { Close, TrendingUp, CakeOutlined, People } from "@mui/icons-material";
import {
  ClienteMaisFaturadosNosUltimos30Dias_Item,
  ClienteAniversario,
} from "@/types/clients";

interface ClientsDetailModalProps {
  open: boolean;
  onClose: () => void;
  type: "faturados" | "aniversarios";
  topClients: ClienteMaisFaturadosNosUltimos30Dias_Item[];
  birthdayClients: ClienteAniversario[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
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

export default function ClientsDetailModal({
  open,
  onClose,
  type,
  topClients,
  birthdayClients,
}: ClientsDetailModalProps) {
  // Colunas para clientes mais faturados
  const topClientsColumns: GridColDef[] = [
    {
      field: "posicao",
      headerName: "Pos.",
      width: 70,
      renderCell: (params) => {
        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
        const position = rowIndex + 1;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {position}º
            </Typography>
            {position <= 3 && (
              <Chip
                label="TOP"
                size="small"
                color={position === 1 ? "success" : "primary"}
                sx={{ height: 18, fontSize: "10px" }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "cliente_avatar",
      headerName: "Avatar",
      width: 80,
      renderCell: (params) => {
        return (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "12px",
              bgcolor: "primary.main",
            }}
          >
            {getInitials(params.row.cliente)}
          </Avatar>
        );
      },
    },
    {
      field: "cliente",
      headerName: "Cliente",
      width: 300,
      valueGetter: (value) => {
        if (!value) return "Cliente não informado";
        return value;
      },
    },
    {
      field: "valor_liquido",
      headerName: "Valor Líquido",
      width: 150,
      type: "number",
      valueFormatter: (value: number) => {
        if (!value) return "R$ 0,00";
        return formatCurrency(value);
      },
    },
    {
      field: "id_cliente",
      headerName: "ID Cliente",
      width: 150,
    },
  ];

  // Colunas para aniversariantes
  const birthdayClientsColumns: GridColDef[] = [
    {
      field: "cliente_avatar",
      headerName: "Avatar",
      width: 80,
      renderCell: (params) => {
        return (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "12px",
              bgcolor: "warning.main",
            }}
          >
            {getInitials(params.row.cliente)}
          </Avatar>
        );
      },
    },
    {
      field: "cliente",
      headerName: "Cliente",
      width: 300,
      valueGetter: (value) => {
        if (!value) return "Cliente não informado";
        return value;
      },
    },
    {
      field: "data_nascimento",
      headerName: "Data de Nascimento",
      width: 180,
      valueFormatter: (value: string) => {
        if (!value) return "";
        return formatDate(value);
      },
    },
    {
      field: "proximo_aniversario",
      headerName: "Próximo Aniversário",
      width: 180,
      valueFormatter: (value: string) => {
        if (!value) return "";
        return formatDate(value);
      },
      renderCell: (params) => {
        const date = formatDate(params.value);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CakeOutlined sx={{ color: "warning.main", fontSize: 16 }} />
            <Typography variant="body2">{date}</Typography>
          </Box>
        );
      },
    },
    {
      field: "id",
      headerName: "ID Cliente",
      width: 150,
    },
  ];

  const getModalData = () => {
    if (type === "faturados") {
      return {
        title: "Clientes Mais Faturados (Últimos 30 dias)",
        icon: <TrendingUp sx={{ color: "success.main", fontSize: 24 }} />,
        data: topClients,
        columns: topClientsColumns,
        summary: {
          total: topClients.reduce(
            (acc, client) => acc + client.valor_liquido,
            0
          ),
          count: topClients.length,
        },
      };
    } else {
      return {
        title: "Aniversariantes (Próximos 7 dias)",
        icon: <CakeOutlined sx={{ color: "warning.main", fontSize: 24 }} />,
        data: birthdayClients,
        columns: birthdayClientsColumns,
        summary: {
          count: birthdayClients.length,
        },
      };
    }
  };

  const modalData = getModalData();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          height: {
            xs: "100vh",
            md: "90vh",
            xl: "80vh",
          },
          minWidth: {
            xs: "100%",
            md: "90%",
            xl: "70vw",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {modalData.icon}
          <Typography variant="h6">{modalData.title}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Informações de resumo */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <People sx={{ color: "primary.main" }} />
          <Typography variant="body1">
            Total de {modalData.summary.count} cliente(s) encontrado(s)
          </Typography>
          {type === "faturados" && modalData.summary.total && (
            <Typography
              variant="body2"
              color="success.main"
              sx={{ fontWeight: 600 }}
            >
              • Faturamento Total: {formatCurrency(modalData.summary.total)}
            </Typography>
          )}
        </Box>

        {/* DataGrid */}
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={modalData.data}
            columns={modalData.columns}
            getRowId={(row) => (type === "faturados" ? row.id_cliente : row.id)}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-row:hover": {
                backgroundColor:
                  type === "faturados" ? "success.50" : "warning.50",
              },
            }}
          />
        </Box>

        {/* Resumo adicional para faturados */}
        {type === "faturados" && modalData.summary.total && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              backgroundColor: "success.50",
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total de Clientes
              </Typography>
              <Typography variant="h6" color="primary.main">
                {modalData.summary.count}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Faturamento Total (30 dias)
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(modalData.summary.total)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Ticket Médio
              </Typography>
              <Typography variant="h6" color="info.main">
                {formatCurrency(
                  modalData.summary.total / modalData.summary.count
                )}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Resumo adicional para aniversariantes */}
        {type === "aniversarios" && (
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mt: 2,
              display: "flex",
              justifyContent: "center",
              backgroundColor: "warning.50",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Aniversariantes nos Próximos 7 Dias
              </Typography>
              <Typography variant="h6" color="warning.main">
                {modalData.summary.count} cliente(s)
              </Typography>
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
