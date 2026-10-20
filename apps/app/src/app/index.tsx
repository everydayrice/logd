import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../lib/auth-client";
import { common, palette } from "../ui/styles";

export default function HomeScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <SafeAreaView style={common.screen}>
      <ScrollView contentContainerStyle={[common.content, { flexGrow: 1 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={common.wordmark}>LOGD</Text>
          <Pressable onPress={() => router.push(session?.user ? "/diary" : "/account")} accessibilityRole="button">
            <Text style={{ color: palette.soft, fontWeight: "700" }}>
              {session?.user ? "MY DIARY  →" : "SIGN IN  →"}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 100, marginBottom: 36 }}>
          <Text style={[common.label, { marginBottom: 17 }]}>THE FUTURE OF FOOD LOGGING</Text>
          <Text style={[common.title, { fontSize: 53, lineHeight: 57, letterSpacing: -2.8 }]}>
            Eat life.{"\n"}LOGD it.
          </Text>
          <Text style={[common.body, { marginTop: 20, maxWidth: 330 }]}>
            Snap your meal, review the estimates, and log every detail. No guesswork hidden behind a pretty chart.
          </Text>
        </View>

        <Link href="/scan" asChild>
          <Pressable style={common.primaryButton} accessibilityRole="button">
            <Text style={common.primaryText}>+  Snap a meal</Text>
          </Pressable>
        </Link>

        <Link href="/manual" asChild>
          <Pressable style={[common.secondaryButton, { marginTop: 12 }]} accessibilityRole="button">
            <Text style={common.secondaryText}>Log manually</Text>
          </Pressable>
        </Link>

        <Link href="/food-search" asChild>
          <Pressable style={[common.secondaryButton, { marginTop: 12 }]} accessibilityRole="button">
            <Text style={common.secondaryText}>Search foods</Text>
          </Pressable>
        </Link>

        <Link href="/diary" asChild>
          <Pressable style={{ marginTop: 28, paddingVertical: 10 }} accessibilityRole="button">
            <Text style={{ color: palette.muted, fontSize: 14, fontWeight: "700", textAlign: "center" }}>
              View my food diary   →
            </Text>
          </Pressable>
        </Link>
        <View style={{ flex: 1 }} />
        <Text style={{ color: "#6F6F6F", fontSize: 12, lineHeight: 19, marginTop: 40 }}>
          LOGD · Early development build
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
