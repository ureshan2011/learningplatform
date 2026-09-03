import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social share card for every page that doesn't set its own. Most
 * students find this through a WhatsApp link from a friend or parent, not a
 * click from Google — the preview card that renders in that chat is the
 * first impression, so it has to exist and say something specific.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#f4551e",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#ffffff" }}>
          ICT CAMPUS.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: -2,
            color: "#ffffff",
            maxWidth: 920,
          }}
        >
          A/L ICT tuition, taught by someone who built it.
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 30, color: "rgba(255,255,255,0.88)" }}>
          Live classes · free notes &amp; past papers · Sinhala medium
        </div>
      </div>
    ),
    size,
  );
}
