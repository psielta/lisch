"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Box,
  Skeleton,
  IconButton,
  SelectChangeEvent,
  Paper,
  Chip,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridValueFormatter,
  GridValueGetter,
} from "@mui/x-data-grid";
import { Close, Edit } from "@mui/icons-material";
import { PedidoDetalhadoDto } from "@/types/payments";
import { getPagamentosResumoUlt3Meses } from "@/proxies/dashboard/get-pagamentos-resumo-ult-3-meses";
import { Badge } from "@/components/catalyst-ui-kit/badge";
import { useRouter } from "next/navigation";

// Tipos para o período de filtro
type FilterPeriod =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "last3months";

interface FilterOption {
  value: FilterPeriod;
  label: string;
}

const filterOptions: FilterOption[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last7days", label: "Últimos 07 dias" },
  { value: "last30days", label: "Últimos 30 dias" },
  { value: "last3months", label: "Últimos 03 meses" },
];

// Função para normalizar data para UTC (sem horário)
const normalizeToUTC = (date: Date): Date => {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
};

// Função para converter string de data do backend para Date UTC
const parseBackendDate = (dateString: string): Date => {
  const cleanDateString = dateString.replace("Z", "");
  const date = new Date(cleanDateString + "Z");
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

// Função para filtrar dados por período
const filterDataByPeriod = (
  data: PedidoDetalhadoDto[],
  period: FilterPeriod
): PedidoDetalhadoDto[] => {
  const now = new Date();
  const today = normalizeToUTC(now);

  return data.filter((item) => {
    const itemDate = parseBackendDate(item.dia);

    switch (period) {
      case "today":
        return itemDate.getTime() === today.getTime();

      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        return itemDate.getTime() === yesterday.getTime();

      case "last7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        return itemDate >= sevenDaysAgo;

      case "last30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        return itemDate >= thirtyDaysAgo;

      case "last3months":
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
        return itemDate >= threeMonthsAgo;

      default:
        return true;
    }
  });
};

interface PaymentsDetailModalProps {
  open: boolean;
  onClose: () => void;
  initialPeriod: FilterPeriod;
  periodLabel: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Função para obter cor da categoria de pagamento
const getCategoryColor = (
  categoria: string
): "primary" | "secondary" | "success" | "warning" | "error" => {
  const colorMap: Record<
    string,
    "primary" | "secondary" | "success" | "warning" | "error"
  > = {
    Cartão: "primary",
    Pix: "success",
    Dinheiro: "warning",
    Débito: "secondary",
    Crédito: "primary",
  };
  return colorMap[categoria] || "secondary";
};

// Função para obter cor do status
const getStatusColor = (
  status: string
): "primary" | "secondary" | "success" | "warning" | "error" => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("pago") || statusLower.includes("paid"))
    return "success";
  if (statusLower.includes("cancelado") || statusLower.includes("cancelled"))
    return "error";
  if (statusLower.includes("faturado") || statusLower.includes("invoiced"))
    return "primary";
  if (statusLower.includes("rascunho") || statusLower.includes("draft"))
    return "warning";
  return "secondary";
};

export default function PaymentsDetailModal({
  open,
  onClose,
  initialPeriod,
  periodLabel,
}: PaymentsDetailModalProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<FilterPeriod>(initialPeriod);
  const [detailedData, setDetailedData] = useState<PedidoDetalhadoDto[]>([]);
  const [filteredData, setFilteredData] = useState<PedidoDetalhadoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totals, setTotals] = useState({
    valorPago: 0,
    valorLiquido: 0,
  });

  // Função para calcular totais
  const calculateTotals = (data: PedidoDetalhadoDto[]) => {
    const newTotals = data.reduce(
      (acc, item) => ({
        valorPago: acc.valorPago + (Number(item.valor_pago) || 0),
        valorLiquido: acc.valorLiquido + (Number(item.valor_liquido) || 0),
      }),
      {
        valorPago: 0,
        valorLiquido: 0,
      }
    );
    setTotals(newTotals);
  };

  // Colunas da DataGrid
  const columns: GridColDef[] = [
    {
      field: "id_pedido",
      headerName: "Ações",
      width: 70,
      renderCell: (params) => {
        return (
          <IconButton
            onClick={() => {
              router.push(`/gerenciar-vendas/${params.value}`);
            }}
            title="Editar"
            size="small"
          >
            <Edit />
          </IconButton>
        );
      },
    },
    {
      field: "codigo_pedido",
      headerName: "Código",
      width: 200,
    },
    {
      field: "data_pedido_br",
      headerName: "Data",
      width: 130,
      valueFormatter: (value: string) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("pt-BR");
      },
    },
    {
      field: "cliente",
      headerName: "Cliente",
      width: 200,
      valueGetter: (value, row) => {
        if (!value) return "Cliente não informado";
        return value;
      },
    },
    {
      field: "categoria_pagamento",
      headerName: "Categoria Pagamento",
      width: 150,
      renderCell: (params) => {
        if (!params.value) return <Chip label="N/A" size="small" />;
        return (
          <Chip
            label={params.value}
            size="small"
            color={getCategoryColor(params.value)}
            variant="outlined"
          />
        );
      },
    },
    {
      field: "valor_pago",
      headerName: "Valor Pago",
      width: 130,
      type: "number",
      valueFormatter: (value: number) => {
        if (!value) return "R$ 0,00";
        return formatCurrency(value);
      },
    },
    {
      field: "valor_liquido",
      headerName: "Valor Líquido",
      width: 130,
      type: "number",
      valueFormatter: (value: number) => {
        if (!value) return "R$ 0,00";
        return formatCurrency(value);
      },
    },
    {
      field: "created_br",
      headerName: "Criado em",
      width: 160,
      valueFormatter: (value: string) => {
        if (!value) return "";
        return new Date(value).toLocaleString("pt-BR");
      },
    },
  ];

  // Carregar dados detalhados
  const loadDetailedData = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getPagamentosResumoUlt3Meses();

      // O endpoint retorna um array de PedidoDetalhadoDto
      const dataArray = Array.isArray(data) ? data : [];
      setDetailedData(dataArray);

      // Aplicar filtro inicial
      const filtered = filterDataByPeriod(dataArray, period);
      setFilteredData(filtered);
      calculateTotals(filtered);
    } catch (error) {
      console.error("Erro ao carregar dados detalhados:", error);
      setDetailedData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtro quando o período mudar
  useEffect(() => {
    if (detailedData.length > 0) {
      const filtered = filterDataByPeriod(detailedData, period);
      setFilteredData(filtered);
      calculateTotals(filtered);
    }
  }, [period, detailedData]);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open) {
      setPeriod(initialPeriod);
      loadDetailedData();
    }
  }, [open, initialPeriod]);

  const getPeriodLabel = (): string => {
    return filterOptions.find((option) => option.value === period)?.label || "";
  };

  const handlePeriodChange = (event: SelectChangeEvent<FilterPeriod>): void => {
    setPeriod(event.target.value as FilterPeriod);
  };

  const LoadingSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(10)].map((_, index) => (
        <Box key={index} sx={{ display: "flex", gap: 2, mb: 1 }}>
          <Skeleton variant="text" width="8%" />
          <Skeleton variant="text" width="15%" />
          <Skeleton variant="text" width="12%" />
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="10%" />
          <Skeleton variant="text" width="12%" />
          <Skeleton variant="text" width="10%" />
          <Skeleton variant="text" width="10%" />
        </Box>
      ))}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          height: {
            xs: "100vh",
            md: "100vh",
            xl: "85vh",
          },
          minWidth: {
            xs: "100%",
            md: "100%",
            xl: "85vw",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detalhes dos Pagamentos - {getPeriodLabel()}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Filtro de Período */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body1">Período:</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={period} onChange={handlePeriodChange}>
              {filterOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            ({filteredData.length} pedidos encontrados)
          </Typography>
        </Box>

        {/* DataGrid ou Loading */}
        <Box sx={{ height: 400, width: "100%" }}>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <DataGrid
              rows={filteredData}
              columns={columns}
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              disableRowSelectionOnClick
            />
          )}
        </Box>

        {/* Totais Summary */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Valor Pago
            </Typography>
            <Typography variant="h6" color="primary.main">
              {formatCurrency(totals.valorPago)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Valor Líquido
            </Typography>
            <Typography variant="h6" color="success.main">
              {formatCurrency(totals.valorLiquido)}
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
