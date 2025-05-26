"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@/context/auth-context";
import {
  ClienteResponse,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "@/rxjs/clientes/cliente.model";
import { useDispatch, useSelector } from "react-redux";
import { postOrPutClienteAction } from "@/rxjs/clientes/cliente.action";
import {
  selectpostOrPutClienteActionState,
  clearClienteState,
  selectClienteState,
} from "@/rxjs/clientes/cliente.slice";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number(cpf.charAt(10));
}

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const t = cnpj.length - 2;
  const d = cnpj.substring(t);
  const calc = (x: number[]) =>
    x.reduce((a, b, i) => a + b * Number(cnpj.charAt(i)), 0);
  const dv = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let d1 = calc(dv.slice(1)) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  if (d1 !== Number(d.charAt(0))) return false;
  let d2 = calc(dv) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return d2 === Number(d.charAt(1));
}

// Schema de validação com Zod para Clientes
const clienteSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid("Tenant ID é obrigatório"),
  tipo_pessoa: z.enum(["F", "J"], {
    required_error: "Tipo de pessoa é obrigatório",
  }),
  nome_razao_social: z
    .string()
    .min(3, "Mín. 3 caracteres")
    .max(255, "Máx. 255 caracteres"),
  nome_fantasia: z.string().max(255, "Máx. 255 caracteres").optional(),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || validarCPF(val), {
      message: "CPF inválido",
    }),
  cnpj: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || validarCNPJ(val), {
      message: "CNPJ inválido",
    }),
  rg: z.string().max(20, "Máx. 20 caracteres").optional(),
  ie: z.string().max(20, "Máx. 20 caracteres").optional(),
  im: z.string().max(20, "Máx. 20 caracteres").optional(),
  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("E-mail inválido")
    .max(255, "Máx. 255 caracteres")
    .optional()
    .or(z.literal("")),
  telefone: z.string().max(20, "Máx. 20 caracteres").optional(),
  celular: z.string().max(20, "Máx. 20 caracteres").optional(),
  cep: z
    .string()
    .regex(/^\d{8}$/, "CEP deve ter 8 dígitos")
    .optional()
    .or(z.literal("")),
  logradouro: z.string().max(255, "Máx. 255 caracteres").optional(),
  numero: z.string().max(10, "Máx. 10 caracteres").optional(),
  complemento: z.string().max(100, "Máx. 100 caracteres").optional(),
  bairro: z.string().max(100, "Máx. 100 caracteres").optional(),
  cidade: z.string().max(100, "Máx. 100 caracteres").optional(),
  uf: z
    .string()
    .length(2, "UF deve ter 2 caracteres")
    .optional()
    .or(z.literal("")),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

// Estados brasileiros
const estadosBrasileiros = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

interface DialogClienteProps {
  open: boolean;
  onClose: () => void;
  user: User;
  cliente?: ClienteResponse | null;
  onClienteSaved: (cliente: ClienteResponse) => void;
}

function DialogCliente({
  open,
  onClose,
  user,
  cliente,
  onClienteSaved,
}: DialogClienteProps) {
  const dispatch = useDispatch();
  const postOrPutClienteState = useSelector(selectpostOrPutClienteActionState);
  const isEditing = cliente?.id ? true : false;
  const isSubmitting = postOrPutClienteState === "pending";

  // Valores padrão para o formulário
  const defaultValues: ClienteFormValues = {
    id: cliente?.id || undefined,
    tenant_id: user.tenant_id,
    tipo_pessoa: cliente?.tipo_pessoa || "F",
    nome_razao_social: cliente?.nome_razao_social || "",
    nome_fantasia: cliente?.nome_fantasia || "",
    cpf: cliente?.cpf || "",
    cnpj: cliente?.cnpj || "",
    rg: cliente?.rg || "",
    ie: cliente?.ie || "",
    im: cliente?.im || "",
    data_nascimento: cliente?.data_nascimento || "",
    email: cliente?.email || "",
    telefone: cliente?.telefone || "",
    celular: cliente?.celular || "",
    cep: cliente?.cep || "",
    logradouro: cliente?.logradouro || "",
    numero: cliente?.numero || "",
    complemento: cliente?.complemento || "",
    bairro: cliente?.bairro || "",
    cidade: cliente?.cidade || "",
    uf: cliente?.uf || "",
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  });

  const tipoPessoa = watch("tipo_pessoa");

  const selectCliente = useSelector(selectClienteState);

  // Reset form when cliente changes or dialog opens
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, cliente, reset]);

  // Efeito para lidar com o sucesso no envio do formulário
  useEffect(() => {
    if (postOrPutClienteState === "completed") {
      toast.success("Cliente salvo com sucesso");
      // buscar cliente no store, se for edicao buscar pelo pedido com maior created_at, se nao usar id
      let _cliente = null;
      if (isEditing) {
        _cliente = selectCliente.clientes.items.find(
          (c) => c.id === cliente?.id
        );
      } else {
        _cliente = selectCliente.clientes.items.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      }
      if (_cliente) {
        onClienteSaved(_cliente);
      }
      // Limpar estado do store
      dispatch(clearClienteState());
      onClose();
    } else if (postOrPutClienteState === "error") {
      toast.error("Erro ao salvar cliente");
    }
  }, [postOrPutClienteState, onClose, dispatch]);

  // Função para enviar o formulário
  const onSubmit = (data: ClienteFormValues) => {
    const cleanedData = {
      ...data,
      nome_fantasia: data.nome_fantasia || undefined,
      cpf: data.cpf || undefined,
      cnpj: data.cnpj || undefined,
      rg: data.rg || undefined,
      ie: data.ie || undefined,
      im: data.im || undefined,
      data_nascimento: data.data_nascimento || undefined,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      celular: data.celular || undefined,
      cep: data.cep || undefined,
      logradouro: data.logradouro || undefined,
      numero: data.numero || undefined,
      complemento: data.complemento || undefined,
      bairro: data.bairro || undefined,
      cidade: data.cidade || undefined,
      uf: data.uf || undefined,
    };

    if (isEditing && cleanedData.id) {
      dispatch(postOrPutClienteAction.request(cleanedData as UpdateClienteDTO));
    } else {
      const { id, ...rest } = cleanedData;
      dispatch(postOrPutClienteAction.request(rest as CreateClienteDTO));
    }
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 11);
  };

  // Formatação de CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 14);
  };

  // Formatação de CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 8);
  };

  // Formatação de telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 11);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      dispatch(clearClienteState());
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: "90vh" },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isEditing ? "Editar Cliente" : "Novo Cliente"}
          </Typography>
          <IconButton onClick={handleClose} disabled={isSubmitting}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers sx={{ maxHeight: "70vh", overflowY: "auto" }}>
          <Grid container spacing={3}>
            {/* Campo oculto para ID */}
            <Controller
              name="id"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Campo oculto para tenant_id */}
            <Controller
              name="tenant_id"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* Tipo de Pessoa */}
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Pessoa</InputLabel>
                <Controller
                  name="tipo_pessoa"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Tipo de Pessoa"
                      error={Boolean(errors.tipo_pessoa)}
                    >
                      <MenuItem value="F">Pessoa Física</MenuItem>
                      <MenuItem value="J">Pessoa Jurídica</MenuItem>
                    </Select>
                  )}
                />
                {errors.tipo_pessoa && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.tipo_pessoa.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Nome/Razão Social */}
            <Grid size={12}>
              <Controller
                name="nome_razao_social"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={
                      tipoPessoa === "F" ? "Nome Completo" : "Razão Social"
                    }
                    error={Boolean(errors.nome_razao_social)}
                    helperText={errors.nome_razao_social?.message}
                    required
                  />
                )}
              />
            </Grid>

            {/* Nome Fantasia (apenas para PJ) */}
            {tipoPessoa === "J" && (
              <Grid size={12}>
                <Controller
                  name="nome_fantasia"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nome Fantasia"
                      error={Boolean(errors.nome_fantasia)}
                      helperText={errors.nome_fantasia?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* CPF/CNPJ e RG/IE */}
            <Grid size={12}>
              {tipoPessoa === "F" ? (
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CPF"
                      placeholder="00000000000"
                      error={Boolean(errors.cpf)}
                      helperText={errors.cpf?.message}
                      onChange={(e) =>
                        field.onChange(formatCPF(e.target.value))
                      }
                    />
                  )}
                />
              ) : (
                <Controller
                  name="cnpj"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CNPJ"
                      placeholder="00000000000000"
                      error={Boolean(errors.cnpj)}
                      helperText={errors.cnpj?.message}
                      onChange={(e) =>
                        field.onChange(formatCNPJ(e.target.value))
                      }
                    />
                  )}
                />
              )}
            </Grid>

            <Grid size={12}>
              {tipoPessoa === "F" ? (
                <Controller
                  name="rg"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="RG"
                      error={Boolean(errors.rg)}
                      helperText={errors.rg?.message}
                    />
                  )}
                />
              ) : (
                <Controller
                  name="ie"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Inscrição Estadual"
                      error={Boolean(errors.ie)}
                      helperText={errors.ie?.message}
                    />
                  )}
                />
              )}
            </Grid>

            {/* Inscrição Municipal (apenas para PJ) */}
            {tipoPessoa === "J" && (
              <Grid size={12}>
                <Controller
                  name="im"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Inscrição Municipal"
                      error={Boolean(errors.im)}
                      helperText={errors.im?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Data de Nascimento (apenas para PF) */}
            {tipoPessoa === "F" && (
              <Grid size={12}>
                <Controller
                  name="data_nascimento"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Data de Nascimento"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={Boolean(errors.data_nascimento)}
                      helperText={errors.data_nascimento?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* E-mail */}
            <Grid size={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="E-mail"
                    type="email"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {/* Telefones */}
            <Grid size={12}>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Telefone"
                    error={Boolean(errors.telefone)}
                    helperText={errors.telefone?.message}
                    onChange={(e) =>
                      field.onChange(formatTelefone(e.target.value))
                    }
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Controller
                name="celular"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Celular"
                    error={Boolean(errors.celular)}
                    helperText={errors.celular?.message}
                    onChange={(e) =>
                      field.onChange(formatTelefone(e.target.value))
                    }
                  />
                )}
              />
            </Grid>

            {/* CEP */}
            <Grid size={12}>
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CEP"
                    placeholder="00000000"
                    error={Boolean(errors.cep)}
                    helperText={errors.cep?.message}
                    onChange={(e) => field.onChange(formatCEP(e.target.value))}
                  />
                )}
              />
            </Grid>

            {/* Logradouro */}
            <Grid size={12}>
              <Controller
                name="logradouro"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Logradouro"
                    error={Boolean(errors.logradouro)}
                    helperText={errors.logradouro?.message}
                  />
                )}
              />
            </Grid>

            {/* Número */}
            <Grid size={12}>
              <Controller
                name="numero"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número"
                    error={Boolean(errors.numero)}
                    helperText={errors.numero?.message}
                  />
                )}
              />
            </Grid>

            {/* Complemento */}
            <Grid size={12}>
              <Controller
                name="complemento"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Complemento"
                    error={Boolean(errors.complemento)}
                    helperText={errors.complemento?.message}
                  />
                )}
              />
            </Grid>

            {/* Bairro */}
            <Grid size={12}>
              <Controller
                name="bairro"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Bairro"
                    error={Boolean(errors.bairro)}
                    helperText={errors.bairro?.message}
                  />
                )}
              />
            </Grid>

            {/* Cidade */}
            <Grid size={12}>
              <Controller
                name="cidade"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cidade"
                    error={Boolean(errors.cidade)}
                    helperText={errors.cidade?.message}
                  />
                )}
              />
            </Grid>

            {/* UF */}
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>UF</InputLabel>
                <Controller
                  name="uf"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="UF" error={Boolean(errors.uf)}>
                      <MenuItem value="">Selecione</MenuItem>
                      {estadosBrasileiros.map((estado) => (
                        <MenuItem key={estado.sigla} value={estado.sigla}>
                          {estado.sigla} - {estado.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.uf && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {errors.uf.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default DialogCliente;
