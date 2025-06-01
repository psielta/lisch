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

const filterOptions: FilterOption[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last7days", label: "Últimos 07 dias" },
  { value: "last30days", label: "Últimos 30 dias" },
  { value: "last3months", label: "Últimos 03 meses" },
];

// Função para filtrar dados por período
const filterDataByPeriod = (
  data: SalesDataDetailed[],
  period: FilterPeriod
): SalesDataDetailed[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return data.filter((item) => {
    const itemDate = new Date(item.dia);

    switch (period) {
      case "today":
        return itemDate.getTime() === today.getTime();

      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return itemDate.getTime() === yesterday.getTime();

      case "last7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return itemDate >= sevenDaysAgo;

      case "last30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return itemDate >= thirtyDaysAgo;

      case "last3months":
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
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

  // Colunas da DataGrid
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 90,
      type: "number",
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
      field: "status_descr",
      headerName: "Status",
      width: 120,
      valueGetter: (value, row) => {
        if (!value) return "N/A";
        return value;
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "80vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Vendas - {getPeriodLabel()}</Typography>
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
              sx={{
                "& .MuiDataGrid-cell": {
                  fontSize: "0.875rem",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "grey.50",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                },
              }}
              localeText={{
                noRowsLabel: "Nenhum pedido encontrado para este período",
              }}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
