import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { brandingFromMap } from "@/crm/lib/quotationBranding";
import { QuotationPreview } from "@/crm/components/QuotationPreview";
import { Printer } from "lucide-react";

export default function PublicQuoteView() {
  const { id } = useParams();
  const [q, setQ] = useState<any>(null);
  const [brandingMap, setBrandingMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [qRes, sRes] = await Promise.all([
        supabase.from("crm_quotations").select("*").eq("id", id).maybeSingle(),
        supabase.from("crm_admin_settings").select("setting_key, setting_value").in("setting_key", [
          "shop_name", "shop_address", "shop_phone", "shop_email", "shop_gst", "shop_website",
          "shop_logo_url", "quotation_primary_color", "quotation_accent_color",
          "quotation_font_color", "quotation_bg_color", "quotation_footer_text", "quotation_watermark",
        ]),
      ]);
      setQ(qRes.data);
      const m: Record<string, string> = {};
      (sRes.data || []).forEach((r: any) => { m[r.setting_key] = r.setting_value; });
      setBrandingMap(m);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  if (!q) return <div className="min-h-screen flex items-center justify-center text-slate-500">Quote not found</div>;

  const branding = brandingFromMap(brandingMap);

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:py-0 print:bg-white flex flex-col items-center">
      <div className="print:hidden mb-4 text-xs text-slate-500">Online Quotation View</div>
      <QuotationPreview q={q} b={branding} />
      <div className="mt-6 print:hidden">
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-2"><Printer size={14} />Print / Save as PDF</button>
      </div>
    </div>
  );
}
