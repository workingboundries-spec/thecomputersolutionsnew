const brands = ["HP", "Dell", "Lenovo", "ASUS", "Acer", "Apple", "MSI", "Samsung", "Microsoft", "LG"];

export default function BrandsMarquee() {
  return (
    <section className="py-12 border-y border-border overflow-hidden">
      <div className="container mx-auto mb-6 text-center">
        <span className="text-muted-foreground text-sm font-heading tracking-widest uppercase">Authorized Dealer for All Major Brands</span>
      </div>
      <div className="flex gap-12 animate-marquee">
        {[...brands, ...brands].map((b, i) => (
          <span key={i} className="text-2xl font-heading font-bold text-muted-foreground/30 whitespace-nowrap hover:text-primary/50 transition-colors">
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}
