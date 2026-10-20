import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest, type Food, type MealKind, type Nutrition } from "../../lib/api";
import { common, palette } from "../../ui/styles";

type FoodDetails = Food & {
  createdAt: string;
  updatedAt: string;
  useCount: number;
  attributedTo: string | null;
  createdByUserId: string | null;
  remixedFromFoodId: string | null;
  servings: Array<{ name: string; grams: number }>;
};
const fields: Array<[string, keyof Nutrition, string]> = [
  ["Calories", "calories", "cal"],
  ["Total fat", "totalFatG", "g"],
  ["Saturated fat", "saturatedFatG", "g"],
  ["Polyunsaturated fat", "polyunsaturatedFatG", "g"],
  ["Monounsaturated fat", "monounsaturatedFatG", "g"],
  ["Trans fat", "transFatG", "g"],
  ["Cholesterol", "cholesterolMg", "mg"],
  ["Sodium", "sodiumMg", "mg"],
  ["Potassium", "potassiumMg", "mg"],
  ["Total carbohydrates", "totalCarbohydratesG", "g"],
  ["Dietary fiber", "dietaryFiberG", "g"],
  ["Sugars", "sugarsG", "g"],
  ["Added sugars", "addedSugarsG", "g"],
  ["Sugar alcohols", "sugarAlcoholsG", "g"],
  ["Net carbs", "netCarbsG", "g"],
  ["Protein", "proteinG", "g"],
  ["Vitamin A", "vitaminAPct", "%"],
  ["Vitamin C", "vitaminCPct", "%"],
  ["Calcium", "calciumPct", "%"],
  ["Iron", "ironPct", "%"],
  ["Vitamin D", "vitaminDPct", "%"],
];
const kinds: MealKind[] = ["breakfast", "lunch", "dinner", "snack"];

export default function FoodDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [food, setFood] = useState<FoodDetails | null>(null);
  const [grams, setGrams] = useState("100");
  const [kind, setKind] = useState<MealKind>("lunch");
  const [advanced, setAdvanced] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("incorrect_nutrition");
  const [reportDetails, setReportDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    apiRequest<{ food: FoodDetails }>("/v1/foods/" + encodeURIComponent(id))
      .then(result => {
        if (!active) return;
        setFood(result.food);
        setGrams(result.food.defaultServingGrams ?? "100");
      }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Food not found"); });
    return () => { active = false; };
  }, [id]);

  async function addToDiary() {
    if (!food) return;
    setBusy(true); setError("");
    try {
      await apiRequest("/v1/meals", {
        method: "POST",
        body: JSON.stringify({ kind, items: [{ foodId: food.id, gramsEaten: Number(grams) }] }),
      });
      router.replace("/diary");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't log food");
    } finally { setBusy(false); }
  }

  async function report() {
    if (!food) return;
    setBusy(true); setError("");
    try {
      await apiRequest("/v1/foods/" + food.id + "/reports", {
        method: "POST", body: JSON.stringify({ reason: reportReason, details: reportDetails }),
      });
      setReported(true); setReporting(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Report failed"); }
    finally { setBusy(false); }
  }

  const weight = Number(grams);
  return (
    <SafeAreaView style={common.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[common.content, { gap: 18 }]}>
        {!food ? <>{!!error && <Text style={common.error}>{error}</Text>}<ActivityIndicator color="#FFFFFF" /></> : <>
          <Text style={common.label}>{food.brand || (food.source === "official" ? "OFFICIAL FOOD" : "COMMUNITY FOOD")}</Text>
          <Text style={common.title}>{food.name}</Text>
          <View style={common.card}>
            <Text style={common.label}>PER 100G</Text>
            <Text style={{ color: palette.primary, fontWeight: "900", fontSize: 42, marginTop: 9 }}>
              {Math.round(food.nutritionPer100g.calories)} <Text style={{ color: palette.muted, fontSize: 15 }}>cal</Text>
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
              {[["Protein", food.nutritionPer100g.proteinG], ["Carbs", food.nutritionPer100g.totalCarbohydratesG],
                ["Fat", food.nutritionPer100g.totalFatG]].map(([label, value]) =>
                <View key={String(label)}><Text style={common.label}>{label}</Text>
                  <Text style={{ color: palette.primary, marginTop: 6, fontWeight: "800", fontSize: 17 }}>{value}g</Text></View>)}
            </View>
          </View>

          <View><Text style={common.fieldLabel}>Your serving (grams)</Text>
            <TextInput style={common.input} keyboardType="decimal-pad" value={grams} onChangeText={setGrams} />
            <Text style={{ color: palette.soft, marginTop: 9 }}>Estimated serving: {Number.isFinite(weight) ? Math.round(food.nutritionPer100g.calories * weight / 100) : 0} cal</Text>
          </View>
          <Text style={common.label}>MEAL TYPE</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {kinds.map(value => <Pressable key={value} onPress={() => setKind(value)}
              style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 15, backgroundColor: kind === value ? palette.primary : palette.panel }}>
              <Text style={{ color: kind === value ? palette.background : palette.soft, fontWeight: "700", textTransform: "capitalize" }}>{value}</Text>
            </Pressable>)}
          </View>
          <Pressable style={common.primaryButton} disabled={busy || !Number.isFinite(weight) || weight <= 0} onPress={() => void addToDiary()}>
            {busy ? <ActivityIndicator color="#111111" /> : <Text style={common.primaryText}>+ Log to diary</Text>}
          </Pressable>
          <Pressable style={common.secondaryButton}
            onPress={() => router.push({ pathname: "/manual", params: { remixFrom: food.id } })}>
            <Text style={common.secondaryText}>Remix · Make my own version</Text>
          </Pressable>

          <Pressable style={{ paddingVertical: 17, borderBottomColor: palette.line, borderBottomWidth: 1 }}
            onPress={() => setAdvanced(value => !value)}>
            <Text style={{ color: palette.soft, fontSize: 14, fontWeight: "700" }}>More details {advanced ? "−" : "+"}</Text>
          </Pressable>

          {advanced && (
            <View style={{ gap: 12 }}>
              <Text style={common.label}>FULL NUTRITION · PER 100G</Text>
              {fields.map(([label, key, unit]) => (
                <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7,
                  borderBottomColor: palette.line, borderBottomWidth: 1 }}>
                  <Text style={{ color: palette.soft, fontSize: 14 }}>{label}</Text>
                  <Text style={{ color: palette.primary, fontSize: 14, fontWeight: "700" }}>
                    {food.nutritionPer100g[key]} {unit}
                  </Text>
                </View>
              ))}
              <Text style={[common.label, { marginTop: 16 }]}>FOOD RECORD</Text>
              <Text style={common.body}>Source: {food.source}</Text>
              <Text style={common.body}>Attributed to: {food.attributedTo || (food.createdByUserId ? "Community contributor" : "LOGD")}</Text>
              <Text style={common.body}>Times logged: {food.useCount}</Text>
              <Text style={common.body}>Added: {new Date(food.createdAt).toLocaleDateString()}</Text>
              <Text style={common.body}>Updated: {new Date(food.updatedAt).toLocaleDateString()}</Text>
              {food.remixedFromFoodId && <Text style={common.body}>Created from another food record</Text>}
              {reported ? <Text style={{ color: palette.soft }}>Thanks. Your report has been submitted.</Text> : (
                <>
                  <Pressable style={{ paddingVertical: 20 }} onPress={() => setReporting(value => !value)}>
                    <Text style={{ color: palette.error, fontSize: 14, fontWeight: "700" }}>⚠  Report a problem</Text>
                  </Pressable>
                  {reporting && <View style={{ gap: 13 }}>
                    <Text style={common.fieldLabel}>What's incorrect?</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                      {([
                        ["Nutrition", "incorrect_nutrition"],
                        ["Outdated", "outdated"],
                        ["Duplicate", "duplicate"],
                        ["Other", "other"],
                      ] as const).map(([label, value]) =>
                        <Pressable key={value} style={{ borderRadius: 11, padding: 12,
                          backgroundColor: reportReason === value ? palette.primary : palette.panel }}
                          onPress={() => setReportReason(value)}>
                          <Text style={{ color: reportReason === value ? palette.background : palette.soft }}>{label}</Text>
                        </Pressable>)}
                    </View>
                    <TextInput multiline style={[common.input, { minHeight: 85 }]}
                      placeholder="What needs correcting?" placeholderTextColor="#777777"
                      value={reportDetails} onChangeText={setReportDetails} />
                    <Pressable style={common.secondaryButton} disabled={busy} onPress={() => void report()}>
                      <Text style={common.secondaryText}>Submit report</Text>
                    </Pressable>
                  </View>}
                </>
              )}
            </View>
          )}
          {!!error && <Text style={common.error}>{error}</Text>}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
