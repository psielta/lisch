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
import { PedidoClienteDTO } from "@/rxjs/pedido/pedido.model";
import api from "@/lib/api";
import { PaginatedResponse } from "@/rxjs/clientes/cliente.model";

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
    {
      field: "nome_razao_social",
      headerName: "Nome/Razão Social",
      flex: 1,
      minWidth: 200,
    },
    { field: "celular", headerName: "Celular ou Telefone", width: 140 },
    { field: "logradouro", headerName: "Endereço", width: 140 },
    { field: "numero", headerName: "Número", width: 140 },
    { field: "bairro", headerName: "Bairro", width: 140 },
    { field: "cidade", headerName: "Cidade", width: 140 },
    { field: "uf", headerName: "UF", width: 140 },
    { field: "cep", headerName: "CEP", width: 140 },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Buscar Cliente por Nome</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
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
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <div className="flex gap-10 items-center justify-between">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            Dê um duplo click no cliente para selecionar
          </div>
          <Button onClick={onClose} variant="outlined" color="primary">
            Cancelar
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
