import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { adminApi, tokenStore, type AdminCollection } from "@/src/api";

type AdminValue = { email: string | null; ready: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> };
const AdminContext = createContext<AdminValue | null>(null);

export function AdminProvider({ children }: PropsWithChildren) {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { tokenStore.get().then(async (token) => { if (token) { try { const me = await adminApi.me(); setEmail(me.email); } catch { setEmail(null); } } setReady(true); }); }, []);
  const login = async (nextEmail: string, password: string) => { const res = await adminApi.login(nextEmail, password); await tokenStore.set(res.access_token); setEmail(res.email); };
  const logout = async () => { await tokenStore.clear(); setEmail(null); };
  return <AdminContext.Provider value={{ email, ready, login, logout }}>{children}</AdminContext.Provider>;
}

export function useAdmin() { const value = useContext(AdminContext); if (!value) throw new Error("AdminProvider is missing"); return value; }

export type FieldType = "text" | "multiline" | "number" | "boolean" | "image" | "select";
export type FieldDef = { key: string; label: string; type?: FieldType; options?: string[]; hint?: string };

export const COLLECTION_META: Record<AdminCollection, { title: string; idField: string; titleField: string; subtitleField?: string; imageField?: string; fields: FieldDef[] }> = {
  menu: {
    title: "Menu items", idField: "item_id", titleField: "name", subtitleField: "price", imageField: "image",
    fields: [
      { key: "name", label: "Dish name" }, { key: "description", label: "Description", type: "multiline" }, { key: "price", label: "Price", hint: "e.g. ₹545" },
      { key: "category", label: "Category", type: "select", options: ["Starters", "Mains", "Breads & Rice", "Desserts", "Bar"] },
      { key: "image", label: "Photo", type: "image" },
      { key: "is_favourite", label: "Show in Favourites & recommendations", type: "boolean" }, { key: "is_new", label: "Show in New additions", type: "boolean" },
      { key: "is_veg", label: "Vegetarian", type: "boolean" }, { key: "is_available", label: "Available (visible to guests)", type: "boolean" }, { key: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  offers: {
    title: "Offers & combos", idField: "offer_id", titleField: "title", subtitleField: "discount", imageField: "image",
    fields: [
      { key: "title", label: "Title" }, { key: "subtitle", label: "Subtitle", type: "multiline" }, { key: "discount", label: "Discount / price", hint: "e.g. 20% off or ₹2,499" },
      { key: "kind", label: "Type", type: "select", options: ["In-house", "Buffet", "Combo", "Takeaway", "Festival"] }, { key: "validity", label: "Validity", hint: "e.g. Every Sunday · 12:30–4 PM" },
      { key: "terms", label: "Terms", type: "multiline" }, { key: "image", label: "Photo", type: "image" },
      { key: "max_per_day", label: "Max redemptions per member per 24h", type: "number", hint: "Anti-misuse cap. 1 = once a day." }, { key: "is_active", label: "Active", type: "boolean" }, { key: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  gallery: {
    title: "Gallery", idField: "gallery_id", titleField: "title", subtitleField: "eyebrow", imageField: "image",
    fields: [{ key: "eyebrow", label: "Eyebrow", hint: "Small label, e.g. Private dining" }, { key: "title", label: "Title" }, { key: "caption", label: "Caption" }, { key: "image", label: "Photo", type: "image" }, { key: "sort_order", label: "Sort order", type: "number" }],
  },
  notifications: {
    title: "Notifications", idField: "notification_id", titleField: "title", subtitleField: "date_label",
    fields: [{ key: "eyebrow", label: "Label", hint: "e.g. Festival note" }, { key: "title", label: "Title" }, { key: "body", label: "Message", type: "multiline" }, { key: "date_label", label: "Date label", hint: "e.g. 18 Oct" }],
  },
  managers: {
    title: "Managers", idField: "manager_id", titleField: "name", subtitleField: "role",
    fields: [{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "specialty", label: "Specialty" }, { key: "status", label: "Status line", hint: "e.g. Available today" }, { key: "phone", label: "Phone", hint: "+91…" }, { key: "whatsapp", label: "WhatsApp number", hint: "digits only, with country code" }],
  },
};

export const SETTINGS_GROUPS: { title: string; fields: FieldDef[] }[] = [
  { title: "Brand & home", fields: [{ key: "brand_name", label: "Brand name" }, { key: "tagline", label: "Tagline" }, { key: "hero_eyebrow", label: "Home eyebrow" }, { key: "hero_title", label: "Home headline" }, { key: "hero_caption", label: "Home caption", type: "multiline" }, { key: "hero_image", label: "Home / book-a-table photo", type: "image" }] },
  { title: "Book a table card", fields: [{ key: "book_title", label: "Title" }, { key: "book_caption", label: "Caption", type: "multiline" }] },
  { title: "Promo banner", fields: [{ key: "promo_eyebrow", label: "Eyebrow" }, { key: "promo_title", label: "Title" }, { key: "promo_caption", label: "Caption" }, { key: "promo_image", label: "Photo", type: "image" }] },
  { title: "Section titles", fields: [{ key: "favourites_title", label: "Favourites title" }, { key: "favourites_caption", label: "Favourites caption" }, { key: "new_title", label: "New additions title" }, { key: "new_caption", label: "New additions caption" }] },
  { title: "Contact", fields: [{ key: "phone", label: "Phone", hint: "+91…" }, { key: "whatsapp", label: "WhatsApp number", hint: "digits only, with country code e.g. 911724641656" }, { key: "whatsapp_greeting", label: "WhatsApp opening line" }, { key: "email", label: "Email" }, { key: "address", label: "Address", type: "multiline" }, { key: "maps_url", label: "Google Maps link", type: "multiline" }, { key: "hours", label: "Opening hours" }] },
  { title: "About us", fields: [{ key: "about_title", label: "Title" }, { key: "about_body", label: "Story", type: "multiline" }] },
  { title: "Privileges & takeaway", fields: [{ key: "discount_terms", label: "Discount terms", type: "multiline" }, { key: "takeaway_note", label: "Takeaway note", type: "multiline" }] },
];
