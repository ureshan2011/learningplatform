"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isMainActivity } from "@/lib/activity/policy";

/**
 * Records the study actions this student took.
 *
 * Not every page they opened: `isMainActivity` drops the dashboard, the
 * account screen, the syllabus and every free resource page before anything
 * is buffered, so a student who spends an evening reading notes costs nothing
 * at all. See `lib/activity/policy.ts` for what is kept and why.
 *
 * Mounted only for a student — the layouts decide that, and the route checks
 * the role again before it writes anything.
 *
 * Buffers in memory and flushes on a timer, when the tab is hidden, and when
 * the page goes away. That batching is the point: a page view is the most
 * frequent event on the platform, and one Firestore write each would be the
 * largest bill on it (see lib/activity/record.ts and the cost rules in
 * docs/PLAN.md).
 *
 * `sendBeacon` for the closing flush — a `fetch` started during `pagehide` is
 * cancelled with the page, which is precisely when the last and most
 * interesting page of a session would be lost.
 *
 * Renders nothing. Mounted once per layout, not per page, so navigating does
 * not remount it and lose the buffer.
 *
 * Plain `fetch`, not `fetchWithSession`, which is the one place that rule is
 * deliberately not followed. `fetchWithSession` exists so a lapsed session
 * cannot throw away work a student has done; a page view is not work, and
 * having a fire-and-forget beacon trigger session-repair traffic — possibly
 * while the tab is closing — would cost more than the row it is saving. The
 * route answers 204 rather than 401 for the same reason.
 */

/**
 * Long enough that a whole study session usually costs one write, short enough
 * to survive a crash.
 *
 * Raised from 30s once ordinary page views stopped being logged. Study actions
 * are minutes apart, not seconds, so a 30-second window flushed each one on its
 * own and turned a batching mechanism into one-write-per-event. The tab-hidden
 * and page-hide flushes are what actually bound the loss, not this timer.
 */
const FLUSH_MS = 3 * 60_000;

/** Matches the route's own cap. A buffer at this size flushes immediately. */
const MAX_BUFFER = 40;

const ENDPOINT = "/api/activity";

export function ActivityRecorder() {
  const pathname = usePathname();
  const buffer = useRef<{ path: string; at: number }[]>([]);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // A re-render on the same route is not a visit. Without this, a page that
    // updates search params or refreshes logs the same line repeatedly.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    // Browsing is not studying. Dropped here rather than at the route, so an
    // evening of reading notes sends no request at all.
    if (!isMainActivity(pathname)) return;

    buffer.current.push({ path: pathname, at: Date.now() });
    if (buffer.current.length >= MAX_BUFFER) flush(buffer.current.splice(0));
  }, [pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (buffer.current.length > 0) flush(buffer.current.splice(0));
    }, FLUSH_MS);

    // `pagehide` rather than `unload`: `unload` is not fired on iOS Safari at
    // all, which is a large share of this audience, and it blocks the back /
    // forward cache on every browser that does fire it.
    const send = () => {
      if (buffer.current.length > 0) flush(buffer.current.splice(0), true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") send();
    };

    window.addEventListener("pagehide", send);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", send);
      document.removeEventListener("visibilitychange", onVisibility);
      send();
    };
  }, []);

  return null;
}

function flush(events: { path: string; at: number }[], closing = false) {
  if (events.length === 0) return;
  const body = JSON.stringify({ events });

  if (closing && typeof navigator.sendBeacon === "function") {
    // A Blob rather than a raw string, so the request carries a JSON content
    // type; sendBeacon sends text/plain otherwise and the route rejects it.
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Offline, or the session lapsed. A lost page view is not worth a retry
    // queue, and never worth showing a student an error about.
  });
}
