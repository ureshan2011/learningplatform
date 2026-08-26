import Image from "next/image";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import type { Subject } from "@/lib/types";

const FEATURES = [
  {
    title: "සජීවී පන්ති",
    body: "පන්තිය පටන්ගන්නා මොහොතේම ඔබේ දුරකථනයෙන්ම සම්බන්ධ වෙන්න.",
    icon: (
      <path
        d="M4 17V7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm13-7 4-3v10l-4-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "ක්ෂණික ප්‍රශ්නාවලි",
    body: "සජීවීව උත්තර දෙන්න, දිවයින පුරාම ලීඩර්බෝඩ් එකෙන් ඔබේ ස්ථානය ක්ෂණිකව බලන්න.",
    icon: (
      <path
        d="m5 13 4 4L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "පසුගිය ප්‍රශ්න පත්‍ර",
    body: "පන්තිය ඉවර වූ සැණින්ම නෝට්ස් සහ ප්‍රශ්න පත්‍ර බාගත කරගන්න.",
    icon: (
      <path
        d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
] as const;

// Displayed on the teacher-credibility card. Kept as plain strings rather
// than a component so the Sinhala copy is easy to proofread and edit later
// without touching JSX structure.
const CREDENTIALS = [
  "PhD — කැන්ටබරි විශ්වවිද්‍යාලය, නවසීලන්තය",
  "හිටපු කථිකාචාර්ය — මොරටුව විශ්වවිද්‍යාලය",
  "ශ්‍රී ලංකාවේ ජාතික MOOC වේදිකාව ගොඩනැගීම — ශිෂ්‍යයන් 150,000+",
  "ජ්‍යෙෂ්ඨ කථිකාචාර්ය — නවසීලන්තය (වර්තමානයේ)",
] as const;

// The landing page is the top of the acquisition funnel and must be indexable,
// so it renders on the server with no auth requirement.
export const revalidate = 300;

export default async function LandingPage() {
  const [user, subjects] = await Promise.all([
    getSessionUser().catch(() => null),
    listSubjects().catch(() => [] as Subject[]),
  ]);

  return (
    <main
      lang="si"
      className="si relative min-h-screen overflow-hidden bg-(--color-awaken-bg) text-(--color-awaken-ink)"
    >
      {/* Decorative gradient blobs. Pure CSS, no images — cheap on slow links. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="awaken-blob absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-awaken-accent), transparent 70%)" }}
        />
        <div
          className="awaken-blob absolute top-40 -left-32 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--color-awaken-rose), transparent 70%)",
            animationDelay: "-7s",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-14">
        <header className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">
            ICT<span className="text-(--color-awaken-accent)">Class</span>
          </span>
          <Link
            href={user ? "/dashboard" : "/signin"}
            className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) px-4 py-2 text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-(--color-awaken-accent)/40"
          >
            {user ? "මගේ ඩෑෂ්බෝඩ්" : "ඇතුල් වෙන්න"}
          </Link>
        </header>

        <section className="awaken-rise mt-16 max-w-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.2] tracking-tight sm:text-5xl">
            සජීවී O/L සහ A/L ICT පන්ති.
            <span className="block bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) bg-clip-text text-transparent">
              සිංහල මාධ්‍යයෙන්.
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-(--color-awaken-ink-soft)">
            ඔබේ දුරකථනයෙන්ම සජීවී පන්තිවලට සම්බන්ධ වෙන්න, පන්තිය අතරතුරදීම ක්ෂණික
            ප්‍රශ්නාවලිවලට උත්තර දෙන්න, මුළු දිවයිනේම ලීඩර්බෝඩ් එකේ ඔබේ ස්ථානය බලන්න,
            සහ පන්තිය ඉවර වූ සැණින්ම පසුගිය ප්‍රශ්න පත්‍ර බාගත කරගන්න.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="rounded-xl bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(234,88,12,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              පන්තියකට එකතු වෙන්න
            </Link>
            <Link
              href="/notes"
              className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) px-6 py-3 font-medium transition-colors hover:border-(--color-awaken-accent)/40"
            >
              නොමිලේ නෝට්ස් සහ ප්‍රශ්න පත්‍ර
            </Link>
          </div>
        </section>

        <section
          className="awaken-rise mt-14 grid gap-4 sm:grid-cols-3"
          style={{ animationDelay: "0.1s" }}
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6 text-(--color-awaken-accent)"
              >
                {feature.icon}
              </svg>
              <p className="mt-3 font-semibold">{feature.title}</p>
              <p className="mt-1 text-sm text-(--color-awaken-ink-soft)">{feature.body}</p>
            </div>
          ))}
        </section>

        {/*
          Teacher credibility card. A solo tuition platform is trusted through
          the one person running it, not a brand — so the teacher's face and
          real credentials go on the landing page itself, not a buried /about
          route. Sri-Lanka-relevant lines (Moratuwa, the national MOOC) are
          ordered ahead of the NZ postdoc line: parents recognise those first.
        */}
        <section className="awaken-rise mt-16" style={{ animationDelay: "0.15s" }}>
          <div className="rounded-3xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
            <div className="grid gap-6 sm:grid-cols-[11rem_1fr] sm:items-start">
              <div className="mx-auto w-32 shrink-0 sm:mx-0 sm:w-full">
                <Image
                  src="/images/dr-yasas.png"
                  alt="ආචාර්ය යසස් වික්‍රමසිංහ"
                  width={881}
                  height={1241}
                  className="h-auto w-full rounded-2xl"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-(--color-awaken-accent)">
                  ඔබේ ගුරුවරයා
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
                  ආචාර්ය යසස් වික්‍රමසිංහ
                </h2>
                <p className="mt-0.5 text-sm text-(--color-awaken-ink-soft)" lang="en">
                  PhD, Human Interface Technology — University of Canterbury, NZ
                </p>
                <p className="mt-4 leading-relaxed text-(--color-awaken-ink-soft)">
                  ආචාර්ය යසස් වික්‍රමසිංහ මීට පෙර මොරටුව විශ්වවිද්‍යාලයේ Software
                  Engineering කථිකාචාර්යවරයෙකු ලෙසත්, ශ්‍රී ලංකාවේ ප්‍රථම ජාතික MOOC
                  වේදිකාවේ (open.uom.lk) ව්‍යාපෘති ප්‍රධානියා ලෙසත් සේවය කර, එය ශිෂ්‍යයන්
                  150,000කට වඩා වැඩි පිරිසක් දක්වා පුළුල් කළා. දැනට නවසීලන්තයේ
                  කැන්ටබරි විශ්වවිද්‍යාලයේ පශ්චාත් ආචාර්ය පර්යේෂකයෙකු සහ Yoobee
                  විද්‍යාලයේ ජ්‍යෙෂ්ඨ කථිකාචාර්යවරයෙකු ලෙස කටයුතු කරනවා.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {CREDENTIALS.map((credential) => (
                    <span
                      key={credential}
                      className="rounded-full bg-(--color-awaken-accent-soft) px-3 py-1 text-xs font-semibold text-(--color-awaken-accent)"
                    >
                      {credential}
                    </span>
                  ))}
                </div>
                <a
                  href="https://www.linkedin.com/in/yasassri"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block text-sm font-semibold text-(--color-awaken-accent) hover:underline"
                >
                  සම්පූර්ණ CV / LinkedIn බලන්න →
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            පන්ති
          </h2>
          {subjects.length === 0 ? (
            <p className="mt-4 text-sm text-(--color-awaken-ink-soft)">
              පන්ති සකසමින් පවතී. මඳ වේලාවකින් නැවත පරීක්ෂා කරන්න.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="rounded-2xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{subject.name}</h3>
                    <span className="shrink-0 rounded-full bg-(--color-awaken-accent-soft) px-2.5 py-0.5 text-xs font-semibold text-(--color-awaken-accent)">
                      {subject.grade === "AL" ? "A/L" : "O/L"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
                    {subject.description}
                  </p>
                  <p className="mt-4 font-semibold text-(--color-awaken-accent)">
                    {formatLKR(subject.priceLKR)}
                    <span className="text-sm font-normal text-(--color-awaken-ink-soft)">
                      {" "}
                      / මාසයට
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
