import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, type Offer, type Redemption } from "@/src/api";
import { GlassCard, PrimaryButton, RemoteImage, ScreenHeader, StatusPill } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { useHome } from "@/src/content";

export default function OffersScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const { customer } = useSession();
  const home = useHome();
  const offers = useMemo(() => home.data?.offers ?? [], [home.data]);
  const filters = useMemo(() => ["All", ...Array.from(new Set(offers.map((o) => o.kind)))], [offers]);
  const [filter, setFilter] = useState("All"); const [signInOpen, setSignInOpen] = useState(false); const [redemption, setRedemption] = useState<Redemption | null>(null); const [seconds, setSeconds] = useState(0); const [error, setError] = useState(""); const [claiming, setClaiming] = useState("");
  useEffect(() => { if (!redemption) return; const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(redemption.expires_at).getTime() - Date.now()) / 1000))); tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, [redemption]);
  const visible = filter === "All" ? offers : offers.filter((offer) => offer.kind === filter);
  const claim = async (offer: Offer) => { if (!customer) { setSignInOpen(true); return; } try { setError(""); setClaiming(offer.offer_id); const next = await api.claim(offer.offer_id, customer.customer_id); setRedemption(next); } catch (err) { setError(err instanceof Error ? err.message : "Could not generate your code."); } finally { setClaiming(""); } };
  return <View style={styles.root}>
    <ScreenHeader eyebrow="THE PRIVILEGE EDIT" title="Offers & combos" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.subtitle}>Every offer is tied to your account and redeemed once per visit with a live 60-second code.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((item) => <Pressable key={item} testID={`offer-filter-${item.toLowerCase()}`} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      {home.isLoading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : <View style={styles.list}>{visible.map((offer) => <GlassCard key={offer.offer_id} style={styles.offer}>
        <RemoteImage path={offer.image} style={styles.offerImage} icon="tag.fill" />
        <View style={styles.offerBody}>
          <View style={styles.offerTop}><StatusPill label={offer.kind} /><Text style={styles.validity}>{offer.validity}</Text></View>
          <Text style={styles.discount}>{offer.discount}</Text>
          <Text style={styles.offerTitle}>{offer.title}</Text>
          <Text style={styles.offerSub}>{offer.subtitle}</Text>
          {offer.terms ? <Text style={styles.terms}>{offer.terms}</Text> : null}
          <PrimaryButton testID={`offer-claim-${offer.offer_id}`} onPress={() => claim(offer)} disabled={claiming === offer.offer_id} style={styles.claim}>{claiming === offer.offer_id ? "Generating…" : customer ? "Generate single-use code" : "Get your discount"}</PrimaryButton>
        </View>
      </GlassCard>)}</View>}
      {error ? <Text style={styles.error} testID="offer-error">{error}</Text> : null}
      <View style={styles.security}><Text style={styles.securityTitle}>Protected by the house</Text><Text style={styles.securityBody}>{home.data?.settings.discount_terms ?? "Codes are unique to you, valid for 60 seconds and marked redeemed at the counter."}</Text></View>
    </ScrollView>
    <SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} />
    <Modal visible={Boolean(redemption)} transparent animationType="fade" onRequestClose={() => setRedemption(null)}><View style={styles.modalBackdrop}><View style={styles.codeModal} testID="redemption-modal"><StatusPill label={seconds > 0 ? `Active · ${seconds}s` : "Expired"} tone={seconds > 0 ? "success" : "muted"} /><Text style={styles.codeEyebrow}>SHOW THIS TO YOUR HOST</Text><Text style={styles.codeTitle}>{redemption?.offer_title}</Text><Text style={styles.code}>{seconds > 0 ? redemption?.code : "— — — — — —"}</Text><Text style={styles.codeHint}>{seconds > 0 ? redemption?.instruction : "This code has expired. Generate a new one to try again."}</Text><Pressable testID="redemption-done" onPress={() => setRedemption(null)} style={styles.closeButton}><Text style={styles.closeButtonText}>Done</Text></Pressable></View></View></Modal>
  </View>;
}

const useStyles = makeStyles((colors) => ({ root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 }, subtitle: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 21, marginTop: 4 }, filters: { gap: 8, paddingVertical: 20 }, filter: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surfaceTertiary }, filterActive: { backgroundColor: colors.brandPrimary }, filterText: { color: colors.onSurfaceTertiary, fontSize: 13, fontWeight: "700" }, filterTextActive: { color: colors.onBrandPrimary }, loader: { marginTop: 40 }, list: { gap: 14 }, offer: { padding: 0, overflow: "hidden" }, offerImage: { width: "100%", height: 150 }, offerBody: { padding: 18 }, offerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, validity: { color: colors.muted, fontSize: 11, maxWidth: 170, textAlign: "right" }, discount: { color: colors.brand, fontSize: 30, fontWeight: "900", marginTop: 16 }, offerTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "800", marginTop: 4 }, offerSub: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 }, terms: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }, claim: { marginTop: 16 }, error: { color: colors.error, marginTop: 18, fontSize: 13, fontWeight: "700" }, security: { borderLeftWidth: 2, borderLeftColor: colors.brand, paddingLeft: 14, marginTop: 34 }, securityTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 14 }, securityBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, modalBackdrop: { flex: 1, backgroundColor: colors.scrimStrong, justifyContent: "center", padding: 20 }, codeModal: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 24, padding: 24, alignItems: "center" }, codeEyebrow: { color: colors.brand, fontWeight: "800", letterSpacing: 1.4, fontSize: 11, marginTop: 24 }, codeTitle: { color: colors.onSurface, fontSize: 21, fontWeight: "800", marginTop: 10, textAlign: "center" }, code: { color: colors.brand, fontSize: 37, letterSpacing: 8, fontWeight: "900", marginTop: 26 }, codeHint: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 18 }, closeButton: { marginTop: 24, minHeight: 48, minWidth: 130, borderRadius: 14, backgroundColor: colors.brandPrimary, justifyContent: "center", alignItems: "center" }, closeButtonText: { color: colors.onBrandPrimary, fontWeight: "800" } }));
