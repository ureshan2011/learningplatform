/** Sri Lanka is UTC+5:30 year-round — no daylight saving to handle. */
export const COLOMBO_TZ = "Asia/Colombo";

export function formatSessionTime(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

/** Calendar day in Colombo time, as `YYYY-MM-DD` — the unit streaks are counted in. */
export function colomboDateString(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: COLOMBO_TZ }).format(new Date(ms));
}

export function formatDate(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatLKR(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK")}`;
}

/** "in 2 days", "starts in 12 min", "live now" — the timetable's most-read field. */
export function relativeToNow(ms: number, now = Date.now()): string {
  const diff = ms - now;
  const mins = Math.round(diff / 60000);
  if (mins <= 0 && mins > -180) return "live now";
  if (mins < 60) return `starts in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `starts in ${hours} h`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}
