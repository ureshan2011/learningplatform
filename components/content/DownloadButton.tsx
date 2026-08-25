"use client";

import { useState } from "react";
import { StatusBanner } from "@/components/ui/StatusBanner";

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
      const res = await fetch(`/api/content/${contentId}/download`);
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
      <button onClick={open} disabled={busy} className="btn btn-secondary btn-sm">
        {busy ? "Preparing…" : label}
      </button>
      {error ? (
        <div className="mt-1.5">
          <StatusBanner tone="error">{error}</StatusBanner>
        </div>
      ) : null}
    </div>
  );
}
