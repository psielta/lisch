"use client";

import { extendTheme } from "@mui/material/styles";
import { ptBR } from "@mui/material/locale";
import { ptBR as ptBRDataGrid } from "@mui/x-data-grid/locales";

const theme = extendTheme(
  {
    colorSchemeSelector: "class", // usa .light/.dark em vez do atributo
    colorSchemes: {
      light: {
        palette: {
          primary: {
            main: "#f97316", // shadcn primary (orange)
            light: "#fb923c", // orange-400
            dark: "#ea580c", // orange-600
            contrastText: "#ffffff", // Texto branco para o primary
          },
          secondary: {
            main: "#64748b", // shadcn muted-foreground (slate)
            light: "#94a3b8", // slate-400
            dark: "#475569", // slate-600
            contrastText: "#ffffff", // Texto branco para o secondary
          },
          error: {
            main: "#dc2626", // shadcn destructive
            light: "#ef4444", // red-500
            dark: "#b91c1c", // red-700
            contrastText: "#ffffff",
          },
          warning: {
            main: "#f59e0b", // amber-500
            light: "#fbbf24", // amber-400
            dark: "#d97706", // amber-600
            contrastText: "#ffffff",
          },
          info: {
            main: "#3b82f6", // blue-500
            light: "#60a5fa", // blue-400
            dark: "#2563eb", // blue-600
            contrastText: "#ffffff",
          },
          success: {
            main: "#10b981", // emerald-500
            light: "#34d399", // emerald-400
            dark: "#059669", // emerald-600
            contrastText: "#ffffff",
          },
          background: {
            default: "#ffffff", // shadcn background
            paper: "#ffffff", // shadcn card
          },
          text: {
            primary: "#0f0f23", // shadcn foreground
            secondary: "#64748b", // shadcn muted-foreground
            disabled: "#94a3b8", // slate-400
          },
          divider: "#e2e8f0", // shadcn border
          action: {
            hover: "rgba(248, 250, 252, 0.8)", // shadcn secondary with opacity
            selected: "rgba(249, 115, 22, 0.12)", // shadcn primary with opacity
            disabled: "#cbd5e1", // slate-300
            disabledBackground: "#f1f5f9", // slate-100
          },
        },
      },
      dark: {
        palette: {
          primary: {
            main: "#ea580c", // shadcn primary dark (orange)
            light: "#f97316", // orange-500
            dark: "#c2410c", // orange-700
            contrastText: "#ffffff", // Texto branco para o primary
          },
          secondary: {
            main: "#94a3b8", // shadcn muted-foreground dark
            light: "#cbd5e1", // slate-300
            dark: "#64748b", // slate-500
            contrastText: "#ffffff", // Texto branco para o secondary
          },
          error: {
            main: "#ef4444", // shadcn destructive dark
            light: "#f87171", // red-400
            dark: "#dc2626", // red-600
            contrastText: "#ffffff",
          },
          warning: {
            main: "#f59e0b", // amber-500
            light: "#fbbf24", // amber-400
            dark: "#d97706", // amber-600
            contrastText: "#ffffff",
          },
          info: {
            main: "#3b82f6", // blue-500
            light: "#60a5fa", // blue-400
            dark: "#2563eb", // blue-600
            contrastText: "#ffffff",
          },
          success: {
            main: "#10b981", // emerald-500
            light: "#34d399", // emerald-400
            dark: "#059669", // emerald-600
            contrastText: "#ffffff",
          },
          background: {
            default: "#0f0f23", // shadcn background dark
            paper: "#1e293b", // shadcn card dark
          },
          text: {
            primary: "#f8fafc", // shadcn foreground dark
            secondary: "#94a3b8", // shadcn muted-foreground dark
            disabled: "#64748b", // slate-500
          },
          divider: "rgba(255, 255, 255, 0.1)", // shadcn border dark
          action: {
            hover: "rgba(51, 65, 85, 0.8)", // shadcn secondary dark with opacity
            selected: "rgba(234, 88, 12, 0.12)", // shadcn primary dark with opacity
            disabled: "#475569", // slate-600
            disabledBackground: "#334155", // slate-700
          },
        },
      },
    },

    typography: {
      fontFamily: "var(--font-roboto)",
      h1: {
        fontWeight: 600,
        letterSpacing: "-0.025em",
      },
      h2: {
        fontWeight: 600,
        letterSpacing: "-0.025em",
      },
      h3: {
        fontWeight: 600,
        letterSpacing: "-0.025em",
      },
      h4: {
        fontWeight: 600,
        letterSpacing: "-0.025em",
      },
      h5: {
        fontWeight: 600,
        letterSpacing: "-0.025em",
      },
      h6: {
        fontWeight: 600,
        letterSpacing: "-0.025em",
      },
      button: {
        textTransform: "none",
        fontWeight: 500,
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.6,
      },
    },

    shape: {
      borderRadius: 12, // Equivalente ao --radius: 0.75rem do shadcn
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "*": {
            boxSizing: "border-box",
          },
          html: {
            MozOsxFontSmoothing: "grayscale",
            WebkitFontSmoothing: "antialiased",
          },
          body: {
            MozOsxFontSmoothing: "grayscale",
            WebkitFontSmoothing: "antialiased",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 500,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          },
          contained: {
            "&:hover": {
              boxShadow:
                "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            },
          },
          outlined: {
            borderWidth: 1,
            "&:hover": {
              borderWidth: 1,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow:
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            border: "1px solid",
            borderColor: "var(--mui-palette-divider)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--mui-palette-primary-main)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderWidth: 2,
                borderColor: "var(--mui-palette-primary-main)",
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            border: "1px solid",
            borderColor: "var(--mui-palette-divider)",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            border: "1px solid",
            borderColor: "var(--mui-palette-divider)",
            marginTop: 4,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow:
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            borderBottom: "1px solid",
            borderBottomColor: "var(--mui-palette-divider)",
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            borderRadius: "2px 2px 0 0",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            borderRadius: "8px 8px 0 0",
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            "& .MuiSwitch-switchBase": {
              "&.Mui-checked": {
                "& + .MuiSwitch-track": {
                  backgroundColor: "var(--mui-palette-primary-main)",
                },
              },
            },
            "& .MuiSwitch-track": {
              borderRadius: 12,
            },
            "& .MuiSwitch-thumb": {
              borderRadius: "50%",
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
    },
  },
  ptBR,
  ptBRDataGrid
);

export default theme;
