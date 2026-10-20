import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../lib/auth-client";
import { apiRequest, type Food, type MealKind, type Nutrition } from "../lib/api";
import { common, palette } from "../ui/styles";

type Estimate = {
  name: string;
  grams: number;
  confidence: "low" | "medium" | "high";
  nutritionPer100g: Nutrition;
};
const kinds: MealKind[] = ["breakfast", "lunch", "dinner", "snack"];

export default function ScanScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState("image/jpeg");
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [kind, setKind] = useState<MealKind>("lunch");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choosePhoto(source: "camera" | "library") {
    setError(""); setEstimates([]);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError("Enable camera access to take a meal photo.");
          return;
        }
      }
      const config: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.85 };
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(config)
        : await ImagePicker.launchImageLibraryAsync(config);
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        setPhotoMime(result.assets[0].mimeType ?? "image/jpeg");
      }
    } catch {
      setError("Unable to open the camera or photo library.");
    }
  }

  async function analyze() {
    if (!photoUri) return;
    setBusy(true); setError("");
    try {
      const form = new FormData();
      if (Platform.OS === "web") {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        form.append("photo", blob, "meal.jpg");
      } else {
        form.append("photo", {
          uri: photoUri,
          type: photoMime,
          name: "meal.jpg",
        } as unknown as Blob);
      }
      const result = await apiRequest<{ foods: Estimate[] }>("/v1/analyze", {
        method: "POST", body: form,
      });
      setEstimates(result.foods);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not analyze your photo.");
    } finally { setBusy(false); }
  }

  function update(index: number, fields: Partial<Estimate>) {
    setEstimates(old => old.map((item, position) => position === index ? { ...item, ...fields } : item));
  }

  async function save() {
    if (!estimates.length) return;
    setBusy(true); setError("");
    try {
      const items: Array<{ foodId: string; gramsEaten: number }> = [];
      for (const estimate of estimates) {
        if (!estimate.name.trim() || !Number.isFinite(estimate.grams) || estimate.grams <= 0) {
          throw new Error("Each food needs a name and a valid serving weight.");
        }
        const result = await apiRequest<{ food: Food }>("/v1/foods", {
          method: "POST",
          body: JSON.stringify({
            name: estimate.name.trim(),
            nutritionPer100g: estimate.nutritionPer100g,
            defaultServingGrams: estimate.grams,
          }),
        });
        items.push({ foodId: result.food.id, gramsEaten: estimate.grams });
      }
      await apiRequest("/v1/meals", {
        method: "POST",
        body: JSON.stringify({ kind, items }),
      });
      router.replace("/diary");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this meal.");
    } finally { setBusy(false); }
  }

  return (
    <SafeAreaView style={common.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[common.content, { gap: 16 }]} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>Snap. Review. LOGD.</Text>
        <Text style={common.body}>One photo, individual foods, and editable portion estimates.</Text>
        {photoUri
          ? <Image source={{ uri: photoUri }} style={{ width: "100%", aspectRatio: 1.25, borderRadius: 18, backgroundColor: palette.panel }} resizeMode="cover" />
          : <View style={{ height: 215, borderColor: palette.line, borderWidth: 1, borderStyle: "dashed", borderRadius: 18,
            alignItems: "center", justifyContent: "center", padding: 30 }}>
            <Text style={{ color: palette.muted, fontSize: 15, textAlign: "center" }}>Your meal goes here.</Text>
          </View>
        }
        {Platform.OS !== "web" && (
          <Pressable onPress={() => void choosePhoto("camera")} style={common.primaryButton} disabled={busy}>
            <Text style={common.primaryText}>Take a photo</Text>
          </Pressable>
        )}
        <Pressable onPress={() => void choosePhoto("library")} style={common.secondaryButton} disabled={busy}>
          <Text style={common.secondaryText}>Choose from library</Text>
        </Pressable>
        {photoUri && session?.user && estimates.length === 0 && (
          <Pressable onPress={() => void analyze()} style={common.primaryButton} disabled={busy}>
            {busy ? <ActivityIndicator color="#111111" /> : <Text style={common.primaryText}>Analyze this meal</Text>}
          </Pressable>
        )}
        {photoUri && !session?.user && (
          <Pressable style={common.primaryButton} onPress={() => router.push("/account")}>
            <Text style={common.primaryText}>Sign in to analyze and save</Text>
          </Pressable>
        )}
        {!!error && <Text style={common.error}>{error}</Text>}

        {!!estimates.length && <>
          <Text style={[common.label, { marginTop: 12 }]}>EDIT THE ESTIMATES</Text>
          <Text style={common.body}>AI estimates can be wrong. Correct the portions and nutrition before saving.</Text>
          {estimates.map((food, index) => (
            <View key={index} style={[common.card, { gap: 14 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={common.label}>FOOD {index + 1}</Text>
                <Text style={{ color: palette.muted, fontSize: 12 }}>{food.confidence} confidence</Text>
              </View>
              <TextInput style={common.input} value={food.name}
                onChangeText={name => update(index, { name })} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={common.fieldLabel}>Serving (g)</Text>
                  <TextInput style={common.input} keyboardType="decimal-pad" value={String(food.grams)}
                    onChangeText={grams => update(index, { grams: Number(grams) || 0 })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={common.fieldLabel}>Calories / 100g</Text>
                  <TextInput style={common.input} keyboardType="decimal-pad"
                    value={String(food.nutritionPer100g.calories)}
                    onChangeText={value => update(index, { nutritionPer100g: {
                      ...food.nutritionPer100g, calories: Number(value) || 0,
                    } })} />
                </View>
              </View>
              <Text style={{ color: palette.soft, fontSize: 14 }}>
                Estimated serving: {Math.round(food.nutritionPer100g.calories * food.grams / 100)} cal
                {" · "}P {Math.round(food.nutritionPer100g.proteinG * food.grams / 100)}g
                {" · "}C {Math.round(food.nutritionPer100g.totalCarbohydratesG * food.grams / 100)}g
                {" · "}F {Math.round(food.nutritionPer100g.totalFatG * food.grams / 100)}g
              </Text>
              <Pressable onPress={() => setEstimates(old => old.filter((_, pos) => pos !== index))}>
                <Text style={{ color: palette.muted, fontSize: 13 }}>Remove this food</Text>
              </Pressable>
            </View>
          ))}
          <Text style={common.label}>LOG AS</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {kinds.map(value => <Pressable key={value} onPress={() => setKind(value)}
              style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 15, backgroundColor: kind === value ? palette.primary : palette.panel }}>
              <Text style={{ color: kind === value ? palette.background : palette.soft, fontWeight: "700", textTransform: "capitalize" }}>{value}</Text>
            </Pressable>)}
          </View>
          <Pressable style={common.primaryButton} disabled={busy} onPress={() => void save()}>
            {busy ? <ActivityIndicator color="#111111" /> : <Text style={common.primaryText}>Save meal to diary</Text>}
          </Pressable>
          <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 19 }}>
            Image storage will be enabled separately. This initial flow saves the foods and their nutritional snapshots, not the photo itself.
          </Text>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
