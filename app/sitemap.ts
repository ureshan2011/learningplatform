import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { listSubjects, listUnits } from "@/lib/queries";

/**
 * Every public, crawlable URL — static pages plus one entry per subject and
 * per syllabus unit, generated from the same Firestore data the pages
 * themselves render from rather than hand-maintained, so a new subject or
 * unit is discoverable the moment it's published.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.appUrl;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/syllabus`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/notes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/command-words`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/papers/al-ict-2026-paper-1-mcq`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const subjects = await listSubjects().catch(() => []);

  const subjectEntries: MetadataRoute.Sitemap = subjects.map((s) => ({
    url: `${base}/syllabus/${s.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const unitEntries: MetadataRoute.Sitemap = (
    await Promise.all(
      subjects.map(async (s) => {
        const units = await listUnits(s.id).catch(() => []);
        return units.map((u) => ({
          url: `${base}/syllabus/${s.id}/${u.id}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      }),
    )
  ).flat();

  return [...staticEntries, ...subjectEntries, ...unitEntries];
}
