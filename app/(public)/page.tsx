import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import type { Subject } from "@/lib/types";

// Self-hosted by Next at build time (no runtime request to Google), so this
// costs nothing extra on a slow connection. Two weights only, kept small.
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

const FEATURES = [
  {
    title: "Live classes",
    body: "Join from your phone the moment class starts.",
    icon: (
      <path
        d="M4 17V7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm13-7 4-3v10l-4-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Instant quizzes",
    body: "Answer live, see the island-wide leaderboard right after.",
    icon: (
      <path
        d="m5 13 4 4L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Past papers",
    body: "Download notes and papers the moment class ends.",
    icon: (
      <path
        d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
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
      className={`${display.variable} relative min-h-screen overflow-hidden bg-(--color-awaken-bg) text-(--color-awaken-ink)`}
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
            {user ? "My dashboard" : "Sign in"}
          </Link>
        </header>

        <section className="awaken-rise mt-16 max-w-2xl">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            O/L &amp; A/L ICT, taught live.
            <span className="block bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) bg-clip-text text-transparent">
              Sinhala medium.
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-(--color-awaken-ink-soft)">
            Live classes you join from your phone, instant quizzes during the lesson, a
            leaderboard against the whole island, and past papers you can download the
            moment class ends.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="rounded-xl bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(234,88,12,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Join a class
            </Link>
            <Link
              href="/notes"
              className="rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) px-6 py-3 font-medium transition-colors hover:border-(--color-awaken-accent)/40"
            >
              Free notes &amp; past papers
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

        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            Classes
          </h2>
          {subjects.length === 0 ? (
            <p className="mt-4 text-sm text-(--color-awaken-ink-soft)">
              Classes are being set up. Check back shortly.
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
                      / month
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
