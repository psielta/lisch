"use client";
// ————— ItemFormCard.tsx —————
import { Formik } from "formik";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  FormGroup,
  Checkbox,
} from "@mui/material";
import { Trash2, Plus, Minus } from "lucide-react";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";

export interface ItemForm {
  id_categoria_opcao: string;
  quantidade: number;
  observacao: string;
  [key: string]: any;
}

interface ItemFormCardProps {
  index: number;
  initial: ItemForm;
  schema: any;
  produto: ProdutoResponse;
  categorias: ICoreCategoria[];
  mainAdicional: CategoriaAdicionalResponse | null;
  itemsLength: number;
  updateItem: (index: number, item: ItemForm) => void;
  removeItem: (index: number) => void;
}

export const ItemFormCard: React.FC<ItemFormCardProps> = ({
  index,
  initial,
  schema,
  produto,
  categorias,
  mainAdicional,
  itemsLength,
  updateItem,
  removeItem,
}) => {
  const sumQ = (vals: any, a: CategoriaAdicionalResponse) =>
    Object.values(vals[`q_${a.id}`] || {}).reduce(
      (s: number, n: any) => s + (n as number),
      0
    );

  const calculateItemTotal = (values: ItemForm) => {
    let total = 0;

    const preco = produto.precos!.find(
      (p) => p.id_categoria_opcao === values.id_categoria_opcao
    );
    if (preco) {
      total += parseFloat(preco.preco_base);
    }

    if (mainAdicional) {
      if (mainAdicional.selecao === "U") {
        const selectedId = values[`u_${mainAdicional.id}`];
        const opcao = mainAdicional.opcoes!.find((o) => o.id === selectedId);
        if (opcao) {
          total += parseFloat(opcao.valor);
        }
      }

      if (mainAdicional.selecao === "M") {
        const selectedIds = values[`m_${mainAdicional.id}`] || [];
        selectedIds.forEach((id: string) => {
          const opcao = mainAdicional.opcoes!.find((o) => o.id === id);
          if (opcao) {
            total += parseFloat(opcao.valor);
          }
        });
      }

      if (mainAdicional.selecao === "Q") {
        Object.entries(values[`q_${mainAdicional.id}`] || {}).forEach(
          ([id, qt]: any) => {
            if (qt > 0) {
              const opcao = mainAdicional.opcoes!.find((o) => o.id === id);
              if (opcao) {
                total += parseFloat(opcao.valor) * qt;
              }
            }
          }
        );
      }
    }

    return total * values.quantidade;
  };

  return (
    <Formik
      initialValues={initial}
      validationSchema={schema}
      onSubmit={() => {}}
      enableReinitialize
    >
      {({ values, setFieldValue, errors, touched }) => {
        useEffect(() => {
          updateItem(index, values);
        }, [values, index, updateItem]);

        return (
          <Card variant="outlined">
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">Item {index + 1}</Typography>
                {itemsLength > 1 && (
                  <IconButton
                    onClick={() => removeItem(index)}
                    color="error"
                    size="small"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </div>

              <div className="space-y-4">
                {/* Preços */}
                <div>
                  <Typography variant="subtitle1" className="mb-2">
                    Selecione uma opção
                    <span className="text-red-500 ml-1">*</span>
                  </Typography>
                  <RadioGroup
                    value={values.id_categoria_opcao}
                    onChange={(e) =>
                      setFieldValue("id_categoria_opcao", e.target.value)
                    }
                  >
                    {produto.precos!.map((p) => {
                      const categoria = categorias.find((c) =>
                        c.opcoes?.some((o) => o.id === p.id_categoria_opcao)
                      );
                      return (
                        <FormControlLabel
                          key={p.id_categoria_opcao}
                          value={p.id_categoria_opcao}
                          control={<Radio />}
                          sx={{ mb: 0.5 }}
                          label={
                            <div className="flex justify-between w-full">
                              <span>
                                {p.nome_opcao ||
                                  categoria?.opcoes?.find(
                                    (o) => o.id === p.id_categoria_opcao
                                  )?.nome ||
                                  `Opção ${p.seq_id}`}
                              </span>
                              <span className="text-sm ml-3 flex items-center font-medium text-slate-600 dark:text-slate-300">
                                {Number(p.preco_base).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>
                          }
                        />
                      );
                    })}
                  </RadioGroup>
                  {touched.id_categoria_opcao && errors.id_categoria_opcao && (
                    <Typography variant="caption" color="error">
                      {errors.id_categoria_opcao as string}
                    </Typography>
                  )}
                </div>

                {/* Adicional Principal */}
                {mainAdicional && (
                  <div>
                    <Divider className="mb-4" />

                    {/* Tipo "U" - Único */}
                    {mainAdicional.selecao === "U" && (
                      <div className="space-y-1">
                        <Typography variant="subtitle1">
                          {mainAdicional.nome}
                          {mainAdicional.minimo! > 0 && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Typography>
                        <RadioGroup
                          value={values[`u_${mainAdicional.id}`]}
                          onChange={(e) =>
                            setFieldValue(
                              `u_${mainAdicional.id}`,
                              e.target.value
                            )
                          }
                        >
                          {mainAdicional.opcoes!.map((o) => (
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
                        {errors[`u_${mainAdicional.id}`] && (
                          <Typography variant="caption" color="error">
                            {errors[`u_${mainAdicional.id}`] as string}
                          </Typography>
                        )}
                      </div>
                    )}

                    {/* Tipo "M" - Múltiplo */}
                    {mainAdicional.selecao === "M" && (
                      <div className="space-y-2">
                        <Typography variant="subtitle1">
                          {mainAdicional.nome}
                          {mainAdicional.minimo! > 0 && (
                            <span className="ml-1">
                              (MIN {mainAdicional.minimo} – MAX{" "}
                              {mainAdicional.limite})
                            </span>
                          )}
                        </Typography>
                        <FormGroup>
                          {mainAdicional.opcoes!.map((o) => {
                            const selectedIds =
                              values[`m_${mainAdicional.id}`] || [];
                            const isChecked = selectedIds.includes(o.id);
                            const selectedCount = selectedIds.length;
                            const hasLimit =
                              mainAdicional.limite && mainAdicional.limite > 0;
                            const canSelect =
                              !hasLimit ||
                              selectedCount < mainAdicional.limite! ||
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
                                        values[`m_${mainAdicional.id}`] || [];
                                      let newIds;

                                      if (e.target.checked) {
                                        newIds = [...currentIds, o.id];
                                      } else {
                                        newIds = currentIds.filter(
                                          (id: string) => id !== o.id
                                        );
                                      }

                                      setFieldValue(
                                        `m_${mainAdicional.id}`,
                                        newIds
                                      );
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
                        {errors[`m_${mainAdicional.id}`] && (
                          <Typography variant="caption" color="error">
                            {errors[`m_${mainAdicional.id}`] as string}
                          </Typography>
                        )}
                      </div>
                    )}

                    {/* Tipo "Q" - Quantidade */}
                    {mainAdicional.selecao === "Q" && (
                      <div className="space-y-2">
                        <Typography variant="subtitle1">
                          {mainAdicional.nome}
                          {mainAdicional.minimo! > 0 && (
                            <span className="ml-1">
                              (MIN {mainAdicional.minimo} – MAX{" "}
                              {mainAdicional.limite})
                            </span>
                          )}
                        </Typography>

                        {mainAdicional.opcoes!.map((o) => {
                          const v =
                            values[`q_${mainAdicional.id}`]?.[o.id] || 0;
                          const total = sumQ(values, mainAdicional);
                          const disablePlus =
                            !!mainAdicional.limite &&
                            total >= mainAdicional.limite;

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
                                  onClick={() => {
                                    const currentObj =
                                      values[`q_${mainAdicional.id}`] || {};
                                    const newObj = {
                                      ...currentObj,
                                      [o.id]: Math.max(
                                        0,
                                        (currentObj[o.id] || 0) - 1
                                      ),
                                    };
                                    setFieldValue(
                                      `q_${mainAdicional.id}`,
                                      newObj
                                    );
                                  }}
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
                                        mainAdicional.limite || 99,
                                        parseInt(e.target.value) || 0
                                      )
                                    );
                                    const currentObj =
                                      values[`q_${mainAdicional.id}`] || {};
                                    const newObj = {
                                      ...currentObj,
                                      [o.id]: val,
                                    };
                                    setFieldValue(
                                      `q_${mainAdicional.id}`,
                                      newObj
                                    );
                                  }}
                                  inputProps={{
                                    style: {
                                      textAlign: "center",
                                      width: 60,
                                    },
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const currentObj =
                                      values[`q_${mainAdicional.id}`] || {};
                                    const newObj = {
                                      ...currentObj,
                                      [o.id]: (currentObj[o.id] || 0) + 1,
                                    };
                                    setFieldValue(
                                      `q_${mainAdicional.id}`,
                                      newObj
                                    );
                                  }}
                                  disabled={disablePlus}
                                >
                                  <Plus size={16} />
                                </IconButton>
                              </div>
                            </Box>
                          );
                        })}
                        {errors[`q_${mainAdicional.id}`] && (
                          <Typography variant="caption" color="error">
                            {errors[`q_${mainAdicional.id}`] as string}
                          </Typography>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Observação */}
                <div>
                  <Divider className="mb-4" />
                  <TextField
                    name="observacao"
                    label="Alguma observação?"
                    fullWidth
                    multiline
                    rows={2}
                    value={values.observacao}
                    onChange={(e) =>
                      setFieldValue("observacao", e.target.value)
                    }
                  />
                </div>

                {/* Quantidade e Total do Item */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Typography variant="body2">Quantidade:</Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setFieldValue(
                          "quantidade",
                          Math.max(1, values.quantidade - 1)
                        )
                      }
                      disabled={values.quantidade === 1}
                    >
                      <Minus size={16} />
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
                      size="small"
                      onClick={() =>
                        setFieldValue("quantidade", values.quantidade + 1)
                      }
                    >
                      <Plus size={16} />
                    </IconButton>
                  </div>
                  <Typography variant="h6" color="primary">
                    {Number(calculateItemTotal(values)).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </Formik>
  );
};
