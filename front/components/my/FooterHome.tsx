"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMe, User } from "@/proxies/users/GetMe";
import { getWeatherForecast } from "@/proxies/report/GetWeatherForecast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import api from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveAs } from "file-saver";
import { Separator } from "../ui/separator";

const uploadSchema = z.object({
  file: z.custom<FileList>((val) => val instanceof FileList),
});
type UploadForm = z.infer<typeof uploadSchema>;

export function FooterHome() {
  const [userData, setUserData] = useState<User | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadResponseData, setUploadResponseData] = useState<any>(null);
  const [showUploadResponse, setShowUploadResponse] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
  });

  const handleTestApi = async () => {
    try {
      const data = await getMe();
      toast.success("Conexão com API realizada com sucesso!");
      setUserData(data);
      setShowUserDialog(true);
    } catch (err) {
      toast.error("Erro ao conectar com API!");
    }
  };

  // *** NOVOS HANDLERS ***
  const handleDownloadReport = async () => {
    try {
      const blob = await getWeatherForecast();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "WeatherForecast.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Relatório baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao baixar relatório:", err);
      toast.error("Erro ao baixar relatório!");
    }
  };

  const handleOpenReport = async () => {
    try {
      const blob = await getWeatherForecast();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      // opcional: revogar depois de um tempo
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("Relatório aberto com sucesso!");
    } catch (err) {
      console.error("Erro ao abrir relatório:", err);
      toast.error("Erro ao abrir relatório!");
    }
  };

  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const response = await api.get(endpoint, { responseType: "blob" });
      saveAs(response.data, filename);
      toast.success("Arquivo baixado com sucesso!");
    } catch {
      toast.error("Erro ao baixar arquivo");
    }
  };

  const onUploadSubmit = async (data: UploadForm) => {
    const fileList = data.file;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await api.post(
        "/excelize/test/UploadAndReadSpreadsheet",
        formData
      );
      setUploadResponseData(resp.data);
      setUploadDialogOpen(false);
      setShowUploadResponse(true);
      toast.success("Upload realizado com sucesso!");
    } catch {
      toast.error("Erro no upload de arquivo");
    }
  };

  return (
    <footer
      className={cn(
        "w-full mt-auto flex h-14 items-center justify-center border-t bg-background/95 backdrop-blur-sm transition-all"
      )}
    >
      São Sebastião do Paraíso, Minas Gerais
      <div className="flex items-center gap-4 hidden">
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload de Spreadsheet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onUploadSubmit)} className="space-y-4">
              <input
                type="file"
                {...register("file")}
                className="block w-full text-sm text-zinc-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-zinc-50 file:text-zinc-700
                  hover:file:bg-zinc-100
                  dark:file:bg-zinc-800 dark:file:text-zinc-200
                  dark:hover:file:bg-zinc-700"
              />
              {errors.file && (
                <span className="text-red-600">Arquivo é obrigatório</span>
              )}
              <div className="flex justify-end">
                <Button type="submit" className="mt-2">
                  Enviar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={showUploadResponse} onOpenChange={setShowUploadResponse}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dados da Planilha</DialogTitle>
            </DialogHeader>
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {uploadResponseData
                  ? JSON.stringify(uploadResponseData, null, 2)
                  : "Nenhum dado disponível"}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Health Check</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleDownloadReport}>
              Download Relatório
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleOpenReport}>
              Abrir Relatório
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleTestApi}>
              Teste de API
            </DropdownMenuItem>
            <Separator className="my-1" />
            <DropdownMenuItem
              onSelect={() =>
                handleExport("/excelize/test/CreateSpreadsheet", "weather.xlsx")
              }
            >
              Criar planilha
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                handleExport("/excelize/test/ChartSpreadsheet", "chart.xlsx")
              }
            >
              Gráfico excel
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                handleExport(
                  "/excelize/test/PictureSpreadsheet",
                  "picture.xlsx"
                )
              }
            >
              Imagem excel
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setUploadDialogOpen(true)}>
              Upload excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold mb-4">
                Dados do Usuário
              </DialogTitle>
            </DialogHeader>
            {userData && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">ID</TableCell>
                    <TableCell>{userData.id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Nome</TableCell>
                    <TableCell>{userData.user_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Email</TableCell>
                    <TableCell>{userData.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bio</TableCell>
                    <TableCell>{userData.bio}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Criado em</TableCell>
                    <TableCell>
                      {new Date(userData.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Atualizado em</TableCell>
                    <TableCell>
                      {new Date(userData.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
}
