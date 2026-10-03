import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api";

/** Home payload (settings + featured menu + offers + gallery + notifications), shared across screens. */
export function useHome() {
  return useQuery({ queryKey: ["home"], queryFn: api.home, staleTime: 60_000 });
}

export function useSettings() {
  const home = useHome();
  return home.data?.settings;
}

export const whatsappUrl = (number: string, text: string) => `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
