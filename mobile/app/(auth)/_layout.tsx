import { Stack } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function AuthLayout() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Se já estiver autenticado, redireciona para a área logada
    if (user) {
      router.replace("/(app)/home");
    }
  }, [user]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f5f5f5",
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        contentStyle: {
          backgroundColor: "#ffffff",
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
        }}
      />
    </Stack>
  );
}
