import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiaryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Your food diary.</Text>
        <Text style={styles.body}>
          No meals yet. Secure accounts, nutrition estimates and synced meal history are coming in the next build.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0B" },
  content: { padding: 24 },
  title: { fontSize: 32, color: "#FFFFFF", fontWeight: "800", letterSpacing: -1.4 },
  body: { marginTop: 15, fontSize: 16, lineHeight: 25, color: "#A8A8A8" },
});
