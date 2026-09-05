"use client";

import { useState } from "react";
import { fetchWithSession } from "@/lib/auth/session-client";

/**
 * Fetches a short-lived download URL and opens it.
 *
 * The link is minted per click rather than rendered into the page, so a
 * "view source" or a shared screenshot yields nothing reusable.
 */
export function DownloadButton({ contentId, label }: { contentId: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession(`/api/content/${contentId}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.reason === "expired"
            ? "Your subscription has ended. Renew to download."
            : "You cannot download this yet.",
        );
      }
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={open}
        disabled={busy}
        className="rounded-full border border-(--color-awaken-line) px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy ? "Preparing…" : label}
      </button>
      {error ? <p className="mt-1 text-xs text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
