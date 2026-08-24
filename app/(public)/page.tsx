import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { formatLKR } from "@/lib/format";
import type { Subject } from "@/lib/types";

// The landing page is the top of the acquisition funnel and must be indexable,
// so it renders on the server with no auth requirement.
export const revalidate = 300;

export default async function LandingPage() {
  const [user, subjects] = await Promise.all([
    getSessionUser().catch(() => null),
    listSubjects().catch(() => [] as Subject[]),
  ]);

  return (
    <main className="min-h-screen bg-[--color-awaken-bg] text-[--color-awaken-ink]">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <header className="flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight">
            ICT<span className="text-[--color-awaken-accent]">Class</span>
          </span>
          <Link
            href={user ? "/dashboard" : "/signin"}
            className="rounded-xl border border-[--color-awaken-line] bg-[--color-awaken-card] px-4 py-2 text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors hover:border-[--color-awaken-accent]/40"
          >
            {user ? "My dashboard" : "Sign in"}
          </Link>
        </header>

        <section className="mt-16 max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            O/L &amp; A/L ICT, taught live.
            <span className="block text-[--color-awaken-accent]">Sinhala medium.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[--color-awaken-ink-soft]">
            Live classes you join from your phone, instant quizzes during the lesson, a
            leaderboard against the whole island, and past papers you can download the
            moment class ends.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="rounded-xl bg-[--color-awaken-accent] px-6 py-3 font-semibold text-white shadow-[0_1px_3px_rgba(234,88,12,0.3)] transition-transform active:scale-[0.98]"
            >
              Join a class
            </Link>
            <Link
              href="/notes"
              className="rounded-xl border border-[--color-awaken-line] bg-[--color-awaken-card] px-6 py-3 font-medium transition-colors hover:border-[--color-awaken-accent]/40"
            >
              Free notes &amp; past papers
            </Link>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-xl font-bold tracking-tight">Classes</h2>
          {subjects.length === 0 ? (
            <p className="mt-4 text-sm text-[--color-awaken-ink-soft]">
              Classes are being set up. Check back shortly.
            </p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="rounded-2xl border border-[--color-awaken-line] bg-[--color-awaken-card] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{subject.name}</h3>
                    <span className="shrink-0 rounded-full bg-[--color-awaken-deep] px-2.5 py-0.5 text-xs font-semibold text-white">
                      {subject.grade === "AL" ? "A/L" : "O/L"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[--color-awaken-ink-soft]">
                    {subject.description}
                  </p>
                  <p className="mt-4 font-semibold text-[--color-awaken-accent]">
                    {formatLKR(subject.priceLKR)}
                    <span className="text-sm font-normal text-[--color-awaken-ink-soft]">
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
