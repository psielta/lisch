"use client";
import { useAuth } from "@/context/auth-context";
import {
  getResumoCaixa,
  ValorEsperadoFormaDto,
  insertSangriaCaixa,
  insertSuprimentoCaixa,
  removeSangriaCaixa,
  removeSuprimentoCaixa,
  CaixaMovimentacaoDto,
} from "@/proxies/sangria-suprimento-proxies";
import { Close, Add, Remove } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  IconButton,
  Box,
  Button,
  TextField,
  DialogActions,
} from "@mui/material";
import { DialogContent } from "@mui/material";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

const movimentacaoSchema = Yup.object().shape({
  valor: Yup.number()
    .required("Valor é obrigatório")
    .positive("Valor deve ser positivo"),
  observacao: Yup.string(),
});

export interface DialogResumoCaixaProps {
  open: boolean;
  onClose: () => void;
  id_caixa: string;
}

export default function DialogResumoCaixa({
  open,
  onClose,
  id_caixa,
}: DialogResumoCaixaProps) {
  const [valorEsperadoForma, setValorEsperadoForma] = useState<
    ValorEsperadoFormaDto[]
  >([]);
  const { user, operadorCaixa, tenant } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState<CaixaMovimentacaoDto[]>(
    []
  );
  const [dialogSuprimentoOpen, setDialogSuprimentoOpen] = useState(false);
  const [dialogSangriaOpen, setDialogSangriaOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadResumoCaixa();
    }
  }, [id_caixa, open]);

  const loadResumoCaixa = async () => {
    const res = await getResumoCaixa(id_caixa);
    setValorEsperadoForma(res);
  };

  const total = valorEsperadoForma.reduce(
    (acc, item) => acc + item.valor_esperado,
    0
  );

  const handleSuprimento = async (values: {
    valor: number;
    observacao: string;
  }) => {
    try {
      await insertSuprimentoCaixa({
        id_caixa,
        valor: values.valor,
        observacao: values.observacao,
        autorizado_por: user?.id || "",
      });
      setDialogSuprimentoOpen(false);
      loadResumoCaixa();
    } catch (error) {
      console.error("Erro ao realizar suprimento:", error);
    }
  };

  const handleSangria = async (values: {
    valor: number;
    observacao: string;
  }) => {
    try {
      await insertSangriaCaixa({
        id_caixa,
        valor: values.valor,
        observacao: values.observacao,
        autorizado_por: user?.id || "",
      });
      setDialogSangriaOpen(false);
      loadResumoCaixa();
    } catch (error) {
      console.error("Erro ao realizar sangria:", error);
    }
  };

  const MovimentacaoDialog = ({
    open,
    onClose,
    tipo,
    onSubmit,
  }: {
    open: boolean;
    onClose: () => void;
    tipo: "suprimento" | "sangria";
    onSubmit: (values: { valor: number; observacao: string }) => void;
  }) => (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {tipo === "suprimento" ? "Realizar Suprimento" : "Realizar Sangria"}
      </DialogTitle>
      <Formik
        initialValues={{ valor: 0, observacao: "" }}
        validationSchema={movimentacaoSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, handleBlur, errors, touched }) => (
          <Form>
            <DialogContent>
              <TextField
                fullWidth
                name="valor"
                label="Valor"
                type="number"
                value={values.valor}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.valor && Boolean(errors.valor)}
                helperText={touched.valor && errors.valor}
                margin="normal"
              />
              <TextField
                fullWidth
                name="observacao"
                label="Observação"
                multiline
                rows={4}
                value={values.observacao}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.observacao && Boolean(errors.observacao)}
                helperText={touched.observacao && errors.observacao}
                margin="normal"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>Cancelar</Button>
              <Button type="submit" variant="contained" color="primary">
                Confirmar
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Resumo do Caixa
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => setDialogSuprimentoOpen(true)}
              >
                Suprimento
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Remove />}
                onClick={() => setDialogSangriaOpen(true)}
              >
                Sangria
              </Button>
            </Box>

            {valorEsperadoForma.map((item) => (
              <Box
                key={item.id_forma_pagamento}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                  borderBottom: "1px solid #eee",
                }}
              >
                <Typography variant="subtitle1">{item.nome_forma}</Typography>
                <Typography variant="subtitle1">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.valor_esperado)}
                </Typography>
              </Box>
            ))}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 2,
                mt: 2,
                borderTop: "2px solid #000",
              }}
            >
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(total)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <MovimentacaoDialog
        open={dialogSuprimentoOpen}
        onClose={() => setDialogSuprimentoOpen(false)}
        tipo="suprimento"
        onSubmit={handleSuprimento}
      />

      <MovimentacaoDialog
        open={dialogSangriaOpen}
        onClose={() => setDialogSangriaOpen(false)}
        tipo="sangria"
        onSubmit={handleSangria}
      />
    </>
  );
}
