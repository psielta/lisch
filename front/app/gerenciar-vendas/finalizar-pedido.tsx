import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import {
  PagamentoContasService,
  PedidoPagamentoCreateDTO,
  ContasReceberCreateDTO,
} from "@/proxies/pagamentos";
import { PedidoResponse } from "@/rxjs/pedido/pedido.model";
import api from "@/lib/api";
import { toast } from "sonner";

/*
 * Componente "FinalizarPedido"
 * ---------------------------------------------------------------------------
 * 👇 Props
 *   • pedido .......... dados completos do pedido selecionado
 *   • onFinished() .... callback disparado após qualquer alteração (para recarregar tela pai)
 */
interface Props {
  pedido: PedidoResponse;
  onFinished: () => void;
}

const validationSchema = Yup.object({
  forma_pagamento: Yup.string().required("Forma obrigatória"),
  valor_pago: Yup.number().min(0.01, "Mínimo 0,01").required(),
  troco: Yup.number().min(0, "Não pode ser negativo").default(0),
});

export default function FinalizarPedido({ pedido, onFinished }: Props) {
  /* --------------------------------------------------------------------- */
  /* hooks                                                                 */
  const [openVista, setOpenVista] = useState(false);
  const [openPrazo, setOpenPrazo] = useState(false);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);

  const service = useMemo(() => new PagamentoContasService(api), []);

  /* --------------------------------------------------------------------- */
  /* fetch existing dados                                                  */
  const fetchDados = useCallback(async () => {
    try {
      const [pays, parc] = await Promise.all([
        service.listPedidoPagamentos(pedido.id),
        service.listContasReceber(pedido.id),
      ]);
      setPagamentos(pays ?? []);
      setParcelas(parc ?? []);
    } catch (e: any) {
      toast.error(e.message || "Erro carregando dados");
    }
  }, [pedido.id, service]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  /* --------------------------------------------------------------------- */
  /* helpers                                                               */
  const totalPedido = useMemo(() => {
    return (
      parseFloat(pedido.valor_total) +
      parseFloat(pedido.taxa_entrega) -
      parseFloat(pedido.desconto) +
      parseFloat(pedido.acrescimo)
    );
  }, [pedido]);

  const valorPago = useMemo(() => {
    if (!pagamentos || pagamentos.length === 0) return 0;
    return pagamentos.reduce(
      (s, p) =>
        s + parseFloat(p.valor_pago ?? "0") - parseFloat(p.troco ?? "0"),
      0
    );
  }, [pagamentos]);

  const faltaPagar = totalPedido - valorPago;

  /* --------------------------------------------------------------------- */
  /* callbacks de submissão                                                */
  const inserirPagamento = async (values: any, { resetForm }: any) => {
    const dto: PedidoPagamentoCreateDTO = {
      id_pedido: pedido.id,
      forma_pagamento: values.forma_pagamento,
      valor_pago: values.valor_pago.toFixed(2),
      troco: values.troco.toFixed(2),
      categoria_pagamento: values.categoria_pagamento || undefined,
      observacao: values.observacao || undefined,
    };
    try {
      await service.createPedidoPagamento(dto);
      toast.success("Pagamento registrado");
      setOpenVista(false);
      resetForm();
      await fetchDados();
      onFinished();
    } catch (e: any) {
      toast.error(e.message || "Erro ao inserir pagamento");
    }
  };

  const gerarParcelaPrazo = async (values: any, { resetForm }: any) => {
    const dto: ContasReceberCreateDTO = {
      id_pedido: pedido.id,
      parcela: values.parcela,
      vencimento: values.vencimento,
      valor_devido: values.valor_devido.toFixed(2),
    };
    try {
      await service.createContaReceber(dto);
      toast.success("Parcela criada");
      setOpenPrazo(false);
      resetForm();
      await fetchDados();
      onFinished();
    } catch (e: any) {
      toast.error(e.message || "Erro ao inserir parcela");
    }
  };

  /* --------------------------------------------------------------------- */
  /* UI                                                                    */
  return (
    <div className="space-y-4 w-full max-w-2xl">
      <Card variant="outlined">
        <CardContent className="space-y-2">
          <Typography variant="h6">Resumo de Pagamentos</Typography>
          <List dense>
            {pagamentos.map((p) => (
              <ListItem
                key={p.id}
                disableGutters
                secondaryAction={
                  <Chip size="small" label={p.forma_pagamento} />
                }
              >
                <ListItemText
                  primary={
                    <span>
                      {Number(p.valor_pago).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                      {p.troco && parseFloat(p.troco) !== 0 && (
                        <span className="text-xs text-slate-500 ml-1">
                          (troco {p.troco})
                        </span>
                      )}
                    </span>
                  }
                  secondary={new Date(p.created_at).toLocaleString("pt-BR")}
                />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box className="flex justify-between font-medium">
            <span>Total pago</span>
            <span>
              {valorPago.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </Box>
          <Box className="flex justify-between font-bold text-primary">
            <span>Falta pagar</span>
            <span>
              {faltaPagar.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </Box>
          <Divider className="my-2" />
          <Box className="flex gap-2 flex-wrap">
            <Button variant="contained" onClick={() => setOpenVista(true)}>
              Receber à vista
            </Button>
            <Button variant="outlined" onClick={() => setOpenPrazo(true)}>
              Gerar parcela / fiado
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ------------------ DIALOG PAGAMENTO À VISTA ------------------ */}
      <Dialog
        open={openVista}
        onClose={() => setOpenVista(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="flex justify-between items-center">
          Novo pagamento à vista
          <IconButton size="small" onClick={() => setOpenVista(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Formik
          initialValues={{
            categoria_pagamento: "Cartão",
            forma_pagamento: "Crédito",
            valor_pago: faltaPagar > 0 ? faltaPagar : 0,
            troco: 0,
            observacao: "",
          }}
          validationSchema={validationSchema}
          onSubmit={inserirPagamento}
        >
          {({ values, handleChange, errors, touched }) => (
            <Form>
              <DialogContent className="space-y-4">
                <Select
                  fullWidth
                  name="categoria_pagamento"
                  value={values.categoria_pagamento}
                  onChange={handleChange}
                  size="small"
                  label="Categoria"
                >
                  <MenuItem value="Cartão">Cartão</MenuItem>
                  <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                  <MenuItem value="Pix">Pix</MenuItem>
                </Select>
                <TextField
                  fullWidth
                  name="forma_pagamento"
                  label="Forma / bandeira"
                  size="small"
                  value={values.forma_pagamento}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  name="valor_pago"
                  label="Valor"
                  type="number"
                  size="small"
                  value={values.valor_pago}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                  error={touched.valor_pago && !!errors.valor_pago}
                  helperText={touched.valor_pago && errors.valor_pago}
                />
                {values.categoria_pagamento === "Dinheiro" && (
                  <TextField
                    fullWidth
                    name="troco"
                    label="Troco"
                    type="number"
                    size="small"
                    value={values.troco}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                  />
                )}
                <TextField
                  fullWidth
                  name="observacao"
                  label="Observação"
                  size="small"
                  value={values.observacao}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenVista(false)}>Cancelar</Button>
                <Button variant="contained" type="submit">
                  Salvar pagamento
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* ------------------ DIALOG GERAR PARCELA ------------------ */}
      <Dialog
        open={openPrazo}
        onClose={() => setOpenPrazo(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="flex justify-between items-center">
          Gerar parcela / venda fiado
          <IconButton size="small" onClick={() => setOpenPrazo(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Formik
          initialValues={{
            parcela: 1,
            vencimento: new Date().toISOString().substring(0, 10),
            valor_devido: faltaPagar,
          }}
          validationSchema={Yup.object({
            parcela: Yup.number().min(1).required(),
            vencimento: Yup.string().required(),
            valor_devido: Yup.number().min(0.01).required(),
          })}
          onSubmit={gerarParcelaPrazo}
        >
          {({ values, handleChange }) => (
            <Form>
              <DialogContent className="space-y-4">
                <Grid container spacing={2}>
                  <Grid size={4}>
                    <TextField
                      fullWidth
                      name="parcela"
                      label="# Parcela"
                      type="number"
                      size="small"
                      value={values.parcela}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={8}>
                    <TextField
                      fullWidth
                      name="vencimento"
                      label="Vencimento"
                      type="date"
                      size="small"
                      value={values.vencimento}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  name="valor_devido"
                  label="Valor devido"
                  type="number"
                  size="small"
                  value={values.valor_devido}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenPrazo(false)}>Cancelar</Button>
                <Button variant="contained" type="submit">
                  Gerar parcela
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
}
