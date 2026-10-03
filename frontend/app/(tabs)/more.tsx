import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { AppIcon, SectionTitle } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { useHome } from "@/src/content";

const LINKS: { key: string; icon: string; title: string; body: string; route: Href }[] = [
  { key: "membership", icon: "wallet.pass.fill", title: "Membership", body: "Your tier, points and digital privilege card.", route: "/membership" },
  { key: "offers", icon: "tag.fill", title: "Offers & combos", body: "Buffet, combos and in-house privileges with live codes.", route: "/offers" },
  { key: "banqueting", icon: "person.3.fill", title: "Banqueting & catering", body: "Celebrations from 20 to 200 guests. Talk to a manager.", route: "/banqueting" },
  { key: "menu", icon: "fork.knife", title: "Dine-in menu · Food & bar", body: "Awadhi & Punjabi classics, signature cocktails.", route: "/menu" },
  { key: "takeaway", icon: "takeoutbag.and.cup.and.straw.fill", title: "Takeaway order", body: "Order ahead on WhatsApp. Members save 10%.", route: "/menu?mode=takeaway" },
  { key: "gallery", icon: "photo.on.rectangle.angled", title: "Gallery", body: "The dining room, the nook, the banquet floor.", route: "/gallery" },
  { key: "notifications", icon: "bell.fill", title: "Notifications", body: "Events, festival notes and member invitations.", route: "/notifications" },
];

export default function MoreScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const home = useHome();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: 28 + bottomChrome }]} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>THE HOUSE, AT YOUR SERVICE</Text>
    <Text style={styles.title}>More to discover.</Text>
    <View style={styles.list}>
      {LINKS.map((link) => <Pressable key={link.key} testID={`more-${link.key}`} onPress={() => router.push(link.route)} style={styles.rowCard}>
        <View style={styles.rowIcon}><AppIcon name={link.icon} color={colors.brand} /></View>
        <View style={styles.rowCopy}><Text style={styles.rowTitle}>{link.title}</Text><Text style={styles.rowBody}>{link.body}</Text></View>
        <AppIcon name="chevron.right" color={colors.muted} />
      </Pressable>)}
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="FOR STAFF ONLY" title="Admin panel" />
      <Pressable testID="more-admin" onPress={() => router.push("/admin")} style={[styles.rowCard, styles.adminCard]}>
        <View style={[styles.rowIcon, styles.adminIcon]}><AppIcon name="lock.shield.fill" color={colors.onBrandPrimary} /></View>
        <View style={styles.rowCopy}><Text style={styles.rowTitle}>Manager & host sign-in</Text><Text style={styles.rowBody}>Verify privilege codes, manage bookings, edit menu, offers, gallery and every word in the app.</Text></View>
        <AppIcon name="chevron.right" color={colors.muted} />
      </Pressable>
    </View>

    <View style={styles.footer}><Text style={styles.footerBrand}>{(home.data?.settings.brand_name ?? "SIP ’N’ DINE").toUpperCase()}</Text><Text style={styles.footerAddress}>{home.data?.settings.address ?? ""}</Text><Text style={styles.footerAddress}>{home.data?.settings.hours ?? ""}</Text></View>
  </ScrollView></View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { color: colors.onSurface, fontSize: 31, fontWeight: "800", marginTop: 10 },
  list: { marginTop: 26, gap: 10 }, rowCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, minHeight: 72 },
  rowIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }, rowCopy: { flex: 1 }, rowTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, rowBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  section: { marginTop: 34 }, adminCard: { borderColor: colors.borderStrong }, adminIcon: { backgroundColor: colors.brandPrimary },
  footer: { paddingTop: 38, paddingBottom: 16, alignItems: "center", gap: 6 }, footerBrand: { color: colors.brand, fontSize: 12, fontWeight: "900", letterSpacing: 2 }, footerAddress: { color: colors.muted, fontSize: 12, textAlign: "center" },
}));
