import { useSiteSettings } from "@/hooks/use-site-data";

const brands = ["HP", "Dell", "Lenovo", "ASUS", "Acer", "Apple", "MSI", "Samsung", "Microsoft", "LG"];

export default function BrandsMarquee() {
  const { data: settings } = useSiteSettings();
  const tagline = settings?.brands_tagline || "Authorized Dealer for All Major Brands";

  return (
    <section className="py-10 border-y border-border/50 overflow-hidden bg-gradient-to-r from-background via-card/50 to-background">
      <div className="container mx-auto mb-8 text-center">
        <span className="text-primary/80 text-sm font-heading tracking-[0.3em] uppercase font-medium">
          {tagline}
        </span>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-16 animate-marquee">
          {[...brands, ...brands, ...brands].map((b, i) => (
            <span
              key={i}
              className="text-2xl md:text-3xl font-heading font-bold text-muted-foreground/20 whitespace-nowrap hover:text-primary/60 transition-all duration-300 hover:scale-110 cursor-default"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
