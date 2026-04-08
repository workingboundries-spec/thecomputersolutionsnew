import { useServices } from "@/hooks/use-site-data";
import { Laptop, Wrench, RefreshCw, ShieldCheck, Truck, Headphones, Monitor, Cpu, HardDrive, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Laptop, Wrench, RefreshCw, ShieldCheck, Truck, Headphones, Monitor, Cpu, HardDrive,
};

export default function Services() {
  const { data: services = [] } = useServices();

  return (
    <section id="services" className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">What We Offer</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">Our Services</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = iconMap[s.icon_name] || Monitor;
            return (
              <div key={s.id} className="group glass rounded-2xl p-8 hover:glow-border transition-all duration-300 cursor-default animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
