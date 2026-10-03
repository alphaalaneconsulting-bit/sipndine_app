import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { usesNativeTabs } from "@/src/navigation";
import { AppIcon } from "@/src/components/ui";
import { useSession } from "@/src/session";
import { useTheme } from "@/src/theme";

export default function TabLayout() {
  const { colors } = useTheme();
  const { customer } = useSession();
  const accountLabel = customer ? "Log out" : "Sign in";
  const accountIcon = customer ? "rectangle.portrait.and.arrow.right" : "person.crop.circle.fill";
  const screenOptions = { headerShown: false, tabBarActiveTintColor: colors.brandPrimary, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 11 }, tabBarItemStyle: { alignSelf: "center" as const }, tabBarStyle: { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) } };
  if (usesNativeTabs) {
    return <NativeTabs>
      <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Icon sf="house.fill" /><NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="account"><NativeTabs.Trigger.Icon sf={accountIcon as never} /><NativeTabs.Trigger.Label>{accountLabel}</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="contact"><NativeTabs.Trigger.Icon sf="phone.fill" /><NativeTabs.Trigger.Label>Contact</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="more"><NativeTabs.Trigger.Icon sf="ellipsis.circle.fill" /><NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    </NativeTabs>;
  }
  return <Tabs screenOptions={screenOptions}>
    <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <AppIcon name="house.fill" size={22} color={color} /> }} />
    <Tabs.Screen name="account" options={{ title: accountLabel, tabBarIcon: ({ color }) => <AppIcon name={accountIcon} size={22} color={color} /> }} />
    <Tabs.Screen name="contact" options={{ title: "Contact", tabBarIcon: ({ color }) => <AppIcon name="phone.fill" size={22} color={color} /> }} />
    <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <AppIcon name="ellipsis.circle.fill" size={22} color={color} /> }} />
  </Tabs>;
}
