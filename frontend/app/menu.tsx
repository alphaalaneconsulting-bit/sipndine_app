import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api, type MenuItem } from "@/src/api";
import { AppIcon, PrimaryButton, RemoteImage, ScreenHeader, StatusPill } from "@/src/components/ui";
import { SignInModal, useSession } from "@/src/session";
import { makeStyles, useTheme } from "@/src/theme";
import { useHome, whatsappUrl } from "@/src/content";

const CATEGORY_ORDER = ["Starters", "Mains", "Breads & Rice", "Desserts", "Bar"];

export default function MenuScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const { customer } = useSession();
  const params = useLocalSearchParams<{ mode?: string; category?: string }>();
  const takeaway = params.mode === "takeaway";
  const menu = useQuery({ queryKey: ["menu"], queryFn: api.menu });
  const settings = useHome().data?.settings;
  const categories = useMemo(() => { const present = new Set((menu.data ?? []).map((m) => m.category)); return ["All", ...CATEGORY_ORDER.filter((c) => present.has(c)), ...Array.from(present).filter((c) => !CATEGORY_ORDER.includes(c))]; }, [menu.data]);
  const [category, setCategory] = useState(params.category ?? "All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [signInOpen, setSignInOpen] = useState(false);
  const items = (menu.data ?? []).filter((m) => category === "All" || m.category === category);
  const cartItems = (menu.data ?? []).filter((m) => cart[m.item_id]);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const adjust = (id: string, delta: number) => setCart((prev) => { const next = Math.max(0, (prev[id] ?? 0) + delta); const copy = { ...prev }; if (next) copy[id] = next; else delete copy[id]; return copy; });
  const sendOrder = () => {
    if (!customer) { setSignInOpen(true); return; }
    if (!settings) return;
    const lines = cartItems.map((m) => `• ${cart[m.item_id]} × ${m.name} (${m.price})`).join("\n");
    const text = `${settings.whatsapp_greeting}place a takeaway order.\n\n${lines}\n\nName: ${customer.name}\nMobile: ${customer.phone}\nMember: ${customer.tier} (10% takeaway saver)`;
    Linking.openURL(whatsappUrl(settings.whatsapp, text));
  };
  return <View style={styles.root}>
    <ScreenHeader eyebrow={takeaway ? "ORDER AHEAD · PICKUP" : "AWADHI · PUNJABI · BAR"} title={takeaway ? "Takeaway order" : "Dine-in menu"} right={takeaway ? <StatusPill label={customer ? "Members save 10%" : "Sign in to save 10%"} /> : undefined} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersBar}>{categories.map((c) => <Pressable key={c} testID={`menu-filter-${c.toLowerCase().replace(/[^a-z]+/g, "-")}`} onPress={() => setCategory(c)} style={[styles.filter, category === c && styles.filterActive]}><Text style={[styles.filterText, category === c && styles.filterTextActive]}>{c}</Text></Pressable>)}</ScrollView>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (takeaway && cartCount ? 120 : 28) }]} showsVerticalScrollIndicator={false}>
      {takeaway && settings?.takeaway_note ? <Text style={styles.note}>{settings.takeaway_note}</Text> : null}
      {menu.isLoading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : items.map((item) => <Dish key={item.item_id} item={item} qty={cart[item.item_id] ?? 0} takeaway={takeaway} onAdjust={adjust} />)}
      {!takeaway ? <View style={styles.dineCta}><Text style={styles.dineTitle}>Ready to come in?</Text><Text style={styles.dineBody}>{settings?.book_caption}</Text><PrimaryButton testID="menu-book-table" onPress={() => (customer ? router.push("/reserve") : setSignInOpen(true))} style={styles.dineButton}>Book a table</PrimaryButton></View> : null}
    </ScrollView>
    {takeaway && cartCount ? <View style={[styles.cartBar, { paddingBottom: insets.bottom + 14 }]}><View style={styles.cartCopy}><Text style={styles.cartTitle}>{cartCount} item{cartCount > 1 ? "s" : ""} selected</Text><Text style={styles.cartBody}>We confirm price & pickup time on WhatsApp</Text></View><PrimaryButton testID="menu-send-order" onPress={sendOrder} style={styles.cartButton}>{customer ? "Send on WhatsApp" : "Sign in to order"}</PrimaryButton></View> : null}
    <SignInModal visible={signInOpen} onClose={() => setSignInOpen(false)} title={takeaway ? "Sign in to order." : "Sign in to book a table."} copy="Share your name, email and mobile once so we can confirm with you on WhatsApp." onSignedIn={() => (takeaway ? undefined : router.push("/reserve"))} />
  </View>;
}

function Dish({ item, qty, takeaway, onAdjust }: { item: MenuItem; qty: number; takeaway: boolean; onAdjust: (id: string, delta: number) => void }) {
  const styles = useStyles(); const { colors } = useTheme();
  return <View style={styles.dish} testID={`menu-item-${item.item_id}`}>
    <RemoteImage path={item.image} style={styles.dishImage} />
    <View style={styles.dishCopy}>
      <View style={styles.dishTop}><View style={[styles.vegDot, !item.is_veg && styles.nonVegDot]} /><Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>{item.is_new ? <StatusPill label="New" /> : null}</View>
      <Text style={styles.dishDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.dishBottom}><Text style={styles.dishPrice}>{item.price}</Text>{takeaway ? (qty ? <View style={styles.stepper}><Pressable testID={`menu-minus-${item.item_id}`} onPress={() => onAdjust(item.item_id, -1)} style={styles.stepBtn}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.qty}>{qty}</Text><Pressable testID={`menu-plus-${item.item_id}`} onPress={() => onAdjust(item.item_id, 1)} style={styles.stepBtn}><Text style={styles.stepText}>+</Text></Pressable></View> : <Pressable testID={`menu-add-${item.item_id}`} onPress={() => onAdjust(item.item_id, 1)} style={styles.addBtn}><AppIcon name="plus" size={14} color={colors.onBrandPrimary} /><Text style={styles.addText}>Add</Text></Pressable>) : null}</View>
    </View>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18, paddingTop: 6 }, loader: { marginTop: 40 },
  filtersBar: { flexGrow: 0 }, filters: { gap: 8, paddingHorizontal: 18, paddingBottom: 12 }, filter: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surfaceTertiary }, filterActive: { backgroundColor: colors.brandPrimary }, filterText: { color: colors.onSurfaceTertiary, fontSize: 13, fontWeight: "700" }, filterTextActive: { color: colors.onBrandPrimary },
  note: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19, backgroundColor: colors.brandTertiary, borderRadius: 12, padding: 12, marginBottom: 12 },
  dish: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 12 }, dishImage: { width: 112, height: 124 }, dishCopy: { flex: 1, padding: 12, justifyContent: "space-between" }, dishTop: { flexDirection: "row", alignItems: "center", gap: 8 }, vegDot: { width: 10, height: 10, borderRadius: 2, borderWidth: 1.5, borderColor: colors.success, backgroundColor: colors.success }, nonVegDot: { borderColor: colors.error, backgroundColor: colors.error }, dishName: { color: colors.onSurface, fontSize: 15, fontWeight: "800", flex: 1 }, dishDesc: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 4 }, dishBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }, dishPrice: { color: colors.brand, fontSize: 15, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandPrimary, borderRadius: 10, paddingHorizontal: 12, height: 36 }, addText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: 12 }, stepper: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceTertiary, borderRadius: 10, paddingHorizontal: 6, height: 36 }, stepBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" }, stepText: { color: colors.brand, fontSize: 18, fontWeight: "800" }, qty: { color: colors.onSurface, fontWeight: "800", minWidth: 14, textAlign: "center" },
  dineCta: { marginTop: 20, padding: 20, borderRadius: 20, backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.borderStrong }, dineTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "800" }, dineBody: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 }, dineButton: { marginTop: 16 },
  cartBar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.borderStrong }, cartCopy: { flex: 1 }, cartTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, cartBody: { color: colors.muted, fontSize: 11, marginTop: 2 }, cartButton: { minHeight: 46 },
}));
