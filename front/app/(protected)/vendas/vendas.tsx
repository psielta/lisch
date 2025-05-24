"use client";

import { User } from "@/context/auth-context";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, Menu, X, Search } from "lucide-react";

function Vendas({
  produtos,
  user,
}: {
  produtos: ProdutoResponse[];
  user: User;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-full flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-primary/10 text-primary"
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Main area */}
      <main className="flex-1 p-6 lg:pr-96">
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Área de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Selecione produtos na barra lateral para começar uma venda.
              </p>
              {/* Conteúdo principal ficará aqui no futuro */}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Sidebar for desktop */}
      <aside
        className={`
        fixed inset-y-0 right-0 w-96 border-l border-border bg-card 
        transform transition-transform duration-300 ease-in-out z-40
        ${sidebarOpen ? "translate-x-0" : "translate-x-full"} 
        lg:translate-x-0
      `}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {produtos && produtos.length > 0 ? (
                produtos
                  .filter((produto) =>
                    produto.nome
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((produto) => (
                    <div
                      key={produto.id}
                      className="px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors rounded text-sm"
                    >
                      {produto.nome}
                    </div>
                  ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          </div>

          <div className="p-3 border-t border-border">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-8 pr-3 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Vendas;
