import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Inquiry, type Reservation } from "@/src/api";
import { useAdmin } from "@/src/admin";
import { AppIcon, GlassCard, ScreenHeader, StatusPill } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { whatsappUrl } from "@/src/content";

const RESERVATION_STATUSES = ["Requested", "Confirmed", "Seated", "Declined", "No-show"];
const INQUIRY_STATUSES = ["Received", "In progress", "Quoted", "Closed"];

export default function AdminBookings() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const queryClient = useQueryClient();
  const { email, ready } = useAdmin();
  const [tab, setTab] = useState<"tables" | "enquiries">("tables");
  const reservations = useQuery({ queryKey: ["admin-reservations"], queryFn: adminApi.reservations, enabled: Boolean(email) });
  const inquiries = useQuery({ queryKey: ["admin-inquiries"], queryFn: adminApi.inquiries, enabled: Boolean(email) });
  useEffect(() => { if (ready && !email) router.replace("/admin"); }, [ready, email]);
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ["admin-reservations"] }); queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); };
  const loading = tab === "tables" ? reservations.isLoading : inquiries.isLoading;
  return <View style={styles.root}>
    <ScreenHeader eyebrow="ADMIN" title="Bookings & enquiries" />
    <View style={styles.tabs}>{(["tables", "enquiries"] as const).map((t) => <Pressable key={t} testID={`bookings-tab-${t}`} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}><Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === "tables" ? `Tables (${reservations.data?.length ?? 0})` : `Enquiries (${inquiries.data?.length ?? 0})`}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={reservations.isRefetching || inquiries.isRefetching} onRefresh={refresh} tintColor={colors.brand} />}>
      {loading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : null}
      {tab === "tables" ? (reservations.data ?? []).map((r) => <ReservationCard key={r.reservation_id} item={r} onChanged={refresh} />) : (inquiries.data ?? []).map((i) => <InquiryCard key={i.inquiry_id} item={i} onChanged={refresh} />)}
      {!loading && !(tab === "tables" ? reservations.data?.length : inquiries.data?.length) ? <Text style={styles.empty}>Nothing yet.</Text> : null}
    </ScrollView>
  </View>;
}

function Contact({ name, phone, email }: { name: string; phone: string; email: string }) {
  const styles = useStyles(); const { colors } = useTheme();
  return <View style={styles.contactRow}><View style={styles.contactCopy}><Text style={styles.contactName}>{name}</Text><Text style={styles.contactDetail}>{phone} · {email}</Text></View><Pressable testID="contact-call" onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.iconButton}><AppIcon name="phone.fill" color={colors.brand} size={16} /></Pressable><Pressable testID="contact-wa" onPress={() => Linking.openURL(whatsappUrl(phone, `Hello ${name.split(" ")[0]}, this is Sip 'n' Dine. `))} style={styles.iconButton}><AppIcon name="message.fill" color={colors.brand} size={16} /></Pressable></View>;
}

function StatusRow({ current, options, onPick }: { current: string; options: string[]; onPick: (s: string) => void }) {
  const styles = useStyles();
  return <View style={styles.statusRow}>{options.map((s) => <Pressable key={s} testID={`status-${s.toLowerCase().replace(/[^a-z]+/g, "-")}`} onPress={() => onPick(s)} style={[styles.statusChip, current === s && styles.statusChipActive]}><Text style={[styles.statusText, current === s && styles.statusTextActive]}>{s}</Text></Pressable>)}</View>;
}

function ReservationCard({ item, onChanged }: { item: Reservation; onChanged: () => void }) {
  const styles = useStyles();
  const set = async (status: string) => { await adminApi.setReservationStatus(item.reservation_id, status).catch(() => undefined); onChanged(); };
  return <GlassCard style={styles.card} testID={`reservation-${item.reservation_id}`}><View style={styles.cardHead}><Text style={styles.cardTitle}>{item.date} · {item.time}</Text><StatusPill label={item.status} tone={item.status === "Confirmed" || item.status === "Seated" ? "success" : item.status === "Requested" ? "brand" : "muted"} /></View><Text style={styles.cardSub}>{item.party_size} guests · {item.occasion || "Casual"}{item.note ? ` · “${item.note}”` : ""}</Text><Contact name={item.customer_name} phone={item.customer_phone} email={item.customer_email} /><StatusRow current={item.status} options={RESERVATION_STATUSES} onPick={set} /><Text style={styles.meta}>Requested {new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</Text></GlassCard>;
}

function InquiryCard({ item, onChanged }: { item: Inquiry; onChanged: () => void }) {
  const styles = useStyles();
  const set = async (status: string) => { await adminApi.setInquiryStatus(item.inquiry_id, status).catch(() => undefined); onChanged(); };
  return <GlassCard style={styles.card} testID={`inquiry-${item.inquiry_id}`}><View style={styles.cardHead}><Text style={styles.cardTitle}>{item.offering}</Text><StatusPill label={item.status} tone={item.status === "Closed" ? "muted" : item.status === "Received" ? "brand" : "success"} /></View><Text style={styles.cardSub}>{item.date} · {item.guests} guests · for {item.manager_name}{item.note ? ` · “${item.note}”` : ""}</Text><Contact name={item.customer_name} phone={item.customer_phone} email={item.customer_email} /><StatusRow current={item.status} options={INQUIRY_STATUSES} onPick={set} /><Text style={styles.meta}>Received {new Date(item.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</Text></GlassCard>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 }, loader: { marginTop: 40 }, empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingBottom: 14 }, tab: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }, tabActive: { backgroundColor: colors.brandPrimary }, tabText: { color: colors.onSurfaceTertiary, fontWeight: "800", fontSize: 13 }, tabTextActive: { color: colors.onBrandPrimary },
  card: { marginBottom: 12, padding: 16 }, cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, cardTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "800", flex: 1 }, cardSub: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider }, contactCopy: { flex: 1 }, contactName: { color: colors.onSurface, fontWeight: "800", fontSize: 14 }, contactDetail: { color: colors.muted, fontSize: 11, marginTop: 2 }, iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 }, statusChip: { paddingHorizontal: 10, minHeight: 34, justifyContent: "center", borderRadius: 999, backgroundColor: colors.surfaceTertiary }, statusChipActive: { backgroundColor: colors.brandPrimary }, statusText: { color: colors.onSurfaceTertiary, fontSize: 11, fontWeight: "800" }, statusTextActive: { color: colors.onBrandPrimary },
  meta: { color: colors.muted, fontSize: 10, marginTop: 12 },
}));
