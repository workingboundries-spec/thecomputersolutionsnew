import { useEffect, useState } from "react";
import { useBannerSlides, useSiteSettings } from "@/hooks/use-site-data";
import heroBannerDefault from "@/assets/hero-yellow.jpg";
import { Phone, Zap, ArrowRight } from "lucide-react";

export default function HeroBanner() {
  const { data: settings } = useSiteSettings();
  const { data: slides = [] } = useBannerSlides();
  const [active, setActive] = useState(0);

  const whatsapp = settings?.shop_whatsapp || settings?.whatsapp || "919876543210";

  // Auto-advance every 5s
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  // CMS-driven slides take priority
  if (slides.length > 0) {
    const slide = slides[active];
    return (
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img
            src={slide.image_url || heroBannerDefault}
            alt={slide.heading || "Computer Solutions"}
            className="w-full h-full object-cover transition-opacity duration-700"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/30 rounded-full blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 glass-yellow rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-heading font-semibold text-primary tracking-wide">YOUR TECH GAME, LEVEL UP</span>
            </div>
            <h1 className="font-heading text-4xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05] text-foreground">
              {slide.heading || "Power Up Your Setup."}
            </h1>
            {slide.subheading && (
              <p className="text-lg md:text-2xl text-foreground/80 max-w-2xl mb-10 font-body">
                {slide.subheading}
              </p>
            )}
            {slide.button_text && (
              <button
                onClick={() => {
                  if (slide.button_link?.startsWith("#")) {
                    document.querySelector(slide.button_link)?.scrollIntoView({ behavior: "smooth" });
                  } else if (slide.button_link) {
                    window.open(slide.button_link, "_blank");
                  }
                }}
                className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-heading font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[var(--shadow-yellow)]"
              >
                {slide.button_text}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-primary" : "w-2 bg-foreground/40 hover:bg-foreground/60"}`}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  // Fallback static hero (unchanged from prior design)
  const bannerSubtitle = settings?.banner_subtitle || settings?.shop_tagline || "Your trusted destination for branded laptops, desktops & accessories";
  const bgImage = settings?.banner_image || heroBannerDefault;

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0">
        <img src={bgImage} alt="Computer Solutions" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/30 rounded-full blur-[100px] animate-glow-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 glass-yellow rounded-full px-4 py-1.5 mb-6 animate-fade-in-up">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-heading font-semibold text-primary tracking-wide">YOUR TECH GAME, LEVEL UP</span>
          </div>

          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-vibrant">Power Up</span>
            <br />
            <span className="text-foreground">Your Setup.</span>
          </h1>

          <p className="text-lg md:text-2xl text-foreground/80 max-w-2xl mb-10 font-body animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {bannerSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <button
              onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}
              className="group flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-heading font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[var(--shadow-yellow)]"
            >
              Explore Now
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => window.open(`https://wa.me/${whatsapp}`, "_blank")}
              className="flex items-center justify-center gap-2 bg-foreground/5 backdrop-blur-md border-2 border-primary/40 text-foreground px-8 py-4 rounded-xl font-heading font-bold text-lg hover:bg-primary/10 hover:border-primary transition-all"
            >
              <Phone className="h-5 w-5 text-primary" /> WhatsApp Us
            </button>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            {[
              { num: "500+", label: "Laptops Sold" },
              { num: "50+", label: "Brands" },
              { num: "4.8★", label: "Rating" },
              { num: "24/7", label: "Support" },
            ].map((s) => (
              <div key={s.label} className="glass-yellow rounded-2xl p-4 hover:scale-105 transition-transform">
                <div className="text-2xl md:text-3xl font-heading font-bold text-primary">{s.num}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
