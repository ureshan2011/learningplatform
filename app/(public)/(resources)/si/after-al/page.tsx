import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { AdmissionCalendar } from "@/components/content/AdmissionCalendar";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { ButtonLink, Card, IconBadge, PageHeader, SectionHeading } from "@/components/ds";
import type { IconName } from "@/components/ui/Icon";
import { LAST_CYCLE, NEXT_CYCLE, WAIT_MONTHS_SI } from "@/lib/content/admission-calendar";
import { campusMetadata } from "@/lib/seo/campus";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

const TITLE = "A/L වලින් පස්සේ මොකද කරන්නේ? campus යනකන්";
const DESCRIPTION =
  "A/L exam එක ඉවරයි. Results, UGC application, Z-score cut-offs, A/L වලින් පස්සේ තියෙන පාරවල් පහ, campus යනකන් කරන්න දේවල් — දවස් එක්ක, නොමිලේ.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/si/after-al",
  locale: "si_LK",
  languages: { en: "/after-al", si: "/si/after-al" },
  keywords: [
    "A/L වලින් පස්සේ",
    "උසස් පෙළෙන් පසු",
    "campus යනකන් මොකද කරන්නේ",
    "A/L iwara unata passe mokada karanne",
    "after A/L Sinhala",
  ],
});

export const revalidate = 86400;

/**
 * `/after-al` in Sinhala — its own page, not a toggle.
 *
 * The site's language switch is a cookie, which is right for the signed-in app
 * and wrong for search: a crawler never carries the cookie, so a Sinhala
 * version behind it is never indexed. A Sinhala searcher types Sinhala, so the
 * page they should land on has its own URL, and each version names the other
 * through hreflang (see `campusMetadata`).
 *
 * Written the way the platform writes Sinhala everywhere: everyday spoken
 * Sinhala, technical words in English. The dates come from the same calendar
 * as the English page, so the two cannot disagree.
 */

const ROUTES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "school",
    title: "රජයේ විශ්වවිද්‍යාලයක් — UGC හරහා",
    body: "Tuition නොමිලේ. තෝරගන්නේ Z-score එක, දිස්ත්‍රික්කය සහ ඔයා online application එකේ courses දාපු පිළිවෙළ අනුව. ගොඩක් අය මුලින්ම බලන්නේ මේකට. Application window එක open වෙන්න කලින්, ඔයාගේ stream එකට apply කරන්න පුළුවන් courses මොනවද, පහුගිය අවුරුද්දේ ඔයාගේ දිස්ත්‍රික්කයේ cut-off එක කීයද කියලා බලන්න.",
  },
  {
    icon: "auto_stories",
    title: "External හෝ distance degree එකක්",
    body: "රජයේ විශ්වවිද්‍යාල කීපයක් සහ ශ්‍රී ලංකා විවෘත විශ්වවිද්‍යාලය external සහ distance degrees දෙනවා. ඒවට ඇතුල් වෙන්න වෙනම නීති තියෙනවා, ගොඩක් වෙලාවට Z-score එකෙන් තීරණය වෙන්නේ නෑ. ගොඩක් දුරට තනියම ඉගෙනගන්න ඕන, වැඩ කරන ගමන් කරන අයත් ඉන්නවා. අලුත් intake එක ගැන ඒ විශ්වවිද්‍යාලයේම site එකේ බලන්න.",
  },
  {
    icon: "account_balance",
    title: "පෞද්ගලික degree එකක්",
    body: "රජයේ නොවන ආයතන degrees දෙනවා — සමහර ඒවා එයාලගේම, සමහර ඒවා විදේශ විශ්වවිද්‍යාල වලින්. ගාස්තු වැඩියි, quality එක තැනින් තැනට වෙනස්. සල්ලි ගෙවන්න කලින්, ඔයා බලාපොරොත්තු වෙන job එකට ඒ degree එක උසස් අධ්‍යාපන අමාත්‍යාංශය හෝ UGC එක පිළිගන්නවද කියලා බලන්න.",
  },
  {
    icon: "workspace_premium",
    title: "Professional qualification එකක්",
    body: "Accounting, management, IT ආයතන A/L ඉවර වුණ ගමන් පටන් ගන්න පුළුවන්, වැඩ කරන ගමන් කරන්න පුළුවන් qualifications දෙනවා. සමහර ඒවා employers ලා තනියම පිළිගන්නවා, සමහර ඒවා පස්සේ degree එකක් එක්ක එකතු කරගන්න පුළුවන්.",
  },
  {
    icon: "work",
    title: "වෘත්තීය පුහුණුව (NVQ)",
    body: "රජයේ සහ අනුමත පුහුණු මධ්‍යස්ථාන වල NVQ courses කෙලින්ම skilled වැඩකට යන්න උදව් වෙනවා. කෙටි, practical, ගොඩක් වෙලාවට අඩු ගාණකට හෝ නොමිලේ.",
  },
];

const WHILE_YOU_WAIT: string[] = [
  "Word සහ Excel හරියට ඉගෙනගන්න — styles, automatic contents, formulas, charts. හැම degree එකක්ම හිතන්නේ ඔයා මේවා දන්නවා කියලා.",
  "ඉංග්‍රීසි කියවීම සහ ලිවීම දියුණු කරගන්න. ගොඩක් degrees වල lectures, පොත්, exams ඔක්කොම ඉංග්‍රීසියෙන්.",
  "Sources reference කරන්නත්, AI අවංකව පාවිච්චි කරන්නත් ඉගෙනගන්න. First-year assignments වලට marks දෙන්නේ දෙකටම.",
  "ඔයාගේ degree එක IT නොවුණත්, programming හෝ data වැඩක් එකක් හරි කරලා බලන්න. දැන් හැම faculty එකකම data පාවිච්චි කරනවා.",
  "ඔයාගේ list එකේ තියෙන හැම degree එකකම first year එකේ ඇත්තටම උගන්වන්නේ මොනවද කියලා කියවන්න. එතකොට courses දාන පිළිවෙළ ඇත්ත තීරණයක් වෙනවා.",
  "පුළුවන් නම් වැඩක් කරන්න, volunteer කරන්න, ගෙදරට උදව් කරන්න — ඒ එක්කම දවසට පොඩි වෙලාවක් පාඩම් කරන පුරුද්දක් තියාගන්න. එතකොට first semester එක shock එකක් වෙන්නේ නෑ.",
];

const FAQS = [
  {
    q: "A/L සහ campus අතර කොච්චර කාලයක් බලන් ඉන්න වෙනවද?",
    a: `සාමාන්‍යයෙන් exam එක ලියපු දවසේ ඉඳන් පළවෙනි lecture එකට ${WAIT_MONTHS_SI}, සමහර වෙලාවට ඊටත් වැඩියි. Results, UGC application, re-scrutiny, cut-offs, selection, ඊට පස්සේ විශ්වවිද්‍යාලයේ registration — එකින් එක වෙන්න කාලය යනවා.`,
  },
  {
    q: "මගේ Z-score එක හොයාගන්නේ කොහෙන්ද?",
    a: "විභාග දෙපාර්තමේන්තුවෙන් එන A/L results sheet එකේ තියෙනවා. ඒකෙන් පෙන්නන්නේ ඔයාගේ raw marks නෙවෙයි, ඒ subjects ලියපු අනිත් අයට සාපේක්ෂව ඔයා කොහොමද කරලා තියෙන්නේ කියලා.",
  },
  {
    q: "University වලට apply කරන්නේ කවද්ද?",
    a: "Results ආවට පස්සේ UGC එක කියන window එකේ, ugc.ac.lk එකෙන් online. 2025/2026 intake එකට 2026 අප්‍රේල් 28 ඉඳන් මැයි 19 වෙනකන් තිබුණා, late applications ගත්තේ නෑ.",
  },
  {
    q: "මගේ Z-score එක පහුගිය අවුරුද්දේ cut-off එකට අඩු නම්?",
    a: "Cut-offs හැම අවුරුද්දෙම වෙනස් වෙනවා. ඒ නිසා ඔයා කැමති courses වලට apply කරන්න, ඒ එක්කම ලැබෙන්න ඉඩ වැඩි courses list එකේ පහළට දාන්න. Select වුණේ නැත්නම් A/L ආයේ ලියන්න පුළුවන්, නැත්නම් මේ page එකේ තියෙන අනිත් පාරක් තෝරගන්න පුළුවන්.",
  },
  {
    q: "බලන් ඉන්න කාලේ course එකක් කරන එක වටිනවද?",
    a: "ඔව්, ඔයාගේ degree එක ඔයා දන්නවා කියලා හිතන, ඒත් කවුරුත් උගන්වන්නේ නැති දෙයක් උගන්වනවා නම් — computer skills, ඉංග්‍රීසි, referencing. University එකක් හෝ employer කෙනෙක් පිළිගන්නේ නැති certificate එකකට ලොකු ගාණක් ගෙවන්න එපා.",
  },
];

export default function AfterAlSinhalaPage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          articleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/si/after-al",
            dateModified: "2026-09-22",
            inLanguage: "si",
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "A/L වලින් පස්සේ", path: "/si/after-al" },
          ]),
        ])}
      />
      <main lang="si" className="mx-auto max-w-3xl px-5 py-12">
        <p className="mb-4 text-sm">
          <Link href="/after-al" lang="en" className="text-ict-fg-mute underline underline-offset-4 hover:text-ict-fg">
            Read in English
          </Link>
        </p>
        <PageHeader
          eyebrow="නොමිලේ · A/L වලින් පස්සේ"
          title="A/L වලින් පස්සේ මොකද කරන්නේ?"
          subtitle={`Exam එක ඉවරයි, campus යන්න තව ${WAIT_MONTHS_SI} තියෙනවා. ඒ මැද මොනවද වෙන්නේ, ඔයාට තියෙන පාරවල් මොනවද, ඒ කාලය හොඳට පාවිච්චි කරන්නේ කොහොමද කියලා මෙතන තියෙනවා.`}
        />

        <section className="mt-12">
          <SectionHeading as="h2">Exam එකේ ඉඳන් lecture එකට: දවස්</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            ඔයා 2026 A/L ලිව්වා නම්, මේ ඔයාගේ අවුරුද්ද. දවස් check කළේ 2026 සැප්තැම්බර් 22.
          </p>
          <div className="mt-5">
            <AdmissionCalendar steps={NEXT_CYCLE} lang="si" />
          </div>

          <h3 className="mt-8 font-display text-lg font-bold text-ict-fg">පහුගිය පාර වුණේ මොකද</h3>
          <p className="mt-1 text-sm text-ict-fg-mute">
            2025 A/L, 2025/2026 intake එක. ඔයාගේ අවුරුද්ද කොහොම යයිද කියලා හොඳම guide එක.
          </p>
          <div className="mt-4">
            <AdmissionCalendar steps={LAST_CYCLE} lang="si" />
          </div>

          <p className="mt-5 text-sm text-ict-fg-soft">
            Z-score ගැන අලුත් නම්?{" "}
            <Link href="/si/z-score" className="font-semibold text-ict-accent-fg underline underline-offset-4">
              Z-score එක හදන හැටි
            </Link>
            . හැම course එකකම පහුගිය පාර cut-off එක{" "}
            <Link href="/z-score-cutoffs" className="font-semibold text-ict-accent-fg underline underline-offset-4">
              මෙතන
            </Link>
            .
          </p>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">A/L වලින් පස්සේ පාරවල් පහක්</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            Degree එකකට හෝ career එකකට තියෙන එකම පාර රජයේ විශ්වවිද්‍යාලය නෙවෙයි. ගොඩක් අය selection
            results එනකන් මේවායින් එකකට වඩා open තියාගන්නවා.
          </p>
          <ul className="mt-5 space-y-3">
            {ROUTES.map((r) => (
              <li key={r.title}>
                <Card radius="card" className="flex gap-4 p-5">
                  <IconBadge icon={r.icon} size={40} />
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-ict-fg">{r.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ict-fg-soft">{r.body}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <SectionHeading as="h2">බලන් ඉන්න කාලේ කරන්න දේවල්</SectionHeading>
          <Card radius="card" className="mt-5 p-6">
            <ul className="space-y-3">
              {WHILE_YOU_WAIT.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-ict-fg-soft">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ict-fg-dim" />
                  {line}
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="feature" radius="panel" className="mt-5 p-6 sm:p-8">
            <h3 className="font-display text-lg font-extrabold">
              උඩ තියෙන හතර එකම තැනකින්, ගුරුවරයෙක් එක්ක
            </h3>
            <p className="mt-2 text-sm text-ict-on-feature-soft">
              Campus Ready කියන්නේ මේ කාලයටම හදපු සති 12ක online course එකක්, සිංහලෙන්: Word සහ
              Excel, Python, statistics, referencing සහ AI අවංකව පාවිච්චි කරන හැටි. උගන්වන්නේ
              Dr. Yasas Sri Wickramasinghe. එක payment එකයි, අවුරුද්දකට intakes දෙකයි. Laptop එකක්
              ඕන.
            </p>
            <ButtonLink href="/campus-ready" variant="primary" className="mt-5">
              Campus Ready බලන්න
            </ButtonLink>
          </Card>
        </section>

        <FaqList faqs={FAQS} heading="A/L වලින් පස්සේ අහන ප්‍රශ්න" />

        <div lang="en">
          <CampusFooter />
        </div>
      </main>
    </>
  );
}
