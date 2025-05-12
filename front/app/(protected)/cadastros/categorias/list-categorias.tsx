"use client";

import { useState } from "react";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { User } from "@/context/auth-context";
import Link from "next/link";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/20/solid";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

export default function CategoriaTableClient({
  user,
  data,
}: {
  user: User;
  data: ICoreCategoria[];
}) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columnHelper = createColumnHelper<ICoreCategoria>();

  const columns = [
    columnHelper.accessor("nome", {
      header: "Nome",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("descricao", {
      header: "Descrição",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("ativo", {
      header: "Status",
      cell: (info) => (info.getValue() === 1 ? "Ativo" : "Inativo"),
    }),
    columnHelper.accessor("ordem", {
      header: "Ordem",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.display({
      id: "actions",
      cell: (props) => (
        <div className="text-right">
          <Link
            href={`/cadastros/categorias/edit/${props.row.original.id}`}
            className="text-primary hover:text-primary/80"
          >
            Editar<span className="sr-only">, {props.row.original.nome}</span>
          </Link>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  // Cálculo para paginação
  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  // Determinar quais números de página exibir
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Se tivermos poucas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Sempre incluir a primeira página
      pageNumbers.push(1);

      // Calcular páginas ao redor da página atual
      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);

      // Ajustar se estivermos próximos ao início ou fim
      if (currentPage <= 3) {
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      }

      // Adicionar elipses após a primeira página se necessário
      if (startPage > 2) {
        pageNumbers.push("...");
      }

      // Adicionar páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Adicionar elipses antes da última página se necessário
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Sempre incluir a última página
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6">Categorias</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lista de todas as categorias disponíveis no sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/cadastros/categorias/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Adicionar categoria
          </Link>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-border rounded-md border border-border">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-3"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={i % 2 === 1 ? "bg-muted/50" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={
                          cell.column.id === "actions"
                            ? "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3"
                            : "whitespace-nowrap px-3 py-4 text-sm text-muted-foreground"
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between border-t border-border px-4 sm:px-0 mt-4">
          <div className="-mt-px flex w-0 flex-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={`inline-flex items-center border-t-2 ${
                table.getCanPreviousPage()
                  ? "border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                  : "border-transparent text-muted-foreground/50"
              } pr-1 pt-4 text-sm font-medium`}
            >
              <ArrowLongLeftIcon
                aria-hidden="true"
                className="mr-3 h-5 w-5 text-muted-foreground"
              />
              Anterior
            </button>
          </div>

          <div className="hidden md:-mt-px md:flex">
            {pageNumbers.map((pageNumber, index) => {
              if (pageNumber === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => table.setPageIndex(Number(pageNumber) - 1)}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                  className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                    currentPage === pageNumber
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <div className="-mt-px flex w-0 flex-1 justify-end">
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={`inline-flex items-center border-t-2 ${
                table.getCanNextPage()
                  ? "border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                  : "border-transparent text-muted-foreground/50"
              } pl-1 pt-4 text-sm font-medium`}
            >
              Próximo
              <ArrowLongRightIcon
                aria-hidden="true"
                className="ml-3 h-5 w-5 text-muted-foreground"
              />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
