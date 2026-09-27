import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, type GalleryItem, type Offer, type NotificationItem } from "@/src/api";
import { GoldHero, GlassCard, SectionTitle, StatusPill, AppIcon } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

// Homepage tag grid, taken verbatim from the client's recommendations doc.
const HOMEPAGE_TAGS: { key: string; label: string; symbol: string; blurb: string; route: "/(tabs)/club" | "/(tabs)/offers" | "/(tabs)/more" }[] = [
  { key: "membership", label: "Membership", symbol: "wallet.pass.fill", blurb: "Digital privilege card", route: "/(tabs)/club" },
  { key: "offers", label: "Offers & combos", symbol: "tag.fill", blurb: "Buffet, combo, in-house", route: "/(tabs)/offers" },
  { key: "banqueting", label: "Banqueting & catering", symbol: "person.3.fill", blurb: "Talk to a manager", route: "/(tabs)/more" },
  { key: "gallery", label: "Gallery", symbol: "photo.on.rectangle.angled", blurb: "The house, told beautifully", route: "/(tabs)/more" },
  { key: "takeaway", label: "Take away order", symbol: "bag.fill", blurb: "Call to place · members save", route: "/(tabs)/more" },
  { key: "dinein", label: "Dine in", symbol: "fork.knife", blurb: "Book a table with a host", route: "/(tabs)/more" },
  { key: "menu", label: "Menu food & bar", symbol: "book.pages.fill", blurb: "Chef & mixologist picks", route: "/(tabs)/offers" },
  { key: "favorites", label: "Favorites & recommendations", symbol: "sparkles", blurb: "House choices for tonight", route: "/(tabs)/offers" },
  { key: "new", label: "New additions", symbol: "star.fill", blurb: "Fresh on the menu", route: "/(tabs)/offers" },
];

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
  const featureOffer = data.offers[0];
  return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: 28 + bottomChrome }]} showsVerticalScrollIndicator={false}>
    <View style={styles.topbar}>
      <View>
        <Text style={styles.kicker}>SIP ’N’ DINE</Text>
        <Text style={styles.welcome}>{customer ? `Good evening, ${customer.name.split(" ")[0]}.` : "Good evening."}</Text>
      </View>
      <Pressable testID="home-notifications" onPress={() => router.push("/(tabs)/more")} style={styles.bell} accessibilityLabel="Open notifications"><AppIcon name="bell.fill" color={colors.brand} /></Pressable>
    </View>

    <GoldHero {...data.hero}>
      {customer
        ? <View style={styles.heroMember}><StatusPill label={`${customer.tier} member · ${customer.points.toLocaleString()} points`} /><Text style={styles.heroMemberText}>Your privileges are ready whenever you are.</Text></View>
        : <Pressable testID="hero-get-discount" onPress={() => setSignInOpen(true)} style={styles.heroLink}><Text style={styles.heroLinkText}>Get ur discount · join free →</Text></Pressable>}
    </GoldHero>

    {featureOffer ? (
      <Pressable testID="home-promo-banner" onPress={() => router.push("/(tabs)/offers")} style={styles.promoBanner}>
        <View style={styles.promoLeft}>
          <Text style={styles.promoEyebrow}>PUSHED BY THE HOUSE</Text>
          <Text style={styles.promoTitle}>{featureOffer.title}</Text>
          <Text style={styles.promoSub}>{featureOffer.validity}</Text>
        </View>
        <View style={styles.promoRight}>
          <Text style={styles.promoDiscount}>{featureOffer.discount}</Text>
          <Text style={styles.promoAction}>Tap to redeem →</Text>
        </View>
      </Pressable>
    ) : null}

    <View style={styles.section}>
      <SectionTitle eyebrow="EVERYTHING IN ONE TAP" title="Explore the house" />
      <Text style={styles.tagsIntro}>Each tag opens the right section. Membership unlocks the offers and takeaway savings; managers reply to enquiries.</Text>
      <View style={styles.tagsGrid}>
        {HOMEPAGE_TAGS.map((tag) => (
          <Pressable key={tag.key} testID={`home-tag-${tag.key}`} onPress={() => router.push(tag.route)} style={styles.tagCard}>
            <View style={styles.tagIcon}><AppIcon name={tag.symbol} color={colors.brand} size={18} /></View>
            <Text style={styles.tagLabel}>{tag.label}</Text>
            <Text style={styles.tagBlurb}>{tag.blurb}</Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="CURATED FOR YOU" title="Favorites & recommendations" action="See all" onAction={() => router.push("/(tabs)/offers")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {data.offers.slice(0, 3).map((offer) => (
          <Pressable key={offer.offer_id} onPress={() => router.push("/(tabs)/offers")}>
            <GlassCard style={styles.offerCard}>
              <StatusPill label={offer.kind} />
              <Text style={styles.offerDiscount}>{offer.discount}</Text>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerSub}>{offer.subtitle}</Text>
            </GlassCard>
          </Pressable>
        ))}
      </ScrollView>
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="THE HOUSE, TOLD BEAUTIFULLY" title="Promotion gallery" action="Explore" onAction={() => router.push("/(tabs)/more")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {data.gallery.map((item, index) => (
          <Pressable key={item.gallery_id} onPress={() => router.push("/(tabs)/more")}>
            <View style={[styles.galleryCard, index === 1 && styles.galleryAlt]}>
              <AppIcon name={item.symbol} size={24} color={colors.brand} />
              <Text style={styles.galleryEyebrow}>{item.eyebrow}</Text>
              <Text style={styles.galleryTitle}>{item.title}</Text>
              <Text style={styles.galleryCaption}>{item.caption}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="A LITTLE NOTE FROM US" title="Coming up" />
      <GlassCard>
        <View style={styles.noteHead}><AppIcon name="sparkles" color={colors.brand} /><StatusPill label={`${data.notifications.length} new`} tone="success" /></View>
        <Text style={styles.noteTitle}>{data.notifications[0]?.title ?? "New experiences are on their way."}</Text>
        <Text style={styles.noteBody}>{data.notifications[0]?.body ?? "Check back soon for the next announcement from the house."}</Text>
        <Pressable onPress={() => router.push("/(tabs)/more")}><Text style={styles.noteLink}>View notifications →</Text></Pressable>
      </GlassCard>
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="FOR STAFF" title="Redeem a member's code" />
      <Pressable testID="home-admin-entry" onPress={() => router.push("/admin")} style={styles.adminEntry}>
        <View style={styles.adminIcon}><AppIcon name="qrcode.viewfinder" color={colors.brand} /></View>
        <View style={styles.adminCopy}>
          <Text style={styles.adminTitle}>Manager & host panel</Text>
          <Text style={styles.adminBody}>Verify a 60-second privilege code at the counter and mark it redeemed.</Text>
        </View>
        <AppIcon name="chevron.right" color={colors.muted} />
      </Pressable>
    </View>

    <Pressable testID="home-call-house" onPress={() => Linking.openURL("tel:+911234567890")} style={styles.callHouse}>
      <AppIcon name="phone.fill" color={colors.brand} size={16} />
      <Text style={styles.callHouseText}>Call the house · +91 12345 67890</Text>
    </Pressable>
  </ScrollView><SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} /></View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 18 },
  loading: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, marginTop: 12 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  kicker: { color: colors.brand, fontSize: 11, letterSpacing: 1.8, fontWeight: "800" },
  welcome: { color: colors.onSurface, fontSize: 24, fontWeight: "700", marginTop: 5 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  heroMember: { marginTop: 16 },
  heroMemberText: { color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 8 },
  heroLink: { marginTop: 16, alignSelf: "flex-start" },
  heroLinkText: { color: colors.brand, fontWeight: "800", fontSize: 13 },
  promoBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.brandPrimary, borderRadius: 18, padding: 16, marginTop: 18 },
  promoLeft: { flex: 1, paddingRight: 12 },
  promoEyebrow: { color: colors.onBrandPrimary, fontSize: 10, letterSpacing: 1.4, fontWeight: "800", opacity: 0.75 },
  promoTitle: { color: colors.onBrandPrimary, fontSize: 17, fontWeight: "800", marginTop: 4 },
  promoSub: { color: colors.onBrandPrimary, fontSize: 12, marginTop: 3, opacity: 0.85 },
  promoRight: { alignItems: "flex-end" },
  promoDiscount: { color: colors.onBrandPrimary, fontSize: 22, fontWeight: "900" },
  promoAction: { color: colors.onBrandPrimary, fontSize: 11, fontWeight: "700", marginTop: 4, opacity: 0.9 },
  section: { marginTop: 32 },
  row: { gap: 12, paddingRight: 18 },
  tagsIntro: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: -6, marginBottom: 12 },
  tagsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tagCard: { width: "31%", minHeight: 108, padding: 12, borderRadius: 14, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  tagIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  tagLabel: { color: colors.onSurface, fontSize: 12, fontWeight: "800", lineHeight: 15 },
  tagBlurb: { color: colors.muted, fontSize: 10, marginTop: 4, lineHeight: 13 },
  offerCard: { width: 190, minHeight: 170 },
  offerDiscount: { color: colors.brand, fontSize: 24, fontWeight: "800", marginTop: 16 },
  offerTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "800", marginTop: 6 },
  offerSub: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  galleryCard: { width: 210, height: 170, borderRadius: 20, padding: 18, justifyContent: "flex-end", backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.borderStrong },
  galleryAlt: { backgroundColor: colors.surfaceTertiary },
  galleryEyebrow: { color: colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 16 },
  galleryTitle: { color: colors.onSurface, fontSize: 17, fontWeight: "800", marginTop: 6 },
  galleryCaption: { color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 4 },
  noteHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noteTitle: { color: colors.onSurface, fontSize: 19, fontWeight: "800", marginTop: 18 },
  noteBody: { color: colors.onSurfaceSecondary, lineHeight: 20, fontSize: 14, marginTop: 8 },
  noteLink: { color: colors.brand, fontWeight: "800", fontSize: 13, marginTop: 18 },
  adminEntry: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, gap: 12 },
  adminIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  adminCopy: { flex: 1 },
  adminTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 14 },
  adminBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  callHouse: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 26, paddingVertical: 12 },
  callHouseText: { color: colors.brand, fontWeight: "800", fontSize: 13 },
}));
