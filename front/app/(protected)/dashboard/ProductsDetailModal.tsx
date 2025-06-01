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
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridValueFormatter } from "@mui/x-data-grid";
import { Close, TrendingUp, Inventory, Star } from "@mui/icons-material";
import { ProductMaisVendidosItem } from "@/types/Products";

interface ProductsDetailModalProps {
  open: boolean;
  onClose: () => void;
  products: ProductMaisVendidosItem[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function ProductsDetailModal({
  open,
  onClose,
  products,
}: ProductsDetailModalProps) {
  // Colunas para produtos mais vendidos
  const productsColumns: GridColDef[] = [
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
            {position <= 5 && (
              <Star
                sx={{
                  color: position === 1 ? "success.main" : "primary.main",
                  fontSize: 16,
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "produto",
      headerName: "Produto",
      width: 350,
      valueGetter: (value) => {
        if (!value) return "Produto não informado";
        return value;
      },
    },
    {
      field: "unidades",
      headerName: "Unidades Vendidas",
      width: 150,
      type: "number",
      renderCell: (params) => {
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              un.
            </Typography>
          </Box>
        );
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
      field: "valor_medio_unidade",
      headerName: "Valor Médio/Un.",
      width: 150,
      type: "number",
      renderCell: (params) => {
        const valorLiquido = params.row.valor_liquido || 0;
        const unidades = params.row.unidades || 1;
        const valorMedio = valorLiquido / unidades;

        return (
          <Typography variant="body2" color="info.main">
            {formatCurrency(valorMedio)}
          </Typography>
        );
      },
    },
    {
      field: "id_produto",
      headerName: "ID Produto",
      width: 150,
    },
  ];

  // Calcular estatísticas
  const stats = {
    totalProducts: products.length,
    totalUnidades: products.reduce((acc, product) => acc + product.unidades, 0),
    totalValor: products.reduce(
      (acc, product) => acc + product.valor_liquido,
      0
    ),
    valorMedioGeral:
      products.length > 0
        ? products.reduce((acc, product) => acc + product.valor_liquido, 0) /
          products.length
        : 0,
  };

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
            xl: "80vw",
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
          <TrendingUp sx={{ color: "success.main", fontSize: 24 }} />
          <Typography variant="h6">
            Produtos Mais Vendidos (Últimos 30 dias)
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Informações de resumo */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Inventory sx={{ color: "primary.main" }} />
            <Typography variant="body1">
              {stats.totalProducts} produto(s) encontrado(s)
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="success.main"
            sx={{ fontWeight: 600 }}
          >
            • {stats.totalUnidades} unidades vendidas
          </Typography>
          <Typography
            variant="body2"
            color="info.main"
            sx={{ fontWeight: 600 }}
          >
            • Faturamento: {formatCurrency(stats.totalValor)}
          </Typography>
        </Box>

        {/* DataGrid */}
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={products}
            columns={productsColumns}
            getRowId={(row) => row.id_produto}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "success.50",
              },
            }}
          />
        </Box>

        {/* Resumo estatístico */}
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
              Total de Produtos
            </Typography>
            <Typography variant="h6" color="primary.main">
              {stats.totalProducts}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Unidades Vendidas
            </Typography>
            <Typography variant="h6" color="success.main">
              {stats.totalUnidades.toLocaleString("pt-BR")}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Faturamento Total
            </Typography>
            <Typography variant="h6" color="success.main">
              {formatCurrency(stats.totalValor)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Valor Médio por Produto
            </Typography>
            <Typography variant="h6" color="info.main">
              {formatCurrency(stats.valorMedioGeral)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Valor Médio por Unidade
            </Typography>
            <Typography variant="h6" color="info.main">
              {formatCurrency(stats.totalValor / stats.totalUnidades)}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
