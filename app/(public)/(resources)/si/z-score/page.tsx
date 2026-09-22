import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampusFooter } from "@/components/content/CampusFooter";
import { FaqList } from "@/components/content/FaqList";
import { ZScoreForm } from "@/components/content/ZScoreForm";
import { Card, PageHeader, SectionHeading } from "@/components/ds";
import { EXAMPLE_FINAL_Z, EXAMPLE_SUBJECTS, subjectZ, z4 } from "@/lib/content/z-score";
import { campusMetadata } from "@/lib/seo/campus";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, graphJsonLd } from "@/lib/seo/json-ld";

const TITLE = "Z-score කියන්නේ මොකක්ද? A/L Z-score එක හදන හැටි";
const DESCRIPTION =
  "A/L Z-score එක සරලව: ඒකෙන් මනින්නේ මොකක්ද, subjects තුනෙන් හදන්නේ කොහොමද, උදාහරණයක්, දිස්ත්‍රික්කෙන් දිස්ත්‍රික්කෙට cut-off වෙනස් ඇයි කියලා.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/si/z-score",
  locale: "si_LK",
  languages: { en: "/z-score", si: "/si/z-score" },
  keywords: [
    "Z ලකුණ",
    "Z-score කියන්නේ මොකක්ද",
    "Z ලකුණ ගණනය කරන්නේ කොහොමද",
    "z score kiyanne mokakda",
    "z score hadanne kohomada",
  ],
});

/**
 * `/z-score` in Sinhala. Same method, same computed example, same form into
 * the free checker — see the English page for why there is no raw-marks
 * calculator, and `/si/after-al` for why a Sinhala page has its own URL.
 */

const FAQS = [
  {
    q: "A/L Z-score කියන්නේ මොකක්ද?",
    a: "ඒ අවුරුද්දේ ඒ subject එක ලියපු හැමෝගෙම සාමාන්‍යයට වඩා ඔයා කොච්චර ඉහළින්ද පහළින්ද කියලා standard deviations වලින් පෙන්නන ගාණක්. Subjects තුනේ Z-score වල සාමාන්‍යය තමයි ඔයාගේ final Z-score එක. ඒක results sheet එකේ තියෙනවා.",
  },
  {
    q: "මගේ marks වලින් Z-score එක හදාගන්න පුළුවන්ද?",
    a: "කලින් බැහැ. ඒකට ඒ අවුරුද්දේ හැම subject එකකම මුළු රටේම සාමාන්‍යය සහ standard deviation ඕන, ඒවා results එන්න කලින් publish කරන්නේ නෑ. Raw marks ඉල්ලන online calculators කරන්නේ ඒ ගණන් අනුමාන කරන එක.",
  },
  {
    q: "Z-score 1ක් හොඳද?",
    a: "ඒ කියන්නේ subjects තුනේම සාමාන්‍යයෙන් ඔයා standard deviation එකක් ඉහළින් — මැදට වඩා හොඳටම ඉහළින්. ඒක ඇති වෙයිද කියන එක course එකයි දිස්ත්‍රික්කයයි අනුව වෙනස්. ඔයා කැමති courses වල පහුගිය පාර cut-off එකත් එක්ක සසඳලා බලන්න.",
  },
  {
    q: "එකම course එකට දිස්ත්‍රික්කෙන් දිස්ත්‍රික්කෙට Z-score වෙනස් ඇයි?",
    a: "University seats ගොඩක් දිස්ත්‍රික්ක අනුව බෙදනවා. ඒ නිසා හැම දිස්ත්‍රික්කයකටම තමන්ගේම තරඟයක් සහ තමන්ගේම cut-off එකක් තියෙනවා. UGC එක හැම course එකකටම, හැම university එකකටම, හැම දිස්ත්‍රික්කයකටම වෙනම cut-off එකක් publish කරන්නේ ඒ නිසා.",
  },
  {
    q: "Cut-offs හැම අවුරුද්දෙම වෙනස් වෙන්නේ ඇයි?",
    a: "Cut-off එක කියන්නේ අන්තිමට select වුණ කෙනාගේ Z-score එක. Apply කරපු ගාණ, එයාලා කරපු විදිහ, seats ගාණ, students courses දාපු පිළිවෙළ — මේ හැම එකක් එක්කම ඒක වෙනස් වෙනවා. පහුගිය අවුරුද්දේ cut-off එක guide එකක් විතරයි, පොරොන්දුවක් නෙවෙයි.",
  },
];

export default function ZScoreSinhalaPage() {
  return (
    <>
      <JsonLd
        data={graphJsonLd([
          articleJsonLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: "/si/z-score",
            dateModified: "2026-09-22",
            inLanguage: "si",
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Z-score", path: "/si/z-score" },
          ]),
        ])}
      />
      <main lang="si" className="mx-auto max-w-3xl px-5 py-12">
        <p className="mb-4 text-sm">
          <Link href="/z-score" lang="en" className="text-ict-fg-mute underline underline-offset-4 hover:text-ict-fg">
            Read in English
          </Link>
        </p>
        <PageHeader
          eyebrow="නොමිලේ · university admission"
          title="Z-score කියන්නේ මොකක්ද?"
          subtitle="ඔයාට යන්න පුළුවන් රජයේ university course එක තීරණය කරන, A/L results sheet එකේ තියෙන ගාණ. ඒකෙන් මනින්නේ මොකක්ද, හදන්නේ කොහොමද, ඔයාගේ එක එක්ක මොකද කරන්නේ කියලා."
        />

        <Card radius="card" className="mt-8 p-6">
          <h2 className="font-display text-lg font-extrabold text-ict-fg">කෙටියෙන්ම</h2>
          <p className="mt-2 text-sm leading-relaxed text-ict-fg-soft">
            Z-score එකෙන් ඔයාව ඒ අවුරුද්දේ ඒ subjects ලියපු හැමෝත් එක්ක සසඳනවා. හැම subject
            එකකම ඔයාගේ marks සාමාන්‍යයට වඩා කොච්චර ඉහළින්ද පහළින්ද කියලා, ඒ subject එකේ පැතිරීම
            (standard deviation) අනුව මනිනවා. Subjects තුනේ සාමාන්‍යය තමයි final Z-score එක. එතකොට
            අමාරු paper එකකුයි ලේසි paper එකකුයි එකම මිනුමකට එනවා. ඒ අවුරුද්දේ තද විදිහට marks
            දාපු subject එකක් තෝරපු කෙනාට අසාධාරණයක් වෙන්නේ නෑ.
          </p>
        </Card>

        <section className="mt-12">
          <SectionHeading as="h2">හදන්නේ කොහොමද</SectionHeading>
          <Card radius="card" className="mt-4 p-6">
            <p className="text-sm text-ict-fg-soft">හැම subject එකකටම:</p>
            <p className="mt-2 rounded-ict-md bg-ict-surface px-4 py-3 font-mono text-sm text-ict-fg">
              z = (ඔයාගේ marks − subject සාමාන්‍යය) ÷ subject standard deviation
            </p>
            <p className="mt-4 text-sm text-ict-fg-soft">ඊට පස්සේ:</p>
            <p className="mt-2 rounded-ict-md bg-ict-surface px-4 py-3 font-mono text-sm text-ict-fg">
              Z-score = (z₁ + z₂ + z₃) ÷ 3
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ict-fg-mute">
              Z-score 0 කියන්නේ හරියටම සාමාන්‍යය. + නම් සාමාන්‍යයට වඩා ඉහළ, − නම් පහළ. ගොඩක් අය −2
              ත් +2 ත් අතර ඉන්නවා, 2ට වඩා වැඩි Z-score එකක් ලැබෙන්නේ ටික දෙනෙකුට.
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <SectionHeading as="h2">උදාහරණයක්</SectionHeading>
          <p className="mt-2 text-sm text-ict-fg-mute">
            පහළ තියෙන ගණන් හදලා තියෙන්නේ ක්‍රමය පෙන්නන්න විතරයි. ඇත්ත සාමාන්‍යය සහ standard
            deviation හැම අවුරුද්දෙම වෙනස්, results එන්න කලින් publish කරන්නේ නෑ.
          </p>
          <Card radius="card" className="mt-4 p-4 sm:p-6">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-xs text-ict-fg-mute">
                  <th scope="col" className="py-2 font-semibold">Subject</th>
                  <th scope="col" className="py-2 text-right font-semibold">Marks</th>
                  <th scope="col" className="py-2 text-right font-semibold">සාමාන්‍යය</th>
                  <th scope="col" className="py-2 text-right font-semibold">SD</th>
                  <th scope="col" className="py-2 text-right font-semibold">z</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_SUBJECTS.map((s) => (
                  <tr key={s.subject} className="border-t border-ict-line">
                    <th scope="row" className="py-2 text-left font-normal text-ict-fg-soft">
                      {s.subject.replace("Subject ", "S")}
                    </th>
                    <td className="py-2 text-right font-mono text-ict-fg">{s.mark}</td>
                    <td className="py-2 text-right font-mono text-ict-fg">{s.average}</td>
                    <td className="py-2 text-right font-mono text-ict-fg">{s.sd}</td>
                    <td className="py-2 text-right font-mono text-ict-fg">{z4(subjectZ(s))}</td>
                  </tr>
                ))}
                <tr className="border-t border-ict-line-strong">
                  <th scope="row" colSpan={4} className="py-2 text-left font-semibold text-ict-fg">
                    Z-score (තුනේ සාමාන්‍යය)
                  </th>
                  <td className="py-2 text-right font-mono font-bold text-ict-fg">{z4(EXAMPLE_FINAL_Z)}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        <section className="mt-12">
          <SectionHeading as="h2">දිස්ත්‍රික්කය වැදගත් ඇයි</SectionHeading>
          <Card radius="card" className="mt-4 p-6">
            <p className="text-sm leading-relaxed text-ict-fg-soft">
              Select කරන්නේ ඔයාගේ Z-score එකයි, ඔයා exam එක ලියපු දිස්ත්‍රික්කයයි දෙකම අනුව. එක
              course එකක seats ගොඩක් දිස්ත්‍රික්ක අනුව බෙදනවා, ඒ නිසා එකම course එකට හැම
              දිස්ත්‍රික්කයකම වෙනස් cut-off එකක් තියෙනවා. සමහර courses වලට තෝරගන්නේ මුළු රටේම merit
              එකෙන් විතරයි. ඒ නිසයි එක දිස්ත්‍රික්කයක Medicine ලැබුණ Z-score එකකට තව දිස්ත්‍රික්කයක
              ලැබෙන්නේ නැත්තේ.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ict-fg-soft">
              හැම course එකකම, හැම දිස්ත්‍රික්කයකම cut-off:{" "}
              <Link href="/z-score-cutoffs" className="font-semibold text-ict-accent-fg underline underline-offset-4">
                Z-score cut-offs, course අනුව
              </Link>
              .
            </p>
          </Card>
        </section>

        <Card variant="feature" radius="panel" className="mt-12 p-6 sm:p-8">
          <h2 className="font-display text-lg font-extrabold">Z-score එක ආවද? ඒකෙන් යන්න පුළුවන් courses බලන්න</h2>
          <p className="mt-2 mb-5 text-sm text-ict-on-feature-soft">
            ඔයාගේ stream එකට apply කරන්න පුළුවන් හැම course එකක්ම, පහුගිය පාර ඔයාගේ දිස්ත්‍රික්කයේ
            cut-off එකත් එක්ක. නොමිලේ, sign in වෙන්න ඕන නෑ.
          </p>
          <ZScoreForm
            labels={{
              z: "ඔයාගේ Z-score එක",
              district: "දිස්ත්‍රික්කය",
              stream: "Stream එක",
              choose: "තෝරන්න",
              submit: "මගේ courses බලන්න",
            }}
          />
        </Card>

        <FaqList faqs={FAQS} heading="Z-score ගැන අහන ප්‍රශ්න" />

        <div lang="en">
          <CampusFooter />
        </div>
      </main>
    </>
  );
}
