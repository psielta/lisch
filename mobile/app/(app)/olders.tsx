import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

export default function PedidosScreen() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-100 dark:bg-gray-900">
        {/* Header */}
        <View className="flex-row mb-3 justify-between items-center px-4 pt-9 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-24">
          <Text className="text-xl font-bold dark:text-white">Pedidos</Text>
          <Pressable
            onPress={() => {}}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Ionicons name="refresh-outline" size={24} />
          </Pressable>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
        ></ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
