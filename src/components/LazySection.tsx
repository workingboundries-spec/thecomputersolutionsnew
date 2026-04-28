import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Skeleton fallback shown while a lazy section's chunk is loading.
 * Subtle pulse so users see *something* instead of a black gap.
 */
const SectionSkeleton = () => (
  <div className="section-padding" aria-hidden>
    <div className="container mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 mx-auto rounded bg-muted/40" />
        <div className="h-3 w-72 max-w-full mx-auto rounded bg-muted/30" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          <div className="h-32 rounded-lg bg-muted/30" />
          <div className="h-32 rounded-lg bg-muted/30" />
          <div className="h-32 rounded-lg bg-muted/30 hidden md:block" />
        </div>
      </div>
    </div>
  </div>
);

interface LazySectionProps {
  /** Optional preload trigger — call the lazy import when near viewport. */
  preload?: () => Promise<unknown>;
  /** Distance from viewport (in px) at which to start prefetching. */
  rootMargin?: string;
  /** Min height reserved before chunk loads — prevents layout shift. */
  minHeight?: string;
  children: ReactNode;
}

/**
 * Wraps a lazy-loaded section with:
 *  1. IntersectionObserver-based prefetch (chunk starts downloading
 *     before the user actually scrolls to the section)
 *  2. Suspense boundary with a skeleton fallback
 *  3. Reserved min-height so layout doesn't jump
 */
const LazySection = ({
  preload,
  rootMargin = "600px",
  minHeight = "0px",
  children,
}: LazySectionProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldPreload, setShouldPreload] = useState(false);

  useEffect(() => {
    if (!preload || shouldPreload) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      // Fallback: just preload immediately on browsers without IO
      preload();
      setShouldPreload(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          preload();
          setShouldPreload(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [preload, rootMargin, shouldPreload]);

  return (
    <div ref={ref} style={{ minHeight }}>
      <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>
    </div>
  );
};

export default LazySection;
