import { useProducts, useSiteSettings, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Sparkles, MessageCircle } from "lucide-react";
import newArrival1 from "@/assets/new-arrival-1.jpg";
import newArrival2 from "@/assets/new-arrival-2.jpg";
import newArrival3 from "@/assets/new-arrival-3.jpg";
import newArrival4 from "@/assets/new-arrival-4.jpg";

const fallbackImages = [newArrival1, newArrival2, newArrival3, newArrival4];

const fmt = (n?: number | null) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : null);

export default function NewArrivals() {
  const { data: products = [] } = useProducts();
  const { data: settings } = useSiteSettings();
  const { data: headings } = useSectionHeadings();
  const whatsapp = settings?.shop_whatsapp || settings?.whatsapp || "919876543210";
  const { heading, subheading, visible } = getHeading(headings, "new_arrivals", "New Arrivals", "Latest products just landed");

  const newItems = products.filter((p) => p.is_new || p.badge === "New Arrival").slice(0, 8);

  if (!visible || newItems.length === 0) return null;

  const enquire = (p: typeof newItems[number]) => {
    const msg = p.whatsapp_enquiry_msg || `Hi! I am interested in ${p.name}. Please share details and price.`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section id="new-arrivals" className="section-padding">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
          <Sparkles className="h-7 w-7 text-primary" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold">{heading}</h2>
        </div>
        {subheading && <p className="text-muted-foreground mb-10 text-center md:text-left">{subheading}</p>}

        {/* Horizontal snap-scroll on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
          {newItems.map((p, i) => {
            const sale = fmt(p.sale_price);
            const reg = fmt(p.regular_price);
            const mrp = fmt(p.mrp);

            return (
              <article
                key={p.id}
                className="snap-start shrink-0 w-[260px] md:w-auto glass rounded-2xl p-5 hover:border-primary/60 hover:shadow-[var(--shadow-yellow)] transition-all duration-300 group animate-fade-in-up flex flex-col"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center mb-4 overflow-hidden relative">
                  <img
                    src={p.image || fallbackImages[i % fallbackImages.length]}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <span className="absolute top-2 right-2 vibrant-gradient text-primary-foreground text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider">
                    NEW
                  </span>
                </div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">{p.category}</span>
                <h3 className="font-heading font-semibold mt-1 line-clamp-2">{p.name}</h3>
                {p.specs && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.specs}</p>}

                <div className="mt-3 mb-4">
                  {mrp && <p className="text-xs text-muted-foreground line-through">MRP: {mrp}</p>}
                  {sale ? (
                    <p className="text-primary font-heading font-black text-lg">{sale}</p>
                  ) : reg ? (
                    <p className="text-primary font-heading font-black text-lg">{reg}</p>
                  ) : (
                    <p className="text-primary font-heading font-black text-lg">{p.price}</p>
                  )}
                </div>

                <button
                  onClick={() => enquire(p)}
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-heading font-semibold text-sm transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Enquiry
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
