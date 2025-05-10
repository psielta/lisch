import { Tabs } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { HapticTab } from "@/components/HapticTab";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Text } from "@/components/ui/text";

// Custom TabBar component for better styling
function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  // Set tab bar colors based on theme
  const tabBackgroundColor = isDark
    ? "rgba(30, 30, 30, 0.8)"
    : "rgba(255, 255, 255, 0.8)";
  const activeColor =
    Colors[colorScheme ?? "light"].tabIconSelected || "#3B82F6";
  const inactiveColor = isDark ? "#9CA3AF" : "#6B7280";
  const borderTopColor = isDark
    ? "rgba(75, 85, 99, 0.3)"
    : "rgba(229, 231, 235, 0.8)";

  return (
    <BlurView
      intensity={80}
      tint={isDark ? "dark" : "light"}
      style={{
        flexDirection: "row",
        paddingBottom: insets.bottom || 8,
        paddingTop: 10,
        borderTopWidth: 0.5,
        borderTopColor,
        backgroundColor: tabBackgroundColor,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine icon based on route name
        let iconName = "home-outline";
        if (route.name === "olders") iconName = "cart-outline";
        if (route.name === "clientes") iconName = "people-outline";

        // For focused state, remove -outline to use filled icon
        if (isFocused) {
          iconName = iconName.replace("-outline", "");
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 5,
                position: "relative",
              }}
            >
              {isFocused && (
                <View
                  style={{
                    position: "absolute",
                    top: -12,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: activeColor,
                  }}
                />
              )}
              <Ionicons
                name={iconName as any}
                size={24}
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                style={{
                  color: isFocused ? activeColor : inactiveColor,
                  fontSize: 12,
                  marginTop: 2,
                  fontWeight: isFocused ? "bold" : "normal",
                }}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:
          Colors[colorScheme ?? "light"].tabIconSelected || "#3B82F6",
        headerShown: true,
        tabBarStyle: { display: "none" }, // Hide the default tab bar
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ marginRight: 15 }}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
        ),
      }}
      tabBar={(props: any) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="olders"
        options={{
          title: "Pedidos",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
