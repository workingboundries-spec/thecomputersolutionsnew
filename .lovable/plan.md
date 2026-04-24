
## Performance & Spacing Optimization Plan

Goal: Speed up homepage load and tighten vertical spacing so sections feel cohesive instead of stretched, while shrinking oversized image cards.

### 1. Performance — Faster Initial Load

**Code splitting (lazy load below-the-fold sections)**
In `src/pages/Index.tsx`, keep `Navbar`, `HeroBanner`, and `IntroSection` as eager imports. Lazy-load the rest via `React.lazy` + `<Suspense>`:
- WhyChooseUs, BrandsMarquee, EmiBanner, NewArrivals, DailyDeals, Services, Products, CCTVProducts, TestimonialVideos, YouTubeVideos, InstagramReels, SisterConcerns, Gallery, SocialLinks, ContactUs, Footer, FloatingWhatsApp.
- Result: initial JS bundle drops significantly; sections stream in as the user scrolls.

**Image optimization**
- Add `loading="lazy"` and `decoding="async"` to all `<img>` tags in: NewArrivals, DailyDeals, Products, CCTVProducts, Gallery, SisterConcerns, BrandsMarquee, TestimonialVideos thumbnails.
- Keep HeroBanner image as `loading="eager"` (LCP element).

**Defer heavy embeds**
- `YouTubeVideos`, `InstagramReels`, `TestimonialVideos`: replace direct `<iframe>` with a click-to-load thumbnail (lite-youtube pattern). Iframes only mount when the user clicks play. This alone removes hundreds of KB of third-party JS on first paint.
- `IntroSection` YouTube embed: use `loading="lazy"` on iframe and only render iframe when section enters viewport (IntersectionObserver).

**Remove blur/glow cost**
- HeroBanner has two large `blur-[100px]` / `blur-[120px]` decorative divs that trigger expensive paints. Reduce to one smaller blur or remove on mobile (`hidden md:block`).

### 2. Spacing — Remove Extra Black Gaps

**Tighten section padding globally**
In `src/index.css`, reduce `.section-padding` from `py-20 md:py-28` → `py-12 md:py-16`. This single change collapses ~80–120px of empty black space between every section.

**Hero**
- Change `min-h-screen` → `min-h-[85vh]` so the hero doesn't push everything below the fold.
- Reduce stat grid `mt-16` → `mt-10`.

**Per-section trims** (where padding is hardcoded, not via `.section-padding`):
- IntroSection, BrandsMarquee, EmiBanner, SocialLinks, SisterConcerns: audit and switch to the new `.section-padding` token.

### 3. Smaller Picture Cards

**NewArrivals & DailyDeals**: card image height `h-64`/`h-56` → `h-44 md:h-48`. Card width in horizontal scroll: `min-w-[280px]` → `min-w-[220px]`.

**Products & CCTVProducts**: image aspect `aspect-[4/3]` cards — reduce grid card image height to `h-40 md:h-48`. Use grid `md:grid-cols-3 lg:grid-cols-4` instead of 2/3 so cards are naturally smaller.

**Gallery**: tighten grid gap `gap-6` → `gap-3` and image height `h-72` → `h-48 md:h-56`.

**SisterConcerns**: 16:9 thumbnails are fine, but cap container `max-w-5xl mx-auto` and use `md:grid-cols-3` so cards don't stretch full width.

**TestimonialVideos**: thumbnail cards from `h-80` → `h-56`.

### 4. Files Changed
- `src/pages/Index.tsx` — lazy imports + Suspense
- `src/index.css` — section-padding token
- `src/components/HeroBanner.tsx` — height + blur
- `src/components/NewArrivals.tsx`, `DailyDeals.tsx`, `Products.tsx`, `CCTVProducts.tsx`, `Gallery.tsx`, `SisterConcerns.tsx`, `TestimonialVideos.tsx` — card sizing + lazy images
- `src/components/YouTubeVideos.tsx`, `InstagramReels.tsx`, `IntroSection.tsx` — click-to-load / lazy iframes

### Expected Result
- Initial JS payload reduced ~40–60% via code splitting + deferred embeds.
- Faster LCP and TTI, especially on mobile.
- Page feels denser and more cohesive — less scrolling through black gaps.
- Image cards no longer dominate the viewport.
