"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatLKR } from "@/lib/format";
import { formatLocal } from "@/lib/phone";
import type { BoundDevice, Enrollment, HowHeardSource, Payment, Role } from "@/lib/types";
import { fetchWithSession } from "@/lib/auth/session-client";

interface DirectoryUser {
  uid: string;
  name: string;
  phone: string;
  role: Role;
  medium: string;
  school?: string;
  district?: string;
  referralCode: string;
  referredBy?: string;
  deviceCount: number;
  devices: { label: string; lastSeenAt: number }[];
  createdAt: number;
  lastSeenAt?: number;
  disabled: boolean;
  disabledReason?: string;
}

interface UserDetail {
  user: Omit<DirectoryUser, "devices"> & {
    devices: BoundDevice[];
    parentUid?: string;
    childUids: string[];
    referralRewarded: boolean;
    howHeard?: HowHeardSource;
    howHeardOther?: string;
    lastDeviceSwapAt?: number;
    disabledAt?: number;
    roleUpdatedBy?: string;
    roleUpdatedAt?: number;
  };
  enrollments: Enrollment[];
  payments: Payment[];
  totalPaidLKR: number;
  /** Newest day first, newest event first. Described on the server. */
  activity: ActivityDayView[];
  activitySummary: ActivitySummaryView;
}

interface ActivityDayView {
  date: string;
  truncated: boolean;
  events: { at: number; kind: string; label: string; group: string; icon: IconName }[];
}

interface ActivitySummaryView {
  activeDays: number;
  studyActions: number;
  downloads: number;
  lastActiveAt: number | null;
  topAreas: { group: string; count: number }[];
  currentStreak: number;
}

const ROLE_TONE: Record<Role, "accent" | "neutral" | "success" | "warn"> = {
  admin: "accent",
  teacher: "success",
  parent: "warn",
  student: "neutral",
};

const ROLES: Role[] = ["student", "parent", "teacher", "admin"];

const HOW_HEARD_LABEL: Record<HowHeardSource, string> = {
  friend: "A friend / someone they know",
  youtube: "YouTube",
  social: "Facebook / Instagram / TikTok",
  messaging_group: "A Telegram / WhatsApp group",
  google: "Google Search",
  other: "Other",
};

/**
 * Teacher console → People.
 *
 * Every account on the platform, with everything the teacher might need to
 * answer a question about one: who they are, when they joined, whether they
 * have been back, what they are enrolled in, what they have paid, and which
 * devices are holding their slots. Before this, the console could only look a
 * single student up by phone number and show their devices — there was no way
 * to see the roll at all.
 *
 * Role changes and switching an account off are admin-only and the buttons are
 * simply absent for a teacher, rather than present and failing.
 */
export function UserDirectory({
  viewerRole,
  viewerUid,
  noAdminYet,
}: {
  viewerRole: Role;
  viewerUid: string;
  /** True while nobody holds the admin role — the window in which a teacher may appoint the first one. */
  noAdminYet: boolean;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openUid, setOpenUid] = useState<string | null>(null);

  const isAdmin = viewerRole === "admin";
  // While the admin seat is empty a teacher may fill it, and only that: the
  // API allows set_role -> admin and nothing else. Switching accounts off
  // stays admin-only throughout.
  const canSetRole = isAdmin || noAdminYet;

  const load = useCallback(async (q: string, filter: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (filter !== "all") params.set("role", filter);
      const res = await fetchWithSession(`/api/teacher/users?${params}`);
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setUsers(data.users ?? []);
      setTruncated(Boolean(data.truncated));
    } catch {
      setError("Could not load the list. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced so typing a phone number is one request, not ten.
  useEffect(() => {
    const id = setTimeout(() => void load(query, role), query ? 350 : 0);
    return () => clearTimeout(id);
  }, [query, role, load]);

  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 focus-within:border-(--color-awaken-accent)">
          <Icon name="search" className="!text-base text-(--color-awaken-ink-soft)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone, school or referral code"
            aria-label="Search people"
            className="w-full bg-transparent py-2.5 text-base outline-none"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <Icon name="close" className="!text-base text-(--color-awaken-ink-soft)" />
            </button>
          ) : null}
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "all" | Role)}
          aria-label="Filter by role"
          className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-sm outline-none focus:border-(--color-awaken-accent)"
        >
          <option value="all">Everyone</option>
          <option value="student">Students</option>
          <option value="parent">Parents</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <p className="mt-3 text-sm text-(--color-awaken-ink-soft)">
        {loading
          ? "Loading…"
          : `${users.length} ${users.length === 1 ? "person" : "people"}` +
            (counts.student ? ` · ${counts.student} student${counts.student === 1 ? "" : "s"}` : "") +
            (counts.admin ? ` · ${counts.admin} admin` : "")}
        {truncated ? " · showing the newest accounts only — search to find older ones" : ""}
      </p>

      {error ? (
        <p className="mt-3 rounded-lg bg-(--color-awaken-danger-soft) p-3 text-sm text-(--color-awaken-danger)">
          {error}
        </p>
      ) : null}

      {!loading && users.length === 0 && !error ? (
        <p className="mt-6 rounded-xl border border-dashed border-(--color-awaken-line) p-6 text-center text-sm text-(--color-awaken-ink-soft)">
          {query ? "Nobody matches that." : "No accounts yet."}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {users.map((user) => (
          <li
            key={user.uid}
            className="overflow-hidden rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <button
              onClick={() => setOpenUid((current) => (current === user.uid ? null : user.uid))}
              aria-expanded={openUid === user.uid}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-(--color-awaken-bg)"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--color-awaken-accent-soft) font-bold text-(--color-awaken-accent)">
                {user.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{user.name}</span>
                  {user.role !== "student" ? (
                    <StatusPill tone={ROLE_TONE[user.role]}>{user.role}</StatusPill>
                  ) : null}
                  {user.disabled ? <StatusPill tone="danger">switched off</StatusPill> : null}
                </span>
                <span className="mt-0.5 block truncate text-sm text-(--color-awaken-ink-soft)">
                  {formatLocal(user.phone)}
                  {user.school ? ` · ${user.school}` : ""}
                  {` · joined ${formatDate(user.createdAt)}`}
                </span>
              </span>
              <span className="hidden shrink-0 text-right text-xs text-(--color-awaken-ink-soft) sm:block">
                <span className="block">
                  {user.deviceCount} device{user.deviceCount === 1 ? "" : "s"}
                </span>
                <span className="block">
                  {user.lastSeenAt ? `seen ${formatDate(user.lastSeenAt)}` : "never signed in"}
                </span>
              </span>
              <Icon
                name={openUid === user.uid ? "chevron_left" : "expand_more"}
                className="shrink-0 text-(--color-awaken-ink-soft)"
              />
            </button>

            {openUid === user.uid ? (
              <UserPanel
                uid={user.uid}
                isAdmin={isAdmin}
                canSetRole={canSetRole}
                isSelf={user.uid === viewerUid}
                onChanged={() => void load(query, role)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The expanded row: everything about one person, and the actions on them. */
function UserPanel({
  uid,
  isAdmin,
  canSetRole,
  isSelf,
  onChanged,
}: {
  uid: string;
  isAdmin: boolean;
  canSetRole: boolean;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithSession(`/api/teacher/users/${uid}`);
      if (!res.ok) throw new Error("failed");
      setDetail(await res.json());
    } catch {
      setError("Could not load this person's details.");
    }
  }, [uid]);

  useEffect(() => {
    // Queued rather than called straight from the effect body: `load` sets
    // state, and doing that synchronously here cascades an extra render.
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  async function act(body: Record<string, unknown>, success: string) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetchWithSession(`/api/teacher/users/${uid}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "failed");
      setNote(success);
      await load();
      onChanged();
    } catch (err) {
      setError(ACTION_ERRORS[(err as Error).message] ?? "That did not work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !detail) {
    return <p className="border-t border-(--color-awaken-line) p-4 text-sm text-(--color-awaken-danger)">{error}</p>;
  }
  if (!detail) {
    return (
      <p className="border-t border-(--color-awaken-line) p-4 text-sm text-(--color-awaken-ink-soft)">
        Loading…
      </p>
    );
  }

  const { user, enrollments, payments, totalPaidLKR, activity, activitySummary } = detail;

  return (
    <div className="border-t border-(--color-awaken-line) bg-(--color-awaken-bg) p-4 text-sm">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <Row label="Phone" value={formatLocal(user.phone)} />
        <Row label="Role" value={user.role} />
        <Row label="Medium" value={user.medium} />
        <Row label="School" value={user.school || "—"} />
        <Row label="District" value={user.district || "—"} />
        <Row label="Joined" value={formatDate(user.createdAt)} />
        <Row label="Last seen" value={user.lastSeenAt ? formatDate(user.lastSeenAt) : "never"} />
        <Row label="Referral code" value={user.referralCode} />
        <Row label="Invited by" value={user.referredBy || "—"} />
        <Row
          label="How they heard about us"
          value={
            user.howHeard
              ? user.howHeard === "other" && user.howHeardOther
                ? `${HOW_HEARD_LABEL[user.howHeard]} — “${user.howHeardOther}”`
                : HOW_HEARD_LABEL[user.howHeard]
              : "Not answered"
          }
        />
        <Row label="Total paid" value={formatLKR(totalPaidLKR)} />
        <Row label="Account id" value={user.uid} />
        {user.disabled ? (
          <Row label="Switched off" value={user.disabledReason || "no reason given"} />
        ) : null}
      </dl>

      <Section title="Subscriptions">
        {enrollments.length === 0 ? (
          <p className="text-(--color-awaken-ink-soft)">None.</p>
        ) : (
          <ul className="space-y-1">
            {enrollments.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {e.subjectId} <span className="text-(--color-awaken-ink-soft)">· {e.source}</span>
                </span>
                <StatusPill tone={e.status === "active" ? "success" : "neutral"}>
                  {e.status === "active" ? `until ${formatDate(e.currentPeriodEnd)}` : e.status}
                </StatusPill>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Payments (${payments.length})`}>
        {payments.length === 0 ? (
          <p className="text-(--color-awaken-ink-soft)">None.</p>
        ) : (
          <ul className="space-y-1">
            {payments.slice(0, 8).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {formatLKR(p.amountLKR)}{" "}
                  <span className="text-(--color-awaken-ink-soft)">
                    · {p.provider} · {formatDate(p.paidAt ?? p.createdAt)}
                    {p.receiptNo ? ` · ${p.receiptNo}` : ""}
                  </span>
                </span>
                <StatusPill tone={p.status === "paid" ? "success" : p.status === "pending" ? "warn" : "neutral"}>
                  {p.status}
                </StatusPill>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <ActivitySection
        days={activity ?? []}
        summary={activitySummary}
        canClear={canSetRole}
        busy={busy}
        onClear={() => act({ action: "clear_activity" }, "Activity history deleted.")}
      />

      <Section title={`Devices (${user.devices.length})`}>
        {user.devices.length === 0 ? (
          <p className="text-(--color-awaken-ink-soft)">
            None bound — they can sign in on any device.
          </p>
        ) : (
          <ul className="space-y-1">
            {user.devices.map((d) => (
              <li key={d.deviceHash} className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Icon name="smartphone" className="!text-base text-(--color-awaken-ink-soft)" />
                  {d.label}
                  <span className="text-xs text-(--color-awaken-ink-soft)">
                    last used {formatDate(d.lastSeenAt)}
                  </span>
                </span>
                <button
                  onClick={() =>
                    act({ action: "release_devices", deviceHash: d.deviceHash }, "Device freed.")
                  }
                  disabled={busy}
                  className={smallButton}
                >
                  Free slot
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-(--color-awaken-line) pt-4">
        {user.devices.length > 0 ? (
          <button
            onClick={() => act({ action: "release_devices" }, "All device slots freed.")}
            disabled={busy}
            className={smallButton}
          >
            Free every device
          </button>
        ) : null}

        <button
          onClick={() => act({ action: "sign_out" }, "Signed out on every device.")}
          disabled={busy}
          className={smallButton}
        >
          Sign out everywhere
        </button>

        {canSetRole ? (
          <label className="inline-flex items-center gap-2">
            <span className="text-(--color-awaken-ink-soft)">Role</span>
            <select
              value={user.role}
              disabled={busy || isSelf}
              onChange={(e) => act({ action: "set_role", role: e.target.value }, "Role changed.")}
              className="rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-2 py-1.5 text-sm disabled:opacity-50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} disabled={!isAdmin && r !== "admin" && r !== user.role}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isAdmin ? (
          <>
            {user.disabled ? (
              <button
                onClick={() => act({ action: "enable" }, "Account switched back on.")}
                disabled={busy}
                className={smallButton}
              >
                Switch account on
              </button>
            ) : (
              <button
                onClick={() => {
                  const reason = window.prompt(
                    "Switch this account off. Why? (they will be signed out immediately)",
                    "",
                  );
                  if (reason === null) return;
                  void act({ action: "disable", reason }, "Account switched off.");
                }}
                disabled={busy || isSelf}
                className={`${smallButton} hover:border-(--color-awaken-danger)/40 hover:text-(--color-awaken-danger)`}
              >
                Switch account off
              </button>
            )}
          </>
        ) : (
          <span className="self-center text-xs text-(--color-awaken-ink-soft)">
            Switching accounts off is admin-only.
          </span>
        )}
      </div>

      {note ? <p className="mt-3 font-semibold text-(--color-awaken-success)">{note}</p> : null}
      {error ? <p className="mt-3 text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}

const ACTION_ERRORS: Record<string, string> = {
  admin_only: "Only an admin can do that.",
  cannot_demote_self: "You cannot change your own role — you would lock yourself out.",
  cannot_disable_self: "You cannot switch off your own account.",
  last_admin: "This is the only admin left. Make someone else an admin first.",
  not_found: "That account no longer exists.",
};

const smallButton =
  "rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-1.5 text-xs font-semibold hover:border-(--color-awaken-accent)/40 disabled:opacity-50";

function Row({ label, value }: { label: string; value: string }) {
  return (
    // `min-w-0`: this div is a grid item (the parent `<dl>` is `grid
    // sm:grid-cols-2`), and its `truncate`d `<dd>` (an account id or a long
    // school name) would otherwise force the item to its content's full
    // width instead of shrinking to the grid track, overflowing on a phone.
    <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-(--color-awaken-line)/60 py-1">
      <dt className="shrink-0 text-(--color-awaken-ink-soft)">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  );
}

/**
 * What this person actually did, newest first.
 *
 * The summary comes before the rows on purpose. The question someone opens a
 * student's record to answer is almost always "are they using it" rather than
 * "what did they click", and a wall of timestamps answers the second while
 * hiding the first. Days active is the honest measure — 200 views in one
 * panicked evening is not the same as showing up twice a week.
 *
 * Days are collapsed to the most recent three, with the rest behind a toggle:
 * a month of study is hundreds of rows, and a panel that long buries the
 * devices and payments underneath it.
 */
function ActivitySection({
  days,
  summary,
  canClear,
  busy,
  onClear,
}: {
  days: ActivityDayView[];
  summary: ActivitySummaryView | undefined;
  canClear: boolean;
  busy: boolean;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? days : days.slice(0, 3);

  return (
    <Section title="Activity (last 30 days)">
      {!summary || days.length === 0 ? (
        <p className="text-(--color-awaken-ink-soft)">
          Nothing recorded yet. Only study actions are logged — practice, mock exams, the Code
          Lab, live classes and downloads — so simply browsing the site leaves no rows here.
        </p>
      ) : (
        <>
          <dl className="mb-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            <Row label="Days active" value={String(summary.activeDays)} />
            <Row label="Run" value={summary.currentStreak > 1 ? `${summary.currentStreak} days` : "—"} />
            {/* Study actions, not page views: ordinary browsing is no longer
                logged at all. See lib/activity/policy.ts. */}
            <Row label="Study actions" value={String(summary.studyActions)} />
            <Row label="Downloads" value={String(summary.downloads)} />
          </dl>

          {summary.topAreas.length > 0 ? (
            <p className="mb-3 flex flex-wrap gap-1.5">
              {summary.topAreas.map((area) => (
                <span
                  key={area.group}
                  className="rounded-full border border-(--color-awaken-line) px-2.5 py-0.5 text-xs"
                >
                  {area.group} · {area.count}
                </span>
              ))}
            </p>
          ) : null}

          <div className="space-y-3">
            {shown.map((day) => (
              <div key={day.date}>
                <p className="mb-1 text-xs font-semibold text-(--color-awaken-ink-soft)">
                  {formatDate(Date.parse(`${day.date}T12:00:00+05:30`))}
                  {day.truncated ? " · busiest hours only" : ""}
                </p>
                <ul className="space-y-1">
                  {day.events.map((event, i) => (
                    <li key={`${event.at}-${i}`} className="flex items-baseline gap-2">
                      <Icon
                        name={event.icon}
                        className="!text-sm shrink-0 translate-y-0.5 text-(--color-awaken-ink-soft)"
                      />
                      <span className="min-w-0 flex-1 break-words">{event.label}</span>
                      <span className="shrink-0 text-xs tabular-nums text-(--color-awaken-ink-soft)">
                        {clockTime(event.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {days.length > 3 ? (
              <button onClick={() => setExpanded(!expanded)} className={smallButton}>
                {expanded ? "Show less" : `Show all ${days.length} days`}
              </button>
            ) : null}
            {canClear ? (
              <button
                onClick={() => {
                  if (window.confirm("Delete this person's activity history? This cannot be undone."))
                    onClear();
                }}
                disabled={busy}
                className={smallButton}
              >
                Delete activity history
              </button>
            ) : null}
          </div>
        </>
      )}
    </Section>
  );
}

/** Colombo wall-clock, because that is the clock the student was looking at. */
function clockTime(at: number): string {
  return new Date(at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-(--color-awaken-ink-soft)">
        {title}
      </h3>
      {children}
    </section>
  );
}
