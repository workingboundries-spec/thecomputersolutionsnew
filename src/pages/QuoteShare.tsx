import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate } from "@/crm/lib/format";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

type Quote = {
  id: string;
  shared_config: string | null;
  shared_price: number;
  valid_until: string;
  customer_name: string | null;
  is_active: boolean;
  created_at: string;
  catalogue_id: string | null;
};

type Item = { brand: string; model: string; category: string; image_url: string | null; specs: string | null };

export default function QuoteShare() {
  const { uuid } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!uuid) return;
    (async () => {
      const { data: q } = await supabase.from("crm_quote_shares").select("*").eq("share_link", uuid).maybeSingle();
      if (q) {
        setQuote(q as Quote);
        const days = Math.ceil((new Date(q.valid_until).getTime() - Date.now()) / 86400000);
        setDaysLeft(days);
        if (q.catalogue_id) {
          const { data: it } = await supabase.from("crm_catalogue").select("brand,model,category,image_url,specs").eq("id", q.catalogue_id).maybeSingle();
          if (it) setItem(it as Item);
        }
      }
      setLoading(false);
    })();
  }, [uuid]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">Loading quote...</div>;

  if (!quote || !quote.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Quote Not Available</h1>
          <p className="text-slate-600">This quote link is invalid or has been deactivated. Please contact us for a fresh quote.</p>
        </div>
      </div>
    );
  }

  const expired = daysLeft < 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold">The Computer Solutions</div>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">Your Personalised Quote</h1>
          {quote.customer_name && <p className="text-slate-600 mt-1">Prepared for {quote.customer_name}</p>}
        </div>

        {/* Validity banner */}
        <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 text-sm ${expired ? "bg-red-100 text-red-700" : daysLeft <= 2 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
          <Clock size={16} />
          {expired ? "This quote has expired. Please contact us for a refresh." : `Valid until ${formatDate(quote.valid_until)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)`}
        </div>

        {/* Item card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
          {item?.image_url && <img src={item.image_url} alt={item.model} className="w-full aspect-video object-cover bg-slate-100" />}
          <div className="p-6">
            {item ? (
              <>
                <div className="text-xs uppercase tracking-wider text-slate-500">{item.category}</div>
                <h2 className="text-2xl font-bold text-slate-900">{item.brand}</h2>
                <p className="text-slate-600 mb-4">{item.model}</p>
              </>
            ) : <h2 className="text-2xl font-bold text-slate-900 mb-4">Custom Quote</h2>}

            {quote.shared_config && (
              <div className="bg-slate-50 rounded p-4 mb-4">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Configuration</div>
                <p className="text-slate-700 whitespace-pre-line text-sm">{quote.shared_config}</p>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <div className="text-xs uppercase tracking-wider text-slate-500">Special Price</div>
              <div className="text-4xl font-bold text-blue-600">{formatINR(quote.shared_price)}</div>
              <p className="text-xs text-slate-500 mt-1">Inclusive of all applicable taxes</p>
            </div>
          </div>
        </div>

        {/* Contact card */}
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <h3 className="font-semibold text-slate-900">Ready to proceed?</h3>
          <a href="tel:+919876543210" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-sm">
            <Phone size={18} className="text-blue-600" /> Call us
          </a>
          <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 text-sm">
            <Mail size={18} /> WhatsApp us
          </a>
          <div className="flex items-start gap-3 p-3 text-slate-600 text-sm">
            <MapPin size={18} className="text-blue-600 mt-0.5" />
            <span>Visit our store — The Computer Solutions</span>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          <a href="/" className="text-blue-600 hover:underline">thecomputersolutions.in</a>
        </div>
      </div>
    </div>
  );
}
