import { useYouTubeVideos, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Youtube, Play } from "lucide-react";

function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Try common URL formats: watch?v=, youtu.be/, embed/
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] || null;
}

export default function YouTubeVideos() {
  const { data: videos = [] } = useYouTubeVideos();
  const { data: headings } = useSectionHeadings();
  const { heading, subheading, visible } = getHeading(headings, "youtube", "Watch & Learn", "Tutorials and product reviews on YouTube");

  if (!visible || videos.length === 0) return null;

  return (
    <section id="videos" className="section-padding bg-card/40">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <Youtube className="h-7 w-7 text-destructive" />
            <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Watch & Learn</span>
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{subheading}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v, i) => {
            const url = v.youtube_url || v.embed_url;
            const id = getYouTubeId(url);
            const thumb = v.thumbnail_url || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "");
            const watchUrl = id ? `https://youtu.be/${id}` : url;

            return (
              <a
                key={v.id}
                href={watchUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group glass rounded-2xl overflow-hidden hover:border-primary/60 hover:shadow-[var(--shadow-yellow)] transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="aspect-video bg-secondary relative overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={v.title || `Video ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="h-16 w-16 text-destructive/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                      <Play className="h-7 w-7 text-destructive fill-current ml-1" />
                    </div>
                  </div>
                </div>
                {(v.title || v.description) && (
                  <div className="p-5">
                    {v.title && <h3 className="font-heading font-semibold text-base mb-1 line-clamp-2">{v.title}</h3>}
                    {v.description && <p className="text-xs text-muted-foreground line-clamp-3">{v.description}</p>}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
