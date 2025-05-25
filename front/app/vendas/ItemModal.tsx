// ItemModal.tsx  –  versão "bonita" ------------------------------------------------
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  TextField,
  Button,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import { X, Plus, Minus } from "lucide-react";
import { Field, Formik, Form, ErrorMessage } from "formik";

import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import {
  PedidoItemAdicionalDTO,
  PedidoItemDTO,
} from "@/rxjs/pedido/pedido.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { buildItemSchema } from "./vendas";

interface Props {
  open: boolean;
  onClose: () => void;
  modalData: { produto: ProdutoResponse; item?: PedidoItemDTO } | null;
  adicionais: CategoriaAdicionalResponse[];
  onSave: (item: PedidoItemDTO) => void;
}

export function ItemModal({
  open,
  onClose,
  modalData,
  adicionais,
  onSave,
}: Props) {
  if (!modalData) return null;
  const { produto } = modalData;

  /* ---------------- Yup schema + initialValues ------------------- */
  const relevantes = adicionais.filter(
    (a) => a.id_categoria === produto.id_categoria
  );
  const schema = buildItemSchema(relevantes);

  const initial: any = {
    id_categoria_opcao: modalData.item?.id_categoria_opcao ?? "",
    quantidade: modalData.item?.quantidade ?? 1,
    observacao: modalData.item?.observacao ?? "",
  };
  relevantes.forEach((a) => {
    if (a.selecao === "U") {
      const sel = modalData.item?.adicionais?.find((ad) =>
        a.opcoes?.some((o) => o.id === ad.id_adicional_opcao)
      );
      initial[`u_${a.id}`] = sel?.id_adicional_opcao ?? "";
    }
    if (a.selecao === "Q") {
      const obj: any = {};
      a.opcoes!.forEach((o) => {
        const ad = modalData.item?.adicionais?.find(
          (x) => x.id_adicional_opcao === o.id
        );
        obj[o.id] = ad?.quantidade ?? 0;
      });
      initial[`q_${a.id}`] = obj;
    }
  });

  /* ---------------- helpers p/ Q ---------------- */
  const sumQ = (vals: any, a: CategoriaAdicionalResponse) =>
    Object.values(vals[`q_${a.id}`] || {}).reduce(
      (s: number, n: any) => s + (n as number),
      0
    );

  /* ---------------- calcula total ---------------- */
  const calculateModalTotal = (values: any) => {
    let total = 0;

    // Preço base do produto
    const preco = produto.precos!.find(
      (p) => p.id_categoria_opcao === values.id_categoria_opcao
    );
    if (preco) {
      total += parseFloat(preco.preco_base);
    }

    // Adicionais
    relevantes.forEach((a) => {
      if (a.selecao === "U") {
        const selectedId = values[`u_${a.id}`];
        const opcao = a.opcoes!.find((o) => o.id === selectedId);
        if (opcao) {
          total += parseFloat(opcao.valor);
        }
      }
      if (a.selecao === "Q") {
        Object.entries(values[`q_${a.id}`] || {}).forEach(([id, qt]: any) => {
          if (qt > 0) {
            const opcao = a.opcoes!.find((o) => o.id === id);
            if (opcao) {
              total += parseFloat(opcao.valor) * qt;
            }
          }
        });
      }
    });

    return total * values.quantidade;
  };

  /* ---------------- component ------------------- */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Formik
        initialValues={initial}
        validationSchema={schema}
        validateOnMount
        onSubmit={(vals) => {
          /* monta DTO ---------------------------------------------------- */
          const adArr: PedidoItemAdicionalDTO[] = [];

          relevantes.forEach((a) => {
            if (a.selecao === "U") {
              const id = vals[`u_${a.id}`];
              if (id) {
                const opc = a.opcoes!.find((o) => o.id === id)!;
                adArr.push({
                  id_adicional_opcao: id,
                  valor: opc.valor,
                  quantidade: 1,
                });
              }
            }
            if (a.selecao === "Q") {
              Object.entries(vals[`q_${a.id}`]).forEach(([id, qt]: any) => {
                if (qt > 0) {
                  const opc = a.opcoes!.find((o) => o.id === id)!;
                  adArr.push({
                    id_adicional_opcao: id,
                    valor: opc.valor,
                    quantidade: qt,
                  });
                }
              });
            }
          });

          const preco = produto.precos!.find(
            (p) => p.id_categoria_opcao === vals.id_categoria_opcao
          )!;
          onSave({
            id_categoria: produto.id_categoria,
            id_categoria_opcao: vals.id_categoria_opcao,
            id_produto: produto.id,
            quantidade: vals.quantidade,
            valor_unitario: preco.preco_base,
            observacao: vals.observacao || undefined,
            adicionais: adArr,
          });
          onClose();
        }}
      >
        {({ values, setFieldValue, errors, touched, isValid }) => (
          <Form>
            {/* ---------- HEADER ----------------------------------- */}
            <DialogTitle className="flex justify-between items-center">
              <div>
                <Typography variant="h6">
                  {modalData.item ? "Editar Item" : "Adicionar Item"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {produto.nome}
                </Typography>
              </div>
              <IconButton onClick={onClose}>
                <X size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers className="space-y-6">
              {/* ---------- PREÇOS ---------------------------------- */}
              <div>
                <Typography variant="subtitle1" className="mb-2">
                  Seleciona uma opção
                  <span className="text-red-500 ml-1">*</span>
                </Typography>
                <RadioGroup
                  value={values.id_categoria_opcao}
                  onChange={(e) =>
                    setFieldValue("id_categoria_opcao", e.target.value)
                  }
                >
                  {produto.precos!.map((p) => (
                    <FormControlLabel
                      key={p.id_categoria_opcao}
                      value={p.id_categoria_opcao}
                      control={<Radio />}
                      sx={{ mb: 0.5 }}
                      label={
                        <div className="flex justify-between w-full">
                          <span>{p.nome_opcao || `Opção ${p.seq_id}`}</span>
                          <span className="text-sm ml-3 flex items-center font-medium text-slate-600 dark:text-slate-300">
                            {Number(p.preco_base).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                        </div>
                      }
                    />
                  ))}
                </RadioGroup>
                {touched.id_categoria_opcao && errors.id_categoria_opcao && (
                  <Typography variant="caption" color="error">
                    {errors.id_categoria_opcao as string}
                  </Typography>
                )}
              </div>

              <Divider />

              {/* ---------- ADICIONAIS -------------------------------- */}
              {relevantes.map((a) => {
                if (a.selecao === "U") {
                  return (
                    <div key={a.id} className="space-y-1">
                      <Typography variant="subtitle1">
                        {a.nome}
                        {a.minimo! > 0 && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Typography>
                      <RadioGroup
                        value={values[`u_${a.id}`]}
                        onChange={(e) =>
                          setFieldValue(`u_${a.id}`, e.target.value)
                        }
                      >
                        {a.opcoes!.map((o) => (
                          <FormControlLabel
                            key={o.id}
                            value={o.id}
                            control={<Radio />}
                            sx={{ mb: 0.5 }}
                            label={
                              <div className="flex justify-between w-full">
                                <span>{o.nome}</span>
                                <span className="text-sm ml-3 flex items-center font-medium text-slate-600 dark:text-slate-300">
                                  {Number(o.valor).toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </span>
                              </div>
                            }
                          />
                        ))}
                      </RadioGroup>
                      {errors[`u_${a.id}`] && (
                        <Typography variant="caption" color="error">
                          {errors[`u_${a.id}`] as string}
                        </Typography>
                      )}
                    </div>
                  );
                }

                if (a.selecao === "Q") {
                  const total = sumQ(values, a);
                  return (
                    <div key={a.id} className="space-y-2">
                      <Typography variant="subtitle1">
                        {a.nome}
                        {a.minimo! > 0 && (
                          <span className="ml-1">
                            (MIN {a.minimo} – MAX {a.limite})
                          </span>
                        )}
                      </Typography>

                      {a.opcoes!.map((o) => {
                        const v = values[`q_${a.id}`][o.id] || 0;
                        const disablePlus = !!a.limite && total >= a.limite;
                        return (
                          <Box
                            key={o.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <Typography variant="body2">{o.nome}</Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={"bold"}
                              >
                                {Number(o.valor).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </Typography>
                            </div>
                            <div className="flex items-center gap-2">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setFieldValue(
                                    `q_${a.id}.${o.id}`,
                                    Math.max(0, v - 1)
                                  )
                                }
                                disabled={v === 0}
                              >
                                <Minus size={16} />
                              </IconButton>
                              <TextField
                                type="number"
                                size="small"
                                value={v}
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    Math.min(
                                      a.limite || 99,
                                      parseInt(e.target.value) || 0
                                    )
                                  );
                                  setFieldValue(`q_${a.id}.${o.id}`, val);
                                }}
                                inputProps={{
                                  style: { textAlign: "center", width: 60 },
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setFieldValue(`q_${a.id}.${o.id}`, v + 1)
                                }
                                disabled={disablePlus}
                              >
                                <Plus size={16} />
                              </IconButton>
                            </div>
                          </Box>
                        );
                      })}
                      {errors[`q_${a.id}`] && (
                        <Typography variant="caption" color="error">
                          {errors[`q_${a.id}`] as string}
                        </Typography>
                      )}
                    </div>
                  );
                }

                /* --------- tipo "M" (checkbox) – fica igual ao seu ---------- */
                return null;
              })}

              <Divider />

              {/* ---------- OBSERVAÇÃO --------------------------------------- */}
              <Field
                as={TextField}
                name="observacao"
                label="Alguma observação?"
                fullWidth
                multiline
                rows={3}
              />
            </DialogContent>

            {/* ---------- FOOTER ----------------------------------- */}
            <DialogActions
              sx={{ px: 3, py: 2, justifyContent: "space-between" }}
            >
              <div className="flex items-center gap-2">
                <IconButton
                  onClick={() =>
                    setFieldValue(
                      "quantidade",
                      Math.max(1, values.quantidade - 1)
                    )
                  }
                  disabled={values.quantidade === 1}
                >
                  <Minus size={18} />
                </IconButton>
                <TextField
                  type="number"
                  size="small"
                  value={values.quantidade}
                  onChange={(e) =>
                    setFieldValue(
                      "quantidade",
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  inputProps={{
                    min: 1,
                    style: { textAlign: "center", width: 60 },
                  }}
                />
                <IconButton
                  onClick={() =>
                    setFieldValue("quantidade", values.quantidade + 1)
                  }
                >
                  <Plus size={18} />
                </IconButton>
              </div>

              <Button type="submit" variant="contained" disabled={!isValid}>
                {modalData.item ? "Atualizar" : "Adicionar"}{" "}
                {Number(calculateModalTotal(values)).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
