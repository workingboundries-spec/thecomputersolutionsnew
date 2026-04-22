import { useProducts, useSiteSettings } from "@/hooks/use-site-data";
import { ShoppingCart, Star, MessageCircle } from "lucide-react";
import { useState } from "react";
import productBusiness from "@/assets/product-business.jpg";
import productGaming from "@/assets/product-gaming.jpg";
import productStudent from "@/assets/product-student.jpg";
import productBudget from "@/assets/product-budget.jpg";
import productPremium from "@/assets/product-premium.jpg";

const categoryFallbacks: Record<string, string> = {
  Business: productBusiness, Gaming: productGaming, Student: productStudent,
  Budget: productBudget, Premium: productPremium,
};

const fmt = (n?: number | null) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : null);

export default function Products() {
  const { data: products = [] } = useProducts();
  const { data: settings } = useSiteSettings();
  const whatsapp = settings?.shop_whatsapp || settings?.whatsapp || "919876543210";
  const categoriesStr = settings?.product_categories || "Business,Gaming,Student,Budget,Premium";
  const categories = ["All", ...categoriesStr.split(",").map(c => c.trim()).filter(Boolean)];
  const [activeCategory, setActiveCategory] = useState("All");

  // Exclude items in CCTV category — they have their own section
  const visibleProducts = products.filter((p) => (p.category || "").toLowerCase() !== "cctv");
  const filtered = activeCategory === "All" ? visibleProducts : visibleProducts.filter((p) => p.category === activeCategory);

  const enquire = (p: typeof products[number]) => {
    const msg = p.whatsapp_enquiry_msg || `Hi! I'm interested in ${p.name}. Please share details and price.`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section id="products" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Our Collection</span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mt-3">Featured Laptops</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
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
          {filtered.map((p, i) => {
            const sale = fmt(p.sale_price);
            const reg = fmt(p.regular_price);
            const mrp = fmt(p.mrp);
            return (
              <article key={p.id} className="glass rounded-2xl overflow-hidden group hover:border-primary/60 hover:shadow-[var(--shadow-yellow)] transition-all duration-300 animate-fade-in-up flex flex-col" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                  {(p.image || categoryFallbacks[p.category]) ? (
                    <img src={p.image || categoryFallbacks[p.category]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="text-center p-4">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground">Product Image</span>
                    </div>
                  )}
                  {(p.is_new || p.badge === "New Arrival") && (
                    <span className="absolute top-3 right-3 vibrant-gradient text-primary-foreground text-xs font-black px-3 py-1 rounded-full">NEW</span>
                  )}
                  {p.badge && p.badge !== "New Arrival" && (
                    <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />)}
                  </div>
                  <h3 className="font-heading text-lg font-semibold line-clamp-1">{p.name}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                  {p.specs && <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{p.specs}</p>}

                  <div className="mt-4 mb-4">
                    {mrp && <p className="text-xs text-muted-foreground line-through">MRP: {mrp}</p>}
                    <p className="text-2xl font-heading font-black text-primary">
                      {sale || reg || p.price}
                    </p>
                  </div>

                  <button onClick={() => enquire(p)} className="mt-auto w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold font-heading transition-colors">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Enquiry
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
