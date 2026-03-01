import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Mapa Inteligente" }}
      />

      <Stack.Screen
        name="region/[id]"
        options={{ title: "Detalhes da Região" }}
      />
    </Stack>
  );
}