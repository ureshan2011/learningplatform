/**
 * Shared visual for every generated icon (favicon, apple touch icon, PWA
 * manifest icons, the JSON-LD logo). One definition, rendered at whatever
 * size and safe-zone each caller needs via `next/og`'s ImageResponse — no
 * static image asset to keep in sync, and no risk of the set drifting apart.
 */
export function BrandIcon({ size, maskable = false }: { size: number; maskable?: boolean }) {
  // Maskable icons get cropped to a circle by some OS launchers, so the
  // wordmark has to sit inside the ~80% "safe zone" with background filling
  // the rest — otherwise the corners of the "I" and "C" get clipped.
  const contentSize = maskable ? Math.round(size * 0.7) : size;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4551e",
      }}
    >
      <div
        style={{
          width: contentSize,
          height: contentSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: contentSize * 0.52,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: -2,
          fontFamily: "sans-serif",
        }}
      >
        IC
      </div>
    </div>
  );
}
