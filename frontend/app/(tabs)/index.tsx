import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { type MenuItem } from "@/src/api";
import { GlassCard, SectionTitle, StatusPill, AppIcon, RemoteImage } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { useHome } from "@/src/content";

const logo = require("../../assets/brand/logo.png");

const HOMEPAGE_TAGS: { key: string; label: string; symbol: string; blurb: string; route: Href }[] = [
  { key: "membership", label: "Membership", symbol: "wallet.pass.fill", blurb: "Your digital privilege card", route: "/membership" },
  { key: "offers", label: "Offers & combos", symbol: "tag.fill", blurb: "Buffet, combos, in-house", route: "/offers" },
  { key: "banqueting", label: "Banqueting & catering", symbol: "person.3.fill", blurb: "20 to 200 guests", route: "/banqueting" },
  { key: "takeaway", label: "Takeaway order", symbol: "takeoutbag.and.cup.and.straw.fill", blurb: "Order on WhatsApp · save 10%", route: "/menu?mode=takeaway" },
  { key: "dinein", label: "Dine-in menu", symbol: "fork.knife", blurb: "Awadhi & Punjabi classics", route: "/menu" },
  { key: "bar", label: "Food & bar", symbol: "wineglass.fill", blurb: "Signature cocktails", route: "/menu?category=Bar" },
  { key: "gallery", label: "Gallery", symbol: "photo.on.rectangle.angled", blurb: "The house, told beautifully", route: "/gallery" },
];

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { customer } = useSession();
  const home = useHome();
  const [signInOpen, setSignInOpen] = useState(false);
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const data = home.data;
  if (!data) return <View style={[styles.loading, { paddingTop: insets.top }]}><ActivityIndicator color={colors.brand} size="large" /><Text style={styles.loadingText}>{home.isError ? "Could not reach the house. Pull to retry." : "Setting the table…"}</Text></View>;
  const s = data.settings;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const openReserve = () => (customer ? router.push("/reserve") : setSignInOpen(true));

  return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: 28 + bottomChrome }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => home.refetch()} tintColor={colors.brand} />}>
    <View style={styles.topbar}>
      <View style={styles.brandRow}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel={`${s.brand_name} logo`} />
        <View>
          <Text style={styles.kicker}>{s.brand_name.toUpperCase()}</Text>
          <Text style={styles.welcome}>{customer ? `${greeting}, ${customer.name.split(" ")[0]}.` : `${greeting}.`}</Text>
        </View>
      </View>
      <Pressable testID="home-notifications" onPress={() => router.push("/notifications")} style={styles.bell} accessibilityLabel="Open notifications"><AppIcon name="bell.fill" color={colors.brand} />{data.notifications.length ? <View style={styles.bellDot} /> : null}</Pressable>
    </View>

    <Pressable testID="home-book-table" onPress={openReserve} style={styles.bookCard}>
      <RemoteImage path={s.hero_image} style={styles.bookImage} />
      <View style={styles.bookOverlay} />
      <View style={styles.bookCopy}>
        <Text style={styles.bookEyebrow}>{s.hero_eyebrow}</Text>
        <Text style={styles.bookTitle}>{s.book_title}</Text>
        <Text style={styles.bookCaption}>{s.book_caption}</Text>
        <View style={styles.bookButton}><AppIcon name="calendar.badge.clock" size={16} color={colors.onBrandPrimary} /><Text style={styles.bookButtonText}>{customer ? "Reserve now" : "Sign in & reserve"}</Text></View>
      </View>
    </Pressable>

    <Pressable testID="home-promo-banner" onPress={() => router.push("/offers")} style={styles.promoBanner}>
      <RemoteImage path={s.promo_image} style={styles.promoImage} icon="tag.fill" />
      <View style={styles.promoCopy}>
        <Text style={styles.promoEyebrow}>{s.promo_eyebrow}</Text>
        <Text style={styles.promoTitle} numberOfLines={2}>{s.promo_title}</Text>
        <Text style={styles.promoSub} numberOfLines={2}>{s.promo_caption}</Text>
        <Text style={styles.promoAction}>{customer ? "Generate your code →" : "Get your discount →"}</Text>
      </View>
    </Pressable>

    <View style={styles.section}>
      <SectionTitle eyebrow="EVERYTHING IN ONE TAP" title="Explore the house" />
      <View style={styles.tagsGrid}>
        {HOMEPAGE_TAGS.map((tag) => (
          <Pressable key={tag.key} testID={`home-tag-${tag.key}`} onPress={() => router.push(tag.route)} style={styles.tagCard}>
            <View style={styles.tagIcon}><AppIcon name={tag.symbol} color={colors.brand} size={18} /></View>
            <Text style={styles.tagLabel}>{tag.label}</Text>
            <Text style={styles.tagBlurb} numberOfLines={2}>{tag.blurb}</Text>
          </Pressable>
        ))}
        <Pressable testID="home-tag-reserve" onPress={openReserve} style={[styles.tagCard, styles.tagCardAccent]}>
          <View style={[styles.tagIcon, styles.tagIconAccent]}><AppIcon name="calendar" color={colors.onBrandPrimary} size={18} /></View>
          <Text style={styles.tagLabel}>Book a table</Text>
          <Text style={styles.tagBlurb} numberOfLines={2}>Reserve in under a minute</Text>
        </Pressable>
      </View>
    </View>

    <DishRow eyebrow="HOUSE FAVOURITES" title={s.favourites_title} caption={s.favourites_caption} items={data.favourites} testID="home-favourites" />
    <DishRow eyebrow="JUST LANDED" title={s.new_title} caption={s.new_caption} items={data.new_additions} testID="home-new" badge="New" />

    <View style={styles.section}>
      <SectionTitle eyebrow="THE HOUSE, TOLD BEAUTIFULLY" title="Gallery" action="See all" onAction={() => router.push("/gallery")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {data.gallery.slice(0, 5).map((item) => (
          <Pressable key={item.gallery_id} onPress={() => router.push("/gallery")} style={styles.galleryCard}>
            <RemoteImage path={item.image} style={styles.galleryImage} icon="photo.fill" />
            <View style={styles.galleryOverlay} />
            <View style={styles.galleryCopy}><Text style={styles.galleryEyebrow}>{item.eyebrow.toUpperCase()}</Text><Text style={styles.galleryTitle} numberOfLines={2}>{item.title}</Text></View>
          </Pressable>
        ))}
      </ScrollView>
    </View>

    {data.notifications[0] ? <View style={styles.section}>
      <SectionTitle eyebrow="A LITTLE NOTE FROM US" title="Coming up" action="All notes" onAction={() => router.push("/notifications")} />
      <GlassCard>
        <View style={styles.noteHead}><StatusPill label={data.notifications[0].eyebrow} /><Text style={styles.noteDate}>{data.notifications[0].date_label}</Text></View>
        <Text style={styles.noteTitle}>{data.notifications[0].title}</Text>
        <Text style={styles.noteBody}>{data.notifications[0].body}</Text>
      </GlassCard>
    </View> : null}

    <Text style={styles.footer}>{s.address} · {s.hours}</Text>
  </ScrollView><SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} onSignedIn={() => router.push("/reserve")} title="Sign in to book a table." copy="Share your name, email and mobile once — we'll use it to confirm your table and keep your privileges personal." /></View>;
}

function DishRow({ eyebrow, title, caption, items, testID, badge }: { eyebrow: string; title: string; caption: string; items: MenuItem[]; testID: string; badge?: string }) {
  const styles = useStyles();
  if (!items.length) return null;
  return <View style={styles.section} testID={testID}>
    <SectionTitle eyebrow={eyebrow} title={title} action="Full menu" onAction={() => router.push("/menu")} />
    <Text style={styles.sectionCaption}>{caption}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <Pressable key={item.item_id} testID={`dish-${item.item_id}`} onPress={() => router.push(`/menu?category=${encodeURIComponent(item.category)}`)} style={styles.dishCard}>
          <RemoteImage path={item.image} style={styles.dishImage} />
          {badge ? <View style={styles.dishBadge}><Text style={styles.dishBadgeText}>{badge}</Text></View> : null}
          <View style={styles.dishCopy}>
            <View style={styles.dishTop}><Text style={styles.dishName} numberOfLines={1}>{item.name}</Text><View style={[styles.vegDot, !item.is_veg && styles.nonVegDot]} /></View>
            <Text style={styles.dishDesc} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.dishPrice}>{item.price}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 18 },
  loading: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, marginTop: 12 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  logo: { width: 76, height: 46 },
  kicker: { color: colors.brand, fontSize: 11, letterSpacing: 1.8, fontWeight: "800" },
  welcome: { color: colors.onSurface, fontSize: 20, fontWeight: "700", marginTop: 3 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  bellDot: { position: "absolute", top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  bookCard: { height: 250, borderRadius: 24, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderStrong },
  bookImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  bookOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
  bookCopy: { flex: 1, justifyContent: "flex-end", padding: 20 },
  bookEyebrow: { color: colors.brand, fontSize: 10, letterSpacing: 1.6, fontWeight: "800" },
  bookTitle: { color: colors.onSurface, fontSize: 30, fontWeight: "800", marginTop: 6 },
  bookCaption: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 300 },
  bookButton: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", backgroundColor: colors.brandPrimary, borderRadius: 12, paddingHorizontal: 16, minHeight: 44, marginTop: 14 },
  bookButtonText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: 14 },
  promoBanner: { flexDirection: "row", backgroundColor: colors.brandPrimary, borderRadius: 18, marginTop: 14, overflow: "hidden", minHeight: 112 },
  promoImage: { width: 112, height: "100%" },
  promoCopy: { flex: 1, padding: 14, justifyContent: "center" },
  promoEyebrow: { color: colors.onBrandPrimary, fontSize: 10, letterSpacing: 1.4, fontWeight: "800", opacity: 0.75 },
  promoTitle: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "800", marginTop: 4, lineHeight: 20 },
  promoSub: { color: colors.onBrandPrimary, fontSize: 12, marginTop: 4, opacity: 0.85 },
  promoAction: { color: colors.onBrandPrimary, fontSize: 12, fontWeight: "800", marginTop: 8 },
  section: { marginTop: 30 },
  sectionCaption: { color: colors.muted, fontSize: 13, marginTop: -8, marginBottom: 14 },
  row: { gap: 12, paddingRight: 18 },
  tagsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tagCard: { width: "47.5%", minHeight: 104, padding: 14, borderRadius: 16, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  tagCardAccent: { borderColor: colors.borderStrong, backgroundColor: colors.brandTertiary },
  tagIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tagIconAccent: { backgroundColor: colors.brandPrimary },
  tagLabel: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  tagBlurb: { color: colors.muted, fontSize: 11, marginTop: 3, lineHeight: 15 },
  dishCard: { width: 200, borderRadius: 18, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  dishImage: { width: "100%", height: 130 },
  dishBadge: { position: "absolute", top: 10, left: 10, backgroundColor: colors.brandPrimary, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  dishBadgeText: { color: colors.onBrandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  dishCopy: { padding: 12 },
  dishTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dishName: { color: colors.onSurface, fontSize: 14, fontWeight: "800", flex: 1 },
  vegDot: { width: 10, height: 10, borderRadius: 2, borderWidth: 1.5, borderColor: colors.success, backgroundColor: colors.success },
  nonVegDot: { borderColor: colors.error, backgroundColor: colors.error },
  dishDesc: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4, minHeight: 30 },
  dishPrice: { color: colors.brand, fontSize: 14, fontWeight: "800", marginTop: 8 },
  galleryCard: { width: 210, height: 160, borderRadius: 20, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  galleryImage: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  galleryOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: 90, backgroundColor: colors.scrim },
  galleryCopy: { flex: 1, justifyContent: "flex-end", padding: 14 },
  galleryEyebrow: { color: colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  galleryTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "800", marginTop: 4 },
  noteHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noteDate: { color: colors.muted, fontSize: 11 },
  noteTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "800", marginTop: 16 },
  noteBody: { color: colors.onSurfaceSecondary, lineHeight: 20, fontSize: 14, marginTop: 8 },
  footer: { color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 32, lineHeight: 16 },
}));
