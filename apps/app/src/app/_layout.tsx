import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: "#0B0B0B" },
        headerTintColor: "#FFFFFF",
        contentStyle: { backgroundColor: "#0B0B0B" },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ title: "Your LOGD account" }} />
        <Stack.Screen name="scan" options={{ title: "Analyze a meal" }} />
        <Stack.Screen name="manual" options={{ title: "Log food manually" }} />
        <Stack.Screen name="food-search" options={{ title: "Search foods" }} />
        <Stack.Screen name="food/[id]" options={{ title: "Food details" }} />
        <Stack.Screen name="diary" options={{ title: "Food diary" }} />
      </Stack>
    </>
  );
}
