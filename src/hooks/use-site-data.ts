import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  is_new: boolean;
  specs: string | null;
  display_order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

export interface YouTubeVideo {
  id: string;
  embed_url: string;
  title: string | null;
  display_order: number;
}

export interface DailyDeal {
  id: string;
  name: string;
  image: string;
  original_price: string;
  deal_price: string;
  valid_until: string;
  display_order: number;
}

export type SiteSettings = Record<string, string>;

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const settings: SiteSettings = {};
      data?.forEach((row) => { settings[row.key] = row.value; });
      return settings;
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("display_order");
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return data as Service[];
    },
  });
}

export function useGalleryImages() {
  return useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("*").order("display_order");
      if (error) throw error;
      return data as GalleryImage[];
    },
  });
}

export function useDailyDeals() {
  return useQuery({
    queryKey: ["daily-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_deals").select("*").order("display_order");
      if (error) throw error;
      return data as DailyDeal[];
    },
  });
}

export function useYouTubeVideos() {
  return useQuery({
    queryKey: ["youtube-videos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("youtube_videos").select("*").order("display_order");
      if (error) throw error;
      return data as YouTubeVideo[];
    },
  });
}
