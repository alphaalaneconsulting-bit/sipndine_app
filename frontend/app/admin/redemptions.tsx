import { useEffect } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/src/api";
import { useAdmin } from "@/src/admin";
import { GlassCard, ScreenHeader, StatusPill } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminRedemptions() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const { email, ready } = useAdmin();
  const data = useQuery({ queryKey: ["admin-redemptions"], queryFn: adminApi.redemptions, enabled: Boolean(email) });
  useEffect(() => { if (ready && !email) router.replace("/admin"); }, [ready, email]);
  const now = Date.now();
  return <View style={styles.root}>
    <ScreenHeader eyebrow="ADMIN · AUDIT TRAIL" title="Redemption log" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={data.isRefetching} onRefresh={() => data.refetch()} tintColor={colors.brand} />}>
      <Text style={styles.intro}>Every code a guest generates appears here. Codes themselves are never shown — only whether they were redeemed, expired or are still live.</Text>
      {data.isLoading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : (data.data ?? []).map((r) => {
        const live = r.status === "active" && new Date(r.expires_at).getTime() > now;
        const label = r.status === "redeemed" ? "Redeemed" : live ? "Live" : "Expired";
        return <GlassCard key={r.redemption_id} style={styles.card} testID={`redemption-${r.redemption_id}`}><View style={styles.head}><View style={styles.copy}><Text style={styles.title}>{r.customer_name}</Text><Text style={styles.sub}>{r.offer_title} · {r.discount}</Text></View><StatusPill label={label} tone={label === "Redeemed" ? "success" : label === "Live" ? "brand" : "muted"} /></View><Text style={styles.meta}>Generated {new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}{r.redeemed_at ? ` · redeemed ${new Date(r.redeemed_at).toLocaleTimeString("en-IN", { timeStyle: "short" })}` : ""}</Text></GlassCard>;
      })}
      {!data.isLoading && !data.data?.length ? <Text style={styles.empty}>No codes generated yet.</Text> : null}
    </ScrollView>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 }, loader: { marginTop: 40 }, empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  intro: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  card: { marginBottom: 10, padding: 14 }, head: { flexDirection: "row", alignItems: "center", gap: 8 }, copy: { flex: 1 }, title: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, sub: { color: colors.onSurfaceSecondary, fontSize: 12, marginTop: 3 }, meta: { color: colors.muted, fontSize: 10, marginTop: 10 },
}));
