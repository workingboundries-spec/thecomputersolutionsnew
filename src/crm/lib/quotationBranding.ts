import { useAdminSettings } from "@/crm/hooks/useAdminSettings";

export type QuotationBranding = {
  logo_url: string;
  primary: string;
  accent: string;
  font: string;
  bg: string;
  footer_text: string;
  watermark: string;
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  shop_gst: string;
  shop_website: string;
};

const DEFAULTS = {
  primary: "#1a1a2e",
  accent: "#e94560",
  font: "#1a1a2e",
  bg: "#ffffff",
  footer_text: "Thank you for your business!",
  watermark: "QUOTATION",
};

export function useQuotationBranding(): QuotationBranding {
  const m = useAdminSettings([
    "shop_logo_url",
    "quotation_primary_color",
    "quotation_accent_color",
    "quotation_font_color",
    "quotation_bg_color",
    "quotation_footer_text",
    "quotation_watermark",
    "shop_name",
    "shop_address",
    "shop_phone",
    "shop_email",
    "shop_gst",
    "shop_website",
  ]);
  return {
    logo_url: m.shop_logo_url || "",
    primary: m.quotation_primary_color || DEFAULTS.primary,
    accent: m.quotation_accent_color || DEFAULTS.accent,
    font: m.quotation_font_color || DEFAULTS.font,
    bg: m.quotation_bg_color || DEFAULTS.bg,
    footer_text: m.quotation_footer_text || DEFAULTS.footer_text,
    watermark: m.quotation_watermark || DEFAULTS.watermark,
    shop_name: m.shop_name || "The Computer Solutions",
    shop_address: m.shop_address || "",
    shop_phone: m.shop_phone || "",
    shop_email: m.shop_email || "",
    shop_gst: m.shop_gst || "",
    shop_website: m.shop_website || "",
  };
}

export function brandingFromMap(m: Record<string, string>): QuotationBranding {
  return {
    logo_url: m.shop_logo_url || "",
    primary: m.quotation_primary_color || DEFAULTS.primary,
    accent: m.quotation_accent_color || DEFAULTS.accent,
    font: m.quotation_font_color || DEFAULTS.font,
    bg: m.quotation_bg_color || DEFAULTS.bg,
    footer_text: m.quotation_footer_text || DEFAULTS.footer_text,
    watermark: m.quotation_watermark || DEFAULTS.watermark,
    shop_name: m.shop_name || "The Computer Solutions",
    shop_address: m.shop_address || "",
    shop_phone: m.shop_phone || "",
    shop_email: m.shop_email || "",
    shop_gst: m.shop_gst || "",
    shop_website: m.shop_website || "",
  };
}

export const BRANDING_DEFAULTS = DEFAULTS;
