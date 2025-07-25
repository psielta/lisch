"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ProdutoListResponse,
  ProdutoResponse,
} from "@/rxjs/produto/produto.model";
import { User } from "@/context/auth-context";
import {
  selectRemoveProdutoByIdActionState,
  selectIdCategoria,
  selectLimit,
  selectOffset,
  selectProdutoState,
  initializeState,
  setIdCategoria,
  setLimit,
  setOffset,
  selectListProdutoActionState,
  setNome,
} from "@/rxjs/produto/produto.slice";
import { Button as ButtonMui } from "@mui/material";
import {
  listProdutosAction,
  deleteProdutoAction,
} from "@/rxjs/produto/produto.action";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "@/components/catalyst-ui-kit/dropdown";
import { Button } from "@/components/catalyst-ui-kit/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/catalyst-ui-kit/dialog";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Field, Label } from "@/components/catalyst-ui-kit/fieldset";
import { Input } from "@/components/catalyst-ui-kit/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/catalyst-ui-kit/table";
import { Select } from "@/components/catalyst-ui-kit/select";
import {
  Pagination,
  PaginationGap,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from "@/components/catalyst-ui-kit/pagination";
import { MagnifyingGlassIcon, PencilIcon } from "@heroicons/react/24/solid";
import { useAppDispatch } from "@/rxjs/hooks";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { Badge } from "@/components/catalyst-ui-kit/badge";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import Link from "next/link";

interface ProdutoPaginationParams {
  idCategoria?: string;
  limit: number;
  offset: number;
  nome?: string;
  sku?: string;
}

interface FilterForm {
  nome: string;
  idCategoria: string;
}

function TableProduto({
  data,
  user,
  dataCategorias,
}: {
  data: ProdutoListResponse;
  user: User;
  dataCategorias: ICoreCategoria[];
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados locais
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] =
    useState<ProdutoResponse | null>(null);

  // Selectors do Redux
  const produtoState = useSelector(selectProdutoState);
  const produtos = produtoState.produtos.produtos;
  const totalCount = produtoState.totalCount;
  const limit = useSelector(selectLimit);
  const offset = useSelector(selectOffset);
  const idCategoria = useSelector(selectIdCategoria);
  const removeActionState = useSelector(selectRemoveProdutoByIdActionState);
  const listActionState = useSelector(selectListProdutoActionState);

  // Calcular página atual e total de páginas
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  // React Hook Form setup
  const { register, handleSubmit, watch, reset } = useForm<FilterForm>({
    defaultValues: {
      nome: "",
      idCategoria: "-1",
    },
  });

  // Watch form values
  const nomeValue = watch("nome");
  const idCategoriaValue = watch("idCategoria");

  // Debounce nome filter to reduce dispatch frequency
  const [debouncedNome] = useDebounce(nomeValue, 500);

  // Inicialização do estado com os dados do servidor
  useEffect(() => {
    dispatch(
      initializeState({
        produtos: data,
        idCategoria: undefined,
        limit: data.limit,
        offset: data.offset,
        totalCount: data.total_count,
      })
    );
  }, [data, dispatch]);

  // Efeito para atualizar a listagem após exclusão
  useEffect(() => {
    if (removeActionState === "completed") {
      dispatch(listProdutosAction.request());
    }
  }, [removeActionState, dispatch]);

  // Efeito para aplicar filtros debounced
  useEffect(() => {
    dispatch(setOffset(0)); // Volta para a primeira página ao filtrar
    dispatch(setNome(debouncedNome || undefined));
    dispatch(
      setIdCategoria(idCategoriaValue !== "-1" ? idCategoriaValue : undefined)
    );
    dispatch(listProdutosAction.request());
  }, [debouncedNome, idCategoriaValue, dispatch]);

  // Limpar filtros
  const clearFilters = () => {
    reset({
      nome: "",
      idCategoria: "-1",
    });
    dispatch(setIdCategoria(undefined));
    dispatch(setNome(undefined));
    dispatch(setLimit(20));
    dispatch(setOffset(0));
    dispatch(listProdutosAction.request());
  };

  // Mudar de página
  const changePage = (page: number) => {
    const newOffset = (page - 1) * limit;
    dispatch(setOffset(newOffset));
    dispatch(listProdutosAction.request());
  };

  // Handler para exclusão de produto
  const handleDeleteProduto = () => {
    if (selectedProduto) {
      dispatch(deleteProdutoAction.request(selectedProduto.id));
      setDeleteDialogOpen(false);
    }
  };

  // Definição das colunas da tabela usando TanStack Table
  const columnHelper = createColumnHelper<ProdutoResponse>();

  const columns = [
    columnHelper.display({
      id: "actions",
      size: 50,
      header: "Ações",
      cell: (info) => (
        <ButtonMui
          variant="outlined"
          color="primary"
          onClick={() =>
            router.push(`/cadastros/produtos/${info.row.original.id}`)
          }
          startIcon={<PencilIcon className="w-3 h-3" />}
        >
          Editar
        </ButtonMui>
      ),
    }),
    columnHelper.accessor("seq_id", {
      header: "ID",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("nome", {
      header: "Nome",
      cell: (info) => (
        <div className="whitespace-normal">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("id_categoria", {
      header: "Categoria",
      cell: (info) => {
        const categoria = dataCategorias.find((c) => c.id === info.getValue());
        return categoria ? categoria.nome : "-";
      },
    }),
    columnHelper.accessor("precos", {
      header: () => (
        <div className="flex w-full">
          <div className="w-1/4 text-center">Opção</div>
          <div className="w-1/4 text-center">Preço Base</div>
          <div className="w-1/4 text-center">Preço Promocional</div>
          <div className="w-1/4 text-center">Disponível</div>
        </div>
      ),
      size: 300,
      cell: ({ row }) => {
        const produto = row.original;
        const precos = produto.precos;
        const categoria = dataCategorias.find(
          (c) => c.id === produto.id_categoria
        );

        return (
          <Table
            className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg border"
            dense
          >
            {precos && (
              <TableBody>
                {precos.map((preco, index) => {
                  const opcaoPreco = categoria?.opcoes.find(
                    (opcao) => opcao.id === preco.id_categoria_opcao
                  );
                  return (
                    <TableRow key={preco.id}>
                      <TableCell className="text-center">
                        {opcaoPreco?.nome || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        R$ {parseFloat(preco.preco_base).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {preco.preco_promocional
                          ? `R$ ${parseFloat(preco.preco_promocional).toFixed(
                              2
                            )}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            preco.disponivel ? "text-green-600" : "text-red-600"
                          }
                        >
                          {preco.disponivel ? "Disponível" : "Indisponível"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) =>
        info.getValue() === 1 ? (
          <Badge color="green">Ativo</Badge>
        ) : (
          <Badge color="red">Inativo</Badge>
        ),
    }),
    columnHelper.accessor("created_at", {
      header: "Criado em",
      cell: (info) => format(new Date(info.getValue()), "dd/MM/yyyy"),
    }),
  ];

  // Inicialização da tabela
  const table = useReactTable({
    data: produtos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Renderização de paginação com números de página
  const renderPaginationItems = () => {
    let items = [];

    // Primeira página
    items.push(
      <div
        key="first"
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          changePage(1);
        }}
        className="inline-flex"
      >
        <PaginationPage href="#" current={currentPage === 1}>
          1
        </PaginationPage>
      </div>
    );

    // Calcular intervalo de páginas a mostrar
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Adicionar gap se necessário no início
    if (startPage > 2) {
      items.push(<PaginationGap key="gap-start" />);
    }

    // Páginas intermediárias
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <div
          key={i}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            changePage(i);
          }}
          className="inline-flex"
        >
          <PaginationPage href="#" current={currentPage === i}>
            {i}
          </PaginationPage>
        </div>
      );
    }

    // Adicionar gap se necessário no final
    if (endPage < totalPages - 1 && totalPages > 1) {
      items.push(<PaginationGap key="gap-end" />);
    }

    // Última página se há mais de uma página
    if (totalPages > 1) {
      items.push(
        <div
          key="last"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            changePage(totalPages);
          }}
          className="inline-flex"
        >
          <PaginationPage href="#" current={currentPage === totalPages}>
            {totalPages}
          </PaginationPage>
        </div>
      );
    }

    return items;
  };

  return (
    <div className="space-y-6 mt-5">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6">Produtos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lista de todos os produtos disponíveis no sistema.
          </p>
        </div>

        {/* Componentes de busca centralizados e lado a lado */}
        <div className="mt-4 sm:mt-0 relative flex-1 mx-auto max-w-2xl flex gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              {...register("nome")}
              placeholder="Pesquisar produtos..."
              className="block w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <select
            {...register("idCategoria")}
            className="w-48 rounded-md border border-border bg-background py-2 pl-3 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="-1">Todas as categorias</option>
            {dataCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 sm:ml-4 sm:mt-0 sm:flex-none">
          <Link
            href="/cadastros/produtos/novo"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Adicionar produto
          </Link>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div>
        <Table grid>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeader key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHeader>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows && table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 0 && (
        <Pagination className="justify-center">
          <div
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (currentPage > 1) {
                changePage(currentPage - 1);
              }
            }}
            className="inline-flex"
          >
            <PaginationPrevious
              children="Anterior"
              href={currentPage > 1 ? "#" : null}
            />
          </div>
          <PaginationList>{renderPaginationItems()}</PaginationList>
          <div
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (currentPage < totalPages) {
                changePage(currentPage + 1);
              }
            }}
            className="inline-flex"
          >
            <PaginationNext
              children="Próximo"
              href={currentPage < totalPages ? "#" : null}
            />
          </div>
        </Pagination>
      )}

      {/* Informações de paginação */}
      <div className="text-sm text-zinc-500 text-center">
        Mostrando {produtos ? produtos.length : 0} de {totalCount} resultados (
        Página {currentPage} de {totalPages})
      </div>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogDescription>
          Tem certeza que deseja excluir o produto "{selectedProduto?.nome}"?
          Esta ação não pode ser desfeita.
        </DialogDescription>
        <DialogBody>
          <p>
            ID: {selectedProduto?.id}
            <br />
            SKU: {selectedProduto?.sku || "Não informado"}
            <br />
            Código Externo: {selectedProduto?.codigo_externo || "Não informado"}
          </p>
        </DialogBody>
        <DialogActions>
          <Button color="red" onClick={handleDeleteProduto}>
            Excluir
          </Button>
          <Button outline onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default TableProduto;
