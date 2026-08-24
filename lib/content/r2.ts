import "server-only";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { publicEnv, requireServerEnv } from "@/lib/env";

/**
 * Cloudflare R2 holds every note, past paper and recording.
 *
 * The reason is egress pricing: Firebase Storage bills roughly $0.15/GB out,
 * R2 bills nothing. A single 5MB notes PDF downloaded by 3,000 students is 15GB
 * — a few dollars a month on Firebase for one document, free on R2. At the
 * scale this platform is aiming for that difference decides whether the
 * subscription price works.
 */

let cached: S3Client | undefined;

function r2(): S3Client {
  cached ??= new S3Client({
    region: "auto",
    endpoint: `https://${requireServerEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireServerEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireServerEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return cached;
}

/**
 * Short-lived download URL for paid content.
 *
 * Deliberately short: the URL is a bearer token, and a long-lived one pasted
 * into a WhatsApp group is an unpaid distribution channel. Ten minutes is
 * enough to start a download and useless to forward.
 */
export async function signedContentUrl(r2Key: string, expiresInSeconds = 600): Promise<string> {
  return getSignedUrl(
    r2(),
    new GetObjectCommand({ Bucket: requireServerEnv("R2_BUCKET"), Key: r2Key }),
    { expiresIn: expiresInSeconds },
  );
}

/** Public (SEO) content is served straight off the bucket's public hostname. */
export function publicContentUrl(r2Key: string): string {
  const base = publicEnv.r2PublicBaseUrl.replace(/\/$/, "");
  return `${base}/${r2Key}`;
}
