import { NextResponse } from "next/server";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import type { Subject } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Creates the default A/L ICT subject.
 *
 * The same thing `scripts/admin.mjs seed` does, exposed to the teacher console
 * so a brand-new platform can be set up entirely from the browser — no Node, no
 * service account key, no command line.
 *
 * A/L ICT is the only subject this platform teaches. `Grade` still carries
 * "OL" because the data model is shared with a future O/L class; nothing seeds
 * or advertises one today.
 *
 * Merges rather than overwrites, so re-running never clobbers a price or
 * description the teacher has since edited.
 */
export async function POST() {
  let tenantId: string;
  try {
    ({ tenantId } = await requireTeacher());
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const subjects: Subject[] = [
    {
      id: "al-ict",
      tenantId,
      name: "A/L ICT",
      grade: "AL",
      medium: "sinhala",
      priceLKR: 2500,
      description: "Grade 12-13 ICT, theory and structured essay technique.",
      syllabusTopics: [
        "Concepts of ICT",
        "Fundamentals of computer systems",
        "Data representation",
        "Logic gates and Boolean algebra",
        "Operating systems",
        "Data communication and networking",
        "System analysis and design",
        "Database management",
        "Programming",
        "Web development",
        "ICT in business",
        "New trends",
      ],
      active: true,
    },
  ];

  const batch = col.subjects().firestore.batch();
  for (const subject of subjects) {
    batch.set(col.subjects().doc(subject.id), subject, { merge: true });
  }
  await batch.commit();

  return NextResponse.json({ ok: true, created: subjects.length, tenantId: publicEnv.tenantId });
}
