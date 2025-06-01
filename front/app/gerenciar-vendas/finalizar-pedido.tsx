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
  Tooltip,
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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Formik, Form, Field, FieldArray, FormikErrors, getIn } from "formik";
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
import {
  finalizarPedidoSchema,
  baixarParcelaSchema,
  calcularValorLiquido,
  calcularTrocoAutomatico,
  formatarMoeda,
  validarDataVencimento,
} from "./validation";

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
  troco?: number;
}

// Dialog de confirmação para estorno/exclusão
function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-2">
        <AlertTriangle className="text-orange-500" size={24} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
          startIcon={<Trash2 size={16} />}
        >
          {isLoading ? "Processando..." : "Confirmar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
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

  const schema = baixarParcelaSchema(valorRestante);

  const initialBaixarValues = {
    valor_recebido: valorRestante,
    categoria_pagamento: "Dinheiro" as const,
    forma_pagamento: "Espécie",
    observacao: "",
    troco: 0,
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
        initialValues={initialBaixarValues}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await onBaixar(parcela.id, {
              ...values,
              troco: values.troco,
            });
            onClose();
          } catch (error) {
            console.error("Erro ao baixar parcela:", error);
            toast.error("Erro ao baixar parcela");
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
        }) => {
          // Calcular troco automaticamente quando categoria é Dinheiro
          useEffect(() => {
            if (values.categoria_pagamento === "Dinheiro") {
              const troco = calcularTrocoAutomatico(
                values.valor_recebido,
                valorRestante
              );
              setFieldValue("troco", troco);
            } else {
              setFieldValue("troco", 0);
            }
          }, [
            values.valor_recebido,
            values.categoria_pagamento,
            setFieldValue,
          ]);

          return (
            <Form
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // impede o submit
                }
              }}
            >
              <DialogContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Grid container spacing={2}>
                    <Grid size={4}>
                      <Typography variant="body2" color="text.secondary">
                        Devido
                      </Typography>
                      <Typography variant="h6">
                        {formatarMoeda(valorDevido)}
                      </Typography>
                    </Grid>
                    <Grid size={4}>
                      <Typography variant="body2" color="text.secondary">
                        Pago
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatarMoeda(valorJaPago)}
                      </Typography>
                    </Grid>
                    <Grid size={4}>
                      <Typography variant="body2" color="text.secondary">
                        Restante
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatarMoeda(valorRestante)}
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
                        onChange={(e) => {
                          handleChange(e);
                          const formas = {
                            Cartão: "Débito",
                            Dinheiro: "Espécie",
                            Pix: "Pix",
                          };
                          setFieldValue(
                            "forma_pagamento",
                            formas[e.target.value as keyof typeof formas]
                          );
                        }}
                        label="Categoria"
                        error={
                          touched.categoria_pagamento &&
                          !!errors.categoria_pagamento
                        }
                      >
                        <MenuItem value="Cartão">Cartão</MenuItem>
                        <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                        <MenuItem value="Pix">Pix</MenuItem>
                      </Select>
                      {touched.categoria_pagamento &&
                        errors.categoria_pagamento && (
                          <Typography variant="caption" color="error">
                            {errors.categoria_pagamento}
                          </Typography>
                        )}
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
                      error={
                        touched.forma_pagamento && !!errors.forma_pagamento
                      }
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
                      inputProps={{ step: "0.01", min: "0", max: "99999.99" }}
                      value={values.valor_recebido}
                      onChange={handleChange}
                      error={touched.valor_recebido && !!errors.valor_recebido}
                      helperText={
                        touched.valor_recebido && errors.valor_recebido
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">R$</InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {values.categoria_pagamento === "Dinheiro" && (
                    <Grid size={6}>
                      <TextField
                        fullWidth
                        size="small"
                        name="troco"
                        label="Troco (Calculado Automaticamente)"
                        type="number"
                        value={values.troco}
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        O troco é calculado automaticamente baseado no valor
                        restante
                      </Typography>
                    </Grid>
                  )}

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      name="observacao"
                      label="Observação"
                      multiline
                      rows={2}
                      inputProps={{ maxLength: 255 }}
                      value={values.observacao}
                      onChange={handleChange}
                      error={touched.observacao && !!errors.observacao}
                      helperText={touched.observacao && errors.observacao}
                    />
                  </Grid>
                </Grid>

                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setFieldValue("valor_recebido", valorRestante)
                    }
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
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processando..." : "Baixar"}
                </Button>
              </DialogActions>
            </Form>
          );
        }}
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

  // Estados para dialogs de confirmação
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<{
    open: boolean;
    type: "pagamento" | "conta";
    item: any;
    title: string;
    message: string;
  }>({
    open: false,
    type: "pagamento",
    item: null,
    title: "",
    message: "",
  });

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

  // Função para estornar pagamento
  const handleEstornarPagamento = async (pagamentoId: string) => {
    try {
      setLoading(true);
      await service.deletePedidoPagamento(pagamentoId);
      toast.success("Pagamento estornado com sucesso!");
      await fetchDados();
      onFinished();
    } catch (e: any) {
      toast.error(e.message || "Erro ao estornar pagamento");
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir conta a receber
  const handleExcluirConta = async (contaId: string) => {
    try {
      setLoading(true);
      await service.deleteContaReceber(contaId);
      toast.success("Conta a receber excluída com sucesso!");
      await fetchDados();
      onFinished();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir conta a receber");
    } finally {
      setLoading(false);
    }
  };

  // calcula quanto falta antes de 'index' considerar o pagamento atual
  const restanteAntesDoIndex = (index: number, values: FormValues): number => {
    const liquidoOutros = values.pagamentos_vista
      .filter((_, i) => i !== index) // ignora o current card
      .reduce(
        (s, p) => s + calcularValorLiquido(p.valor_pago, p.troco || 0),
        0
      );

    return Math.max(0, totalPedido - valorPago - liquidoOutros);
  };

  // Função para verificar se uma conta pode ser excluída
  const podeExcluirConta = (conta: any) => {
    const valorPago = parseFloat(conta.valor_pago || "0");
    return valorPago === 0 && !conta.quitado;
  };

  // Função para abrir dialog de confirmação
  const abrirConfirmDialog = (type: "pagamento" | "conta", item: any) => {
    if (type === "pagamento") {
      setConfirmDeleteDialog({
        open: true,
        type: "pagamento",
        item,
        title: "Estornar Pagamento",
        message: `Tem certeza que deseja estornar o pagamento de ${formatarMoeda(
          parseFloat(item.valor_pago)
        )} via ${item.forma_pagamento}? Esta ação não pode ser desfeita.`,
      });
    } else {
      if (!podeExcluirConta(item)) {
        toast.warning(
          "Esta conta possui pagamentos e não pode ser excluída. Estorne os pagamentos relacionados primeiro."
        );
        return;
      }

      setConfirmDeleteDialog({
        open: true,
        type: "conta",
        item,
        title: "Excluir Conta a Receber",
        message: `Tem certeza que deseja excluir a parcela ${
          item.parcela
        } no valor de ${formatarMoeda(
          parseFloat(item.valor_devido)
        )}? Esta ação não pode ser desfeita.`,
      });
    }
  };

  // Função para confirmar exclusão/estorno
  const confirmarAcao = async () => {
    const { type, item } = confirmDeleteDialog;

    if (type === "pagamento") {
      await handleEstornarPagamento(item.id);
    } else {
      await handleExcluirConta(item.id);
    }

    setConfirmDeleteDialog({ ...confirmDeleteDialog, open: false });
  };

  // Cálculos principais com validação mais rigorosa
  const totalPedido = useMemo(() => {
    const base = parseFloat(pedido.valor_total || "0");
    const taxa = parseFloat(pedido.taxa_entrega || "0");
    const desconto = parseFloat(pedido.desconto || "0");
    const acrescimo = parseFloat(pedido.acrescimo || "0");

    const total = base + taxa - desconto + acrescimo;
    return Math.max(0, total); // Garante que não seja negativo
  }, [pedido]);

  const valorPago = useMemo(() => {
    if (!pagamentos || pagamentos.length === 0) return 0;
    return pagamentos.reduce((s, p) => {
      const valorPago = parseFloat(p.valor_pago || "0");
      const troco = parseFloat(p.troco || "0");
      return s + Math.max(0, valorPago - troco); // Valor líquido sempre positivo
    }, 0);
  }, [pagamentos]);

  const valorParcelas = useMemo(() => {
    if (!parcelas || parcelas.length === 0) return 0;
    return parcelas.reduce((s, p) => {
      const devido = parseFloat(p.valor_devido || "0");
      return s + Math.max(0, devido);
    }, 0);
  }, [parcelas]);

  const faltaPagar = totalPedido - valorPago;
  const pedidoQuitado = Math.abs(faltaPagar) <= 0.01;
  const percentualPago = totalPedido > 0 ? (valorPago / totalPedido) * 100 : 0;

  // Context para validação Yup
  const validationContext = useMemo(
    () => ({
      totalPedido,
      jaPago: valorPago,
      emParcelas: valorParcelas,
    }),
    [totalPedido, valorPago, valorParcelas]
  );

  // Função para validar um pagamento individual antes de adicionar
  const validarPagamentoIndividual = useCallback(
    (pagamento: PagamentoVista) => {
      const erros: string[] = [];

      // Validações básicas
      if (!pagamento.categoria_pagamento) {
        erros.push("Categoria de pagamento é obrigatória");
      }

      if (!pagamento.forma_pagamento?.trim()) {
        erros.push("Forma de pagamento é obrigatória");
      } else if (pagamento.forma_pagamento.trim().length < 2) {
        erros.push("Forma de pagamento deve ter pelo menos 2 caracteres");
      }

      if (!pagamento.valor_pago || pagamento.valor_pago <= 0) {
        erros.push("Valor pago deve ser maior que zero");
      }

      if (pagamento.valor_pago > 99999.99) {
        erros.push("Valor muito alto (máximo R$ 99.999,99)");
      }

      // Validação de troco
      const troco = pagamento.troco || 0;
      if (troco < 0) {
        erros.push("Troco não pode ser negativo");
      }

      if (troco > 0 && pagamento.categoria_pagamento !== "Dinheiro") {
        erros.push("Troco só é permitido para pagamentos em dinheiro");
      }

      if (troco > pagamento.valor_pago) {
        erros.push("Troco não pode ser maior que o valor pago");
      }

      // Validação de valor líquido
      const valorLiquido = calcularValorLiquido(pagamento.valor_pago, troco);
      if (valorLiquido <= 0) {
        erros.push("Valor líquido do pagamento deve ser positivo");
      }

      return erros;
    },
    []
  );

  // Função para validar uma parcela individual
  const validarParcelaIndividual = useCallback((parcela: ParcelaPrazo) => {
    const erros: string[] = [];

    if (!parcela.parcela || parcela.parcela <= 0) {
      erros.push("Número da parcela deve ser maior que zero");
    }

    if (parcela.parcela > 360) {
      erros.push("Número da parcela muito alto (máximo 360)");
    }

    if (!Number.isInteger(parcela.parcela)) {
      erros.push("Número da parcela deve ser um número inteiro");
    }

    if (!parcela.valor_devido || parcela.valor_devido <= 0) {
      erros.push("Valor devido deve ser maior que zero");
    }

    if (parcela.valor_devido > 99999.99) {
      erros.push("Valor muito alto (máximo R$ 99.999,99)");
    }

    if (!parcela.vencimento) {
      erros.push("Data de vencimento é obrigatória");
    } else if (!validarDataVencimento(parcela.vencimento)) {
      erros.push("Data de vencimento inválida ou não é futura");
    }

    return erros;
  }, []);

  // Função para mostrar erros de validação
  const mostrarErrosValidacao = useCallback((erros: string[]) => {
    erros.forEach((erro) => toast.error(erro));
  }, []);

  // Função melhorada para calcular troco automaticamente
  const calcularTrocoSeguro = useCallback(
    (valorPago: number, valorDue: number) => {
      const pago = parseFloat(String(valorPago)) || 0;
      const devido = parseFloat(String(valorDue)) || 0;
      const troco = Math.max(0, pago - devido);
      return Math.round(troco * 100) / 100; // Arredonda para 2 casas decimais
    },
    []
  );

  // Função para gerar parcelas com validação
  const gerarParcelasValidadas = useCallback(
    (numParcelas: number, valorTotal: number) => {
      if (numParcelas <= 0 || numParcelas > 360) {
        toast.error("Número de parcelas deve estar entre 1 e 360");
        return [];
      }

      if (valorTotal <= 0) {
        toast.error("Valor para parcelamento deve ser maior que zero");
        return [];
      }

      const parcelas: ParcelaPrazo[] = [];
      const valorParcela = Math.floor((valorTotal * 100) / numParcelas) / 100; // Evita problemas de ponto flutuante
      let valorRestante = valorTotal;

      for (let i = 1; i <= numParcelas; i++) {
        const isUltima = i === numParcelas;
        const valor = isUltima ? valorRestante : valorParcela;

        const vencimento = new Date();
        vencimento.setDate(vencimento.getDate() + i * 30);

        parcelas.push({
          parcela: i,
          valor_devido: Math.round(valor * 100) / 100,
          vencimento: vencimento.toISOString().substring(0, 10),
        });

        valorRestante -= valor;
      }

      return parcelas;
    },
    []
  );

  // Submissão do formulário com validação rigorosa
  const handleSubmit = async (values: FormValues) => {
    console.log("🚀 handleSubmit chamado com valores:", values);

    try {
      setLoading(true);

      // Validação manual adicional antes do envio
      const errosGerais: string[] = [];

      // Verifica se tem pelo menos um pagamento ou parcela
      if (
        (!values.pagamentos_vista || values.pagamentos_vista.length === 0) &&
        (!values.parcelas_prazo || values.parcelas_prazo.length === 0)
      ) {
        errosGerais.push("Adicione pelo menos um pagamento ou parcela");
      }

      // Valida pagamentos individuais
      if (values.pagamentos_vista) {
        for (let i = 0; i < values.pagamentos_vista.length; i++) {
          const pagamento = values.pagamentos_vista[i];
          const errosPagamento = validarPagamentoIndividual(pagamento);

          if (errosPagamento.length > 0) {
            errosGerais.push(
              `Pagamento ${i + 1}: ${errosPagamento.join(", ")}`
            );
          }
        }
      }

      // Valida parcelas individuais
      if (values.parcelas_prazo) {
        for (let i = 0; i < values.parcelas_prazo.length; i++) {
          const parcela = values.parcelas_prazo[i];
          const errosParcela = validarParcelaIndividual(parcela);

          if (errosParcela.length > 0) {
            errosGerais.push(`Parcela ${i + 1}: ${errosParcela.join(", ")}`);
          }
        }

        // Verifica duplicatas de parcelas
        const numerosParcelas = new Set();
        for (const parcela of values.parcelas_prazo) {
          if (numerosParcelas.has(parcela.parcela)) {
            errosGerais.push(`Número de parcela duplicado: ${parcela.parcela}`);
            break;
          }
          numerosParcelas.add(parcela.parcela);
        }

        // Verifica se parcelas são sequenciais (começando em 1)
        if (values.parcelas_prazo.length > 0) {
          const numeros = values.parcelas_prazo
            .map((p) => p.parcela)
            .sort((a, b) => a - b);
          if (numeros[0] !== 1) {
            errosGerais.push("Parcelas devem começar em 1");
          }

          for (let i = 1; i < numeros.length; i++) {
            if (numeros[i] !== numeros[i - 1] + 1) {
              errosGerais.push("Parcelas devem ser sequenciais");
              break;
            }
          }
        }
      }

      // Validação de total
      const somaVista = (values.pagamentos_vista || []).reduce(
        (s, p) => s + calcularValorLiquido(p.valor_pago, p.troco || 0),
        0
      );

      const somaParcelas = (values.parcelas_prazo || []).reduce(
        (s, p) => s + p.valor_devido,
        0
      );

      const restante = totalPedido - valorPago - valorParcelas;
      const novoTotal = somaVista + somaParcelas;

      if (novoTotal > restante + 0.01) {
        errosGerais.push(
          `Total dos novos pagamentos (${formatarMoeda(novoTotal)}) ` +
            `excede o valor restante (${formatarMoeda(restante)})`
        );
      }

      // Se há erros, mostra e para
      if (errosGerais.length > 0) {
        mostrarErrosValidacao(errosGerais);
        return;
      }

      // Processa pagamentos à vista
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
            forma_pagamento: pagamento.forma_pagamento.trim(),
            valor_pago: pagamento.valor_pago.toFixed(2),
            troco: (pagamento.troco || 0).toFixed(2),
            observacao: pagamento.observacao?.trim() || undefined,
          };

          console.log(`📤 Enviando DTO do pagamento ${index + 1}:`, dto);
          const result = await service.createPedidoPagamento(dto);
          console.log(`✅ Pagamento ${index + 1} criado:`, result);
        }
      }

      // Processa parcelas a prazo
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
      setActiveStep(0);
      await fetchDados();
      onFinished();
    } catch (e: any) {
      console.error("❌ Erro ao processar pagamentos:", e);

      // Tenta extrair mensagem de erro mais útil
      let mensagemErro = "Erro ao processar pagamentos";

      if (e.response?.data?.error) {
        mensagemErro = e.response.data.error;
      } else if (e.message) {
        mensagemErro = e.message;
      }

      toast.error(mensagemErro);
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
        troco: (dados.troco || 0).toFixed(2),
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

  // Função para validação em tempo real durante digitação
  const validarCampoEmTempoReal = useCallback((campo: string, valor: any) => {
    switch (campo) {
      case "valor_pago":
        const val = parseFloat(String(valor)) || 0;
        if (val <= 0) return "Valor deve ser maior que zero";
        if (val > 99999.99) return "Valor muito alto";
        break;

      case "forma_pagamento":
        const forma = String(valor).trim();
        if (forma.length < 2) return "Mínimo 2 caracteres";
        if (forma.length > 100) return "Máximo 100 caracteres";
        break;

      case "vencimento":
        if (!validarDataVencimento(String(valor))) {
          return "Data inválida ou não é futura";
        }
        break;

      case "parcela":
        const num = parseInt(String(valor)) || 0;
        if (num <= 0) return "Deve ser maior que zero";
        if (num > 360) return "Máximo 360 parcelas";
        if (!Number.isInteger(num)) return "Deve ser número inteiro";
        break;
    }

    return null;
  }, []);

  const initialValues: FormValues = {
    pagamentos_vista: [],
    parcelas_prazo: [],
  };

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
    <div className="space-y-3 w-full max-w-5xl">
      {/* Header com Status */}
      <Card variant="outlined">
        <CardContent>
          <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 sm:gap-0">
            <div>
              <Typography
                variant="h5"
                className="font-bold text-base sm:text-xl"
              >
                Pedido #{pedido.codigo_pedido}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                className="text-sm"
              >
                Cliente: {pedido.cliente.nome_razao_social}
              </Typography>
            </div>
            <div className="text-left sm:text-right">
              <Chip
                icon={pedidoQuitado ? <CheckCircle /> : <AlertCircle />}
                label={pedidoQuitado ? "Quitado" : "Pendente"}
                color={pedidoQuitado ? "success" : "warning"}
                size="small"
              />
              <Typography
                variant="body2"
                color="text.secondary"
                className="mt-1 text-sm"
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
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Resumo Financeiro */}
          <Grid container spacing={2}>
            <Grid size={3}>
              <Typography
                variant="body2"
                color="text.secondary"
                className="text-sm"
              >
                Total do Pedido
              </Typography>
              <Typography
                variant="h6"
                className="font-bold text-base sm:text-lg"
              >
                {formatarMoeda(totalPedido)}
              </Typography>
            </Grid>
            <Grid size={3}>
              <Typography
                variant="body2"
                color="text.secondary"
                className="text-sm"
              >
                Valor Pago
              </Typography>
              <Typography
                variant="h6"
                color="success.main"
                className="font-bold text-base sm:text-lg"
              >
                {formatarMoeda(valorPago)}
              </Typography>
            </Grid>
            <Grid size={3}>
              <Typography
                variant="body2"
                color="text.secondary"
                className="text-sm"
              >
                Em Parcelas
              </Typography>
              <Typography
                variant="h6"
                color="info.main"
                className="font-bold text-base sm:text-lg"
              >
                {formatarMoeda(valorParcelas)}
              </Typography>
            </Grid>
            <Grid size={3}>
              <Typography
                variant="body2"
                color="text.secondary"
                className="text-sm"
              >
                Falta Pagar
              </Typography>
              <Typography
                variant="h6"
                color={faltaPagar <= 0.01 ? "success.main" : "error.main"}
                className="font-bold text-base sm:text-lg"
              >
                {formatarMoeda(faltaPagar)}
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
                            {p.id_conta_receber ? (
                              <Chip
                                size="small"
                                label="Recebimento de parcela"
                                variant="outlined"
                                color="success"
                                className="ml-2"
                              />
                            ) : null}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(p.created_at).toLocaleString("pt-BR")}
                          </Typography>
                        </div>
                        <div className="text-right">
                          <Typography variant="h6" className="font-semibold">
                            {formatarMoeda(parseFloat(p.valor_pago))}
                          </Typography>
                          {p.troco && parseFloat(p.troco) > 0 ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Troco: {formatarMoeda(parseFloat(p.troco))}
                            </Typography>
                          ) : null}
                        </div>
                      </Box>
                    }
                  />
                  <div className="flex items-center gap-2 ml-2">
                    <Chip
                      size="small"
                      label={p.categoria_pagamento}
                      variant="outlined"
                    />
                    <Tooltip title="Estornar Pagamento">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => abrirConfirmDialog("pagamento", p)}
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </div>
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
              {parcelas.map((p) => {
                const podeExcluir = podeExcluirConta(p);
                const valorPagoAtual = parseFloat(p.valor_pago || "0");
                const tooltipMessage = podeExcluir
                  ? "Excluir conta a receber"
                  : "Esta conta possui pagamentos e não pode ser excluída. Estorne os pagamentos relacionados primeiro.";

                return (
                  <ListItem
                    key={p.id}
                    divider
                    secondaryAction={
                      <div className="flex items-center gap-2">
                        {!p.quitado && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setParcelaParaBaixar(p)}
                            startIcon={<Receipt />}
                          >
                            Baixar
                          </Button>
                        )}
                        <Tooltip title={tooltipMessage}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => abrirConfirmDialog("conta", p)}
                              disabled={loading || !podeExcluir}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </div>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box className="flex justify-between items-center mr-32">
                          <div>
                            <Typography variant="subtitle1">
                              Parcela {p.parcela}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Vencimento:{" "}
                              {new Date(p.vencimento).toLocaleDateString(
                                "pt-BR"
                              )}
                            </Typography>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <Typography variant="h6" className="font-semibold">
                              {formatarMoeda(parseFloat(p.valor_devido))}
                            </Typography>
                            {valorPagoAtual > 0 && (
                              <Typography
                                variant="caption"
                                color="success.main"
                              >
                                Pago: {formatarMoeda(valorPagoAtual)}
                              </Typography>
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
                );
              })}
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
              validationSchema={finalizarPedidoSchema}
              validationContext={validationContext}
              validateOnChange={true}
              validateOnBlur={true}
              onSubmit={handleSubmit}
              enableReinitialize={false}
            >
              {({
                values,
                setFieldValue,
                errors,
                touched,
                isValid,
                isSubmitting,
                validateField,
                setFieldError,
                setFieldTouched,
              }) => {
                // Função para adicionar pagamento com validação prévia
                const adicionarPagamentoComValidacao = (
                  pagamento: PagamentoVista
                ) => {
                  const erros = validarPagamentoIndividual(pagamento);
                  if (erros.length > 0) {
                    mostrarErrosValidacao(erros);
                    return false;
                  }

                  setFieldValue("pagamentos_vista", [
                    ...values.pagamentos_vista,
                    pagamento,
                  ]);
                  return true;
                };

                // Função para adicionar parcela com validação prévia
                const adicionarParcelaComValidacao = (
                  parcela: ParcelaPrazo
                ) => {
                  const erros = validarParcelaIndividual(parcela);
                  if (erros.length > 0) {
                    mostrarErrosValidacao(erros);
                    return false;
                  }

                  // Verifica duplicatas
                  const jaExiste = values.parcelas_prazo.some(
                    (p) => p.parcela === parcela.parcela
                  );
                  if (jaExiste) {
                    toast.error(
                      `Já existe uma parcela com número ${parcela.parcela}`
                    );
                    return false;
                  }

                  setFieldValue("parcelas_prazo", [
                    ...values.parcelas_prazo,
                    parcela,
                  ]);
                  return true;
                };

                // Função para validar campos individuais
                const validarCampo = async (campo: string, valor: any) => {
                  const erro = validarCampoEmTempoReal(campo, valor);
                  if (erro) {
                    setFieldError(campo, erro);
                    setFieldTouched(campo, true);
                  } else {
                    await validateField(campo);
                  }
                };

                return (
                  <Form
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // impede o submit
                      }
                    }}
                  >
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
                            {({ push, remove }) => (
                              <>
                                {/* Botões de pagamento rápido */}
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
                                              if (valorRestante <= 0) {
                                                toast.warning(
                                                  "Não há valor restante para pagar"
                                                );
                                                return;
                                              }

                                              const pagamento = {
                                                categoria_pagamento:
                                                  "Dinheiro" as const,
                                                forma_pagamento: "Espécie",
                                                valor_pago: valorRestante,
                                                troco: calcularTrocoSeguro(
                                                  valorRestante,
                                                  valorRestante
                                                ),
                                                observacao: "Pagamento total",
                                              };

                                              if (
                                                adicionarPagamentoComValidacao(
                                                  pagamento
                                                )
                                              ) {
                                                setActiveStep(2);
                                                toast.success(
                                                  "Pagamento em dinheiro adicionado"
                                                );
                                              }
                                            }}
                                          >
                                            Total em Dinheiro (
                                            {formatarMoeda(faltaPagar)})
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            startIcon={<CreditCard size={16} />}
                                            onClick={() => {
                                              const valorRestante = Math.max(
                                                0,
                                                faltaPagar
                                              );
                                              if (valorRestante <= 0) {
                                                toast.warning(
                                                  "Não há valor restante para pagar"
                                                );
                                                return;
                                              }

                                              const pagamento = {
                                                categoria_pagamento:
                                                  "Cartão" as const,
                                                forma_pagamento: "Débito",
                                                valor_pago: valorRestante,
                                                troco: 0,
                                                observacao: "Pagamento total",
                                              };

                                              if (
                                                adicionarPagamentoComValidacao(
                                                  pagamento
                                                )
                                              ) {
                                                setActiveStep(2);
                                                toast.success(
                                                  "Pagamento em cartão adicionado"
                                                );
                                              }
                                            }}
                                          >
                                            Total em Cartão (
                                            {formatarMoeda(faltaPagar)})
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Receipt size={16} />}
                                            onClick={() => {
                                              const valorRestante = Math.max(
                                                0,
                                                faltaPagar
                                              );
                                              if (valorRestante <= 0) {
                                                toast.warning(
                                                  "Não há valor restante para pagar"
                                                );
                                                return;
                                              }

                                              const pagamento = {
                                                categoria_pagamento:
                                                  "Pix" as const,
                                                forma_pagamento: "Pix",
                                                valor_pago: valorRestante,
                                                troco: 0,
                                                observacao: "Pagamento total",
                                              };

                                              if (
                                                adicionarPagamentoComValidacao(
                                                  pagamento
                                                )
                                              ) {
                                                setActiveStep(2);
                                                toast.success(
                                                  "Pagamento em Pix adicionado"
                                                );
                                              }
                                            }}
                                          >
                                            Total em Pix (
                                            {formatarMoeda(faltaPagar)})
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
                                          {[2, 5, 10, 20, 50, 100, 200].map(
                                            (nota) => (
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
                                            )
                                          )}
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
                                                    label={`R${nota}`}
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
                                              {formatarMoeda(
                                                notasSelecionadas.reduce(
                                                  (sum, nota) => sum + nota,
                                                  0
                                                )
                                              )}
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                            >
                                              Troco Estimado:{" "}
                                              {formatarMoeda(
                                                calcularTrocoSeguro(
                                                  notasSelecionadas.reduce(
                                                    (sum, nota) => sum + nota,
                                                    0
                                                  ),
                                                  Math.min(
                                                    notasSelecionadas.reduce(
                                                      (sum, nota) => sum + nota,
                                                      0
                                                    ),
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
                                              const totalNotas =
                                                notasSelecionadas.reduce(
                                                  (sum, nota) => sum + nota,
                                                  0
                                                );
                                              if (totalNotas <= 0) {
                                                toast.error(
                                                  "Selecione pelo menos uma nota válida"
                                                );
                                                return;
                                              }
                                              const troco = calcularTrocoSeguro(
                                                totalNotas,
                                                Math.min(totalNotas, faltaPagar)
                                              );
                                              const pagamento = {
                                                categoria_pagamento:
                                                  "Dinheiro" as const,
                                                forma_pagamento: "Espécie",
                                                valor_pago: totalNotas,
                                                troco: troco,
                                                observacao: `Notas: ${notasSelecionadas.join(
                                                  ", "
                                                )}`,
                                              };

                                              if (
                                                adicionarPagamentoComValidacao(
                                                  pagamento
                                                )
                                              ) {
                                                setNotasSelecionadas([]); // Resetar após confirmar
                                                toast.success(
                                                  "Pagamento com notas adicionado"
                                                );
                                              }
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

                                {/* Lista de pagamentos */}
                                {values.pagamentos_vista.map(
                                  (pagamento, index) => {
                                    const formaTouch = getIn(
                                      touched,
                                      `pagamentos_vista.${index}.forma_pagamento`
                                    );
                                    const formaError = getIn(
                                      errors,
                                      `pagamentos_vista.${index}.forma_pagamento`
                                    );
                                    const valorTouch = getIn(
                                      touched,
                                      `pagamentos_vista.${index}.valor_pago`
                                    );
                                    const valorError = getIn(
                                      errors,
                                      `pagamentos_vista.${index}.valor_pago`
                                    );
                                    return (
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
                                            <IconButton
                                              size="small"
                                              onClick={() => remove(index)}
                                              color="error"
                                            >
                                              <Delete size={16} />
                                            </IconButton>
                                          </Box>

                                          <Grid container spacing={2}>
                                            {/* Categoria */}
                                            <Grid size={4}>
                                              <FormControl
                                                fullWidth
                                                size="small"
                                              >
                                                <InputLabel>
                                                  Categoria *
                                                </InputLabel>
                                                <Select
                                                  value={
                                                    pagamento.categoria_pagamento
                                                  }
                                                  label="Categoria *"
                                                  onChange={(e) => {
                                                    const cat = e.target
                                                      .value as
                                                      | "Cartão"
                                                      | "Dinheiro"
                                                      | "Pix";

                                                    // 1) grava a categoria no Formik
                                                    setFieldValue(
                                                      `pagamentos_vista.${index}.categoria_pagamento`,
                                                      cat
                                                    );

                                                    // 2) (opcional) define uma forma padrão coerente
                                                    const formas = {
                                                      Cartão: "Débito",
                                                      Dinheiro: "Espécie",
                                                      Pix: "Pix",
                                                    };
                                                    setFieldValue(
                                                      `pagamentos_vista.${index}.forma_pagamento`,
                                                      formas[cat]
                                                    );
                                                  }}
                                                  error={
                                                    !!getIn(
                                                      errors,
                                                      `pagamentos_vista.${index}.categoria_pagamento`
                                                    )
                                                  }
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
                                                {formaTouch ||
                                                  (formaError && (
                                                    <Typography
                                                      variant="caption"
                                                      color="error"
                                                    >
                                                      {formaError}
                                                    </Typography>
                                                  ))}
                                              </FormControl>
                                            </Grid>

                                            {/* Forma de Pagamento */}
                                            <Grid size={4}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                label="Forma/Bandeira *"
                                                value={
                                                  pagamento.forma_pagamento
                                                }
                                                onChange={(e) => {
                                                  setFieldValue(
                                                    `pagamentos_vista.${index}.forma_pagamento`,
                                                    e.target.value
                                                  );
                                                  validarCampo(
                                                    `pagamentos_vista.${index}.forma_pagamento`,
                                                    e.target.value
                                                  );
                                                }}
                                                onBlur={() => {
                                                  setFieldTouched(
                                                    `pagamentos_vista.${index}.forma_pagamento`,
                                                    true
                                                  );
                                                }}
                                                error={
                                                  !!(formaTouch || formaError)
                                                }
                                                helperText={
                                                  formaError && (
                                                    <Typography
                                                      variant="caption"
                                                      color="error"
                                                    >
                                                      {formaError}
                                                    </Typography>
                                                  )
                                                }
                                              />
                                            </Grid>

                                            {/* Valor Pago */}
                                            <Grid size={4}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                label="Valor Pago *"
                                                type="number"
                                                inputProps={{
                                                  step: "0.01",
                                                  min: "0",
                                                  max: "99999.99",
                                                }}
                                                value={pagamento.valor_pago}
                                                onChange={(e) => {
                                                  const valor =
                                                    parseFloat(
                                                      e.target.value
                                                    ) || 0;

                                                  setFieldValue(
                                                    `pagamentos_vista.${index}.valor_pago`,
                                                    valor
                                                  );

                                                  // ♦ usa o helper em vez de faltaPagar
                                                  const restanteAtual =
                                                    restanteAntesDoIndex(
                                                      index,
                                                      values
                                                    );

                                                  if (
                                                    pagamento.categoria_pagamento ===
                                                    "Dinheiro"
                                                  ) {
                                                    const novoTroco =
                                                      calcularTrocoSeguro(
                                                        valor,
                                                        restanteAtual
                                                      );
                                                    setFieldValue(
                                                      `pagamentos_vista.${index}.troco`,
                                                      novoTroco
                                                    );
                                                  }

                                                  validarCampo(
                                                    `pagamentos_vista.${index}.valor_pago`,
                                                    valor
                                                  );
                                                }}
                                                onBlur={() => {
                                                  setFieldTouched(
                                                    `pagamentos_vista.${index}.valor_pago`,
                                                    true
                                                  );
                                                }}
                                                error={
                                                  !!(valorTouch || valorError)
                                                }
                                                helperText={
                                                  valorError && (
                                                    <Typography
                                                      variant="caption"
                                                      color="error"
                                                    >
                                                      {valorError}
                                                    </Typography>
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

                                            {/* Troco (só para dinheiro) */}
                                            {pagamento.categoria_pagamento ===
                                              "Dinheiro" && (
                                              <Grid size={6}>
                                                <TextField
                                                  fullWidth
                                                  size="small"
                                                  label="Troco (Calculado Automaticamente)"
                                                  type="number"
                                                  disabled
                                                  value={pagamento.troco || 0}
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
                                                  Troco calculado baseado no
                                                  valor restante do pedido
                                                </Typography>
                                              </Grid>
                                            )}

                                            {/* Observação */}
                                            <Grid size={12}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                label="Observação"
                                                multiline
                                                rows={2}
                                                inputProps={{ maxLength: 255 }}
                                                value={
                                                  pagamento.observacao || ""
                                                }
                                                onChange={(e) => {
                                                  setFieldValue(
                                                    `pagamentos_vista.${index}.observacao`,
                                                    e.target.value
                                                  );
                                                }}
                                                placeholder="Observações sobre este pagamento..."
                                                helperText={`${
                                                  (pagamento.observacao || "")
                                                    .length
                                                }/255 caracteres`}
                                              />
                                            </Grid>
                                          </Grid>
                                        </CardContent>
                                      </Card>
                                    );
                                  }
                                )}

                                {/* Botão para adicionar pagamento manual */}
                                <Button
                                  startIcon={<Add />}
                                  onClick={() => {
                                    const novoPagamento: PagamentoVista = {
                                      categoria_pagamento: "Cartão",
                                      forma_pagamento: "Débito",
                                      valor_pago: 0,
                                      troco: 0,
                                      observacao: "",
                                    };
                                    push(novoPagamento);
                                  }}
                                  variant="outlined"
                                  className="mb-4"
                                >
                                  Adicionar Pagamento Manual
                                </Button>
                              </>
                            )}
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
                                      {[1, 2, 3, 6, 12].map((num) => {
                                        const valorRestante = Math.max(
                                          0,
                                          faltaPagar -
                                            values.pagamentos_vista.reduce(
                                              (s, p) =>
                                                s +
                                                calcularValorLiquido(
                                                  p.valor_pago,
                                                  p.troco || 0
                                                ),
                                              0
                                            )
                                        );

                                        return (
                                          <Button
                                            key={num}
                                            size="small"
                                            variant="outlined"
                                            disabled={valorRestante <= 0}
                                            onClick={() => {
                                              if (valorRestante <= 0) {
                                                toast.warning(
                                                  "Não há valor restante para parcelar"
                                                );
                                                return;
                                              }

                                              const novasParcelas =
                                                gerarParcelasValidadas(
                                                  num,
                                                  valorRestante
                                                );
                                              if (novasParcelas.length > 0) {
                                                setFieldValue(
                                                  "parcelas_prazo",
                                                  novasParcelas
                                                );
                                                toast.success(
                                                  `${num} parcelas geradas automaticamente`
                                                );
                                              }
                                            }}
                                            startIcon={<Calculator size={16} />}
                                          >
                                            {num}x de{" "}
                                            {formatarMoeda(valorRestante / num)}
                                          </Button>
                                        );
                                      })}
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Parcelas com vencimento a cada 30 dias,
                                      começando em 30 dias
                                    </Typography>
                                  </CardContent>
                                </Card>

                                {/* Lista de parcelas */}
                                {values.parcelas_prazo.map((parcela, index) => {
                                  const parcelaTouch = getIn(
                                    touched,
                                    `parcelas_prazo.${index}.parcela`
                                  );
                                  const parcelaError = getIn(
                                    errors,
                                    `parcelas_prazo.${index}.parcela`
                                  );
                                  const valorDevidoTouch = getIn(
                                    touched,
                                    `parcelas_prazo.${index}.valor_devido`
                                  );
                                  const valorDevidoError = getIn(
                                    errors,
                                    `parcelas_prazo.${index}.valor_devido`
                                  );
                                  const vencimentoTouch = getIn(
                                    touched,
                                    `parcelas_prazo.${index}.vencimento`
                                  );
                                  const vencimentoError = getIn(
                                    errors,
                                    `parcelas_prazo.${index}.vencimento`
                                  );
                                  return (
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
                                          {/* Número da Parcela */}
                                          <Grid size={4}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Número da Parcela *"
                                              type="number"
                                              inputProps={{
                                                min: "1",
                                                max: "360",
                                                step: "1",
                                              }}
                                              value={parcela.parcela}
                                              onChange={(e) => {
                                                const valor =
                                                  parseInt(e.target.value) || 1;
                                                setFieldValue(
                                                  `parcelas_prazo.${index}.parcela`,
                                                  valor
                                                );
                                                validarCampo(
                                                  `parcelas_prazo.${index}.parcela`,
                                                  valor
                                                );
                                              }}
                                              onBlur={() => {
                                                setFieldTouched(
                                                  `parcelas_prazo.${index}.parcela`,
                                                  true
                                                );
                                              }}
                                              error={
                                                !!(parcelaTouch || parcelaError)
                                              }
                                              helperText={
                                                parcelaError && (
                                                  <Typography
                                                    variant="caption"
                                                    color="error"
                                                  >
                                                    {parcelaError}
                                                  </Typography>
                                                )
                                              }
                                            />
                                          </Grid>

                                          {/* Valor Devido */}
                                          <Grid size={4}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Valor Devido *"
                                              type="number"
                                              inputProps={{
                                                step: "0.01",
                                                min: "0",
                                                max: "99999.99",
                                              }}
                                              value={parcela.valor_devido}
                                              onChange={(e) => {
                                                const valor =
                                                  parseFloat(e.target.value) ||
                                                  0;
                                                setFieldValue(
                                                  `parcelas_prazo.${index}.valor_devido`,
                                                  valor
                                                );
                                                validarCampo(
                                                  `parcelas_prazo.${index}.valor_devido`,
                                                  valor
                                                );
                                              }}
                                              onBlur={() => {
                                                setFieldTouched(
                                                  `parcelas_prazo.${index}.valor_devido`,
                                                  true
                                                );
                                              }}
                                              error={
                                                !!(
                                                  valorDevidoTouch ||
                                                  valorDevidoError
                                                )
                                              }
                                              helperText={
                                                valorDevidoError && (
                                                  <Typography
                                                    variant="caption"
                                                    color="error"
                                                  >
                                                    {valorDevidoError}
                                                  </Typography>
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

                                          {/* Vencimento */}
                                          <Grid size={4}>
                                            <TextField
                                              fullWidth
                                              size="small"
                                              label="Vencimento *"
                                              type="date"
                                              value={parcela.vencimento}
                                              onChange={(e) => {
                                                setFieldValue(
                                                  `parcelas_prazo.${index}.vencimento`,
                                                  e.target.value
                                                );
                                                validarCampo(
                                                  `parcelas_prazo.${index}.vencimento`,
                                                  e.target.value
                                                );
                                              }}
                                              onBlur={() => {
                                                setFieldTouched(
                                                  `parcelas_prazo.${index}.vencimento`,
                                                  true
                                                );
                                              }}
                                              error={
                                                !!(
                                                  vencimentoTouch ||
                                                  vencimentoError
                                                )
                                              }
                                              helperText={
                                                vencimentoError && (
                                                  <Typography
                                                    variant="caption"
                                                    color="error"
                                                  >
                                                    {vencimentoError}
                                                  </Typography>
                                                )
                                              }
                                              InputLabelProps={{ shrink: true }}
                                            />
                                          </Grid>
                                        </Grid>
                                      </CardContent>
                                    </Card>
                                  );
                                })}

                                {/* Botão para adicionar parcela manual */}
                                <Button
                                  startIcon={<Add />}
                                  disabled={
                                    restanteAntesDoIndex(
                                      values.pagamentos_vista.length,
                                      values
                                    ) <= 0
                                  }
                                  onClick={() => {
                                    const proximaParcela =
                                      Math.max(
                                        1,
                                        ...values.parcelas_prazo.map(
                                          (p) => p.parcela
                                        ),
                                        0
                                      ) + 1;
                                    const proximoVencimento = new Date();
                                    proximoVencimento.setDate(
                                      proximoVencimento.getDate() + 30
                                    );

                                    const novaParcela: ParcelaPrazo = {
                                      parcela: proximaParcela,
                                      valor_devido: 0,
                                      vencimento: proximoVencimento
                                        .toISOString()
                                        .substring(0, 10),
                                    };

                                    push(novaParcela);
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
                          {typeof errors === "string" && (
                            <Alert severity="error" className="mb-4">
                              {errors}
                            </Alert>
                          )}

                          {/* Erros específicos dos arrays */}
                          {errors.pagamentos_vista &&
                            typeof errors.pagamentos_vista === "string" && (
                              <Alert severity="error" className="mb-4">
                                {errors.pagamentos_vista}
                              </Alert>
                            )}

                          {errors.parcelas_prazo &&
                            typeof errors.parcelas_prazo === "string" && (
                              <Alert severity="error" className="mb-4">
                                {errors.parcelas_prazo}
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
                                {values.pagamentos_vista.map((pag, index) => {
                                  const valorLiquido = calcularValorLiquido(
                                    pag.valor_pago,
                                    pag.troco || 0
                                  );
                                  return (
                                    <Box
                                      key={index}
                                      className="flex flex-col gap-1 py-2"
                                    >
                                      <Box className="flex justify-between items-center">
                                        <Typography>
                                          {pag.forma_pagamento} (
                                          {pag.categoria_pagamento})
                                        </Typography>
                                        <Typography className="font-semibold">
                                          {formatarMoeda(pag.valor_pago)}
                                        </Typography>
                                      </Box>
                                      {pag.troco && pag.troco > 0 ? (
                                        <Box className="flex justify-between items-center text-gray-600">
                                          <Typography variant="body2">
                                            Troco
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            className="font-medium text-red-500"
                                          >
                                            - {formatarMoeda(pag.troco)}
                                          </Typography>
                                        </Box>
                                      ) : null}
                                      <Box className="flex justify-between items-center px-2 py-1 rounded">
                                        <Typography
                                          variant="body2"
                                          className="font-medium"
                                        >
                                          Valor Final
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          className="font-semibold text-green-600"
                                        >
                                          {formatarMoeda(valorLiquido)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  );
                                })}
                                <Divider className="mt-2" />
                                <Box className="flex justify-between items-center pt-2 font-semibold">
                                  <span>Subtotal à Vista:</span>
                                  <span>
                                    {formatarMoeda(
                                      values.pagamentos_vista.reduce(
                                        (s, p) =>
                                          s +
                                          calcularValorLiquido(
                                            p.valor_pago,
                                            p.troco || 0
                                          ),
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
                                      {formatarMoeda(parc.valor_devido)}
                                    </span>
                                  </Box>
                                ))}
                                <Divider className="mt-2" />
                                <Box className="flex justify-between items-center pt-2 font-semibold">
                                  <span>Subtotal em Parcelas:</span>
                                  <span>
                                    {formatarMoeda(
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
                                    {formatarMoeda(totalPedido)}
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
                                    {formatarMoeda(valorPago + valorParcelas)}
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
                                    {formatarMoeda(
                                      values.pagamentos_vista.reduce(
                                        (s, p) =>
                                          s +
                                          calcularValorLiquido(
                                            p.valor_pago,
                                            p.troco || 0
                                          ),
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
                                    {(() => {
                                      const novosPagamentos =
                                        values.pagamentos_vista.reduce(
                                          (s, p) =>
                                            s +
                                            calcularValorLiquido(
                                              p.valor_pago,
                                              p.troco || 0
                                            ),
                                          0
                                        );
                                      const novasParcelas =
                                        values.parcelas_prazo.reduce(
                                          (s, p) => s + p.valor_devido,
                                          0
                                        );
                                      const restante =
                                        faltaPagar -
                                        novosPagamentos -
                                        novasParcelas;

                                      return Math.abs(restante) <= 0.01
                                        ? "✓ Completo"
                                        : "⚠ Incompleto";
                                    })()}
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
                              disabled={loading || isSubmitting || !isValid}
                              startIcon={<Receipt />}
                              size="large"
                              onClick={async () => {
                                // Validação final antes do submit
                                console.log("🔘 Botão Finalizar clicado!");
                                console.log("📊 Estado atual:", {
                                  isValid,
                                  isSubmitting,
                                  errors,
                                  values,
                                });

                                // Verifica se há pelo menos um pagamento ou parcela
                                if (
                                  values.pagamentos_vista.length === 0 &&
                                  values.parcelas_prazo.length === 0
                                ) {
                                  toast.error(
                                    "Adicione pelo menos um pagamento ou parcela"
                                  );
                                  return;
                                }

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
                onClick={async () => {
                  try {
                    const response = await api.get(
                      `/pedidos/relatorio/${pedido.id}`,
                      {
                        responseType: "blob",
                      }
                    );

                    // Criar URL do blob PDF
                    const pdfBlob = new Blob([response.data], {
                      type: "application/pdf",
                    });
                    const pdfUrl = URL.createObjectURL(pdfBlob);

                    // Abrir em nova aba para impressão
                    const printWindow = window.open(pdfUrl);
                    printWindow?.print();

                    // Limpar URL do blob após impressão
                    printWindow?.addEventListener("afterprint", () => {
                      URL.revokeObjectURL(pdfUrl);
                      printWindow.close();
                    });
                  } catch (error) {
                    console.error("Erro ao gerar comprovante:", error);
                    toast.error("Erro ao gerar comprovante para impressão");
                  }
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

      {/* Dialog de confirmação para estorno/exclusão */}
      <ConfirmDeleteDialog
        open={confirmDeleteDialog.open}
        onClose={() =>
          setConfirmDeleteDialog({ ...confirmDeleteDialog, open: false })
        }
        onConfirm={confirmarAcao}
        title={confirmDeleteDialog.title}
        message={confirmDeleteDialog.message}
        isLoading={loading}
      />
    </div>
  );
}
