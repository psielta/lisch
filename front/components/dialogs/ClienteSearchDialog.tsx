"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import debounce from "lodash.debounce";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Skeleton,
  Alert,
  Divider,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Stack,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Close,
  Person,
  Phone,
  LocationOn,
  Refresh,
  PersonAdd,
  Clear,
  AccountCircle,
  Home,
  Business,
} from "@mui/icons-material";
import { PedidoClienteDTO } from "@/rxjs/pedido/pedido.model";
import api from "@/lib/api";
import { PaginatedResponse } from "@/rxjs/clientes/cliente.model";
import { onlyDigits } from "@/utils/onlyDigits";

interface ClienteSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (cliente: PedidoClienteDTO) => void;
  onCreateNew?: () => void; // Callback para criar novo cliente
}

export default function ClienteSearchDialog({
  open,
  onClose,
  onSelect,
  onCreateNew,
}: ClienteSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<PedidoClienteDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const fetchClientes = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 2) {
          setHasSearched(false);
          setClientes([]);
          setError(null);
          return;
        }

        try {
          setLoading(true);
          setError(null);

          const resp = await api.get<PaginatedResponse<PedidoClienteDTO>>(
            `/clientes/smartsearch?search=${encodeURIComponent(
              query
            )}&page_size=50`
          );

          setClientes(resp.data.items);
          setHasSearched(true);
          setSelectedIndex(-1);
        } catch (error: any) {
          console.error("Erro ao buscar clientes:", error);
          setClientes([]);
          setHasSearched(true);
          setError(
            error?.response?.data?.message ||
              "Erro ao buscar clientes. Tente novamente."
          );
        } finally {
          setLoading(false);
        }
      }, 400),
    []
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      fetchClientes(value);
    },
    [fetchClientes]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!clientes.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < clientes.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : clientes.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < clientes.length) {
            handleSelectCliente(clientes[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [clientes, selectedIndex, onClose]
  );

  const handleSelectCliente = useCallback(
    (cliente: PedidoClienteDTO) => {
      onSelect(cliente);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setClientes([]);
    setHasSearched(false);
    setError(null);
    setSelectedIndex(-1);
  }, []);

  const handleRefresh = useCallback(() => {
    if (searchTerm.length >= 2) {
      fetchClientes(searchTerm);
    }
  }, [searchTerm, fetchClientes]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setClientes([]);
      setHasSearched(false);
      setError(null);
      setSelectedIndex(-1);
    }
  }, [open]);

  const formatPhone = (phone: string) => {
    if (!phone) return "";
    const digits = onlyDigits(phone);
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const formatAddress = (cliente: PedidoClienteDTO) => {
    const parts = [
      cliente.logradouro,
      cliente.numero,
      cliente.bairro,
      cliente.cidade,
      cliente.uf,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "Endereço não informado";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term || !text) return text;

    const regex = new RegExp(`(${term})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          style={{ backgroundColor: "#fff3cd", fontWeight: "bold" }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Search color="primary" />
            <Typography variant="h6" component="span" fontWeight={600}>
              Buscar Cliente
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Search Input */}
        <Card elevation={0} sx={{ mb: 2, border: 1, borderColor: "divider" }}>
          <CardContent sx={{ py: 2 }}>
            <TextField
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              fullWidth
              size="medium"
              label="Digite o nome, telefone ou documento"
              placeholder="Ex: João Silva, (11) 99999-9999..."
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Stack direction="row" spacing={0.5}>
                      {searchTerm && (
                        <Tooltip title="Limpar busca">
                          <IconButton size="small" onClick={handleClearSearch}>
                            <Clear fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasSearched && (
                        <Tooltip title="Atualizar resultados">
                          <IconButton size="small" onClick={handleRefresh}>
                            <Refresh fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              💡 Digite pelo menos 2 caracteres para buscar. Use ↑ ↓ para
              navegar e Enter para selecionar.
            </Typography>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Buscando clientes...
                </Typography>
              </Box>
              <Stack spacing={1}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} display="flex" alignItems="center" gap={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button size="small" onClick={handleRefresh}>
                Tentar novamente
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <Card
            elevation={0}
            sx={{
              border: 1,
              borderColor: "divider",
              maxHeight: 400,
              overflow: "hidden",
            }}
          >
            {clientes.length > 0 ? (
              <>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}{" "}
                    encontrado{clientes.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>

                <List sx={{ p: 0, maxHeight: 320, overflow: "auto" }}>
                  {clientes.map((cliente, index) => (
                    <ListItem key={cliente.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleSelectCliente(cliente)}
                        selected={index === selectedIndex}
                        sx={{
                          py: 2,
                          "&.Mui-selected": {
                            bgcolor: "primary.50",
                            borderLeft: 3,
                            borderLeftColor: "primary.main",
                          },
                          "&:hover": {
                            bgcolor: "grey.50",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 48,
                              height: 48,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600}>
                              {getInitials(cliente.nome_razao_social)}
                            </Typography>
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={
                            <Box>
                              <Typography
                                variant="subtitle1"
                                fontWeight={500}
                                gutterBottom
                              >
                                {highlightSearchTerm(
                                  cliente.nome_razao_social,
                                  searchTerm
                                )}
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={2}
                                flexWrap="wrap"
                              >
                                {/* {cliente.telefone && (
                                  <Chip
                                    icon={<Phone sx={{ fontSize: 16 }} />}
                                    label={formatPhone(cliente.telefone)}
                                    size="small"
                                    variant="outlined"
                                  />
                                )} */}
                                {cliente.celular && (
                                  <Chip
                                    icon={<Phone sx={{ fontSize: 16 }} />}
                                    label={formatPhone(cliente.celular)}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                )}
                              </Stack>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                              >
                                <LocationOn sx={{ fontSize: 16 }} />
                                {formatAddress(cliente)}
                              </Typography>

                              {cliente.cep && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mt: 0.5, display: "block" }}
                                >
                                  CEP: {cliente.cep}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <AccountCircle
                  sx={{ fontSize: 64, color: "grey.400", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum cliente encontrado
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Não encontramos clientes com o termo "{searchTerm}"
                </Typography>
                {onCreateNew && (
                  <Button
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    onClick={() => {
                      onCreateNew();
                      onClose();
                    }}
                    sx={{ mt: 1 }}
                  >
                    Cadastrar Novo Cliente
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Initial State */}
        {!loading && !hasSearched && (
          <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Search sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Pronto para buscar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Digite pelo menos 2 caracteres no campo acima para começar a
                buscar por clientes
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Você pode buscar por:
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  flexWrap="wrap"
                >
                  <Chip
                    icon={<Person />}
                    label="Nome"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Phone />}
                    label="Telefone"
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Business />}
                    label="Documento"
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "grey.50" }}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box>
            {onCreateNew && (
              <Button
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={() => {
                  onCreateNew();
                  onClose();
                }}
                color="success"
              >
                Novo Cliente
              </Button>
            )}
          </Box>

          <Button onClick={onClose} variant="contained" color="inherit">
            Fechar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
