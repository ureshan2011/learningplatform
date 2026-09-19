import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { hasAccess } from "@/lib/payments/entitlements";
import { getInputs } from "@/lib/campus-match/inputs";
import { courseHistory, getProfile, profileCodes } from "@/lib/campus-match/profiles";
import { handbookCoverYear } from "@/lib/campus-match/data";
import { CAMPUS_MATCH_ID } from "@/lib/campus-match/cycle";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge, Card, Eyebrow, PageHeader } from "@/components/ds";
import { PageShell } from "@/components/ds/PageShell";
import { CutoffHistory } from "@/components/campus-match/CutoffHistory";
import districts from "@/lib/content/ugc/districts.json";
import streams from "@/lib/content/ugc/streams.json";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * One degree, in the reader's language.
 *
 * Owned only, like the report: the cut-off history in a student's own district
 * is the paid half of this product. Two sources sit side by side here and are
 * labelled as such — the UGC's handbook and cut-off tables for everything with
 * a number in it, and ICT Campus's own plain description of the subject, which
 * carries no figure at all.
 */

const DISTRICT_NAMES = new Map(districts.districts.map((d) => [d.key, d.name]));
const STREAM_NAMES = new Map(streams.streams.map((s) => [s.key, s.name]));

export default async function DegreeProfilePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!profileCodes().includes(code)) notFound();

  const user = await requirePageUser(`/campus-match/degree/${code}`);
  const access = await hasAccess(user.uid, CAMPUS_MATCH_ID);
  if (!access.allowed) redirect("/campus-match");

  const [locale, t, inputs] = await Promise.all([
    getLocale(),
    getT(),
    getInputs(user.uid),
  ]);

  const profile = getProfile(code, locale);
  if (!profile) notFound();

  const district = inputs?.district;
  const history = district ? courseHistory(code, district) : [];
  const districtName = district ? (DISTRICT_NAMES.get(district) ?? district) : null;
  const admits = profile.course.streams.map((s) =>
    s === "any" ? t("match.anyStream") : (STREAM_NAMES.get(s) ?? s),
  );

  return (
    <PageShell width="reading">
      <PageHeader
        eyebrow={profile.faculty[locale === "si" ? "si" : "en"]}
        title={profile.course.name}
        subtitle={profile.about}
      />

      <Card radius="panel" className="mt-5 p-5 sm:p-6">
        <Eyebrow>{t("match.who")}</Eyebrow>
        <p className="mt-2.5 flex flex-wrap gap-2">
          {admits.map((name) => (
            <Badge key={name} tone="neutral">
              {name}
            </Badge>
          ))}
          {profile.course.aptitudeTest ? <Badge tone="warning">{t("match.aptitude")}</Badge> : null}
        </p>
        {/* True of every course today: the handbook writes its subject rules as
            prose with alternatives, and none has been reduced to a machine rule.
            Saying so is the honest version of not having reduced it. */}
        <p className="mt-3 text-sm leading-relaxed text-ict-ink-300">
          {t("match.streamOnly")}
          {profile.course.handbookPage
            ? ` ${t("match.page", {
                page: profile.course.handbookPage,
                year: handbookCoverYear() ?? "—",
              })}`
            : ""}
        </p>
      </Card>

      {profile.universities.length > 0 ? (
        <Card radius="panel" className="mt-4 p-5 sm:p-6">
          <Eyebrow>{t("match.where")}</Eyebrow>
          <ul className="mt-2.5">
            {profile.universities.map((name) => (
              <li
                key={name}
                className="border-t border-ict-border-dark py-2.5 text-sm text-ict-paper-50 first:border-t-0"
              >
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ict-ink-400">{t("match.whereNote")}</p>
        </Card>
      ) : null}

      {history.length > 0 && districtName ? (
        <Card radius="panel" className="mt-4 p-5 sm:p-6">
          <Eyebrow>{t("match.needed", { district: districtName })}</Eyebrow>
          <div className="mt-4">
            <CutoffHistory
              points={history}
              note={t("match.historyNote", { district: districtName })}
              zNote={t("match.historyZ")}
              z={inputs?.z}
            />
          </div>
        </Card>
      ) : null}

      <Card variant="feature" radius="panel" className="mt-4 p-5 sm:p-6">
        <Eyebrow>{t("match.waitTitle")}</Eyebrow>
        <p className="mt-2.5 text-sm leading-relaxed text-ict-paper-200">{t("match.waitBody")}</p>
        <p className="mt-3 text-sm">
          <Link
            href="/campus-ready"
            className="font-semibold text-ict-paper-50 underline underline-offset-4"
          >
            {t("match.waitCta")}
          </Link>
        </p>
      </Card>

      <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">
        {t("match.profileSources")} {t("match.notUgc")}
      </p>

      <p className="mt-4 text-sm">
        <Link
          href="/campus-match/report"
          className="font-semibold text-ict-orange-400 underline underline-offset-4"
        >
          {t("match.back")}
        </Link>
      </p>
    </PageShell>
  );
}
