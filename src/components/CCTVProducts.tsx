import { useCCTVProducts, useSiteSettings, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { useWhatsappTemplates, getTemplateMessage } from "@/hooks/use-whatsapp-templates";
import { Camera, ShieldCheck, MessageCircle, Check } from "lucide-react";
import cctvDome from "@/assets/cctv-dome.jpg";
import cctvBullet from "@/assets/cctv-bullet.jpg";
import cctvDvr from "@/assets/cctv-dvr.jpg";

const categoryFallbacks: Record<string, string> = {
  Dome: cctvDome, Bullet: cctvBullet, DVR: cctvDvr, NVR: cctvDvr,
};

export default function CCTVProducts() {
  const { data: products = [] } = useCCTVProducts();
  const { data: settings } = useSiteSettings();
  const { data: headings } = useSectionHeadings();
  const { data: waTemplates } = useWhatsappTemplates();
  const whatsapp = settings?.shop_whatsapp || settings?.whatsapp || "919876543210";
  const { heading, subheading, visible } = getHeading(headings, "cctv", "CCTV & Surveillance", "Secure your home and business");

  if (!visible) return null;

  const enquire = (name: string, price: string) => {
    const msg = getTemplateMessage(waTemplates, "cctv_enquiry", { product: name, price }, `Hi! I'm interested in ${name}. Please share details and price.`);
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const list = products.length > 0 ? products : [
    { id: "fa", name: "Dome Camera 2MP", description: "Indoor HD surveillance", image: cctvDome, category: "Dome", price: "₹1,499", display_order: 1 },
    { id: "fb", name: "Bullet Camera 5MP", description: "Outdoor weatherproof IR camera", image: cctvBullet, category: "Bullet", price: "₹2,999", display_order: 2 },
    { id: "fc", name: "8CH DVR System", description: "Full HD recording with backup", image: cctvDvr, category: "DVR", price: "₹4,999", display_order: 3 },
  ] as any[];

  return (
    <section id="cctv" className="section-padding bg-[#0a0f0a]">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <ShieldCheck className="h-4 w-4" /> Security Solutions
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white">{heading}</h2>
          {subheading && <p className="text-white/60 mt-3 max-w-xl mx-auto">{subheading}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {list.map((p, i) => {
            const specs = (p.description || "").split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 4);
            return (
              <article
                key={p.id}
                className="bg-[#0f1a0f] border border-emerald-500/20 hover:border-emerald-500/60 rounded-2xl overflow-hidden flex flex-col sm:flex-row group hover:shadow-[0_8px_32px_rgba(16,185,129,0.3)] transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto relative overflow-hidden bg-secondary/50">
                  <img
                    src={p.image || categoryFallbacks[p.category] || cctvDome}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Surveillance green tint */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 to-transparent mix-blend-overlay" />
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur text-xs font-medium px-3 py-1 rounded-full text-emerald-400 border border-emerald-500/40">
                    {p.category}
                  </span>
                </div>

                <div className="sm:w-3/5 p-5 flex flex-col text-white">
                  <h3 className="font-heading text-xl font-bold mb-1">{p.name}</h3>
                  {specs.length > 0 ? (
                    <ul className="space-y-1 my-3 flex-1">
                      {specs.map((s: string, k: number) => (
                        <li key={k} className="flex items-center gap-2 text-sm text-white/80">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" strokeWidth={3} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/70 my-3 flex-1">{p.description}</p>
                  )}

                  <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3">
                    <span className="text-xl font-heading font-black text-emerald-400">{p.price}</span>
                    <button onClick={() => enquire(p.name)} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold font-heading transition-colors">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {products.length === 0 && (
          <p className="text-center text-white/40 mt-6 text-sm">Showing sample products — add real CCTV products from the admin panel.</p>
        )}
      </div>
    </section>
  );
}
