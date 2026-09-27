import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { usesNativeTabs } from "@/src/navigation";
import { useTheme } from "@/src/theme";

export default function TabLayout() {
  const { colors } = useTheme();
  const screenOptions = { headerShown: false, tabBarActiveTintColor: colors.brandPrimary, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 11 }, tabBarItemStyle: { alignSelf: "center" as const }, tabBarStyle: { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) } };
  if (usesNativeTabs) {
    return <NativeTabs><NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf="house.fill" /><NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="offers"><NativeTabs.Trigger.Icon sf="tag.fill" /><NativeTabs.Trigger.Label>Offers</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="club"><NativeTabs.Trigger.Icon sf="wallet.pass.fill" /><NativeTabs.Trigger.Label>Club</NativeTabs.Trigger.Label></NativeTabs.Trigger><NativeTabs.Trigger name="more"><NativeTabs.Trigger.Icon sf="ellipsis.circle.fill" /><NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label></NativeTabs.Trigger></NativeTabs>;
  }
  return <Tabs screenOptions={screenOptions}><Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <></> }} /><Tabs.Screen name="offers" options={{ title: "Offers", tabBarIcon: ({ color }) => <></> }} /><Tabs.Screen name="club" options={{ title: "Club", tabBarIcon: ({ color }) => <></> }} /><Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <></> }} /></Tabs>;
}