"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getApp } from "firebase/app";
import { clientAuth } from "@/lib/firebase/client";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads the slip straight to Firebase Storage from the browser, then records
 * a PENDING payment.
 *
 * Uploading direct to Storage keeps a multi-megabyte photo off our server
 * entirely. Storage rules restrict writes to `slips/{uid}/`, so a student can
 * only ever write under their own id.
 */
export function SlipUploadForm({
  subjects,
}: {
  subjects: Array<{ id: string; name: string; price: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const subjectId = String(form.get("subjectId"));
    const file = form.get("slip");

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a photo of your deposit slip.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is too large. Keep it under 5MB.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const uid = clientAuth().currentUser?.uid;
      if (!uid) throw new Error("Please sign in again.");

      const storage = getStorage(getApp());
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `slips/${uid}/${Date.now()}.${extension}`;

      const snapshot = await uploadBytes(ref(storage, path), file, {
        contentType: file.type,
      });
      const slipUrl = await getDownloadURL(snapshot.ref);

      const res = await fetch("/api/payments/slip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId, slipUrl }),
      });
      if (!res.ok) throw new Error("Could not submit the slip. Try again.");

      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-xl border border-(--color-awaken-success)/30 bg-(--color-awaken-success-soft) p-5 text-sm">
        <p className="font-semibold text-(--color-awaken-success)">Slip received</p>
        <p className="mt-1 text-(--color-awaken-ink-soft)">
          Your teacher will approve it shortly. You will see the class unlock on your
          dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-(--color-awaken-ink-soft)">Subject</span>
        <select name="subjectId" required className={inputClass}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id} className="bg-(--color-awaken-bg)">
              {s.name} — {s.price}/month
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-(--color-awaken-ink-soft)">Deposit slip</span>
        <input
          name="slip"
          type="file"
          accept="image/*,application/pdf"
          // capture opens the camera directly — most students photograph the
          // slip at the bank counter rather than saving a file first.
          capture="environment"
          required
          className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-(--color-awaken-line) file:px-3 file:py-1.5 file:text-(--color-awaken-ink)"
        />
        <span className="mt-1 block text-xs text-(--color-awaken-ink-soft)">
          Photo or PDF, under 5MB. Make sure the amount and date are readable.
        </span>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Submit slip"}
      </button>

      {error ? <p className="text-sm text-(--color-awaken-danger)">{error}</p> : null}
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-base outline-none focus:border-(--color-awaken-accent)";
