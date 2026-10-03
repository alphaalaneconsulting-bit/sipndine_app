import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/src/api";
import { useAdmin } from "@/src/admin";
import { AppIcon, Field, GlassCard, PrimaryButton, ScreenHeader, SectionTitle } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

const SECTIONS: { key: string; icon: string; title: string; body: string; route: Href }[] = [
  { key: "verify", icon: "qrcode.viewfinder", title: "Verify a privilege code", body: "Enter the guest's 6-digit code at billing.", route: "/admin/verify" },
  { key: "bookings", icon: "calendar.badge.clock", title: "Bookings & enquiries", body: "Confirm table requests, reply to banqueting enquiries.", route: "/admin/bookings" },
  { key: "settings", icon: "gearshape.fill", title: "App text, contact & about", body: "Brand, home copy, promo banner, WhatsApp, address, hours, About Us.", route: "/admin/settings" },
  { key: "menu", icon: "fork.knife", title: "Menu items", body: "Dishes, prices, photos, favourites and new additions.", route: "/admin/content/menu" },
  { key: "offers", icon: "tag.fill", title: "Offers & combos", body: "Discounts, validity, photos and per-day redemption caps.", route: "/admin/content/offers" },
  { key: "gallery", icon: "photo.on.rectangle.angled", title: "Gallery", body: "Photos of the house shown on Home and Gallery.", route: "/admin/content/gallery" },
  { key: "notifications", icon: "bell.fill", title: "Notifications", body: "Event notes and festival greetings.", route: "/admin/content/notifications" },
  { key: "managers", icon: "person.2.fill", title: "Managers", body: "Who guests can call, WhatsApp or enquire with.", route: "/admin/content/managers" },
  { key: "customers", icon: "person.crop.circle.fill", title: "Customers & app usage", body: "Everyone who signed in, plus anonymous app opens.", route: "/admin/customers" },
  { key: "redemptions", icon: "checkmark.seal.fill", title: "Redemption log", body: "Every code generated and redeemed.", route: "/admin/redemptions" },
];

export default function AdminHome() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const { email, ready, login, logout } = useAdmin();
  const [form, setForm] = useState({ email: "", password: "" }); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.stats, enabled: Boolean(email) });
  const submit = async () => { if (!form.email || !form.password) { setError("Enter your staff email and password."); return; } setBusy(true); setError(""); try { await login(form.email, form.password); } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed."); } finally { setBusy(false); } };

  if (!ready) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  if (!email) return <View style={styles.root}><ScreenHeader eyebrow="STAFF ONLY" title="Admin sign-in" /><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
    <GlassCard style={styles.loginCard}>
      <View style={styles.lockIcon}><AppIcon name="lock.shield.fill" color={colors.brand} size={26} /></View>
      <Text style={styles.loginTitle}>Managers & hosts</Text>
      <Text style={styles.loginBody}>Sign in to verify privilege codes, manage bookings and edit everything guests see in the app.</Text>
      <Field testID="admin-email" label="Staff email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} autoCapitalize="none" keyboardType="email-address" placeholder="info@sipndine.com" />
      <Field testID="admin-password" label="Password" value={form.password} onChangeText={(v) => setForm((p) => ({ ...p, password: v }))} secureTextEntry placeholder="••••••••" onSubmitEditing={submit} />
      {error ? <Text style={styles.error} testID="admin-login-error">{error}</Text> : null}
      <PrimaryButton testID="admin-login" onPress={submit} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</PrimaryButton>
    </GlassCard>
  </ScrollView></KeyboardAvoidingView></View>;

  const s = stats.data;
  return <View style={styles.root}>
    <ScreenHeader eyebrow={`SIGNED IN · ${email.toUpperCase()}`} title="Admin panel" right={<Pressable testID="admin-logout" onPress={() => logout()} style={styles.logout}><Text style={styles.logoutText}>Log out</Text></Pressable>} />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={stats.isRefetching} onRefresh={() => stats.refetch()} tintColor={colors.brand} />}>
      <View style={styles.statsGrid}>
        <Stat label="Pending bookings" value={s?.reservations_pending} accent />
        <Stat label="Open enquiries" value={s?.inquiries_pending} />
        <Stat label="Redeemed · 24h" value={s?.redemptions_today} />
        <Stat label="Members" value={s?.customers} />
        <Stat label="App devices" value={s?.app_devices} />
        <Stat label="Live offers" value={s?.offers} />
      </View>
      <SectionTitle eyebrow="MANAGE" title="Everything in the app" />
      {SECTIONS.map((section) => <Pressable key={section.key} testID={`admin-section-${section.key}`} onPress={() => router.push(section.route)} style={styles.rowCard}>
        <View style={styles.rowIcon}><AppIcon name={section.icon} color={colors.brand} /></View>
        <View style={styles.rowCopy}><Text style={styles.rowTitle}>{section.title}</Text><Text style={styles.rowBody}>{section.body}</Text></View>
        <AppIcon name="chevron.right" color={colors.muted} />
      </Pressable>)}
      <PasswordCard />
    </ScrollView>
  </View>;
}

function Stat({ label, value, accent }: { label: string; value?: number; accent?: boolean }) { const styles = useStyles(); return <View style={[styles.stat, accent && styles.statAccent]}><Text style={[styles.statValue, accent && styles.statValueAccent]}>{value ?? "—"}</Text><Text style={[styles.statLabel, accent && styles.statValueAccent]}>{label}</Text></View>; }

function PasswordCard() {
  const styles = useStyles();
  const [open, setOpen] = useState(false); const [form, setForm] = useState({ current: "", next: "" }); const [msg, setMsg] = useState("");
  const save = async () => { try { await adminApi.changePassword(form.current, form.next); setMsg("Password updated."); setForm({ current: "", next: "" }); } catch (err) { setMsg(err instanceof Error ? err.message : "Could not update."); } };
  return <GlassCard style={styles.passwordCard}><Pressable testID="admin-password-toggle" onPress={() => setOpen((v) => !v)} style={styles.passwordHead}><Text style={styles.rowTitle}>Change staff password</Text><AppIcon name={open ? "xmark" : "chevron.right"} /></Pressable>{open ? <View style={styles.passwordBody}><Field label="Current password" value={form.current} onChangeText={(v) => setForm((p) => ({ ...p, current: v }))} secureTextEntry /><Field label="New password (8+ characters)" value={form.next} onChangeText={(v) => setForm((p) => ({ ...p, next: v }))} secureTextEntry />{msg ? <Text style={styles.msg}>{msg}</Text> : null}<PrimaryButton onPress={save}>Update password</PrimaryButton></View> : null}</GlassCard>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, flex: { flex: 1 }, center: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }, content: { paddingHorizontal: 18 },
  loginCard: { marginTop: 10, padding: 22 }, lockIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }, loginTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "800", marginTop: 16 }, loginBody: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 20 }, error: { color: colors.error, fontSize: 13, fontWeight: "700", marginBottom: 10 },
  logout: { minHeight: 40, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, logoutText: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 26, marginTop: 4 }, stat: { width: "31%", flexGrow: 1, padding: 14, borderRadius: 14, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }, statAccent: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }, statValue: { color: colors.brand, fontSize: 24, fontWeight: "900" }, statValueAccent: { color: colors.onBrandPrimary }, statLabel: { color: colors.muted, fontSize: 11, marginTop: 4, fontWeight: "700" },
  rowCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, marginBottom: 10, minHeight: 72 }, rowIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }, rowCopy: { flex: 1 }, rowTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, rowBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  passwordCard: { marginTop: 16, padding: 16 }, passwordHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 32 }, passwordBody: { marginTop: 16 }, msg: { color: colors.brand, fontSize: 13, marginBottom: 10, fontWeight: "700" },
}));
