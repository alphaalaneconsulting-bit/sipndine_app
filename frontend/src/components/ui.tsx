import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { makeStyles, useTheme } from "@/src/theme";

export function AppIcon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <SymbolView name={name as never} size={size} tintColor={color ?? colors.onSurface} />;
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ children, style, ...props }: PressableProps & { children: React.ReactNode; style?: ViewStyle }) {
  const styles = useStyles();
  return <Pressable accessibilityRole="button" {...props} style={({ pressed }) => [styles.primary, style, pressed && styles.pressed]}><Text style={styles.primaryText}>{children}</Text></Pressable>;
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  const styles = useStyles();
  return <View style={styles.sectionHeader}><View>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text></View>{action ? <Pressable onPress={onAction} hitSlop={10}><Text style={styles.action}>{action}</Text></Pressable> : null}</View>;
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
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 },
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
}));