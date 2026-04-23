import { ArrowUpRight, Building2 } from "lucide-react";
import { useSisterConcerns } from "@/hooks/use-site-data";

export default function SisterConcerns() {
  const { data: concerns = [] } = useSisterConcerns();

  if (concerns.length === 0) return null;

  return (
    <section id="sister-concerns" className="section-padding relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-14">
          <span className="inline-block glass-yellow rounded-full px-4 py-1.5 text-primary font-heading text-xs font-bold tracking-[0.3em] uppercase mb-4">
            Our Family
          </span>
          <h2 className="font-heading text-4xl md:text-6xl font-bold mb-4">
            Meet Our <span className="text-vibrant">Extended Ventures</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A trusted network of brands committed to education, technology, and global opportunities.
          </p>
        </div>

        <div className="space-y-6 max-w-5xl mx-auto">
          {concerns.map((c) => {
            const CardWrapper: any = c.website_url ? "a" : "div";
            const linkProps = c.website_url
              ? { href: c.website_url, target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <CardWrapper
                key={c.id}
                {...linkProps}
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch bg-card border border-primary/20 rounded-3xl p-5 md:p-6 hover:border-primary/60 hover:-translate-y-1 hover:shadow-[var(--shadow-yellow)] transition-all duration-500 overflow-hidden"
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

                {/* Landscape thumbnail */}
                <div className="md:col-span-5 relative">
                  <div className="aspect-[16/9] md:aspect-[16/10] rounded-2xl overflow-hidden bg-background/50 border border-primary/20 group-hover:border-primary/50 transition-colors">
                    {c.thumbnail_url ? (
                      <img
                        src={c.thumbnail_url}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-yellow-400/10">
                        <Building2 className="h-12 w-12 text-primary/40" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="md:col-span-7 relative flex flex-col justify-center">
                  <h3 className="font-heading text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  {c.tagline && (
                    <p className="text-primary text-sm md:text-base font-heading font-semibold mb-3">
                      {c.tagline}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-5">
                      {c.description}
                    </p>
                  )}

                  <div className="inline-flex items-center gap-1.5 text-foreground font-heading font-semibold text-sm">
                    {c.website_url ? "Visit Website" : "Learn More"}
                    <ArrowUpRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
