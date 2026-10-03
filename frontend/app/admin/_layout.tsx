import { Stack } from "expo-router";
import { AdminProvider } from "@/src/admin";

export default function AdminLayout() {
  return <AdminProvider><Stack screenOptions={{ headerShown: false }} /></AdminProvider>;
}
