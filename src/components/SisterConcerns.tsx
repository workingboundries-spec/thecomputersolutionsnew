import { GraduationCap, Plane, Calculator, ArrowUpRight } from "lucide-react";

const concerns = [
  {
    name: "ATEC",
    tagline: "Advanced Technology Education Centre",
    description: "Empowering the next generation with industry-ready tech education and certified training programs.",
    icon: GraduationCap,
    accent: "from-primary to-yellow-400",
  },
  {
    name: "Abroad Avenues",
    tagline: "Your Gateway to Global Education",
    description: "Trusted overseas education consultants helping students unlock world-class universities and careers abroad.",
    icon: Plane,
    accent: "from-yellow-400 to-primary",
  },
  {
    name: "Tally Institute of Learning",
    tagline: "Master Accounting. Master Business.",
    description: "Authorized Tally training institute offering certified courses in accounting, GST, and financial management.",
    icon: Calculator,
    accent: "from-primary via-yellow-300 to-primary",
  },
];

export default function SisterConcerns() {
  return (
    <section id="sister-concerns" className="section-padding relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block glass-yellow rounded-full px-4 py-1.5 text-primary font-heading text-xs font-bold tracking-[0.3em] uppercase mb-4">
            Our Family
          </span>
          <h2 className="font-heading text-4xl md:text-6xl font-bold mb-4">
            Meet Our <span className="text-vibrant">Sister Concerns</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A trusted network of brands committed to education, technology, and global opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {concerns.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.name}
                className="group relative bg-card border border-primary/20 rounded-3xl p-8 hover:border-primary/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[var(--shadow-yellow)] overflow-hidden"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-transparent transition-all duration-500" />

                {/* Logo space */}
                <div className="relative mb-6">
                  <div className="w-full h-32 bg-background/50 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center group-hover:border-primary/60 transition-colors">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.accent} flex items-center justify-center shadow-[var(--shadow-glow)]`}>
                      <Icon className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </div>
                  <span className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Logo</span>
                </div>

                <div className="relative">
                  <h3 className="font-heading text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-primary text-sm font-heading font-semibold mb-4">{c.tagline}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{c.description}</p>

                  <button className="inline-flex items-center gap-1.5 text-foreground font-heading font-semibold text-sm group/btn">
                    Learn More
                    <ArrowUpRight className="h-4 w-4 text-primary group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
