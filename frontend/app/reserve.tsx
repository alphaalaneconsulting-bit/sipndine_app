import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/api";
import { AppIcon, Field, GlassCard, PrimaryButton, RemoteImage, ScreenHeader, SectionTitle } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { useHome, whatsappUrl } from "@/src/content";

const SLOTS = ["12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM"];
const OCCASIONS = ["Casual", "Birthday", "Anniversary", "Business", "Family"];

export default function ReserveScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const { customer } = useSession();
  const settings = useHome().data?.settings; const queryClient = useQueryClient();
  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return { key: d.toDateString(), label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }), sub: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) }; }), []);
  const [date, setDate] = useState(days[0].key); const [time, setTime] = useState("8:00 PM"); const [party, setParty] = useState(2); const [occasion, setOccasion] = useState("Casual"); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState<{ message: string } | null>(null); const [signInOpen, setSignInOpen] = useState(!customer);
  const dateLabel = days.find((d) => d.key === date); const prettyDate = dateLabel ? `${dateLabel.label}, ${dateLabel.sub}` : date;
  const submit = async () => {
    if (!customer) { setSignInOpen(true); return; }
    setBusy(true); setError("");
    try { const res = await api.reserve({ customer_id: customer.customer_id, date: prettyDate, time, party_size: String(party), occasion, note }); setDone(res); queryClient.invalidateQueries({ queryKey: ["my-reservations"] }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not send your request."); } finally { setBusy(false); }
  };
  if (done) return <View style={styles.root}><ScreenHeader eyebrow="TABLE REQUEST SENT" title="See you soon." /><View style={[styles.content, { paddingBottom: insets.bottom + 28 }]}><GlassCard style={styles.doneCard} testID="reserve-success"><AppIcon name="checkmark.seal.fill" size={34} color={colors.brand} /><Text style={styles.doneTitle}>{prettyDate} · {time}</Text><Text style={styles.doneBody}>{party} guests · {occasion}</Text><Text style={styles.doneMessage}>{done.message}</Text>{settings ? <Pressable testID="reserve-whatsapp" onPress={() => Linking.openURL(whatsappUrl(settings.whatsapp, `Hello! I just requested a table for ${party} on ${prettyDate} at ${time} under ${customer?.name}. Could you confirm?`))} style={styles.waButton}><AppIcon name="message.fill" size={16} color={colors.brand} /><Text style={styles.waText}>Nudge us on WhatsApp</Text></Pressable> : null}<PrimaryButton testID="reserve-done" onPress={() => router.replace("/(tabs)/account")} style={styles.doneButton}>View my bookings</PrimaryButton></GlassCard></View></View>;
  return <View style={styles.root}>
    <ScreenHeader eyebrow="RESERVATIONS" title={settings?.book_title ?? "Book a table"} />
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.heroCard}><RemoteImage path={settings?.hero_image} style={styles.heroImage} /><View style={styles.heroOverlay} /><Text style={styles.heroText}>{settings?.book_caption}</Text></View>
      <SectionTitle eyebrow="WHEN" title="Pick a day" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{days.map((d) => <Pressable key={d.key} testID={`reserve-day-${d.label.toLowerCase()}`} onPress={() => setDate(d.key)} style={[styles.dayChip, date === d.key && styles.chipActive]}><Text style={[styles.dayLabel, date === d.key && styles.chipTextActive]}>{d.label}</Text><Text style={[styles.daySub, date === d.key && styles.chipTextActive]}>{d.sub}</Text></Pressable>)}</ScrollView>
      <View style={styles.block}><SectionTitle eyebrow="TIME" title="Lunch or dinner" /><View style={styles.wrap}>{SLOTS.map((s) => <Pressable key={s} testID={`reserve-time-${s.replace(/[^0-9]/g, "")}`} onPress={() => setTime(s)} style={[styles.chip, time === s && styles.chipActive]}><Text style={[styles.chipText, time === s && styles.chipTextActive]}>{s}</Text></Pressable>)}</View></View>
      <View style={styles.block}><SectionTitle eyebrow="WHO" title="Party size" /><View style={styles.partyRow}><Pressable testID="reserve-party-minus" onPress={() => setParty((p) => Math.max(1, p - 1))} style={styles.partyBtn}><Text style={styles.partyBtnText}>−</Text></Pressable><Text style={styles.partyValue}>{party}</Text><Pressable testID="reserve-party-plus" onPress={() => setParty((p) => Math.min(20, p + 1))} style={styles.partyBtn}><Text style={styles.partyBtnText}>+</Text></Pressable><Text style={styles.partyHint}>{party > 12 ? "For 12+ guests we'll suggest the banquet floor." : "guests"}</Text></View></View>
      <View style={styles.block}><SectionTitle eyebrow="OCCASION" title="Anything to celebrate?" /><View style={styles.wrap}>{OCCASIONS.map((o) => <Pressable key={o} testID={`reserve-occasion-${o.toLowerCase()}`} onPress={() => setOccasion(o)} style={[styles.chip, occasion === o && styles.chipActive]}><Text style={[styles.chipText, occasion === o && styles.chipTextActive]}>{o}</Text></Pressable>)}</View><Field testID="reserve-note" value={note} onChangeText={setNote} placeholder="Seating preference, allergies, a cake…" multiline /></View>
      <GlassCard style={styles.whoCard}><Text style={styles.whoLabel}>BOOKING FOR</Text>{customer ? <><Text style={styles.whoName}>{customer.name}</Text><Text style={styles.whoDetail}>{customer.phone} · {customer.email}</Text></> : <Pressable testID="reserve-sign-in" onPress={() => setSignInOpen(true)}><Text style={styles.whoLink}>Sign in to add your details →</Text></Pressable>}</GlassCard>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton testID="reserve-submit" onPress={submit} disabled={busy} style={styles.submit}>{busy ? "Sending…" : customer ? `Request table · ${time}` : "Sign in to request"}</PrimaryButton>
    </ScrollView></KeyboardAvoidingView>
    <SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} title="Sign in to book a table." copy="Share your name, email and mobile once — we'll use it to confirm your table on WhatsApp." />
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, flex: { flex: 1 }, content: { paddingHorizontal: 18 },
  heroCard: { height: 120, borderRadius: 18, overflow: "hidden", marginBottom: 22, justifyContent: "flex-end", backgroundColor: colors.surfaceSecondary }, heroImage: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }, heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }, heroText: { color: colors.onSurface, fontSize: 14, fontWeight: "700", padding: 16, lineHeight: 20 },
  chips: { gap: 8, paddingBottom: 4 }, dayChip: { minWidth: 86, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center" }, dayLabel: { color: colors.onSurface, fontWeight: "800", fontSize: 13 }, daySub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  block: { marginTop: 26 }, wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }, chip: { paddingHorizontal: 14, minHeight: 40, justifyContent: "center", borderRadius: 999, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }, chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }, chipText: { color: colors.onSurfaceSecondary, fontWeight: "700", fontSize: 13 }, chipTextActive: { color: colors.onBrandPrimary },
  partyRow: { flexDirection: "row", alignItems: "center", gap: 14 }, partyBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }, partyBtnText: { color: colors.brand, fontSize: 22, fontWeight: "800" }, partyValue: { color: colors.onSurface, fontSize: 26, fontWeight: "900", minWidth: 34, textAlign: "center" }, partyHint: { color: colors.muted, fontSize: 12, flex: 1 },
  whoCard: { marginTop: 10 }, whoLabel: { color: colors.brand, fontSize: 10, letterSpacing: 1.4, fontWeight: "800" }, whoName: { color: colors.onSurface, fontSize: 17, fontWeight: "800", marginTop: 8 }, whoDetail: { color: colors.muted, fontSize: 12, marginTop: 4 }, whoLink: { color: colors.brand, fontWeight: "800", marginTop: 8 },
  error: { color: colors.error, fontWeight: "700", marginTop: 14, fontSize: 13 }, submit: { marginTop: 20, minHeight: 52 },
  doneCard: { alignItems: "center", padding: 26, marginTop: 10 }, doneTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "800", marginTop: 16, textAlign: "center" }, doneBody: { color: colors.muted, fontSize: 13, marginTop: 6 }, doneMessage: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 16 }, waButton: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, minHeight: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, waText: { color: colors.brand, fontWeight: "800", fontSize: 13 }, doneButton: { marginTop: 14, alignSelf: "stretch" },
}));
