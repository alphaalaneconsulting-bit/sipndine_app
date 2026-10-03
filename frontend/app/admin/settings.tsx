import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, AuthExpiredError, type Settings } from "@/src/api";
import { SETTINGS_GROUPS, useAdmin } from "@/src/admin";
import { FormFields, type Draft } from "@/src/components/admin-form";
import { GlassCard, PrimaryButton, ScreenHeader } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminSettings() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const queryClient = useQueryClient();
  const { email, ready, logout } = useAdmin();
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: adminApi.settings, enabled: Boolean(email) });
  const [draft, setDraft] = useState<Draft | null>(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  useEffect(() => { if (ready && !email) router.replace("/admin"); }, [ready, email]);
  useEffect(() => { if (settings.data && !draft) setDraft({ ...settings.data }); }, [settings.data, draft]);
  const save = async () => {
    if (!draft) return; setBusy(true); setMsg("");
    try { await adminApi.saveSettings(draft as Partial<Settings>); queryClient.invalidateQueries({ queryKey: ["home"] }); queryClient.invalidateQueries({ queryKey: ["admin-settings"] }); setMsg("Saved. Guests see the changes on their next refresh."); }
    catch (err) { if (err instanceof AuthExpiredError) { await logout(); router.replace("/admin"); return; } setMsg(err instanceof Error ? err.message : "Could not save."); }
    finally { setBusy(false); }
  };
  return <View style={styles.root}>
    <ScreenHeader eyebrow="ADMIN · EVERY WORD IS EDITABLE" title="App text, contact & about" />
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {!draft ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : SETTINGS_GROUPS.map((group) => <GlassCard key={group.title} style={styles.group}><Text style={styles.groupTitle}>{group.title}</Text><FormFields fields={group.fields} draft={draft} onChange={(key, value) => setDraft((p) => ({ ...(p ?? {}), [key]: value }))} /></GlassCard>)}
    </ScrollView></KeyboardAvoidingView>
    <View style={[styles.saveBar, { paddingBottom: insets.bottom + 14 }]}>{msg ? <Text style={styles.msg} testID="settings-msg">{msg}</Text> : null}<PrimaryButton testID="settings-save" onPress={save} disabled={busy || !draft}>{busy ? "Saving…" : "Save all changes"}</PrimaryButton></View>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, flex: { flex: 1 }, content: { paddingHorizontal: 18 }, loader: { marginTop: 40 },
  group: { marginBottom: 14 }, groupTitle: { color: colors.brand, fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 },
  saveBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.borderStrong }, msg: { color: colors.brand, fontSize: 12, fontWeight: "700", marginBottom: 10, textAlign: "center" },
}));
