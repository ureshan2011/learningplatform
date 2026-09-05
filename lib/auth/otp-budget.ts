/**
 * How often one phone number may be sent a code, remembered across page loads.
 *
 * The per-page-load counter this replaces was trivially reset: a student whose
 * SMS had not arrived reloaded the page and sent again, three or four times in
 * a minute, until Firebase itself refused with `too-many-requests` and locked
 * the number for far longer than any limit of ours would have. Every one of
 * those attempts is also a billed SMS. Keying the budget to the number and
 * holding it in localStorage, rather than to the tab, is what makes the limit
 * real.
 *
 * This is a courtesy to the student, not a security control — localStorage is
 * per-browser and can be cleared. The real limit is Firebase's; the whole point
 * of this one is that they never reach it.
 */

const KEY_PREFIX = "ictclass_otp_";

/**
 * The gap after the 1st, 2nd, 3rd and any later send to one number.
 *
 * It escalates rather than cutting off, because a hard lockout punishes exactly
 * the student the SMS genuinely failed to reach. By the fourth attempt another
 * code is not the answer, and the wait says so.
 */
const BACKOFF_SECONDS = [45, 120, 300, 900];

/** Quiet time after which a number starts over from the first, shortest gap. */
const RESET_AFTER_MS = 15 * 60_000;

/** How long to sit out once Firebase itself has said `too-many-requests`. */
const RATE_LIMITED_SECONDS = 300;

/** The send count at which a rate limit lands, so the next gap is a long one. */
const RATE_LIMITED_SENDS = 3;

interface Budget {
  /** Sends to this number inside the current run. */
  sends: number;
  /** When the last one went out. */
  lastSendAt: number;
  /** Epoch ms before which the next send is refused. */
  nextAllowedAt: number;
}

const FRESH: Budget = { sends: 0, lastSendAt: 0, nextAllowedAt: 0 };

function read(e164: string): Budget {
  if (typeof window === "undefined") return { ...FRESH };
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + e164);
    if (!raw) return { ...FRESH };
    const saved = JSON.parse(raw) as Partial<Budget>;
    const budget: Budget = {
      sends: Number(saved.sends) || 0,
      lastSendAt: Number(saved.lastSendAt) || 0,
      nextAllowedAt: Number(saved.nextAllowedAt) || 0,
    };
    // Long enough since the last attempt that whatever went wrong has passed.
    if (Date.now() - budget.lastSendAt > RESET_AFTER_MS) return { ...FRESH };
    return budget;
  } catch {
    // A private window, or a browser set to block site data. No budget is a far
    // better outcome than no sign-in page.
    return { ...FRESH };
  }
}

function write(e164: string, budget: Budget): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + e164, JSON.stringify(budget));
  } catch {
    // Storage full or blocked. The in-page countdown still holds for this load.
  }
}

/** Seconds until this number may be sent another code. Zero means now. */
export function cooldownSeconds(e164: string): number {
  const { nextAllowedAt } = read(e164);
  return Math.max(0, Math.ceil((nextAllowedAt - Date.now()) / 1000));
}

/** Records a code that actually went out, and sets the next gap. */
export function recordSend(e164: string): void {
  const now = Date.now();
  const sends = read(e164).sends + 1;
  const gap = BACKOFF_SECONDS[Math.min(sends, BACKOFF_SECONDS.length) - 1];
  write(e164, { sends, lastSendAt: now, nextAllowedAt: now + gap * 1000 });
}

/**
 * Records Firebase's own `too-many-requests`. Sitting out five minutes is the
 * only thing that clears it, so the button says that instead of inviting a
 * retry that cannot succeed.
 */
export function recordRateLimit(e164: string): void {
  const now = Date.now();
  write(e164, {
    sends: Math.max(read(e164).sends, RATE_LIMITED_SENDS),
    lastSendAt: now,
    nextAllowedAt: now + RATE_LIMITED_SECONDS * 1000,
  });
}

/** A wait a 16-year-old can read at a glance, in both languages' shared digits. */
export function formatWait(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  }
  return `${seconds}s`;
}
