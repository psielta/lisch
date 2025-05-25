import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { Add, Remove } from "@mui/icons-material";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { PedidoItemDTO } from "@/rxjs/pedido/pedido.model";

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  modalData: {
    produto: ProdutoResponse;
    item?: PedidoItemDTO;
    index?: number;
  } | null;
  adicionais: CategoriaAdicionalResponse[];
  onSave: (item: PedidoItemDTO) => void;
}

export function ItemModal({
  open,
  onClose,
  modalData,
  adicionais,
  onSave,
}: ItemModalProps) {
  const [selectedPreco, setSelectedPreco] = useState<string>("");
  const [selectedAdicionais, setSelectedAdicionais] = useState<{
    [key: string]: any;
  }>({});
  const [quantidade, setQuantidade] = useState<number>(1);
  const [observacao, setObservacao] = useState<string>("");

  // Reset modal state when opening
  useEffect(() => {
    if (open && modalData) {
      if (modalData.item) {
        // Editing existing item
        setSelectedPreco(modalData.item.id_categoria_opcao || "");
        setQuantidade(modalData.item.quantidade);
        setObservacao(modalData.item.observacao || "");
        // Set adicionais state based on existing item
        const addState: { [key: string]: any } = {};
        modalData.item?.adicionais?.forEach((add) => {
          addState[add.id_adicional_opcao] = add.quantidade;

          // preciso descobrir a qual adicional essa opção pertence
          const grupo = adicionais.find((a) =>
            a.opcoes?.some((o) => o.id === add.id_adicional_opcao)
          );
          if (grupo?.selecao === "U") {
            addState[`group_${grupo.id}`] = add.id_adicional_opcao;
          }
        });
        setSelectedAdicionais(addState);
      } else {
        // Adding new item
        setSelectedPreco("");
        setSelectedAdicionais({});
        setQuantidade(1);
        setObservacao("");
      }
    }
  }, [open, modalData, adicionais]);

  if (!modalData) return null;

  const relevantAdicionais = adicionais.filter(
    (a) => a.id_categoria === modalData.produto.id_categoria
  );

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const calculateModalTotal = () => {
    if (!selectedPreco) return 0;

    const precoBase =
      modalData.produto.precos?.find(
        (p) => p.id_categoria_opcao === selectedPreco
      )?.preco_base || "0";

    const adicionaisTotal = Object.entries(selectedAdicionais).reduce(
      (total, [key, value]) => {
        if (key.startsWith("group_")) return total;

        const adicionalOpcao = relevantAdicionais
          .flatMap((a) => a.opcoes || [])
          .find((o) => o.id === key);

        if (adicionalOpcao) {
          return total + parseFloat(adicionalOpcao.valor) * value;
        }
        return total;
      },
      0
    );

    return (parseFloat(precoBase) + adicionaisTotal) * quantidade;
  };

  const handleSave = () => {
    if (!selectedPreco) return;

    const precoSelecionado = modalData.produto.precos?.find(
      (p) => p.id_categoria_opcao === selectedPreco
    );

    if (!precoSelecionado) return;

    const adicionaisArray = Object.entries(selectedAdicionais)
      .filter(([key]) => !key.startsWith("group_"))
      .filter(([, value]) => value > 0)
      .map(([key, value]) => {
        const adicionalOpcao = relevantAdicionais
          .flatMap((a) => a.opcoes || [])
          .find((o) => o.id === key);

        return {
          id_adicional_opcao: key,
          valor: adicionalOpcao?.valor || "0",
          quantidade: value,
        };
      });

    const item: PedidoItemDTO = {
      id_categoria: modalData.produto.id_categoria,
      id_categoria_opcao: selectedPreco,
      id_produto: modalData.produto.id,
      valor_unitario: precoSelecionado.preco_base,
      quantidade,
      observacao: observacao || undefined,
      adicionais: adicionaisArray,
    };

    onSave(item);
  };

  const totalQ = (adicional: CategoriaAdicionalResponse) => {
    return Object.entries(selectedAdicionais)
      .filter(([key]) => {
        const opcao = adicional.opcoes?.find((o) => o.id === key);
        return opcao !== undefined;
      })
      .reduce((sum, [, value]) => sum + value, 0);
  };

  const renderAdicionalControl = (adicional: CategoriaAdicionalResponse) => {
    if (adicional.selecao === "U") {
      return (
        <div key={adicional.id} className="mb-4">
          <Typography variant="h6" className="mb-2">
            {adicional.nome}
          </Typography>
          <RadioGroup
            value={selectedAdicionais[`group_${adicional.id}`] || ""}
            onChange={(e) => {
              const newState = { ...selectedAdicionais };
              // Remove previous selection if exists
              Object.keys(newState).forEach((key) => {
                if (key.startsWith("group_")) delete newState[key];
              });
              // Add new selection
              newState[`group_${adicional.id}`] = e.target.value;
              newState[e.target.value] = 1;
              setSelectedAdicionais(newState);
            }}
          >
            {adicional.opcoes?.map((opcao) => (
              <FormControlLabel
                key={opcao.id}
                value={opcao.id}
                control={<Radio />}
                label={
                  <div className="flex justify-between items-center w-full">
                    <span>{opcao.nome}</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(opcao.valor)}
                    </span>
                  </div>
                }
              />
            ))}
          </RadioGroup>
        </div>
      );
    }

    if (adicional.selecao === "Q") {
      const total = totalQ(adicional);
      return (
        <div key={adicional.id} className="mb-4">
          <Typography variant="h6" className="mb-2">
            {adicional.nome}
          </Typography>
          <div className="space-y-2">
            {adicional.opcoes?.map((opcao) => {
              const currentValue = selectedAdicionais[opcao.id] || 0;
              const disabled =
                adicional.limite &&
                total >= adicional.limite &&
                currentValue === 0;

              return (
                <div
                  key={opcao.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <Typography variant="body2">{opcao.nome}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(opcao.valor)}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newValue = Math.max(0, currentValue - 1);
                        setSelectedAdicionais({
                          ...selectedAdicionais,
                          [opcao.id]: newValue,
                        });
                      }}
                      disabled={currentValue === 0}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{ minWidth: 20, textAlign: "center" }}
                    >
                      {currentValue}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (!adicional.limite || total < adicional.limite) {
                          setSelectedAdicionais({
                            ...selectedAdicionais,
                            [opcao.id]: currentValue + 1,
                          });
                        }
                      }}
                      disabled={
                        disabled ||
                        (adicional.limite ? total >= adicional.limite : false)
                      }
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {modalData.item ? "Editar Item" : "Adicionar Item"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {modalData.produto.nome}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <div className="space-y-4">
          {/* Preços */}
          {modalData.produto.precos && modalData.produto.precos.length > 0 && (
            <div>
              <Typography variant="h6" className="mb-2">
                Escolha o preço
              </Typography>
              <RadioGroup
                value={selectedPreco}
                onChange={(e) => setSelectedPreco(e.target.value)}
              >
                {modalData.produto.precos.map((preco) => (
                  <FormControlLabel
                    key={preco.id_categoria_opcao}
                    value={preco.id_categoria_opcao}
                    control={<Radio />}
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span>
                          {preco.nome_opcao || `Opção ${preco.seq_id}`}
                        </span>
                        <span className="text-sm font-medium">
                          {formatCurrency(preco.preco_base)}
                        </span>
                      </div>
                    }
                  />
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Adicionais */}
          {relevantAdicionais.map((adicional) =>
            renderAdicionalControl(adicional)
          )}

          {/* Observação */}
          <div>
            <Typography variant="h6" className="mb-2">
              Alguma observação?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Qual a sua observação?"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              inputProps={{ maxLength: 1000 }}
            />
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
            disabled={quantidade <= 1}
          >
            <Remove />
          </IconButton>
          <TextField
            size="small"
            type="number"
            value={quantidade}
            onChange={(e) =>
              setQuantidade(Math.max(1, parseInt(e.target.value) || 1))
            }
            inputProps={{
              min: 1,
              max: 100,
              style: { textAlign: "center", width: "60px" },
            }}
          />
          <IconButton
            onClick={() => setQuantidade(Math.min(100, quantidade + 1))}
            disabled={quantidade >= 100}
          >
            <Add />
          </IconButton>
        </div>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedPreco}
          size="large"
        >
          {modalData.item ? "Atualizar" : "Adicionar ao carrinho"}{" "}
          {formatCurrency(calculateModalTotal())}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
