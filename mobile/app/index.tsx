import { Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Index() {
  const { user } = useContext(AuthContext);

  // Redireciona para a área apropriada com base no estado de autenticação
  return user ? (
    <Redirect href="/(app)/home" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
