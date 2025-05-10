// theme.ts
import {
  MD3LightTheme as PaperLight,
  MD3DarkTheme as PaperDark,
} from "react-native-paper";
import { useColorScheme } from "react-native";

// --- Paleta MUI ---
const mui = {
  primary: "#1976d2",
  primaryContainer: "#bbdefb", // azul-100 ≈ papel claro
  onPrimary: "#ffffff",
  secondary: "#9c27b0",
  secondaryContainer: "#f3e5f5",
  onSecondary: "#ffffff",
  error: "#d32f2f",
  onError: "#ffffff",
  background: "#fafafa",
  onBackground: "rgba(0,0,0,0.87)",
  surface: "#ffffff",
  onSurface: "rgba(0,0,0,0.87)",
  outline: "rgba(0,0,0,0.12)",
};

// Light - MD3
export const lightTheme = {
  ...PaperLight,
  colors: { ...PaperLight.colors, ...mui },
};

// Dark opcional (toma só primary; resto o Paper resolve)
export const darkTheme = {
  ...PaperDark,
  colors: {
    ...PaperDark.colors,
    primary: mui.primary,
    secondary: mui.secondary,
    error: mui.error,
  },
};

// Gancho que troca automático com o tema do SO
export function useAppTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
