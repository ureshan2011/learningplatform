import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { listSubjects, listUnits } from "@/lib/queries";

/**
 * Every public, crawlable URL — static pages plus one entry per subject and
 * per syllabus unit, generated from the same Firestore data the pages
 * themselves render from rather than hand-maintained, so a new subject or
 * unit is discoverable the moment it's published.
 *
 * `priority` is ordered by what the site is actually trying to rank for, not
 * by how the routes happen to nest: the two pages that answer the commercial
 * query ("A/L ICT classes") and the highest-volume informational one ("A/L
 * ICT past papers") sit just under the home page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.appUrl;

  // A single build-time stamp. Every page here is either statically generated
  // or revalidated on a timer, so they genuinely do change together on deploy
  // — and a lastModified that moves per-request would train crawlers to
  // ignore the field entirely.
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${base}/al-ict-classes`, lastModified, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/past-papers`, lastModified, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/syllabus`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/notes`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${base}/papers/al-ict-2026-paper-1-mcq`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${base}/university-pathways`, lastModified, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/command-words`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/distinguish-between`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/number-systems`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/logic-gates`, lastModified, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refund-policy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];

  const subjects = await listSubjects().catch(() => []);

  const subjectEntries: MetadataRoute.Sitemap = subjects.map((s) => ({
    url: `${base}/syllabus/${s.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const unitEntries: MetadataRoute.Sitemap = (
    await Promise.all(
      subjects.map(async (s) => {
        const units = await listUnits(s.id).catch(() => []);
        return units.map((u) => ({
          url: `${base}/syllabus/${s.id}/${u.id}`,
          lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      }),
    )
  ).flat();

  return [...staticEntries, ...subjectEntries, ...unitEntries];
}
