import { useGalleryImages } from "@/hooks/use-site-data";
import { Camera } from "lucide-react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";

const defaultGallery = [
  { url: gallery1, alt: "Laptop Display" },
  { url: gallery2, alt: "Customer Testing" },
  { url: gallery3, alt: "Repair Service" },
];

export default function Gallery() {
  const { data: galleryImages = [] } = useGalleryImages();
  const hasDbImages = galleryImages.length > 0;

  return (
    <section id="gallery" className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Camera className="h-7 w-7 text-primary" />
            <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Showroom</span>
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold">Gallery</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hasDbImages
            ? galleryImages.map((img, i) => (
                <div key={img.id} className="rounded-2xl overflow-hidden group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="aspect-square overflow-hidden">
                    <img src={img.image_url} alt={img.alt_text || `Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  </div>
                </div>
              ))
            : defaultGallery.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="aspect-square overflow-hidden">
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
