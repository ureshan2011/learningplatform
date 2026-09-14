"use client";

import { useMemo, useState } from "react";
import { fetchWithSession } from "@/lib/auth/session-client";
import { noOfferChance, preferenceOutcomes } from "@/lib/campus-match/forecast";
import { Badge, Button, Card, Notice } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";

/**
 * The application-order builder.
 *
 * The second thing worth paying for, after the bands: a student can see two
 * orders side by side and read what each is likely to return, instead of
 * arguing about it at home with nothing but a rumour.
 *
 * The arithmetic is `preferenceOutcomes`, run here on the chances the server
 * already computed. No cut-off data reaches the browser — these rows are the
 * finished numbers.
 */

export interface OrderCandidate {
  key: string;
  course: string;
  university: string;
  chance: number;
}

/** As many as the screen can hold honestly; the form's own limit is unpublished. */
const MAX_PREFERENCES = 15;

/**
 * Every label arrives as a finished string, and the ones with a number or a
 * course name in them arrive as templates carrying `{pct}`, `{course}` and so
 * on. They cannot arrive as functions: this is a Client Component, and React
 * will not serialise a function across that boundary — it throws while
 * rendering the page, which is exactly how this went out broken once.
 */
export interface OrderLabels {
  title: string;
  intro: string;
  empty: string;
  /** Carries `{pct}`. */
  nothing: string;
  /** Carries `{n}` and `{max}`. */
  count: string;
  add: string;
  choose: string;
  save: string;
  saved: string;
  saving: string;
  error: string;
  /** Said when the handbook does not carry the rule these numbers assume. */
  unstated: string;
  /** Said when it does. */
  assumed: string;
  independence: string;
  /** Carries `{text}`. */
  quote: string;
  /** These three carry `{course}`. */
  up: string;
  down: string;
  remove: string;
}

/** The browser half of `interpolate` — same placeholders, same behaviour. */
function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function OrderBuilder({
  candidates,
  initial,
  orderRuleUnstated,
  sourceQuote,
  labels,
}: {
  candidates: OrderCandidate[];
  initial: string[];
  /** True where the handbook does not state how the UGC reads the list. */
  orderRuleUnstated: boolean;
  /** What the handbook does say about preferences, quoted. */
  sourceQuote?: string;
  /** The dictionary never reaches the browser, so the strings arrive as props. */
  labels: OrderLabels;
}) {
  const byKey = useMemo(() => new Map(candidates.map((c) => [c.key, c])), [candidates]);
  const [order, setOrder] = useState<string[]>(() => initial.filter((k) => byKey.has(k)));
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = order.map((k) => byKey.get(k)).filter((c): c is OrderCandidate => Boolean(c));
  const outcomes = preferenceOutcomes(chosen.map((c) => c.chance));
  const nothing = noOfferChance(chosen.map((c) => c.chance));

  const available = candidates.filter((c) => !order.includes(c.key));

  function change(next: string[]) {
    setOrder(next);
    setSaved(false);
    setError(null);
  }

  function move(index: number, by: number) {
    const next = [...order];
    const to = index + by;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    change(next);
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/campus-match/inputs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preferences: order }),
      });
      if (!res.ok) throw new Error("failed");
      setSaved(true);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card radius="panel" className="mt-4 p-5 sm:p-6">
      <p className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
        {labels.title}
      </p>
      <p className="mt-1 text-sm text-ict-ink-300">{labels.intro}</p>

      {chosen.length === 0 ? (
        <p className="mt-4 text-sm text-ict-ink-400">{labels.empty}</p>
      ) : (
        <ol className="mt-4">
          {chosen.map((c, i) => (
            <li
              key={c.key}
              className="flex items-center gap-3 border-t border-ict-border-dark py-3 first:border-t-0"
            >
              <span className="w-6 shrink-0 text-sm font-bold tabular-nums text-ict-ink-300">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ict-paper-50">{c.course}</p>
                {c.university ? (
                  <p className="mt-0.5 truncate text-xs text-ict-ink-300">{c.university}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ict-paper-50">
                {outcomes[i].landing}%
              </span>
              <span className="ict-print-hide flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={fill(labels.up, { course: c.course })}
                  className="grid size-8 place-items-center rounded-full border border-ict-border-dark text-ict-ink-200 disabled:opacity-40"
                >
                  <Icon name="expand_less" className="!text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === chosen.length - 1}
                  aria-label={fill(labels.down, { course: c.course })}
                  className="grid size-8 place-items-center rounded-full border border-ict-border-dark text-ict-ink-200 disabled:opacity-40"
                >
                  <Icon name="expand_more" className="!text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => change(order.filter((k) => k !== c.key))}
                  aria-label={fill(labels.remove, { course: c.course })}
                  className="grid size-8 place-items-center rounded-full border border-ict-border-dark text-ict-ink-200"
                >
                  <Icon name="close" className="!text-sm" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {chosen.length > 0 ? (
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={nothing > 50 ? "warning" : "neutral"}>{fill(labels.nothing, { pct: nothing })}</Badge>
          <Badge tone="neutral">{fill(labels.count, { n: chosen.length, max: MAX_PREFERENCES })}</Badge>
        </p>
      ) : null}

      {order.length < MAX_PREFERENCES && available.length > 0 ? (
        <label className="ict-print-hide mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ict-ink-300">{labels.add}</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) change([...order, e.target.value]);
            }}
            className="h-12 w-full rounded-full border border-ict-border-dark bg-ict-ink-800 px-4 text-base text-ict-paper-50 outline-none focus:border-ict-orange-500"
          >
            <option value="">{labels.choose}</option>
            {available.map((c) => (
              <option key={c.key} value={c.key}>
                {c.course}
                {c.university ? ` — ${c.university}` : ""} ({c.chance}%)
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? (
        <div className="mt-4">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}

      <div className="ict-print-hide mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={saved || busy} variant="secondary">
          {busy ? labels.saving : saved ? labels.saved : labels.save}
        </Button>
      </div>

      {/* The one assumption on this screen that the published handbook does not
          carry. Said here rather than in a footnote: a student reading 92%
          deserves to know what it rests on. */}
      <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">
        {orderRuleUnstated ? labels.unstated : labels.assumed} {labels.independence}
      </p>
      {sourceQuote ? (
        <p className="mt-2 text-xs leading-relaxed text-ict-ink-400">{fill(labels.quote, { text: sourceQuote })}</p>
      ) : null}
    </Card>
  );
}
