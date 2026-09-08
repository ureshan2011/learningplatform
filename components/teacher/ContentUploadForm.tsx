"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { getApp } from "firebase/app";
import { clientAuth } from "@/lib/firebase/client";
import { Icon } from "@/components/ui/Icon";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Button, Card, Field, Input, Notice } from "@/components/ds";
import type { ContentKind } from "@/lib/types";

const MAX_BYTES = 200 * 1024 * 1024;

const KIND_OPTIONS: { value: ContentKind; label: string }[] = [
  { value: "notes", label: "Notes" },
  { value: "past_paper", label: "Past paper" },
  { value: "marking_scheme", label: "Marking scheme" },
  { value: "replay", label: "Class replay" },
];

/**
 * Uploads a note or past paper straight from the teacher's browser to
 * Storage, then records it — the same direct-to-Storage pattern
 * `SlipUploadForm.tsx` uses for deposit slips, just gated by role instead of
 * ownership (see `storage.rules`). Nothing routes through our server, so a
 * multi-hundred-megabyte class recording uploads exactly as reliably as a
 * one-page PDF.
 */
export function ContentUploadForm({ subjects }: { subjects: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [kind, setKind] = useState<ContentKind>("notes");
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function acceptFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFileName(files[0].name);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.files = files;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!subjectId) {
      setError("Create a subject first.");
      return;
    }
    if (!file || file.size === 0) {
      setError("Choose a file to upload.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is too large. Keep it under 200MB.");
      return;
    }

    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const uid = clientAuth().currentUser?.uid;
      if (!uid) throw new Error("Your sign-in expired. Reload and try again.");

      const storage = getStorage(getApp());
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const storagePath = `content/${subjectId}/${kind}/${Date.now()}-${safeName}`;

      await uploadBytes(ref(storage, storagePath), file, {
        contentType: file.type || "application/octet-stream",
      });

      const res = await fetchWithSession("/api/teacher/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectId,
          kind,
          title: title.trim(),
          isPublic,
          storagePath,
          sizeBytes: file.size,
        }),
      });
      if (!res.ok) throw new Error("Could not save it. Try again.");

      setDone(`"${title.trim()}" is live.`);
      setTitle("");
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (subjects.length === 0) {
    return <p className="text-sm text-ict-ink-300">Create a subject first.</p>;
  }

  return (
    <Card radius="card" className="p-5">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="e.g. Unit 1.1 — Data and information (notes)"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="h-12 w-full rounded-full border border-ict-border-dark bg-ict-ink-800 px-4 text-base text-ict-paper-50 outline-none focus:border-ict-orange-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kind">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ContentKind)}
              className="h-12 w-full rounded-full border border-ict-border-dark bg-ict-ink-800 px-4 text-base text-ict-paper-50 outline-none focus:border-ict-orange-500"
            >
              {KIND_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ict-ink-300">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="size-4 rounded border-ict-border-dark accent-ict-orange-500"
          />
          <Icon name={isPublic ? "lock_open" : "lock"} className="!text-base" />
          Free — listed on /notes or /past-papers, no sign-in or subscription needed
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ict-ink-300">File</span>
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
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-ict-card border-2 border-dashed px-4 py-8 text-center transition-colors duration-[120ms] ${
              dragOver ? "border-ict-orange-500 bg-ict-orange-500/10" : "border-ict-ink-500 bg-ict-ink-800"
            }`}
          >
            <Icon name="cloud_upload" className="!text-2xl text-ict-orange-400" />
            <span className="font-semibold text-ict-paper-50">
              {fileName ?? "Click to upload or drag & drop"}
            </span>
            <span className="text-xs text-ict-ink-300">
              {fileName ? "Tap to choose a different file" : "PDF, image or video (max. 200MB)"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*,video/*"
              required
              className="sr-only"
              onChange={(e) => acceptFiles(e.target.files)}
            />
          </label>
        </div>

        <Button type="submit" disabled={busy} className="w-full justify-center">
          {busy ? "Uploading…" : "Upload"}
        </Button>

        {done ? <Notice tone="success">{done}</Notice> : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </form>
    </Card>
  );
}
