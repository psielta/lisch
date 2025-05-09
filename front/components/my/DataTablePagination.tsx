import { Row, Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface AcoesEmLoteOptionsAndHandlers<TData> {
  options: {
    label: string;
    icon: React.ReactNode;
    onClick: (rows: Row<TData>[]) => void;
  }[];
}

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  handleDeleteSelectedRows?: (rows: Row<TData>[]) => void;
  acoesEmLoteOptionsAndHandlers?: AcoesEmLoteOptionsAndHandlers<TData>;
}

export function DataTablePagination<TData>({
  table,
  handleDeleteSelectedRows,
  acoesEmLoteOptionsAndHandlers,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 w-full">
      <div className="flex-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
          </span>
          {handleDeleteSelectedRows &&
            table.getFilteredSelectedRowModel().rows.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer" asChild>
                  <Button variant="outline">Ações em lote</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      handleDeleteSelectedRows(
                        table.getFilteredSelectedRowModel().rows
                      )
                    }
                    className="cursor-pointer"
                  >
                    <Trash className="h-4 w-4" /> Excluir selecionados
                  </DropdownMenuItem>
                  {acoesEmLoteOptionsAndHandlers?.options.map((option) => (
                    <DropdownMenuItem
                      key={option.label}
                      onClick={() =>
                        option.onClick(table.getFilteredSelectedRowModel().rows)
                      }
                      className="cursor-pointer"
                    >
                      {option.icon} {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </div>

      <div className="flex-1" />
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Linhas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              table.setRowSelection({});
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir para a primeira página</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir para a página anterior</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir para a próxima página</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir para a última página</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
