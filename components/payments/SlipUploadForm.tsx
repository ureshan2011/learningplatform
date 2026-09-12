"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getApp } from "firebase/app";
import { clientAuth } from "@/lib/firebase/client";
import { Icon } from "@/components/ui/Icon";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button, Card } from "@/components/ds";
import { PolicyNote } from "@/components/payments/PolicyNote";

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
      <Card radius="card" className="mt-5 p-5">
        <div className="flex items-center gap-2 font-semibold text-ict-green-500">
          <Icon name="check_circle" />
          Slip received
        </div>
        <p className="mt-1.5 text-sm text-ict-ink-300">
          Your teacher will approve it shortly. You will see the class unlock on your
          dashboard.
        </p>
      </Card>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-5 rounded-ict-card border border-ict-border-dark bg-ict-ink-850 p-5 shadow-ict-inset"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ict-ink-300">Subject</span>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          required
          className="w-full rounded-ict-sm border border-ict-border-dark bg-ict-ink-800 px-3 py-2.5 text-base text-ict-paper-50 outline-none focus:border-ict-orange-500"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.price}/month
            </option>
          ))}
        </select>
      </label>

      {selected ? (
        <div className="mt-4 flex items-center justify-between rounded-ict-md bg-ict-ink-800 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ict-ink-300">Course</p>
            <p className="font-semibold text-ict-paper-50">{selected.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-ict-ink-300">Total amount</p>
            <p className="text-lg font-bold text-ict-orange-400">{selected.price}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <span className="mb-1.5 block text-sm font-semibold text-ict-ink-300">Payment slip upload</span>
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
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-ict-card border-2 border-dashed px-4 py-10 text-center transition-colors duration-[120ms] ${
            dragOver ? "border-ict-orange-500 bg-ict-orange-500/10" : "border-ict-ink-500 bg-ict-ink-800"
          }`}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-ict-orange-500/12 text-ict-orange-400">
            <Icon name="cloud_upload" className="!text-2xl" />
          </span>
          <span className="font-semibold text-ict-paper-50">{fileName ?? "Click to upload or drag & drop"}</span>
          <span className="text-xs text-ict-ink-300">
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
        <p className="mt-1.5 text-xs text-ict-ink-300">Make sure the amount and date are readable.</p>
      </div>

      <Button type="submit" disabled={busy} className="mt-5 w-full justify-center">
        {busy ? "Uploading…" : "Submit payment slip"}
      </Button>

      <PolicyNote className="mt-2.5" />

      {error ? (
        <p className="mt-2.5 text-sm text-[#f0685a]">
          {error}
          {needsSignIn ? (
            <a href="/signin?next=/pay/slip&reason=expired" className="ml-1 font-semibold underline underline-offset-4">
              Sign in again
            </a>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
