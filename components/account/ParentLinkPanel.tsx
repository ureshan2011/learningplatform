"use client";

import { useState } from "react";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button } from "@/components/ds";

/**
 * Lets a student generate a read-only link for a parent — no second login,
 * no app to install. It shows attendance and score trend only, nothing a
 * student would consider private (no chat, no other students' data).
 */
export function ParentLinkPanel() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(action: "create" | "revoke") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithSession("/api/account/parent-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Could not do that right now. Try again.");
      if (action === "create") {
        const data = (await res.json()) as { url: string };
        setUrl(data.url);
      } else {
        setUrl(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      <p className="text-ict-ink-300">
        Give a parent a link to see your attendance and progress — no account needed
        for them, and it never shows anything you wouldn&apos;t want them to see beyond that.
      </p>

      {url ? (
        <>
          <p className="mt-3 truncate rounded-ict-sm border border-ict-border-dark bg-ict-ink-900 px-3 py-2 font-mono text-xs text-ict-ink-300">
            {url}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <WhatsAppShareButton
              text={`Here's a link to see my attendance and progress: ${url}`}
              label="Send on WhatsApp"
            />
            <Button variant="outline" size="sm" arrow="none" onClick={() => call("revoke")} disabled={busy}>
              Revoke all links
            </Button>
          </div>
        </>
      ) : (
        <Button size="sm" arrow="none" onClick={() => call("create")} disabled={busy} className="mt-3">
          {busy ? "Creating…" : "Get parent link"}
        </Button>
      )}
      {error ? <p className="mt-2 text-xs text-[#f0685a]">{error}</p> : null}
    </div>
  );
}
