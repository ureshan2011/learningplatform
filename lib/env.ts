/**
 * Environment access.
 *
 * Public values are referenced literally so Next.js can inline them at build
 * time. Server secrets are read lazily through `requireServerEnv` — reading
 * them at module load would break `next build`, which imports modules without
 * a populated environment.
 */

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID ?? "default",
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
  },
  zoom: {
    sdkKey: process.env.NEXT_PUBLIC_ZOOM_SDK_KEY ?? "",
    sdkVersion: process.env.NEXT_PUBLIC_ZOOM_SDK_VERSION ?? "3.13.2",
  },
  payhere: {
    merchantId: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID ?? "",
    mode: (process.env.NEXT_PUBLIC_PAYHERE_MODE ?? "sandbox") as "sandbox" | "live",
  },
  r2PublicBaseUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? "",
} as const;

/** Reads a required server-side secret, failing loudly rather than silently misbehaving. */
export function requireServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export function optionalServerEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

/** True once Firebase client config is present — lets pages degrade instead of crashing. */
export function isFirebaseConfigured(): boolean {
  return Boolean(publicEnv.firebase.apiKey && publicEnv.firebase.projectId);
}
