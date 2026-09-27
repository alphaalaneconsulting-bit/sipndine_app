import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, type GalleryItem, type Offer, type NotificationItem } from "@/src/api";
import { GoldHero, GlassCard, SectionTitle, StatusPill, AppIcon } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { customer } = useSession();
  const [data, setData] = useState<{ hero: { eyebrow: string; title: string; caption: string }; offers: Offer[]; gallery: GalleryItem[]; notifications: NotificationItem[] } | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  useEffect(() => { api.home().then(setData).catch(() => setData(null)); }, []);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  if (!data) return <View style={[styles.loading, { paddingTop: insets.top }]}><ActivityIndicator color={colors.brand} size="large" /><Text style={styles.loadingText}>Setting the table…</Text></View>;
  return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 28 + bottomChrome }]} showsVerticalScrollIndicator={false}>
    <View style={styles.topbar}><View><Text style={styles.kicker}>SIP ’N’ DINE</Text><Text style={styles.welcome}>{customer ? `Good evening, ${customer.name.split(" ")[0]}.` : "Good evening."}</Text></View><Pressable testID="home-notifications" onPress={() => router.push("/(tabs)/more")} style={styles.bell} accessibilityLabel="Open notifications"><AppIcon name="bell.fill" color={colors.brand} /></Pressable></View>
    <GoldHero {...data.hero}>{customer ? <View style={styles.heroMember}><StatusPill label={`${customer.tier} member · ${customer.points.toLocaleString()} points`} /><Text style={styles.heroMemberText}>Your privileges are ready whenever you are.</Text></View> : <Pressable onPress={() => setSignInOpen(true)} style={styles.heroLink}><Text style={styles.heroLinkText}>Join the club · save on every visit →</Text></Pressable>}</GoldHero>
    <View style={styles.section}><SectionTitle eyebrow="CURATED FOR YOU" title="What's on the table" action="See all" onAction={() => router.push("/(tabs)/offers")} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {data.offers.slice(0, 3).map((offer) => <Pressable key={offer.offer_id} onPress={() => router.push("/(tabs)/offers")}><GlassCard style={styles.offerCard}><StatusPill label={offer.kind} /><Text style={styles.offerDiscount}>{offer.discount}</Text><Text style={styles.offerTitle}>{offer.title}</Text><Text style={styles.offerSub}>{offer.subtitle}</Text></GlassCard></Pressable>)}
    </ScrollView></View>
    <View style={styles.section}><SectionTitle eyebrow="THE HOUSE, TOLD BEAUTIFULLY" title="Promotion gallery" action="Explore" onAction={() => router.push("/(tabs)/more")} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{data.gallery.map((item, index) => <Pressable key={item.gallery_id} onPress={() => router.push("/(tabs)/more")}><View style={[styles.galleryCard, index === 1 && styles.galleryAlt]}><AppIcon name={item.symbol} size={24} color={colors.brand} /><Text style={styles.galleryEyebrow}>{item.eyebrow}</Text><Text style={styles.galleryTitle}>{item.title}</Text><Text style={styles.galleryCaption}>{item.caption}</Text></View></Pressable>)}</ScrollView></View>
    <View style={styles.section}><SectionTitle eyebrow="A LITTLE NOTE FROM US" title="Coming up" /><GlassCard><View style={styles.noteHead}><AppIcon name="sparkles" color={colors.brand} /><StatusPill label={`${data.notifications.length} new`} tone="success" /></View><Text style={styles.noteTitle}>{data.notifications[0]?.title ?? "New experiences are on their way."}</Text><Text style={styles.noteBody}>{data.notifications[0]?.body ?? "Check back soon for the next announcement from the house."}</Text><Pressable onPress={() => router.push("/(tabs)/more")}><Text style={styles.noteLink}>View notifications →</Text></Pressable></GlassCard></View>
  </ScrollView><SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} /></View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 }, loading: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }, loadingText: { color: colors.muted, marginTop: 12 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }, kicker: { color: colors.brand, fontSize: 11, letterSpacing: 1.8, fontWeight: "800" }, welcome: { color: colors.onSurface, fontSize: 24, fontWeight: "700", marginTop: 5 }, bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  heroMember: { marginTop: 16 }, heroMemberText: { color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 8 }, heroLink: { marginTop: 16, alignSelf: "flex-start" }, heroLinkText: { color: colors.brand, fontWeight: "800", fontSize: 13 }, section: { marginTop: 32 }, row: { gap: 12, paddingRight: 18 }, offerCard: { width: 190, minHeight: 170 }, offerDiscount: { color: colors.brand, fontSize: 24, fontWeight: "800", marginTop: 16 }, offerTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "800", marginTop: 6 }, offerSub: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  galleryCard: { width: 210, height: 170, borderRadius: 20, padding: 18, justifyContent: "flex-end", backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.borderStrong }, galleryAlt: { backgroundColor: colors.surfaceTertiary }, galleryEyebrow: { color: colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 16 }, galleryTitle: { color: colors.onSurface, fontSize: 17, fontWeight: "800", marginTop: 6 }, galleryCaption: { color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 4 }, noteHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, noteTitle: { color: colors.onSurface, fontSize: 19, fontWeight: "800", marginTop: 18 }, noteBody: { color: colors.onSurfaceSecondary, lineHeight: 20, fontSize: 14, marginTop: 8 }, noteLink: { color: colors.brand, fontWeight: "800", fontSize: 13, marginTop: 18 },
}));