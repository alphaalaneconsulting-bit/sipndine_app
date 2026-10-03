import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api";
import { AppIcon, GlassCard, PrimaryButton, SectionTitle, StatusPill } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function AccountScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const { customer, signOut } = useSession();
  const [signInOpen, setSignInOpen] = useState(false);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const reservations = useQuery({ queryKey: ["my-reservations", customer?.customer_id], queryFn: () => api.myReservations(customer!.customer_id), enabled: Boolean(customer) });

  const confirmSignOut = () => {
    if (Platform.OS === "web") { signOut(); return; }
    Alert.alert("Log out?", "You can sign back in anytime with the same email.", [{ text: "Stay", style: "cancel" }, { text: "Log out", style: "destructive", onPress: () => signOut() }]);
  };

  if (!customer) return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: 28 + bottomChrome }]}>
    <Text style={styles.eyebrow}>SIP ’N’ DINE · MEMBERS</Text>
    <Text style={styles.title}>Sign in to get your discount.</Text>
    <Text style={styles.subtitle}>Browsing is free. Sign in once with your name, email and mobile to book tables, order takeaway and redeem member privileges.</Text>
    <View style={styles.lockCard}>
      <AppIcon name="lock.shield.fill" size={30} color={colors.brand} />
      <Text style={styles.lockTitle}>Personal, verified privileges</Text>
      <Text style={styles.lockBody}>Every discount code is tied to your account, lasts 60 seconds and can be used once — so your privileges stay yours.</Text>
      <PrimaryButton testID="account-sign-in" onPress={() => setSignInOpen(true)} style={styles.joinButton}>Sign in · Get your discount</PrimaryButton>
    </View>
    <View style={styles.benefits}>
      <SectionTitle eyebrow="WHAT YOU GET" title="Built for better visits" />
      <Benefit icon="checkmark.seal.fill" title="Verified savings" body="No static vouchers. Your code is tied to your account and redeemed once at the table." />
      <Benefit icon="calendar" title="Faster bookings" body="Your details are remembered, so booking a table takes seconds." />
      <Benefit icon="bell.fill" title="First to know" body="Event notes and festival greetings from the house." />
    </View>
  </ScrollView><SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} /></View>;

  return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: 28 + bottomChrome }]}>
    <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
    <Text style={styles.title}>Welcome, {customer.name.split(" ")[0]}.</Text>
    <View style={styles.memberCard}>
      <View style={styles.cardShine} />
      <View style={styles.memberCardTop}><Text style={styles.cardBrand}>SIP ’N’ DINE</Text><AppIcon name="wave.3.right" size={24} color={colors.brand} /></View>
      <Text style={styles.memberName}>{customer.name.toUpperCase()}</Text>
      <View style={styles.memberCardBottom}>
        <View><Text style={styles.cardLabel}>MEMBER TIER</Text><Text style={styles.cardValue}>{customer.tier}</Text></View>
        <View><Text style={styles.cardLabel}>POINTS</Text><Text style={styles.cardValue}>{customer.points.toLocaleString()}</Text></View>
        <View><Text style={styles.cardLabel}>MOBILE</Text><Text style={styles.cardValue}>{customer.phone}</Text></View>
      </View>
    </View>
    <View style={styles.section}>
      <SectionTitle eyebrow="QUICK ACTIONS" title="Everything in one place" />
      <ActionRow testID="account-offers" icon="qrcode" title="Generate a visit code" body="Open an eligible offer and create a single-use code at the table." onPress={() => router.push("/offers")} />
      <ActionRow testID="account-reserve" icon="calendar" title="Book a table" body="Reserve for lunch or dinner in under a minute." onPress={() => router.push("/reserve")} />
      <ActionRow testID="account-membership" icon="wallet.pass.fill" title="Membership & tier" body="See your progress and privileges." onPress={() => router.push("/membership")} />
    </View>
    <View style={styles.section}>
      <SectionTitle eyebrow="YOUR BOOKINGS" title="Table requests" />
      {reservations.data?.length ? reservations.data.map((r) => <GlassCard key={r.reservation_id} style={styles.booking}><View style={styles.bookingHead}><Text style={styles.bookingTitle}>{r.date} · {r.time}</Text><StatusPill label={r.status} tone={r.status === "Confirmed" ? "success" : r.status === "Declined" ? "muted" : "brand"} /></View><Text style={styles.bookingBody}>{r.party_size} guests{r.occasion ? ` · ${r.occasion}` : ""}</Text></GlassCard>) : <Text style={styles.empty}>No table requests yet.</Text>}
    </View>
    <Pressable testID="account-logout" onPress={confirmSignOut} style={styles.logout}><AppIcon name="rectangle.portrait.and.arrow.right" color={colors.error} size={18} /><Text style={styles.logoutText}>Log out</Text></Pressable>
    <Text style={styles.legal}>Signed in as {customer.email}. Your details stay with Sip ’n’ Dine.</Text>
  </ScrollView></View>;
}

function Benefit({ icon, title, body }: { icon: string; title: string; body: string }) { const styles = useStyles(); const { colors } = useTheme(); return <View style={styles.benefit}><View style={styles.benefitIcon}><AppIcon name={icon} size={18} color={colors.brand} /></View><View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitBody}>{body}</Text></View></View>; }
function ActionRow({ icon, title, body, onPress, testID }: { icon: string; title: string; body: string; onPress: () => void; testID: string }) { const styles = useStyles(); const { colors } = useTheme(); return <Pressable testID={testID} onPress={onPress}><GlassCard style={styles.actionCard}><View style={styles.actionIcon}><AppIcon name={icon} color={colors.brand} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionBody}>{body}</Text></View><AppIcon name="chevron.right" color={colors.muted} /></GlassCard></Pressable>; }

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { color: colors.onSurface, fontSize: 30, fontWeight: "800", marginTop: 10 }, subtitle: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  lockCard: { marginTop: 30, padding: 22, backgroundColor: colors.brandTertiary, borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong }, lockTitle: { color: colors.onSurface, fontSize: 21, fontWeight: "800", marginTop: 18 }, lockBody: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 }, joinButton: { marginTop: 20 },
  benefits: { marginTop: 38 }, benefit: { flexDirection: "row", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider }, benefitIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary, justifyContent: "center", alignItems: "center", marginRight: 12 }, benefitCopy: { flex: 1 }, benefitTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, benefitBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  memberCard: { overflow: "hidden", minHeight: 220, borderRadius: 24, backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.borderStrong, padding: 22, marginTop: 24, justifyContent: "space-between" }, cardShine: { position: "absolute", width: 230, height: 230, borderRadius: 115, top: -80, right: -55, backgroundColor: colors.brandSecondary, opacity: 0.17 }, memberCardTop: { flexDirection: "row", justifyContent: "space-between" }, cardBrand: { color: colors.brand, fontSize: 12, letterSpacing: 1.6, fontWeight: "900" }, memberName: { color: colors.onSurface, fontSize: 20, letterSpacing: 1.3, fontWeight: "800", marginVertical: 20 }, memberCardBottom: { flexDirection: "row", gap: 28, flexWrap: "wrap" }, cardLabel: { color: colors.onSurfaceTertiary, fontSize: 10, letterSpacing: 1.1 }, cardValue: { color: colors.onSurface, fontSize: 14, fontWeight: "800", marginTop: 5 },
  section: { marginTop: 32 }, actionCard: { flexDirection: "row", alignItems: "center", marginBottom: 12, padding: 15 }, actionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginRight: 12 }, actionCopy: { flex: 1 }, actionTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, actionBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  booking: { marginBottom: 10, padding: 14 }, bookingHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, bookingTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, bookingBody: { color: colors.muted, fontSize: 12, marginTop: 6 }, empty: { color: colors.muted, fontSize: 13 },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.error, marginTop: 34 }, logoutText: { color: colors.error, fontWeight: "800", fontSize: 14 }, legal: { color: colors.muted, textAlign: "center", fontSize: 12, marginTop: 14 },
}));
