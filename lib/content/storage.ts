import "server-only";

import { adminStorage } from "@/lib/firebase/admin";

/**
 * Cloud Storage for Firebase holds every note, past paper and recording.
 *
 * Chosen over a separate provider (Cloudflare R2 was the earlier design) for
 * one reason: it needs no new account, API token or secret to enter anywhere
 * — it is the same Firebase project already running everything else, and
 * already active in production (`SlipUploadForm.tsx` has been uploading
 * payment slips to this exact bucket since launch). The free tier (5GB
 * stored, 1GB/day served) comfortably covers a platform this size; Blaze
 * billing only starts past that, at roughly $0.026/GB stored and $0.12/GB
 * served a month — revisit only if download volume grows enough to matter.
 *
 * Every download, free or paid, goes through a signed URL rather than a
 * public bucket path. `storage.rules` denies direct reads outright, so a
 * signed URL minted here is the only way any file ever leaves the bucket —
 * the same "never a stable URL for gated content" rule the R2 design used,
 * just enforced with Firebase's own signing instead of the S3 SDK's.
 */

/** Ten minutes is enough to start a download and useless to forward. */
export async function signedContentUrl(storagePath: string, expiresInSeconds = 600): Promise<string> {
  const [url] = await adminStorage()
    .bucket()
    .file(storagePath)
    .getSignedUrl({ action: "read", expires: Date.now() + expiresInSeconds * 1000 });
  return url;
}

/** Written by `/api/teacher/content` after the teacher's browser uploads the file directly to Storage. */
export async function deleteContentFile(storagePath: string): Promise<void> {
  await adminStorage().bucket().file(storagePath).delete({ ignoreNotFound: true });
}
