const brands = ["HP", "Dell", "Lenovo", "ASUS", "Acer", "Apple", "MSI", "Samsung", "Microsoft", "LG"];

export default function BrandsMarquee() {
  return (
    <section className="py-12 border-y border-primary/20 overflow-hidden bg-gradient-to-r from-background via-card to-background">
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-16 animate-marquee">
          {[...brands, ...brands, ...brands].map((b, i) => (
            <span
              key={i}
              className="text-3xl md:text-4xl font-heading font-black text-foreground/30 whitespace-nowrap hover:text-primary transition-all duration-300 hover:scale-110 cursor-default tracking-tight"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
