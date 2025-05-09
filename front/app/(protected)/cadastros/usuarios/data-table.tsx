"use client";
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/my/DataTablePagination";
import { DataTableViewOptions } from "@/components/my/ColumnToggle";
import { PrinterIcon, Trash, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { User } from "@/context/auth-context";
import { useAuth } from "@/context/auth-context";
import { AxiosError } from "axios";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import jsPDF from "jspdf";
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setData: (data: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setData,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<Row<TData>[]>([]);
  const [loadingDelete, setLoadingDelete] = React.useState(false);
  const { user } = useAuth();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDeleteSelectedRows = async (rows: Row<TData>[]) => {
    setSelectedRows(rows);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setLoadingDelete(true);
    try {
      const errors: string[] = [];

      for (const row of selectedRows) {
        const user = row.original as User;
        try {
          await api.delete(`/users/delete/${user.id}`);
        } catch (error) {
          errors.push(user.user_name);
        }
      }

      if (errors.length > 0) {
        toast.error(`Erro ao excluir os usuários: ${errors.join(", ")}`);
      } else {
        toast.success("Usuários excluídos com sucesso!");
      }

      try {
        const response = await api.get<User[]>("/users/list");
        const newData = response.data as unknown as TData[];
        setData(newData);
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            setData([]);
          } else {
            console.error("Erro ao atualizar dados da tabela:", error);
            toast.error("Erro ao atualizar dados da tabela!");
          }
        } else {
          console.error("Erro ao atualizar dados da tabela:", error);
          toast.error("Erro ao atualizar dados da tabela!");
        }
      }

      setDeleteDialogOpen(false);
      setRowSelection({});
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div>
      <div className="flex items-center pb-4 gap-2">
        <Input
          placeholder="Filtre usuário por nome..."
          value={
            (table.getColumn("user_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("user_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button
          variant="outline"
          onClick={() => {
            table.getColumn("user_name")?.setFilterValue("");
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const doc = new jsPDF();

              // Mapeia os nomes das colunas visíveis
              const visibleColumns = table
                .getVisibleFlatColumns()
                .filter((col) => col.id !== "actions");
              const head = [
                visibleColumns.map((col) => {
                  if (col.id === "select") {
                    return "ID";
                  } else if (col.id === "user_name") {
                    return "Username";
                  } else if (col.id === "Email") {
                    return "Email";
                  } else if (col.id === "Admin") {
                    return "Admin";
                  } else {
                    const header = col.columnDef.header;
                    return typeof header === "string" ? header : "";
                  }
                }),
              ];

              // Mapeia os dados das células visíveis
              const body = table.getRowModel().rows.map((row) => {
                return row
                  .getVisibleCells()
                  .filter((cell) => cell.column.id !== "actions")
                  .map((cell) => {
                    if (cell.column.id === "select") {
                      return (row.original as User).id;
                    } else if (cell.column.id === "user_name") {
                      return (row.original as User).user_name;
                    } else if (cell.column.id === "Email") {
                      return (row.original as User).email;
                    } else if (cell.column.id === "Admin") {
                      return (row.original as User).admin === 1 ? "Sim" : "Não";
                    } else {
                      return (cell.getValue() as string).trim();
                    }
                  });
              });

              autoTable(doc, {
                head,
                body: body as any,
                theme: "grid",
                margin: { top: 20 },
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: {
                  fillColor: [41, 128, 185],
                  textColor: 255,
                  fontStyle: "bold",
                },
                didDrawPage: (data) => {
                  const pageWidth = doc.internal.pageSize.getWidth();
                  doc.setFontSize(14);
                  doc.text("Relatório de Usuários", pageWidth / 2, 14, {
                    align: "center",
                  });
                },
              });

              // Agora que todas as páginas foram criadas, pega o total...
              const pageCount = (doc.internal as any).getNumberOfPages();
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();

              // ...e adiciona o rodapé em cada uma
              for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.text(
                  `Página ${i} de ${pageCount}`,
                  pageWidth / 2,
                  pageHeight - 10,
                  { align: "center" }
                );
              }

              doc.save("usuarios.pdf");
              toast.success("PDF gerado com sucesso!");
            } catch (error) {
              console.error("Erro ao gerar PDF:", error);
              toast.error("Erro ao gerar PDF!");
            }
          }}
        >
          <PrinterIcon className="h-4 w-4" />
        </Button>
        <DataTableViewOptions table={table} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTablePagination
          table={table}
          handleDeleteSelectedRows={handleDeleteSelectedRows}
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Tem certeza que deseja excluir os usuários selecionados?
            </p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRows.map((row) => {
                    const user = row.original as User;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.user_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.admin === 1 ? "Sim" : "Não"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loadingDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
