"use client";

import { User } from "@/context/auth-context";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Package, Menu, X } from "lucide-react";

function Vendas({
  produtos,
  user,
}: {
  produtos: ProdutoResponse[];
  user: User;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {produtos && produtos.length > 0 ? (
                produtos.map((produto) => (
                  <Card
                    key={produto.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{produto.nome}</h3>
                          {produto.precos && produto.precos.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              R${" "}
                              {parseFloat(produto.precos[0].preco_base).toFixed(
                                2
                              )}
                            </p>
                          )}
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {produto.status === 1 ? "Disponível" : "Indisponível"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>
    </div>
  );
}

export default Vendas;
