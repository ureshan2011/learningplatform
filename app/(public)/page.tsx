import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import type { Subject } from "@/lib/types";

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
    icon: <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />,
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
    <main className="relative min-h-dvh overflow-hidden">
      {/* Decorative gradient blobs. Pure CSS, no images — cheap on slow links,
          and pinned behind everything so they never intercept a tap. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="drift absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-brand), transparent 70%)" }}
        />
        <div
          className="drift absolute top-52 -left-32 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent 70%)", animationDelay: "-8s" }}
        />
      </div>

      <div className="material-nav pt-safe sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-title text-lg">
            ICT<span className="text-(--color-brand)">Class</span>
          </span>
          <Link href={user ? "/dashboard" : "/signin"} className="btn btn-secondary btn-sm">
            {user ? "My dashboard" : "Sign in"}
          </Link>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <section className="rise-in max-w-2xl">
          <h1 className="text-display text-4xl sm:text-6xl">
            O/L &amp; A/L ICT, taught live.
            <span className="block bg-gradient-to-r from-(--color-brand) to-(--color-brand-deep) bg-clip-text text-transparent">
              Sinhala medium.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-(--color-text-muted)">
            Live classes you join from your phone, instant quizzes during the lesson, a
            leaderboard against the whole island, and past papers you can download the moment
            class ends.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signin" className="btn btn-primary">
              Join a class
            </Link>
            <Link href="/notes" className="btn btn-secondary">
              Free notes &amp; past papers
            </Link>
          </div>
        </section>

        <section className="rise-in mt-14 grid gap-4 sm:grid-cols-3" style={{ animationDelay: "0.08s" }}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className="surface surface-interactive p-5">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6 text-(--color-brand)"
              >
                {feature.icon}
              </svg>
              <p className="mt-3 font-semibold">{feature.title}</p>
              <p className="mt-1 text-sm text-(--color-text-muted)">{feature.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20">
          <h2 className="text-title text-xl">Classes</h2>
          {subjects.length === 0 ? (
            <p className="mt-4 text-sm text-(--color-text-muted)">
              Classes are being set up. Check back shortly.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {subjects.map((subject) => (
                <li key={subject.id} className="surface surface-interactive p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{subject.name}</h3>
                    <span className="chip bg-(--color-brand)/15 text-(--color-brand)">
                      {subject.grade === "AL" ? "A/L" : "O/L"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-(--color-text-muted)">{subject.description}</p>
                  <p className="mt-4 font-semibold text-(--color-brand)">
                    {formatLKR(subject.priceLKR)}
                    <span className="text-sm font-normal text-(--color-text-muted)"> / month</span>
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
