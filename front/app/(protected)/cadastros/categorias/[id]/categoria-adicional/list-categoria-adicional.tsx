"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { User } from "@/context/auth-context";
import { useAppDispatch } from "@/rxjs/hooks";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import {
  CategoriaAdicionalListResponse,
  CategoriaAdicionalResponse,
} from "@/rxjs/adicionais/categoria-adicional.model";
import {
  selectCategoriaAdicionalState,
  selectListActionState,
  selectCrudActionState,
  selectIdCategoria as selectIdCategoriaAdic,
  selectPagination as selectPaginationAdic,
  clearState,
  setIdCategoria,
  setPagination,
} from "@/rxjs/adicionais/categoria-adicional.slice";
import {
  listCategoriaAdicionaisAction,
  deleteCategoriaAdicionalAction,
} from "@/rxjs/adicionais/categoria-adicional.action";

import { Button } from "@/components/catalyst-ui-kit/button";
import { Badge } from "@/components/catalyst-ui-kit/badge";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "@/components/catalyst-ui-kit/dropdown";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/catalyst-ui-kit/dialog";
import { Field, Label } from "@/components/catalyst-ui-kit/fieldset";
import { Input } from "@/components/catalyst-ui-kit/input";
import { Select } from "@/components/catalyst-ui-kit/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/catalyst-ui-kit/table";
import {
  Pagination,
  PaginationGap,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from "@/components/catalyst-ui-kit/pagination";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";

interface FilterForm {
  nome: string;
  idCategoria: string;
}

function TableCategoriaAdicional({
  user,
  data,
  dataCategorias,
  defaultIdCategoria,
}: {
  user: User;
  data: CategoriaAdicionalListResponse;
  dataCategorias: ICoreCategoria[];
  defaultIdCategoria?: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  /* -------------------  Local state  ------------------- */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdicional, setSelectedAdicional] =
    useState<CategoriaAdicionalResponse | null>(null);

  /* -------------------  Redux selectors  ------------------- */
  const categoriaState = useSelector(selectCategoriaAdicionalState);
  const adicionais = categoriaState.adicionais.adicionais;
  const totalCount = categoriaState.totalCount;
  const { limit, offset } = useSelector(selectPaginationAdic);
  const idCategoria = useSelector(selectIdCategoriaAdic);
  const crudState = useSelector(selectCrudActionState);

  /* -------------------  Pagination helpers  ------------------- */
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  /* -------------------  React-Hook-Form (filtros)  ------------------- */
  const { register, watch, reset } = useForm<FilterForm>({
    defaultValues: {
      nome: "",
      idCategoria: defaultIdCategoria ?? "-1",
    },
  });

  const nomeValue = watch("nome");
  const idCategoriaValue = watch("idCategoria");
  const [debouncedNome] = useDebounce(nomeValue, 500); // caso futuramente filtre por nome na API

  /* -------------------  Efeitos de inicialização  ------------------- */
  useEffect(() => {
    // Hidrata slice com dados SSR
    dispatch(clearState());
    dispatch(
      setPagination({
        limit: data.limit,
        offset: data.offset,
      })
    );
    dispatch(setIdCategoria(defaultIdCategoria));
    // Guardamos dados já vindos do servidor no slice através da action de sucesso “fake”
    dispatch(
      listCategoriaAdicionaisAction.success({
        ...data,
      })
    );
  }, [data, defaultIdCategoria, dispatch]);

  /* -------------------  Efeito pós-CRUD (delete, create, etc.)  ------------------- */
  useEffect(() => {
    if (crudState === "completed") {
      dispatch(listCategoriaAdicionaisAction.request());
    }
  }, [crudState, dispatch]);

  /* -------------------  Efeito filtros  ------------------- */
  useEffect(() => {
    dispatch(setPagination({ limit, offset: 0 })); // volta para primeira página
    dispatch(
      setIdCategoria(idCategoriaValue !== "-1" ? idCategoriaValue : undefined)
    );
    dispatch(listCategoriaAdicionaisAction.request());
  }, [debouncedNome, idCategoriaValue, dispatch]); // nome ainda não é usado na API

  /* -------------------  Handlers  ------------------- */
  const clearFilters = () => {
    reset({
      nome: "",
      idCategoria: "-1",
    });
    dispatch(setIdCategoria(undefined));
    dispatch(setPagination({ limit: 20, offset: 0 }));
    dispatch(listCategoriaAdicionaisAction.request());
  };

  const changePage = (page: number) => {
    const newOffset = (page - 1) * limit;
    dispatch(setPagination({ limit, offset: newOffset }));
    dispatch(listCategoriaAdicionaisAction.request());
  };

  const handleDelete = () => {
    if (selectedAdicional) {
      dispatch(deleteCategoriaAdicionalAction.request(selectedAdicional.id));
      setDeleteDialogOpen(false);
    }
  };

  /* -------------------  TanStack Table  ------------------- */
  const columnHelper = createColumnHelper<CategoriaAdicionalResponse>();

  const columns = [
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
    columnHelper.accessor("selecao", {
      header: "Tipo de Seleção",
      cell: (info) => {
        const val = info.getValue();
        switch (val) {
          case "U":
            return "Única";
          case "M":
            return "Múltipla";
          case "Q":
            return "Quantidade";
          default:
            return val;
        }
      },
    }),
    columnHelper.display({
      id: "minmax",
      header: "Modo de escolha",
      cell: ({ row }) => {
        const adic = row.original;
        if (adic.selecao === "M" && adic.limite && adic.limite > 0) {
          return `Max.: ${adic.limite ?? "-"}`;
        } else if (adic.selecao === "M") {
          return "Sem limite";
        }
        return adic.selecao === "Q"
          ? `Mín.: ${adic.minimo ?? "-"} / Máx.: ${adic.limite ?? "-"}`
          : "Único";
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
    columnHelper.display({
      id: "opcoes",
      header: () => <span>Opções</span>,
      cell: ({ row }) => {
        const opcoes = row.original.opcoes || [];

        return opcoes.length ? (
          <Table
            dense
            className="bg-gray-50 dark:bg-zinc-800 rounded border p-2"
          >
            <TableBody>
              {opcoes.map((op) => (
                <TableRow key={op.id}>
                  <TableCell>{op.nome}</TableCell>
                  <TableCell className="text-right">
                    R$ {parseFloat(op.valor).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {op.status === 1 ? (
                      <Badge color="green">Ativo</Badge>
                    ) : (
                      <Badge color="red">Inativo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          "-"
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Ações",
      cell: (info) => (
        <Dropdown>
          <DropdownButton>
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </DropdownButton>
          <DropdownMenu>
            <DropdownItem
              onClick={() =>
                router.push(
                  `/cadastros/categorias/${idCategoria}/categoria-adicional/${info.row.original.id}`
                )
              }
            >
              Editar
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setSelectedAdicional(info.row.original);
                setDeleteDialogOpen(true);
              }}
            >
              Excluir
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      ),
    }),
  ];

  const table = useReactTable({
    data: adicionais,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* -------------------  Render Helpers  ------------------- */
  const renderPaginationItems = () => {
    const items = [];
    // Primeira
    items.push(
      <div
        key="first"
        onClick={(e) => {
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
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) items.push(<PaginationGap key="gap-start" />);
    for (let i = start; i <= end; i++) {
      items.push(
        <div
          key={i}
          onClick={(e) => {
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
    if (end < totalPages - 1 && totalPages > 1)
      items.push(<PaginationGap key="gap-end" />);
    if (totalPages > 1) {
      items.push(
        <div
          key="last"
          onClick={(e) => {
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

  /* -------------------  JSX  ------------------- */
  return (
    <div className="space-y-6 mt-5">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6">
            Adicionais por categoria
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lista de todos os adicionais disponíveis para esta categoria.
          </p>
        </div>

        {/* Componentes de busca centralizados e lado a lado */}
        <div className="mt-4 sm:mt-0 relative flex-1 mx-auto max-w-2xl flex gap-2">
          <div className="relative flex-1 ">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              {...register("nome")}
              placeholder="Pesquisar adicionais..."
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

        <div className="mt-4 sm:ml-4 sm:mt-0 sm:flex-none flex gap-2">
          <Button onClick={() => router.push("/cadastros/categorias")}>
            Voltar
          </Button>
          <Link
            href={`/cadastros/categorias/${idCategoria}/categoria-adicional/novo`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Adicionar adicional
          </Link>
        </div>
      </div>

      {/* Tabela */}
      <div>
        <Table grid>
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHeader key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHeader>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length ? (
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
                  Nenhum adicional encontrado.
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
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) changePage(currentPage - 1);
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
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) changePage(currentPage + 1);
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

      {/* Info de paginação */}
      <div className="text-sm text-zinc-500 text-center">
        Mostrando {adicionais.length} de {totalCount} resultados (Página{" "}
        {currentPage} de {totalPages})
      </div>

      {/* Dialog de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogDescription>
          Tem certeza que deseja excluir o adicional "{selectedAdicional?.nome}
          "? Esta operação não pode ser desfeita.
        </DialogDescription>
        <DialogBody>
          <p>
            ID: {selectedAdicional?.id}
            <br />
            Seq ID: {selectedAdicional?.seq_id}
          </p>
        </DialogBody>
        <DialogActions>
          <Button color="red" onClick={handleDelete}>
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

export default TableCategoriaAdicional;
