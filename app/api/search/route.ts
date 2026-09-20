import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listEnrollments, listSubjects } from "@/lib/queries";
import { buildSearchIndex } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The search index, fetched once when a student first opens search.
 *
 * Behind a route rather than passed down from the layout so the cost — one
 * content query; the syllabus half is an in-memory array — is paid by the
 * students who actually search, not on every render of every page.
 *
 * It lists what exists, never what is unlocked. Titles of notes are already
 * visible to a locked student on the subject page (knowing what you are
 * missing is the renewal prompt), and every destination it points at runs its
 * own `hasAccess()` check. Nothing here grants anything.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const [enrollments, subjects] = await Promise.all([
    listEnrollments(user.uid),
    listSubjects(),
  ]);

  const now = Date.now();
  const enrolled = enrollments
    .filter((e) => e.status === "active" && e.currentPeriodEnd > now)
    .map((e) => e.subjectId);

  // A student with no subscription still searches the syllabus — it is public
  // on the marketing site, and the roadmap is how they decide to subscribe.
  const subjectId = subjects.find((s) => enrolled.includes(s.id))?.id ?? subjects[0]?.id;
  if (!subjectId) return NextResponse.json({ entries: [] });

  const entries = await buildSearchIndex(subjectId);

  return NextResponse.json(
    { entries },
    {
      headers: {
        // Per-student because the content list depends on the subject, and
        // short because a teacher publishes notes during the day.
        "Cache-Control": "private, max-age=300",
      },
    },
  );
}
