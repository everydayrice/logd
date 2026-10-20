import { useCallback, useEffect, useState } from "react";
import { Link } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../lib/auth-client";
import { apiRequest, type Meal, type Nutrition } from "../lib/api";
import { common, palette } from "../ui/styles";

export default function DiaryScreen() {
  const { data: session, isPending } = authClient.useSession();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<{ meals: Meal[] }>("/v1/meals");
      setMeals(data.meals);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your diary.");
    } finally { setLoading(false); }
  }, [session?.user?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const today = new Date().toDateString();
  const todayMeals = meals.filter(m => new Date(m.loggedAt).toDateString() === today);
  const nutritionTotal = (key: keyof Nutrition) =>
    Math.round(todayMeals.reduce((sum, meal) => sum + meal.total[key], 0));

  return (
    <SafeAreaView style={common.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={common.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor="#FFFFFF" />}>
        <Text style={common.label}>YOUR NUTRITION</Text>
        <Text style={[common.title, { marginTop: 12 }]}>Food diary.</Text>
        <Text style={[common.body, { marginTop: 7, marginBottom: 24 }]}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </Text>

        {isPending ? <ActivityIndicator color="#FFFFFF" /> : !session?.user ? (
          <View style={[common.card, { gap: 15 }]}>
            <Text style={common.body}>Sign in to see meals saved across your devices.</Text>
            <Link href="/account" asChild>
              <Pressable style={common.primaryButton}><Text style={common.primaryText}>Sign in or create account</Text></Pressable>
            </Link>
          </View>
        ) : (
          <>
            <View style={[common.card, { marginBottom: 22 }]}>
              <Text style={common.label}>TODAY'S TOTAL</Text>
              <Text style={{ color: palette.primary, fontSize: 49, fontWeight: "800", letterSpacing: -2, marginTop: 12 }}>
                {nutritionTotal("calories")} <Text style={{ fontSize: 15, fontWeight: "500", color: palette.muted }}>cal</Text>
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 17 }}>
                {([
                  ["Protein", "proteinG"],
                  ["Carbs", "totalCarbohydratesG"],
                  ["Fat", "totalFatG"],
                ] as const).map(([label, key]) => (
                  <View key={key}><Text style={common.label}>{label}</Text>
                    <Text style={{ color: palette.primary, fontWeight: "700", fontSize: 18, marginTop: 6 }}>
                      {nutritionTotal(key)}g
                    </Text></View>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <Link href="/scan" asChild>
                <Pressable style={[common.primaryButton, { flex: 1 }]}>
                  <Text style={common.primaryText}>+ Photo</Text>
                </Pressable>
              </Link>
              <Link href="/manual" asChild>
                <Pressable style={[common.secondaryButton, { flex: 1 }]}>
                  <Text style={common.secondaryText}>+ Manual</Text>
                </Pressable>
              </Link>
            </View>

            <Text style={[common.label, { marginBottom: 14 }]}>RECENT MEALS</Text>
            {!!error && <Text style={[common.error, { marginBottom: 15 }]}>{error}</Text>}
            {!meals.length && !loading && !error && (
              <Text style={common.body}>Nothing LOGD yet. Add your first meal above.</Text>
            )}
            {meals.map(meal => (
              <View key={meal.id} style={[common.card, { marginBottom: 12 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: palette.primary, fontWeight: "800", fontSize: 15, textTransform: "capitalize" }}>
                    {meal.kind}
                  </Text>
                  <Text style={{ color: palette.muted, fontSize: 12 }}>
                    {new Date(meal.loggedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={{ color: palette.primary, fontSize: 23, fontWeight: "800", marginTop: 10 }}>
                  {Math.round(meal.total.calories)} cal
                </Text>
                {meal.items.map(item => (
                  <Text key={item.id} style={{ color: palette.soft, marginTop: 8, fontSize: 14 }}>
                    {item.displayName} · {Math.round(Number(item.gramsEaten))}g
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
