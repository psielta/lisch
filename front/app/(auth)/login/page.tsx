"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Manrope, Lexend, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import Loader from "@/components/my/Loader";
import { Loader2 } from "lucide-react";
import LoaderForButton from "@/components/my/LoaderForButton";
import { Button, Typography } from "@mui/material";
import LightLogo from "@/public/Light.png";
import DarkLogo from "@/public/Dark.png";

const fontSans = Lexend({ subsets: ["latin"], variable: "--font-sans" });
const fontSerif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });
const fontManrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const schema = z.object({
  email: z.string().email("E‑mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await login(data);
    } catch (error) {
      console.log(error);
      toast.error("Usuário ou senha inválidos");
    }
  }

  return (
    <div
      className={cn(
        "bg-muted dark:bg-background flex flex-1 flex-col items-center justify-center gap-16 p-6 md:p-10 h-screen",
        fontSans.variable,
        fontSerif.variable,
        fontManrope.variable
      )}
    >
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center gap-2">
                    {/* <Image
                      src={DarkLogo}
                      alt="Logo"
                      width={240}
                      height={240}
                      className="hidden dark:block"
                    />
                    <Image
                      src={LightLogo}
                      alt="Logo"
                      width={240}
                      height={240}
                      className="block dark:hidden"
                    /> */}
                    <div>
                      <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
                      <p className="text-muted-foreground text-balance">
                        Faça login na sua conta
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemplo@email.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" variant="contained">
                    {isSubmitting ? <LoaderForButton /> : "Entrar"}
                  </Button>
                </div>
              </form>
              <div className="bg-gradient-to-tl from-primary to-primary/50 dark:from-slate-700/50 dark:to-primary/100 relative md:block"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
