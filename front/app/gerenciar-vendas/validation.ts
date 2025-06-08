// utils/validation.ts
import * as Yup from "yup";
import { TestContext } from "yup";

interface ValCtx {
  totalPedido: number; // valor total do pedido
  jaPago: number; // já pago (pagamentos à vista no banco)
  emParcelas: number; // total já gerado em contas-a-receber
}

const toNumber = (v: any) => {
  if (v === null || v === undefined || v === "") return 0;
  const str = String(v).replace(",", ".");
  const num = Number(str);
  return isNaN(num) ? 0 : num;
};

function ctx(this: TestContext): ValCtx {
  return (this.options.context || {}) as ValCtx;
}

/* ───────── Schema de cada pagamento à vista ───────── */
export const pagamentoVistaSchema = Yup.object({
  categoria_pagamento: Yup.mixed<"Cartão" | "Dinheiro" | "Pix">()
    .oneOf(
      ["Cartão", "Dinheiro", "Pix"],
      "Categoria deve ser Cartão, Dinheiro ou Pix"
    )
    .required("Informe a categoria de pagamento"),

  forma_pagamento: Yup.string()
    .trim()
    .min(2, "Forma de pagamento deve ter pelo menos 2 caracteres")
    .max(100, "Forma de pagamento muito longa (máx. 100 caracteres)")
    .required("Informe a forma de pagamento"),

  valor_pago: Yup.number()
    .transform(toNumber)
    .positive("Valor pago deve ser maior que zero")
    .max(99999.99, "Valor muito alto (máx. R$ 99.999,99)")
    .test("duas-casas", "Valor deve ter no máximo 2 casas decimais", (v) => {
      if (!v) return true;
      return Number((v * 100).toFixed(0)) / 100 === v;
    })
    .required("Valor pago é obrigatório"),

  troco: Yup.number()
    .transform(toNumber)
    .min(0, "Troco não pode ser negativo")
    .max(99999.99, "Troco muito alto")
    .test("duas-casas", "Troco deve ter no máximo 2 casas decimais", (v) => {
      if (!v) return true;
      return Number((v * 100).toFixed(0)) / 100 === v;
    })
    .when("categoria_pagamento", {
      is: "Dinheiro",
      then: (s) => s.default(0),
      otherwise: (s) =>
        s
          .test(
            "troco-zero",
            "Troco só é permitido para pagamento em dinheiro",
            (v) => {
              return !v || v === 0;
            }
          )
          .default(0),
    })
    .test(
      "troco-menor-valor",
      "Troco não pode ser maior que o valor pago",
      function (troco) {
        const valorPago = this.parent.valor_pago;
        if (!troco || !valorPago) return true;
        return troco <= valorPago;
      }
    ),

  observacao: Yup.string()
    .max(255, "Observação muito longa (máx. 255 caracteres)")
    .nullable()
    .default(""),
});

/* ───────── Schema de cada parcela a prazo ───────── */
export const parcelaPrazoSchema = Yup.object({
  parcela: Yup.number()
    .integer("Número da parcela deve ser um número inteiro")
    .positive("Número da parcela deve ser maior que zero")
    .max(360, "Número da parcela muito alto (máx. 360)")
    .required("Número da parcela é obrigatório"),

  valor_devido: Yup.number()
    .transform(toNumber)
    .positive("Valor devido deve ser maior que zero")
    .max(99999.99, "Valor muito alto (máx. R$ 99.999,99)")
    .test("duas-casas", "Valor deve ter no máximo 2 casas decimais", (v) => {
      if (!v) return true;
      return Number((v * 100).toFixed(0)) / 100 === v;
    })
    .required("Valor devido é obrigatório"),

  vencimento: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
    .test("data-valida", "Data inválida", (d) => {
      if (!d) return false;
      const date = new Date(d + "T00:00:00");
      return (
        !isNaN(date.getTime()) && d === date.toISOString().substring(0, 10)
      );
    })
    .test("data-futura", "Data de vencimento deve ser futura", (d) => {
      if (!d) return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(d + "T00:00:00");
      return vencimento.getTime() >= hoje.getTime();
    })
    .required("Data de vencimento é obrigatória"),
});

/* ───────── Schema principal (Formik) ───────── */
export const finalizarPedidoSchema = Yup.object({
  pagamentos_vista: Yup.array()
    .of(pagamentoVistaSchema)
    .test(
      "valores-positivos",
      "Todos os pagamentos devem ter valor líquido positivo",
      (arr = []) => {
        return arr.every((p) => {
          const valorLiquido = toNumber(p.valor_pago) - toNumber(p.troco);
          return valorLiquido > 0;
        });
      }
    ),

  parcelas_prazo: Yup.array()
    .of(parcelaPrazoSchema)
    .test(
      "parcelas-duplicadas",
      "Não é possível ter parcelas com mesmo número",
      (arr = []) => {
        if (arr.length <= 1) return true;

        const numeros = new Set();
        for (const p of arr) {
          if (numeros.has(p.parcela)) {
            return false;
          }
          numeros.add(p.parcela);
        }
        return true;
      }
    )
    .test(
      "parcelas-sequenciais",
      "Parcelas devem começar em 1 e ser sequenciais",
      (arr = []) => {
        if (!arr || arr.length === 0) return true;

        const numeros = arr.map((p) => p.parcela).sort((a, b) => a - b);

        // Deve começar em 1
        if (numeros[0] !== 1) return false;

        // Deve ser sequencial
        for (let i = 1; i < numeros.length; i++) {
          if (numeros[i] !== numeros[i - 1] + 1) {
            return false;
          }
        }

        return true;
      }
    ),
})
  .test(
    "tem-pagamento-ou-parcela",
    "Adicione pelo menos um pagamento à vista ou uma parcela",
    function (obj) {
      const temPagamento =
        obj.pagamentos_vista && obj.pagamentos_vista.length > 0;
      const temParcela = obj.parcelas_prazo && obj.parcelas_prazo.length > 0;
      return temPagamento || temParcela;
    }
  )
  .test("soma-nao-ultrapassa-total", function (obj) {
    const { totalPedido, jaPago, emParcelas } = ctx.call(this);

    // Soma dos pagamentos à vista (valor líquido = valor_pago - troco)
    const somaVista = (obj.pagamentos_vista || []).reduce(
      (s, p) => s + toNumber(p.valor_pago) - toNumber(p.troco),
      0
    );

    // Soma das parcelas
    const somaParcelas = (obj.parcelas_prazo || []).reduce(
      (s, p) => s + toNumber(p.valor_devido),
      0
    );

    // Valor restante do pedido
    const restante = totalPedido - jaPago - emParcelas;
    const novoTotal = somaVista + somaParcelas;

    // Margem de erro para problemas de ponto flutuante
    const MARGEM_ERRO = 0.01;

    if (novoTotal > restante + MARGEM_ERRO) {
      return this.createError({
        message: `Total dos pagamentos (R$ ${novoTotal.toFixed(
          2
        )}) excede o valor restante do pedido (R$ ${restante.toFixed(2)})`,
        path: "pagamentos_vista",
      });
    }

    return true;
  })
  .test(
    "validacao-troco-categoria",
    "Troco só pode ser usado em pagamentos em dinheiro",
    function (obj) {
      const pagamentos = obj.pagamentos_vista || [];

      for (let i = 0; i < pagamentos.length; i++) {
        const p = pagamentos[i];
        const troco = toNumber(p.troco);

        if (troco > 0 && p.categoria_pagamento !== "Dinheiro") {
          return this.createError({
            message: "Troco só é permitido para pagamentos em dinheiro",
            path: `pagamentos_vista.${i}.troco`,
          });
        }
      }

      return true;
    }
  )
  .test(
    "validacao-datas-vencimento",
    "Todas as datas de vencimento devem ser futuras",
    function (obj) {
      const parcelas = obj.parcelas_prazo || [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      for (let i = 0; i < parcelas.length; i++) {
        const p = parcelas[i];
        if (p.vencimento) {
          const vencimento = new Date(p.vencimento + "T00:00:00");
          if (vencimento.getTime() < hoje.getTime()) {
            return this.createError({
              message: "Data de vencimento deve ser futura",
              path: `parcelas_prazo.${i}.vencimento`,
            });
          }
        }
      }

      return true;
    }
  );

/* ───────── Schema para baixar parcela ───────── */
export const baixarParcelaSchema = (valorRestante: number) =>
  Yup.object({
    valor_recebido: Yup.number()
      .transform(toNumber)
      .positive("Valor recebido deve ser maior que zero")
      .max(valorRestante * 2, "Valor muito alto para esta parcela")
      .test("duas-casas", "Valor deve ter no máximo 2 casas decimais", (v) => {
        if (!v) return true;
        return Number((v * 100).toFixed(0)) / 100 === v;
      })
      .test(
        "nao-excede-parcela",
        "Valor líquido não pode exceder o restante da parcela",
        function (valor) {
          const troco = toNumber(this.parent.troco);
          const valorLiquido = toNumber(valor) - troco;
          return valorLiquido <= valorRestante + 0.01; // margem de erro
        }
      )
      .required("Valor recebido é obrigatório"),

    categoria_pagamento: Yup.mixed<"Cartão" | "Dinheiro" | "Pix">()
      .oneOf(["Cartão", "Dinheiro", "Pix"], "Categoria inválida")
      .required("Categoria é obrigatória"),

    forma_pagamento: Yup.string()
      .trim()
      .min(2, "Forma de pagamento deve ter pelo menos 2 caracteres")
      .max(100, "Forma de pagamento muito longa")
      .required("Forma de pagamento é obrigatória"),

    troco: Yup.number()
      .transform(toNumber)
      .min(0, "Troco não pode ser negativo")
      .test("duas-casas", "Troco deve ter no máximo 2 casas decimais", (v) => {
        if (!v) return true;
        return Number((v * 100).toFixed(0)) / 100 === v;
      })
      .when("categoria_pagamento", {
        is: "Dinheiro",
        then: (s) =>
          s
            .max(
              Yup.ref("valor_recebido"),
              "Troco não pode ser maior que valor recebido"
            )
            .default(0),
        otherwise: (s) =>
          s
            .test(
              "troco-zero",
              "Troco só permitido para dinheiro",
              (v) => !v || v === 0
            )
            .default(0),
      }),

    observacao: Yup.string()
      .max(255, "Observação muito longa (máx. 255 caracteres)")
      .nullable()
      .default(""),
  });

/* ───────── Funções auxiliares ───────── */
export const calcularValorLiquido = (
  valorPago: number,
  troco: number = 0
): number => {
  return toNumber(valorPago) - toNumber(troco);
};

export const calcularTrocoAutomatico = (
  valorRecebido: number,
  valorDevido: number
): number => {
  const troco = toNumber(valorRecebido) - toNumber(valorDevido);
  return Math.max(0, troco);
};

export const validarFormaPagamento = (
  categoria: string,
  forma: string
): boolean => {
  if (!categoria || !forma) return false;

  const formasValidas = {
    Cartão: [
      "Cartão de Débito",
      "Cartão de Crédito",
      "Vale Alimentação",
      "Vale Refeição",
    ],
    Dinheiro: ["Dinheiro", "Boleto Bancário", "Cheque", "Crediário"],
    Pix: ["PIX", "Transferência Bancária"],
  } as const;

  return forma.trim().length >= 2; // Validação básica - permite formas customizadas
};

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

export const validarDataVencimento = (data: string): boolean => {
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;

  const date = new Date(data + "T00:00:00");
  if (isNaN(date.getTime())) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return date.getTime() >= hoje.getTime();
};
