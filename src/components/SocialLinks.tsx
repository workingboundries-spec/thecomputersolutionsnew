import { useSiteSettings, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Instagram, Facebook, Youtube, ArrowRight } from "lucide-react";

export default function SocialLinks() {
  const { data: settings } = useSiteSettings();
  const { data: headings } = useSectionHeadings();
  const { heading, subheading, visible } = getHeading(headings, "follow_us", "Follow Us", "Stay connected on social media");

  const youtube = settings?.youtube_url;
  const instagram = settings?.instagram_url;
  const facebook = settings?.facebook_url;

  if (!visible || (!youtube && !instagram && !facebook)) return null;

  const platforms = [
    {
      key: "yt", name: "YouTube", url: youtube, icon: Youtube,
      desc: "Tutorials, reviews & tech tips",
      stat: settings?.youtube_subscribers || " ",
      statLabel: " ",
      cta: "Subscribe Now",
      color: "#FF0000",
    },
    {
      key: "ig", name: "Instagram", url: instagram, icon: Instagram,
      desc: "Daily deals & tech updates",
      stat: settings?.instagram_followers || " ",
      statLabel: " ",
      cta: "Follow Now",
      gradient: true,
    },
    {
      key: "fb", name: "Facebook", url: facebook, icon: Facebook,
      desc: "Community & customer stories",
      stat: settings?.facebook_likes || " ",
      statLabel: " ",
      cta: "Like Page",
      color: "#1877F2",
    },
  ].filter((p) => p.url);

  return (
    <section className="section-padding bg-gradient-to-b from-background to-card">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-5xl font-bold">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-3">{subheading}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {platforms.map((p) => (
            <a
              key={p.key}
              href={p.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-3xl p-8 backdrop-blur-md bg-white/[0.04] border border-white/10 hover:border-primary/50 hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={p.gradient
                  ? { background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }
                  : { backgroundColor: p.color }}
              >
                <p.icon className="h-8 w-8 text-white" fill={p.gradient ? "none" : "currentColor"} />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-2">{p.name}</h3>
              <p className="text-muted-foreground text-sm mb-5">{p.desc}</p>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-3xl font-heading font-black text-vibrant">{p.stat}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{p.statLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-primary font-heading font-semibold group-hover:gap-3 transition-all">
                {p.cta}
                <ArrowRight className="h-4 w-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
