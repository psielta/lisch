import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { useToast } from "@/components/ui/toast";
import { ScrollView } from "react-native";

const COLS = [
  { key: "nome", label: "Nome" },
  { key: "endereco", label: "Endereço" },
  { key: "bairro", label: "Bairro" },
  { key: "numero", label: "Nº" },
  { key: "cidade_nome", label: "Cidade" },
];

export default function HomeScreen() {
  const { user } = useContext(AuthContext);

  const toast = useToast();

  return (
    <ScrollView className="flex-1 bg-gray-100 dark:bg-gray-900">
      {/* Cabeçalho */}
      <Box className="px-6 pt-6">
        <VStack space="md">
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Bem-vindo, {user?.user_name}
          </Text>
          <VStack space="xs">
            <Text className="text-gray-700 dark:text-gray-300">
              Email: {user?.email}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300">
              Bio: {user?.bio}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              Membro desde:{" "}
              {new Date(user?.created_at || "").toLocaleDateString("pt-BR")}
            </Text>
          </VStack>
        </VStack>
      </Box>
    </ScrollView>
  );
}
