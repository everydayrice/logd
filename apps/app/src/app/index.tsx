import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>LOGD</Text>
          <Text style={styles.subheading}>Nutrition, without the friction.</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR DAILY LOG</Text>
          <Text style={styles.heading}>Know what you eat.</Text>
          <Text style={styles.description}>
            Start with a photo. LOGD is being built to turn meals into an accurate, editable food diary.
          </Text>
        </View>

        <Link href="/scan" asChild>
          <Pressable style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>+  Add a meal photo</Text>
          </Pressable>
        </Link>
        <Link href="/diary" asChild>
          <Pressable style={styles.secondaryButton} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>View food diary</Text>
          </Pressable>
        </Link>

        <Text style={styles.footer}>
          Early build: photo selection is available. AI analysis, nutrition and syncing are being connected next.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B0B0B" },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 36 },
  header: { marginBottom: 90 },
  wordmark: { color: "#FFFFFF", fontSize: 29, fontWeight: "900", letterSpacing: -1.3 },
  subheading: { color: "#969696", fontSize: 13, marginTop: 6 },
  hero: { marginBottom: 34 },
  eyebrow: { color: "#969696", fontSize: 11, fontWeight: "700", letterSpacing: 1.6, marginBottom: 16 },
  heading: { color: "#FFFFFF", fontSize: 48, lineHeight: 54, fontWeight: "800", letterSpacing: -2.4, maxWidth: 340 },
  description: { color: "#B7B7B7", fontSize: 16, lineHeight: 25, marginTop: 18, maxWidth: 370 },
  primaryButton: { backgroundColor: "#F4F4F4", borderRadius: 16, padding: 19, alignItems: "center", marginBottom: 12 },
  primaryButtonText: { color: "#0B0B0B", fontWeight: "800", fontSize: 16 },
  secondaryButton: { borderColor: "#353535", borderWidth: 1, borderRadius: 16, padding: 19, alignItems: "center" },
  secondaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  footer: { color: "#777777", fontSize: 12, lineHeight: 19, marginTop: 30 },
});
