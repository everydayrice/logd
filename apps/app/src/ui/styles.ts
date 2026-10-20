import { StyleSheet } from "react-native";

export const palette = {
  background: "#0B0B0B",
  panel: "#151515",
  line: "#2E2E2E",
  primary: "#F6F6F6",
  muted: "#989898",
  soft: "#BBBBBB",
  error: "#FF8585",
};

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 24, paddingBottom: 48 },
  wordmark: { color: palette.primary, fontSize: 29, fontWeight: "900", letterSpacing: -1.4 },
  title: { color: palette.primary, fontSize: 35, lineHeight: 42, fontWeight: "800", letterSpacing: -1.5 },
  label: { color: palette.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  body: { color: palette.soft, fontSize: 15, lineHeight: 23 },
  fieldLabel: { color: palette.soft, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  input: { borderColor: palette.line, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 15, color: palette.primary, backgroundColor: palette.panel, fontSize: 16 },
  primaryButton: { borderRadius: 14, paddingVertical: 17, paddingHorizontal: 18, backgroundColor: palette.primary, alignItems: "center" },
  primaryText: { color: palette.background, fontSize: 15, fontWeight: "800" },
  secondaryButton: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, backgroundColor: palette.panel, borderColor: palette.line, borderWidth: 1, alignItems: "center" },
  secondaryText: { color: palette.primary, fontSize: 15, fontWeight: "700" },
  error: { color: palette.error, fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: palette.panel, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#222222" },
});
