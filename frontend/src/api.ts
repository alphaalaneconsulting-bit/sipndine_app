import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const baseUrl = String(Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export type Settings = {
  brand_name: string; tagline: string; hero_eyebrow: string; hero_title: string; hero_caption: string; hero_image: string;
  book_title: string; book_caption: string; promo_eyebrow: string; promo_title: string; promo_caption: string; promo_image: string;
  favourites_title: string; favourites_caption: string; new_title: string; new_caption: string;
  phone: string; whatsapp: string; email: string; address: string; maps_url: string; hours: string; whatsapp_greeting: string;
  about_title: string; about_body: string; discount_terms: string; takeaway_note: string;
};
export type MenuItem = { item_id: string; name: string; description: string; price: string; category: string; image: string; is_favourite: boolean; is_new: boolean; is_veg: boolean; is_available: boolean; sort_order: number };
export type Offer = { offer_id: string; kind: string; title: string; subtitle: string; discount: string; validity: string; image: string; max_per_day: number; terms: string; is_active: boolean; sort_order: number };
export type GalleryItem = { gallery_id: string; eyebrow: string; title: string; caption: string; image: string; sort_order: number };
export type NotificationItem = { notification_id: string; eyebrow: string; title: string; body: string; date_label: string; is_read: boolean };
export type Manager = { manager_id: string; name: string; role: string; status: string; status_color: string; specialty: string; phone: string; whatsapp: string };
export type Customer = { customer_id: string; name: string; email: string; phone: string; tier: string; points: number; points_to_next_tier: number };
export type Redemption = { redemption_id: string; code: string; expires_at: string; offer_title: string; instruction: string };
export type Reservation = { reservation_id: string; customer_name: string; customer_phone: string; customer_email: string; date: string; time: string; party_size: string; occasion: string; note: string; status: string; created_at: string };
export type Inquiry = { inquiry_id: string; customer_name: string; customer_phone: string; customer_email: string; manager_name: string; offering: string; date: string; guests: string; note: string; status: string; created_at: string };
export type AdminCustomer = Customer & { created_at: string; last_sign_in?: string; devices: number; app_opens: number; last_seen: string };
export type RedemptionLog = { redemption_id: string; customer_name: string; offer_title: string; discount: string; status: string; created_at: string; redeemed_at?: string; expires_at: string };
export type VerifyResult = { success: boolean; message: string; offer_title: string; discount: string; member_name: string; member_phone: string; member_tier: string };
export type HomeData = { settings: Settings; favourites: MenuItem[]; new_additions: MenuItem[]; offers: Offer[]; gallery: GalleryItem[]; notifications: NotificationItem[] };

export const fileUrl = (path?: string) => (path ? `${baseUrl}/api/files/${path}` : undefined);

const TOKEN_KEY = "sipndine.admin.jwt";
export const tokenStore = {
  get: () => (Platform.OS === "web" ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY)),
  set: (value: string) => (Platform.OS === "web" ? AsyncStorage.setItem(TOKEN_KEY, value) : SecureStore.setItemAsync(TOKEN_KEY, value)),
  clear: () => (Platform.OS === "web" ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY)),
};

export class AuthExpiredError extends Error {}

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = await tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/api${path}`, { ...options, headers });
  if (auth && response.status === 401) { await tokenStore.clear(); throw new AuthExpiredError("Staff session expired. Please sign in again."); }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  home: () => request<HomeData>("/home"),
  settings: () => request<Settings>("/settings"),
  menu: () => request<MenuItem[]>("/menu"),
  offers: () => request<Offer[]>("/offers"),
  gallery: () => request<GalleryItem[]>("/gallery"),
  notifications: () => request<NotificationItem[]>("/notifications"),
  managers: () => request<Manager[]>("/managers"),
  track: (payload: { device_id: string; platform: string; customer_id?: string }) => request<{ ok: boolean }>("/track", { method: "POST", body: json(payload) }),
  signIn: (payload: { name: string; email: string; phone: string; device_id?: string }) => request<Customer>("/auth/sign-in", { method: "POST", body: json(payload) }),
  claim: (offerId: string, customerId: string) => request<Redemption>(`/offers/${offerId}/claim`, { method: "POST", body: json({ customer_id: customerId }) }),
  inquiry: (payload: { customer_id: string; manager_id: string; offering: string; date: string; guests: string; note: string }) => request<{ inquiry_id: string; status: string; message: string }>("/inquiries", { method: "POST", body: json(payload) }),
  reserve: (payload: { customer_id: string; date: string; time: string; party_size: string; occasion: string; note: string }) => request<{ reservation_id: string; status: string; message: string }>("/reservations", { method: "POST", body: json(payload) }),
  myReservations: (customerId: string) => request<Reservation[]>(`/reservations/mine/${customerId}`),
};

export type AdminCollection = "menu" | "offers" | "gallery" | "notifications" | "managers";

export const adminApi = {
  login: (email: string, password: string) => request<{ access_token: string; email: string }>("/admin/login", { method: "POST", body: json({ email, password }) }),
  me: () => request<{ email: string }>("/admin/me", {}, true),
  changePassword: (current_password: string, new_password: string) => request<{ ok: boolean }>("/admin/password", { method: "POST", body: json({ current_password, new_password }) }, true),
  stats: () => request<{ customers: number; app_devices: number; reservations_pending: number; inquiries_pending: number; redemptions_today: number; menu_items: number; offers: number }>("/admin/stats", {}, true),
  settings: () => request<Settings>("/admin/settings", {}, true),
  saveSettings: (body: Partial<Settings>) => request<Settings>("/admin/settings", { method: "PUT", body: json(body) }, true),
  list: <T,>(collection: AdminCollection) => request<T[]>(`/admin/content/${collection}`, {}, true),
  create: <T,>(collection: AdminCollection, body: Partial<T>) => request<T>(`/admin/content/${collection}`, { method: "POST", body: json(body) }, true),
  update: <T,>(collection: AdminCollection, id: string, body: Partial<T>) => request<T>(`/admin/content/${collection}/${id}`, { method: "PUT", body: json(body) }, true),
  remove: (collection: AdminCollection, id: string) => request<{ ok: boolean }>(`/admin/content/${collection}/${id}`, { method: "DELETE" }, true),
  upload: async (uri: string, name: string, type: string) => {
    const form = new FormData();
    if (Platform.OS === "web") { const blob = await (await fetch(uri)).blob(); form.append("file", blob, name); }
    else form.append("file", { uri, name, type } as unknown as Blob);
    return request<{ path: string }>("/admin/upload", { method: "POST", body: form }, true);
  },
  reservations: () => request<Reservation[]>("/admin/reservations", {}, true),
  setReservationStatus: (id: string, status: string) => request<{ ok: boolean }>(`/admin/reservations/${id}`, { method: "PATCH", body: json({ status }) }, true),
  inquiries: () => request<Inquiry[]>("/admin/inquiries", {}, true),
  setInquiryStatus: (id: string, status: string) => request<{ ok: boolean }>(`/admin/inquiries/${id}`, { method: "PATCH", body: json({ status }) }, true),
  customers: () => request<{ customers: AdminCustomer[]; anonymous_devices: number; anonymous_opens: number }>("/admin/customers", {}, true),
  redemptions: () => request<RedemptionLog[]>("/admin/redemptions", {}, true),
  verifyCode: (code: string) => request<VerifyResult>("/admin/verify", { method: "POST", body: json({ code }) }, true),
};
