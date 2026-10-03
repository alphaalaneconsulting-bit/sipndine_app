import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { adminApi, AuthExpiredError, type VerifyResult } from "@/src/api";
import { useAdmin } from "@/src/admin";
import { AppIcon, GlassCard, PrimaryButton, ScreenHeader, StatusPill } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export default function VerifyScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const { email, ready, logout } = useAdmin();
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false); const [result, setResult] = useState<VerifyResult | null>(null); const [error, setError] = useState("");
  useEffect(() => { if (ready && !email) router.replace("/admin"); }, [ready, email]);
  const press = (key: (typeof KEYPAD)[number]) => { setResult(null); setError(""); if (key === "clear") { setCode(""); return; } if (key === "back") { setCode((p) => p.slice(0, -1)); return; } setCode((p) => (p.length >= 6 ? p : p + key)); };
  const submit = async () => {
    if (code.length !== 6) { setError("Enter the 6-digit code shown by the guest."); return; }
    setBusy(true); setError(""); setResult(null);
    try { setResult(await adminApi.verifyCode(code)); setCode(""); }
    catch (err) { if (err instanceof AuthExpiredError) { await logout(); router.replace("/admin"); return; } setError(err instanceof Error ? err.message : "Could not verify this code."); }
    finally { setBusy(false); }
  };
  return <View style={styles.root}>
    <ScreenHeader eyebrow="STAFF · AT BILLING" title="Verify a privilege code" />
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>Ask the guest to show their live 6-digit code from Offers. Enter it here to mark it redeemed.</Text>
      <GlassCard style={styles.codeCard}>
        <Text style={styles.codeLabel}>GUEST CODE</Text>
        <View style={styles.codeSlots}>{[0, 1, 2, 3, 4, 5].map((slot) => <View key={slot} style={[styles.codeSlot, code.length === slot && styles.codeSlotActive]}><Text style={styles.codeDigit}>{code[slot] ?? ""}</Text></View>)}</View>
        <TextInput testID="admin-code-input" value={code} onChangeText={(next) => setCode(next.replace(/[^0-9]/g, "").slice(0, 6))} keyboardType="number-pad" style={styles.hiddenInput} />
        <View style={styles.keypad}>{KEYPAD.map((key) => <Pressable key={key} testID={`admin-key-${key}`} onPress={() => press(key)} style={({ pressed }) => [styles.key, (key === "clear" || key === "back") && styles.keyAlt, pressed && styles.keyPressed]}><Text style={styles.keyText}>{key === "back" ? "⌫" : key === "clear" ? "Clear" : key}</Text></Pressable>)}</View>
        <PrimaryButton testID="admin-verify" onPress={submit} disabled={busy} style={styles.verify}>{busy ? "Checking…" : "Verify & redeem"}</PrimaryButton>
      </GlassCard>
      {error ? <View style={[styles.resultCard, styles.errorCard]} testID="admin-error"><AppIcon name="exclamationmark.triangle.fill" color={colors.onError} /><Text style={styles.errorText}>{error}</Text></View> : null}
      {result ? <View style={[styles.resultCard, styles.successCard]} testID="admin-success">
        <View style={styles.resultHead}><AppIcon name="checkmark.seal.fill" color={colors.onSuccess} size={24} /><StatusPill label="Redeemed" tone="success" /></View>
        <Text style={styles.resultTitle}>{result.message}</Text>
        <View style={styles.resultRow}><Text style={styles.resultKey}>Guest</Text><Text style={styles.resultValue}>{result.member_name} · {result.member_tier}</Text></View>
        <View style={styles.resultRow}><Text style={styles.resultKey}>Mobile</Text><Text style={styles.resultValue}>{result.member_phone}</Text></View>
        <View style={styles.resultRow}><Text style={styles.resultKey}>Offer</Text><Text style={styles.resultValue}>{result.offer_title}</Text></View>
        <View style={styles.resultRow}><Text style={styles.resultKey}>Apply</Text><Text style={styles.resultValue}>{result.discount}</Text></View>
      </View> : null}
      <View style={styles.tips}><Text style={styles.tipsHeading}>How this protects the discount</Text>{["Codes are generated per signed-in guest, per offer, and expire in 60 seconds.", "Each code is single-use; a repeat attempt shows a warning here.", "Each guest can redeem an offer once per 24 hours (cap editable per offer).", "Only signed-in staff can verify, and every redemption is logged."].map((tip) => <View key={tip} style={styles.tipRow}><View style={styles.tipDot}><AppIcon name="checkmark" color={colors.brand} size={12} /></View><Text style={styles.tipBody}>{tip}</Text></View>)}</View>
    </ScrollView></KeyboardAvoidingView>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, flex: { flex: 1 }, content: { paddingHorizontal: 18 }, subtitle: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20 },
  codeCard: { marginTop: 18, padding: 20 }, codeLabel: { color: colors.brand, fontSize: 11, letterSpacing: 1.5, fontWeight: "800" }, codeSlots: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, gap: 6 }, codeSlot: { flex: 1, height: 56, borderRadius: 12, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, codeSlotActive: { borderColor: colors.brand, backgroundColor: colors.brandTertiary }, codeDigit: { color: colors.onSurface, fontSize: 24, fontWeight: "900" }, hiddenInput: { height: 0, opacity: 0 },
  keypad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 18, gap: 8 }, key: { width: "31%", height: 54, borderRadius: 14, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }, keyAlt: { backgroundColor: colors.brandTertiary }, keyPressed: { opacity: 0.7 }, keyText: { color: colors.onSurface, fontSize: 18, fontWeight: "800" }, verify: { marginTop: 18 },
  resultCard: { marginTop: 18, borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 }, successCard: { backgroundColor: colors.success, borderColor: colors.success }, errorCard: { backgroundColor: colors.error, borderColor: colors.error, flexDirection: "row", alignItems: "center", gap: 12 }, errorText: { color: colors.onError, flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "700" }, resultHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, resultTitle: { color: colors.onSuccess, fontSize: 16, fontWeight: "800", marginTop: 4 }, resultRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6 }, resultKey: { color: colors.onSuccess, fontSize: 12, opacity: 0.85, fontWeight: "700" }, resultValue: { color: colors.onSuccess, fontSize: 13, fontWeight: "800" },
  tips: { marginTop: 30 }, tipsHeading: { color: colors.onSurface, fontSize: 14, fontWeight: "800", marginBottom: 10 }, tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 }, tipDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginTop: 1 }, tipBody: { color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18, flex: 1 },
}));
