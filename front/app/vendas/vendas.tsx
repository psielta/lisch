"use client";

import { User } from "@/context/auth-context";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, Menu, X, Search } from "lucide-react";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import { PedidoResponse } from "@/rxjs/pedido/pedido.model";
function Vendas({
  produtos,
  user,
  categorias,
  adicionais,
  pedido,
}: {
  produtos: ProdutoResponse[];
  user: User;
  categorias: ICoreCategoria[];
  adicionais: CategoriaAdicionalResponse[];
  pedido: PedidoResponse | null | undefined;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProdutos =
    produtos?.filter((produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

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
      <main className="flex-1 m-3 lg:pr-96">
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
              <main>
                <pre>{JSON.stringify(pedido, null, 2)}</pre>
              </main>
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
            {produtos && produtos.length > 0 ? (
              filteredProdutos.length > 0 ? (
                <List sx={{ padding: 0 }}>
                  {filteredProdutos.map((produto) => (
                    <ListItem key={produto.id} disablePadding>
                      <ListItemButton
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                          padding: "12px 16px",
                        }}
                      >
                        <ListItemText
                          primary={produto.nome}
                          primaryTypographyProps={{
                            fontSize: "14px",
                            fontWeight: 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "200px",
                    padding: "40px 0",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                  >
                    Nenhum produto encontrado
                  </Typography>
                </Box>
              )
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                  padding: "40px 0",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  Nenhum produto encontrado
                </Typography>
              </Box>
            )}
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
