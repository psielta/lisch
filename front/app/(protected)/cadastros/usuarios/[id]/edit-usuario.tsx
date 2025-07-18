"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Loader from "@/components/my/Loader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { set, z, ZodError } from "zod";
import { useAuth, User } from "@/context/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import AlertWarningNoPermission from "@/components/my/AlertWarningNoPermission";
import {
  upsertOperadorCaixa,
  UpsertOperadorCaixaDTO,
  getOperadorCaixa,
  OperadorCaixaResponse,
} from "@/proxies/operador-caixa-proxies";

const userSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido").min(1, "ID é obrigatório"),
  tenant_id: z
    .string()
    .uuid("Tenant ID deve ser um UUID válido")
    .min(1, "Tenant ID é obrigatório"),
  user_name: z.string().min(1, "Nome de usuário é obrigatório"),
  email: z.string().email("Email deve ser um email válido"),
  bio: z.string().min(1, "Bio é obrigatória"),
  password: z
    .union([
      z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
      z.string().length(0),
    ])
    .optional(),
  admin: z.boolean(),
  permission_users: z.boolean().optional(),
  permission_categoria: z.boolean().optional(),
  permission_produto: z.boolean().optional(),
  permission_adicional: z.boolean().optional(),
  permission_cliente: z.boolean().optional(),
  // Campos do operador de caixa
  operador_caixa_ativo: z.enum(["0", "1"]),
  operador_caixa_codigo: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

function EditUsuario({
  usuario: initial,
  user,
}: {
  usuario: User;
  user: User;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operadorCaixa, setOperadorCaixa] =
    useState<OperadorCaixaResponse | null>(null);
  const { id } = useParams();

  if (user.admin !== 1) {
    if ((user.permission_users ?? 0) !== 1) {
      return <AlertWarningNoPermission />;
    }
  }

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: id as string,
      tenant_id: user.tenant_id || "",
      user_name: initial.user_name || "",
      email: initial.email || "",
      bio: initial.bio || "",
      password: "",
      admin: initial.admin === 1,
      permission_users: initial.permission_users === 1,
      permission_categoria: initial.permission_categoria === 1,
      permission_produto: initial.permission_produto === 1,
      permission_adicional: initial.permission_adicional === 1,
      permission_cliente: initial.permission_cliente === 1,
      operador_caixa_ativo: "0",
      operador_caixa_codigo: "",
    },
  });

  // Carrega os dados do operador de caixa
  useEffect(() => {
    const loadOperadorCaixa = async () => {
      try {
        setIsLoading(true);
        const operadorData = await getOperadorCaixa(id as string);
        setOperadorCaixa(operadorData);

        // Atualiza os valores do formulário com os dados do operador
        form.setValue(
          "operador_caixa_ativo",
          operadorData.ativo.toString() as "0" | "1"
        );
        form.setValue("operador_caixa_codigo", operadorData.codigo || "");
      } catch (error) {
        // Se não encontrar operador de caixa, mantém os valores padrão
        console.log("Operador de caixa não encontrado, usando valores padrão");
        setOperadorCaixa(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadOperadorCaixa();
    }
  }, [id, form]);

  const onSubmit = async (data: UserForm) => {
    setIsSaving(true);
    try {
      // Primeiro, atualiza o usuário
      let endpoint = "/users/put";
      if (!data.password || data.password === "") {
        endpoint = "/users/putnopassword";
      }

      const response = await api.put(`${endpoint}/${id}`, {
        ...data,
        // Converte boolean para inteiro (conforme banco de dados)
        admin: data.admin ? 1 : 0,
        permission_users: data.permission_users ? 1 : 0,
        permission_categoria: data.permission_categoria ? 1 : 0,
        permission_produto: data.permission_produto ? 1 : 0,
        permission_adicional: data.permission_adicional ? 1 : 0,
        permission_cliente: data.permission_cliente ? 1 : 0,
      });

      if (response.status === 200) {
        // Depois, atualiza o operador de caixa
        const operadorCaixaData: UpsertOperadorCaixaDTO = {
          tenant_id: data.tenant_id,
          id_usuario: data.id,
          nome: data.user_name,
          codigo: data.operador_caixa_codigo || null,
          ativo: parseInt(data.operador_caixa_ativo),
        };

        await upsertOperadorCaixa(operadorCaixaData);

        toast.success("Usuário e operador de caixa atualizados com sucesso.");
        router.push("/cadastros/usuarios");
      } else {
        toast.error(response.data?.error || "Erro ao atualizar usuário.");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.error || "Erro ao atualizar usuário."
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else if (error instanceof ZodError) {
        toast.error(error.message);
      } else {
        console.error("Erro ao atualizar usuário:", error);
        toast.error("Erro ao atualizar usuário.");
      }
    } finally {
      setIsSaving(false);
    }
  };

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
              <BreadcrumbLink href="/cadastros/usuarios">
                Cadastro de Usuários
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {form.getValues("user_name") || ""}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <Button
            onClick={() => router.push("/cadastros/usuarios")}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      <Card className="shadow-md bg-card">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-semibold">
            Editar Usuário
          </CardTitle>
          <CardDescription>
            Altere os dados do usuário conforme necessário.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {/* Campos ocultos */}
              <input type="hidden" {...form.register("id")} />
              <input type="hidden" {...form.register("tenant_id")} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome de usuário */}
                <FormField
                  control={form.control}
                  name="user_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de usuário</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome de usuário"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@exemplo.com"
                          type="email"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações sobre o usuário"
                        className="h-24 resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Senha */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Deixe em branco para manter a senha atual"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Mínimo de 8 caracteres. Deixe em branco para manter a
                      senha atual.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />
              <h3 className="text-lg font-medium mb-2">Permissões</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "admin",
                    label: "Administrador",
                    description: "Permite gerenciar todos os dados.",
                  },
                  {
                    name: "permission_users",
                    label: "Usuários",
                    description: "Permite gerenciar usuários.",
                  },
                  {
                    name: "permission_categoria",
                    label: "Categoria",
                    description: "Permite gerenciar categorias.",
                  },
                  {
                    name: "permission_produto",
                    label: "Produto",
                    description: "Permite gerenciar produtos.",
                  },
                  {
                    name: "permission_adicional",
                    label: "Adicional",
                    description: "Permite gerenciar adicionais.",
                  },
                  {
                    name: "permission_cliente",
                    label: "Cliente",
                    description: "Permite gerenciar clientes.",
                  },
                ].map((permission) => (
                  <FormField
                    key={permission.name}
                    control={form.control}
                    name={permission.name as any}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{permission.label}</FormLabel>
                          <FormDescription>
                            {permission.description}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Separator className="my-4" />
              <h3 className="text-lg font-medium mb-4">Operador de Caixa</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Ativo */}
                <FormField
                  control={form.control}
                  name="operador_caixa_ativo"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="ativo-sim" />
                            <FormLabel htmlFor="ativo-sim">Ativo</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="0" id="ativo-nao" />
                            <FormLabel htmlFor="ativo-nao">Inativo</FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Define se o usuário pode operar o caixa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Código do Operador */}
                <FormField
                  control={form.control}
                  name="operador_caixa_codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do Operador</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o código do operador"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Código único para identificação no caixa (opcional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4" />
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 border-t pt-6 mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/cadastros/usuarios")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-1" />
                Salvar Alterações
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default EditUsuario;
