"use client";

import { extendTheme } from "@mui/material/styles";
import { red, amber, yellow } from "@mui/material/colors";
import { ptBR } from "@mui/material/locale";
import { ptBR as ptBRDataGrid } from "@mui/x-data-grid/locales";

const theme = extendTheme(
  {
    colorSchemeSelector: "class", // usa .light/.dark em vez do atributo
    colorSchemes: {
      light: {
        palette: {
          primary: {
            main: red[700],
            light: red[500],
            dark: red[900],
          },
          secondary: {
            main: amber[500],
            light: yellow[400],
            dark: amber[700],
          },
          error: {
            main: red[900],
          },
          warning: {
            main: amber[700],
          },
          background: {
            default: "#fff",
            paper: "#fff9f0",
          },
          text: {
            primary: "#212121",
            secondary: "#5f5f5f",
          },
        },
      },
      dark: {
        palette: {
          primary: {
            main: red[600],
            light: red[400],
            dark: red[800],
          },
          secondary: {
            main: amber[400],
            light: yellow[300],
            dark: amber[600],
          },
          error: {
            main: red[800],
          },
          warning: {
            main: amber[600],
          },
          background: {
            default: "#303030",
            paper: "#424242",
          },
          text: {
            primary: "#ffffff",
            secondary: "#e0e0e0",
          },
        },
      },
    },

    typography: {
      fontFamily: "var(--font-roboto)",
      h1: {
        color: red[700],
      },
      h2: {
        color: red[600],
      },
      button: {
        fontWeight: 600,
      },
    },

    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: red[700],
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
          containedPrimary: {
            "&:hover": {
              backgroundColor: red[800],
            },
          },
          containedSecondary: {
            "&:hover": {
              backgroundColor: amber[600],
            },
          },
        },
      },
    },
  },
  ptBR,
  ptBRDataGrid
);

export default theme;
