import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../lib/auth-client";
import { apiRequest, emptyNutrition, type Food, type MealKind } from "../lib/api";
import { common, palette } from "../ui/styles";

const kinds: MealKind[] = ["breakfast", "lunch", "dinner", "snack"];

export default function ManualScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("100");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [kind, setKind] = useState<MealKind>("lunch");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const weight = Number(grams);
    if (!name.trim() || !Number.isFinite(weight) || weight <= 0) {
      setError("Enter a food name and a valid portion in grams.");
      return;
    }
    setSaving(true); setError("");
    try {
      const facts = {
        ...emptyNutrition,
        calories: Number(calories) || 0,
        proteinG: Number(protein) || 0,
        totalCarbohydratesG: Number(carbs) || 0,
        netCarbsG: Number(carbs) || 0,
        totalFatG: Number(fat) || 0,
      };
      const result = await apiRequest<{ food: Food }>("/v1/foods", {
        method: "POST", body: JSON.stringify({ name: name.trim(), nutritionPer100g: facts }),
      });
      await apiRequest("/v1/meals", {
        method: "POST",
        body: JSON.stringify({ kind, items: [{ foodId: result.food.id, gramsEaten: weight }] }),
      });
      router.replace("/diary");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the meal.");
    } finally { setSaving(false); }
  }

  function numberField(label: string, value: string, setValue: (value: string) => void, unit = "g") {
    return <View style={{ flex: 1, minWidth: 120 }}>
      <Text style={common.fieldLabel}>{label} ({unit})</Text>
      <TextInput style={common.input} value={value} onChangeText={setValue}
        keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#777777" />
    </View>;
  }

  return (
    <SafeAreaView style={common.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[common.content, { gap: 19 }]} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>Build your log.</Text>
        <Text style={common.body}>Enter nutrition per 100g. LOGD calculates your portion automatically.</Text>
        {!session?.user ? (
          <Pressable style={common.primaryButton} onPress={() => router.push("/account")}>
            <Text style={common.primaryText}>Sign in to log food</Text>
          </Pressable>
        ) : (
          <>
            <View><Text style={common.fieldLabel}>Food name</Text>
              <TextInput style={common.input} value={name} onChangeText={setName}
                placeholder="e.g. Grilled salmon" placeholderTextColor="#777777" /></View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {numberField("Portion", grams, setGrams)}
              {numberField("Calories per 100g", calories, setCalories, "cal")}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {numberField("Protein", protein, setProtein)}
              {numberField("Carbs", carbs, setCarbs)}
              {numberField("Fat", fat, setFat)}
            </View>
            <Text style={[common.label, { marginTop: 7 }]}>MEAL TYPE</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {kinds.map(value => <Pressable key={value}
                onPress={() => setKind(value)}
                style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 15,
                  backgroundColor: value === kind ? palette.primary : palette.panel }}>
                <Text style={{ color: value === kind ? palette.background : palette.soft, fontWeight: "700", textTransform: "capitalize" }}>
                  {value}
                </Text>
              </Pressable>)}
            </View>
            {!!error && <Text style={common.error}>{error}</Text>}
            <Pressable style={common.primaryButton} disabled={saving} onPress={() => void save()}>
              {saving ? <ActivityIndicator color="#111111" /> : <Text style={common.primaryText}>Save to diary</Text>}
            </Pressable>
            <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>
              Unknown nutrition fields are saved as 0. You can report an incorrect food listing later.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
