"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";
import { publicEnv, isFirebaseConfigured } from "@/lib/env";

function app(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase client config missing. Fill NEXT_PUBLIC_FIREBASE_* in .env.local.",
    );
  }
  return getApps().length ? getApp() : initializeApp(publicEnv.firebase);
}

export function clientAuth(): Auth {
  return getAuth(app());
}

export function clientDb(): Firestore {
  return getFirestore(app());
}

/**
 * Realtime Database carries ALL live class traffic — chat, presence, reactions,
 * quiz state, leaderboard.
 *
 * This is a cost decision, not a preference: Firestore bills per document
 * operation, so a 1,000-student live chat would burn the entire daily free
 * quota in a single class. RTDB bills per GB transferred, and chat text is
 * tiny. Never move live data into Firestore.
 */
export function clientRtdb(): Database {
  return getDatabase(app());
}
