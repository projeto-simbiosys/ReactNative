import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#04047D",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Mapa Inteligente" }}
      />

      <Stack.Screen
        name="region/[id]"
        options={{ title: "Detalhes da Região" }}
      />

      <Stack.Screen
        name="dashboard"
        options={{ title: "Dashboard c/ IA" }}
      />
    </Stack>
  );
}