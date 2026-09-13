"use client";

import { useState } from "react";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button } from "@/components/ds";

/**
 * Downloads one of the pack's bundled files.
 *
 * Fetched rather than linked so a lapsed session is repaired and retried once
 * (`fetchWithSession`), and so a 403 becomes a sentence on the page instead of
 * a JSON blob in a new tab. The object URL is revoked immediately — it only has
 * to survive the synthetic click.
 */
export function PackFileButton({
  subjectId,
  name,
  label,
  expiredMessage,
}: {
  subjectId: string;
  name: string;
  label: string;
  expiredMessage: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession(
        `/api/packs/${encodeURIComponent(subjectId)}/files/${encodeURIComponent(name)}`,
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { reason?: string };
        throw new Error(data.reason === "expired" ? expiredMessage : "You cannot download this yet.");
      }

      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shrink-0">
      <Button variant="outline" size="sm" arrow="none" onClick={download} disabled={busy}>
        {busy ? "Preparing…" : label}
      </Button>
      {error ? <p className="mt-1.5 text-xs text-[#f0685a]">{error}</p> : null}
    </div>
  );
}
