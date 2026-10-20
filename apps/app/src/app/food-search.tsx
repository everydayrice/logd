import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest, type Food } from "../lib/api";
import { common, palette } from "../ui/styles";

export default function FoodSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      apiRequest<{ foods: Food[] }>("/v1/foods?q=" + encodeURIComponent(query)).then(result => {
        if (active) { setFoods(result.foods); setError(""); }
      }).catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : "Search failed");
      }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  return (
    <SafeAreaView style={common.screen} edges={["bottom"]}>
      <View style={[common.content, { flex: 1 }]}>
        <Text style={common.title}>Find a food.</Text>
        <Text style={[common.body, { marginTop: 10, marginBottom: 22 }]}>Search foods that have already been logged.</Text>
        <TextInput style={common.input} value={query} onChangeText={setQuery}
          placeholder="Search by food name" placeholderTextColor="#777777" autoCorrect={false} />
        {!!error && <Text style={[common.error, { marginTop: 12 }]}>{error}</Text>}
        {loading && <ActivityIndicator style={{ marginTop: 18 }} color="#FFFFFF" />}
        <FlatList style={{ marginTop: 18 }} data={foods} keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: "/food/[id]", params: { id: item.id } })}
              style={[common.card, { marginBottom: 10, padding: 17 }]}>
              <Text style={{ color: palette.primary, fontSize: 17, fontWeight: "700" }}>{item.name}</Text>
              <Text style={{ color: palette.muted, marginTop: 6, fontSize: 13 }}>
                {Math.round(item.nutritionPer100g.calories)} cal / 100g · {item.brand || (item.source === "official" ? "Official" : "Community")}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={!loading && !error ? <Text style={[common.body, { marginTop: 18 }]}>No matches yet. Add your own food.</Text> : null}
        />
        <Link href="/manual" asChild><Pressable style={common.primaryButton}>
          <Text style={common.primaryText}>+ Add a new food</Text>
        </Pressable></Link>
      </View>
    </SafeAreaView>
  );
}
