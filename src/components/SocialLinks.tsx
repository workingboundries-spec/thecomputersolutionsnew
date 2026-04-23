import { useSiteSettings, useSectionHeadings, getHeading } from "@/hooks/use-site-data";
import { Instagram, Facebook, Youtube, MapPin, ArrowRight } from "lucide-react";

export default function SocialLinks() {
  const { data: settings } = useSiteSettings();
  const { data: headings } = useSectionHeadings();
  const { heading, subheading, visible } = getHeading(headings, "follow_us", "Follow Us", "Stay connected on social media");

  const youtube = settings?.youtube_url;
  const instagram = settings?.instagram_url;
  const facebook = settings?.facebook_url;
  const googleBusiness = settings?.google_business_url;

  if (!visible || (!youtube && !instagram && !facebook && !googleBusiness)) return null;

  const platforms = [
    {
      key: "yt", name: "YouTube", url: youtube, icon: Youtube,
      desc: "Tutorials, reviews & tech tips",
      cta: "Subscribe Now",
      color: "#FF0000",
    },
    {
      key: "ig", name: "Instagram", url: instagram, icon: Instagram,
      desc: "Daily deals & tech updates",
      cta: "Follow Now",
      gradient: true,
    },
    {
      key: "fb", name: "Facebook", url: facebook, icon: Facebook,
      desc: "Community & customer stories",
      cta: "Like Page",
      color: "#1877F2",
    },
    {
      key: "gmb", name: "Google", url: googleBusiness, icon: MapPin,
      desc: "Reviews, location & timings",
      cta: "View & Review",
      color: "#4285F4",
    },
  ].filter((p) => p.url);

  return (
    <section className="section-padding bg-gradient-to-b from-background to-card">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-2 text-sm md:text-base">{subheading}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {platforms.map((p) => (
            <a
              key={p.key}
              href={p.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-2xl p-5 backdrop-blur-md bg-white/[0.04] border border-white/10 hover:border-primary/50 hover:bg-white/[0.08] hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={p.gradient
                  ? { background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }
                  : { backgroundColor: p.color }}
              >
                <p.icon className="h-6 w-6 text-white" fill={p.gradient ? "none" : "currentColor"} />
              </div>
              <h3 className="font-heading text-lg font-bold mb-1">{p.name}</h3>
              <p className="text-muted-foreground text-xs mb-3 leading-snug">{p.desc}</p>
              <div className="inline-flex items-center gap-1.5 text-primary font-heading font-semibold text-sm group-hover:gap-2.5 transition-all">
                {p.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
