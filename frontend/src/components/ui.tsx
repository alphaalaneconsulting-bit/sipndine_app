import { SymbolView } from "expo-symbols";
import Ionicons from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Pressable, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle, type StyleProp, type ImageStyle, type ColorValue } from "react-native";
import { makeStyles, useTheme } from "@/src/theme";
import { fileUrl } from "@/src/api";

/** Image from object storage (via backend) with a themed placeholder when the path is empty. */
export function RemoteImage({ path, style, icon = "fork.knife" }: { path?: string; style: StyleProp<ImageStyle>; icon?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const uri = fileUrl(path);
  if (!uri) return <View style={[style as ViewStyle, styles.imagePlaceholder]}><AppIcon name={icon} size={26} color={colors.brand} /></View>;
  return <Image source={{ uri }} style={style} contentFit="cover" transition={200} cachePolicy="memory-disk" placeholderContentFit="cover" />;
}

/** Stack screen header with back button, eyebrow, and title. */
export function ScreenHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return <View style={[styles.screenHeader, { paddingTop: insets.top + 12 }]}>
    <Pressable testID="screen-back" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} style={styles.backButton}><AppIcon name="chevron.left" color={colors.brand} /></Pressable>
    <View style={styles.screenHeaderCopy}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.screenTitle} numberOfLines={2}>{title}</Text></View>
    {right}
  </View>;
}

export function Field({ label, style, multiline, ...props }: TextInputProps & { label?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.field}>{label ? <Text style={styles.fieldLabel}>{label}</Text> : null}<TextInput placeholderTextColor={colors.muted} multiline={multiline} {...props} style={[styles.input, multiline && styles.inputMultiline, style]} /></View>;
}

// SF Symbol name -> Ionicons glyph, so icons render on Android and web too.
const IONICON_FOR_SF: Record<string, string> = {
  "bell.fill": "notifications",
  "bell.badge.fill": "notifications",
  checkmark: "checkmark",
  "checkmark.circle.fill": "checkmark-circle",
  "checkmark.seal.fill": "ribbon",
  "chevron.left": "chevron-back",
  "chevron.right": "chevron-forward",
  "exclamationmark.triangle.fill": "warning",
  "lock.shield.fill": "shield-checkmark",
  "message.fill": "chatbubble-ellipses",
  "phone.fill": "call",
  qrcode: "qr-code",
  "qrcode.viewfinder": "scan",
  sparkles: "sparkles",
  "wave.3.right": "wifi",
  "arrow.up.right": "arrow-forward",
  "bag.fill": "bag-handle",
  "book.pages.fill": "book",
  "fork.knife": "restaurant",
  "person.3.fill": "people",
  "photo.on.rectangle.angled": "images",
  "star.fill": "star",
  "tag.fill": "pricetag",
  "wallet.pass.fill": "wallet",
  "house.fill": "home",
  "ellipsis.circle.fill": "ellipsis-horizontal-circle",
  "calendar.badge.clock": "calendar",
  calendar: "calendar",
  "person.crop.circle.fill": "person-circle",
  "person.fill": "person",
  "rectangle.portrait.and.arrow.right": "log-out",
  "map.fill": "map",
  "location.fill": "location",
  "clock.fill": "time",
  "info.circle.fill": "information-circle",
  "envelope.fill": "mail",
  "wineglass.fill": "wine",
  "takeoutbag.and.cup.and.straw.fill": "bag-handle",
  "list.bullet.rectangle.fill": "list",
  "square.and.pencil": "create",
  "photo.fill": "image",
  "trash.fill": "trash",
  plus: "add",
  "gearshape.fill": "settings",
  "chart.bar.fill": "stats-chart",
  "person.2.fill": "people",
  "leaf.fill": "leaf",
  "xmark": "close",
  "arrow.clockwise": "refresh",
};

export function AppIcon({ name, size = 20, color }: { name: string; size?: number; color?: string | ColorValue }) {
  const { colors } = useTheme();
  const tint = (color ?? colors.onSurface) as string;
  if (Platform.OS === "ios") return <SymbolView name={name as never} size={size} tintColor={tint} />;
  return <Ionicons name={(IONICON_FOR_SF[name] ?? "ellipse") as never} size={size} color={tint} />;
}

export function GlassCard({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) {
  const styles = useStyles();
  return <View style={[styles.card, style]} testID={testID}>{children}</View>;
}

export function PrimaryButton({ children, style, ...props }: PressableProps & { children: React.ReactNode; style?: ViewStyle }) {
  const styles = useStyles();
  return <Pressable accessibilityRole="button" {...props} style={({ pressed }) => [styles.primary, style, pressed && styles.pressed]}><Text style={styles.primaryText}>{children}</Text></Pressable>;
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  const styles = useStyles();
  return <View style={styles.sectionHeader}><View style={styles.sectionCopy}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text></View>{action ? <Pressable onPress={onAction} hitSlop={10}><Text style={styles.action}>{action}</Text></Pressable> : null}</View>;
}

export function GoldHero({ eyebrow, title, caption, children }: { eyebrow: string; title: string; caption: string; children?: React.ReactNode }) {
  const styles = useStyles();
  return <LinearGradient colors={["#5E4739", "#3A2A24", "#2A1E18"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}><View style={styles.heroGlow} /><Text style={styles.heroEyebrow}>{eyebrow}</Text><Text style={styles.heroTitle}>{title}</Text><Text style={styles.heroCaption}>{caption}</Text>{children}</LinearGradient>;
}

export function StatusPill({ label, tone = "brand" }: { label: string; tone?: "brand" | "success" | "muted" }) {
  const styles = useStyles();
  return <View style={[styles.pill, tone === "success" ? styles.successPill : tone === "muted" ? styles.mutedPill : styles.brandPill]}><Text style={[styles.pillText, tone === "success" ? styles.successText : tone === "muted" ? styles.mutedText : styles.brandText]}>{label}</Text></View>;
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18 },
  primary: { minHeight: 48, borderRadius: 14, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: 14 },
  pressed: { opacity: 0.78 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12 },
  sectionCopy: { flex: 1 },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 6 },
  sectionTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "700" },
  action: { color: colors.brand, fontSize: 13, fontWeight: "700", paddingVertical: 8 },
  hero: { minHeight: 218, borderRadius: 24, padding: 22, overflow: "hidden", justifyContent: "flex-end" },
  heroGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, right: -30, top: -38, backgroundColor: "rgba(212,168,106,0.18)" },
  heroEyebrow: { color: colors.brand, fontSize: 11, letterSpacing: 1.6, fontWeight: "800", marginBottom: 10 },
  heroTitle: { color: colors.onSurface, fontSize: 31, lineHeight: 35, fontWeight: "700", maxWidth: 290 },
  heroCaption: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 290 },
  pill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  brandPill: { backgroundColor: colors.brandTertiary },
  successPill: { backgroundColor: colors.success },
  mutedPill: { backgroundColor: colors.surfaceTertiary },
  pillText: { fontSize: 11, fontWeight: "800" },
  brandText: { color: colors.brand },
  successText: { color: colors.onSuccess },
  mutedText: { color: colors.onSurfaceTertiary },
  imagePlaceholder: { backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  screenHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingBottom: 14, backgroundColor: colors.surface },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  screenHeaderCopy: { flex: 1 },
  screenTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "800" },
  field: { marginBottom: 12 },
  fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  input: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.onSurface, paddingHorizontal: 14, fontSize: 15, backgroundColor: colors.surfaceSecondary },
  inputMultiline: { minHeight: 96, paddingTop: 14, textAlignVertical: "top" },
}));