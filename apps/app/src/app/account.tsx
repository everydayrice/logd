import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../lib/auth-client";
import { common, palette } from "../ui/styles";

export default function AccountScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setPending(true);
    try {
      if (creating) {
        const result = await authClient.signUp.email({
          name: name.trim(), email: email.trim().toLowerCase(), password,
        });
        if (result.error) throw new Error(result.error.message ?? "Could not create account");
      } else {
        const result = await authClient.signIn.email({
          email: email.trim().toLowerCase(), password,
        });
        if (result.error) throw new Error(result.error.message ?? "Could not sign in");
      }
      router.replace("/diary");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Try again.");
    } finally { setPending(false); }
  }

  async function signOut() {
    setPending(true);
    try {
      await authClient.signOut();
      router.replace("/");
    } finally { setPending(false); }
  }

  return (
    <SafeAreaView style={common.screen} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
          <Text style={common.label}>LOGD ACCOUNT</Text>
          <Text style={[common.title, { marginTop: 14, marginBottom: 24 }]}>
            {session?.user ? "You're logged in." : creating ? "Make it yours." : "Welcome back."}
          </Text>
          {session?.user ? (
            <View style={{ gap: 16 }}>
              <Text style={common.body}>{session.user.name} · {session.user.email}</Text>
              <Pressable style={common.primaryButton} onPress={() => router.replace("/diary")}>
                <Text style={common.primaryText}>Open my diary</Text>
              </Pressable>
              <Pressable style={common.secondaryButton} disabled={pending} onPress={() => void signOut()}>
                <Text style={common.secondaryText}>Sign out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {creating && (
                <View><Text style={common.fieldLabel}>Name</Text>
                  <TextInput style={common.input} value={name} onChangeText={setName}
                    placeholder="Your name" placeholderTextColor="#777777" autoComplete="name" /></View>
              )}
              <View><Text style={common.fieldLabel}>Email</Text>
                <TextInput style={common.input} value={email} onChangeText={setEmail}
                  placeholder="you@example.com" placeholderTextColor="#777777"
                  keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View>
              <View><Text style={common.fieldLabel}>Password</Text>
                <TextInput style={common.input} value={password} onChangeText={setPassword}
                  placeholder="At least 8 characters" placeholderTextColor="#777777"
                  secureTextEntry autoComplete={creating ? "new-password" : "current-password"} /></View>
              {!!error && <Text style={common.error}>{error}</Text>}
              <Pressable style={common.primaryButton} disabled={pending || !email.trim() || !password || (creating && !name.trim())}
                onPress={() => void submit()}>
                {pending ? <ActivityIndicator color="#111111" /> :
                  <Text style={common.primaryText}>{creating ? "Create account" : "Sign in"}</Text>}
              </Pressable>
              <Pressable style={{ padding: 10 }} disabled={pending}
                onPress={() => { setError(""); setCreating(!creating); }}>
                <Text style={{ color: palette.soft, textAlign: "center", fontWeight: "600" }}>
                  {creating ? "Already have an account? Sign in" : "New to LOGD? Create an account"}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
