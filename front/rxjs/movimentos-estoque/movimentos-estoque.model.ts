import * as yup from "yup";

export interface MovimentoEstoque {
  id: number;
  produto_id: string;
  tenant_id: string;
  deposito_id: string;
  tipo: string;
  quantidade: number;
  doc_ref: string | null;
  created_at: string | null | undefined;
  produto_nome: string | null | undefined;
  produto_codigo: number | null | undefined;
  produto_codigo_ext: string | null | undefined;
  deposito_nome: string | null | undefined;
}

export type InputMovimentoEstoque = Omit<MovimentoEstoque, "id"> & {
  id?: number;
};

export const movimentoEstoqueSchema = yup.object().shape({
  id: yup.number().optional(),
  produto_id: yup
    .string()
    .uuid("produto_id deve ser um UUID válido")
    .required("produto_id é obrigatório"),
  tenant_id: yup
    .string()
    .uuid("tenant_id deve ser um UUID válido")
    .required("tenant_id é obrigatório"),
  deposito_id: yup
    .string()
    .uuid("deposito_id deve ser um UUID válido")
    .required("deposito_id é obrigatório"),
  tipo: yup.string().oneOf(["ENTRADA", "SAIDA"]).required("tipo é obrigatório"),
  quantidade: yup
    .number()
    .min(0, "quantidade deve ser maior que 0")
    .required("quantidade é obrigatório"),
  doc_ref: yup.string().optional().nullable(),
  produto_nome: yup.string().optional().nullable(),
  produto_codigo: yup.number().optional().nullable(),
  produto_codigo_ext: yup.string().optional().nullable(),
  deposito_nome: yup.string().optional().nullable(),
});
