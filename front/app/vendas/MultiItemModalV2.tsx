// MultiItemModal.tsx - Versão corrigida usando ItemFormCard
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
} from "@mui/material";
import { X, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { useState, useEffect } from "react";
import * as Yup from "yup";

import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import {
  PedidoItemAdicionalDTO,
  PedidoItemDTO,
} from "@/rxjs/pedido/pedido.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { ItemFormCard, ItemForm } from "./ItemFormCard";

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

type ItemWithKey = ItemForm & { _key: string };

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

export function MultiItemModalV2({
  open,
  onClose,
  modalData,
  adicionais,
  categorias,
  onSave,
}: Props) {
  const [items, setItems] = useState<ItemWithKey[]>([]);

  // Função para criar item inicial
  const createInitialItem = (existingItem?: PedidoItemDTO): ItemForm => {
    const initial: ItemForm = {
      id_categoria_opcao: existingItem?.id_categoria_opcao ?? "",
      quantidade: existingItem?.quantidade ?? 1,
      observacao: existingItem?.observacao ?? "",
    };

    if (!modalData) return initial;

    const mainAdicional =
      adicionais.find(
        (a) =>
          a.id_categoria === modalData.produto.id_categoria &&
          a.is_main === true
      ) || null;

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

  useEffect(() => {
    if (!modalData) return;

    const build = (existing?: PedidoItemDTO) => ({
      ...createInitialItem(existing),
      _key: nanoid(),
    });

    if (modalData.items?.length) {
      setItems([build(modalData.items[0])]);
    } else {
      setItems([build()]);
    }
  }, [modalData]);

  if (!modalData) {
    return <Dialog open={open} onClose={onClose} />;
  }

  const { produto } = modalData;

  // Encontrar o adicional principal
  const mainAdicional =
    adicionais.find(
      (a) => a.id_categoria === produto.id_categoria && a.is_main === true
    ) || null;

  const schema = buildMultiItemSchema(mainAdicional);

  // Função para adicionar novo item
  const addNewItem = () => {
    setItems([...items, { ...createInitialItem(), _key: nanoid() }]);
  };

  // Função para remover item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Função para atualizar item
  const updateItem = (index: number, updatedItem: ItemForm) => {
    const newItems = [...items];
    newItems[index] = { ...updatedItem, _key: items[index]._key };
    setItems(newItems);
  };

  // Função para calcular total geral
  const calculateTotalGeneral = () => {
    return items.reduce((total, item) => {
      let itemTotal = 0;

      const preco = produto.precos!.find(
        (p) => p.id_categoria_opcao === item.id_categoria_opcao
      );
      if (preco) {
        itemTotal += parseFloat(preco.preco_base);
      }

      if (mainAdicional) {
        if (mainAdicional.selecao === "U") {
          const selectedId = item[`u_${mainAdicional.id}`];
          const opcao = mainAdicional.opcoes!.find((o) => o.id === selectedId);
          if (opcao) {
            itemTotal += parseFloat(opcao.valor);
          }
        }

        if (mainAdicional.selecao === "M") {
          const selectedIds = item[`m_${mainAdicional.id}`] || [];
          selectedIds.forEach((id: string) => {
            const opcao = mainAdicional.opcoes!.find((o) => o.id === id);
            if (opcao) {
              itemTotal += parseFloat(opcao.valor);
            }
          });
        }

        if (mainAdicional.selecao === "Q") {
          Object.entries(item[`q_${mainAdicional.id}`] || {}).forEach(
            ([id, qt]: any) => {
              if (qt > 0) {
                const opcao = mainAdicional.opcoes!.find((o) => o.id === id);
                if (opcao) {
                  itemTotal += parseFloat(opcao.valor) * qt;
                }
              }
            }
          );
        }
      }

      return total + itemTotal * item.quantidade;
    }, 0);
  };

  // Função para converter FormItem em PedidoItemDTO
  const convertFormItemToPedidoItem = (formItem: ItemForm): PedidoItemDTO => {
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
            {produto.nome}
            {mainAdicional && ` - ${mainAdicional.nome}`}
          </Typography>
        </div>
        <IconButton onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-4">
          {items.map((item, index) => (
            <ItemFormCard
              key={item._key}
              index={index}
              initial={item}
              schema={schema}
              produto={produto}
              categorias={categorias}
              mainAdicional={mainAdicional}
              itemsLength={items.length}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          ))}

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
