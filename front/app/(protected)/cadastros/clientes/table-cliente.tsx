"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  PaginatedResponse,
  ClienteResponse,
} from "@/rxjs/clientes/cliente.model";
import { User } from "@/context/auth-context";
import {
  selectClienteState,
  selectlistClienteActionState,
  selectremoveClienteByIdActionState,
  initializeClienteState,
  setFiltroNome,
  setFiltroFantasia,
  setFiltroCpf,
  setFiltroCnpj,
  setPage,
  setLimit,
  setSort,
  setOrder,
} from "@/rxjs/clientes/cliente.slice";
import {
  listClienteAction,
  removeClienteByIdAction,
} from "@/rxjs/clientes/cliente.action";
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
import { useAppDispatch } from "@/rxjs/hooks";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Badge } from "@/components/catalyst-ui-kit/badge";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import Link from "next/link";

interface FilterForm {
  nome: string;
  fantasia: string;
  cpf: string;
  cnpj: string;
}

function TableCliente({
  data,
  user,
}: {
  data: PaginatedResponse<ClienteResponse>;
  user: User;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Estados locais
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] =
    useState<ClienteResponse | null>(null);

  // Selectors do Redux
  const clienteState = useSelector(selectClienteState);
  const clientes = clienteState.clientes;
  const removeActionState = useSelector(selectremoveClienteByIdActionState);
  const listActionState = useSelector(selectlistClienteActionState);

  // React Hook Form setup
  const { register, handleSubmit, watch, reset } = useForm<FilterForm>({
    defaultValues: {
      nome: "",
      fantasia: "",
      cpf: "",
      cnpj: "",
    },
  });

  // Watch form values
  const nomeValue = watch("nome");
  const fantasiaValue = watch("fantasia");
  const cpfValue = watch("cpf");
  const cnpjValue = watch("cnpj");

  // Debounce filters to reduce dispatch frequency
  const [debouncedNome] = useDebounce(nomeValue, 500);
  const [debouncedFantasia] = useDebounce(fantasiaValue, 500);
  const [debouncedCpf] = useDebounce(cpfValue, 500);
  const [debouncedCnpj] = useDebounce(cnpjValue, 500);

  // Inicialização do estado com os dados do servidor
  useEffect(() => {
    dispatch(
      initializeClienteState({
        clientes: data,
        listClienteActionState: null,
        removeClienteByIdActionState: null,
        postOrPutClienteActionState: null,
        getClienteByIdActionState: null,
        filtroNome: null,
        filtroFantasia: null,
        filtroCpf: null,
        filtroCnpj: null,
        page: data.current_page,
        limit: data.page_size,
        sort: "nome",
        order: "asc",
      })
    );
  }, [data, dispatch]);

  // Efeito para atualizar a listagem após exclusão
  useEffect(() => {
    if (removeActionState === "completed") {
      dispatch(listClienteAction.request());
    }
  }, [removeActionState, dispatch]);

  // Efeito para aplicar filtros debounced
  useEffect(() => {
    dispatch(setPage(1)); // Volta para a primeira página ao filtrar
    dispatch(setFiltroNome(debouncedNome || null));
    dispatch(setFiltroFantasia(debouncedFantasia || null));
    dispatch(setFiltroCpf(debouncedCpf || null));
    dispatch(setFiltroCnpj(debouncedCnpj || null));
    dispatch(listClienteAction.request());
  }, [debouncedNome, debouncedFantasia, debouncedCpf, debouncedCnpj, dispatch]);

  // Limpar filtros
  const clearFilters = () => {
    reset({
      nome: "",
      fantasia: "",
      cpf: "",
      cnpj: "",
    });
    dispatch(setFiltroNome(null));
    dispatch(setFiltroFantasia(null));
    dispatch(setFiltroCpf(null));
    dispatch(setFiltroCnpj(null));
    dispatch(setPage(1));
    dispatch(setLimit(10));
    dispatch(listClienteAction.request());
  };

  // Mudar de página
  const changePage = (page: number) => {
    dispatch(setPage(page));
    dispatch(listClienteAction.request());
  };

  // Handler para exclusão de cliente
  const handleDeleteCliente = () => {
    if (selectedCliente) {
      dispatch(removeClienteByIdAction.request(selectedCliente.id));
      setDeleteDialogOpen(false);
    }
  };

  // Formatar CPF
  const formatCPF = (cpf: string) => {
    if (!cpf) return "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Formatar CNPJ
  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return "-";
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  };

  // Definição das colunas da tabela usando TanStack Table
  const columnHelper = createColumnHelper<ClienteResponse>();

  const columns = [
    columnHelper.accessor("nome_razao_social", {
      header: "Nome/Razão Social",
      cell: (info) => (
        <div className="whitespace-normal font-medium">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("nome_fantasia", {
      header: "Nome Fantasia",
      cell: (info) => (
        <div className="whitespace-normal">{info.getValue() || "-"}</div>
      ),
    }),
    columnHelper.accessor("tipo_pessoa", {
      header: "Tipo",
      cell: (info) => (
        <Badge color={info.getValue() === "F" ? "blue" : "purple"}>
          {info.getValue() === "F" ? "Física" : "Jurídica"}
        </Badge>
      ),
    }),
    columnHelper.accessor("cpf", {
      header: "CPF",
      cell: (info) => formatCPF(info.getValue()),
    }),
    columnHelper.accessor("cnpj", {
      header: "CNPJ",
      cell: (info) => formatCNPJ(info.getValue()),
    }),
    columnHelper.accessor("email", {
      header: "E-mail",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("telefone", {
      header: "Telefone",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("cidade", {
      header: "Cidade",
      cell: (info) => {
        const cidade = info.getValue();
        const uf = info.row.original.uf;
        return cidade && uf ? `${cidade}/${uf}` : cidade || uf || "-";
      },
    }),
    columnHelper.accessor("created_at", {
      header: "Criado em",
      cell: (info) => format(new Date(info.getValue()), "dd/MM/yyyy"),
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
                router.push(`/cadastros/clientes/${info.row.original.id}`)
              }
            >
              Editar
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                setSelectedCliente(info.row.original);
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

  // Inicialização da tabela
  const table = useReactTable({
    data: clientes.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Renderização de paginação com números de página
  const renderPaginationItems = () => {
    let items = [];
    const currentPage = clientes.current_page;
    const totalPages = clientes.total_pages;

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
          <h1 className="text-base font-semibold leading-6">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lista de todos os clientes cadastrados no sistema.
          </p>
        </div>

        <div className="mt-4 sm:ml-4 sm:mt-0 sm:flex-none">
          <Link
            href="/cadastros/clientes/novo"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Adicionar cliente
          </Link>
        </div>
      </div>

      {/* Filtros de busca */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            {...register("nome")}
            placeholder="Buscar por nome..."
            className="block w-full rounded-md border border-border bg-background py-2 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <input
            type="text"
            {...register("fantasia")}
            placeholder="Buscar por fantasia..."
            className="block w-full rounded-md border border-border bg-background py-2 pl-3 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <input
            type="text"
            {...register("cpf")}
            placeholder="Buscar por CPF..."
            className="block w-full rounded-md border border-border bg-background py-2 pl-3 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            {...register("cnpj")}
            placeholder="Buscar por CNPJ..."
            className="flex-1 rounded-md border border-border bg-background py-2 pl-3 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <Button outline onClick={clearFilters} className="whitespace-nowrap">
            Limpar
          </Button>
        </div>
      </div>

      {/* Tabela de Clientes */}
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
                  {listActionState === "pending"
                    ? "Carregando..."
                    : "Nenhum cliente encontrado."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {clientes.total_pages > 0 && (
        <Pagination className="justify-center">
          <div
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (clientes.current_page > 1) {
                changePage(clientes.current_page - 1);
              }
            }}
            className="inline-flex"
          >
            <PaginationPrevious
              children="Anterior"
              href={clientes.current_page > 1 ? "#" : null}
            />
          </div>
          <PaginationList>{renderPaginationItems()}</PaginationList>
          <div
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (clientes.current_page < clientes.total_pages) {
                changePage(clientes.current_page + 1);
              }
            }}
            className="inline-flex"
          >
            <PaginationNext
              children="Próximo"
              href={clientes.current_page < clientes.total_pages ? "#" : null}
            />
          </div>
        </Pagination>
      )}

      {/* Informações de paginação */}
      <div className="text-sm text-zinc-500 text-center">
        Mostrando {clientes.items ? clientes.items.length : 0} de{" "}
        {clientes.total_count} resultados ( Página {clientes.current_page} de{" "}
        {clientes.total_pages})
      </div>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogDescription>
          Tem certeza que deseja excluir o cliente "
          {selectedCliente?.nome_razao_social}"? Esta ação não pode ser
          desfeita.
        </DialogDescription>
        <DialogBody>
          <p>
            ID: {selectedCliente?.id}
            <br />
            Tipo:{" "}
            {selectedCliente?.tipo_pessoa === "F"
              ? "Pessoa Física"
              : "Pessoa Jurídica"}
            <br />
            {selectedCliente?.tipo_pessoa === "F"
              ? `CPF: ${formatCPF(selectedCliente?.cpf || "")}`
              : `CNPJ: ${formatCNPJ(selectedCliente?.cnpj || "")}`}
          </p>
        </DialogBody>
        <DialogActions>
          <Button
            color="red"
            onClick={handleDeleteCliente}
            disabled={removeActionState === "pending"}
          >
            {removeActionState === "pending" ? "Excluindo..." : "Excluir"}
          </Button>
          <Button outline onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default TableCliente;
