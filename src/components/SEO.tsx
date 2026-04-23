import { Helmet } from "react-helmet-async";
import { useSeoTag } from "@/hooks/use-seo";

interface SEOProps {
  pageKey: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

/**
 * Renders SEO meta tags for the given page key, pulling values from the
 * admin-managed `seo_meta_tags` table. Falls back to provided defaults.
 */
const SEO = ({ pageKey, fallbackTitle, fallbackDescription }: SEOProps) => {
  const { data: seo } = useSeoTag(pageKey);

  const title = seo?.title || fallbackTitle || "Computer Solutions";
  const description = seo?.description || fallbackDescription || "";
  const keywords = seo?.keywords || "";
  const ogTitle = seo?.og_title || title;
  const ogDescription = seo?.og_description || description;
  const ogImage = seo?.og_image || "";
  const ogUrl = seo?.og_url || (typeof window !== "undefined" ? window.location.href : "");
  const twitterCard = seo?.twitter_card || "summary_large_image";
  const canonical = seo?.canonical_url || ogUrl;
  const structured =
    seo?.structured_data && Object.keys(seo.structured_data).length > 0
      ? JSON.stringify(seo.structured_data)
      : null;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle} />
      {ogDescription && <meta name="twitter:description" content={ogDescription} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured data for Google + AI search engines */}
      {structured && <script type="application/ld+json">{structured}</script>}
    </Helmet>
  );
};

export default SEO;
