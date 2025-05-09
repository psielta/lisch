"use client";
import api from "@/lib/api";
import {
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { useAuth } from "@/context/auth-context";
import { Autocomplete } from "@mui/material";
import Loader from "@/components/my/Loader";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ClienteResponse as Cliente } from "@/dto/cliente";
import AlertWarningNoPermission from "@/components/my/AlertWarningNoPermission";
import { Cidade } from "@/app/(protected)/cadastros/cidades/table-regioes";
import { Transportadora } from "@/app/(protected)/cadastros/transportadoras/page";
import { Vendedor } from "@/app/(protected)/cadastros/vendedores/page";
import { Regiao } from "@/app/(protected)/cadastros/regioes/table-regioes";
import { useEffect, useState } from "react";

const clienteSchema = Yup.object().shape({
  id: Yup.string().uuid("id deve ser um UUID válido").required(),
  tenant_id: Yup.string().uuid("tenant_id deve ser um UUID válido").required(),
  codigo: Yup.number().required(),
  nome: Yup.string().required("nome é obrigatório"),
  transportadora_id: Yup.string().nullable(),
  regiao_id: Yup.string().nullable(),
  vendedor_id: Yup.string().nullable(),
  cidade_id: Yup.string().required("cidade é obrigatória"),
  endereco: Yup.string().nullable(),
  bairro: Yup.string().nullable(),
  numero: Yup.number().nullable(),
  cep: Yup.string().nullable(),
  fone: Yup.string().nullable(),
});

type ClienteFormProps = {
  initial: Cliente;
  onCancel(): void;
  onSaved(novo: Cliente): void;
};

export default function ClienteForm({
  initial,
  onCancel,
  onSaved,
}: ClienteFormProps) {
  const auth = useAuth();

  const [allTransportadoras, setAllTransportadoras] = useState<
    Transportadora[]
  >([]);
  const [allRegioes, setAllRegioes] = useState<Regiao[]>([]);
  const [allVendedores, setAllVendedores] = useState<Vendedor[]>([]);
  const [allCidades, setAllCidades] = useState<Cidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function getAllData() {
    try {
      const [transportadoras, regioes, vendedores, cidades] = await Promise.all(
        [
          api.get("/transportadoras"),
          api.get("/regioes"),
          api.get("/vendedores"),
          api.get("/cidades"),
        ]
      );
      setAllTransportadoras(transportadoras.data);
      setAllRegioes(regioes.data);
      setAllVendedores(vendedores.data);
      setAllCidades(cidades.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao buscar dados.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getAllData();
  }, []);

  if (auth.user?.admin !== 1) {
    if ((auth.user?.permission_cliente ?? 0) !== 1) {
      return <AlertWarningNoPermission />;
    }
  }

  const initialValues = {
    id: initial.id,
    tenant_id: initial.tenant_id,
    nome: initial.nome,
    transportadora_id: initial.transportadora_id ?? "",
    regiao_id: initial.regiao_id ?? "",
    vendedor_id: initial.vendedor_id ?? "",
    cidade_id: initial.cidade_id,
    codigo: initial.codigo,
    endereco: initial.endereco ?? "",
    bairro: initial.bairro ?? "",
    numero: initial.numero ?? 0,
    cep: initial.cep ?? "",
    fone: initial.fone ?? "",
  };

  const onSubmit = async (values: typeof initialValues) => {
    try {
      const response = await api.put(`/clientes/${initial.id}`, values);
      if (response.status === 200) {
        toast.success("Cliente atualizado com sucesso.");
        onSaved(response.data);
      } else {
        toast.error(response.data?.error || "Erro ao atualizar cliente.");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.error || "Erro ao atualizar cliente."
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        console.error("Erro ao atualizar cliente:", error);
        toast.error("Erro ao atualizar cliente.");
      }
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Cadastro de Cliente
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Preencha o formulário abaixo para atualizar o cliente.
        </Typography>

        <Formik
          initialValues={initialValues}
          validationSchema={clienteSchema}
          onSubmit={onSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
            isSubmitting,
          }) => (
            <Form>
              <input type="hidden" name="tenant_id" />

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  name="nome"
                  label="Nome do Cliente"
                  value={values.nome}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.nome && Boolean(errors.nome)}
                  helperText={touched.nome && errors.nome}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Autocomplete
                  options={allTransportadoras}
                  getOptionLabel={(option) => option.nome}
                  value={
                    allTransportadoras.find(
                      (t) => t.id === values.transportadora_id
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setFieldValue("transportadora_id", newValue?.id || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Transportadora"
                      error={
                        touched.transportadora_id &&
                        Boolean(errors.transportadora_id)
                      }
                      helperText={
                        touched.transportadora_id && errors.transportadora_id
                      }
                    />
                  )}
                />

                <Autocomplete
                  options={allRegioes}
                  getOptionLabel={(option) => option.nome}
                  value={
                    allRegioes.find((r) => r.id === values.regiao_id) || null
                  }
                  onChange={(_, newValue) => {
                    setFieldValue("regiao_id", newValue?.id || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Região"
                      error={touched.regiao_id && Boolean(errors.regiao_id)}
                      helperText={touched.regiao_id && errors.regiao_id}
                    />
                  )}
                />

                <Autocomplete
                  options={allVendedores}
                  getOptionLabel={(option) => option.nome}
                  value={
                    allVendedores.find((v) => v.id === values.vendedor_id) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setFieldValue("vendedor_id", newValue?.id || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vendedor"
                      error={touched.vendedor_id && Boolean(errors.vendedor_id)}
                      helperText={touched.vendedor_id && errors.vendedor_id}
                    />
                  )}
                />

                <Autocomplete
                  options={allCidades}
                  getOptionLabel={(option) =>
                    `${option.name} - ${option.state_code}`
                  }
                  value={
                    allCidades.find((c) => c.id === values.cidade_id) || null
                  }
                  onChange={(_, newValue) => {
                    setFieldValue("cidade_id", newValue?.id || "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cidade *"
                      error={touched.cidade_id && Boolean(errors.cidade_id)}
                      helperText={touched.cidade_id && errors.cidade_id}
                    />
                  )}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <TextField
                  fullWidth
                  name="endereco"
                  label="Endereço"
                  value={values.endereco}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <TextField
                  fullWidth
                  name="bairro"
                  label="Bairro"
                  value={values.bairro}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <TextField
                  fullWidth
                  type="number"
                  name="numero"
                  label="Número"
                  value={values.numero}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <TextField
                  fullWidth
                  name="cep"
                  label="CEP"
                  value={values.cep}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <TextField
                  fullWidth
                  name="fone"
                  label="Telefone"
                  value={values.fone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}
