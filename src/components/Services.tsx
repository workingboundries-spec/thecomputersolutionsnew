import { useServices, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Laptop, Wrench, RefreshCw, ShieldCheck, Truck, Headphones, Monitor, Cpu, HardDrive, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Laptop, Wrench, RefreshCw, ShieldCheck, Truck, Headphones, Monitor, Cpu, HardDrive,
};

export default function Services() {
  const { data: services = [] } = useServices();
  const { data: headings } = useSectionHeadings();
  const { heading, subheading, visible } = getHeading(headings, "services", "Our Services", "Professional tech solutions for every need");

  if (!visible) return null;

  return (
    <section id="services" className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">What We Offer</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-3">{subheading}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = iconMap[s.icon_name] || Monitor;
            const hasThumb = !!s.thumbnail_url;
            return (
              <article
                key={s.id}
                className="group relative h-[280px] rounded-2xl overflow-hidden border border-primary/20 hover:border-primary/60 hover:scale-[1.02] hover:shadow-[var(--shadow-yellow)] transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Background */}
                {hasThumb ? (
                  <img src={s.thumbnail_url!} alt={s.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 vibrant-gradient" />
                )}
                {/* Bottom gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

                {/* Icon badge top-left */}
                <div className="absolute top-4 left-4 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </div>

                {/* Text bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="font-heading text-lg font-bold mb-1.5">{s.title}</h3>
                  <p className="text-white/85 text-sm leading-snug line-clamp-2">{s.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
