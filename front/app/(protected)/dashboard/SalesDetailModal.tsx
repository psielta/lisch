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
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridValueFormatter,
  GridValueGetter,
} from "@mui/x-data-grid";
import { Close } from "@mui/icons-material";
import { SalesDataDetailed, FilterPeriod, FilterOption } from "@/types/sales";
import { getTotalBrutoAndTotalPagoDetailed } from "@/proxies/dashboard/get-total-bruto-and-total-pago-detailed";
import { Badge } from "@/components/catalyst-ui-kit/badge";

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
  // Remove o Z e trata como UTC
  const cleanDateString = dateString.replace("Z", "");
  const date = new Date(cleanDateString + "Z");
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

// Função para filtrar dados por período
const filterDataByPeriod = (
  data: SalesDataDetailed[],
  period: FilterPeriod
): SalesDataDetailed[] => {
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

interface SalesDetailModalProps {
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

export default function SalesDetailModal({
  open,
  onClose,
  initialPeriod,
  periodLabel,
}: SalesDetailModalProps) {
  const [period, setPeriod] = useState<FilterPeriod>(initialPeriod);
  const [detailedData, setDetailedData] = useState<SalesDataDetailed[]>([]);
  const [filteredData, setFilteredData] = useState<SalesDataDetailed[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totals, setTotals] = useState({
    valorTotal: 0,
    acrescimo: 0,
    taxaEntrega: 0,
    desconto: 0,
    valorBruto: 0,
    valorPago: 0,
  });

  // Função para calcular totais
  const calculateTotals = (data: SalesDataDetailed[]) => {
    const newTotals = data.reduce(
      (acc, item) => ({
        valorTotal: acc.valorTotal + (Number(item.valor_total) || 0),
        acrescimo: acc.acrescimo + (Number(item.acrescimo) || 0),
        taxaEntrega: acc.taxaEntrega + (Number(item.taxa_entrega) || 0),
        desconto: acc.desconto + 0, // Adicionar campo de desconto quando disponível
        valorBruto: acc.valorBruto + (Number(item.valor_bruto) || 0),
        valorPago: acc.valorPago + (Number(item.valor_pago) || 0),
      }),
      {
        valorTotal: 0,
        acrescimo: 0,
        taxaEntrega: 0,
        desconto: 0,
        valorBruto: 0,
        valorPago: 0,
      }
    );
    setTotals(newTotals);
  };

  // Colunas da DataGrid
  const columns: GridColDef[] = [
    {
      field: "codigo_pedido",
      headerName: "Código",
      width: 250,
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
      field: "finalizado",
      headerName: "Finalizado",
      width: 120,
      renderCell: (params) => {
        if (!params.value) return <Badge color="red">Não</Badge>;
        return params.value ? (
          <Badge color="green">Sim</Badge>
        ) : (
          <Badge color="red">Não</Badge>
        );
      },
    },
    {
      field: "valor_total",
      headerName: "Subtotal",
      width: 120,
      type: "number",
      valueFormatter: (value: string) => {
        if (!value) return "R$ 0,00";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(value));
      },
    },
    {
      field: "acrescimo",
      headerName: "Acréscimo",
      width: 120,
      type: "number",
      valueFormatter: (value: string) => {
        if (!value) return "R$ 0,00";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(value));
      },
    },
    {
      field: "taxa_entrega",
      headerName: "Taxa Entrega",
      width: 120,
      type: "number",
      valueFormatter: (value: string) => {
        if (!value) return "R$ 0,00";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(value));
      },
    },
    {
      field: "desconto",
      headerName: "Desconto",
      width: 120,
      type: "number",
      valueFormatter: (value: string) => {
        if (!value) return "R$ 0,00";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(value));
      },
    },
    {
      field: "valor_bruto",
      headerName: "Valor Bruto",
      width: 130,
      type: "number",
      valueGetter: (value, row) => {
        if (!value) return "R$ 0,00";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(value));
      },
    },
    {
      field: "valor_pago",
      headerName: "Valor Pago",
      width: 130,
      type: "number",
      valueGetter: (value, row) => {
        if (!value) return "R$ 0,00";
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(value));
      },
    },
  ];

  // Carregar dados detalhados
  const loadDetailedData = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getTotalBrutoAndTotalPagoDetailed();
      setDetailedData(data);

      // Aplicar filtro inicial
      const filtered = filterDataByPeriod(data, period);
      setFilteredData(filtered);
      calculateTotals(filtered);
    } catch (error) {
      console.error("Erro ao carregar dados detalhados:", error);
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
          <Skeleton variant="text" width="10%" />
          <Skeleton variant="text" width="15%" />
          <Skeleton variant="text" width="25%" />
          <Skeleton variant="text" width="15%" />
          <Skeleton variant="text" width="15%" />
          <Skeleton variant="text" width="15%" />
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
            xl: "80vh",
          },
          minWidth: {
            xs: "100%",
            md: "100%",
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
        }}
      >
        Vendas - {getPeriodLabel()}
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
              Subtotal
            </Typography>
            <Typography variant="h6">
              {formatCurrency(totals.valorTotal)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Acréscimo
            </Typography>
            <Typography variant="h6">
              {formatCurrency(totals.acrescimo)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Taxa Entrega
            </Typography>
            <Typography variant="h6">
              {formatCurrency(totals.taxaEntrega)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Desconto
            </Typography>
            <Typography variant="h6">
              {formatCurrency(totals.desconto)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Valor Bruto Total
            </Typography>
            <Typography variant="h6" color="success.main">
              {formatCurrency(totals.valorBruto)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Valor Pago Total
            </Typography>
            <Typography variant="h6" color="primary.main">
              {formatCurrency(totals.valorPago)}
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
