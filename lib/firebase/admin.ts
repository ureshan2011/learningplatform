import "server-only";

import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";
import { optionalServerEnv, requireServerEnv, publicEnv } from "@/lib/env";

let cached: App | undefined;

/**
 * True when some credential source is reachable: an explicit service account
 * key, or an ambient Google Cloud environment that supplies ADC.
 *
 * Without this check, a build machine with no credentials (CI, or a local
 * `npm run build`) waits on ADC metadata-server lookups that can only time out,
 * turning a 15-second build into a 50-second one. Failing fast turns that into
 * an immediate, catchable error instead.
 */
function hasAdminCredentials(): boolean {
  return Boolean(
    optionalServerEnv("FIREBASE_PRIVATE_KEY") ||
      optionalServerEnv("GOOGLE_APPLICATION_CREDENTIALS") ||
      // Set automatically by Cloud Run (App Hosting runtime) and Cloud Build.
      optionalServerEnv("K_SERVICE") ||
      optionalServerEnv("GOOGLE_CLOUD_PROJECT") ||
      optionalServerEnv("GCLOUD_PROJECT"),
  );
}

/**
 * Initialises the Admin SDK, preferring Application Default Credentials.
 *
 * On Firebase App Hosting the backend already runs as a service account with
 * the permissions it needs, so no key is required — and that is the point:
 * FIREBASE_PRIVATE_KEY does not exist in production at all, and a secret that
 * is never stored cannot leak.
 *
 * Local development has no ambient credentials, so an explicit service account
 * from .env.local is used when one is present.
 */
function adminApp(): App {
  if (cached) return cached;
  if (getApps().length) {
    cached = getApp();
    return cached;
  }

  if (!hasAdminCredentials()) {
    throw new Error(
      "No Firebase Admin credentials available. Set FIREBASE_PRIVATE_KEY in " +
        ".env.local for local development, or run in an environment that " +
        "provides Application Default Credentials.",
    );
  }

  const databaseURL = publicEnv.firebase.databaseURL || undefined;
  const hasExplicitKey = Boolean(optionalServerEnv("FIREBASE_PRIVATE_KEY"));

  cached = hasExplicitKey
    ? initializeApp({
        credential: cert({
          projectId: requireServerEnv("FIREBASE_PROJECT_ID"),
          clientEmail: requireServerEnv("FIREBASE_CLIENT_EMAIL"),
          // Keys are stored with literal \n escapes in the env file.
          privateKey: requireServerEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
        }),
        databaseURL,
      })
    : // No explicit key: fall through to ADC. In production that is the Cloud
      // Run service account; locally it is whatever `gcloud auth
      // application-default login` last wrote, and its absence surfaces as a
      // credential error on the first query rather than at import time.
      initializeApp({ databaseURL });

  return cached;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminRtdb(): Database {
  return getDatabase(adminApp());
}

/**
 * Collection helpers.
 *
 * Every document carries tenantId and every query filters on it, so Phase 4
 * multi-tenancy needs no migration. Deterministic ids keep the hot access
 * check (`hasAccess`) to a single document read rather than a query.
 */
export const col = {
  users: () => adminDb().collection("users"),
  subjects: () => adminDb().collection("subjects"),
  enrollments: () => adminDb().collection("enrollments"),
  sessions: () => adminDb().collection("sessions"),
  attendance: () => adminDb().collection("attendance"),
  payments: () => adminDb().collection("payments"),
  content: () => adminDb().collection("content"),
  progress: () => adminDb().collection("progress"),
  questions: () => adminDb().collection("questions"),
  attempts: () => adminDb().collection("attempts"),
  mockExams: () => adminDb().collection("mockExams"),
  mockExamAttempts: () => adminDb().collection("mockExamAttempts"),
  leads: () => adminDb().collection("leads"),
  units: () => adminDb().collection("units"),
  /** Raw provider notifications, kept as evidence behind every payment decision. */
  paymentEvents: () => adminDb().collection("paymentEvents"),
  /** Single-document settings (bank details, receipt identity). Server-read only. */
  settings: () => adminDb().collection("settings"),
  /** Monotonic counters — currently just the receipt series. */
  counters: () => adminDb().collection("counters"),
  /** The teacher's money notifications, one small document per event. */
  teacherActivity: () => adminDb().collection("teacherActivity"),
} as const;

export function enrollmentId(uid: string, subjectId: string): string {
  return `${uid}_${subjectId}`;
}

export function attendanceId(sessionId: string, uid: string): string {
  return `${sessionId}_${uid}`;
}

export function progressId(uid: string, subjectId: string): string {
  return `${uid}_${subjectId}`;
}

export function attemptId(uid: string, questionId: string): string {
  return `${uid}_${questionId}`;
}

export function mockExamAttemptId(uid: string, mockExamId: string): string {
  return `${uid}_${mockExamId}`;
}
