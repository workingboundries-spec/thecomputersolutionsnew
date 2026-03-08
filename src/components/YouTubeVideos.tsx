import { getSiteData } from "@/lib/store";
import { Youtube } from "lucide-react";

export default function YouTubeVideos() {
  const { youtubeVideos } = getSiteData();

  if (youtubeVideos.length === 0) return null;

  return (
    <section id="videos" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Youtube className="h-8 w-8 text-destructive" />
            <span className="text-primary font-heading text-sm font-semibold tracking-widest uppercase">Watch & Learn</span>
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold">Our YouTube Videos</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Reviews, unboxings, comparisons & tech tips — subscribe to stay updated!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {youtubeVideos.map((url, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="aspect-video">
                <iframe
                  src={url}
                  title={`Video ${i + 1}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
