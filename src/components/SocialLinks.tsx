import { useSiteSettings } from "@/hooks/use-site-data";
import { Instagram, Facebook, ExternalLink } from "lucide-react";

export default function SocialLinks() {
  const { data: settings } = useSiteSettings();
  const instagram = settings?.instagram_url || "";
  const facebook = settings?.facebook_url || "";
  const instagramThumb = settings?.instagram_thumbnail || "";
  const facebookThumb = settings?.facebook_thumbnail || "";

  if (!instagram && !facebook) return null;

  const cards = [
    { name: "Instagram", url: instagram, thumb: instagramThumb, icon: Instagram, gradient: "from-pink-500 via-purple-500 to-orange-400" },
    { name: "Facebook", url: facebook, thumb: facebookThumb, icon: Facebook, gradient: "from-blue-600 to-blue-400" },
  ].filter((c) => c.url);

  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-3 text-gradient">
          Follow Us
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          Stay connected for latest offers & updates
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {cards.map((card) => (
            <a
              key={card.name}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-primary/20"
            >
              {/* Thumbnail */}
              <div className="aspect-video overflow-hidden bg-secondary relative">
                {card.thumb ? (
                  <img
                    src={card.thumb}
                    alt={`${card.name} page`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                    <card.icon className="h-16 w-16 text-white/90" />
                  </div>
                )}
                {/* Overlay badge */}
                <div className={`absolute top-3 left-3 bg-gradient-to-r ${card.gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                  <card.icon className="h-3.5 w-3.5" />
                  {card.name}
                </div>
              </div>

              {/* CTA */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-lg">{card.name}</h3>
                  <p className="text-sm text-muted-foreground">Follow us on {card.name}</p>
                </div>
                <ExternalLink className="h-5 w-5 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
