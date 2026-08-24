import "server-only";

import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";
import { requireServerEnv, publicEnv } from "@/lib/env";

let cached: App | undefined;

function adminApp(): App {
  if (cached) return cached;
  if (getApps().length) {
    cached = getApp();
    return cached;
  }

  cached = initializeApp({
    credential: cert({
      projectId: requireServerEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireServerEnv("FIREBASE_CLIENT_EMAIL"),
      // Keys are stored with literal \n escapes in the env file.
      privateKey: requireServerEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
    databaseURL: publicEnv.firebase.databaseURL || undefined,
  });
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
