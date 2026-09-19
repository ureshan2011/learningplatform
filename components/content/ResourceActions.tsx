"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";

/**
 * pdf.js and the reader chrome are fetched the first time a student opens
 * something, not on every page that happens to list a file. `ssr: false`
 * because the reader measures the viewport and talks to a worker; there is
 * nothing useful to render on the server.
 */
const DocumentViewer = dynamic(
  () => import("@/components/content/DocumentViewer").then((m) => m.DocumentViewer),
  { ssr: false },
);

/**
 * What a student can do with a note or a past paper.
 *
 * This replaces the bare `DownloadButton` wherever a file is listed. Reading
 * is the primary action and downloading is the secondary one, which is the
 * right way round: most of the time a student wants to check one question, not
 * to keep a copy on a phone with 2GB free.
 *
 * Only PDFs get a reader — that is what notes, papers and marking schemes
 * actually are. Anything else falls back to download alone rather than opening
 * a reader that cannot render it.
 *
 * Download still goes through `/api/content/{id}/download` and its ten-minute
 * signed URL, minted per click. Reading goes through `/api/content/{id}/view`,
 * which streams the bytes and never names the file's location at all.
 */
export function ResourceActions({
  contentId,
  title,
  readable = true,
  labels,
}: {
  contentId: string;
  title: string;
  /** False for a file no reader can render — leaves download as the only action. */
  readable?: boolean;
  labels: {
    read: string;
    download: string;
    preparing: string;
    failed: string;
    expired?: string;
    page: string;
    of: string;
    close: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession(`/api/content/${contentId}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.reason === "expired"
            ? (labels.expired ?? "Your subscription has ended. Renew to download.")
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
    <div className="shrink-0 text-right">
      <div className="flex items-center justify-end gap-2">
        {readable ? (
          <Button size="sm" arrow="none" onClick={() => setOpen(true)}>
            {labels.read}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          arrow="none"
          onClick={download}
          disabled={busy}
          aria-label={labels.download}
        >
          <Icon name="download" className="!text-base" />
          {readable ? null : busy ? labels.preparing : labels.download}
        </Button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-ict-danger-fg">{error}</p> : null}

      {open ? (
        <DocumentViewer
          contentId={contentId}
          title={title}
          onClose={() => setOpen(false)}
          onDownload={download}
          labels={{
            page: labels.page,
            of: labels.of,
            download: labels.download,
            close: labels.close,
            failed: labels.failed,
          }}
        />
      ) : null}
    </div>
  );
}
