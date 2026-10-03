import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type GalleryItem } from "@/src/api";
import { AppIcon, RemoteImage, ScreenHeader } from "@/src/components/ui";
import { makeStyles, useTheme } from "@/src/theme";
import { useHome } from "@/src/content";

export default function GalleryScreen() {
  const styles = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const home = useHome();
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const items = home.data?.gallery ?? [];
  return <View style={styles.root}>
    <ScreenHeader eyebrow="THE HOUSE, TOLD BEAUTIFULLY" title="Gallery" />
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {items.map((item, index) => <Pressable key={item.gallery_id} testID={`gallery-${item.gallery_id}`} onPress={() => setOpen(item)} style={[styles.tile, index % 3 === 0 && styles.tileWide]}>
          <RemoteImage path={item.image} style={styles.tileImage} icon="photo.fill" />
          <View style={styles.tileOverlay} />
          <View style={styles.tileCopy}><Text style={styles.tileEyebrow}>{item.eyebrow.toUpperCase()}</Text><Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text><Text style={styles.tileCaption} numberOfLines={1}>{item.caption}</Text></View>
        </Pressable>)}
      </View>
      {!items.length && !home.isLoading ? <Text style={styles.empty}>The gallery is being curated. Check back soon.</Text> : null}
    </ScrollView>
    <Modal visible={Boolean(open)} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
      <Pressable style={styles.lightbox} onPress={() => setOpen(null)} testID="gallery-lightbox">
        <RemoteImage path={open?.image} style={{ width: width - 32, height: width - 32, borderRadius: 20 }} icon="photo.fill" />
        <Text style={styles.lightTitle}>{open?.title}</Text><Text style={styles.lightCaption}>{open?.caption}</Text>
        <View style={styles.lightClose}><AppIcon name="xmark" color={colors.onSurface} /></View>
      </Pressable>
    </Modal>
  </View>;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface }, content: { paddingHorizontal: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }, tile: { width: "48.5%", height: 170, borderRadius: 18, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }, tileWide: { width: "100%", height: 210 },
  tileImage: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }, tileOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: 100, backgroundColor: colors.scrim }, tileCopy: { flex: 1, justifyContent: "flex-end", padding: 14 }, tileEyebrow: { color: colors.brand, fontSize: 10, fontWeight: "800", letterSpacing: 1 }, tileTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 15, marginTop: 4 }, tileCaption: { color: colors.onSurfaceSecondary, fontSize: 11, marginTop: 3 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  lightbox: { flex: 1, backgroundColor: colors.scrimStrong, alignItems: "center", justifyContent: "center", padding: 16 }, lightTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "800", marginTop: 18, textAlign: "center" }, lightCaption: { color: colors.onSurfaceSecondary, fontSize: 13, marginTop: 6, textAlign: "center" }, lightClose: { position: "absolute", top: 60, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
}));
