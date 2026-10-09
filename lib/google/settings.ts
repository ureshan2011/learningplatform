import "server-only";

import { col } from "@/lib/firebase/admin";
import { publicEnv } from "@/lib/env";
import type { GoogleSettings } from "@/lib/types";

/**
 * Which Google account creates the Meet links, and the credentials to act as
 * it — `settings/google`.
 *
 * Optional, like Zoom and PayHere: with nothing here the Exam Pack still sells,
 * still books consultations and still shows the Saturday live on the
 * timetable. The links simply say "appears here before the class" until the
 * owner connects Google from the console, or pastes a Meet link by hand.
 *
 * Environment variables win for the OAuth client when present, as PayHere's
 * do. The refresh token only ever comes from the console's "Connect Google"
 * button, because it is granted to whoever clicks it.
 */

const DOC = "google";

/** Carries the anti-forgery state through Google's consent page and back. */
export const GOOGLE_STATE_COOKIE = "ictcampus_google_state";

/** Google's own Calendar scope for creating and deleting events — not reading the rest of the calendar. */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

/** Where Google sends the owner back after they approve. Must be registered on the OAuth client, exactly. */
export function googleRedirectUri(): string {
  return `${publicEnv.appUrl}/api/teacher/google/callback`;
}

export async function getGoogleSettings(): Promise<GoogleSettings> {
  try {
    const snap = await col.settings().doc(DOC).get();
    return snap.exists ? (snap.data() as GoogleSettings) : { tenantId: publicEnv.tenantId };
  } catch (err) {
    console.error("[google] settings unreadable", err);
    return { tenantId: publicEnv.tenantId };
  }
}

export interface GoogleClient {
  clientId: string;
  clientSecret: string;
  /** Where the client came from, for the console's status line. */
  source: "env" | "console";
}

/** The OAuth client, or null if neither the environment nor the console has one. */
export function resolveClient(settings: GoogleSettings): GoogleClient | null {
  const envId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const envSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (envId && envSecret) return { clientId: envId, clientSecret: envSecret, source: "env" };
  if (settings.clientId && settings.clientSecret) {
    return { clientId: settings.clientId, clientSecret: settings.clientSecret, source: "console" };
  }
  return null;
}

export interface GoogleStatus {
  /** An OAuth client is configured, so "Connect Google" can work. */
  clientReady: boolean;
  clientSource?: "env" | "console";
  /** A refresh token is stored — Meet links can be created without the owner present. */
  connected: boolean;
  accountEmail?: string;
  connectedAt?: number;
  lastError?: string;
  lastErrorAt?: number;
}

/** What the console shows, with nothing secret in it. */
export async function googleStatus(): Promise<GoogleStatus> {
  const settings = await getGoogleSettings();
  const client = resolveClient(settings);
  return {
    clientReady: client !== null,
    ...(client ? { clientSource: client.source } : {}),
    connected: Boolean(client && settings.refreshToken),
    ...(settings.accountEmail ? { accountEmail: settings.accountEmail } : {}),
    ...(settings.connectedAt ? { connectedAt: settings.connectedAt } : {}),
    ...(settings.lastError ? { lastError: settings.lastError, lastErrorAt: settings.lastErrorAt } : {}),
  };
}

export async function saveGoogleClient(params: { clientId: string; clientSecret: string }): Promise<void> {
  await col
    .settings()
    .doc(DOC)
    .set(
      {
        tenantId: publicEnv.tenantId,
        clientId: params.clientId,
        clientSecret: params.clientSecret,
        updatedAt: Date.now(),
      } satisfies Partial<GoogleSettings>,
      { merge: true },
    );
}

export async function saveGoogleConnection(params: {
  refreshToken: string;
  accountEmail?: string;
  by: string;
}): Promise<void> {
  const now = Date.now();
  await col
    .settings()
    .doc(DOC)
    .set(
      {
        tenantId: publicEnv.tenantId,
        refreshToken: params.refreshToken,
        ...(params.accountEmail ? { accountEmail: params.accountEmail } : {}),
        connectedAt: now,
        connectedBy: params.by,
        lastError: "",
        lastErrorAt: 0,
        updatedAt: now,
      } satisfies Partial<GoogleSettings>,
      { merge: true },
    );
}

/** Forgets the connected account. The OAuth client stays, so reconnecting is one click. */
export async function clearGoogleConnection(): Promise<void> {
  await col
    .settings()
    .doc(DOC)
    .set(
      {
        tenantId: publicEnv.tenantId,
        refreshToken: "",
        accountEmail: "",
        connectedAt: 0,
        lastError: "",
        lastErrorAt: 0,
        updatedAt: Date.now(),
      } satisfies Partial<GoogleSettings>,
      { merge: true },
    );
}

/** Records the last thing that went wrong, so the console can say it instead of a link silently never appearing. */
export async function recordGoogleError(message: string): Promise<void> {
  try {
    await col
      .settings()
      .doc(DOC)
      .set(
        { lastError: message.slice(0, 300), lastErrorAt: Date.now() } satisfies Partial<GoogleSettings>,
        { merge: true },
      );
  } catch {
    // The error is already in the log; failing to record it must not mask the original.
  }
}
