import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function addPhoto(source: "camera" | "library") {
    try {
      setError("");
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError("Camera permission is required to take a meal photo.");
          return;
        }
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      setError("Could not open the camera or photo library. Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Start with a photo.</Text>
        <Text style={styles.description}>Photograph your meal or select one from your library.</Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Your meal photo will appear here.</Text>
          </View>
        )}

        {Platform.OS !== "web" && (
          <Pressable style={styles.primaryButton} onPress={() => void addPhoto("camera")}>
            <Text style={styles.primaryText}>Take photo</Text>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={() => void addPhoto("library")}>
          <Text style={styles.secondaryText}>Choose from library</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {photoUri ? (
          <Text style={styles.note}>
            Photo selected. AI food recognition and private upload are the next implementation milestone.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B0B0B" },
  content: { padding: 24, gap: 14 },
  title: { color: "#FFFFFF", fontWeight: "800", fontSize: 31, letterSpacing: -1.2 },
  description: { color: "#A8A8A8", fontSize: 15, lineHeight: 22, marginBottom: 10 },
  preview: { width: "100%", aspectRatio: 1, borderRadius: 18, backgroundColor: "#202020" },
  emptyState: { height: 270, borderColor: "#454545", borderWidth: 1, borderStyle: "dashed", borderRadius: 18, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyStateText: { color: "#929292", textAlign: "center" },
  primaryButton: { backgroundColor: "#F4F4F4", padding: 18, borderRadius: 14, alignItems: "center" },
  primaryText: { fontWeight: "800", color: "#0B0B0B", fontSize: 16 },
  secondaryButton: { borderColor: "#454545", borderWidth: 1, borderRadius: 14, padding: 18, alignItems: "center" },
  secondaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  error: { color: "#FF8C8C", fontSize: 13 },
  note: { color: "#999999", fontSize: 13, lineHeight: 20, marginTop: 8 },
});
