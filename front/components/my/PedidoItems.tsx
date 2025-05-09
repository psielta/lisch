import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { InputPedidoItem } from "@/rxjs/pedidos/pedido.model";
import { Produto } from "@/dto/Produto";
import { FieldArray, useFormikContext } from "formik";
import { InputPedido } from "@/rxjs/pedidos/pedido.model";
import SeparatorForm from "./SeperatorForm";
import { formatCurrency } from "@/lib/currecyUtils";
import { toast } from "sonner";

/* ------------------------------------------------------------- */
/* utilidades                                                     */
/* ------------------------------------------------------------- */
const calcTotal = (q: string, p: string, d: string = "0") => {
  const qty = +q || 0;
  const price = +p || 0;
  const disc = +d || 0;
  const tot = qty * price;
  return (tot - tot * (disc / 100)).toFixed(2);
};

/** todas as chaves válidas de preço */
type PrecoKey =
  | "preco1"
  | "preco2"
  | "preco3"
  | "preco4"
  | "preco5"
  | "preco6"
  | "preco7"
  | "preco8"
  | "preco9"
  | "preco10"
  | "preco11"
  | "preco12"
  | "preco13"
  | "preco14"
  | "preco15"
  | "preco16"
  | "preco17"
  | "preco18"
  | "preco19"
  | "preco20"
  | "preco21"
  | "preco22"
  | "preco23"
  | "preco24";

const getPrecoPorTabela = (
  produto: Produto | undefined,
  priceList: number | null
): number | null => {
  console.log("produto", produto);
  if (!produto || !priceList) return null;

  // agora o compilador sabe que `key` é uma das 24 chaves
  const key = `preco${priceList}` as PrecoKey;

  // e também entende que produto[key] é do tipo number | null
  return produto[key] ?? null;
};

/* ------------------------------------------------------------- */
/* componente                                                     */
/* ------------------------------------------------------------- */
interface Props {
  produtos: Produto[];
}

const PedidoItems: React.FC<Props> = ({ produtos }) => {
  const { values } = useFormikContext<InputPedido>(); // pega price_list
  const priceList = values.price_list ?? null;
  console.log("priceList", priceList);

  /* ---------------- estado interno ---------------- */
  const [editing, setEditing] = useState<{
    idx: number | null;
    item: InputPedidoItem | null;
  }>({ idx: null, item: null });

  const [draft, setDraft] = useState<InputPedidoItem>({
    produto_id: "",
    quantity: "1",
    unit_price: "0",
    discount: "0",
    total_price: "0",
    faturado: true,
    unit_price_dif: "0",
    discount_dif: "0",
    total_price_dif: "0",
  });

  /* ---------------- helpers ---------------- */
  const produtoById = (id: string) => produtos.find((p) => p.id === id);

  const updateDraft = (field: keyof InputPedidoItem, val: string | boolean) =>
    setDraft((prev) => {
      const next = { ...prev, [field]: val } as InputPedidoItem;

      /* preço “normal” */
      if (["quantity", "unit_price", "discount"].includes(field as string)) {
        next.total_price = calcTotal(
          field === "quantity" ? (val as string) : prev.quantity,
          field === "unit_price" ? (val as string) : prev.unit_price,
          field === "discount" ? (val as string) : prev.discount
        );
      }

      /* preço diferenciado */
      if (
        ["quantity", "unit_price_dif", "discount_dif"].includes(field as string)
      ) {
        next.total_price_dif = calcTotal(
          field === "quantity" ? (val as string) : prev.quantity,
          field === "unit_price_dif"
            ? (val as string)
            : prev.unit_price_dif?.toString() ?? "0",
          field === "discount_dif"
            ? (val as string)
            : prev.discount_dif?.toString() ?? "0"
        );
      }
      return next;
    });

  /* ---------------- adicionar item ---------------- */
  const pushItem = (arrayHelpers: any) => {
    if (!priceList) {
      toast.error("Defina primeiro a tabela de preço (Price List).");
      return;
    }
    const prod = produtoById(draft.produto_id);
    const preco = getPrecoPorTabela(prod, priceList);
    if (preco == null) {
      toast.error(
        `Produto sem preço na tabela ${priceList}. Escolha outro produto ou tabela.`
      );
      return;
    }
    const totDif = calcTotal(
      draft.quantity,
      draft.unit_price_dif?.toString() ?? "0",
      draft.discount_dif?.toString() ?? "0"
    );
    draft.total_price_dif = draft.unit_price_dif ? totDif : "";
    arrayHelpers.push(draft);
    setDraft({
      produto_id: "",
      quantity: "1",
      unit_price: "0",
      discount: "0",
      total_price: "0",
      unit_price_dif: "0",
      discount_dif: "0",
      total_price_dif: "0",
      faturado: true,
    });
  };

  /* ---------------- edição ---------------- */
  const startEdit = (idx: number, item: InputPedidoItem) =>
    setEditing({ idx, item: { ...item } });

  const changeEdit = (field: keyof InputPedidoItem, val: string | boolean) =>
    setEditing((prev) => {
      if (!prev.item) return prev;
      const next = { ...prev.item, [field]: val } as InputPedidoItem;
      if (["quantity", "unit_price", "discount"].includes(field as string)) {
        next.total_price = calcTotal(
          field === "quantity" ? (val as string) : prev.item.quantity,
          field === "unit_price" ? (val as string) : prev.item.unit_price,
          field === "discount" ? (val as string) : prev.item.discount
        );
      }
      if (
        ["quantity", "unit_price_dif", "discount_dif"].includes(field as string)
      ) {
        next.total_price_dif = calcTotal(
          field === "quantity" ? (val as string) : prev.item.quantity,
          field === "unit_price_dif"
            ? (val as string)
            : prev.item.unit_price_dif?.toString() ?? "0",
          field === "discount_dif"
            ? (val as string)
            : prev.item.discount_dif?.toString() ?? "0"
        );
      }
      return { ...prev, item: next };
    });

  const saveEdit = (arrayHelpers: any) => {
    if (editing.idx == null || !editing.item) return;
    arrayHelpers.replace(editing.idx, editing.item);
    setEditing({ idx: null, item: null });
  };

  /* ------------------------------------------------------------- */
  /* render                                                        */
  /* ------------------------------------------------------------- */
  return (
    <Box sx={{ mt: 4 }}>
      <SeparatorForm title="Itens do Pedido" />

      <FieldArray
        name="items"
        render={(arrayHelpers) => (
          <>
            {/* ---------- tabela de itens já adicionados ---------- */}
            <TableContainer
              component={Paper}
              sx={{ mb: 3 }}
              className="border border-foreground/20"
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell align="right">Qtd.</TableCell>
                    <TableCell align="right">Preço&nbsp;Unit.</TableCell>
                    <TableCell align="right">Desc.&nbsp;(%)</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Preço Dif.</TableCell>
                    <TableCell align="right">Desc. Dif.(%)</TableCell>
                    <TableCell align="right">Total Dif.</TableCell>
                    <TableCell align="center">Faturado</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {values.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Nenhum item adicionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    values.items.map((it, idx) => {
                      const isEd = editing.idx === idx;
                      const prod = produtoById(
                        isEd ? editing.item?.produto_id ?? "" : it.produto_id
                      );

                      return (
                        <TableRow key={idx}>
                          {/* PRODUTO ------------------------------------------------ */}
                          <TableCell>
                            {isEd ? (
                              <Autocomplete
                                options={produtos}
                                getOptionLabel={(o) =>
                                  `${o.codigo_ext} • ${o.nome}`
                                }
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={prod ?? null}
                                onChange={(_, nv) => {
                                  const precoSel = getPrecoPorTabela(
                                    nv ?? undefined,
                                    priceList
                                  );
                                  changeEdit("produto_id", nv?.id || "");
                                  changeEdit(
                                    "unit_price",
                                    precoSel != null ? precoSel.toString() : "0"
                                  );
                                }}
                                renderInput={(p) => (
                                  <TextField {...p} size="small" fullWidth />
                                )}
                                sx={{ minWidth: 400 }}
                              />
                            ) : (
                              `${prod?.codigo_ext} • ${prod?.nome}` ||
                              "Produto não encontrado"
                            )}
                          </TableCell>

                          {/* QTD ---------------------------------------------------- */}
                          <TableCell align="right">
                            {isEd ? (
                              <TextField
                                size="small"
                                sx={{ minWidth: 90 }}
                                type="number"
                                value={editing.item?.quantity ?? "0"}
                                onChange={(e) =>
                                  changeEdit("quantity", e.target.value)
                                }
                                inputProps={{ step: "0.01", min: "0" }}
                              />
                            ) : (
                              it.quantity
                            )}
                          </TableCell>

                          {/* PREÇO -------------------------------------------------- */}
                          <TableCell align="right">
                            {isEd ? (
                              <TextField
                                size="small"
                                sx={{ minWidth: 90 }}
                                type="number"
                                value={editing.item?.unit_price ?? "0"}
                                onChange={(e) =>
                                  changeEdit("unit_price", e.target.value)
                                }
                                inputProps={{ step: "0.01", min: "0" }}
                              />
                            ) : (
                              formatCurrency(+it.unit_price)
                            )}
                          </TableCell>

                          {/* DESCONTO --------------------------------------------- */}
                          <TableCell align="right">
                            {isEd ? (
                              <TextField
                                size="small"
                                sx={{ minWidth: 90 }}
                                type="number"
                                value={editing.item?.discount ?? "0"}
                                onChange={(e) =>
                                  changeEdit("discount", e.target.value)
                                }
                                inputProps={{
                                  step: "0.01",
                                  min: "0",
                                  max: "100",
                                }}
                              />
                            ) : (
                              (+it.discount).toFixed(2)
                            )}
                          </TableCell>

                          {/* TOTAL -------------------------------------------------- */}
                          <TableCell align="right">
                            {formatCurrency(
                              +(isEd
                                ? editing.item?.total_price ?? "0"
                                : it.total_price)
                            )}
                          </TableCell>
                          {/* PREÇO DIF. ------------------------------------------------ */}
                          <TableCell align="right">
                            {isEd ? (
                              <TextField
                                size="small"
                                sx={{ minWidth: 90 }}
                                type="number"
                                value={editing.item?.unit_price_dif ?? ""}
                                onChange={(e) =>
                                  changeEdit("unit_price_dif", e.target.value)
                                }
                                inputProps={{ step: "0.01", min: "0" }}
                              />
                            ) : it.unit_price_dif ? (
                              formatCurrency(+it.unit_price_dif)
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          {/* DESCONTO DIF. ------------------------------------------- */}
                          <TableCell align="right">
                            {isEd ? (
                              <TextField
                                size="small"
                                sx={{ minWidth: 90 }}
                                type="number"
                                value={editing.item?.discount_dif ?? ""}
                                onChange={(e) =>
                                  changeEdit("discount_dif", e.target.value)
                                }
                                inputProps={{
                                  step: "0.01",
                                  min: "0",
                                  max: "100",
                                }}
                              />
                            ) : it.discount_dif ? (
                              (+it.discount_dif).toFixed(2)
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          {/* TOTAL DIF. ---------------------------------------------- */}
                          <TableCell align="right">
                            {it.total_price_dif
                              ? formatCurrency(
                                  +(isEd
                                    ? editing.item?.total_price_dif ?? "0"
                                    : it.total_price_dif)
                                )
                              : "-"}
                          </TableCell>

                          {/* FATURADO --------------------------------------------- */}
                          <TableCell align="center">
                            {isEd ? (
                              <Checkbox
                                checked={editing.item?.faturado ?? false}
                                onChange={(e) =>
                                  changeEdit("faturado", e.target.checked)
                                }
                              />
                            ) : it.faturado ? (
                              "Sim"
                            ) : (
                              "Não"
                            )}
                          </TableCell>

                          {/* AÇÕES -------------------------------------------------- */}
                          <TableCell align="center">
                            {isEd ? (
                              <>
                                <Button
                                  size="small"
                                  color="primary"
                                  onClick={() => saveEdit(arrayHelpers)}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    setEditing({ idx: null, item: null })
                                  }
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => startEdit(idx, it)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => arrayHelpers.remove(idx)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ---------- formulário "Adicionar Novo Item" ---------- */}
            <SeparatorForm title="Adicionar Novo Item" />
            <Paper
              sx={{ p: 2, mb: 3, backgroundColor: "mui-paper" }}
              className="border border-foreground/20"
            >
              <Grid container spacing={2} alignItems="center">
                {/* PRODUTO ------------------------------------------------------ */}
                <Grid size={9}>
                  <Autocomplete
                    options={produtos}
                    size="small"
                    getOptionLabel={(o) => `${o.codigo_ext} • ${o.nome}`}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    value={produtoById(draft.produto_id) ?? null}
                    onChange={(_, nv) =>
                      setDraft((prev) => {
                        const precoSel = getPrecoPorTabela(
                          nv ?? undefined,
                          priceList
                        );
                        const next = {
                          ...prev,
                          produto_id: nv?.id || "",
                          unit_price:
                            precoSel != null
                              ? precoSel.toString()
                              : prev.unit_price,
                          unit_price_dif:
                            precoSel != null
                              ? precoSel.toString()
                              : prev.unit_price_dif,
                        };
                        next.total_price = calcTotal(
                          next.quantity,
                          next.unit_price,
                          next.discount
                        );
                        next.total_price_dif = calcTotal(
                          next.quantity,
                          next.unit_price_dif?.toString() ?? "0",
                          next.discount_dif?.toString() ?? "0"
                        );
                        return next;
                      })
                    }
                    renderInput={(p) => (
                      <TextField {...p} label="Produto" fullWidth />
                    )}
                  />
                </Grid>

                {/* QTD ---------------------------------------------------------- */}
                <Grid size={3}>
                  <TextField
                    label="Quantidade"
                    type="number"
                    size="small"
                    fullWidth
                    value={draft.quantity}
                    onChange={(e) => updateDraft("quantity", e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    required
                  />
                </Grid>

                {/* PREÇO -------------------------------------------------------- */}
                <Grid size={4}>
                  <TextField
                    label="Preço Unit."
                    type="number"
                    size="small"
                    fullWidth
                    value={draft.unit_price}
                    onChange={(e) => updateDraft("unit_price", e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    required
                  />
                </Grid>

                {/* DESCONTO ----------------------------------------------------- */}
                <Grid size={4}>
                  <TextField
                    label="Desconto (%)"
                    size="small"
                    type="number"
                    fullWidth
                    value={draft.discount}
                    onChange={(e) => updateDraft("discount", e.target.value)}
                    inputProps={{ step: "0.01", min: "0", max: "100" }}
                  />
                </Grid>

                {/* TOTAL -------------------------------------------------------- */}
                <Grid size={4}>
                  <TextField
                    label="Total"
                    type="number"
                    size="small"
                    fullWidth
                    value={draft.total_price}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid size={4}>
                  <TextField
                    label="Preço Unit. Dif."
                    type="number"
                    size="small"
                    fullWidth
                    value={draft.unit_price_dif}
                    onChange={(e) =>
                      updateDraft("unit_price_dif", e.target.value)
                    }
                    inputProps={{ step: "0.01", min: "0" }}
                  />
                </Grid>

                <Grid size={4}>
                  <TextField
                    label="Desc. Dif. (%)"
                    type="number"
                    size="small"
                    fullWidth
                    value={draft.discount_dif}
                    onChange={(e) =>
                      updateDraft("discount_dif", e.target.value)
                    }
                    inputProps={{ step: "0.01", min: "0", max: "100" }}
                  />
                </Grid>

                <Grid size={4}>
                  <TextField
                    label="Total Dif."
                    type="number"
                    size="small"
                    fullWidth
                    value={draft.total_price_dif}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                {/* FATURADO ----------------------------------------------------- */}
                <Grid size={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={draft.faturado}
                        onChange={(e) =>
                          updateDraft("faturado", e.target.checked)
                        }
                      />
                    }
                    label="Faturado"
                  />
                </Grid>

                {/* BOTÃO -------------------------------------------------------- */}
                <Grid size={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => pushItem(arrayHelpers)}
                  >
                    Adicionar Item
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      />
    </Box>
  );
};

export default PedidoItems;
