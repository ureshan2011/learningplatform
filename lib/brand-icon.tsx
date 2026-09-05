/**
 * Shared visual for every generated icon (favicon, apple touch icon, PWA
 * manifest icons, the JSON-LD logo). One definition, rendered at whatever
 * size and safe-zone each caller needs via `next/og`'s ImageResponse — no
 * static image asset to keep in sync, and no risk of the set drifting apart.
 *
 * The mark is the same graduation cap glyph as the header wordmark
 * (`components/nav/SiteHeader.tsx`, icon "school") on the brand's soft-square
 * radius, so the browser tab and the in-app logo read as one identity instead
 * of a text monogram in one place and an icon in the other.
 */
export function BrandIcon({ size, maskable = false }: { size: number; maskable?: boolean }) {
  // Maskable icons get cropped to a circle by some OS launchers, so the glyph
  // has to sit inside the ~80% "safe zone" with background filling the rest —
  // otherwise the cap's points get clipped.
  const contentSize = maskable ? Math.round(size * 0.68) : Math.round(size * 0.62);
  // A soft square, not a sharp one — same "container" language as the rest of
  // the system's cards, scaled down to icon proportions.
  const radius = maskable ? 0 : Math.round(size * 0.22);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4551e",
        borderRadius: radius,
      }}
    >
      <svg
        width={contentSize}
        height={contentSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10.6V16" />
        <path d="M6 12.5V17a6 3 0 0 0 12 0v-4.5" />
      </svg>
    </div>
  );
}
