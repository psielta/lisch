"use client";

import { useState, useMemo } from "react";
import debounce from "lodash.debounce";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { PedidoClienteDTO, PaginatedResponse } from "@/rxjs/pedido/pedido.model";
import api from "@/lib/api";

interface ClienteSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (cliente: PedidoClienteDTO) => void;
}

export default function ClienteSearchDialog({
  open,
  onClose,
  onSelect,
}: ClienteSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<PedidoClienteDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchClientes = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setHasSearched(false);
          setClientes([]);
          return;
        }
        try {
          setLoading(true);
          const resp = await api.get<PaginatedResponse<PedidoClienteDTO>>(
            `/clientes/smartsearch?search=${query}&page_size=50`
          );
          setClientes(resp.data.items);
          setHasSearched(true);
        } catch (error) {
          console.error("Erro ao buscar clientes:", error);
          setClientes([]);
          setHasSearched(true);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchClientes(value);
  };

  const columns: GridColDef[] = [
    { field: "nome_razao_social", headerName: "Nome", flex: 1, minWidth: 150 },
    { field: "telefone", headerName: "Telefone", width: 140 },
    { field: "celular", headerName: "Celular", width: 140 },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Buscar Cliente por Nome</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <TextField
          value={searchTerm}
          onChange={handleInputChange}
          fullWidth
          size="small"
          label="Pesquisar"
        />
        <Box sx={{ height: 400, width: "100%", mt: 2 }}>
          <DataGrid
            rows={clientes}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            onRowDoubleClick={(params) => {
              onSelect(params.row as PedidoClienteDTO);
              onClose();
            }}
            disableRowSelectionOnClick
            localeText={{
              noRowsLabel: hasSearched
                ? "Nenhum cliente encontrado"
                : "Digite pelo menos 3 caracteres para buscar",
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
