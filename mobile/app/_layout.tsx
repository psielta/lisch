import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
import { Slot, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthContextProvider } from "../context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import { Provider as StoreProvider } from "react-redux";
import { store } from "@/rxjs/store";
import { useAppTheme } from "@/theme/theme";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      // Azul clássico Material-UI
      primary: "#1976d2",
      onPrimary: "#ffffff",
      primaryContainer: "#bbdefb",
      onPrimaryContainer: "#0d47a1",

      // Roxo padrão MUI
      secondary: "#9c27b0",
      onSecondary: "#ffffff",

      error: "#d32f2f",
      // o resto permanece do DefaultTheme
    },
  };

  return (
    <StoreProvider store={store}>
      <PaperProvider theme={theme}>
        <GluestackUIProvider mode="light">
          <StatusBar />
          <AuthContextProvider>
            <Slot />
          </AuthContextProvider>
        </GluestackUIProvider>
      </PaperProvider>
    </StoreProvider>
  );
}
