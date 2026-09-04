"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getApp } from "firebase/app";
import { clientAuth } from "@/lib/firebase/client";
import { Icon } from "@/components/ui/Icon";
import { fetchWithSession } from "@/lib/auth/session-client";

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
  initialSubjectId,
}: {
  subjects: Array<{ id: string; name: string; price: string }>;
  /** Preselects the subject the student came here to pay for. */
  initialSubjectId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? subjects[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const selected = subjects.find((s) => s.id === subjectId) ?? subjects[0];

  function acceptFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFileName(files[0].name);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.files = files;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file || file.size === 0) {
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
      // Two separate sessions have to agree here: our httpOnly cookie, and the
      // Firebase client sign-in that the upload is authorised by. They can
      // disagree — a shared family laptop, a cleared site data, a private tab —
      // and the student then met a bare "Please sign in again" with no link,
      // mid-payment, holding a bank slip. Send them somewhere instead.
      const uid = clientAuth().currentUser?.uid;
      if (!uid) {
        setNeedsSignIn(true);
        throw new Error("Your sign-in expired before the upload started.");
      }

      const storage = getStorage(getApp());
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `slips/${uid}/${Date.now()}.${extension}`;

      const snapshot = await uploadBytes(ref(storage, path), file, {
        contentType: file.type,
      });
      const slipUrl = await getDownloadURL(snapshot.ref);

      const res = await fetchWithSession("/api/payments/slip", {
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
      <div className="mt-6 rounded-xl border border-(--color-awaken-success)/30 bg-(--color-awaken-success-soft) p-5 text-sm">
        <div className="flex items-center gap-2 font-semibold text-(--color-awaken-success)">
          <Icon name="check_circle" />
          Slip received
        </div>
        <p className="mt-1 text-(--color-awaken-ink-soft)">
          Your teacher will approve it shortly. You will see the class unlock on your
          dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">Subject</span>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          required
          className="w-full rounded-lg border border-(--color-awaken-line) bg-(--color-awaken-card) px-3 py-2.5 text-base outline-none focus:border-(--color-awaken-accent)"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.price}/month
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-(--color-awaken-bg) px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">Course</p>
            <p className="font-semibold">{selected.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-awaken-ink-soft)">Total amount</p>
            <p className="text-lg font-bold text-(--color-awaken-accent)">{selected.price}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <span className="mb-1.5 block text-sm font-semibold text-(--color-awaken-ink-soft)">Payment slip upload</span>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            acceptFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
            dragOver ? "border-(--color-awaken-accent) bg-(--color-awaken-accent-soft)" : "border-(--color-awaken-line) bg-(--color-awaken-bg)"
          }`}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-(--color-awaken-indigo-soft) text-(--color-awaken-indigo)">
            <Icon name="cloud_upload" className="!text-2xl" />
          </span>
          <span className="font-semibold">{fileName ?? "Click to upload or drag & drop"}</span>
          <span className="text-xs text-(--color-awaken-ink-soft)">
            {fileName ? "Tap to choose a different file" : "PNG, JPG or PDF (max. 5MB)"}
          </span>
          <input
            ref={fileInputRef}
            name="slip"
            type="file"
            accept="image/*,application/pdf"
            // capture opens the camera directly — most students photograph the
            // slip at the bank counter rather than saving a file first.
            capture="environment"
            required
            className="sr-only"
            onChange={(e) => acceptFiles(e.target.files)}
          />
        </label>
        <p className="mt-1.5 text-xs text-(--color-awaken-ink-soft)">
          Make sure the amount and date are readable.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-(--color-awaken-accent) to-(--color-awaken-rose) px-4 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(234,88,12,0.25)] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        <Icon name="check_circle" className="!text-lg" />
        {busy ? "Uploading…" : "Submit payment slip"}
      </button>

      {error ? (
        <p className="mt-2 text-sm text-(--color-awaken-danger)">
          {error}
          {needsSignIn ? (
            <a href="/signin?next=/pay/slip&reason=expired" className="ml-1 font-semibold underline">
              Sign in again
            </a>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
