import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0B0B0B" },
          headerTintColor: "#FFFFFF",
          contentStyle: { backgroundColor: "#0B0B0B" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: "Add a photo" }} />
        <Stack.Screen name="diary" options={{ title: "Food diary" }} />
      </Stack>
    </>
  );
}
