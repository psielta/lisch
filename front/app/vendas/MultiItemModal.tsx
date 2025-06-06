// MultiItemModal.tsx - Layout horizontal com botão "..." para adicionais secundários
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  FormGroup,
  Checkbox,
} from "@mui/material";
import { X, Plus, Minus, Trash2, MoreHorizontal } from "lucide-react";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";

import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import {
  PedidoItemAdicionalDTO,
  PedidoItemDTO,
} from "@/rxjs/pedido/pedido.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { AdicionaisSecundariosDialog } from "./AdicionaisSecundariosDialog";
import { Check, CheckCircle } from "@mui/icons-material";

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
  // Adicionais secundários
  adicionaisSecundarios: PedidoItemAdicionalDTO[];
}

// Schema melhorado para validar diferentes tipos de seleção
function buildMultiItemSchema(
  mainAdicional: CategoriaAdicionalResponse | null
) {
  const shape: any = {
    id_categoria_opcao: Yup.string().required("Selecione o preço"),
    quantidade: Yup.number().min(1),
    observacao: Yup.string(),
    adicionaisSecundarios: Yup.array(),
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

export function MultiItemModal({
  open,
  onClose,
  modalData,
  adicionais,
  categorias,
  onSave,
}: Props) {
  const [adicionaisSecundariosOpen, setAdicionaisSecundariosOpen] =
    useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

  // Todos os hooks devem estar antes de qualquer retorno condicional
  const produto = modalData?.produto;

  // Encontrar o adicional principal
  const mainAdicional = produto
    ? adicionais.find(
        (a) => a.id_categoria === produto.id_categoria && a.is_main === true
      ) || null
    : null;

  // Encontrar adicionais secundários
  const secondaryAdicionais = produto
    ? adicionais.filter(
        (a) => a.id_categoria === produto.id_categoria && a.is_main === false
      )
    : [];

  const schema = buildMultiItemSchema(mainAdicional);

  // Função para criar item inicial
  const createInitialItem = (existingItem?: PedidoItemDTO): ItemForm => {
    const initial: ItemForm = {
      id_categoria_opcao: existingItem?.id_categoria_opcao ?? "",
      quantidade: existingItem?.quantidade ?? 1,
      observacao: existingItem?.observacao ?? "",
      adicionaisSecundarios: [],
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

    // Adicionar adicionais secundários existentes
    if (existingItem?.adicionais) {
      const secondaryIds = secondaryAdicionais.flatMap(
        (a) => a.opcoes?.map((o) => o.id) || []
      );
      initial.adicionaisSecundarios = existingItem.adicionais.filter((ad) =>
        secondaryIds.includes(ad.id_adicional_opcao)
      );
    }

    return initial;
  };

  const initialItems = () => {
    if (modalData?.items && modalData.items.length > 0) {
      return [createInitialItem(modalData.items[0])];
    }
    return [createInitialItem()];
  };

  // Retorno condicional após todos os hooks
  if (!modalData || !produto) return null;

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

    // Adicionais secundários
    values.adicionaisSecundarios.forEach((ad) => {
      total += parseFloat(ad.valor) * ad.quantidade;
    });

    return total * values.quantidade;
  };

  // Função para calcular total geral
  const calculateTotalGeneral = (items: ItemForm[]) => {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  // Função para converter FormItem em PedidoItemDTO
  const convertFormItemToPedidoItem = (formItem: ItemForm): PedidoItemDTO => {
    if (!produto) throw new Error("Produto não encontrado");

    const adArr: PedidoItemAdicionalDTO[] = [];

    // Adicional principal
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

    // Adicionar adicionais secundários
    adArr.push(...formItem.adicionaisSecundarios);

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
  const validateAllItems = (items: ItemForm[]) => {
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
  const handleSave = (items: ItemForm[]) => {
    if (validateAllItems(items)) {
      const pedidoItems = items.map(convertFormItemToPedidoItem);
      onSave(pedidoItems);
      onClose();
    }
  };

  // Função para abrir adicionais secundários
  const handleOpenAdicionaisSecundarios = (itemIndex: number) => {
    setCurrentItemIndex(itemIndex);
    setAdicionaisSecundariosOpen(true);
  };

  // Função para salvar adicionais secundários
  const handleSaveAdicionaisSecundarios = (
    adicionaisSelecionados: PedidoItemAdicionalDTO[]
  ) => {
    // Aqui vamos usar uma referência direta ao Formik através de useRef ou callback
    // Por enquanto, vamos implementar diferente
    setAdicionaisSecundariosOpen(false);
    setCurrentItemIndex(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
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

        <Formik
          initialValues={{ items: initialItems() }}
          onSubmit={(values) => handleSave(values.items)}
          enableReinitialize
        >
          {({ values, setFieldValue, errors }) => {
            // Função para salvar adicionais secundários com acesso ao setFieldValue
            const handleSaveAdicionaisSecundariosWithFormik = (
              adicionaisSelecionados: PedidoItemAdicionalDTO[]
            ) => {
              if (currentItemIndex !== null) {
                setFieldValue(
                  `items.${currentItemIndex}.adicionaisSecundarios`,
                  adicionaisSelecionados
                );
              }
              setAdicionaisSecundariosOpen(false);
              setCurrentItemIndex(null);
            };

            return (
              <>
                <DialogContent dividers>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <div className="space-y-4">
                        {values.items.map((item, index) => (
                          <Box key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <Typography variant="h6">
                                Item {index + 1}
                              </Typography>
                              {values.items.length > 1 && (
                                <IconButton
                                  onClick={() => remove(index)}
                                  color="error"
                                  size="small"
                                >
                                  <Trash2 size={16} />
                                </IconButton>
                              )}
                            </div>

                            <Grid container spacing={2} alignItems="center">
                              {/* 1. Opção de preço do produto */}
                              <Grid size={{ xs: 12, md: 3 }}>
                                <Typography
                                  variant="subtitle2"
                                  className="mb-2"
                                >
                                  Preço *
                                </Typography>
                                <RadioGroup
                                  value={item.id_categoria_opcao}
                                  onChange={(e) => {
                                    setFieldValue(
                                      `items.${index}.id_categoria_opcao`,
                                      e.target.value
                                    );
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
                                        control={<Radio size="small" />}
                                        label={
                                          <div className="text-sm">
                                            <div>
                                              {p.nome_opcao ||
                                                categoria?.opcoes?.find(
                                                  (o) =>
                                                    o.id ===
                                                    p.id_categoria_opcao
                                                )?.nome ||
                                                `Opção ${p.seq_id}`}
                                            </div>
                                            <div className="text-primary font-medium">
                                              {Number(
                                                p.preco_base
                                              ).toLocaleString("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                              })}
                                            </div>
                                          </div>
                                        }
                                      />
                                    );
                                  }) || []}
                                </RadioGroup>
                              </Grid>

                              {/* 2. Adicional principal */}
                              {mainAdicional && (
                                <Grid size={{ xs: 12, md: 3 }}>
                                  <Typography
                                    variant="subtitle2"
                                    className="mb-2"
                                  >
                                    {mainAdicional.nome}{" "}
                                    {mainAdicional.minimo! > 0 && "*"}
                                  </Typography>

                                  {/* Tipo "U" - Único */}
                                  {mainAdicional.selecao === "U" && (
                                    <RadioGroup
                                      value={
                                        item[`u_${mainAdicional.id}`] || ""
                                      }
                                      onChange={(e) => {
                                        setFieldValue(
                                          `items.${index}.u_${mainAdicional.id}`,
                                          e.target.value
                                        );
                                      }}
                                    >
                                      {mainAdicional.opcoes!.map((o) => (
                                        <FormControlLabel
                                          key={o.id}
                                          value={o.id}
                                          control={<Radio size="small" />}
                                          label={
                                            <div className="text-sm">
                                              <div>{o.nome}</div>
                                              <div className="text-primary font-medium">
                                                {Number(o.valor).toLocaleString(
                                                  "pt-BR",
                                                  {
                                                    style: "currency",
                                                    currency: "BRL",
                                                  }
                                                )}
                                              </div>
                                            </div>
                                          }
                                        />
                                      ))}
                                    </RadioGroup>
                                  )}

                                  {/* Tipo "M" - Múltiplo */}
                                  {mainAdicional.selecao === "M" && (
                                    <div className="space-y-1">
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {mainAdicional.minimo &&
                                        mainAdicional.minimo > 0 ? (
                                          <span>
                                            MIN {mainAdicional.minimo}
                                          </span>
                                        ) : (
                                          <span>Opcional</span>
                                        )}
                                        {mainAdicional.limite &&
                                          mainAdicional.limite > 0 && (
                                            <span>
                                              {" "}
                                              - MÁX {mainAdicional.limite}
                                            </span>
                                          )}
                                      </Typography>

                                      <FormGroup>
                                        {mainAdicional.opcoes!.map((o) => {
                                          const selectedIds =
                                            item[`m_${mainAdicional.id}`] || [];
                                          const isChecked =
                                            selectedIds.includes(o.id);
                                          const selectedCount =
                                            selectedIds.length;
                                          const hasLimit =
                                            mainAdicional.limite &&
                                            mainAdicional.limite > 0;
                                          const canSelect =
                                            !hasLimit ||
                                            selectedCount <
                                              mainAdicional.limite! ||
                                            isChecked;

                                          return (
                                            <FormControlLabel
                                              key={o.id}
                                              control={
                                                <Checkbox
                                                  size="small"
                                                  checked={isChecked}
                                                  disabled={!canSelect}
                                                  onChange={(e) => {
                                                    const currentIds =
                                                      item[
                                                        `m_${mainAdicional.id}`
                                                      ] || [];
                                                    let newIds;

                                                    if (e.target.checked) {
                                                      newIds = [
                                                        ...currentIds,
                                                        o.id,
                                                      ];
                                                    } else {
                                                      newIds =
                                                        currentIds.filter(
                                                          (id: string) =>
                                                            id !== o.id
                                                        );
                                                    }

                                                    setFieldValue(
                                                      `items.${index}.m_${mainAdicional.id}`,
                                                      newIds
                                                    );
                                                  }}
                                                />
                                              }
                                              label={
                                                <div className="text-sm">
                                                  <div>{o.nome}</div>
                                                  <div className="text-primary font-medium">
                                                    {Number(
                                                      o.valor
                                                    ).toLocaleString("pt-BR", {
                                                      style: "currency",
                                                      currency: "BRL",
                                                    })}
                                                  </div>
                                                </div>
                                              }
                                            />
                                          );
                                        })}
                                      </FormGroup>
                                    </div>
                                  )}

                                  {/* Tipo "Q" - Quantidade */}
                                  {mainAdicional.selecao === "Q" && (
                                    <div className="space-y-1">
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {mainAdicional.minimo! > 0 && (
                                          <span>
                                            MIN {mainAdicional.minimo} - MAX{" "}
                                            {mainAdicional.limite}
                                          </span>
                                        )}
                                      </Typography>

                                      {mainAdicional.opcoes!.map((o) => {
                                        const v =
                                          item[`q_${mainAdicional.id}`]?.[
                                            o.id
                                          ] || 0;
                                        const total = sumQ(item, mainAdicional);
                                        const disablePlus =
                                          !!mainAdicional.limite &&
                                          total >= mainAdicional.limite;

                                        return (
                                          <Box
                                            key={o.id}
                                            className="flex items-center justify-between p-2 border rounded text-sm"
                                          >
                                            <div className="flex-1">
                                              <div>{o.nome}</div>
                                              <div className="text-primary font-medium text-xs">
                                                {Number(o.valor).toLocaleString(
                                                  "pt-BR",
                                                  {
                                                    style: "currency",
                                                    currency: "BRL",
                                                  }
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  const currentObj =
                                                    item[
                                                      `q_${mainAdicional.id}`
                                                    ] || {};
                                                  const newObj = {
                                                    ...currentObj,
                                                    [o.id]: Math.max(
                                                      0,
                                                      (currentObj[o.id] || 0) -
                                                        1
                                                    ),
                                                  };
                                                  setFieldValue(
                                                    `items.${index}.q_${mainAdicional.id}`,
                                                    newObj
                                                  );
                                                }}
                                                disabled={v === 0}
                                              >
                                                <Minus size={12} />
                                              </IconButton>
                                              <TextField
                                                type="number"
                                                size="small"
                                                value={v}
                                                onChange={(e) => {
                                                  const val = Math.max(
                                                    0,
                                                    Math.min(
                                                      mainAdicional.limite ||
                                                        99,
                                                      parseInt(
                                                        e.target.value
                                                      ) || 0
                                                    )
                                                  );
                                                  const currentObj =
                                                    item[
                                                      `q_${mainAdicional.id}`
                                                    ] || {};
                                                  const newObj = {
                                                    ...currentObj,
                                                    [o.id]: val,
                                                  };
                                                  setFieldValue(
                                                    `items.${index}.q_${mainAdicional.id}`,
                                                    newObj
                                                  );
                                                }}
                                                inputProps={{
                                                  style: {
                                                    textAlign: "center",
                                                    width: 40,
                                                  },
                                                }}
                                              />
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  const currentObj =
                                                    item[
                                                      `q_${mainAdicional.id}`
                                                    ] || {};
                                                  const newObj = {
                                                    ...currentObj,
                                                    [o.id]:
                                                      (currentObj[o.id] || 0) +
                                                      1,
                                                  };
                                                  setFieldValue(
                                                    `items.${index}.q_${mainAdicional.id}`,
                                                    newObj
                                                  );
                                                }}
                                                disabled={disablePlus}
                                              >
                                                <Plus size={12} />
                                              </IconButton>
                                            </div>
                                          </Box>
                                        );
                                      })}
                                    </div>
                                  )}
                                </Grid>
                              )}

                              {/* 3. Observação */}
                              <Grid size={{ xs: 12, md: 2 }}>
                                <TextField
                                  label="Observação"
                                  size="small"
                                  multiline
                                  rows={2}
                                  fullWidth
                                  value={item.observacao}
                                  onChange={(e) => {
                                    setFieldValue(
                                      `items.${index}.observacao`,
                                      e.target.value
                                    );
                                  }}
                                />
                              </Grid>

                              {/* 4. Botão "..." para adicionais secundários */}
                              <Grid size={{ xs: 12, md: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  color="secondary"
                                  onClick={() =>
                                    handleOpenAdicionaisSecundarios(index)
                                  }
                                  fullWidth
                                  title="Adicionais secundários"
                                >
                                  <MoreHorizontal size={16} />
                                </Button>
                                {item.adicionaisSecundarios.length > 0 && (
                                  <Typography
                                    variant="caption"
                                    color="primary"
                                    className="mt-1 block"
                                  >
                                    {item.adicionaisSecundarios.length}{" "}
                                    adicional(is)
                                  </Typography>
                                )}
                              </Grid>

                              {/* 5. Quantidade e Total */}
                              <Grid size={{ xs: 12, md: 3 }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Typography
                                      variant="body2"
                                      className="mr-2"
                                    >
                                      Qtd:
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        const newQtd = Math.max(
                                          1,
                                          item.quantidade - 1
                                        );
                                        setFieldValue(
                                          `items.${index}.quantidade`,
                                          newQtd
                                        );
                                      }}
                                      disabled={item.quantidade === 1}
                                    >
                                      <Minus size={14} />
                                    </IconButton>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.quantidade}
                                      onChange={(e) => {
                                        const newQtd = Math.max(
                                          1,
                                          parseInt(e.target.value) || 1
                                        );
                                        setFieldValue(
                                          `items.${index}.quantidade`,
                                          newQtd
                                        );
                                      }}
                                      inputProps={{
                                        min: 1,
                                        style: {
                                          textAlign: "center",
                                          width: 50,
                                        },
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setFieldValue(
                                          `items.${index}.quantidade`,
                                          item.quantidade + 1
                                        );
                                      }}
                                    >
                                      <Plus size={14} />
                                    </IconButton>
                                  </div>
                                  <Typography
                                    variant="h6"
                                    color="primary"
                                    className="ml-2"
                                  >
                                    {Number(
                                      calculateItemTotal(item)
                                    ).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}
                                  </Typography>
                                </div>
                              </Grid>
                            </Grid>
                          </Box>
                        ))}

                        {/* Botão para adicionar novo item */}
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<Plus size={16} />}
                          onClick={() => push(createInitialItem())}
                          className="mt-4"
                        >
                          Adicionar outro item
                        </Button>
                      </div>
                    )}
                  </FieldArray>
                </DialogContent>

                <DialogActions
                  sx={{ px: 3, py: 2, justifyContent: "space-end" }}
                >
                  <Button variant="outlined" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleSave(values.items)}
                    disabled={!validateAllItems(values.items)}
                  >
                    {modalData?.items && modalData.items.length > 0
                      ? "Atualizar"
                      : "Adicionar"}{" "}
                    ({values.items.length}{" "}
                    {values.items.length === 1 ? "item" : "itens"}){" "}
                    {Number(calculateTotalGeneral(values.items)).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )}
                  </Button>
                </DialogActions>

                {/* Modal de Adicionais Secundários - Movido para dentro do Formik */}
                <AdicionaisSecundariosDialog
                  open={adicionaisSecundariosOpen}
                  onClose={() => {
                    setAdicionaisSecundariosOpen(false);
                    setCurrentItemIndex(null);
                  }}
                  adicionais={secondaryAdicionais}
                  initialValues={
                    currentItemIndex !== null && values.items[currentItemIndex]
                      ? values.items[currentItemIndex].adicionaisSecundarios
                      : []
                  }
                  onSave={handleSaveAdicionaisSecundariosWithFormik}
                />
              </>
            );
          }}
        </Formik>
      </Dialog>
    </>
  );
}
