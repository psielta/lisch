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
  FormGroup,
  Alert,
  Chip,
} from "@mui/material";
import { X, Plus, Minus, ChevronDown } from "lucide-react";
import { Field, Formik, Form } from "formik";
import * as Yup from "yup";
import { useRef, useEffect } from "react";

import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import {
  PedidoItemAdicionalDTO,
  PedidoItemDTO,
} from "@/rxjs/pedido/pedido.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import {
  ICoreCategoria,
  ICategoriaOpcao,
} from "@/rxjs/categoria/categoria.model";

interface Props {
  open: boolean;
  onClose: () => void;
  modalData: {
    categoria: ICoreCategoria;
    categoriaOpcao: ICategoriaOpcao;
    item?: PedidoItemDTO;
    index?: number;
  } | null;
  produtos: ProdutoResponse[];
  adicionais: CategoriaAdicionalResponse[];
  onSave: (item: PedidoItemDTO) => void;
}

// Schema de validação para pizza meio a meio
export function buildPizzaMeiaSchema(adicionais: CategoriaAdicionalResponse[]) {
  const shape: any = {
    id_produto_1: Yup.string().required("Selecione o primeiro sabor"),
    id_produto_2: Yup.string()
      .required("Selecione o segundo sabor")
      .test(
        "different-flavors",
        "Os sabores devem ser diferentes",
        function (value) {
          return value !== this.parent.id_produto_1;
        }
      ),
    quantidade: Yup.number().min(1),
    observacao: Yup.string(),
  };

  adicionais.forEach((add) => {
    if (add.selecao === "U") {
      shape[`u_${add.id}`] = Yup.string()
        .oneOf(add.opcoes!.map((o) => o.id))
        .required(`Escolha uma opção em ${add.nome}`);
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
            (s, n: any) => s + (n as number),
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

export function PizzaMeiaModal({
  open,
  onClose,
  modalData,
  produtos,
  adicionais,
  onSave,
}: Props) {
  const segundoSaborRef = useRef<HTMLDivElement | null>(null);
  const adicionaisRef = useRef<HTMLDivElement | null>(null);

  if (!modalData) return null;

  const { categoria, categoriaOpcao } = modalData;

  // Filtrar produtos da categoria e opção específica
  const produtosDisponiveis = produtos.filter(
    (produto) =>
      produto.id_categoria === categoria.id &&
      produto.precos?.some(
        (preco) => preco.id_categoria_opcao === categoriaOpcao.id
      )
  );

  // Filtrar adicionais relevantes
  const relevantes = adicionais.filter((a) => a.id_categoria === categoria.id);

  const schema = buildPizzaMeiaSchema(relevantes);

  // Valores iniciais
  const initial: any = {
    id_produto_1: modalData.item?.id_produto || "",
    id_produto_2: modalData.item?.id_produto_2 || "",
    quantidade: modalData.item?.quantidade || 1,
    observacao: modalData.item?.observacao || "",
  };

  // Inicializar valores dos adicionais
  relevantes.forEach((a) => {
    if (a.selecao === "U") {
      const sel = modalData.item?.adicionais?.find((ad) =>
        a.opcoes?.some((o) => o.id === ad.id_adicional_opcao)
      );
      initial[`u_${a.id}`] = sel?.id_adicional_opcao || "";
    }

    if (a.selecao === "M") {
      const selectedIds =
        modalData.item?.adicionais
          ?.filter((ad) =>
            a.opcoes?.some((o) => o.id === ad.id_adicional_opcao)
          )
          ?.map((ad) => ad.id_adicional_opcao) || [];
      initial[`m_${a.id}`] = selectedIds;
    }

    if (a.selecao === "Q") {
      const obj: any = {};
      a.opcoes!.forEach((o) => {
        const ad = modalData.item?.adicionais?.find(
          (x) => x.id_adicional_opcao === o.id
        );
        obj[o.id] = ad?.quantidade || 0;
      });
      initial[`q_${a.id}`] = obj;
    }
  });

  // Função para calcular total da pizza
  const calculatePizzaTotal = (values: any) => {
    let total = 0;

    // Buscar preços dos produtos selecionados
    const produto1 = produtosDisponiveis.find(
      (p) => p.id === values.id_produto_1
    );
    const produto2 = produtosDisponiveis.find(
      (p) => p.id === values.id_produto_2
    );

    if (produto1 && produto2) {
      const preco1 = produto1.precos?.find(
        (p) => p.id_categoria_opcao === categoriaOpcao.id
      );
      const preco2 = produto2.precos?.find(
        (p) => p.id_categoria_opcao === categoriaOpcao.id
      );

      if (preco1 && preco2) {
        const valor1 = parseFloat(preco1.preco_base);
        const valor2 = parseFloat(preco2.preco_base);

        // Calcular baseado na opção_meia da categoria
        if (categoria.opcao_meia === "M") {
          // Média dos valores
          total = (valor1 + valor2) / 2;
        } else if (categoria.opcao_meia === "V") {
          // Maior valor
          total = Math.max(valor1, valor2);
        }
      }
    }

    // Adicionar valor dos adicionais
    relevantes.forEach((a) => {
      if (a.selecao === "U") {
        const selectedId = values[`u_${a.id}`];
        const opcao = a.opcoes!.find((o) => o.id === selectedId);
        if (opcao) {
          total += parseFloat(opcao.valor);
        }
      }

      if (a.selecao === "M") {
        const selectedIds = values[`m_${a.id}`] || [];
        selectedIds.forEach((id: string) => {
          const opcao = a.opcoes!.find((o) => o.id === id);
          if (opcao) {
            total += parseFloat(opcao.valor);
          }
        });
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

  // Função para rolar suavemente para um elemento
  const scrollToElement = (
    elementRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Helpers para adicionais tipo Q e M
  const sumQ = (vals: any, a: CategoriaAdicionalResponse) =>
    Object.values(vals[`q_${a.id}`] || {}).reduce(
      (s: number, n: any) => s + (n as number),
      0
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Formik
        initialValues={initial}
        validationSchema={schema}
        validateOnMount
        onSubmit={(vals) => {
          // Montar array de adicionais
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

            if (a.selecao === "M") {
              const selectedIds = vals[`m_${a.id}`] || [];
              selectedIds.forEach((id: string) => {
                const opc = a.opcoes!.find((o) => o.id === id)!;
                adArr.push({
                  id_adicional_opcao: id,
                  valor: opc.valor,
                  quantidade: 1,
                });
              });
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

          // Calcular valor unitário baseado na opção_meia
          const produto1 = produtosDisponiveis.find(
            (p) => p.id === vals.id_produto_1
          );
          const produto2 = produtosDisponiveis.find(
            (p) => p.id === vals.id_produto_2
          );
          const preco1 = produto1?.precos?.find(
            (p) => p.id_categoria_opcao === categoriaOpcao.id
          );
          const preco2 = produto2?.precos?.find(
            (p) => p.id_categoria_opcao === categoriaOpcao.id
          );

          let valorUnitario = "0.00";
          if (preco1 && preco2) {
            const valor1 = parseFloat(preco1.preco_base);
            const valor2 = parseFloat(preco2.preco_base);

            if (categoria.opcao_meia === "M") {
              valorUnitario = ((valor1 + valor2) / 2).toFixed(2);
            } else if (categoria.opcao_meia === "V") {
              valorUnitario = Math.max(valor1, valor2).toFixed(2);
            }
          }

          onSave({
            id_categoria: categoria.id,
            id_categoria_opcao: categoriaOpcao.id,
            id_produto: vals.id_produto_1,
            id_produto_2: vals.id_produto_2,
            quantidade: vals.quantidade,
            valor_unitario: valorUnitario,
            observacao: vals.observacao || undefined,
            adicionais: adArr,
          });
          onClose();
        }}
      >
        {({ values, setFieldValue, errors, touched, isValid }) => (
          <Form>
            <DialogTitle className="flex justify-between items-center">
              <div>
                <Typography variant="h6">
                  {modalData.item
                    ? "Editar Pizza Meio a Meio"
                    : "Pizza Meio a Meio"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {categoria.nome} - {categoriaOpcao.nome}
                </Typography>
              </div>
              <IconButton onClick={onClose}>
                <X size={20} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers className="space-y-6">
              {/* Alert informativo sobre cálculo */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Cálculo do valor:</strong>{" "}
                  {categoria.opcao_meia === "M"
                    ? "Será calculado pela média dos valores dos dois sabores escolhidos"
                    : "Será adotado o maior valor entre os dois sabores escolhidos"}
                </Typography>
              </Alert>

              {/* Primeiro sabor */}
              <div>
                <Typography
                  variant="h6"
                  className="mb-3 flex items-center gap-2"
                >
                  <Chip label="1º" color="primary" size="small" />
                  Escolha o primeiro sabor
                  <span className="text-red-500">*</span>
                </Typography>
                <RadioGroup
                  value={values.id_produto_1}
                  onChange={(e) => {
                    setFieldValue("id_produto_1", e.target.value);
                    // Scroll para segundo sabor quando selecionar o primeiro
                    if (e.target.value && !values.id_produto_2) {
                      setTimeout(() => scrollToElement(segundoSaborRef), 300);
                    }
                  }}
                >
                  {produtosDisponiveis.map((produto) => {
                    const preco = produto.precos?.find(
                      (p) => p.id_categoria_opcao === categoriaOpcao.id
                    );
                    const isDisabled = values.id_produto_2 === produto.id;

                    return (
                      <FormControlLabel
                        key={produto.id}
                        value={produto.id}
                        control={<Radio disabled={isDisabled} />}
                        disabled={isDisabled}
                        sx={{
                          mb: 0.5,
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                        label={
                          <div className="flex justify-between w-full">
                            <span className={isDisabled ? "line-through" : ""}>
                              {produto.nome}
                            </span>
                            <span className="text-sm ml-3 flex items-center font-medium text-slate-600 dark:text-slate-300">
                              {preco &&
                                Number(preco.preco_base).toLocaleString(
                                  "pt-BR",
                                  {
                                    style: "currency",
                                    currency: "BRL",
                                  }
                                )}
                            </span>
                          </div>
                        }
                      />
                    );
                  })}
                </RadioGroup>
                {touched.id_produto_1 && errors.id_produto_1 && (
                  <Typography variant="caption" color="error">
                    {errors.id_produto_1 as string}
                  </Typography>
                )}
              </div>

              {values.id_produto_1 && (
                <>
                  <div className="flex justify-center">
                    <ChevronDown
                      className="text-gray-400 animate-bounce"
                      size={24}
                    />
                  </div>

                  <Divider />

                  {/* Segundo sabor */}
                  <div ref={segundoSaborRef}>
                    <Typography
                      variant="h6"
                      className="mb-3 flex items-center gap-2"
                    >
                      <Chip label="2º" color="secondary" size="small" />
                      Escolha o segundo sabor
                      <span className="text-red-500">*</span>
                    </Typography>
                    <RadioGroup
                      value={values.id_produto_2}
                      onChange={(e) => {
                        setFieldValue("id_produto_2", e.target.value);
                        // Scroll para adicionais quando selecionar o segundo sabor
                        if (e.target.value && relevantes.length > 0) {
                          setTimeout(() => scrollToElement(adicionaisRef), 300);
                        }
                      }}
                    >
                      {produtosDisponiveis.map((produto) => {
                        const preco = produto.precos?.find(
                          (p) => p.id_categoria_opcao === categoriaOpcao.id
                        );
                        const isDisabled = values.id_produto_1 === produto.id;

                        return (
                          <FormControlLabel
                            key={produto.id}
                            value={produto.id}
                            control={<Radio disabled={isDisabled} />}
                            disabled={isDisabled}
                            sx={{
                              mb: 0.5,
                              opacity: isDisabled ? 0.5 : 1,
                            }}
                            label={
                              <div className="flex justify-between w-full">
                                <span
                                  className={isDisabled ? "line-through" : ""}
                                >
                                  {produto.nome}
                                </span>
                                <span className="text-sm ml-3 flex items-center font-medium text-slate-600 dark:text-slate-300">
                                  {preco &&
                                    Number(preco.preco_base).toLocaleString(
                                      "pt-BR",
                                      {
                                        style: "currency",
                                        currency: "BRL",
                                      }
                                    )}
                                </span>
                              </div>
                            }
                          />
                        );
                      })}
                    </RadioGroup>
                    {touched.id_produto_2 && errors.id_produto_2 && (
                      <Typography variant="caption" color="error">
                        {errors.id_produto_2 as string}
                      </Typography>
                    )}
                  </div>
                </>
              )}

              {values.id_produto_1 &&
                values.id_produto_2 &&
                relevantes.length > 0 && (
                  <>
                    <div className="flex justify-center">
                      <ChevronDown
                        className="text-gray-400 animate-bounce"
                        size={24}
                      />
                    </div>

                    <Divider />

                    {/* Adicionais */}
                    <div ref={adicionaisRef}>
                      <Typography variant="h6" className="mb-4">
                        Adicionais
                      </Typography>

                      {relevantes.map((a) => {
                        if (a.selecao === "U") {
                          return (
                            <div key={a.id} className="space-y-1 mb-4">
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
                                          {Number(o.valor).toLocaleString(
                                            "pt-BR",
                                            {
                                              style: "currency",
                                              currency: "BRL",
                                            }
                                          )}
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
                            <div key={a.id} className="space-y-2 mb-4">
                              <Typography variant="subtitle1">
                                {a.nome}
                                {isRequired ? (
                                  <span className="text-red-500 ml-1">
                                    * (MIN {a.minimo})
                                  </span>
                                ) : (
                                  <span className="text-gray-500 ml-1">
                                    Opcional
                                  </span>
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
                                            {Number(o.valor).toLocaleString(
                                              "pt-BR",
                                              {
                                                style: "currency",
                                                currency: "BRL",
                                              }
                                            )}
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
                            <div key={a.id} className="space-y-2 mb-4">
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
                                const disablePlus =
                                  !!a.limite && total >= a.limite;
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
                                        {Number(o.valor).toLocaleString(
                                          "pt-BR",
                                          {
                                            style: "currency",
                                            currency: "BRL",
                                          }
                                        )}
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
                                          setFieldValue(
                                            `q_${a.id}.${o.id}`,
                                            val
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
                                        onClick={() =>
                                          setFieldValue(
                                            `q_${a.id}.${o.id}`,
                                            v + 1
                                          )
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
                      })}
                    </div>
                  </>
                )}

              <Divider />

              {/* Observação */}
              <Field
                as={TextField}
                name="observacao"
                label="Alguma observação?"
                fullWidth
                multiline
                rows={3}
              />
            </DialogContent>

            {/* Footer */}
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
                {Number(calculatePizzaTotal(values)).toLocaleString("pt-BR", {
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
