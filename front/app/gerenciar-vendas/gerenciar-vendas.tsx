"use client";

import { CategoriaAdicionalResponse } from "@/rxjs/adicionais/categoria-adicional.model";
import { ICoreCategoria } from "@/rxjs/categoria/categoria.model";
import { ProdutoResponse } from "@/rxjs/produto/produto.model";
import { PedidoResponse } from "@/rxjs/pedido/pedido.model";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
} from "@mui/material";

export default function GerenciarVendas({
  pedidos,
  produtos,
  categorias,
  adicionais,
}: {
  pedidos: PedidoResponse[];
  produtos: ProdutoResponse[];
  categorias: ICoreCategoria[];
  adicionais: CategoriaAdicionalResponse[];
}) {
  const theme = useTheme();
  return (
    <div className="flex min-h-screen h-screen w-full">
      {/* 3 column wrapper */}
      <div className="w-full h-full grow lg:flex">
        {/* Left sidebar & main wrapper */}
        <div className="flex-1 h-full xl:flex">
          <div className="h-full flex flex-col border-b border-border px-4 py-6 sm:px-6 lg:pl-8 xl:w-64 xl:shrink-0 xl:border-r xl:border-b-0 xl:pl-6 bg-card">
            <div className="border-b border-border">
              <h2 className="text-lg font-semibold mb-4 text-start text-foreground">
                Pedidos em aberto
              </h2>
            </div>

            <List sx={{ padding: 0, flex: 1 }}>
              {pedidos.map((pedido) => (
                <ListItem key={pedido.id} disablePadding>
                  <ListItemButton
                    sx={{
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      padding: "12px 16px",
                      color:
                        pedido.tipo_entrega === "Delivery"
                          ? theme.palette.primary.main
                          : pedido.tipo_entrega === "Balcão"
                          ? theme.palette.secondary.main
                          : pedido.tipo_entrega === "Retirada"
                          ? theme.palette.success.main
                          : theme.palette.text.primary,
                      borderRadius: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <ListItemText
                      primary={`Pedido #${pedido.codigo_pedido}`}
                      primaryTypographyProps={{
                        fontSize: "16px",
                        textAlign: "center",
                        fontWeight: 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <div className="mt-4 space-y-2 text-sm border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary"></div>
                <span className="text-foreground">Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-zinc-500"></div>
                <span className="text-foreground">Balcão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-foreground">Retirada</span>
              </div>
            </div>
          </div>

          <div className="h-full px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 bg-card">
            {/* Main area */}
          </div>
        </div>

        <div className="h-full shrink-0 border-t border-border px-4 py-6 sm:px-6 lg:w-96 lg:border-t-0 lg:border-l lg:pr-8 xl:pr-6 bg-card">
          {/* Right column area */}
        </div>
      </div>
    </div>
  );
}
