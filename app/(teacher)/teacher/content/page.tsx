import { requireStaffPage } from "@/lib/auth/session";
import { listAllContent, listSubjects } from "@/lib/queries";
import { PageHeader, SectionBar } from "@/components/ds";
import { ContentUploadForm } from "@/components/teacher/ContentUploadForm";
import { ContentList, type ContentRow } from "@/components/teacher/ContentList";

export const dynamic = "force-dynamic";

/**
 * Notes and past papers, uploaded straight from the browser — no Firestore
 * seeding, no separate storage account. Uploading here is the entire publish
 * step: the file goes live on `/subjects/[subjectId]` immediately, and on
 * `/notes` or `/past-papers` too when marked free.
 */
export default async function TeacherContentPage() {
  await requireStaffPage("/teacher/content");

  const [subjects, items] = await Promise.all([listSubjects(), listAllContent()]);
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  const rows: ContentRow[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    kind: item.kind,
    subjectName: subjectNameById.get(item.subjectId) ?? item.subjectId,
    isPublic: item.isPublic,
    createdAt: item.createdAt,
  }));

  return (
    <main className="mx-auto max-w-[880px] px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        eyebrow="Teacher console"
        title="Content"
        subtitle="Notes, past papers and marking schemes — uploaded here, live immediately."
      />

      <section className="mt-5">
        <SectionBar title="Upload" />
        <div className="mt-3">
          <ContentUploadForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
        </div>
      </section>

      <section className="mt-8">
        <SectionBar title="Published" hint={`${rows.length} file${rows.length === 1 ? "" : "s"}`} />
        <div className="mt-3">
          <ContentList items={rows} />
        </div>
      </section>
    </main>
  );
}
