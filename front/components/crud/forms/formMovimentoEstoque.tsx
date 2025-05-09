"use client";
import React, { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import {
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  CircularProgress,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowBack, Error } from "@mui/icons-material";
import * as Yup from "yup";
import { MovimentoEstoque } from "@/dto/movimentosEstoque";
import { useAuth, User } from "@/context/auth-context";
import { Deposito } from "../../../app/(protected)/cadastros/depositos/table-depositos";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/rxjs/hooks";
import {
  resetAllStates,
  selectPostOrPutMovimentosEstoqueActionState,
} from "@/rxjs/movimentos-estoque/movimentos-estoque.slice";
import { InputMovimentoEstoque } from "@/rxjs/movimentos-estoque/movimentos-estoque.model";
import { toast } from "sonner";
import { postOrPutMovimentosEstoqueAction } from "@/rxjs/movimentos-estoque/movimentos-estoque.actions";
import api from "@/lib/api";
import { Produto } from "@/dto/Produto";

const tiposAceitos = ["ENTRADA", "SAIDA"];

const movimentoEstoqueSchema = Yup.object().shape({
  id: Yup.number()
    .min(1, "id deve ser um número válido")
    .required("id é obrigatório"),
  produto_id: Yup.string()
    .uuid("produto_id deve ser um UUID válido")
    .required("produto_id é obrigatório"),
  tenant_id: Yup.string()
    .uuid("tenant_id deve ser um UUID válido")
    .required("tenant_id é obrigatório"),
  deposito_id: Yup.string()
    .uuid("deposito_id deve ser um UUID válido")
    .required("deposito_id é obrigatório"),
  tipo: Yup.string()
    .oneOf(tiposAceitos, "tipo deve ser ENTRADA ou SAIDA")
    .required("tipo é obrigatório"),
  quantidade: Yup.number()
    .min(1, "quantidade é obrigatório")
    .required("quantidade é obrigatório"),
  doc_ref: Yup.string().required("documento de referência é obrigatório"),
});
const movimentoEstoqueSchemaCreate = Yup.object().shape({
  produto_id: Yup.string()
    .uuid("Produto ID deve ser um UUID válido")
    .required("Produto ID é obrigatório"),
  tenant_id: Yup.string()
    .uuid("Tenant ID deve ser um UUID válido")
    .required("Tenant ID é obrigatório"),
  deposito_id: Yup.string()
    .uuid("Depósito deve ser um UUID válido")
    .required("Depósito é obrigatório"),
  tipo: Yup.string()
    .oneOf(tiposAceitos, "Tipo deve ser ENTRADA ou SAIDA")
    .required("Tipo é obrigatório"),
  quantidade: Yup.number()
    .min(1, "Quantidade é obrigatório")
    .required("Quantidade é obrigatório"),
  doc_ref: Yup.string().required("documento de referência é obrigatório"),
});

function FormMovimentoEstoque({
  data,
  user,
  allDepositos,
}: {
  data: MovimentoEstoque | undefined;
  user: User;
  allDepositos: Deposito[];
}) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useRouter();
  const dispatch = useAppDispatch();
  const saveState = useAppSelector(selectPostOrPutMovimentosEstoqueActionState);
  const { id } = useParams<{ id?: string }>();

  async function searchProdutoByTermo(termo: string): Promise<Produto[]> {
    setLoading(true);
    try {
      const response = await api.get(`/produtos/search/${termo}`);
      setProdutos(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  }
  async function searchProdutoById(id: string): Promise<Produto> {
    setLoading(true);
    try {
      const response = await api.get(`/produtos/${id}`);
      return response.data;
    } finally {
      setLoading(false);
    }
  }

  let initialValues: InputMovimentoEstoque = {
    id: data?.id ?? 0,
    produto_id: data?.produto_id ?? "",
    tenant_id: data?.tenant_id ?? user.tenant_id,
    deposito_id: data?.deposito_id ?? "",
    tipo: data?.tipo ?? "",
    quantidade: data?.quantidade ?? 0,
    doc_ref: data?.doc_ref ?? `ajuste manual (${user.user_name})`,
    created_at: data?.created_at ?? "",
    produto_nome: data?.produto_nome ?? "",
    produto_codigo: data?.produto_codigo ?? 0,
    produto_codigo_ext: data?.produto_codigo_ext ?? "",
    deposito_nome: data?.deposito_nome ?? "",
  };

  useEffect(() => {
    dispatch(resetAllStates());
  }, []);

  useEffect(() => {
    if (saveState === "completed") {
      setSaved(true);
      toast.success("Movimento de estoque salvo com sucesso!");
      navigate.push("/cadastros/movimentos-estoque");
    } else if (saveState === "error") {
      toast.error("Erro ao salvar movimento de estoque");
    }
  }, [saveState, navigate]);

  useEffect(() => {
    // só chama em edição
    if (data?.produto_id) {
      (async () => {
        const produto = await searchProdutoById(data.produto_id); // GET /produtos/{id}
        // garante que ele esteja em 'options'
        setProdutos((prev) =>
          prev.find((p) => p.id === produto.id) ? prev : [...prev, produto]
        );
      })();
    }
  }, [data?.produto_id]); // roda uma vez

  const isLoading = saveState === "pending";
  const isError = saveState === "error";

  return (
    <Box className="p-6">
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Controle de Estoque</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/cadastros/movimentos-estoque">
              Movimentos de estoque
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {id ? "Editar Movimento Estoque" : "Novo Movimento Estoque"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Paper className="p-6 shadow-lg">
        <Box className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <Typography variant="h5">
            {id ? "Editar Movimento Estoque" : "Novo Movimento Estoque"}
          </Typography>

          <Box className="flex items-center gap-4">
            {isError && (
              <Typography
                variant="subtitle1"
                className="text-red-600 font-medium flex items-center gap-2"
              >
                <Error />
                Erro ao salvar movimento estoque
              </Typography>
            )}

            {isLoading && (
              <Typography
                variant="subtitle1"
                className="text-primary font-medium flex items-center gap-2"
              >
                <CircularProgress size={20} color="inherit" />
                Salvando...
              </Typography>
            )}

            <Button
              variant="outlined"
              onClick={() => navigate.push("/cadastros/movimentos-estoque")}
              className="hover:bg-gray-100 transition-colors min-w-[100px]"
              disabled={isLoading}
              startIcon={<ArrowBack />}
            >
              Voltar
            </Button>
          </Box>
        </Box>

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={
            id ? movimentoEstoqueSchema : movimentoEstoqueSchemaCreate
          }
          onSubmit={(values) => {
            dispatch(postOrPutMovimentosEstoqueAction.request(values));
          }}
        >
          {({
            errors,
            touched,
            values,
            handleChange,
            handleBlur,
            setFieldValue,
          }) => {
            const handleInputChange = async (
              _: any,
              termo: string,
              reason: string
            ) => {
              if (reason !== "input" || termo.length <= 2) return;

              setLoading(true);
              try {
                const { data: resultados } = await api.get<Produto[]>(
                  `/produtos/search/${encodeURIComponent(termo)}`
                );

                setProdutos((antigo) => {
                  // tenta achar o atual selecionado no Formik
                  const atual = antigo.find((p) => p.id === values.produto_id);
                  // se existir E não estiver nos resultados, pré-pende
                  if (atual && !resultados.some((r) => r.id === atual.id)) {
                    return [atual, ...resultados];
                  }
                  return resultados;
                });
              } finally {
                setLoading(false);
              }
            };
            return (
              <Form className="space-y-4">
                {id && <Field type="hidden" name="id" value={values.id} />}
                <Field
                  type="hidden"
                  name="tenant_id"
                  value={values.tenant_id}
                />

                <Field type="hidden" name="doc_ref" value={values.doc_ref} />

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Autocomplete
                      options={produtos}
                      loading={loading}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                      }
                      value={
                        produtos.find((p) => p.id === values.produto_id) || null
                      }
                      onChange={(
                        _: any,
                        option: Produto | null,
                        reason: string
                      ) => {
                        switch (reason) {
                          case "selectOption": // clique, Enter ou seta + Enter
                            setFieldValue("produto_id", option?.id ?? "");
                            break;

                          case "clear": // usuário limpou o campo
                            setFieldValue("produto_id", "");
                            break;

                          // "blur" e "createOption" NÃO alteram produto_id
                        }
                      }}
                      onInputChange={handleInputChange}
                      getOptionLabel={(o) =>
                        `${o.nome} (${o.codigo} / Código externo: ${
                          (o.codigo_ext ?? "") === ""
                            ? "Não informado"
                            : o.codigo_ext
                        })`
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Produto"
                          error={
                            touched.produto_id && Boolean(errors.produto_id)
                          }
                          helperText={touched.produto_id && errors.produto_id}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={6}>
                    <TextField
                      select
                      fullWidth
                      label="Depósito"
                      name="deposito_id"
                      value={values.deposito_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.deposito_id && Boolean(errors.deposito_id)}
                      helperText={touched.deposito_id && errors.deposito_id}
                    >
                      {allDepositos.map((deposito) => (
                        <MenuItem key={deposito.id} value={deposito.id}>
                          {deposito.nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={8}>
                    <TextField
                      select
                      fullWidth
                      label="Tipo"
                      name="tipo"
                      value={values.tipo}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.tipo && Boolean(errors.tipo)}
                      helperText={touched.tipo && errors.tipo}
                    >
                      {tiposAceitos.map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>
                          {tipo}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={4}>
                    <TextField
                      fullWidth
                      label="Quantidade"
                      type="number"
                      name="quantidade"
                      value={values.quantidade}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.quantidade && Boolean(errors.quantidade)}
                      helperText={touched.quantidade && errors.quantidade}
                    />
                  </Grid>

                  <Grid size={12}>
                    <Box className="flex justify-end mt-4 gap-2">
                      <Button
                        variant="outlined"
                        onClick={() =>
                          navigate.push("/cadastros/movimentos-estoque")
                        }
                        disabled={isLoading}
                        startIcon={<ArrowBack />}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isLoading || saved}
                      >
                        {isLoading || saved ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>

                {Object.keys(errors).length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      <Error color="error" />
                      <Box>
                        <Typography variant="h6" color="error" gutterBottom>
                          Erros no formulário
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                          {Object.entries(errors).map(([field, error]) => (
                            <Typography
                              key={field}
                              component="li"
                              color="error"
                              sx={{ mb: 0.5 }}
                            >
                              <Box component="strong" sx={{ mr: 1 }}>
                                {field}:
                              </Box>
                              {String(error)}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Form>
            );
          }}
        </Formik>
      </Paper>
    </Box>
  );
}

export default FormMovimentoEstoque;
