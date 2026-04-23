import { useDailyDeals, useSiteSettings, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Flame, Clock, MessageCircle } from "lucide-react";
import dealFallback from "@/assets/deal-laptop.jpg";

const fmt = (n?: number | null) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : null);

const DailyDeals = () => {
  const { data: deals, isLoading } = useDailyDeals();
  const { data: settings } = useSiteSettings();
  const { data: headings } = useSectionHeadings();
  const whatsapp = settings?.shop_whatsapp || settings?.whatsapp || "919876543210";
  const { heading, subheading, visible } = getHeading(headings, "deals", "Daily Deals", "Best prices updated every day | Offers for Today only");

  const activeDeals = deals?.filter((d) => new Date(d.valid_until) >= new Date(new Date().toDateString()));

  if (!visible || isLoading || !activeDeals?.length) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const daysLeft = (dateStr: string) =>
    Math.ceil((new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime()) / (1000 * 60 * 60 * 24));

  const enquire = (d: typeof activeDeals[number]) => {
    const msg = d.whatsapp_msg || `Hi! I want to grab the deal on ${d.title || d.name}.`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section id="deals" className="py-20 bg-[#0a0a0a]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Flame className="h-7 w-7 text-destructive animate-pulse" />
            <h2 className="font-heading text-3xl md:text-5xl font-black text-white">{heading}</h2>
            <Flame className="h-7 w-7 text-destructive animate-pulse" />
          </div>
          <p className="text-white/60">{subheading || "Grab these limited-time offers before they expire!"}</p>
        </div>

        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
          {activeDeals.map((deal) => {
            const remaining = daysLeft(deal.valid_until);
            const sale = fmt(deal.sale_price_num) || deal.deal_price;
            const reg = fmt(deal.regular_price_num);
            const mrp = fmt(deal.mrp) || deal.original_price;
            // Compute discount % if numeric values are present
            const auto = deal.discount_percent
              ?? (deal.sale_price_num && deal.mrp
                ? Math.round((1 - (Number(deal.sale_price_num) / Number(deal.mrp))) * 100)
                : null);

            return (
              <article
                key={deal.id}
                className="snap-start shrink-0 w-[260px] md:w-auto bg-white text-[#0a0a0a] rounded-2xl overflow-hidden group hover:shadow-[var(--shadow-yellow)] transition-all relative flex flex-col"
              >
                {/* Discount badge */}
                {auto && auto > 0 && (
                  <div className="absolute top-3 left-3 z-10 w-14 h-14 rounded-full vibrant-gradient text-primary-foreground flex flex-col items-center justify-center font-heading font-black shadow-xl">
                    <span className="text-base leading-none">{auto}%</span>
                    <span className="text-[8px] tracking-wider mt-0.5">OFF</span>
                  </div>
                )}
                {/* Urgency badge */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <Clock className="h-3 w-3" />
                  {remaining <= 1 ? "Last Day!" : `${remaining}d left`}
                </div>

                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={deal.image || dealFallback}
                    alt={deal.title || deal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-heading font-bold text-base mb-1 line-clamp-2">{deal.title || deal.name}</h3>
                  {deal.description && <p className="text-xs text-gray-600 line-clamp-2 mb-3">{deal.description}</p>}

                  <div className="space-y-0.5 mb-3">
                    {mrp && <p className="text-xs text-gray-400 line-through">MRP: {mrp}</p>}
                    {reg && <p className="text-xs text-gray-500">Regular: {reg}</p>}
                    <p className="text-2xl font-heading font-black" style={{ color: "hsl(var(--primary))" }}>
                      TODAY: {sale}
                    </p>
                  </div>

                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-4">
                    <Clock className="h-3 w-3" />
                    Valid till {formatDate(deal.valid_until)}
                  </p>

                  <button
                    onClick={() => enquire(deal)}
                    className="mt-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-heading font-semibold text-sm transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp Deal
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DailyDeals;
