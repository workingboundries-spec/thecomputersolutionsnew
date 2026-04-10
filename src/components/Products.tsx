import { useProducts, useSiteSettings } from "@/hooks/use-site-data";
import { ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import productBusiness from "@/assets/product-business.jpg";
import productGaming from "@/assets/product-gaming.jpg";
import productStudent from "@/assets/product-student.jpg";
import productBudget from "@/assets/product-budget.jpg";
import productPremium from "@/assets/product-premium.jpg";

const categoryFallbacks: Record<string, string> = {
  Business: productBusiness,
  Gaming: productGaming,
  Student: productStudent,
  Budget: productBudget,
  Premium: productPremium,
};

const categories = ["All", "Business", "Gaming", "Student", "Budget", "Premium"];

export default function Products() {
  const { data: products = [] } = useProducts();
  const { data: settings } = useSiteSettings();
  const whatsapp = settings?.whatsapp || "919876543210";
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  const handleEnquiry = (name: string) => {
    window.open(`https://wa.me/${whatsapp}?text=Hi! I'm interested in ${encodeURIComponent(name)}`, "_blank");
  };

  return (
    <section id="products" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Our Collection</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">Featured Laptops</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-surface-hover"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <div key={p.id} className="glass rounded-2xl overflow-hidden group hover:glow-border transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                {(p.image || categoryFallbacks[p.category]) ? (
                  <img src={p.image || categoryFallbacks[p.category]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="text-center p-4">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                    <span className="text-xs text-muted-foreground">Product Image</span>
                  </div>
                )}
                {p.is_new && (
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">NEW</span>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <h3 className="font-heading text-lg font-semibold">{p.name}</h3>
                {p.specs && <p className="text-sm text-muted-foreground mt-1">{p.specs}</p>}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-heading font-bold text-primary">{p.price}</span>
                  <button onClick={() => handleEnquiry(p.name)} className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                    Enquire Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
