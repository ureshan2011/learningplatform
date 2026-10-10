import "server-only";

import { decodeJwt } from "jose";
import {
  GOOGLE_SCOPES,
  getGoogleSettings,
  googleRedirectUri,
  recordGoogleError,
  resolveClient,
  type GoogleClient,
} from "@/lib/google/settings";

/**
 * Google OAuth for one account: the owner's.
 *
 * Plain `fetch` against Google's documented endpoints — no SDK, no new
 * dependency, nothing to install from a command line. The flow is the
 * standard web-server one: the owner clicks "Connect Google" in the console,
 * approves the Calendar scope on Google's own page, and Google hands back a
 * code that is exchanged here for a refresh token. From then on the server
 * mints short-lived access tokens from it whenever it needs to create a Meet.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export class GoogleNotConnected extends Error {
  constructor(message = "Google is not connected") {
    super(message);
    this.name = "GoogleNotConnected";
  }
}

/** The URL the owner's browser is sent to. `prompt=consent` makes Google issue a refresh token every time. */
export function authorizationUrl(client: GoogleClient, state: string): string {
  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

/** Exchanges the code Google returned for tokens. Throws with Google's own reason on failure. */
export async function exchangeCode(
  client: GoogleClient,
  code: string,
): Promise<{ refreshToken: string; accountEmail?: string; scopes: string[] }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !body.refresh_token) {
    throw new Error(body.error_description || body.error || `Google refused the code (${res.status})`);
  }

  // The ID token came straight from Google's token endpoint over TLS, so its
  // signature does not need re-checking to read who signed in (Google's own
  // guidance). It is used only to label the console, never to grant anything.
  let accountEmail: string | undefined;
  if (body.id_token) {
    try {
      const claims = decodeJwt(body.id_token);
      if (typeof claims.email === "string") accountEmail = claims.email;
    } catch {
      // A missing label is not worth failing the connection over.
    }
  }

  return { refreshToken: body.refresh_token, accountEmail, scopes: (body.scope ?? "").split(" ") };
}

let cached: { token: string; expiresAt: number; refreshToken: string } | null = null;

/**
 * A fresh access token for the connected account.
 *
 * Cached per server instance until a minute before it expires. A refresh that
 * Google refuses with `invalid_grant` means the owner revoked access, changed
 * their password, or the OAuth app is still in "Testing" (whose refresh tokens
 * Google expires after seven days) — the console is told which, in words.
 */
export async function accessToken(): Promise<string> {
  const settings = await getGoogleSettings();
  const client = resolveClient(settings);
  if (!client || !settings.refreshToken) throw new GoogleNotConnected();

  const now = Date.now();
  if (cached && cached.refreshToken === settings.refreshToken && cached.expiresAt - 60_000 > now) {
    return cached.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: settings.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !body.access_token) {
    const reason =
      body.error === "invalid_grant"
        ? "Google no longer accepts the saved connection. Reconnect Google in the console. If this keeps happening every week, set the OAuth app's publishing status to In production."
        : body.error_description || body.error || `Google token refresh failed (${res.status})`;
    await recordGoogleError(reason);
    throw new GoogleNotConnected(reason);
  }

  cached = {
    token: body.access_token,
    expiresAt: now + (body.expires_in ?? 3600) * 1000,
    refreshToken: settings.refreshToken,
  };
  return body.access_token;
}

/** Tells Google to forget the refresh token. Best effort — the local copy is cleared regardless. */
export async function revokeToken(token: string): Promise<void> {
  cached = null;
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    });
  } catch (err) {
    console.warn("[google] revoke failed", err);
  }
}
