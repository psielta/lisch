import React from "react";
import { CaixaResponseDto, insertCaixa } from "@/proxies/caixa-proxies";
import { useAuth } from "@/context/auth-context";
import ErrorCaixa from "./ErrorCaixa";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { toast } from "sonner";
import { MonetizationOn, Notes } from "@mui/icons-material";

interface AbrirCaixaProps {
  setCaixaEmAberto: (caixa: CaixaResponseDto) => void;
  setErrorCaixa: (error: string | null) => void;
}

const validationSchema = Yup.object({
  valor_abertura: Yup.number()
    .min(0, "O valor não pode ser negativo")
    .required("O valor é obrigatório"),
  observacao_abertura: Yup.string()
    .max(500, "A observação deve ter no máximo 500 caracteres")
    .nullable(),
});

function AbrirCaixa({ setCaixaEmAberto, setErrorCaixa }: AbrirCaixaProps) {
  const { operadorCaixa, tenant, user } = useAuth();

  if (!operadorCaixa) {
    return (
      <ErrorCaixa error="Nenhum operador de caixa encontrado para seu usuário" />
    );
  }

  const handleSubmit = async (values: any) => {
    try {
      const caixa = await insertCaixa({
        tenant_id: tenant?.id || "",
        id_operador: operadorCaixa.id || "",
        valor_abertura: values.valor_abertura || 0,
        observacao_abertura: values.observacao_abertura || null,
        status: "A",
      });

      setCaixaEmAberto(caixa);
      setErrorCaixa(null);
      toast.success("Caixa aberto com sucesso!");
    } catch (error) {
      setErrorCaixa("Erro ao abrir o caixa");
      console.error(error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Card
        elevation={2}
        sx={{
          maxWidth: 500,
          width: "100%",
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold", textAlign: "center", mb: 4 }}
          >
            Abertura de Caixa
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", mb: 3 }}
          >
            Nenhum caixa aberto foi encontrado. Abra um caixa para prosseguir
            com movimentações de pedidos.
          </Typography>

          <Formik
            initialValues={{
              valor_abertura: 0,
              observacao_abertura: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur }) => (
              <Form>
                <TextField
                  fullWidth
                  id="valor_abertura"
                  name="valor_abertura"
                  label="Valor Inicial"
                  type="number"
                  value={values.valor_abertura}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.valor_abertura && Boolean(errors.valor_abertura)
                  }
                  helperText={touched.valor_abertura && errors.valor_abertura}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MonetizationOn color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  id="observacao_abertura"
                  name="observacao_abertura"
                  label="Observação"
                  multiline
                  rows={4}
                  value={values.observacao_abertura}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.observacao_abertura &&
                    Boolean(errors.observacao_abertura)
                  }
                  helperText={
                    touched.observacao_abertura && errors.observacao_abertura
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Notes color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 4 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: "none",
                    fontSize: "1.1rem",
                  }}
                >
                  Abrir Caixa
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AbrirCaixa;
