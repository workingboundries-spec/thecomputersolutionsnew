import { useTestimonialVideos, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Play, Star, User } from "lucide-react";

export default function TestimonialVideos() {
  const { data: items = [] } = useTestimonialVideos();
  const { data: headings } = useSectionHeadings();
  const { heading, subheading, visible } = getHeading(headings, "testimonials", "Customer Voices", "Real stories from our customers");

  if (!visible || items.length === 0) return null;

  return (
    <section id="testimonials" className="section-padding bg-card/40">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Real Reviews</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-3">{subheading}</p>}
        </div>

        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-thin">
          {items.map((t) => (
            <article
              key={t.id}
              className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-card border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/60 hover:shadow-[var(--shadow-yellow)] transition-all"
            >
              <a
                href={t.video_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-video bg-secondary group"
              >
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt={t.customer_name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full vibrant-gradient" />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                    <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                </div>
              </a>

              <div className="p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < (t.rating || 5) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                {t.review_text && (
                  <p className="text-sm text-foreground/90 italic line-clamp-3 mb-4">"{t.review_text}"</p>
                )}
                <div className="flex items-start gap-3 pt-3 border-t border-border/60">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-sm truncate">{t.customer_name}</p>
                    {t.location && <p className="text-xs text-muted-foreground truncate">{t.location}</p>}
                    {t.product_purchased && (
                      <p className="text-xs text-primary mt-0.5 truncate">Bought: {t.product_purchased}</p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
