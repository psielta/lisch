"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  Select,
  MenuItem,
  Button,
  Skeleton,
  SelectChangeEvent,
} from "@mui/material";
import { TrendingUp } from "@mui/icons-material";

import {
  SalesDataSummary,
  FilterPeriod,
  FilterOption,
  SalesTotals,
} from "@/types/sales";
import SalesDetailModal from "./SalesDetailModal";
import { getTotalBrutoAndTotalPago } from "@/proxies/dashboard/get-total-bruto-and-total-pago";

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
  data: SalesDataSummary[],
  period: FilterPeriod
): SalesDataSummary[] => {
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

// Função para calcular totais
const calculateTotals = (filteredData: SalesDataSummary[]): SalesTotals => {
  return filteredData.reduce(
    (acc, item) => ({
      totalBruto: acc.totalBruto + Number(item.total_bruto || 0),
      totalPago: acc.totalPago + Number(item.total_pago || 0),
      totalDesconto: acc.totalDesconto + Number(item.total_desconto || 0),
      totalAcrescimo: acc.totalAcrescimo + Number(item.total_acrescimo || 0),
      totalTaxaEntrega:
        acc.totalTaxaEntrega + Number(item.total_taxa_entrega || 0),
      totalValorTotal:
        acc.totalValorTotal + Number(item.total_valor_total || 0),
    }),
    {
      totalBruto: 0,
      totalPago: 0,
      totalDesconto: 0,
      totalAcrescimo: 0,
      totalTaxaEntrega: 0,
      totalValorTotal: 0,
    }
  );
};

export default function SalesCard() {
  // Mudança 1: Padrão agora é "today" em vez de "last30days"
  const [period, setPeriod] = useState<FilterPeriod>("today");
  const [salesData, setSalesData] = useState<SalesDataSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [totals, setTotals] = useState<SalesTotals>({
    totalBruto: 0,
    totalPago: 0,
    totalDesconto: 0,
    totalAcrescimo: 0,
    totalTaxaEntrega: 0,
    totalValorTotal: 0,
  });

  // Carregar dados resumidos
  const loadSalesData = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getTotalBrutoAndTotalPago();
      setSalesData(data);

      // Calcular totais para o período selecionado
      const filteredData = filterDataByPeriod(data, period);
      const calculatedTotals = calculateTotals(filteredData);
      setTotals(calculatedTotals);
    } catch (error) {
      console.error("Erro ao carregar dados de vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recalcular totais quando o período mudar
  useEffect(() => {
    if (salesData.length > 0) {
      const filteredData = filterDataByPeriod(salesData, period);
      const calculatedTotals = calculateTotals(filteredData);
      setTotals(calculatedTotals);
    }
  }, [period, salesData]);

  // Carregar dados na inicialização
  useEffect(() => {
    loadSalesData();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getPeriodLabel = (): string => {
    return filterOptions.find((option) => option.value === period)?.label || "";
  };

  const handlePeriodChange = (event: SelectChangeEvent<FilterPeriod>): void => {
    setPeriod(event.target.value as FilterPeriod);
  };

  const handleModalOpen = (): void => {
    setModalOpen(true);
  };

  const handleModalClose = (): void => {
    setModalOpen(false);
  };

  return (
    <>
      <Card elevation={2} sx={{ height: "100%" }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TrendingUp sx={{ color: "primary.main", fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Vendas
            </Typography>
          </Box>

          {/* Dropdown de Período */}
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <Select value={period} onChange={handlePeriodChange} displayEmpty>
              {filterOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Valores */}
          <Box sx={{ mb: 3 }}>
            {/* Total Bruto */}
            <Box sx={{ mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Subtotal
                </Typography>
                {loading ? (
                  <Skeleton variant="text" width="60%" height={32} />
                ) : (
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {formatCurrency(totals.totalValorTotal)}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Desconto
                </Typography>
                {loading ? (
                  <Skeleton variant="text" width="60%" height={32} />
                ) : (
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "error.main" }}
                  >
                    {formatCurrency(totals.totalDesconto)}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Acréscimo
                </Typography>
                {loading ? (
                  <Skeleton variant="text" width="60%" height={32} />
                ) : (
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "info.main" }}
                  >
                    {formatCurrency(totals.totalAcrescimo)}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Taxa de Entrega
                </Typography>
                {loading ? (
                  <Skeleton variant="text" width="60%" height={32} />
                ) : (
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "warning.main" }}
                  >
                    {formatCurrency(totals.totalTaxaEntrega)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Bruto
              </Typography>
              {loading ? (
                <Skeleton variant="text" width="60%" height={32} />
              ) : (
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {formatCurrency(totals.totalBruto)}
                </Typography>
              )}
            </Box>

            {/* Total Pago */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Pago
              </Typography>
              {loading ? (
                <Skeleton variant="text" width="60%" height={32} />
              ) : (
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "success.main" }}
                >
                  {formatCurrency(totals.totalPago)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Botão Detalhar */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleModalOpen}
            disabled={loading}
          >
            Detalhar
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <SalesDetailModal
        open={modalOpen}
        onClose={handleModalClose}
        initialPeriod={period}
        periodLabel={getPeriodLabel()}
      />
    </>
  );
}
