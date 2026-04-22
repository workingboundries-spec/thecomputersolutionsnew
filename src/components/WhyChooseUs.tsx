import { BadgeCheck, Clock, IndianRupee, Award } from "lucide-react";
import { useSiteSettings, useSectionHeadings, getHeading } from "@/hooks/use-site-data";

const icons = [Award, IndianRupee, Clock, BadgeCheck];

export default function WhyChooseUs() {
  const { data: settings } = useSiteSettings();
  const { data: headings } = useSectionHeadings();
  const { heading, subheading, visible } = getHeading(headings, "why_us", "Why Choose Us", "Trusted by thousands across the region");

  if (!visible) return null;

  const items = [1, 2, 3, 4].map((i, idx) => ({
    title: settings?.[`why_us_${i}_title`] || ["Expert Team", "Best Prices", "After Sales Service", "Genuine Products"][idx],
    desc: settings?.[`why_us_${i}_desc`] || ["Certified tech professionals", "We match any dealer price", "Dedicated support post-purchase", "100% original with brand warranty"][idx],
    Icon: icons[idx],
  }));

  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Trust & Quality</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-3">{subheading}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((r, i) => (
            <div
              key={r.title}
              className="text-center p-8 rounded-2xl border border-primary/20 bg-card/30 hover:border-primary/60 hover:-translate-y-1 hover:shadow-[var(--shadow-yellow)] transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl vibrant-gradient flex items-center justify-center mx-auto mb-5 shadow-[var(--shadow-glow)]">
                <r.Icon className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
