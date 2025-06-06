// MultiItemModal.tsx - Versão completa corrigida com suporte aos tipos "U", "M" e "Q"
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
  Card,
  CardContent,
} from "@mui/material";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";

import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import {
  PedidoItemAdicionalDTO,
  PedidoItemDTO,
} from "@/rxjs/pedido/pedido.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";

interface MultiItemModalData {
  produto: ProdutoResponse;
  items?: PedidoItemDTO[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  modalData: MultiItemModalData | null;
  adicionais: CategoriaAdicionalResponse[];
  categorias: ICoreCategoria[];
  onSave: (items: PedidoItemDTO[]) => void;
}

interface ItemForm {
  id_categoria_opcao: string;
  quantidade: number;
  observacao: string;
  // Campos dinâmicos para adicionais principais
  [key: string]: any;
}

// Schema melhorado para validar diferentes tipos de seleção
function buildMultiItemSchema(
  mainAdicional: CategoriaAdicionalResponse | null
) {
  const shape: any = {
    id_categoria_opcao: Yup.string().required("Selecione o preço"),
    quantidade: Yup.number().min(1),
    observacao: Yup.string(),
  };

  if (mainAdicional) {
    if (mainAdicional.selecao === "U") {
      shape[`u_${mainAdicional.id}`] = Yup.string()
        .oneOf(mainAdicional.opcoes!.map((o) => o.id))
        .required(`Escolha uma opção em ${mainAdicional.nome}`);
    }

    if (mainAdicional.selecao === "M") {
      shape[`m_${mainAdicional.id}`] = Yup.array()
        .of(Yup.string())
        .test("min-max", "Fora do intervalo", function (value) {
          const selectedCount = (value || []).length;
          if (selectedCount < (mainAdicional.minimo || 0))
            return this.createError({
              message: `Mínimo ${mainAdicional.minimo} opções em ${mainAdicional.nome}`,
            });
          if (mainAdicional.limite && selectedCount > mainAdicional.limite)
            return this.createError({
              message: `Máximo ${mainAdicional.limite} opções em ${mainAdicional.nome}`,
            });
          return true;
        });
    }

    if (mainAdicional.selecao === "Q") {
      const opShape: any = {};
      mainAdicional.opcoes!.forEach(
        (o) => (opShape[o.id] = Yup.number().min(0))
      );

      shape[`q_${mainAdicional.id}`] = Yup.object(opShape).test(
        "min-max",
        "Fora do intervalo",
        function (value) {
          const total = Object.values(value || {}).reduce(
            (s, n: any) => s + (n as number),
            0
          );
          if (total < (mainAdicional.minimo || 0))
            return this.createError({
              message: `Mínimo ${mainAdicional.minimo} em ${mainAdicional.nome}`,
            });
          if (mainAdicional.limite && total > mainAdicional.limite)
            return this.createError({
              message: `Máximo ${mainAdicional.limite} em ${mainAdicional.nome}`,
            });
          return true;
        }
      );
    }
  }

  return Yup.object(shape);
}

export function MultiItemModalV3({
  open,
  onClose,
  modalData,
  adicionais,
  categorias,
  onSave,
}: Props) {
  const [items, setItems] = useState<ItemForm[]>([]);

  // Todos os hooks devem estar antes de qualquer retorno condicional
  const produto = modalData?.produto;

  // Encontrar o adicional principal
  const mainAdicional = produto
    ? adicionais.find(
        (a) => a.id_categoria === produto.id_categoria && a.is_main === true
      ) || null
    : null;

  const schema = buildMultiItemSchema(mainAdicional);

  // Função para criar item inicial
  const createInitialItem = (existingItem?: PedidoItemDTO): ItemForm => {
    const initial: ItemForm = {
      id_categoria_opcao: existingItem?.id_categoria_opcao ?? "",
      quantidade: existingItem?.quantidade ?? 1,
      observacao: existingItem?.observacao ?? "",
    };

    if (mainAdicional) {
      if (mainAdicional.selecao === "U") {
        const sel = existingItem?.adicionais?.find((ad) =>
          mainAdicional.opcoes?.some((o) => o.id === ad.id_adicional_opcao)
        );
        initial[`u_${mainAdicional.id}`] = sel?.id_adicional_opcao ?? "";
      }

      if (mainAdicional.selecao === "M") {
        const selectedIds =
          existingItem?.adicionais
            ?.filter((ad) =>
              mainAdicional.opcoes?.some((o) => o.id === ad.id_adicional_opcao)
            )
            ?.map((ad) => ad.id_adicional_opcao) ?? [];
        initial[`m_${mainAdicional.id}`] = selectedIds;
      }

      if (mainAdicional.selecao === "Q") {
        const obj: any = {};
        mainAdicional.opcoes!.forEach((o) => {
          const ad = existingItem?.adicionais?.find(
            (x) => x.id_adicional_opcao === o.id
          );
          obj[o.id] = ad?.quantidade ?? 0;
        });
        initial[`q_${mainAdicional.id}`] = obj;
      }
    }

    return initial;
  };

  // Inicializar itens
  useEffect(() => {
    if (modalData?.items && modalData.items.length > 0) {
      // Modo edição - carregar item existente
      setItems([createInitialItem(modalData.items[0])]);
    } else if (modalData) {
      // Modo criação - começar com um item vazio
      setItems([createInitialItem()]);
    }
  }, [modalData]);

  // Retorno condicional após todos os hooks
  if (!modalData || !produto) return null;

  // Função para adicionar novo item
  const addNewItem = () => {
    setItems([...items, createInitialItem()]);
  };

  // Função para remover item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Função para atualizar item
  const updateItem = (index: number, updatedItem: ItemForm) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  // Helpers para cálculos
  const sumQ = (vals: any, a: CategoriaAdicionalResponse) =>
    Object.values(vals[`q_${a.id}`] || {}).reduce(
      (s: number, n: any) => s + (n as number),
      0
    );

  // Função para calcular total do item
  const calculateItemTotal = (values: ItemForm) => {
    let total = 0;

    // Preço base do produto
    if (produto) {
      const preco = produto.precos!.find(
        (p) => p.id_categoria_opcao === values.id_categoria_opcao
      );
      if (preco) {
        total += parseFloat(preco.preco_base);
      }
    }

    // Adicional principal
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

  // Função para calcular total geral
  const calculateTotalGeneral = () => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  // Função para converter FormItem em PedidoItemDTO
  const convertFormItemToPedidoItem = (formItem: ItemForm): PedidoItemDTO => {
    if (!produto) throw new Error("Produto não encontrado");

    const adArr: PedidoItemAdicionalDTO[] = [];

    if (mainAdicional) {
      if (mainAdicional.selecao === "U") {
        const id = formItem[`u_${mainAdicional.id}`];
        if (id) {
          const opc = mainAdicional.opcoes!.find((o) => o.id === id)!;
          adArr.push({
            id_adicional_opcao: id,
            valor: opc.valor,
            quantidade: 1,
          });
        }
      }

      if (mainAdicional.selecao === "M") {
        const selectedIds = formItem[`m_${mainAdicional.id}`] || [];
        selectedIds.forEach((id: string) => {
          const opc = mainAdicional.opcoes!.find((o) => o.id === id)!;
          adArr.push({
            id_adicional_opcao: id,
            valor: opc.valor,
            quantidade: 1,
          });
        });
      }

      if (mainAdicional.selecao === "Q") {
        Object.entries(formItem[`q_${mainAdicional.id}`] || {}).forEach(
          ([id, qt]: any) => {
            if (qt > 0) {
              const opc = mainAdicional.opcoes!.find((o) => o.id === id)!;
              adArr.push({
                id_adicional_opcao: id,
                valor: opc.valor,
                quantidade: qt,
              });
            }
          }
        );
      }
    }

    const preco = produto.precos!.find(
      (p) => p.id_categoria_opcao === formItem.id_categoria_opcao
    )!;

    return {
      id_categoria: produto.id_categoria,
      id_categoria_opcao: formItem.id_categoria_opcao,
      id_produto: produto.id,
      quantidade: formItem.quantidade,
      valor_unitario: preco.preco_base,
      observacao: formItem.observacao || undefined,
      adicionais: adArr,
    };
  };

  // Função para validar todos os itens
  const validateAllItems = () => {
    return items.every((item) => {
      try {
        schema.validateSync(item);
        return true;
      } catch {
        return false;
      }
    });
  };

  // Função para salvar
  const handleSave = () => {
    if (validateAllItems()) {
      const pedidoItems = items.map(convertFormItemToPedidoItem);
      onSave(pedidoItems);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="flex justify-between items-center">
        <div>
          <Typography variant="h6">
            {modalData?.items && modalData.items.length > 0
              ? "Editar Item"
              : "Adicionar Itens"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {produto?.nome}
            {mainAdicional && ` - ${mainAdicional.nome}`}
          </Typography>
        </div>
        <IconButton onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-4">
          {items.map((item, index) => {
            const handleFormChange = (newValues: ItemForm) => {
              updateItem(index, newValues);
            };

            return (
              <Formik
                key={`item-${index}`}
                initialValues={item}
                validationSchema={schema}
                onSubmit={() => {}}
                enableReinitialize
              >
                {({ values, setFieldValue, errors, touched }) => {
                  return (
                    <Card variant="outlined">
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <Typography variant="h6">Item {index + 1}</Typography>
                          {items.length > 1 && (
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
                              onChange={(e) => {
                                setFieldValue(
                                  "id_categoria_opcao",
                                  e.target.value
                                );
                                handleFormChange({
                                  ...values,
                                  id_categoria_opcao: e.target.value,
                                });
                              }}
                            >
                              {produto?.precos?.map((p) => {
                                const categoria = categorias.find((c) =>
                                  c.opcoes?.some(
                                    (o) => o.id === p.id_categoria_opcao
                                  )
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
                                              (o) =>
                                                o.id === p.id_categoria_opcao
                                            )?.nome ||
                                            `Opção ${p.seq_id}`}
                                        </span>
                                        <span className="text-sm ml-3 flex items-center font-medium text-slate-600 dark:text-slate-300">
                                          {Number(p.preco_base).toLocaleString(
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
                            {touched.id_categoria_opcao &&
                              errors.id_categoria_opcao && (
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
                                      <span className="text-red-500 ml-1">
                                        *
                                      </span>
                                    )}
                                  </Typography>
                                  <RadioGroup
                                    value={
                                      values[`u_${mainAdicional.id}`] || ""
                                    }
                                    onChange={(e) => {
                                      setFieldValue(
                                        `u_${mainAdicional.id}`,
                                        e.target.value
                                      );
                                      handleFormChange({
                                        ...values,
                                        [`u_${mainAdicional.id}`]:
                                          e.target.value,
                                      });
                                    }}
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
                                  {errors[`u_${mainAdicional.id}`] && (
                                    <Typography variant="caption" color="error">
                                      {
                                        errors[
                                          `u_${mainAdicional.id}`
                                        ] as string
                                      }
                                    </Typography>
                                  )}
                                </div>
                              )}

                              {/* Tipo "M" - Múltiplo */}
                              {mainAdicional.selecao === "M" && (
                                <div className="space-y-2">
                                  <Typography variant="subtitle1">
                                    {mainAdicional.nome}
                                    {mainAdicional.minimo &&
                                    mainAdicional.minimo > 0 ? (
                                      <span className="text-red-500 ml-1">
                                        * (MIN {mainAdicional.minimo})
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 ml-1">
                                        Opcional
                                      </span>
                                    )}
                                    {mainAdicional.limite &&
                                      mainAdicional.limite > 0 && (
                                        <span className="text-gray-500 ml-1">
                                          (MÁX {mainAdicional.limite})
                                        </span>
                                      )}
                                  </Typography>

                                  <FormGroup>
                                    {mainAdicional.opcoes!.map((o) => {
                                      const selectedIds =
                                        values[`m_${mainAdicional.id}`] || [];
                                      const isChecked = selectedIds.includes(
                                        o.id
                                      );
                                      const selectedCount = selectedIds.length;
                                      const hasLimit =
                                        mainAdicional.limite &&
                                        mainAdicional.limite > 0;
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
                                                  values[
                                                    `m_${mainAdicional.id}`
                                                  ] || [];
                                                let newIds;

                                                if (e.target.checked) {
                                                  newIds = [
                                                    ...currentIds,
                                                    o.id,
                                                  ];
                                                } else {
                                                  newIds = currentIds.filter(
                                                    (id: string) => id !== o.id
                                                  );
                                                }

                                                setFieldValue(
                                                  `m_${mainAdicional.id}`,
                                                  newIds
                                                );
                                                handleFormChange({
                                                  ...values,
                                                  [`m_${mainAdicional.id}`]:
                                                    newIds,
                                                });
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
                                  {errors[`m_${mainAdicional.id}`] && (
                                    <Typography variant="caption" color="error">
                                      {
                                        errors[
                                          `m_${mainAdicional.id}`
                                        ] as string
                                      }
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
                                      values[`q_${mainAdicional.id}`]?.[o.id] ||
                                      0;
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
                                            onClick={() => {
                                              const currentObj =
                                                values[
                                                  `q_${mainAdicional.id}`
                                                ] || {};
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
                                              handleFormChange({
                                                ...values,
                                                [`q_${mainAdicional.id}`]:
                                                  newObj,
                                              });
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
                                                values[
                                                  `q_${mainAdicional.id}`
                                                ] || {};
                                              const newObj = {
                                                ...currentObj,
                                                [o.id]: val,
                                              };
                                              setFieldValue(
                                                `q_${mainAdicional.id}`,
                                                newObj
                                              );
                                              handleFormChange({
                                                ...values,
                                                [`q_${mainAdicional.id}`]:
                                                  newObj,
                                              });
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
                                                values[
                                                  `q_${mainAdicional.id}`
                                                ] || {};
                                              const newObj = {
                                                ...currentObj,
                                                [o.id]:
                                                  (currentObj[o.id] || 0) + 1,
                                              };
                                              setFieldValue(
                                                `q_${mainAdicional.id}`,
                                                newObj
                                              );
                                              handleFormChange({
                                                ...values,
                                                [`q_${mainAdicional.id}`]:
                                                  newObj,
                                              });
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
                                      {
                                        errors[
                                          `q_${mainAdicional.id}`
                                        ] as string
                                      }
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
                              onChange={(e) => {
                                setFieldValue("observacao", e.target.value);
                                handleFormChange({
                                  ...values,
                                  observacao: e.target.value,
                                });
                              }}
                            />
                          </div>

                          {/* Quantidade e Total do Item */}
                          <div className="flex justify-between items-center pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Typography variant="body2">
                                Quantidade:
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const newQuantidade = Math.max(
                                    1,
                                    values.quantidade - 1
                                  );
                                  setFieldValue("quantidade", newQuantidade);
                                  handleFormChange({
                                    ...values,
                                    quantidade: newQuantidade,
                                  });
                                }}
                                disabled={values.quantidade === 1}
                              >
                                <Minus size={16} />
                              </IconButton>
                              <TextField
                                type="number"
                                size="small"
                                value={values.quantidade}
                                onChange={(e) => {
                                  const newQuantidade = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1
                                  );
                                  setFieldValue("quantidade", newQuantidade);
                                  handleFormChange({
                                    ...values,
                                    quantidade: newQuantidade,
                                  });
                                }}
                                inputProps={{
                                  min: 1,
                                  style: { textAlign: "center", width: 60 },
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const newQuantidade = values.quantidade + 1;
                                  setFieldValue("quantidade", newQuantidade);
                                  handleFormChange({
                                    ...values,
                                    quantidade: newQuantidade,
                                  });
                                }}
                              >
                                <Plus size={16} />
                              </IconButton>
                            </div>
                            <Typography variant="h6" color="primary">
                              {Number(
                                calculateItemTotal(values)
                              ).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </Typography>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }}
              </Formik>
            );
          })}

          {/* Botão para adicionar novo item */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Plus size={16} />}
            onClick={addNewItem}
            className="mt-4"
          >
            Adicionar outro item
          </Button>
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Typography variant="h6">
          Total Geral:{" "}
          <span className="text-primary">
            {Number(calculateTotalGeneral()).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </Typography>

        <div className="flex gap-2">
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!validateAllItems()}
          >
            {modalData?.items && modalData.items.length > 0
              ? "Atualizar"
              : "Adicionar"}{" "}
            ({items.length} {items.length === 1 ? "item" : "itens"})
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
