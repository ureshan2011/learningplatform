import Link from "next/link";
import type { Metadata } from "next";
import { getProduct } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import { LAUNCH_NOTE, paymentsPaused } from "@/lib/payments/launch";
import { AI_NOTE, PACK_ITEMS, SURVIVAL_PACK } from "@/lib/content/survival-pack";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteHeader } from "@/components/nav/SiteHeader";
import { FaqAccordion } from "@/components/marketing/landing/FaqAccordion";
import { CrossPromoBand } from "@/components/marketing/landing/CrossPromoBand";
import { CampusReadyMark } from "@/components/marketing/CampusReadyLogo";
import { breadcrumbJsonLd, faqJsonLd, graphJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { TEACHER_NAME } from "@/lib/seo/site";
import { campusMetadata } from "@/lib/seo/campus";

// Under 60 characters with the " | ICT Campus" suffix, so Google shows all of it.
const TITLE = "University assignment template and APA guide";
const DESCRIPTION =
  "A Word assignment template with automatic contents, an APA 7 and Harvard guide with real Sri Lankan examples, a Python starter notebook, a Zotero library and email templates. One payment, yours for three years.";

export const metadata: Metadata = campusMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/campus-survival-pack",
  keywords: [
    "university assignment template Word",
    "assignment format Sri Lanka",
    "APA referencing guide Sri Lanka",
    "Harvard referencing Sri Lanka",
    "Zotero Sri Lanka",
    "how to email a lecturer",
    "AI declaration template university",
    "first year university Sri Lanka",
    "Python notebook for beginners Sinhala",
    "assignment template එකක්",
    "APA reference එකක් ලියන හැටි",
    "campus එකට ලෑස්ති වෙන්න",
  ],
});

/**
 * The pack's sales page.
 *
 * Cached for an hour and reads the product once, not per visitor — the only
 * thing that changes is the price, and a Firestore read per crawler hit for a
 * number that moves twice a year is not worth paying for.
 *
 * Unlike `/campus-ready`, this page can sell every day of the year, so the CTA
 * is always live and there is no lead-capture fallback.
 */
export const revalidate = 3600;

const CONTAINER = "mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,32px)]";
const EYEBROW = "text-[13px] font-bold tracking-[0.14em] text-(--lp-orange-500) uppercase";

const FAQS = [
  {
    q: "Do I need a laptop, or is a phone enough?",
    a: "The four guides work on a phone. The Word and Excel files need a laptop, or the free Microsoft Office apps on Android. The Python notebook opens in Google Colab in a phone browser, so that one is fine either way.",
  },
  {
    q: "Which apps do I need?",
    a: "Microsoft Word and Excel for the templates — the free web versions open them too. Zotero, which is free, for the reference library. A browser for everything else. Nothing you have to buy.",
  },
  {
    q: "How do I pay?",
    a: "By card through PayHere, or by depositing to the bank and uploading the slip if that is switched on. A card unlocks the pack within seconds; a bank slip unlocks it once the teacher approves it.",
  },
  {
    q: "Can I get a refund?",
    a: "Within seven days, if you have not downloaded or opened anything, yes — in full. After a download, no, because a file cannot be returned. Everything in the pack is listed on this page and on the pack page before you pay, so you are not buying blind.",
  },
  {
    q: "How long do I keep it?",
    a: "Three years from the day you buy it — the length of a degree. Not 'lifetime': promising to store files forever for one payment is a promise nobody can keep.",
  },
  {
    q: "Who made it, and was AI used?",
    a: `The pack was drafted with AI and reviewed by ${TEACHER_NAME}. Every referencing example in it is a real Sri Lankan source that was opened and checked, because a citation that does not exist is the one mistake that costs a student marks.`,
  },
  {
    q: "Is it accredited?",
    a: "No. It is not accredited or recognised by any university, and it does not carry a certificate. It is a set of files and guides that make your first assignment easier.",
  },
];

export default async function CampusSurvivalPackPage() {
  // Falls back to the price in code. This page is prerendered at build time,
  // where Firestore is not reachable, and a sales page that 500s because the
  // database was briefly unavailable is worse than one showing last week's
  // price for an hour.
  const product = await getProduct(SURVIVAL_PACK.id).catch(() => null);
  const feeLKR = product?.product?.feeLKR ?? SURVIVAL_PACK.feeLKR;
  const fee = formatLKR(feeLKR);
  // Trial-only launch — see `lib/payments/launch.ts`. The pack is not on sale
  // today, so the buy buttons say what is actually true and the page keeps
  // selling the contents rather than a checkout that will refuse.
  const paused = paymentsPaused();

  const downloads = PACK_ITEMS.filter((i) => i.kind === "download");
  const guides = PACK_ITEMS.filter((i) => i.kind === "guide");

  return (
    <>
      <JsonLd
        data={graphJsonLd([
          productJsonLd({
            name: SURVIVAL_PACK.name,
            description: DESCRIPTION,
            path: "/campus-survival-pack",
            priceLKR: feeLKR,
          }),
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: SURVIVAL_PACK.name, path: "/campus-survival-pack" },
          ]),
        ])}
      />
      <SiteHeader user={null} />

      <main className="landing-ict bg-(--lp-paper-100)">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className={`${CONTAINER} py-[clamp(40px,7vw,80px)]`}>
          <p className={EYEBROW}>{SURVIVAL_PACK.name}</p>
          <h1 className="mt-3 max-w-[16ch] font-[family-name:var(--lp-font-display)] text-[clamp(34px,5.4vw,58px)] leading-[1.04] font-extrabold tracking-[-0.03em] text-(--lp-ink-900) text-wrap-balance">
            Everything your first assignment assumes you already have
            <span className="text-(--lp-orange-500)">.</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[clamp(15px,1.4vw,18px)] text-(--lp-ink-500) text-wrap-pretty">
            Seven files and four guides for the first year of a degree: a Word assignment template
            that builds its own contents page, referencing done properly with real Sri Lankan
            examples, and the emails nobody teaches you to write. In Sinhala and English.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={`/packs/${SURVIVAL_PACK.id}`}
              className="flex h-12 items-center gap-3 rounded-full bg-(--lp-orange-500) py-2 pr-2 pl-6 text-base font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
            >
              {paused ? "See what's inside" : `Get the pack — ${fee}`}
            </Link>
            <span className="text-sm text-(--lp-ink-500)">
              {paused
                ? LAUNCH_NOTE.short
                : "One payment · Instant access · Yours for three years"}
            </span>
          </div>

          <p className="mt-4 text-sm text-(--lp-ink-500)">
            The guides work on a phone. The Word and Excel files need a laptop or the free Office
            apps.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Inside the pack                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Inside the pack</p>
          <h2 className="mt-3 font-[family-name:var(--lp-font-display)] text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
            Eleven things, not a folder of PDFs
          </h2>

          <h3 className="mt-10 text-sm font-bold tracking-[0.1em] text-(--lp-ink-500) uppercase">
            Files you download
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {downloads.map((item) => (
              <li
                key={item.key}
                className="rounded-[var(--lp-radius-md)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-5"
              >
                <p className="font-[family-name:var(--lp-font-display)] text-base font-extrabold text-(--lp-ink-900)">
                  {item.title.en}
                </p>
                <p className="mt-1.5 text-sm text-(--lp-ink-500)">{item.blurb.en}</p>
              </li>
            ))}
          </ul>

          <h3 className="mt-10 text-sm font-bold tracking-[0.1em] text-(--lp-ink-500) uppercase">
            Guides you read in the app
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {guides.map((item) => (
              <li
                key={item.key}
                className="rounded-[var(--lp-radius-md)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-5"
              >
                <p className="font-[family-name:var(--lp-font-display)] text-base font-extrabold text-(--lp-ink-900)">
                  {item.title.en}
                </p>
                <p className="mt-1.5 text-sm text-(--lp-ink-500)">{item.blurb.en}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Who it is for                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Who it is for</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Waiting after A/Ls",
                body: "You have months before your degree starts. This is the part of it you can do now, in an afternoon.",
              },
              {
                title: "In your first year",
                body: "The first assignment is due and nobody explained the format, the referencing or the file name. This is that explanation.",
              },
              {
                title: "Any year with a research project",
                body: "The referencing guide, the Zotero library and the survey checklist are the same ones you need in year three.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-[var(--lp-radius-md)] border border-(--lp-border-subtle) bg-(--lp-paper-0) p-6"
              >
                <p className="font-[family-name:var(--lp-font-display)] text-lg font-extrabold text-(--lp-ink-900)">
                  {card.title}
                </p>
                <p className="mt-2 text-sm text-(--lp-ink-500)">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Free sample                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Try it first</p>
          <h2 className="mt-3 max-w-[24ch] font-[family-name:var(--lp-font-display)] text-[clamp(24px,3vw,34px)] font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
            Two of the email templates are free, right now
          </h2>
          <p className="mt-3 max-w-[560px] text-sm text-(--lp-ink-500)">
            Asking a lecturer a question, and requesting an extension. Whole, no sign-in, nothing to
            pay. If they are useful, the other nine things are in the pack.
          </p>
          <Link
            href="/campus/academic-email"
            className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-(--lp-ink-900) underline decoration-(--lp-orange-500) underline-offset-4 hover:text-(--lp-orange-600)"
          >
            Read the free sample
          </Link>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Sinhala summary                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section
          lang="si"
          className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}
        >
          <p className={EYEBROW}>සිංහලෙන්</p>
          <h2 className="mt-3 max-w-[26ch] font-[family-name:var(--lp-font-display)] text-[clamp(22px,2.8vw,32px)] font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
            Campus එකේ පළවෙනි assignment එකට ඕන කරන ඔක්කොම
          </h2>
          <div className="mt-4 max-w-[620px] space-y-3 text-[15px] leading-relaxed text-(--lp-ink-500)">
            <p>
              Files හතක් සහ guides හතරක්. Automatic contents page එකක් හදන Word assignment template
              එකක්, ඇත්ත Sri Lankan sources එක්ක APA සහ Harvard referencing guide එකක්, Google Colab
              එකේ open වෙන Python notebook එකක්, Zotero library එකක්, සහ lecturer කෙනෙකුට email එකක්
              ලියන හැටි.
            </p>
            <p>
              Guides සිංහලෙන් සහ English දෙකෙන්ම කියවන්න පුළුවන්. Phone එකෙන් guides කියවන්න
              පුළුවන්; Word සහ Excel files වලට laptop එකක් හරි Office mobile apps හරි ඕන.
            </p>
            <p>
              {fee} — එක ගෙවීමක්. අවුරුදු තුනක් ඔයාගේ. කිසිම university එකකින් accredited නෑ; මේක
              certificate එකක් නෙවෙයි, වැඩේ ලේසි කරන files ටිකක්.
            </p>
          </div>
          <Link
            href={`/packs/${SURVIVAL_PACK.id}`}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-(--lp-orange-500) px-6 text-base font-semibold text-white shadow-[var(--lp-shadow-brand)] hover:bg-(--lp-orange-600) hover:text-white"
          >
            {paused ? "ඇතුළේ මොනවද කියලා බලන්න" : `Pack එක ගන්න — ${fee}`}
          </Link>
        </section>

        <CrossPromoBand
          eyebrow="Included free"
          title="Every Campus Ready seat comes with this pack"
          body="Campus Ready is the 12-week programme for the gap between A/Ls and university — Word, Excel, Python, statistics, Power BI and referencing, with a graded certificate. The Survival Pack is included in the fee."
          href="/campus-ready"
          cta="See Campus Ready"
          mark={<CampusReadyMark />}
        />

        {/* ---------------------------------------------------------------- */}
        {/* FAQ                                                               */}
        {/* ---------------------------------------------------------------- */}
        <section className={`${CONTAINER} border-t border-(--lp-border-subtle) py-[clamp(40px,6vw,72px)]`}>
          <p className={EYEBROW}>Questions</p>
          <h2 className="mt-3 mb-8 font-[family-name:var(--lp-font-display)] text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.02em] text-(--lp-ink-900)">
            The awkward ones first
          </h2>
          <FaqAccordion items={FAQS} />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                            */}
        {/* ---------------------------------------------------------------- */}
        <footer className={`${CONTAINER} border-t border-(--lp-border-subtle) py-10`}>
          <p className="max-w-[640px] text-sm text-(--lp-ink-500)">{AI_NOTE.en}</p>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-(--lp-ink-500)">
            <Link href="/terms" className="hover:text-(--lp-orange-600)">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-(--lp-orange-600)">
              Privacy
            </Link>
            <Link href="/refund-policy" className="hover:text-(--lp-orange-600)">
              Refunds
            </Link>
            <Link href="/campus-ready" className="hover:text-(--lp-orange-600)">
              Campus Ready
            </Link>
            <Link href="/" className="hover:text-(--lp-orange-600)">
              ICT Campus
            </Link>
          </nav>
        </footer>
      </main>
    </>
  );
}
