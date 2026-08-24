import "server-only";

import { SignJWT } from "jose";
import { publicEnv, requireServerEnv } from "@/lib/env";

/** 0 = attendee, 1 = host. Students are always 0. */
export type ZoomRole = 0 | 1;

/**
 * Mints the JWT the embedded Meeting SDK needs to join.
 *
 * Signed with the SDK secret, which must never leave the server: a leaked
 * secret lets anyone mint a host signature and take over a live class.
 *
 * Zoom requires exp to be at least 30 minutes and at most 48 hours after iat,
 * and rejects the token outright otherwise.
 */
export async function createSdkSignature(params: {
  meetingNumber: string;
  role: ZoomRole;
  /** Lifetime in seconds; clamped into Zoom's accepted window. */
  expiresInSeconds?: number;
}): Promise<{ signature: string; sdkKey: string }> {
  const sdkKey = requireServerEnv("NEXT_PUBLIC_ZOOM_SDK_KEY");
  const sdkSecret = requireServerEnv("ZOOM_SDK_SECRET");

  const iat = Math.floor(Date.now() / 1000);
  const requested = params.expiresInSeconds ?? 4 * 60 * 60;
  const exp = iat + Math.min(Math.max(requested, 30 * 60), 48 * 60 * 60);

  const signature = await new SignJWT({
    appKey: sdkKey,
    sdkKey,
    mn: params.meetingNumber,
    role: params.role,
    iat,
    exp,
    tokenExp: exp,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(new TextEncoder().encode(sdkSecret));

  return { signature, sdkKey };
}

/** URL of the Meeting SDK bundle on Zoom's CDN, pinned by env. */
export function zoomSdkCdnBase(): string {
  return `https://source.zoom.us/${publicEnv.zoom.sdkVersion}/lib`;
}
