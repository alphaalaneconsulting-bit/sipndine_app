import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/src/api";
import { useAdmin } from "@/src/admin";
import { AppIcon, Field, GlassCard, ScreenHeader, StatusPill } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { whatsappUrl } from "@/src/content";

export default function AdminCustomers() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const { email, ready } = useAdmin();
  const data = useQuery({ queryKey: ["admin-customers"], queryFn: adminApi.customers, enabled: Boolean(email) });
  const [query, setQuery] = useState("");
  useEffect(() => { if (ready && !email) router.replace("/admin"); }, [ready, email]);
  const people = (data.data?.customers ?? []).filter((c) => !query || [c.name, c.email, c.phone].some((v) => v.toLowerCase().includes(query.toLowerCase())));
  return <View style={styles.root}>
    <ScreenHeader eyebrow="ADMIN" title="Customers & app usage" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={data.isRefetching} onRefresh={() => data.refetch()} tintColor={colors.brand} />}>
      <View style={styles.statsRow}><View style={styles.stat}><Text style={styles.statValue}>{data.data?.customers.length ?? "—"}</Text><Text style={styles.statLabel}>Signed-in members</Text></View><View style={styles.stat}><Text style={styles.statValue}>{data.data?.anonymous_devices ?? "—"}</Text><Text style={styles.statLabel}>Browsing without sign-in</Text></View><View style={styles.stat}><Text style={styles.statValue}>{data.data?.anonymous_opens ?? "—"}</Text><Text style={styles.statLabel}>Anonymous opens</Text></View></View>
      <Field testID="customers-search" value={query} onChangeText={setQuery} placeholder="Search name, email or mobile" autoCapitalize="none" />
      {data.isLoading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : people.map((c) => <GlassCard key={c.customer_id} style={styles.card} testID={`customer-${c.customer_id}`}>
        <View style={styles.head}><View style={styles.copy}><Text style={styles.name}>{c.name}</Text><Text style={styles.detail}>{c.phone} · {c.email}</Text></View><StatusPill label={c.tier} /></View>
        <View style={styles.metaRow}><Text style={styles.meta}>{c.points.toLocaleString()} pts</Text><Text style={styles.meta}>{c.app_opens} opens · {c.devices} device{c.devices === 1 ? "" : "s"}</Text><Text style={styles.meta}>Joined {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Text></View>
        <View style={styles.actions}><Pressable testID={`customer-call-${c.customer_id}`} onPress={() => Linking.openURL(`tel:${c.phone}`)} style={styles.action}><AppIcon name="phone.fill" size={14} color={colors.brand} /><Text style={styles.actionText}>Call</Text></Pressable><Pressable testID={`customer-wa-${c.customer_id}`} onPress={() => Linking.openURL(whatsappUrl(c.phone, `Hello ${c.name.split(" ")[0]}, this is Sip 'n' Dine. `))} style={styles.action}><AppIcon name="message.fill" size={14} color={colors.brand} /><Text style={styles.actionText}>WhatsApp</Text></Pressable><Pressable testID={`customer-mail-${c.customer_id}`} onPress={() => Linking.openURL(`mailto:${c.email}`)} style={styles.action}><AppIcon name="envelope.fill" size={14} color={colors.brand} /><Text style={styles.actionText}>Email</Text></Pressable></View>
      </GlassCard>)}
      {!data.isLoading && !people.length ? <Text style={styles.empty}>No customers match.</Text> : null}
    </ScrollView>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 }, loader: { marginTop: 40 }, empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 }, stat: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }, statValue: { color: colors.brand, fontSize: 22, fontWeight: "900" }, statLabel: { color: colors.muted, fontSize: 10, marginTop: 4, fontWeight: "700" },
  card: { marginBottom: 10, padding: 14 }, head: { flexDirection: "row", alignItems: "center", gap: 8 }, copy: { flex: 1 }, name: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, detail: { color: colors.muted, fontSize: 12, marginTop: 3 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 }, meta: { color: colors.onSurfaceSecondary, fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 }, action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border }, actionText: { color: colors.onSurfaceSecondary, fontSize: 12, fontWeight: "700" },
}));
