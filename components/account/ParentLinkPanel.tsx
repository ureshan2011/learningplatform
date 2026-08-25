"use client";

import { useState } from "react";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";

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
      const res = await fetch("/api/account/parent-link", {
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
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
      <p className="text-white/70">
        Give a parent a link to see your attendance and progress — no account needed
        for them, and it never shows anything you wouldn&apos;t want them to see beyond that.
      </p>

      {url ? (
        <>
          <p className="mt-3 truncate rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-white/80">
            {url}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <WhatsAppShareButton
              text={`Here's a link to see my attendance and progress: ${url}`}
              label="Send on WhatsApp"
            />
            <button
              onClick={() => call("revoke")}
              disabled={busy}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
            >
              Revoke all links
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => call("create")}
          disabled={busy}
          className="mt-3 rounded-lg bg-[--color-brand] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Creating…" : "Get parent link"}
        </button>
      )}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
