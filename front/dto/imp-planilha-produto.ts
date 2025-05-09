import * as Yup from "yup";

const columnRegex = /^[A-Z]+$/i; // i para aceitar a→A, mas a gente transforma pra cima

export interface ImpPlanilhaProdutoResponse {
  codigo: string;
  descricao: string;
  preco: number | null;
  qtdeCaixa: number | null;
  produtoID: string;
  estoqueAjustado: boolean;
  fotoProcessada: boolean;
}

export interface FullResponseXls {
  deposito: string;
  message: string;
  produtos: ImpPlanilhaProdutoResponse[];
  sucessos: number;
  tenant_id: string;
}

export const ImpPlanilhaProdutoSchema = Yup.object({
  arquivo: Yup.mixed<File>()
    .required("Selecione o arquivo Excel")
    .test(
      "file-extension",
      "Formato inválido. Use .xlsx, .xlsm, .xltx, .xltm ou .xlam",
      (file) =>
        file instanceof File && /\.(xlsx|xlsm|xltx|xltm|xlam)$/i.test(file.name)
    ),

  representadaId: Yup.string().required("Selecione a representada"),
  depositoId: Yup.string().required("Selecione o depósito"),

  colunaDescricao: Yup.string()
    .transform((val) =>
      typeof val === "string" ? val.trim().toUpperCase() : val
    )
    .required("Informe a coluna da descrição")
    .matches(columnRegex, "Deve ser uma coluna válida (A, B, …)"),

  colunaCodigo: Yup.string()
    .transform((val) =>
      typeof val === "string" ? val.trim().toUpperCase() : val
    )
    .required("Informe a coluna do código")
    .matches(columnRegex, "Deve ser uma coluna válida (A, B, …)"),

  colunaPreco: Yup.string()
    .transform((val) =>
      typeof val === "string" ? val.trim().toUpperCase() : val
    )
    .nullable()
    .notRequired()
    .test(
      "coluna-preco-valida",
      "Deve ser uma coluna válida (A, B, …)",
      (val) => !val || columnRegex.test(val)
    ),

  colunaFoto: Yup.string()
    .transform((val) =>
      typeof val === "string" ? val.trim().toUpperCase() : val
    )
    .nullable()
    .notRequired()
    .test(
      "coluna-foto-valida",
      "Deve ser uma coluna válida (A, B, …)",
      (val) => !val || columnRegex.test(val)
    ),

  colunaQtdeCaixa: Yup.string()
    .transform((val) =>
      typeof val === "string" ? val.trim().toUpperCase() : val
    )
    .nullable()
    .notRequired()
    .test(
      "coluna-qtde-valida",
      "Deve ser uma coluna válida (A, B, …)",
      (val) => !val || columnRegex.test(val)
    ),

  colunaEstoque: Yup.string()
    .transform((val) =>
      typeof val === "string" ? val.trim().toUpperCase() : val
    )
    .nullable()
    .notRequired()
    .test(
      "coluna-estoque-valida",
      "Deve ser uma coluna válida (A, B, …)",
      (val) => !val || columnRegex.test(val)
    ),
}).test("unique-columns", "Não pode haver colunas repetidas", (values) => {
  if (!values) return true;
  const cols = [
    values.colunaDescricao,
    values.colunaCodigo,
    values.colunaPreco,
    values.colunaFoto,
    values.colunaQtdeCaixa,
    values.colunaEstoque,
  ].filter((c): c is string => !!c);
  return new Set(cols).size === cols.length;
});
