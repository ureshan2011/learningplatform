import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A/L ICT 2027 Exam Pack — ICT Campus";

/**
 * The Exam Pack's share card. The sales link travels by WhatsApp more than by
 * search, so the preview has to say what the pack is on its own. No price: the
 * console can change it, and an image cached in a chat would keep the old one.
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
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            color: "#ffffff",
            maxWidth: 980,
          }}
        >
          A/L ICT 2027 Exam Pack
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 32,
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.9)",
            maxWidth: 980,
          }}
        >
          Two ranked Paper I sittings · 100 worked answers · predicted Paper II · one-to-one with Dr. Yasas ·
          a live class every Saturday
        </div>
      </div>
    ),
    size,
  );
}
