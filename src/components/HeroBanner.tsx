import { getSiteData } from "@/lib/store";
import heroBannerDefault from "@/assets/hero-banner.jpg";
import { Phone } from "lucide-react";

export default function HeroBanner() {
  const data = getSiteData();
  const bgImage = data.bannerImage || heroBannerDefault;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${data.whatsapp}`, "_blank");
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={bgImage} alt="Laptop Showroom" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
          {data.bannerTitle.split(" ").map((word, i) =>
            i < 2 ? <span key={i} className="text-gradient">{word} </span> : <span key={i}>{word} </span>
          )}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {data.bannerSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <button
            onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-heading font-semibold text-lg hover:opacity-90 transition-opacity animate-glow-pulse"
          >
            Explore Laptops
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 border border-primary/30 text-primary px-8 py-3 rounded-lg font-heading font-semibold text-lg hover:bg-primary/10 transition-colors"
          >
            <Phone className="h-5 w-5" /> WhatsApp Us
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          {[
            { num: "500+", label: "Laptops Sold" },
            { num: "50+", label: "Brands" },
            { num: "4.8★", label: "Rating" },
            { num: "24/7", label: "Support" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4">
              <div className="text-2xl font-heading font-bold text-primary">{s.num}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
