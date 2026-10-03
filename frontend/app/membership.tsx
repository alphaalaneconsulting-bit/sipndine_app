import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AppIcon, GlassCard, PrimaryButton, ScreenHeader, SectionTitle, StatusPill } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { useHome } from "@/src/content";

const TIERS = [
  { name: "Signature", perk: "10% off à la carte · birthday dessert", from: "Joining" },
  { name: "Reserve", perk: "20% off à la carte · priority tables", from: "2,000 points" },
  { name: "Maison", perk: "30% off à la carte · private nook invites", from: "5,000 points" },
];

export default function MembershipScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const { customer } = useSession();
  const [signInOpen, setSignInOpen] = useState(false);
  const terms = useHome().data?.settings.discount_terms;
  return <View style={styles.root}>
    <ScreenHeader eyebrow="CUSTOMER PRIVILEGES CLUB" title="Membership" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
      {customer ? <View style={styles.memberCard}>
        <View style={styles.cardShine} />
        <View style={styles.memberCardTop}><Text style={styles.cardBrand}>SIP ’N’ DINE</Text><AppIcon name="wave.3.right" size={24} color={colors.brand} /></View>
        <Text style={styles.memberName}>{customer.name.toUpperCase()}</Text>
        <View style={styles.memberCardBottom}><View><Text style={styles.cardLabel}>MEMBER TIER</Text><Text style={styles.cardValue}>{customer.tier}</Text></View><View><Text style={styles.cardLabel}>POINTS</Text><Text style={styles.cardValue}>{customer.points.toLocaleString()}</Text></View></View>
      </View> : <View style={styles.lockCard}><AppIcon name="lock.shield.fill" size={30} color={colors.brand} /><Text style={styles.lockTitle}>Dine more, save more.</Text><Text style={styles.lockBody}>Sign in free with your name, email and mobile. Your digital card keeps every privilege personal, verified and ready at the counter.</Text><PrimaryButton testID="membership-join" onPress={() => setSignInOpen(true)} style={styles.joinButton}>Sign in · Get your discount</PrimaryButton></View>}

      {customer ? <GlassCard style={styles.progressCard}><View style={styles.progressHead}><Text style={styles.progressTitle}>Next tier, quietly closer</Text><StatusPill label={`${customer.points_to_next_tier} pts to go`} /></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(92, Math.max(12, (customer.points / (customer.points + customer.points_to_next_tier)) * 100))}%` }]} /></View><Text style={styles.progressCopy}>Every ₹100 on the bill earns 10 points. Points are added when your host verifies your code.</Text></GlassCard> : null}

      <View style={styles.section}>
        <SectionTitle eyebrow="THE TIERS" title="How privileges grow" />
        {TIERS.map((tier) => <View key={tier.name} style={[styles.tierRow, customer?.tier === tier.name && styles.tierActive]}><View style={styles.tierCopy}><Text style={styles.tierName}>{tier.name}</Text><Text style={styles.tierPerk}>{tier.perk}</Text></View><Text style={styles.tierFrom}>{tier.from}</Text></View>)}
      </View>

      <View style={styles.section}>
        <SectionTitle eyebrow="HOW IT WORKS" title="Redeem in three taps" />
        <Step n="1" title="Open an eligible offer" body="Offers & combos lists everything your tier unlocks today." />
        <Step n="2" title="Generate your live code" body="A 6-digit code appears for 60 seconds. It is yours alone." />
        <Step n="3" title="Show it to your host" body="Staff verify it once at billing. Screenshots and re-use don't work." />
        {terms ? <Text style={styles.terms}>{terms}</Text> : null}
      </View>

      {customer ? <PrimaryButton testID="membership-offers" onPress={() => router.push("/offers")} style={styles.cta}>See today’s offers</PrimaryButton> : null}
    </ScrollView>
    <SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} />
  </View>;
}

function Step({ n, title, body }: { n: string; title: string; body: string }) { const styles = useStyles(); return <View style={styles.step}><View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepBody}>{body}</Text></View></View>; }

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 },
  lockCard: { marginTop: 8, padding: 22, backgroundColor: colors.brandTertiary, borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong }, lockTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "800", marginTop: 18 }, lockBody: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 }, joinButton: { marginTop: 20 },
  memberCard: { overflow: "hidden", minHeight: 210, borderRadius: 24, backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.borderStrong, padding: 22, marginTop: 8, justifyContent: "space-between" }, cardShine: { position: "absolute", width: 230, height: 230, borderRadius: 115, top: -80, right: -55, backgroundColor: colors.brandSecondary, opacity: 0.17 }, memberCardTop: { flexDirection: "row", justifyContent: "space-between" }, cardBrand: { color: colors.brand, fontSize: 12, letterSpacing: 1.6, fontWeight: "900" }, memberName: { color: colors.onSurface, fontSize: 20, letterSpacing: 1.3, fontWeight: "800", marginVertical: 18 }, memberCardBottom: { flexDirection: "row", gap: 42 }, cardLabel: { color: colors.onSurfaceTertiary, fontSize: 10, letterSpacing: 1.1 }, cardValue: { color: colors.onSurface, fontSize: 14, fontWeight: "800", marginTop: 5 },
  progressCard: { marginTop: 14 }, progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, progressTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, progressTrack: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden", marginTop: 18 }, progressFill: { height: "100%", backgroundColor: colors.brandPrimary, borderRadius: 4 }, progressCopy: { color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 17 },
  section: { marginTop: 32 }, tierRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, marginBottom: 10 }, tierActive: { borderColor: colors.borderStrong, backgroundColor: colors.brandTertiary }, tierCopy: { flex: 1 }, tierName: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, tierPerk: { color: colors.muted, fontSize: 12, marginTop: 3 }, tierFrom: { color: colors.brand, fontWeight: "800", fontSize: 12 },
  step: { flexDirection: "row", gap: 12, marginBottom: 14 }, stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }, stepNumText: { color: colors.onBrandPrimary, fontWeight: "900" }, stepCopy: { flex: 1 }, stepTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, stepBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 3 }, terms: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  cta: { marginTop: 28 },
}));
