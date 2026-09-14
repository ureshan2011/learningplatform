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

export function OrderBuilder({
  candidates,
  initial,
  orderRuleUnstated,
  sourceQuote,
}: {
  candidates: OrderCandidate[];
  initial: string[];
  /** True where the handbook does not state how the UGC reads the list. */
  orderRuleUnstated: boolean;
  /** What the handbook does say about preferences, quoted. */
  sourceQuote?: string;
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
      setError("Could not save your order just now. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card radius="panel" className="mt-4 p-5 sm:p-6">
      <p className="font-display text-lg font-extrabold tracking-[-0.02em] text-ict-paper-50">
        Your application order
      </p>
      <p className="mt-1 text-sm text-ict-ink-300">
        Put them in the order you would write them on the form. The number beside each one is the
        chance you end up with that course rather than something above it.
      </p>

      {chosen.length === 0 ? (
        <p className="mt-4 text-sm text-ict-ink-400">
          Nothing added yet. Start with the ones you actually want, not the ones you are most
          likely to get — the order is what decides between them.
        </p>
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
                  aria-label={`Move ${c.course} up`}
                  className="grid size-8 place-items-center rounded-full border border-ict-border-dark text-ict-ink-200 disabled:opacity-40"
                >
                  <Icon name="expand_less" className="!text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === chosen.length - 1}
                  aria-label={`Move ${c.course} down`}
                  className="grid size-8 place-items-center rounded-full border border-ict-border-dark text-ict-ink-200 disabled:opacity-40"
                >
                  <Icon name="expand_more" className="!text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => change(order.filter((k) => k !== c.key))}
                  aria-label={`Remove ${c.course}`}
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
          <Badge tone={nothing > 50 ? "warning" : "neutral"}>
            Nothing from this list: {nothing}%
          </Badge>
          <Badge tone="neutral">{chosen.length} of {MAX_PREFERENCES}</Badge>
        </p>
      ) : null}

      {order.length < MAX_PREFERENCES && available.length > 0 ? (
        <label className="ict-print-hide mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-ict-ink-300">Add a course</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) change([...order, e.target.value]);
            }}
            className="h-12 w-full rounded-full border border-ict-border-dark bg-ict-ink-800 px-4 text-base text-ict-paper-50 outline-none focus:border-ict-orange-500"
          >
            <option value="">Choose</option>
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
          {busy ? "Saving" : saved ? "Saved" : "Save my order"}
        </Button>
      </div>

      {/* The one assumption on this screen that the published handbook does not
          carry. Said here rather than in a footnote: a student reading 92%
          deserves to know what it rests on. */}
      <p className="mt-5 text-xs leading-relaxed text-ict-ink-400">
        {orderRuleUnstated
          ? "The published part of the handbook does not say how the UGC works down an ordered list. These numbers assume it gives you the first course on your list that you clear. Read them as a comparison between two orders, not as a prediction of the result."
          : "These numbers assume the UGC gives you the first course on your list that you clear."}{" "}
        They also treat each course as independent, which overstates certainty a little, because a
        year that pushes one cut-off up usually pushes others up with it.
      </p>
      {sourceQuote ? (
        <p className="mt-2 text-xs leading-relaxed text-ict-ink-400">
          What the handbook does say: &ldquo;{sourceQuote}&rdquo;
        </p>
      ) : null}
    </Card>
  );
}
