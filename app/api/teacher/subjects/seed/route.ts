import { NextResponse } from "next/server";
import { col } from "@/lib/firebase/admin";
import { requireTeacher } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";
import type { Subject } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Creates the two default ICT subjects.
 *
 * The same thing `scripts/admin.mjs seed` does, exposed to the teacher console
 * so a brand-new platform can be set up entirely from the browser — no Node, no
 * service account key, no command line.
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
      id: "ol-ict",
      tenantId,
      name: "O/L ICT",
      grade: "OL",
      medium: "sinhala",
      priceLKR: 1500,
      description: "Grade 10-11 ICT, full syllabus with weekly past-paper practice.",
      syllabusTopics: [
        "Basic concepts of ICT",
        "Computer systems",
        "Data representation",
        "Operating systems",
        "Word processing",
        "Spreadsheets",
        "Presentations",
        "Databases",
        "Programming",
        "Web development",
        "ICT in business",
        "New trends",
      ],
      active: true,
    },
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
