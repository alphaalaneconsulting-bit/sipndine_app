import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { api, type Customer } from "@/src/api";
import { makeStyles, useTheme } from "@/src/theme";

const SESSION_KEY = "lumiere_customer";

export function SessionProvider({ children }: PropsWithChildren) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  useEffect(() => { AsyncStorage.getItem(SESSION_KEY).then((value) => value && setCustomer(JSON.parse(value))); }, []);
  const signIn = async (payload: { name: string; email: string; phone: string }) => {
    const next = await api.signIn(payload);
    setCustomer(next);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return next;
  };
  const signOut = async () => { setCustomer(null); await AsyncStorage.removeItem(SESSION_KEY); };
  return <SessionContext.Provider value={{ customer, signIn, signOut }}>{children}</SessionContext.Provider>;
}

type SessionValue = { customer: Customer | null; signIn: (payload: { name: string; email: string; phone: string }) => Promise<Customer>; signOut: () => Promise<void> };
const SessionContext = createContext<SessionValue | null>(null);
export function useSession() { const value = useContext(SessionContext); if (!value) throw new Error("SessionProvider is missing"); return value; }

export function SignInModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { signIn } = useSession();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!form.name || !form.email || !form.phone) { setError("Add your name, email and mobile to continue."); return; }
    setBusy(true); setError("");
    try { await signIn(form); onClose(); } catch (err) { setError(err instanceof Error ? err.message : "Could not create your membership."); } finally { setBusy(false); }
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalRoot}>
      <View style={styles.sheet} testID="sign-in-modal">
        <View style={styles.sheetTop}><View><Text style={styles.eyebrow}>SIP ’N’ DINE · PRIVILEGES</Text><Text style={styles.sheetTitle}>Get ur discount.</Text></View><Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close sign in" testID="auth-close"><Text style={styles.closeText}>×</Text></Pressable></View>
        <Text style={styles.sheetCopy}>Join free with your name, email and mobile to unlock member pricing, a digital card and one-time offers you can redeem at the table.</Text>
        {[['name', 'Full name'], ['email', 'Email address'], ['phone', 'Mobile number']].map(([key, placeholder]) => <TextInput key={key} testID={`auth-${key}`} value={form[key as keyof typeof form]} onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} autoCapitalize={key === "name" ? "words" : "none"} keyboardType={key === "email" ? "email-address" : key === "phone" ? "phone-pad" : "default"} />)}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable onPress={submit} disabled={busy} testID="auth-submit" style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}><Text style={styles.primaryText}>{busy ? "Securing your membership…" : "Get ur discount"}</Text></Pressable>
        <Text style={styles.legal}>Your details stay with Sip ’N’ Dine and help us tailor your visits.</Text>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const useStyles = makeStyles((colors) => ({
  modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(12,14,18,0.72)" },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, borderTopWidth: 1, borderColor: colors.borderStrong },
  sheetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: colors.brand, fontSize: 11, letterSpacing: 1.5, fontWeight: "700" },
  sheetTitle: { color: colors.onSurface, fontSize: 28, fontWeight: "700", marginTop: 8 },
  sheetCopy: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 20 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.onSurface, fontSize: 28, lineHeight: 30 },
  input: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.onSurface, paddingHorizontal: 16, marginBottom: 12, fontSize: 15 },
  primary: { minHeight: 52, backgroundColor: colors.brandPrimary, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.55 },
  error: { color: colors.error, fontSize: 13, marginBottom: 8 },
  legal: { color: colors.muted, textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 14 },
}));