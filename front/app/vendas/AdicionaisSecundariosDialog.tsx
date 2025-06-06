// AdicionaisSecundariosDialog.tsx - Dialog para configurar adicionais não principais
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
  Box,
  FormGroup,
} from "@mui/material";
import { X, Plus, Minus } from "lucide-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { PedidoItemAdicionalDTO } from "@/rxjs/pedido/pedido.model";

interface Props {
  open: boolean;
  onClose: () => void;
  adicionais: CategoriaAdicionalResponse[];
  initialValues: PedidoItemAdicionalDTO[];
  onSave: (adicionais: PedidoItemAdicionalDTO[]) => void;
}

// Schema de validação para adicionais secundários
function buildAdicionaisSecundariosSchema(
  adicionais: CategoriaAdicionalResponse[]
) {
  const shape: any = {};

  adicionais.forEach((add) => {
    if (add.selecao === "U") {
      if (add.minimo && add.minimo > 0) {
        shape[`u_${add.id}`] = Yup.string()
          .oneOf(add.opcoes!.map((o) => o.id))
          .required(`Escolha uma opção em ${add.nome}`);
      } else {
        shape[`u_${add.id}`] = Yup.string().oneOf(add.opcoes!.map((o) => o.id));
      }
    }

    if (add.selecao === "M") {
      shape[`m_${add.id}`] = Yup.array()
        .of(Yup.string())
        .test("min-max", "Fora do intervalo", function (value) {
          const selectedCount = (value || []).length;
          if (selectedCount < (add.minimo || 0))
            return this.createError({
              message: `Mínimo ${add.minimo} opções em ${add.nome}`,
            });
          if (add.limite && selectedCount > add.limite)
            return this.createError({
              message: `Máximo ${add.limite} opções em ${add.nome}`,
            });
          return true;
        });
    }

    if (add.selecao === "Q") {
      const opShape: any = {};
      add.opcoes!.forEach((o) => (opShape[o.id] = Yup.number().min(0)));

      shape[`q_${add.id}`] = Yup.object(opShape).test(
        "min-max",
        "Fora do intervalo",
        function (value) {
          const total = Object.values(value || {}).reduce(
            (s: number, n: any) => s + (n as number),
            0
          );
          if (total < (add.minimo || 0))
            return this.createError({
              message: `Mínimo ${add.minimo} em ${add.nome}`,
            });
          if (add.limite && total > add.limite)
            return this.createError({
              message: `Máximo ${add.limite} em ${add.nome}`,
            });
          return true;
        }
      );
    }
  });

  return Yup.object(shape);
}

export function AdicionaisSecundariosDialog({
  open,
  onClose,
  adicionais,
  initialValues,
  onSave,
}: Props) {
  const schema = buildAdicionaisSecundariosSchema(adicionais);

  // Converter initialValues para formato do formulário
  const formInitialValues: any = {};

  adicionais.forEach((add) => {
    if (add.selecao === "U") {
      const selectedAdicional = initialValues.find((iv) =>
        add.opcoes?.some((o) => o.id === iv.id_adicional_opcao)
      );
      formInitialValues[`u_${add.id}`] =
        selectedAdicional?.id_adicional_opcao || "";
    }

    if (add.selecao === "M") {
      const selectedIds = initialValues
        .filter((iv) => add.opcoes?.some((o) => o.id === iv.id_adicional_opcao))
        .map((iv) => iv.id_adicional_opcao);
      formInitialValues[`m_${add.id}`] = selectedIds;
    }

    if (add.selecao === "Q") {
      const obj: any = {};
      add.opcoes!.forEach((o) => {
        const adicional = initialValues.find(
          (iv) => iv.id_adicional_opcao === o.id
        );
        obj[o.id] = adicional?.quantidade || 0;
      });
      formInitialValues[`q_${add.id}`] = obj;
    }
  });

  // Helper para somar quantidades
  const sumQ = (vals: any, a: CategoriaAdicionalResponse) =>
    Object.values(vals[`q_${a.id}`] || {}).reduce(
      (s: number, n: any) => s + (n as number),
      0
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Formik
        initialValues={formInitialValues}
        validationSchema={schema}
        validateOnMount
        onSubmit={(values) => {
          // Converter valores do formulário de volta para PedidoItemAdicionalDTO[]
          const result: PedidoItemAdicionalDTO[] = [];

          adicionais.forEach((add) => {
            if (add.selecao === "U") {
              const selectedId = values[`u_${add.id}`];
              if (selectedId) {
                const opcao = add.opcoes!.find((o) => o.id === selectedId)!;
                result.push({
                  id_adicional_opcao: selectedId,
                  valor: opcao.valor,
                  quantidade: 1,
                });
              }
            }

            if (add.selecao === "M") {
              const selectedIds = values[`m_${add.id}`] || [];
              selectedIds.forEach((id: string) => {
                const opcao = add.opcoes!.find((o) => o.id === id)!;
                result.push({
                  id_adicional_opcao: id,
                  valor: opcao.valor,
                  quantidade: 1,
                });
              });
            }

            if (add.selecao === "Q") {
              Object.entries(values[`q_${add.id}`] || {}).forEach(
                ([id, qt]: any) => {
                  if (qt > 0) {
                    const opcao = add.opcoes!.find((o) => o.id === id)!;
                    result.push({
                      id_adicional_opcao: id,
                      valor: opcao.valor,
                      quantidade: qt,
                    });
                  }
                }
              );
            }
          });

          onSave(result);
        }}
      >
        {({ values, setFieldValue, errors, touched, isValid }) => (
          <Form>
            <DialogTitle className="flex justify-between items-center">
              Configurar Adicionais
              <IconButton onClick={onClose}>
                <X size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers className="space-y-6">
              {adicionais.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  Nenhum adicional secundário disponível para este produto.
                </Typography>
              ) : (
                adicionais.map((a) => {
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
                          value={values[`u_${a.id}`] || ""}
                          onChange={(e) =>
                            setFieldValue(`u_${a.id}`, e.target.value)
                          }
                        >
                          {/* Opção vazia para adicionais não obrigatórios */}
                          {(!a.minimo || a.minimo === 0) && (
                            <FormControlLabel
                              value=""
                              control={<Radio />}
                              label="Nenhum"
                              sx={{ mb: 0.5 }}
                            />
                          )}
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

                  if (a.selecao === "M") {
                    const selectedIds = values[`m_${a.id}`] || [];
                    const selectedCount = selectedIds.length;
                    const hasLimit = a.limite && a.limite > 0;
                    const isRequired = a.minimo && a.minimo > 0;

                    return (
                      <div key={a.id} className="space-y-2">
                        <Typography variant="subtitle1">
                          {a.nome}
                          {isRequired ? (
                            <span className="text-red-500 ml-1">
                              * (MIN {a.minimo})
                            </span>
                          ) : (
                            <span className="text-gray-500 ml-1">Opcional</span>
                          )}
                          {hasLimit && (
                            <span className="text-gray-500 ml-1">
                              (MÁX {a.limite})
                            </span>
                          )}
                        </Typography>

                        <FormGroup>
                          {a.opcoes!.map((o) => {
                            const isChecked = selectedIds.includes(o.id);
                            const canSelect =
                              !hasLimit ||
                              selectedCount < a.limite! ||
                              isChecked;

                            return (
                              <FormControlLabel
                                key={o.id}
                                control={
                                  <Checkbox
                                    checked={isChecked}
                                    disabled={!canSelect}
                                    onChange={(e) => {
                                      const currentIds =
                                        values[`m_${a.id}`] || [];
                                      let newIds;

                                      if (e.target.checked) {
                                        newIds = [...currentIds, o.id];
                                      } else {
                                        newIds = currentIds.filter(
                                          (id: string) => id !== o.id
                                        );
                                      }

                                      setFieldValue(`m_${a.id}`, newIds);
                                    }}
                                  />
                                }
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
                            );
                          })}
                        </FormGroup>
                        {errors[`m_${a.id}`] && (
                          <Typography variant="caption" color="error">
                            {errors[`m_${a.id}`] as string}
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
                                <Typography variant="body2">
                                  {o.nome}
                                </Typography>
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

                  return null;
                })
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="outlined" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={!isValid}>
                Salvar Adicionais
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
