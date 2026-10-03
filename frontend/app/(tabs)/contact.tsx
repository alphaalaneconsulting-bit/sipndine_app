import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AppIcon, GlassCard, RemoteImage, SectionTitle } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { useHome, whatsappUrl } from "@/src/content";

export default function ContactScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const home = useHome();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = home.data?.settings;
  if (!s) return <View style={[styles.loading, { paddingTop: insets.top }]}><ActivityIndicator color={colors.brand} /></View>;
  const mapsUrl = s.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`;
  return <View style={styles.root}><ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: 28 + bottomChrome }]} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>WE’RE A MESSAGE AWAY</Text>
    <Text style={styles.title}>Contact the house.</Text>
    <Text style={styles.subtitle}>Bookings, takeaway, celebrations or just a question — WhatsApp is the fastest way to reach us.</Text>

    <Pressable testID="contact-whatsapp" onPress={() => Linking.openURL(whatsappUrl(s.whatsapp, `${s.whatsapp_greeting}`))} style={styles.whatsapp}>
      <View style={styles.whatsappIcon}><AppIcon name="message.fill" color={colors.onBrandPrimary} size={22} /></View>
      <View style={styles.whatsappCopy}><Text style={styles.whatsappTitle}>Chat on WhatsApp</Text><Text style={styles.whatsappBody}>+{s.whatsapp.replace(/^\+/, "")} · usually replies within the hour</Text></View>
      <AppIcon name="chevron.right" color={colors.onBrandPrimary} />
    </Pressable>

    <View style={styles.quickRow}>
      <Quick testID="contact-call" icon="phone.fill" label="Call" onPress={() => Linking.openURL(`tel:${s.phone}`)} />
      <Quick testID="contact-directions" icon="map.fill" label="Directions" onPress={() => Linking.openURL(mapsUrl)} />
      <Quick testID="contact-email" icon="envelope.fill" label="Email" onPress={() => Linking.openURL(`mailto:${s.email}`)} />
      <Quick testID="contact-reserve" icon="calendar" label="Book" onPress={() => router.push("/reserve")} />
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="FIND US" title="Directions" />
      <Pressable testID="contact-map-card" onPress={() => Linking.openURL(mapsUrl)}>
        <GlassCard style={styles.mapCard}>
          <RemoteImage path={s.hero_image} style={styles.mapImage} icon="map.fill" />
          <View style={styles.mapRow}><View style={styles.mapIcon}><AppIcon name="location.fill" color={colors.brand} /></View><View style={styles.mapCopy}><Text style={styles.mapAddress}>{s.address}</Text><Text style={styles.mapLink}>Open in Google Maps →</Text></View></View>
        </GlassCard>
      </Pressable>
      <View style={styles.hoursRow}><AppIcon name="clock.fill" color={colors.brand} size={16} /><Text style={styles.hours}>{s.hours}</Text></View>
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="ABOUT US" title={s.about_title} />
      <Text style={styles.about}>{s.about_body}</Text>
    </View>

    <View style={styles.section}>
      <SectionTitle eyebrow="PLANNING SOMETHING BIGGER?" title="Talk to a manager" action="Banqueting" onAction={() => router.push("/banqueting")} />
      <Text style={styles.about}>Private dining, banquets from 20 to 200 guests and off-site catering — our managers reply directly.</Text>
    </View>
  </ScrollView></View>;
}

function Quick({ icon, label, onPress, testID }: { icon: string; label: string; onPress: () => void; testID: string }) {
  const styles = useStyles(); const { colors } = useTheme();
  return <Pressable testID={testID} onPress={onPress} style={styles.quick}><View style={styles.quickIcon}><AppIcon name={icon} color={colors.brand} size={20} /></View><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 }, loading: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { color: colors.onSurface, fontSize: 30, fontWeight: "800", marginTop: 10 }, subtitle: { color: colors.onSurfaceSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  whatsapp: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.brandPrimary, borderRadius: 18, padding: 16, marginTop: 26 }, whatsappIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center" }, whatsappCopy: { flex: 1 }, whatsappTitle: { color: colors.onBrandPrimary, fontSize: 17, fontWeight: "800" }, whatsappBody: { color: colors.onBrandPrimary, fontSize: 12, marginTop: 3, opacity: 0.85 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 14 }, quick: { flex: 1, minHeight: 78, borderRadius: 16, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 8 }, quickIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }, quickLabel: { color: colors.onSurface, fontSize: 12, fontWeight: "800" },
  section: { marginTop: 32 }, mapCard: { padding: 0, overflow: "hidden" }, mapImage: { width: "100%", height: 150 }, mapRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }, mapIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }, mapCopy: { flex: 1 }, mapAddress: { color: colors.onSurface, fontSize: 14, fontWeight: "700", lineHeight: 20 }, mapLink: { color: colors.brand, fontWeight: "800", fontSize: 13, marginTop: 4 },
  hoursRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }, hours: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700" },
  about: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 22, marginTop: -2 },
}));
