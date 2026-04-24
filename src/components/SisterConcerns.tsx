import { ArrowUpRight, Building2 } from "lucide-react";
import { useSisterConcerns } from "@/hooks/use-site-data";

export default function SisterConcerns() {
  const { data: concerns = [] } = useSisterConcerns();

  if (concerns.length === 0) return null;

  return (
    <section id="sister-concerns" className="section-padding relative overflow-hidden">
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-10">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {concerns.map((c) => {
            const CardWrapper: any = c.website_url ? "a" : "div";
            const linkProps = c.website_url
              ? { href: c.website_url, target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <CardWrapper
                key={c.id}
                {...linkProps}
                className="group relative flex flex-col bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/60 hover:-translate-y-1 hover:shadow-[var(--shadow-yellow)] transition-all duration-500"
              >
                <div className="aspect-video overflow-hidden bg-background/50">
                  {c.thumbnail_url ? (
                    <img
                      src={c.thumbnail_url}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-yellow-400/10">
                      <Building2 className="h-12 w-12 text-primary/40" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-heading text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  {c.tagline && (
                    <p className="text-primary text-sm font-heading font-semibold mb-2">
                      {c.tagline}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-3">
                      {c.description}
                    </p>
                  )}

                  <div className="mt-auto inline-flex items-center gap-1.5 text-foreground font-heading font-semibold text-sm">
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
