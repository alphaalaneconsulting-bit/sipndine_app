import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, AuthExpiredError, type AdminCollection } from "@/src/api";
import { COLLECTION_META, useAdmin } from "@/src/admin";
import { FormFields, type Draft } from "@/src/components/admin-form";
import { AppIcon, PrimaryButton, RemoteImage, ScreenHeader } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminCollectionScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const queryClient = useQueryClient();
  const { collection } = useLocalSearchParams<{ collection: AdminCollection }>();
  const meta = COLLECTION_META[collection as AdminCollection];
  const { email, ready, logout } = useAdmin();
  const list = useQuery({ queryKey: ["admin-content", collection], queryFn: () => adminApi.list<Draft>(collection as AdminCollection), enabled: Boolean(email && meta) });
  const [editing, setEditing] = useState<Draft | null>(null); const [isNew, setIsNew] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (ready && !email) router.replace("/admin"); }, [ready, email]);
  if (!meta) return <View style={styles.root}><ScreenHeader eyebrow="ADMIN" title="Unknown section" /></View>;

  const refresh = () => { queryClient.invalidateQueries({ queryKey: ["admin-content", collection] }); queryClient.invalidateQueries({ queryKey: ["home"] }); queryClient.invalidateQueries({ queryKey: ["menu"] }); queryClient.invalidateQueries({ queryKey: ["managers"] }); };
  const handleAuth = async (err: unknown) => { if (err instanceof AuthExpiredError) { await logout(); router.replace("/admin"); return true; } return false; };
  const openNew = () => { const blank: Draft = {}; meta.fields.forEach((f) => { blank[f.key] = f.type === "boolean" ? (f.key === "is_available" || f.key === "is_active" || f.key === "is_veg") : f.type === "number" ? (f.key === "max_per_day" ? 1 : (list.data?.length ?? 0) + 1) : f.type === "select" ? f.options?.[0] ?? "" : ""; }); setIsNew(true); setEditing(blank); setError(""); };
  const save = async () => {
    if (!editing) return; const title = editing[meta.titleField]; if (!title || !String(title).trim()) { setError(`Please add a ${meta.fields.find((f) => f.key === meta.titleField)?.label.toLowerCase() ?? "title"}.`); return; }
    setBusy(true); setError("");
    try { if (isNew) await adminApi.create(collection as AdminCollection, editing); else await adminApi.update(collection as AdminCollection, String(editing[meta.idField]), editing); refresh(); setEditing(null); }
    catch (err) { if (await handleAuth(err)) return; setError(err instanceof Error ? err.message : "Could not save."); } finally { setBusy(false); }
  };
  const remove = (item: Draft) => {
    const doRemove = async () => { try { await adminApi.remove(collection as AdminCollection, String(item[meta.idField])); refresh(); setEditing(null); } catch (err) { if (await handleAuth(err)) return; setError(err instanceof Error ? err.message : "Could not delete."); } };
    if (Platform.OS === "web") { doRemove(); return; }
    Alert.alert("Delete this item?", String(item[meta.titleField] ?? ""), [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: doRemove }]);
  };

  return <View style={styles.root}>
    <ScreenHeader eyebrow="ADMIN · TAP TO EDIT" title={meta.title} right={<Pressable testID="admin-add" onPress={openNew} style={styles.addButton}><AppIcon name="plus" color={colors.onBrandPrimary} size={18} /><Text style={styles.addText}>Add</Text></Pressable>} />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
      {list.isLoading ? <ActivityIndicator color={colors.brand} style={styles.loader} /> : (list.data ?? []).map((item) => {
        const hidden = item.is_available === false || item.is_active === false;
        return <Pressable key={String(item[meta.idField])} testID={`admin-item-${item[meta.idField]}`} onPress={() => { setIsNew(false); setEditing({ ...item }); setError(""); }} style={[styles.row, hidden && styles.rowHidden]}>
          {meta.imageField ? <RemoteImage path={typeof item[meta.imageField] === "string" ? (item[meta.imageField] as string) : ""} style={styles.thumb} icon="photo.fill" /> : <View style={styles.thumbIcon}><AppIcon name="square.and.pencil" color={colors.brand} /></View>}
          <View style={styles.rowCopy}><Text style={styles.rowTitle} numberOfLines={1}>{String(item[meta.titleField] ?? "")}</Text>{meta.subtitleField ? <Text style={styles.rowSub} numberOfLines={1}>{String(item[meta.subtitleField] ?? "")}{hidden ? " · hidden" : ""}{item.is_favourite ? " · ★ favourite" : ""}{item.is_new ? " · new" : ""}</Text> : null}</View>
          <AppIcon name="chevron.right" color={colors.muted} />
        </Pressable>;
      })}
      {!list.isLoading && !list.data?.length ? <Text style={styles.empty}>Nothing here yet. Tap Add to create the first one.</Text> : null}
    </ScrollView>
    <Modal visible={Boolean(editing)} animationType="slide" onRequestClose={() => setEditing(null)}>
      <View style={styles.root}>
        <View style={[styles.sheetHeader, { paddingTop: insets.top + 12 }]}><Pressable testID="editor-close" onPress={() => setEditing(null)} style={styles.closeButton}><AppIcon name="xmark" color={colors.onSurface} /></Pressable><Text style={styles.sheetTitle}>{isNew ? `New ${meta.title.toLowerCase().replace(/s$/, "")}` : "Edit"}</Text>{!isNew && editing ? <Pressable testID="editor-delete" onPress={() => remove(editing)} style={styles.deleteButton}><AppIcon name="trash.fill" color={colors.error} size={18} /></Pressable> : <View style={styles.deleteButton} />}</View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={[styles.content, { paddingTop: 8, paddingBottom: insets.bottom + 110 }]} keyboardShouldPersistTaps="handled">{editing ? <FormFields fields={meta.fields} draft={editing} onChange={(key, value) => setEditing((p) => ({ ...(p ?? {}), [key]: value }))} /> : null}</ScrollView></KeyboardAvoidingView>
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 14 }]}>{error ? <Text style={styles.error} testID="editor-error">{error}</Text> : null}<PrimaryButton testID="editor-save" onPress={save} disabled={busy}>{busy ? "Saving…" : isNew ? "Create" : "Save changes"}</PrimaryButton></View>
      </View>
    </Modal>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, flex: { flex: 1 }, content: { paddingHorizontal: 18 }, loader: { marginTop: 40 },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 40, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.brandPrimary }, addText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 14, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, marginBottom: 10, minHeight: 72 }, rowHidden: { opacity: 0.55 }, thumb: { width: 64, height: 52, borderRadius: 10 }, thumbIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }, rowCopy: { flex: 1 }, rowTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15 }, rowSub: { color: colors.muted, fontSize: 12, marginTop: 3 }, empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 12 }, sheetTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "800" }, closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }, deleteButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  saveBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.borderStrong }, error: { color: colors.error, fontSize: 12, fontWeight: "700", marginBottom: 10 },
}));
