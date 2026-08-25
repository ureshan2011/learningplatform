"use client";

import { useState } from "react";

/**
 * Starts a PayHere checkout.
 *
 * PayHere's checkout is a plain form POST, so we build a hidden form from the
 * server-signed fields and submit it. The signing secret never reaches the
 * browser — only the resulting hash does.
 */
export function SubscribeButton({ subjectId }: { subjectId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/payhere/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      if (!res.ok) throw new Error("Could not start the payment. Try again.");

      const { action, fields } = (await res.json()) as {
        action: string;
        fields: Record<string, string>;
      };

      const form = document.createElement("form");
      form.method = "POST";
      form.action = action;
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed to start.");
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={start}
        disabled={busy}
        className="rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Opening…" : "Pay monthly"}
      </button>
      {error ? <p className="mt-1 text-xs text-(--color-awaken-danger)">{error}</p> : null}
    </div>
  );
}
