import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SeoMetaTag {
  id: string;
  page_key: string;
  page_label: string;
  title: string;
  description: string;
  keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_url: string | null;
  twitter_card: string | null;
  canonical_url: string | null;
  structured_data: any;
  is_active: boolean;
  sort_order: number;
}

export function useSeoTags() {
  return useQuery({
    queryKey: ["seo_meta_tags"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seo_meta_tags")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as SeoMetaTag[];
    },
    staleTime: 60_000,
  });
}

export function useSeoTag(pageKey: string) {
  return useQuery({
    queryKey: ["seo_meta_tags", pageKey],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seo_meta_tags")
        .select("*")
        .eq("page_key", pageKey)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as SeoMetaTag | null;
    },
    staleTime: 60_000,
  });
}
