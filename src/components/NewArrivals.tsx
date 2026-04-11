import { useProducts, useSiteSettings } from "@/hooks/use-site-data";
import { Sparkles, ArrowRight } from "lucide-react";
import newArrival1 from "@/assets/new-arrival-1.jpg";
import newArrival2 from "@/assets/new-arrival-2.jpg";
import newArrival3 from "@/assets/new-arrival-3.jpg";
import newArrival4 from "@/assets/new-arrival-4.jpg";

const fallbackImages = [newArrival1, newArrival2, newArrival3, newArrival4];

export default function NewArrivals() {
  const { data: products = [] } = useProducts();
  const { data: settings } = useSiteSettings();
  const whatsapp = settings?.whatsapp || "919876543210";
  const newItems = products.filter((p) => p.is_new).slice(0, 4);

  if (newItems.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <Sparkles className="h-8 w-8 text-primary" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold">New Arrivals</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {newItems.map((p, i) => (
            <div key={p.id} className="glass rounded-2xl p-5 hover:glow-border transition-all duration-300 group animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center mb-4 overflow-hidden">
                <img src={p.image || fallbackImages[i % fallbackImages.length]} alt={p.name} className="w-full h-full object-cover" loading="lazy" width={800} height={800} />
              </div>
              <span className="text-xs text-primary font-semibold uppercase tracking-wide">{p.category}</span>
              <h3 className="font-heading font-semibold mt-1">{p.name}</h3>
              <p className="text-primary font-heading font-bold text-lg mt-1">{p.price}</p>
              <button
                onClick={() => window.open(`https://wa.me/${whatsapp}?text=Hi! I'm interested in ${encodeURIComponent(p.name)}`, "_blank")}
                className="flex items-center gap-1 text-sm text-primary mt-3 group-hover:gap-2 transition-all"
              >
                Enquire <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
