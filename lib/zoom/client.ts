import "server-only";

import { requireServerEnv } from "@/lib/env";

/**
 * Zoom Server-to-Server OAuth client.
 *
 * S2S OAuth (not JWT, which Zoom retired) mints a short-lived token from the
 * account credentials. We cache it in module memory: tokens last an hour and
 * Zoom rate-limits token requests, so minting one per API call would throttle
 * us during the exact minute a class is starting.
 */

const ZOOM_API = "https://api.zoom.us/v2";
const ZOOM_OAUTH = "https://zoom.us/oauth/token";

interface CachedToken {
  token: string;
  expiresAt: number;
}
let cachedToken: CachedToken | undefined;

async function accessToken(): Promise<string> {
  // 60s safety margin — a token that expires mid-request is a failed join.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const accountId = requireServerEnv("ZOOM_ACCOUNT_ID");
  const clientId = requireServerEnv("ZOOM_S2S_CLIENT_ID");
  const clientSecret = requireServerEnv("ZOOM_S2S_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(
    `${ZOOM_OAUTH}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Zoom OAuth failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

export async function zoomFetch<T>(
  path: string,
  init: RequestInit & { method?: string } = {},
): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${ZOOM_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Zoom API ${init.method ?? "GET"} ${path} failed (${res.status}): ${await res.text()}`);
  }

  // 204 on deletes.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
