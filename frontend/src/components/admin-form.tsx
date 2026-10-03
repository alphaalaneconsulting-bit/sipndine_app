import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { adminApi } from "@/src/api";
import { type FieldDef } from "@/src/admin";
import { AppIcon, Field, RemoteImage } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export type Draft = Record<string, unknown>;

/** Renders a list of FieldDefs bound to a draft object. */
export function FormFields({ fields, draft, onChange }: { fields: FieldDef[]; draft: Draft; onChange: (key: string, value: unknown) => void }) {
  const styles = useStyles(); const { colors } = useTheme();
  return <>{fields.map((field) => {
    const value = draft[field.key];
    if (field.type === "boolean") return <View key={field.key} style={styles.switchRow}><Text style={styles.switchLabel}>{field.label}</Text><Switch testID={`field-${field.key}`} value={Boolean(value)} onValueChange={(v) => onChange(field.key, v)} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} thumbColor={colors.onSurface} /></View>;
    if (field.type === "select") return <View key={field.key} style={styles.selectBlock}><Text style={styles.label}>{field.label}</Text><View style={styles.chips}>{field.options?.map((o) => <Pressable key={o} testID={`field-${field.key}-${o.toLowerCase().replace(/[^a-z]+/g, "-")}`} onPress={() => onChange(field.key, o)} style={[styles.chip, value === o && styles.chipActive]}><Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text></Pressable>)}</View></View>;
    if (field.type === "image") return <ImageField key={field.key} label={field.label} path={typeof value === "string" ? value : ""} onChange={(p) => onChange(field.key, p)} />;
    return <Field key={field.key} testID={`field-${field.key}`} label={field.label + (field.hint ? ` · ${field.hint}` : "")} value={value === undefined || value === null ? "" : String(value)} onChangeText={(t) => onChange(field.key, field.type === "number" ? (t === "" ? "" : Number(t.replace(/[^0-9.-]/g, "")) || 0) : t)} keyboardType={field.type === "number" ? "number-pad" : "default"} multiline={field.type === "multiline"} placeholder={field.hint} />;
  })}</>;
}

function ImageField({ label, path, onChange }: { label: string; path: string; onChange: (path: string) => void }) {
  const styles = useStyles(); const { colors } = useTheme();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const pick = async () => {
    setError("");
    if (Platform.OS !== "web") {
      let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        if (!permission.canAskAgain) { Alert.alert("Photo access needed", "Allow photo access in Settings to upload menu and gallery photos.", [{ text: "Not now", style: "cancel" }, { text: "Open Settings", onPress: () => Linking.openSettings() }]); return; }
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { setError("Photo access was not allowed. You can still paste an existing photo path below."); return; }
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setBusy(true);
    try { const uploaded = await adminApi.upload(asset.uri, asset.fileName ?? "photo.jpg", asset.mimeType ?? "image/jpeg"); onChange(uploaded.path); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); } finally { setBusy(false); }
  };
  return <View style={styles.imageBlock}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.imageRow}>
      <RemoteImage path={path} style={styles.preview} icon="photo.fill" />
      <View style={styles.imageActions}>
        <Pressable testID="image-pick" onPress={pick} disabled={busy} style={styles.pickButton}>{busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <><AppIcon name="photo.fill" size={16} color={colors.onBrandPrimary} /><Text style={styles.pickText}>{path ? "Replace photo" : "Upload photo"}</Text></>}</Pressable>
        {path ? <Pressable testID="image-clear" onPress={() => onChange("")} style={styles.clearButton}><Text style={styles.clearText}>Remove</Text></Pressable> : null}
      </View>
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}

const useStyles = makeStyles((colors) => ({
  label: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.divider, marginBottom: 8 }, switchLabel: { color: colors.onSurface, fontSize: 14, fontWeight: "700", flex: 1, paddingRight: 12 },
  selectBlock: { marginBottom: 14 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { paddingHorizontal: 12, minHeight: 38, justifyContent: "center", borderRadius: 999, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }, chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }, chipText: { color: colors.onSurfaceSecondary, fontWeight: "700", fontSize: 12 }, chipTextActive: { color: colors.onBrandPrimary },
  imageBlock: { marginBottom: 14 }, imageRow: { flexDirection: "row", gap: 12, alignItems: "center" }, preview: { width: 112, height: 84, borderRadius: 12 }, imageActions: { flex: 1, gap: 8 }, pickButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44, borderRadius: 12, backgroundColor: colors.brandPrimary }, pickText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: 13 }, clearButton: { minHeight: 36, alignItems: "center", justifyContent: "center" }, clearText: { color: colors.error, fontWeight: "700", fontSize: 12 },
  error: { color: colors.error, fontSize: 12, marginTop: 8 },
}));
