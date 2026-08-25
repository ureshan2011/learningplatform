import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { getSubject } from "@/lib/queries";
import { getCertificateEligibility } from "@/lib/practice/engine";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Renders the Practice Mastery certificate as a PNG using `next/og`'s
 * ImageResponse — pure JS/WASM (Satori + resvg), bundled with Next.js
 * itself. No new dependency, no native binary, no third-party image API:
 * it costs nothing beyond the compute App Hosting already runs.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ subjectId: string }> },
) {
  const { subjectId } = await ctx.params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const access = await hasAccess(user.uid, subjectId);
  if (!access.allowed) {
    return NextResponse.json({ error: "forbidden", reason: access.reason }, { status: 403 });
  }

  const subject = await getSubject(subjectId);
  if (!subject) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const eligibility = await getCertificateEligibility(user.uid, subjectId);
  if (!eligibility.eligible) {
    return NextResponse.json({ error: "not_eligible", eligibility }, { status: 403 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1020 0%, #141b33 100%)",
          fontFamily: "sans-serif",
          color: "#f7f8fc",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "1080px",
            height: "680px",
            border: "3px solid #ffb703",
            borderRadius: "20px",
            padding: "56px",
          }}
        >
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#ffb703" }}>
            ICT CLASS
          </div>

          <div style={{ display: "flex", marginTop: 36, fontSize: 22, color: "#9aa3c2" }}>
            CERTIFICATE OF PRACTICE MASTERY
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 56,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {user.name}
          </div>

          <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: "#e5e7eb" }}>
            has demonstrated mastery in
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 34,
              fontWeight: 700,
              color: "#fb8500",
            }}
          >
            {subject.name}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 20,
              color: "#9aa3c2",
            }}
          >
            {eligibility.accuracyPct}% accuracy across {eligibility.questionsAnswered} practice questions
          </div>

          <div style={{ display: "flex", marginTop: 44, fontSize: 18, color: "#6b7395" }}>
            {formatDate(Date.now())}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 800 },
  );
}
