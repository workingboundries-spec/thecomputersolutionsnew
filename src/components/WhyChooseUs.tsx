import { BadgeCheck, Clock, IndianRupee, Award } from "lucide-react";

const reasons = [
  { icon: BadgeCheck, title: "100% Genuine Products", desc: "All laptops come with official brand warranty & GST bill." },
  { icon: IndianRupee, title: "Best Price Guarantee", desc: "We match any authorized dealer's price. No hidden charges." },
  { icon: Clock, title: "Same Day Delivery", desc: "Order before 2 PM, get it delivered the same day in city." },
  { icon: Award, title: "10+ Years Experience", desc: "Trusted by thousands of customers across the region." },
];

export default function WhyChooseUs() {
  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Trust & Quality</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">Why Choose Us</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              className="text-center p-8 rounded-2xl border border-border hover:border-primary/30 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <r.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
