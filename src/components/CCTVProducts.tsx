import { useCCTVProducts, useSiteSettings } from "@/hooks/use-site-data";
import { Camera, ShieldCheck } from "lucide-react";
import cctvDome from "@/assets/cctv-dome.jpg";
import cctvBullet from "@/assets/cctv-bullet.jpg";
import cctvDvr from "@/assets/cctv-dvr.jpg";

const categoryFallbacks: Record<string, string> = {
  Dome: cctvDome,
  Bullet: cctvBullet,
  DVR: cctvDvr,
  NVR: cctvDvr,
};

export default function CCTVProducts() {
  const { data: products = [] } = useCCTVProducts();
  const { data: settings } = useSiteSettings();
  const whatsapp = settings?.whatsapp || "919876543210";

  const handleEnquiry = (name: string) => {
    window.open(`https://wa.me/${whatsapp}?text=Hi! I'm interested in ${encodeURIComponent(name)}`, "_blank");
  };

  return (
    <section id="cctv" className="section-padding bg-gradient-to-b from-background to-card/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <ShieldCheck className="h-4 w-4" /> Security Solutions
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">CCTV & Surveillance</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Professional security cameras and surveillance systems for home & business</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <div key={p.id} className="glass rounded-2xl overflow-hidden group hover:glow-border transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                {(p.image || categoryFallbacks[p.category]) ? (
                  <img src={p.image || categoryFallbacks[p.category]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={800} height={600} />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                    <span className="text-xs text-muted-foreground">CCTV Image</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-card/80 backdrop-blur text-xs font-medium px-3 py-1 rounded-full text-primary border border-primary/20">
                  {p.category}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-heading text-lg font-semibold">{p.name}</h3>
                {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-heading font-bold text-primary">{p.price}</span>
                  <button onClick={() => handleEnquiry(p.name)} className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                    Enquire Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{ name: "Dome Camera 2MP", img: cctvDome, cat: "Dome", price: "₹1,499" }, { name: "Bullet Camera 5MP", img: cctvBullet, cat: "Bullet", price: "₹2,999" }, { name: "8CH DVR System", img: cctvDvr, cat: "DVR", price: "₹4,999" }].map((item, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden group hover:glow-border transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="aspect-[4/3] bg-secondary/50 relative overflow-hidden">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={800} height={600} />
                  <span className="absolute top-3 left-3 bg-card/80 backdrop-blur text-xs font-medium px-3 py-1 rounded-full text-primary border border-primary/20">{item.cat}</span>
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-lg font-semibold">{item.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-heading font-bold text-primary">{item.price}</span>
                    <button onClick={() => handleEnquiry(item.name)} className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">Enquire Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
