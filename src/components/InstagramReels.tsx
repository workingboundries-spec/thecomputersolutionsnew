import { useInstagramReels, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Instagram, Play } from "lucide-react";

export default function InstagramReels() {
  const { data: reels = [] } = useInstagramReels();
  const { data: headings } = useSectionHeadings();
  const { heading, subheading, visible } = getHeading(headings, "instagram", "Instagram Updates", "Follow us for daily tech updates");

  if (!visible || reels.length === 0) return null;

  return (
    <section id="updates" className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <Instagram className="h-6 w-6 text-pink-500" />
            <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Updates</span>
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-3">{subheading}</p>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map((r, i) => (
            <a
              key={r.id}
              href={r.reel_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-[9/16] rounded-2xl overflow-hidden border-2 border-transparent hover:border-pink-500 hover:scale-[1.03] transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <img
                src={r.thumbnail_url}
                alt={r.title || `Reel ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>
              {r.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-medium line-clamp-2">{r.caption}</p>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 p-1.5 rounded-lg">
                <Instagram className="h-3 w-3 text-white" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
