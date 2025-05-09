"use client";
import { DataTable } from "./data-table";

import { z } from "zod";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Pencil, Trash, CircleHelp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTableColumnHeader } from "@/components/my/DataTableColumnHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Loader from "@/components/my/Loader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth, User } from "@/context/auth-context";
import AlertWarningNoPermission from "@/components/my/AlertWarningNoPermission";
import { AxiosError } from "axios";

export default function ListUsuarios({
  user,
  usuarios: initial,
}: {
  user: User;
  usuarios: User[];
}) {
  if (user.admin !== 1) {
    if ((user.permission_users ?? 0) !== 1) {
      return <AlertWarningNoPermission />;
    }
  }

  const [data, setData] = useState<User[]>(initial);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function getData(): Promise<User[]> {
    try {
      setIsLoading(true);
      const responseAxios = await api.get<User[]>("/users/list");
      return responseAxios.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          return [];
        } else {
          console.error("Erro ao buscar usuários:", error);
          toast.error("Erro ao buscar usuários!");
          return [];
        }
      } else {
        console.error("Erro ao buscar usuários:", error);
        toast.error("Erro ao buscar usuários!");
        return [];
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (user: User) => {
    try {
      await api.delete(`/users/delete/${user.id}`);
      setDeleteDialogOpen(false);
      toast.success("Usuário excluído com sucesso!");
      getData().then(setData);
    } catch (error) {
      toast.error("Erro ao excluir usuário!");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "user_name",
      accessorKey: "user_name",
      header: "Username",
    },
    {
      id: "Email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      id: "Admin",
      accessorKey: "admin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Admin" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return <span>{user.admin === 1 ? "Sim" : "Não"}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const router = useRouter();
        return (
          <div className="flex gap-3">
            <Button
              onClick={() => router.push(`/cadastros/usuarios/${user.id}`)}
            >
              Editar
            </Button>
            <Button
              onClick={() => {
                setSelectedUser(user);
                setDeleteDialogOpen(true);
              }}
              variant="outline"
            >
              Excluir
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto py-9">
      <div className="flex justify-between items-center mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cadastro de Usuários</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <Button
            onClick={() => router.push("/cadastros/usuarios/new")}
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={data} setData={setData} />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Tem certeza que deseja excluir o usuário{" "}
            <span className="font-semibold">{selectedUser?.user_name}</span>?
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
              onClick={() => selectedUser && handleDelete(selectedUser)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
