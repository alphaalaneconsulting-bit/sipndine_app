import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "@/src/api";
import { AppIcon, GlassCard, PrimaryButton, StatusPill } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

type VerifyResult = { success: boolean; message: string; offer_title: string; discount: string; member_name: string; member_tier: string };

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export default function AdminPanel() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  const press = (key: (typeof KEYPAD)[number]) => {
    setResult(null); setError("");
    if (key === "clear") { setCode(""); return; }
    if (key === "back") { setCode((prev) => prev.slice(0, -1)); return; }
    setCode((prev) => (prev.length >= 6 ? prev : prev + key));
  };
  const submit = async () => {
    if (code.length !== 6) { setError("Enter the 6-digit code shown by the guest."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const next = await api.verifyCode(code);
      setResult(next);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify this code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable testID="admin-back" onPress={() => router.back()} style={styles.back}><AppIcon name="chevron.left" color={colors.brand} /></Pressable>
            <View>
              <Text style={styles.eyebrow}>STAFF · SIP ’N’ DINE</Text>
              <Text style={styles.title}>Verify a privilege code</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Ask the guest to show their live 6-digit code from the offers screen. Enter it here to mark it redeemed.</Text>

          <GlassCard style={styles.codeCard}>
            <Text style={styles.codeLabel}>GUEST CODE</Text>
            <View style={styles.codeSlots}>
              {[0, 1, 2, 3, 4, 5].map((slot) => (
                <View key={slot} style={[styles.codeSlot, code.length === slot && styles.codeSlotActive]}>
                  <Text style={styles.codeDigit}>{code[slot] ?? ""}</Text>
                </View>
              ))}
            </View>
            <TextInput testID="admin-code-input" value={code} onChangeText={(next) => setCode(next.replace(/[^0-9]/g, "").slice(0, 6))} placeholder="Or type it here" placeholderTextColor={colors.muted} keyboardType="number-pad" style={styles.hiddenInput} />
            <View style={styles.keypad}>
              {KEYPAD.map((key) => (
                <Pressable key={key} testID={`admin-key-${key}`} onPress={() => press(key)} style={({ pressed }) => [styles.key, key === "clear" && styles.keyAlt, key === "back" && styles.keyAlt, pressed && styles.keyPressed]}>
                  <Text style={styles.keyText}>{key === "back" ? "⌫" : key === "clear" ? "Clear" : key}</Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton testID="admin-verify" onPress={submit} disabled={busy} style={styles.verify}>{busy ? "Checking…" : "Verify & redeem"}</PrimaryButton>
          </GlassCard>

          {error ? (
            <View style={[styles.resultCard, styles.errorCard]} testID="admin-error">
              <AppIcon name="exclamationmark.triangle.fill" color={colors.onError} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {result ? (
            <View style={[styles.resultCard, styles.successCard]} testID="admin-success">
              <View style={styles.resultHead}>
                <AppIcon name="checkmark.seal.fill" color={colors.onSuccess} size={24} />
                <StatusPill label="Redeemed" tone="success" />
              </View>
              <Text style={styles.resultTitle}>{result.message}</Text>
              <View style={styles.resultRow}><Text style={styles.resultKey}>Guest</Text><Text style={styles.resultValue}>{result.member_name} · {result.member_tier}</Text></View>
              <View style={styles.resultRow}><Text style={styles.resultKey}>Offer</Text><Text style={styles.resultValue}>{result.offer_title}</Text></View>
              <View style={styles.resultRow}><Text style={styles.resultKey}>Apply</Text><Text style={styles.resultValue}>{result.discount}</Text></View>
            </View>
          ) : null}

          <View style={styles.tips}>
            <Text style={styles.tipsHeading}>How this protects the discount</Text>
            <Tip body="Codes are generated per guest, per offer and expire in 60 seconds." />
            <Tip body="Each code can be redeemed once. A repeat attempt shows a warning here." />
            <Tip body="Screenshots cannot be reused because the code is already invalid the moment it is used." />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Tip({ body }: { body: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipDot}><AppIcon name="checkmark" color={colors.brand} size={12} /></View>
      <Text style={styles.tipBody}>{body}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  eyebrow: { color: colors.brand, fontSize: 11, letterSpacing: 1.6, fontWeight: "800" },
  title: { color: colors.onSurface, fontSize: 24, fontWeight: "800", marginTop: 4 },
  subtitle: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20, marginTop: 14 },
  codeCard: { marginTop: 22, padding: 20 },
  codeLabel: { color: colors.brand, fontSize: 11, letterSpacing: 1.5, fontWeight: "800" },
  codeSlots: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, gap: 6 },
  codeSlot: { flex: 1, height: 56, borderRadius: 12, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  codeSlotActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary },
  codeDigit: { color: colors.onSurface, fontSize: 24, fontWeight: "900" },
  hiddenInput: { height: 0, opacity: 0, marginTop: 0 },
  keypad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 18, gap: 8 },
  key: { width: "31%", height: 54, borderRadius: 14, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  keyAlt: { backgroundColor: colors.brandTertiary },
  keyPressed: { opacity: 0.7 },
  keyText: { color: colors.onSurface, fontSize: 18, fontWeight: "800" },
  verify: { marginTop: 18 },
  resultCard: { marginTop: 18, borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  successCard: { backgroundColor: colors.success, borderColor: colors.success },
  errorCard: { backgroundColor: colors.error, borderColor: colors.error, flexDirection: "row", alignItems: "center", gap: 12 },
  errorText: { color: colors.onError, flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  resultHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultTitle: { color: colors.onSuccess, fontSize: 16, fontWeight: "800", marginTop: 4 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6 },
  resultKey: { color: colors.onSuccess, fontSize: 12, opacity: 0.85, fontWeight: "700" },
  resultValue: { color: colors.onSuccess, fontSize: 13, fontWeight: "800" },
  tips: { marginTop: 30 },
  tipsHeading: { color: colors.onSurface, fontSize: 14, fontWeight: "800", marginBottom: 10 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  tipDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginTop: 1 },
  tipBody: { color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18, flex: 1 },
}));
