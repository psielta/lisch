// app/gerenciar-vendas/layout.tsx
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/my/app-sidebar";
import Header from "@/components/my/Header";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    // 0) Provider **fora** do contêiner flex, para não criar wrapper extra
    <SidebarProvider>
      {/* 1) único FLEX-ROW cobrindo o viewport inteiro */}
      <div className="flex min-h-screen w-full">
        {/* 2) Drawer permanente — largura fixa ou 72 px recolhido */}
        <AppSidebar />

        {/* 3) Conteúdo: cresce e encolhe → flex-1  +  min-w-0 */}
        <main className="flex flex-col flex-1 min-w-0">
          {/* <Header /> */}
          {/* 4) wrapper scrollável do seu DataGrid / páginas */}
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
