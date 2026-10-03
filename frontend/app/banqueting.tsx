import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api, type Manager } from "@/src/api";
import { AppIcon, Field, GlassCard, PrimaryButton, RemoteImage, ScreenHeader, SectionTitle, StatusPill } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { useHome, whatsappUrl } from "@/src/content";

export default function BanquetingScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const { customer } = useSession();
  const managers = useQuery({ queryKey: ["managers"], queryFn: api.managers });
  const home = useHome();
  const [selected, setSelected] = useState<Manager | null>(null); const [signInOpen, setSignInOpen] = useState(false); const [sent, setSent] = useState(""); const [form, setForm] = useState({ offering: "Banqueting", date: "", guests: "", note: "" }); const [busy, setBusy] = useState(false);
  const banquetImage = home.data?.gallery.find((g) => g.gallery_id === "gallery-banquet")?.image ?? home.data?.gallery[0]?.image;
  const submit = async () => { if (!selected) return; if (!customer) { setSignInOpen(true); return; } setBusy(true); try { const response = await api.inquiry({ customer_id: customer.customer_id, manager_id: selected.manager_id, offering: form.offering, date: form.date || "To be confirmed", guests: form.guests || "To be confirmed", note: form.note }); setSent(response.message); setSelected(null); setForm({ offering: "Banqueting", date: "", guests: "", note: "" }); } catch (err) { setSent(err instanceof Error ? err.message : "The manager desk is currently unavailable."); } finally { setBusy(false); } };
  return <View style={styles.root}>
    <ScreenHeader eyebrow="CELEBRATIONS & CORPORATE" title="Banqueting & catering" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}><RemoteImage path={banquetImage} style={styles.heroImage} icon="person.3.fill" /><View style={styles.heroOverlay} /><View style={styles.heroCopy}><Text style={styles.heroEyebrow}>20 TO 200 GUESTS</Text><Text style={styles.heroTitle}>Weddings, receptions, team dinners and our kitchen at your address.</Text></View></View>
      <View style={styles.section}>
        <SectionTitle eyebrow="YOUR CONCIERGE DESK" title="Talk to a manager" />
        <Text style={styles.sectionIntro}>Pick the person for your plan. Enquiries need a quick sign-in so we can reach you back.</Text>
        {managers.data ? managers.data.map((manager) => <GlassCard key={manager.manager_id} style={styles.manager}>
          <View style={styles.managerHead}><View style={styles.avatar}><Text style={styles.avatarText}>{manager.name.split(" ").map((part) => part[0]).join("")}</Text></View><View style={styles.managerIdentity}><Text style={styles.managerName}>{manager.name}</Text><Text style={styles.managerRole}>{manager.role}</Text><StatusPill label={manager.status} tone="success" /></View></View>
          <Text style={styles.managerSpecialty}>{manager.specialty}</Text>
          <View style={styles.managerActions}>
            <Pressable testID={`manager-call-${manager.manager_id}`} onPress={() => Linking.openURL(`tel:${manager.phone}`)} style={styles.secondaryButton}><AppIcon name="phone.fill" size={16} color={colors.brand} /><Text style={styles.secondaryText}>Call</Text></Pressable>
            <Pressable testID={`manager-whatsapp-${manager.manager_id}`} onPress={() => Linking.openURL(whatsappUrl(manager.whatsapp, `Hello ${manager.name.split(" ")[0]}, I'd like to enquire about ${manager.role.toLowerCase()} at Sip 'n' Dine.`))} style={styles.secondaryButton}><AppIcon name="message.fill" size={16} color={colors.brand} /><Text style={styles.secondaryText}>WhatsApp</Text></Pressable>
            <PrimaryButton testID={`manager-enquire-${manager.manager_id}`} onPress={() => (customer ? setSelected(manager) : setSignInOpen(true))} style={styles.enquire}>Enquire</PrimaryButton>
          </View>
        </GlassCard>) : <ActivityIndicator color={colors.brand} />}
      </View>
      <View style={styles.section}>
        <SectionTitle eyebrow="WHAT WE OFFER" title="Every way to celebrate" />
        {[["Private dining", "The floral-wall nook seats 8–12 for intimate dinners."], ["Banquet floor", "Receptions, sangeets and corporate evenings for up to 200."], ["Catering", "Awadhi & Punjabi menus, live counters and service staff at your venue."], ["Packages", "Per-person menus from ₹750 (non-alcoholic) and ₹1,400 (with bar)."]].map(([title, body]) => <View key={title} style={styles.offerRow}><View style={styles.dot} /><View style={styles.offerCopy}><Text style={styles.offerTitle}>{title}</Text><Text style={styles.offerBody}>{body}</Text></View></View>)}
      </View>
    </ScrollView>
    <SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} title="Sign in to enquire." copy="Share your name, email and mobile once so our manager can get back to you." />
    <Modal visible={Boolean(selected) && !signInOpen} transparent animationType="slide" onRequestClose={() => setSelected(null)}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetBackdrop}><View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} testID="manager-enquiry-sheet"><View style={styles.sheetHeader}><View><Text style={styles.eyebrow}>DIRECT ENQUIRY</Text><Text style={styles.sheetTitle}>{selected?.name}</Text></View><Pressable testID="manager-enquiry-close" onPress={() => setSelected(null)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View><Text style={styles.sheetCopy}>Tell us a little about what you are planning. We’ll reach you on {customer?.phone}.</Text><Field testID="inquiry-offering" label="What are you planning?" value={form.offering} onChangeText={(v) => setForm((p) => ({ ...p, offering: v }))} placeholder="Banqueting · Catering · Private dining" /><Field testID="inquiry-date" label="Preferred date" value={form.date} onChangeText={(v) => setForm((p) => ({ ...p, date: v }))} placeholder="e.g. 14 Dec" /><Field testID="inquiry-guests" label="Number of guests" value={form.guests} onChangeText={(v) => setForm((p) => ({ ...p, guests: v }))} placeholder="e.g. 80" keyboardType="number-pad" /><Field testID="inquiry-note" label="Anything else?" value={form.note} onChangeText={(v) => setForm((p) => ({ ...p, note: v }))} placeholder="Occasion, menu preferences, budget" multiline /><PrimaryButton testID="inquiry-submit" onPress={submit} disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</PrimaryButton></View></KeyboardAvoidingView></Modal>
    {sent ? <View style={[styles.toast, { bottom: insets.bottom + 18 }]}><AppIcon name="checkmark.circle.fill" color={colors.onSuccess} /><Text style={styles.toastText}>{sent}</Text><Pressable testID="toast-close" onPress={() => setSent("")}><Text style={styles.toastClose}>×</Text></Pressable></View> : null}
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 }, eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  heroCard: { height: 200, borderRadius: 22, overflow: "hidden", backgroundColor: colors.surfaceSecondary, marginTop: 6 }, heroImage: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }, heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }, heroCopy: { flex: 1, justifyContent: "flex-end", padding: 18 }, heroEyebrow: { color: colors.brand, fontSize: 10, letterSpacing: 1.5, fontWeight: "800" }, heroTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "800", marginTop: 6, lineHeight: 26 },
  section: { marginTop: 30 }, sectionIntro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: -4, marginBottom: 14 },
  manager: { marginBottom: 12, padding: 16 }, managerHead: { flexDirection: "row" }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandTertiary, justifyContent: "center", alignItems: "center", marginRight: 12 }, avatarText: { color: colors.brand, fontWeight: "900" }, managerIdentity: { flex: 1 }, managerName: { color: colors.onSurface, fontSize: 16, fontWeight: "800" }, managerRole: { color: colors.muted, fontSize: 12, marginTop: 3, marginBottom: 8 }, managerSpecialty: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19, marginTop: 16 }, managerActions: { flexDirection: "row", gap: 8, marginTop: 16, alignItems: "center" }, secondaryButton: { height: 44, minWidth: 44, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 6 }, secondaryText: { color: colors.onSurfaceSecondary, fontWeight: "700", fontSize: 12 }, enquire: { flex: 1, height: 44, minHeight: 44 },
  offerRow: { flexDirection: "row", gap: 12, marginBottom: 14 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 7 }, offerCopy: { flex: 1 }, offerTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, offerBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  sheetBackdrop: { flex: 1, backgroundColor: colors.scrimStrong, justifyContent: "flex-end" }, sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, borderTopWidth: 1, borderColor: colors.borderStrong }, sheetHeader: { flexDirection: "row", justifyContent: "space-between" }, sheetTitle: { color: colors.onSurface, fontSize: 24, fontWeight: "800", marginTop: 7 }, sheetCopy: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20, marginTop: 12, marginBottom: 16 }, close: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }, closeText: { color: colors.onSurface, fontSize: 26 },
  toast: { position: "absolute", left: 18, right: 18, backgroundColor: colors.success, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }, toastText: { color: colors.onSuccess, flex: 1, fontSize: 13, lineHeight: 18 }, toastClose: { color: colors.onSuccess, fontSize: 22 },
}));
