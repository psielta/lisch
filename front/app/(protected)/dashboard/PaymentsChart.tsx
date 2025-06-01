"use client";
import * as React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Skeleton,
  styled,
  Button,
  SelectChangeEvent,
  SelectProps,
} from "@mui/material";
import { TrendingUp, Info } from "@mui/icons-material";
import { VendasDiariasDto } from "@/types/payments";
import { getPagamentosPorDiaECategoria } from "@/proxies/dashboard/get-pagamentos-por-dia-e-categoria";
import PaymentsDetailModal from "./PaymentsDetailModal";

// Styled components para parecer com shadcn/ui
const StyledCard = styled(Card)(({ theme }) => ({}));

const StyledSelect = styled(Select)<SelectProps<FilterPeriod>>(({ theme }) => ({
  borderRadius: "8px",
  fontSize: "14px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.divider,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
}));

const CardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  gap: "16px",
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
}));

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
  data: VendasDiariasDto[],
  period: FilterPeriod
): VendasDiariasDto[] => {
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

// Formatador de valores para moeda
const valueFormatter = (value: number | null) => {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Cores para diferentes categorias de pagamento
const getCategoryColor = (categoria: string): string => {
  const colorMap: Record<string, string> = {
    Cartão: "#3b82f6", // blue-500
    Pix: "#10b981", // emerald-500
    Dinheiro: "#f59e0b", // amber-500
    Débito: "#8b5cf6", // violet-500
    Crédito: "#06b6d4", // cyan-500
    Outros: "#6b7280", // gray-500
  };
  return colorMap[categoria] || "#6b7280";
};

export function PaymentsChart() {
  const [period, setPeriod] = React.useState<FilterPeriod>("today");
  const [data, setData] = React.useState<VendasDiariasDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPagamentosPorDiaECategoria();
        setData(response || []);
        console.log("Dados de pagamentos carregados:", response);
      } catch (err) {
        setError("Erro ao carregar dados de pagamentos");
        console.error("Erro ao buscar dados:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar e processar dados para o gráfico
  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0)
      return {
        categories: [],
        series: [],
      };

    const filteredData = filterDataByPeriod(data, period);

    // Agrupar por categoria de pagamento e somar valores
    const categoryMap = new Map<string, number>();

    filteredData.forEach((item) => {
      const categoria = item.categoria_pagamento || "Outros";
      const currentValue = categoryMap.get(categoria) || 0;
      categoryMap.set(categoria, currentValue + (item.valor_liquido || 0));
    });

    // Converter para arrays e ordenar por valor
    const sortedEntries = Array.from(categoryMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    // Criar uma série para cada categoria
    const series = sortedEntries.map(([categoria, valor]) => ({
      data: [valor],
      label: categoria,
      color: getCategoryColor(categoria),
      valueFormatter,
    }));

    // Para o eixo X, usamos apenas uma categoria já que cada série representa uma categoria
    const categories = ["Pagamentos"];

    return {
      categories,
      series,
    };
  }, [data, period]);

  const handlePeriodChange: SelectProps<FilterPeriod>["onChange"] = (event) => {
    setPeriod(event.target.value as FilterPeriod);
  };

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const getPeriodLabel = () => {
    return filterOptions.find((option) => option.value === period)?.label || "";
  };

  if (loading) {
    return (
      <StyledCard>
        <CardHeader>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={250} height={28} />
            <Skeleton variant="text" width={350} height={20} sx={{ mt: 0.5 }} />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Skeleton
              variant="rectangular"
              width={160}
              height={40}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width={100}
              height={40}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </CardHeader>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              height: 400,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Skeleton
              variant="rectangular"
              width="100%"
              height={320}
              sx={{ borderRadius: 1 }}
            />
            <Box sx={{ display: "flex", justifyContent: "center", gap: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton variant="text" width={80} height={16} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton variant="text" width={90} height={16} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton variant="text" width={100} height={16} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  if (error) {
    return (
      <StyledCard>
        <CardHeader>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 600, fontSize: "18px" }}
            >
              Pagamentos por Categoria
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "14px" }}
            >
              Ocorreu um erro ao carregar os dados
            </Typography>
          </Box>
        </CardHeader>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="error" sx={{ fontSize: "14px" }}>
              {error}
            </Typography>
          </Box>
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <>
      <StyledCard>
        <CardHeader>
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUp sx={{ color: "primary.main", fontSize: 24 }} />
            <Box>
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontWeight: 600, fontSize: "18px", mb: 0.5 }}
              >
                Pagamentos por Categoria
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "14px" }}
              >
                Distribuição de pagamentos por forma para{" "}
                {getPeriodLabel().toLowerCase()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <StyledSelect
                value={period}
                onChange={(e) =>
                  handlePeriodChange(
                    e as SelectChangeEvent<FilterPeriod>,
                    undefined
                  )
                }
                displayEmpty
              >
                {filterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
            <Button
              variant="outlined"
              onClick={handleModalOpen}
              startIcon={<Info />}
              size="small"
            >
              Detalhar
            </Button>
          </Box>
        </CardHeader>
        <CardContent sx={{ p: "16px 24px 24px 24px" }}>
          {chartData.series.length === 0 ? (
            <Box
              sx={{
                height: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography color="text.secondary" sx={{ fontSize: "14px" }}>
                Nenhum pagamento encontrado para o período selecionado
              </Typography>
            </Box>
          ) : (
            <Box sx={{ width: "100%", height: 400 }}>
              <BarChart
                xAxis={[
                  {
                    data: chartData.categories,
                    scaleType: "band",
                    tickLabelStyle: {
                      fontSize: 12,
                      fill: "#666",
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Valor (R$)",
                    width: 80,
                    tickLabelStyle: {
                      fontSize: 12,
                      fill: "#666",
                    },
                  },
                ]}
                series={chartData.series}
                height={400}
                margin={{
                  left: 100,
                  right: 20,
                  top: 20,
                  bottom: 80,
                }}
                grid={{
                  horizontal: true,
                  vertical: false,
                }}
                slotProps={{
                  legend: {
                    position: {
                      vertical: "bottom" as const,
                      horizontal: "center" as const,
                    },
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </StyledCard>

      {/* Modal de Detalhes */}
      <PaymentsDetailModal
        open={modalOpen}
        onClose={handleModalClose}
        initialPeriod={period}
        periodLabel={getPeriodLabel()}
      />
    </>
  );
}
