"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";

interface FoundDevice {
  deviceHash: string;
  label: string;
  firstSeenAt: number;
  lastSeenAt: number;
}

/**
 * "This account is already signed in on the maximum number of devices. Ask
 * your teacher to remove an old device." — this is the teacher doing that.
 *
 * Look a student up by phone, see what is bound, and free a slot. Releasing
 * also signs that account out everywhere, which is the point when the reason
 * is a lost or borrowed phone.
 */
export function DeviceResetPanel() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<{ name: string; role: string; devices: FoundDevice[] } | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  async function look(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setFound(null);
    try {
      const res = await fetch(`/api/teacher/devices?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error === "not_found"
            ? "No account with that number yet."
            : data.error === "invalid_phone"
              ? "That does not look like a Sri Lankan mobile number."
              : "Could not look that up.",
        );
      }
      setFound(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function release(deviceHash?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/devices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, ...(deviceHash ? { deviceHash } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Could not release that device.");
      setMessage(
        `Freed ${data.released} device${data.released === 1 ? "" : "s"}. ${data.name} can sign in again now.`,
      );
      setFound((prev) =>
        prev
          ? {
              ...prev,
              devices: deviceHash ? prev.devices.filter((d) => d.deviceHash !== deviceHash) : [],
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={look} className="flex flex-wrap gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          required
          placeholder="Student's phone — 077 123 4567"
          className="min-w-[12rem] flex-1 rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-base outline-none focus:border-(--color-awaken-accent)"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-awaken-line) px-4 py-2.5 text-sm font-semibold hover:border-(--color-awaken-accent)/40 disabled:opacity-50"
        >
          <Icon name="search" className="!text-base" />
          Find
        </button>
      </form>

      {found ? (
        <div className="mt-4 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              {found.name}
              <span className="ml-2 text-xs font-normal text-(--color-awaken-ink-soft)">
                {found.role}
              </span>
            </p>
            {found.devices.length > 1 ? (
              <button
                onClick={() => release()}
                disabled={busy}
                className="rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-xs font-semibold hover:border-(--color-awaken-danger)/40 hover:text-(--color-awaken-danger) disabled:opacity-50"
              >
                Remove all
              </button>
            ) : null}
          </div>

          {found.devices.length === 0 ? (
            <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
              No devices bound — they can sign in anywhere.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {found.devices.map((device) => (
                <li
                  key={device.deviceHash}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--color-awaken-line) px-3 py-2 text-sm"
                >
                  <span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icon name="smartphone" className="!text-base text-(--color-awaken-ink-soft)" />
                      {device.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-(--color-awaken-ink-soft)">
                      first used {formatDate(device.firstSeenAt)} · last {formatDate(device.lastSeenAt)}
                    </span>
                  </span>
                  <button
                    onClick={() => release(device.deviceHash)}
                    disabled={busy}
                    className="rounded-lg border border-(--color-awaken-line) px-3 py-1.5 text-xs font-semibold hover:border-(--color-awaken-danger)/40 hover:text-(--color-awaken-danger) disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {message ? (
        <p className="mt-2 text-sm font-semibold text-(--color-awaken-success)">{message}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
