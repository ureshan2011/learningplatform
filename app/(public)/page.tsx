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
    <main className="mx-auto max-w-5xl px-5 py-14">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold">
          ICT<span className="text-[--color-brand]">Class</span>
        </span>
        <Link
          href={user ? "/dashboard" : "/signin"}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium"
        >
          {user ? "My dashboard" : "Sign in"}
        </Link>
      </header>

      <section className="mt-16 max-w-2xl">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          O/L &amp; A/L ICT, taught live.
          <span className="block text-[--color-brand]">Sinhala medium.</span>
        </h1>
        <p className="mt-5 text-lg text-white/70">
          Live classes you join from your phone, instant quizzes during the lesson, a
          leaderboard against the whole island, and past papers you can download the
          moment class ends.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signin"
            className="rounded-lg bg-[--color-brand] px-6 py-3 font-semibold text-black"
          >
            Join a class
          </Link>
          <Link href="/notes" className="rounded-lg border border-white/20 px-6 py-3 font-medium">
            Free notes &amp; past papers
          </Link>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-xl font-bold">Classes</h2>
        {subjects.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">
            Classes are being set up. Check back shortly.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {subjects.map((subject) => (
              <li
                key={subject.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">{subject.name}</h3>
                  <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-xs">
                    {subject.grade === "AL" ? "A/L" : "O/L"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/60">{subject.description}</p>
                <p className="mt-4 font-semibold text-[--color-brand]">
                  {formatLKR(subject.priceLKR)}
                  <span className="text-sm font-normal text-white/50"> / month</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
