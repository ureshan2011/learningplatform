import { SubjectTabs } from "@/components/subject/SubjectTabs";
import { ButtonLink, Card, Eyebrow, PageHeader } from "@/components/ds";
import type { AccessResult } from "@/lib/types";

/**
 * The frame every page inside a subject shares.
 *
 * The four study pages each grew their own back-link, their own heading and
 * their own copy of the "you are not enrolled" panel — four slightly different
 * answers to the same question, three of which sent the student to the
 * dashboard to work out what to do next. One frame keeps them consistent and
 * puts the tabs on all of them.
 */
export function SubjectPageShell({
  subjectId,
  subjectName,
  title,
  subtitle,
  access,
  lockedBody,
  children,
}: {
  subjectId: string;
  subjectName: string;
  title: string;
  subtitle?: string;
  access: AccessResult;
  /** What this specific page unlocks, e.g. "practice and spaced revision". */
  lockedBody: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader eyebrow={subjectName} title={title} subtitle={subtitle} />

      <div className="mt-5">
        <SubjectTabs subjectId={subjectId} locked={!access.allowed} />
      </div>

      <div className="mt-5">
        {access.allowed ? children : <SubjectLocked subjectId={subjectId} access={access} body={lockedBody} />}
      </div>
    </main>
  );
}

/**
 * One locked state, used everywhere.
 *
 * It sends the student to the subject page rather than the dashboard — that is
 * where the price, the trial and both payment routes actually are, and
 * "Subscribe" pointing at a dashboard that then makes you find the subject
 * again is the kind of dead end that loses a sale.
 */
export function SubjectLocked({
  subjectId,
  access,
  body,
}: {
  subjectId: string;
  access: AccessResult;
  body: string;
}) {
  const expired = access.reason === "expired";
  return (
    <Card variant="feature" radius="panel" className="p-6 sm:p-8">
      <Eyebrow>{expired ? "Subscription ended" : "Locked"}</Eyebrow>
      <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-[-0.03em] text-ict-paper-50">
        {expired ? "Renew to carry on" : "Subscribe to unlock"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-ict-orange-200">{body}</p>
      <ButtonLink href={`/subjects/${subjectId}`} arrow="right" className="mt-5">
        {expired ? "Renew now" : "See what's included"}
      </ButtonLink>
    </Card>
  );
}
