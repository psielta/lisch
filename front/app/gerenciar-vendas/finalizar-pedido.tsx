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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
} from "@mui/material";
import {
  X,
  CreditCard,
  Banknote,
  Calendar,
  Receipt,
  CheckCircle,
  AlertCircle,
  Delete,
  Calculator,
  DollarSign,
} from "lucide-react";
import { Formik, Form, Field, FieldArray, FormikErrors } from "formik";
import * as Yup from "yup";

import {
  PagamentoContasService,
  PedidoPagamentoCreateDTO,
  ContasReceberCreateDTO,
} from "@/proxies/pagamentos";
import { PedidoResponse } from "@/rxjs/pedido/pedido.model";
import api from "@/lib/api";
import { toast } from "sonner";
import { Add, Email, ExpandMore, Payment, Print } from "@mui/icons-material";

interface Props {
  pedido: PedidoResponse;
  onFinished: () => void;
}

interface PagamentoVista {
  categoria_pagamento: "Cartão" | "Dinheiro" | "Pix";
  forma_pagamento: string;
  valor_pago: number;
  troco?: number;
  observacao?: string;
}

interface ParcelaPrazo {
  parcela: number;
  valor_devido: number;
  vencimento: string;
}

interface FormValues {
  pagamentos_vista: PagamentoVista[];
  parcelas_prazo: ParcelaPrazo[];
}

interface BaixarParcelaData {
  valor_recebido: number;
  categoria_pagamento: "Cartão" | "Dinheiro" | "Pix";
  forma_pagamento: string;
  desconto?: number;
  observacao?: string;
}

// Função helper para acessar erros aninhados com segurança
const getNestedError = (
  errors: FormikErrors<FormValues>,
  path: string
): string | undefined => {
  try {
    const keys = path.split(".");
    let current: any = errors;

    for (const key of keys) {
      if (current && typeof current === "object") {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === "string" ? current : undefined;
  } catch {
    return undefined;
  }
};

// Função helper para verificar se campo foi tocado
const isNestedTouched = (touched: any, path: string): boolean => {
  try {
    const keys = path.split(".");
    let current = touched;

    for (const key of keys) {
      if (current && typeof current === "object") {
        current = current[key];
      } else {
        return false;
      }
    }

    return Boolean(current);
  } catch {
    return false;
  }
};

// Schemas de validação aprimorados
const pagamentoVistaSchema = Yup.object({
  categoria_pagamento: Yup.string()
    .oneOf(["Cartão", "Dinheiro", "Pix"])
    .required("Categoria obrigatória"),
  forma_pagamento: Yup.string()
    .min(2, "Forma deve ter pelo menos 2 caracteres")
    .required("Forma obrigatória"),
  valor_pago: Yup.number()
    .min(0.01, "Valor deve ser maior que zero")
    .max(10000, "Valor muito alto, verifique")
    .required("Valor obrigatório"),
  troco: Yup.number().min(0, "Troco não pode ser negativo").default(0),
  observacao: Yup.string().max(255, "Observação muito longa"),
});

const parcelaPrazoSchema = Yup.object({
  parcela: Yup.number()
    .min(1, "Parcela deve ser maior que zero")
    .max(360, "Número de parcelas muito alto")
    .integer("Parcela deve ser um número inteiro")
    .required("Número da parcela obrigatório"),
  valor_devido: Yup.number()
    .min(0.01, "Valor deve ser maior que zero")
    .max(100000, "Valor muito alto, verifique")
    .required("Valor obrigatório"),
  vencimento: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .test("data-futura", "Data deve ser futura", function (value) {
      if (!value) return false;
      const hoje = new Date();
      const vencimento = new Date(value);
      return vencimento >= hoje;
    })
    .required("Vencimento obrigatório"),
});

const validationSchema = Yup.object({
  pagamentos_vista: Yup.array()
    .of(pagamentoVistaSchema)
    .test(
      "pagamentos-duplicados",
      "Não é possível ter pagamentos duplicados",
      function (pagamentos) {
        if (!pagamentos || pagamentos.length <= 1) return true;

        const formas = pagamentos.map(
          (p) => `${p.categoria_pagamento}-${p.forma_pagamento}`
        );
        const uniqueFormas = new Set(formas);

        return formas.length === uniqueFormas.size;
      }
    ),
  parcelas_prazo: Yup.array()
    .of(parcelaPrazoSchema)
    .test(
      "parcelas-duplicadas",
      "Não é possível ter parcelas com mesmo número",
      function (parcelas) {
        if (!parcelas || parcelas.length <= 1) return true;

        const numeros = parcelas.map((p) => p.parcela);
        const uniqueNumeros = new Set(numeros);

        return numeros.length === uniqueNumeros.size;
      }
    ),
  // Removemos a validação de valor total - deixamos o backend validar
  // pois as triggers do PostgreSQL já fazem essa validação corretamente
});

// Dialog para baixar parcela
function BaixarParcelaDialog({
  open,
  onClose,
  parcela,
  onBaixar,
}: {
  open: boolean;
  onClose: () => void;
  parcela: any;
  onBaixar: (parcelaId: string, dados: BaixarParcelaData) => Promise<void>;
}) {
  if (!parcela) return null;

  const valorDevido = parseFloat(parcela.valor_devido || "0");
  const valorJaPago = parseFloat(parcela.valor_pago || "0");
  const valorRestante = valorDevido - valorJaPago;

  const baixarSchema = Yup.object({
    valor_recebido: Yup.number()
      .min(0.01, "Valor deve ser maior que zero")
      .max(valorRestante, "Valor não pode ser maior que o restante")
      .required("Valor obrigatório"),
    categoria_pagamento: Yup.string()
      .oneOf(["Cartão", "Dinheiro", "Pix"])
      .required("Categoria obrigatória"),
    forma_pagamento: Yup.string().required("Forma obrigatória"),
    desconto: Yup.number().min(0, "Desconto não pode ser negativo").default(0),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex justify-between items-center">
        <div>
          <Typography variant="h6">Baixar Parcela {parcela.parcela}</Typography>
          <Typography variant="body2" color="text.secondary">
            Vencimento:{" "}
            {new Date(parcela.vencimento).toLocaleDateString("pt-BR")}
          </Typography>
        </div>
        <IconButton size="small" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <Formik
        initialValues={{
          valor_recebido: valorRestante,
          categoria_pagamento: "Cartão" as const,
          forma_pagamento: "Débito",
          desconto: 0,
          observacao: "",
        }}
        validationSchema={baixarSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await onBaixar(parcela.id, values);
            onClose();
          } catch (error) {
            console.error("Erro ao baixar parcela:", error);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          handleChange,
          setFieldValue,
          errors,
          touched,
          isSubmitting,
        }) => (
          <Form>
            <DialogContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <Grid container spacing={2}>
                  <Grid size={4}>
                    <Typography variant="body2" color="text.secondary">
                      Devido
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(valorDevido)}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="body2" color="text.secondary">
                      Pago
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(valorJaPago)}
                    </Typography>
                  </Grid>
                  <Grid size={4}>
                    <Typography variant="body2" color="text.secondary">
                      Restante
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(valorRestante)}
                    </Typography>
                  </Grid>
                </Grid>
              </div>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      name="categoria_pagamento"
                      value={values.categoria_pagamento}
                      onChange={handleChange}
                      label="Categoria"
                    >
                      <MenuItem value="Cartão">Cartão</MenuItem>
                      <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                      <MenuItem value="Pix">Pix</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    size="small"
                    name="forma_pagamento"
                    label="Forma/Bandeira"
                    value={values.forma_pagamento}
                    onChange={handleChange}
                    error={touched.forma_pagamento && !!errors.forma_pagamento}
                    helperText={
                      touched.forma_pagamento && errors.forma_pagamento
                    }
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    size="small"
                    name="valor_recebido"
                    label="Valor Recebido"
                    type="number"
                    value={values.valor_recebido}
                    onChange={handleChange}
                    error={touched.valor_recebido && !!errors.valor_recebido}
                    helperText={touched.valor_recebido && errors.valor_recebido}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    size="small"
                    name="desconto"
                    label="Desconto"
                    type="number"
                    value={values.desconto}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="small"
                    name="observacao"
                    label="Observação"
                    multiline
                    rows={2}
                    value={values.observacao}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>

              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFieldValue("valor_recebido", valorRestante)}
                >
                  Valor Total
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setFieldValue("valor_recebido", valorRestante / 2)
                  }
                >
                  50%
                </Button>
              </div>
            </DialogContent>

            <DialogActions>
              <Button onClick={onClose}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Processando..." : "Baixar"}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}

export default function FinalizarPedido({ pedido, onFinished }: Props) {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [parcelaParaBaixar, setParcelaParaBaixar] = useState<any>(null);
  const [notasSelecionadas, setNotasSelecionadas] = useState<number[]>([]);

  const service = useMemo(() => new PagamentoContasService(api), []);

  // Fetch dados existentes
  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      const [pays, parc] = await Promise.all([
        service.listPedidoPagamentos(pedido.id),
        service.listContasReceber(pedido.id),
      ]);
      setPagamentos(pays ?? []);
      setParcelas(parc ?? []);
    } catch (e: any) {
      toast.error(e.message || "Erro carregando dados");
    } finally {
      setLoading(false);
    }
  }, [pedido.id, service]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // Cálculos principais
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

  const valorParcelas = useMemo(() => {
    if (!parcelas || parcelas.length === 0) return 0;
    return parcelas.reduce((s, p) => s + parseFloat(p.valor_devido ?? "0"), 0);
  }, [parcelas]);

  const faltaPagar = totalPedido - valorPago;
  const pedidoQuitado = Math.abs(faltaPagar) <= 0.01;
  const percentualPago = (valorPago / totalPedido) * 100;

  // Helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Gerar parcelas automaticamente
  const gerarParcelas = (numParcelas: number, valorTotal: number) => {
    const parcelas: ParcelaPrazo[] = [];
    const valorParcela = valorTotal / numParcelas;
    let valorRestante = valorTotal;

    for (let i = 1; i <= numParcelas; i++) {
      const isUltima = i === numParcelas;
      const valor = isUltima
        ? valorRestante
        : Math.round(valorParcela * 100) / 100;

      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + i * 30);

      parcelas.push({
        parcela: i,
        valor_devido: valor,
        vencimento: vencimento.toISOString().substring(0, 10),
      });

      valorRestante -= valor;
    }

    return parcelas;
  };

  // Calcular troco automaticamente
  const calcularTroco = (valorPago: number, valorDue: number) => {
    return Math.max(0, valorPago - valorDue);
  };

  // Submissão do formulário principal
  const handleSubmit = async (values: FormValues) => {
    console.log("🚀 handleSubmit chamado com valores:", values);
    console.log("📊 Total pedido:", totalPedido);
    console.log("💰 Valor já pago:", valorPago);
    console.log("📅 Valor em parcelas:", valorParcelas);

    try {
      setLoading(true);
      console.log("⏳ Iniciando processamento...");

      // Processar pagamentos à vista
      if (values.pagamentos_vista && values.pagamentos_vista.length > 0) {
        console.log(
          "💳 Processando pagamentos à vista:",
          values.pagamentos_vista.length
        );

        for (const [index, pagamento] of values.pagamentos_vista.entries()) {
          console.log(`💳 Processando pagamento ${index + 1}:`, pagamento);

          const dto: PedidoPagamentoCreateDTO = {
            id_pedido: pedido.id,
            categoria_pagamento: pagamento.categoria_pagamento,
            forma_pagamento: pagamento.forma_pagamento,
            valor_pago: pagamento.valor_pago.toFixed(2),
            troco: (pagamento.troco || 0).toFixed(2),
            observacao: pagamento.observacao || undefined,
          };

          console.log(`📤 Enviando DTO do pagamento ${index + 1}:`, dto);
          const result = await service.createPedidoPagamento(dto);
          console.log(`✅ Pagamento ${index + 1} criado:`, result);
        }
      }

      // Processar parcelas a prazo
      if (values.parcelas_prazo && values.parcelas_prazo.length > 0) {
        console.log(
          "📅 Processando parcelas a prazo:",
          values.parcelas_prazo.length
        );

        for (const [index, parcela] of values.parcelas_prazo.entries()) {
          console.log(`📅 Processando parcela ${index + 1}:`, parcela);

          const dto: ContasReceberCreateDTO = {
            id_pedido: pedido.id,
            parcela: parcela.parcela,
            vencimento: parcela.vencimento,
            valor_devido: parcela.valor_devido.toFixed(2),
          };

          console.log(`📤 Enviando DTO da parcela ${index + 1}:`, dto);
          const result = await service.createContaReceber(dto);
          console.log(`✅ Parcela ${index + 1} criada:`, result);
        }
      }

      console.log("🎉 Todos os pagamentos processados com sucesso!");
      toast.success("Pagamentos processados com sucesso!");
      setActiveStep(0); // Reset stepper
      await fetchDados();
      onFinished();
    } catch (e: any) {
      console.error("❌ Erro ao processar pagamentos:", e);
      console.error("❌ Stack trace:", e.stack);
      toast.error(e.message || "Erro ao processar pagamentos");
    } finally {
      console.log("🏁 Finalizando processamento...");
      setLoading(false);
    }
  };

  // Baixar parcela
  const handleBaixarParcela = async (
    parcelaId: string,
    dados: BaixarParcelaData
  ) => {
    try {
      setLoading(true);
      const dto: PedidoPagamentoCreateDTO = {
        id_pedido: pedido.id,
        id_conta_receber: parcelaId,
        categoria_pagamento: dados.categoria_pagamento,
        forma_pagamento: dados.forma_pagamento,
        valor_pago: dados.valor_recebido.toFixed(2),
        troco: "0.00",
        observacao: dados.observacao || undefined,
      };

      await service.createPedidoPagamento(dto);
      toast.success("Parcela baixada com sucesso!");
      await fetchDados();
      onFinished();
    } catch (e: any) {
      toast.error(e.message || "Erro ao baixar parcela");
    } finally {
      setLoading(false);
    }
  };

  const initialValues: FormValues = {
    pagamentos_vista: [], // começa vazio
    parcelas_prazo: [],
  };

  console.log("🔧 Valores iniciais calculados:", {
    totalPedido,
    valorPago,
    valorParcelas,
    faltaPagar,
    initialValues,
  });

  if (loading && pagamentos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <LinearProgress className="mb-4" />
          <Typography>Carregando dados do pedido...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-5xl">
      {/* Header com Status */}
      <Card variant="outlined">
        <CardContent>
          <Box className="flex items-center justify-between mb-4">
            <div>
              <Typography variant="h5" className="font-bold">
                Pedido #{pedido.codigo_pedido}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cliente: {pedido.cliente.nome_razao_social}
              </Typography>
            </div>
            <div className="text-right">
              <Chip
                icon={pedidoQuitado ? <CheckCircle /> : <AlertCircle />}
                label={pedidoQuitado ? "Quitado" : "Pendente"}
                color={pedidoQuitado ? "success" : "warning"}
                size="medium"
              />
              <Typography
                variant="body2"
                color="text.secondary"
                className="mt-1"
              >
                {percentualPago.toFixed(1)}% pago
              </Typography>
            </div>
          </Box>

          {/* Progress Bar */}
          <Box className="mb-4">
            <LinearProgress
              variant="determinate"
              value={Math.min(percentualPago, 100)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Resumo Financeiro */}
          <Grid container spacing={3}>
            <Grid size={3}>
              <Typography variant="body2" color="text.secondary">
                Total do Pedido
              </Typography>
              <Typography variant="h6" className="font-bold">
                {formatCurrency(totalPedido)}
              </Typography>
            </Grid>
            <Grid size={3}>
              <Typography variant="body2" color="text.secondary">
                Valor Pago
              </Typography>
              <Typography
                variant="h6"
                color="success.main"
                className="font-bold"
              >
                {formatCurrency(valorPago)}
              </Typography>
            </Grid>
            <Grid size={3}>
              <Typography variant="body2" color="text.secondary">
                Em Parcelas
              </Typography>
              <Typography variant="h6" color="info.main" className="font-bold">
                {formatCurrency(valorParcelas)}
              </Typography>
            </Grid>
            <Grid size={3}>
              <Typography variant="body2" color="text.secondary">
                Falta Pagar
              </Typography>
              <Typography
                variant="h6"
                color={faltaPagar <= 0.01 ? "success.main" : "error.main"}
                className="font-bold"
              >
                {formatCurrency(faltaPagar)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pagamentos Existentes */}
      {pagamentos.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box className="flex items-center gap-2">
              <Payment />
              <Typography variant="h6">
                Pagamentos Recebidos ({pagamentos.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {pagamentos.map((p) => (
                <ListItem key={p.id} divider>
                  <ListItemText
                    primary={
                      <Box className="flex justify-between items-center">
                        <div>
                          <Typography variant="subtitle1">
                            {p.forma_pagamento}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(p.created_at).toLocaleString("pt-BR")}
                          </Typography>
                        </div>
                        <div className="text-right">
                          <Typography variant="h6" className="font-semibold">
                            {formatCurrency(parseFloat(p.valor_pago))}
                          </Typography>
                          {p.troco && parseFloat(p.troco) > 0 ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Troco: {formatCurrency(parseFloat(p.troco))}
                            </Typography>
                          ) : (
                            <></>
                          )}
                        </div>
                      </Box>
                    }
                  />
                  <Chip
                    className="ml-2"
                    size="small"
                    label={p.categoria_pagamento}
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Parcelas Existentes */}
      {parcelas.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box className="flex items-center gap-2">
              <Calendar />
              <Typography variant="h6">
                Contas a Receber ({parcelas.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {parcelas.map((p) => (
                <ListItem
                  key={p.id}
                  divider
                  secondaryAction={
                    !p.quitado && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setParcelaParaBaixar(p)}
                        startIcon={<Receipt />}
                      >
                        Baixar
                      </Button>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box className="flex justify-between items-center mr-24">
                        <div>
                          <Typography variant="subtitle1">
                            Parcela {p.parcela}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Vencimento:{" "}
                            {new Date(p.vencimento).toLocaleDateString("pt-BR")}
                          </Typography>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <Typography variant="h6" className="font-semibold">
                            {formatCurrency(parseFloat(p.valor_devido))}
                          </Typography>
                          {p.valor_pago && parseFloat(p.valor_pago) > 0 ? (
                            <Typography variant="caption" color="success.main">
                              Pago: {formatCurrency(parseFloat(p.valor_pago))}
                            </Typography>
                          ) : (
                            <></>
                          )}
                          <Chip
                            size="small"
                            label={p.quitado ? "Quitada" : "Pendente"}
                            color={p.quitado ? "success" : "warning"}
                          />
                        </div>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Formulário de Novos Pagamentos */}
      {!pedidoQuitado && (
        <Card variant="outlined">
          <CardContent>
            <Box className="flex items-center gap-2 mb-4">
              <Calculator />
              <Typography variant="h6">Processar Pagamentos</Typography>
            </Box>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(values, actions) => {
                console.log("🎯 Formik onSubmit disparado!");
                console.log("📋 Values recebidos:", values);

                handleSubmit(values).finally(() => {
                  console.log("🏁 Resetting form submission state");
                  actions.setSubmitting(false);
                });
              }}
              enableReinitialize={false}
            >
              {({
                values,
                setFieldValue,
                errors,
                touched,
                isValid,
                isSubmitting,
                submitForm,
              }) => {
                // Debug do estado atual do form
                console.log("📊 Form State:", {
                  isValid,
                  isSubmitting,
                  hasErrors: Object.keys(errors).length > 0,
                  values: values,
                  errors: errors,
                });

                return (
                  <Form>
                    <Stepper activeStep={activeStep} orientation="vertical">
                      {/* Step 1: Pagamentos à Vista */}
                      <Step>
                        <StepLabel>
                          <Box className="flex items-center gap-2">
                            <CreditCard size={20} />
                            Pagamentos à Vista
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <FieldArray name="pagamentos_vista">
                            {({ push, remove }) => {
                              // Estado para gerenciar notas selecionadas

                              // Calcular total das notas selecionadas
                              const totalNotas = notasSelecionadas.reduce(
                                (sum, nota) => sum + nota,
                                0
                              );

                              // Definir notas disponíveis
                              const notasDisponiveis = [
                                2, 5, 10, 20, 50, 100, 200,
                              ];

                              // Filtrar notas com base em faltaPagar
                              const notasFiltradas = notasDisponiveis.filter(
                                (nota) => {
                                  if (faltaPagar <= 20) return nota <= 20;
                                  if (faltaPagar <= 50) return nota <= 50;
                                  if (faltaPagar <= 100) return nota <= 100;
                                  return true;
                                }
                              );

                              return (
                                <>
                                  {/* Botões de atalho para pagamento total e seleção de notas */}
                                  {!pedidoQuitado &&
                                    values.pagamentos_vista.length === 0 && (
                                      <Card variant="outlined" className="mb-4">
                                        <CardContent>
                                          <Typography
                                            variant="subtitle2"
                                            className="mb-3"
                                          >
                                            Pagamento Rápido:
                                          </Typography>
                                          <Box className="flex gap-2 flex-wrap mb-3">
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="primary"
                                              startIcon={<Banknote size={16} />}
                                              onClick={() => {
                                                const valorRestante = Math.max(
                                                  0,
                                                  faltaPagar
                                                );
                                                const troco = calcularTroco(
                                                  valorRestante,
                                                  valorRestante
                                                );
                                                push({
                                                  categoria_pagamento:
                                                    "Dinheiro",
                                                  forma_pagamento: "Espécie",
                                                  valor_pago: valorRestante,
                                                  troco: troco,
                                                  observacao: "",
                                                });
                                              }}
                                            >
                                              Total em Dinheiro (
                                              {formatCurrency(faltaPagar)})
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="primary"
                                              startIcon={
                                                <CreditCard size={16} />
                                              }
                                              onClick={() => {
                                                push({
                                                  categoria_pagamento: "Cartão",
                                                  forma_pagamento: "Débito",
                                                  valor_pago: Math.max(
                                                    0,
                                                    faltaPagar
                                                  ),
                                                  troco: 0,
                                                  observacao: "",
                                                });
                                              }}
                                            >
                                              Total em Cartão (
                                              {formatCurrency(faltaPagar)})
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="primary"
                                              startIcon={<Receipt size={16} />}
                                              onClick={() => {
                                                push({
                                                  categoria_pagamento: "Pix",
                                                  forma_pagamento: "Pix",
                                                  valor_pago: Math.max(
                                                    0,
                                                    faltaPagar
                                                  ),
                                                  troco: 0,
                                                  observacao: "",
                                                });
                                              }}
                                            >
                                              Total em Pix (
                                              {formatCurrency(faltaPagar)})
                                            </Button>
                                          </Box>

                                          {/* Seção para seleção de notas */}
                                          <Divider className="my-3" />
                                          <Typography
                                            variant="subtitle2"
                                            className="mb-3"
                                          >
                                            Selecionar Notas (Dinheiro):
                                          </Typography>
                                          <Box className="flex gap-2 flex-wrap mb-3">
                                            {notasFiltradas.map((nota) => (
                                              <Button
                                                key={nota}
                                                size="small"
                                                variant="outlined"
                                                onClick={() =>
                                                  setNotasSelecionadas([
                                                    ...notasSelecionadas,
                                                    nota,
                                                  ])
                                                }
                                              >
                                                R${nota}
                                              </Button>
                                            ))}
                                          </Box>
                                          {notasSelecionadas.length > 0 && (
                                            <Box className="mb-3">
                                              <Typography
                                                variant="body2"
                                                className="mb-2"
                                              >
                                                Notas Selecionadas:
                                              </Typography>
                                              <Box className="flex gap-2 flex-wrap">
                                                {notasSelecionadas.map(
                                                  (nota, idx) => (
                                                    <Chip
                                                      key={`${nota}-${idx}`}
                                                      label={`R$${nota}`}
                                                      onDelete={() =>
                                                        setNotasSelecionadas(
                                                          notasSelecionadas.filter(
                                                            (_, i) => i !== idx
                                                          )
                                                        )
                                                      }
                                                      color="primary"
                                                      variant="outlined"
                                                    />
                                                  )
                                                )}
                                              </Box>
                                              <Typography
                                                variant="body1"
                                                className="mt-2 font-semibold"
                                              >
                                                Total Selecionado:{" "}
                                                {formatCurrency(totalNotas)}
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                              >
                                                Troco Estimado:{" "}
                                                {formatCurrency(
                                                  calcularTroco(
                                                    totalNotas,
                                                    Math.min(
                                                      totalNotas,
                                                      faltaPagar
                                                    )
                                                  )
                                                )}
                                              </Typography>
                                            </Box>
                                          )}
                                          {notasSelecionadas.length > 0 && (
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="success"
                                              onClick={() => {
                                                if (totalNotas <= 0) {
                                                  toast.error(
                                                    "Selecione pelo menos uma nota válida"
                                                  );
                                                  return;
                                                }
                                                const troco = calcularTroco(
                                                  totalNotas,
                                                  Math.min(
                                                    totalNotas,
                                                    faltaPagar
                                                  )
                                                );
                                                push({
                                                  categoria_pagamento:
                                                    "Dinheiro",
                                                  forma_pagamento: "Espécie",
                                                  valor_pago: totalNotas,
                                                  troco: troco,
                                                  observacao: `Notas: ${notasSelecionadas.join(
                                                    ", "
                                                  )}`,
                                                });
                                                setNotasSelecionadas([]); // Resetar após confirmar
                                              }}
                                            >
                                              Confirmar Notas
                                            </Button>
                                          )}
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            Escolha notas para pagamento em
                                            dinheiro, ou use as opções de
                                            pagamento total acima, ou adicione
                                            manualmente abaixo.
                                          </Typography>
                                        </CardContent>
                                      </Card>
                                    )}

                                  {values.pagamentos_vista.map((_, index) => (
                                    <Card
                                      key={index}
                                      variant="outlined"
                                      className="mb-4"
                                    >
                                      <CardContent>
                                        <Box className="flex justify-between items-center mb-3">
                                          <Typography
                                            variant="subtitle1"
                                            className="font-semibold"
                                          >
                                            Pagamento {index + 1}
                                          </Typography>
                                          {values.pagamentos_vista.length >
                                            0 && (
                                            <IconButton
                                              size="small"
                                              onClick={() => remove(index)}
                                              color="error"
                                            >
                                              <Delete size={16} />
                                            </IconButton>
                                          )}
                                        </Box>

                                        <Grid container spacing={2}>
                                          <Grid size={4}>
                                            <FormControl fullWidth size="small">
                                              <InputLabel>
                                                Categoria *
                                              </InputLabel>
                                              <Select
                                                value={
                                                  values.pagamentos_vista[index]
                                                    .categoria_pagamento
                                                }
                                                onChange={(e) => {
                                                  setFieldValue(
                                                    `pagamentos_vista.${index}.categoria_pagamento`,
                                                    e.target.value
                                                  );
                                                  if (
                                                    e.target.value !==
                                                    "Dinheiro"
                                                  ) {
                                                    setFieldValue(
                                                      `pagamentos_vista.${index}.troco`,
                                                      0
                                                    );
                                                  }
                                                  const formas = {
                                                    Cartão: "Débito",
                                                    Dinheiro: "Espécie",
                                                    Pix: "Pix",
                                                  };
                                                  setFieldValue(
                                                    `pagamentos_vista.${index}.forma_pagamento`,
                                                    formas[
                                                      e.target
                                                        .value as keyof typeof formas
                                                    ]
                                                  );
                                                }}
                                                label="Categoria *"
                                              >
                                                <MenuItem value="Cartão">
                                                  <Box className="flex items-center gap-2">
                                                    <CreditCard size={16} />
                                                    Cartão
                                                  </Box>
                                                </MenuItem>
                                                <MenuItem value="Dinheiro">
                                                  <Box className="flex items-center gap-2">
                                                    <Banknote size={16} />
                                                    Dinheiro
                                                  </Box>
                                                </MenuItem>
                                                <MenuItem value="Pix">
                                                  Pix
                                                </MenuItem>
                                              </Select>
                                            </FormControl>
                                          </Grid>

                                          <Grid size={4}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Forma/Bandeira *"
                                              value={
                                                values.pagamentos_vista[index]
                                                  .forma_pagamento
                                              }
                                              onChange={(e) =>
                                                setFieldValue(
                                                  `pagamentos_vista.${index}.forma_pagamento`,
                                                  e.target.value
                                                )
                                              }
                                              error={
                                                isNestedTouched(
                                                  touched,
                                                  `pagamentos_vista.${index}.forma_pagamento`
                                                ) &&
                                                !!getNestedError(
                                                  errors,
                                                  `pagamentos_vista.${index}.forma_pagamento`
                                                )
                                              }
                                              helperText={
                                                isNestedTouched(
                                                  touched,
                                                  `pagamentos_vista.${index}.forma_pagamento`
                                                ) &&
                                                getNestedError(
                                                  errors,
                                                  `pagamentos_vista.${index}.forma_pagamento`
                                                )
                                              }
                                            />
                                          </Grid>

                                          <Grid size={4}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Valor Pago *"
                                              type="number"
                                              value={
                                                values.pagamentos_vista[index]
                                                  .valor_pago
                                              }
                                              onChange={(e) => {
                                                const valor =
                                                  parseFloat(e.target.value) ||
                                                  0;
                                                setFieldValue(
                                                  `pagamentos_vista.${index}.valor_pago`,
                                                  valor
                                                );
                                                if (
                                                  values.pagamentos_vista[index]
                                                    .categoria_pagamento ===
                                                  "Dinheiro"
                                                ) {
                                                  const valorRestante =
                                                    Math.max(
                                                      0,
                                                      faltaPagar -
                                                        values.pagamentos_vista
                                                          .filter(
                                                            (_, i) =>
                                                              i !== index
                                                          )
                                                          .reduce(
                                                            (s, p) =>
                                                              s +
                                                              p.valor_pago -
                                                              (p.troco || 0),
                                                            0
                                                          ) -
                                                        values.parcelas_prazo.reduce(
                                                          (s, p) =>
                                                            s + p.valor_devido,
                                                          0
                                                        )
                                                    );
                                                  const troco = calcularTroco(
                                                    valor,
                                                    valorRestante
                                                  );
                                                  setFieldValue(
                                                    `pagamentos_vista.${index}.troco`,
                                                    troco
                                                  );
                                                }
                                              }}
                                              error={
                                                isNestedTouched(
                                                  touched,
                                                  `pagamentos_vista.${index}.valor_pago`
                                                ) &&
                                                !!getNestedError(
                                                  errors,
                                                  `pagamentos_vista.${index}.valor_pago`
                                                )
                                              }
                                              helperText={
                                                isNestedTouched(
                                                  touched,
                                                  `pagamentos_vista.${index}.valor_pago`
                                                ) &&
                                                getNestedError(
                                                  errors,
                                                  `pagamentos_vista.${index}.valor_pago`
                                                )
                                              }
                                              InputProps={{
                                                startAdornment: (
                                                  <InputAdornment position="start">
                                                    R$
                                                  </InputAdornment>
                                                ),
                                              }}
                                            />
                                          </Grid>

                                          {values.pagamentos_vista[index]
                                            .categoria_pagamento ===
                                            "Dinheiro" && (
                                            <Grid size={6}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                label="Troco (Calculado Automaticamente)"
                                                type="number"
                                                disabled
                                                value={
                                                  values.pagamentos_vista[index]
                                                    .troco || 0
                                                }
                                                InputProps={{
                                                  startAdornment: (
                                                    <InputAdornment position="start">
                                                      R$
                                                    </InputAdornment>
                                                  ),
                                                }}
                                              />
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                O troco é calculado
                                                automaticamente baseado no valor
                                                restante
                                              </Typography>
                                            </Grid>
                                          )}

                                          <Grid size={12}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Observação"
                                              multiline
                                              rows={2}
                                              value={
                                                values.pagamentos_vista[index]
                                                  .observacao
                                              }
                                              onChange={(e) =>
                                                setFieldValue(
                                                  `pagamentos_vista.${index}.observacao`,
                                                  e.target.value
                                                )
                                              }
                                              placeholder="Observações sobre este pagamento..."
                                            />
                                          </Grid>
                                        </Grid>
                                      </CardContent>
                                    </Card>
                                  ))}

                                  <Button
                                    startIcon={<Add />}
                                    onClick={() =>
                                      push({
                                        categoria_pagamento: "Cartão",
                                        forma_pagamento: "Débito",
                                        valor_pago: 0,
                                        troco: 0,
                                        observacao: "",
                                      })
                                    }
                                    variant="outlined"
                                    className="mb-4"
                                  >
                                    Adicionar Pagamento Manual
                                  </Button>
                                </>
                              );
                            }}
                          </FieldArray>

                          <Box className="flex gap-2 mt-4">
                            <Button
                              onClick={() => setActiveStep(1)}
                              variant="contained"
                            >
                              Próximo: Parcelamento
                            </Button>
                            <Button
                              onClick={() => setActiveStep(2)}
                              variant="outlined"
                            >
                              Pular para Finalizar
                            </Button>
                          </Box>
                        </StepContent>
                      </Step>

                      {/* Step 2: Parcelas a Prazo */}
                      <Step>
                        <StepLabel>
                          <Box className="flex items-center gap-2">
                            <Calendar size={20} />
                            Parcelamento / Fiado
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <FieldArray name="parcelas_prazo">
                            {({ push, remove }) => (
                              <>
                                {/* Botões para gerar parcelas automaticamente */}
                                <Card variant="outlined" className="mb-4">
                                  <CardContent>
                                    <Typography
                                      variant="subtitle2"
                                      className="mb-3"
                                    >
                                      Gerar parcelas automaticamente:
                                    </Typography>
                                    <Box className="flex gap-2 flex-wrap mb-3">
                                      {[1, 2, 3, 6, 12].map((num) => (
                                        <Button
                                          key={num}
                                          size="small"
                                          variant="outlined"
                                          onClick={() => {
                                            const valorRestante = Math.max(
                                              0,
                                              faltaPagar -
                                                values.pagamentos_vista.reduce(
                                                  (s, p) =>
                                                    s +
                                                    p.valor_pago -
                                                    (p.troco || 0),
                                                  0
                                                )
                                            );

                                            if (valorRestante > 0.01) {
                                              const novasParcelas =
                                                gerarParcelas(
                                                  num,
                                                  valorRestante
                                                );
                                              setFieldValue(
                                                "parcelas_prazo",
                                                novasParcelas
                                              );
                                            } else {
                                              toast.warning(
                                                "Não há valor restante para parcelar"
                                              );
                                            }
                                          }}
                                          startIcon={<Calculator size={16} />}
                                        >
                                          {num}x de{" "}
                                          {formatCurrency(
                                            (faltaPagar -
                                              values.pagamentos_vista.reduce(
                                                (s, p) =>
                                                  s +
                                                  p.valor_pago -
                                                  (p.troco || 0),
                                                0
                                              )) /
                                              num
                                          )}
                                        </Button>
                                      ))}
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      As parcelas são geradas com vencimento a
                                      cada 30 dias
                                    </Typography>
                                  </CardContent>
                                </Card>

                                {values.parcelas_prazo.map((_, index) => (
                                  <Card
                                    key={index}
                                    variant="outlined"
                                    className="mb-4"
                                  >
                                    <CardContent>
                                      <Box className="flex justify-between items-center mb-3">
                                        <Typography
                                          variant="subtitle1"
                                          className="font-semibold"
                                        >
                                          Parcela {index + 1}
                                        </Typography>
                                        <IconButton
                                          size="small"
                                          onClick={() => remove(index)}
                                          color="error"
                                        >
                                          <Delete size={16} />
                                        </IconButton>
                                      </Box>

                                      <Grid container spacing={2}>
                                        <Grid size={4}>
                                          <TextField
                                            fullWidth
                                            size="small"
                                            label="Número da Parcela *"
                                            type="number"
                                            value={
                                              values.parcelas_prazo[index]
                                                .parcela
                                            }
                                            onChange={(e) =>
                                              setFieldValue(
                                                `parcelas_prazo.${index}.parcela`,
                                                parseInt(e.target.value) || 1
                                              )
                                            }
                                            error={
                                              isNestedTouched(
                                                touched,
                                                `parcelas_prazo.${index}.parcela`
                                              ) &&
                                              !!getNestedError(
                                                errors,
                                                `parcelas_prazo.${index}.parcela`
                                              )
                                            }
                                            helperText={
                                              isNestedTouched(
                                                touched,
                                                `parcelas_prazo.${index}.parcela`
                                              ) &&
                                              getNestedError(
                                                errors,
                                                `parcelas_prazo.${index}.parcela`
                                              )
                                            }
                                          />
                                        </Grid>

                                        <Grid size={4}>
                                          <TextField
                                            fullWidth
                                            size="small"
                                            label="Valor Devido *"
                                            type="number"
                                            value={
                                              values.parcelas_prazo[index]
                                                .valor_devido
                                            }
                                            onChange={(e) =>
                                              setFieldValue(
                                                `parcelas_prazo.${index}.valor_devido`,
                                                parseFloat(e.target.value) || 0
                                              )
                                            }
                                            error={
                                              isNestedTouched(
                                                touched,
                                                `parcelas_prazo.${index}.valor_devido`
                                              ) &&
                                              !!getNestedError(
                                                errors,
                                                `parcelas_prazo.${index}.valor_devido`
                                              )
                                            }
                                            helperText={
                                              isNestedTouched(
                                                touched,
                                                `parcelas_prazo.${index}.valor_devido`
                                              ) &&
                                              getNestedError(
                                                errors,
                                                `parcelas_prazo.${index}.valor_devido`
                                              )
                                            }
                                            InputProps={{
                                              startAdornment: (
                                                <InputAdornment position="start">
                                                  R$
                                                </InputAdornment>
                                              ),
                                            }}
                                          />
                                        </Grid>

                                        <Grid size={4}>
                                          <TextField
                                            fullWidth
                                            size="small"
                                            label="Vencimento *"
                                            type="date"
                                            value={
                                              values.parcelas_prazo[index]
                                                .vencimento
                                            }
                                            onChange={(e) =>
                                              setFieldValue(
                                                `parcelas_prazo.${index}.vencimento`,
                                                e.target.value
                                              )
                                            }
                                            error={
                                              isNestedTouched(
                                                touched,
                                                `parcelas_prazo.${index}.vencimento`
                                              ) &&
                                              !!getNestedError(
                                                errors,
                                                `parcelas_prazo.${index}.vencimento`
                                              )
                                            }
                                            helperText={
                                              isNestedTouched(
                                                touched,
                                                `parcelas_prazo.${index}.vencimento`
                                              ) &&
                                              getNestedError(
                                                errors,
                                                `parcelas_prazo.${index}.vencimento`
                                              )
                                            }
                                            InputLabelProps={{ shrink: true }}
                                          />
                                        </Grid>
                                      </Grid>
                                    </CardContent>
                                  </Card>
                                ))}

                                <Button
                                  startIcon={<Add />}
                                  onClick={() => {
                                    const proximaParcela =
                                      values.parcelas_prazo.length + 1;
                                    const proximoVencimento = new Date();
                                    proximoVencimento.setDate(
                                      proximoVencimento.getDate() + 30
                                    );

                                    push({
                                      parcela: proximaParcela,
                                      valor_devido: 0,
                                      vencimento: proximoVencimento
                                        .toISOString()
                                        .substring(0, 10),
                                    });
                                  }}
                                  variant="outlined"
                                  className="mb-4"
                                >
                                  Adicionar Parcela Manual
                                </Button>
                              </>
                            )}
                          </FieldArray>

                          <Box className="flex gap-2 mt-4">
                            <Button onClick={() => setActiveStep(0)}>
                              Voltar
                            </Button>
                            <Button
                              onClick={() => setActiveStep(2)}
                              variant="contained"
                            >
                              Próximo: Confirmar
                            </Button>
                          </Box>
                        </StepContent>
                      </Step>

                      {/* Step 3: Confirmação */}
                      <Step>
                        <StepLabel>
                          <Box className="flex items-center gap-2">
                            <CheckCircle size={20} />
                            Confirmação
                          </Box>
                        </StepLabel>
                        <StepContent>
                          {/* Erros de validação */}
                          {errors && typeof errors === "string" && (
                            <Alert severity="error" className="mb-4">
                              {errors}
                            </Alert>
                          )}

                          <Typography variant="h6" className="mb-4">
                            Resumo dos Pagamentos
                          </Typography>

                          {/* Resumo dos pagamentos à vista */}
                          {values.pagamentos_vista.length > 0 && (
                            <Card variant="outlined" className="mb-4">
                              <CardContent>
                                <Typography
                                  variant="subtitle1"
                                  className="mb-3 font-semibold"
                                >
                                  <DollarSign
                                    className="inline mr-2"
                                    size={20}
                                  />
                                  Pagamentos à Vista
                                </Typography>
                                {values.pagamentos_vista.map((pag, index) => (
                                  <Box
                                    key={index}
                                    className="flex justify-between items-center py-1"
                                  >
                                    <span>
                                      {pag.forma_pagamento} (
                                      {pag.categoria_pagamento})
                                      {pag.troco && pag.troco > 0 && (
                                        <span className="text-sm text-gray-500 ml-1">
                                          - Troco: {formatCurrency(pag.troco)}
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(
                                        pag.valor_pago - (pag.troco || 0)
                                      )}
                                    </span>
                                  </Box>
                                ))}
                                <Divider className="mt-2" />
                                <Box className="flex justify-between items-center pt-2 font-semibold">
                                  <span>Subtotal à Vista:</span>
                                  <span>
                                    {formatCurrency(
                                      values.pagamentos_vista.reduce(
                                        (s, p) =>
                                          s + p.valor_pago - (p.troco || 0),
                                        0
                                      )
                                    )}
                                  </span>
                                </Box>
                              </CardContent>
                            </Card>
                          )}

                          {/* Resumo das parcelas */}
                          {values.parcelas_prazo.length > 0 && (
                            <Card variant="outlined" className="mb-4">
                              <CardContent>
                                <Typography
                                  variant="subtitle1"
                                  className="mb-3 font-semibold"
                                >
                                  <Calendar className="inline mr-2" size={20} />
                                  Parcelas a Prazo
                                </Typography>
                                {values.parcelas_prazo.map((parc, index) => (
                                  <Box
                                    key={index}
                                    className="flex justify-between items-center py-1"
                                  >
                                    <span>
                                      Parcela {parc.parcela} -{" "}
                                      {new Date(
                                        parc.vencimento
                                      ).toLocaleDateString("pt-BR")}
                                    </span>
                                    <span className="font-semibold">
                                      {formatCurrency(parc.valor_devido)}
                                    </span>
                                  </Box>
                                ))}
                                <Divider className="mt-2" />
                                <Box className="flex justify-between items-center pt-2 font-semibold">
                                  <span>Subtotal em Parcelas:</span>
                                  <span>
                                    {formatCurrency(
                                      values.parcelas_prazo.reduce(
                                        (s, p) => s + p.valor_devido,
                                        0
                                      )
                                    )}
                                  </span>
                                </Box>
                              </CardContent>
                            </Card>
                          )}

                          {/* Resumo Total */}
                          <Card
                            variant="outlined"
                            className="mb-4"
                            sx={{
                              backgroundColor: "primary.light",
                              color: "primary.contrastText",
                            }}
                          >
                            <CardContent>
                              <Typography
                                variant="h6"
                                className="mb-2 font-bold"
                              >
                                Resumo Final
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid size={6}>
                                  <Typography variant="body2">
                                    Total do Pedido:
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    className="font-bold"
                                  >
                                    {formatCurrency(totalPedido)}
                                  </Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant="body2">
                                    Já Pago + Parcelas:
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    className="font-bold"
                                  >
                                    {formatCurrency(valorPago + valorParcelas)}
                                  </Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant="body2">
                                    Novos Pagamentos:
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    className="font-bold"
                                  >
                                    {formatCurrency(
                                      values.pagamentos_vista.reduce(
                                        (s, p) =>
                                          s + p.valor_pago - (p.troco || 0),
                                        0
                                      ) +
                                        values.parcelas_prazo.reduce(
                                          (s, p) => s + p.valor_devido,
                                          0
                                        )
                                    )}
                                  </Typography>
                                </Grid>
                                <Grid size={6}>
                                  <Typography variant="body2">
                                    Status:
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    className="font-bold"
                                  >
                                    {Math.abs(
                                      faltaPagar -
                                        values.pagamentos_vista.reduce(
                                          (s, p) =>
                                            s + p.valor_pago - (p.troco || 0),
                                          0
                                        ) -
                                        values.parcelas_prazo.reduce(
                                          (s, p) => s + p.valor_devido,
                                          0
                                        )
                                    ) <= 0.01
                                      ? "✓ Completo"
                                      : "⚠ Incompleto"}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>

                          <Box className="flex gap-2 mt-4">
                            <Button onClick={() => setActiveStep(1)}>
                              Voltar
                            </Button>

                            <Button
                              variant="contained"
                              disabled={loading || isSubmitting}
                              startIcon={<Receipt />}
                              size="large"
                              onClick={async () => {
                                console.log("🔘 Botão Finalizar clicado!");

                                // Verificar se há pelo menos um pagamento ou parcela
                                if (
                                  values.pagamentos_vista.length === 0 &&
                                  values.parcelas_prazo.length === 0
                                ) {
                                  toast.error(
                                    "Adicione pelo menos um pagamento ou parcela"
                                  );
                                  return;
                                }

                                // Validação básica - deixamos o backend fazer as validações complexas
                                let hasError = false;

                                // Verificar pagamentos à vista
                                for (const [
                                  index,
                                  pag,
                                ] of values.pagamentos_vista.entries()) {
                                  if (!pag.forma_pagamento.trim()) {
                                    toast.error(
                                      `Pagamento ${
                                        index + 1
                                      }: Forma de pagamento é obrigatória`
                                    );
                                    hasError = true;
                                    break;
                                  }
                                  if (pag.valor_pago <= 0) {
                                    toast.error(
                                      `Pagamento ${
                                        index + 1
                                      }: Valor deve ser maior que zero`
                                    );
                                    hasError = true;
                                    break;
                                  }
                                }

                                // Verificar parcelas
                                if (!hasError) {
                                  for (const [
                                    index,
                                    parc,
                                  ] of values.parcelas_prazo.entries()) {
                                    if (parc.parcela <= 0) {
                                      toast.error(
                                        `Parcela ${
                                          index + 1
                                        }: Número da parcela deve ser maior que zero`
                                      );
                                      hasError = true;
                                      break;
                                    }
                                    if (parc.valor_devido <= 0) {
                                      toast.error(
                                        `Parcela ${
                                          index + 1
                                        }: Valor deve ser maior que zero`
                                      );
                                      hasError = true;
                                      break;
                                    }
                                    if (!parc.vencimento) {
                                      toast.error(
                                        `Parcela ${
                                          index + 1
                                        }: Data de vencimento é obrigatória`
                                      );
                                      hasError = true;
                                      break;
                                    }
                                  }
                                }

                                if (hasError) return;

                                console.log(
                                  "✅ Validação básica passou, enviando..."
                                );
                                try {
                                  await handleSubmit(values);
                                } catch (error) {
                                  console.error("❌ Erro ao submeter:", error);
                                }
                              }}
                            >
                              {loading || isSubmitting
                                ? "Processando..."
                                : "Finalizar Pagamentos"}
                            </Button>
                          </Box>
                        </StepContent>
                      </Step>
                    </Stepper>
                  </Form>
                );
              }}
            </Formik>
          </CardContent>
        </Card>
      )}

      {/* Ações quando pedido já está quitado */}
      {pedidoQuitado && (
        <Card variant="outlined">
          <CardContent>
            <Alert severity="success" className="mb-4">
              <Typography variant="h6" className="mb-2">
                🎉 Pedido Totalmente Quitado!
              </Typography>
              <Typography variant="body2">
                Este pedido foi totalmente pago através de pagamentos à vista
                e/ou possui parcelas que cobrem todo o valor restante.
              </Typography>
            </Alert>

            <Box className="flex gap-2 flex-wrap">
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => {
                  toast.info("Funcionalidade de impressão em desenvolvimento");
                }}
              >
                Imprimir Comprovante
              </Button>
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() => {
                  toast.info(
                    "Funcionalidade de envio por email em desenvolvimento"
                  );
                }}
              >
                Enviar por Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<Receipt />}
                onClick={() => {
                  toast.info("Relatório detalhado em desenvolvimento");
                }}
              >
                Relatório Detalhado
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog para baixar parcela */}
      <BaixarParcelaDialog
        open={!!parcelaParaBaixar}
        onClose={() => setParcelaParaBaixar(null)}
        parcela={parcelaParaBaixar}
        onBaixar={handleBaixarParcela}
      />
    </div>
  );
}
