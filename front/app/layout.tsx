import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import { CssVarsProvider } from "@mui/material/styles"; // <- aqui
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import { ThemeProvider as NextThemes } from "@/components/my/theme-provider";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import theme from "@/src/theme";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = { title: "LISCH", description: "LISCH" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={roboto.variable} suppressHydrationWarning>
      <head>
        {/* usa a MESMA chave que o next-themes */}
        <InitColorSchemeScript
          attribute="class"
          defaultMode="light"
          modeStorageKey="theme"
        />
      </head>

      <body className="antialiased">
        <AppRouterCacheProvider>
          <CssVarsProvider
            theme={theme}
            attribute="class" // .light / .dark
            defaultMode="light"
            modeStorageKey="theme" // ≅ localStorage.key
            disableTransitionOnChange
          >
            {/* next-themes continua trocando a classe */}
            <NextThemes
              attribute="class"
              defaultTheme="light"
              enableSystem
              storageKey="theme"
              disableTransitionOnChange
            >
              <Providers>
                {children}
                <Toaster duration={1000} />
              </Providers>
            </NextThemes>
          </CssVarsProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
