import { useDealerBrands, useSectionHeadings, getHeading } from "@/hooks/use-site-data";

export default function BrandsMarquee() {
  const { data: brands = [] } = useDealerBrands();
  const { data: headings } = useSectionHeadings();
  const dealers = brands.filter((b) => b.brand_type !== "service");
  const { heading, subheading, visible } = getHeading(headings, "authorized_dealers", "Our Authorized Brands", "Trusted by leading technology brands");

  if (!visible) return null;

  // Fallback brand list
  const list = dealers.length > 0 ? dealers : "HP,Dell,Lenovo,ASUS,Acer,Apple,MSI,Samsung,Microsoft,LG"
    .split(",").map((b, i) => ({ id: `f${i}`, brand_name: b, logo_url: null, website_url: null, brand_type: "dealer", sort_order: i, is_active: true }));

  // Duplicate for seamless loop
  const looped = [...list, ...list, ...list];

  return (
    <section className="py-16 border-y border-primary/20 overflow-hidden bg-gradient-to-r from-background via-card to-background">
      <div className="container mx-auto text-center mb-8">
        <span className="inline-block bg-primary/15 text-primary font-heading text-xs font-bold tracking-[0.3em] uppercase px-4 py-1.5 rounded-full mb-3">
          AUTHORIZED DEALERS
        </span>
        <h2 className="font-heading text-2xl md:text-4xl font-bold">{heading}</h2>
        {subheading && <p className="text-muted-foreground mt-2">{subheading}</p>}
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex gap-5 animate-marquee hover:[animation-play-state:paused]">
          {looped.map((b, i) => {
            const card = (
              <div
                key={`${b.id}-${i}`}
                className="shrink-0 w-[180px] h-[90px] bg-card border border-primary/20 rounded-2xl flex items-center justify-center px-4 hover:border-primary/60 hover:scale-[1.04] hover:shadow-[var(--shadow-yellow)] transition-all"
              >
                {b.logo_url ? (
                  <img
                    src={b.logo_url}
                    alt={b.brand_name}
                    className="max-h-12 max-w-[140px] object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xl font-heading font-black text-foreground/80 tracking-tight">
                    {b.brand_name}
                  </span>
                )}
              </div>
            );
            return b.website_url ? (
              <a key={`${b.id}-${i}`} href={b.website_url} target="_blank" rel="noopener noreferrer">
                {card}
              </a>
            ) : card;
          })}
        </div>
      </div>
    </section>
  );
}
