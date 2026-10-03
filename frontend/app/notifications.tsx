import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard, ScreenHeader, StatusPill } from "@/src/components/ui";
import { makeStyles } from "@/src/theme";
import { useHome } from "@/src/content";

export default function NotificationsScreen() {
  const styles = useStyles(); const insets = useSafeAreaInsets();
  const notifications = useHome().data?.notifications ?? [];
  return <View style={styles.root}>
    <ScreenHeader eyebrow="FROM THE HOUSE" title="Notifications" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
      {notifications.map((n) => <GlassCard key={n.notification_id} style={styles.card}><View style={styles.head}><StatusPill label={n.eyebrow} /><Text style={styles.date}>{n.date_label}</Text></View><Text style={styles.title}>{n.title}</Text><Text style={styles.body}>{n.body}</Text></GlassCard>)}
      {!notifications.length ? <Text style={styles.empty}>No notes from the house yet.</Text> : null}
    </ScrollView>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18, gap: 10, paddingTop: 4 },
  card: { padding: 16 }, head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, date: { color: colors.muted, fontSize: 11 }, title: { color: colors.onSurface, fontSize: 17, fontWeight: "800", marginTop: 14 }, body: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 }, empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
}));
