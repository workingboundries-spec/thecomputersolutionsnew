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
  description?: string | null;
  regular_price?: number | null;
  sale_price?: number | null;
  mrp?: number | null;
  whatsapp_enquiry_msg?: string | null;
  badge?: string | null;
  is_active?: boolean | null;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  thumbnail_url?: string | null;
  is_active?: boolean | null;
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
  description?: string | null;
  youtube_url?: string | null;
  thumbnail_url?: string | null;
  is_active?: boolean | null;
}

export interface DailyDeal {
  id: string;
  name: string;
  image: string;
  original_price: string;
  deal_price: string;
  valid_until: string;
  display_order: number;
  title?: string | null;
  description?: string | null;
  mrp?: number | null;
  regular_price_num?: number | null;
  sale_price_num?: number | null;
  discount_percent?: number | null;
  whatsapp_msg?: string | null;
  is_active?: boolean | null;
}

export interface CCTVProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  category: string;
  display_order: number;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  is_visible: boolean;
}

export interface BannerSlide {
  id: string;
  image_url: string | null;
  heading: string | null;
  subheading: string | null;
  button_text: string | null;
  button_link: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DealerBrand {
  id: string;
  brand_name: string;
  logo_url: string | null;
  website_url: string | null;
  brand_type: string;
  sort_order: number;
  is_active: boolean;
}

export interface InstagramReel {
  id: string;
  title: string | null;
  reel_url: string | null;
  thumbnail_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface TestimonialVideo {
  id: string;
  customer_name: string;
  location: string | null;
  product_purchased: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  review_text: string | null;
  rating: number;
  sort_order: number;
  is_active: boolean;
}

export interface SectionHeading {
  id: string;
  section_key: string;
  heading: string;
  subheading: string | null;
  is_visible: boolean;
}

export interface SisterConcern {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  thumbnail_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface IntroSection {
  id: string;
  heading: string;
  subheading: string | null;
  body_text: string | null;
  youtube_url: string | null;
  is_visible: boolean;
}

export type SiteSettings = Record<string, string>;
export type SectionHeadingsMap = Record<string, SectionHeading>;

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
      return (data as Product[]).filter((p) => p.is_active !== false);
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return (data as Service[]).filter((s) => s.is_active !== false);
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
      return (data as DailyDeal[]).filter((d) => d.is_active !== false);
    },
  });
}

export function useYouTubeVideos() {
  return useQuery({
    queryKey: ["youtube-videos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("youtube_videos").select("*").order("display_order");
      if (error) throw error;
      return (data as YouTubeVideo[]).filter((v) => v.is_active !== false);
    },
  });
}

export function useCCTVProducts() {
  return useQuery({
    queryKey: ["cctv-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cctv_products").select("*").order("display_order");
      if (error) throw error;
      return data as CCTVProduct[];
    },
  });
}

export function useNavItems() {
  return useQuery({
    queryKey: ["nav-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nav_items").select("*").order("sort_order");
      if (error) throw error;
      return (data as NavItem[]).filter((n) => n.is_visible);
    },
  });
}

export function useBannerSlides() {
  return useQuery({
    queryKey: ["banner-slides"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banner_slides").select("*").order("sort_order");
      if (error) throw error;
      return (data as BannerSlide[]).filter((b) => b.is_active);
    },
  });
}

export function useDealerBrands() {
  return useQuery({
    queryKey: ["dealer-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dealer_brands").select("*").order("sort_order");
      if (error) throw error;
      return (data as DealerBrand[]).filter((b) => b.is_active);
    },
  });
}

export function useInstagramReels() {
  return useQuery({
    queryKey: ["instagram-reels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instagram_reels").select("*").order("sort_order");
      if (error) throw error;
      return (data as InstagramReel[]).filter((r) => r.is_active);
    },
  });
}

export function useTestimonialVideos() {
  return useQuery({
    queryKey: ["testimonial-videos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonial_videos").select("*").order("sort_order");
      if (error) throw error;
      return (data as TestimonialVideo[]).filter((t) => t.is_active);
    },
  });
}

export function useSectionHeadings() {
  return useQuery({
    queryKey: ["section-headings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("section_headings").select("*");
      if (error) throw error;
      const map: SectionHeadingsMap = {};
      (data as SectionHeading[]).forEach((s) => { map[s.section_key] = s; });
      return map;
    },
  });
}

/** Helper: render a heading + subheading from the section_headings map with safe fallbacks */
export function getHeading(map: SectionHeadingsMap | undefined, key: string, fallbackHeading: string, fallbackSub?: string) {
  const row = map?.[key];
  return {
    heading: row?.heading || fallbackHeading,
    subheading: row?.subheading ?? fallbackSub ?? "",
    visible: row ? row.is_visible : true,
  };
}

export function useSisterConcerns() {
  return useQuery({
    queryKey: ["sister-concerns"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("sister_concerns").select("*").order("sort_order");
      if (error) throw error;
      return ((data as SisterConcern[]) || []).filter((c) => c.is_active);
    },
  });
}

export function useIntroSection() {
  return useQuery({
    queryKey: ["intro-section"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("intro_section").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as IntroSection | null;
    },
  });
}
