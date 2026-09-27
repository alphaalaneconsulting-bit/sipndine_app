import Constants from "expo-constants";

const baseUrl = String(
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ?? process.env.EXPO_PUBLIC_BACKEND_URL ?? "",
).replace(/\/$/, "");

export type Offer = { offer_id: string; kind: string; title: string; subtitle: string; discount: string; validity: string; color: string };
export type GalleryItem = { gallery_id: string; eyebrow: string; title: string; caption: string; symbol: string };
export type NotificationItem = { notification_id: string; eyebrow: string; title: string; body: string; date_label: string; is_read: boolean };
export type Manager = { manager_id: string; name: string; role: string; status: string; status_color: string; specialty: string; phone: string; whatsapp: string };
export type Customer = { customer_id: string; name: string; email: string; phone: string; tier: string; points: number; points_to_next_tier: number };
export type Redemption = { redemption_id: string; code: string; expires_at: string; offer_title: string; instruction: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}/api${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

export const api = {
  home: () => request<{ hero: { eyebrow: string; title: string; caption: string }; offers: Offer[]; gallery: GalleryItem[]; notifications: NotificationItem[] }>("/home"),
  offers: () => request<Offer[]>("/offers"),
  gallery: () => request<GalleryItem[]>("/gallery"),
  notifications: () => request<NotificationItem[]>("/notifications"),
  managers: () => request<Manager[]>("/managers"),
  signIn: (payload: { name: string; email: string; phone: string }) => request<Customer>("/auth/sign-in", { method: "POST", body: JSON.stringify(payload) }),
  claim: (offerId: string, customerId: string) => request<Redemption>(`/offers/${offerId}/claim`, { method: "POST", body: JSON.stringify({ customer_id: customerId }) }),
  inquiry: (payload: { customer_id?: string; manager_id: string; offering: string; date: string; guests: string; note: string }) => request<{ inquiry_id: string; status: string; message: string }>("/inquiries", { method: "POST", body: JSON.stringify(payload) }),
};