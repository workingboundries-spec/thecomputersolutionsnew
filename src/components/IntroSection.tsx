import { useState } from "react";
import { useIntroSection } from "@/hooks/use-site-data";
import { Play, Sparkles } from "lucide-react";

function getYouTubeThumb(url: string): string | null {
  const m = url.match(/\/embed\/([A-Za-z0-9_-]{11})/);
  return m?.[1] ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function toEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    if (url.includes("/embed/")) return url;
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

export default function IntroSection() {
  const { data: intro } = useIntroSection();
  const [playVideo, setPlayVideo] = useState(false);

  if (!intro || !intro.is_visible) return null;
  const embed = toEmbed(intro.youtube_url);
  const thumb = embed ? getYouTubeThumb(embed) : null;

  return (
    <section id="about-cs" className="section-padding relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 -left-32 w-[28rem] h-[28rem] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-yellow-400/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Video panel */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="relative group">
              {/* Glow accents */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary via-yellow-400/40 to-transparent rounded-[2rem] blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
              <div className="relative aspect-video rounded-[1.75rem] overflow-hidden border border-primary/30 bg-card shadow-[var(--shadow-yellow)]">
                {embed && playVideo ? (
                  <iframe
                    src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
                    title={intro.heading}
                    className="w-full h-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : embed ? (
                  <button
                    type="button"
                    onClick={() => setPlayVideo(true)}
                    className="w-full h-full relative group/play"
                    aria-label="Play video"
                  >
                    {thumb ? (
                      <img src={thumb} alt={intro.heading} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary/95 flex items-center justify-center group-hover/play:scale-110 transition-transform shadow-2xl">
                        <Play className="h-8 w-8 text-primary-foreground fill-current ml-1" />
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Play className="h-16 w-16 text-primary/60" />
                  </div>
                )}
              </div>
              {/* Floating chip */}
              <div className="hidden md:flex absolute -bottom-5 -right-5 items-center gap-2 glass-yellow rounded-full px-4 py-2 border border-primary/40 shadow-[var(--shadow-glow)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-primary">Watch Story</span>
              </div>
            </div>
          </div>

          {/* Text panel */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 glass-yellow rounded-full px-4 py-1.5 mb-5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-heading font-bold tracking-[0.3em] uppercase text-primary">Who We Are</span>
            </span>

            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-5">
              {intro.heading.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-vibrant">{intro.heading.split(" ").slice(-1)}</span>
            </h2>

            {intro.subheading && (
              <p className="text-lg md:text-xl text-foreground/85 font-heading font-medium mb-5">
                {intro.subheading}
              </p>
            )}

            {intro.body_text && (
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
                {intro.body_text}
              </p>
            )}

            {/* Feature ticks */}
            <div className="grid grid-cols-2 gap-3">
              {["Trusted Brands", "EMI Available", "Expert Service", "Genuine Products"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-foreground/80 font-heading font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
