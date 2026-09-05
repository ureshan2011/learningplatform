import type { NextConfig } from "next";

/**
 * Firebase web config, resolved without you having to type it in.
 *
 * Firebase App Hosting injects FIREBASE_WEBAPP_CONFIG (a JSON blob) into the
 * build environment automatically. It is not NEXT_PUBLIC_-prefixed, so Next
 * will not inline it on its own — mapping it through `env` below does that,
 * which is what lets a fresh deploy work with nothing filled in.
 *
 * An explicit .env.local value always wins, so local development is unaffected.
 */
interface FirebaseWebConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  databaseURL?: string;
  measurementId?: string;
}

function injectedFirebaseConfig(): FirebaseWebConfig {
  const raw = process.env.FIREBASE_WEBAPP_CONFIG;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as FirebaseWebConfig;
  } catch {
    // Malformed blob should not take the whole build down — fall back to env vars.
    console.warn("[config] FIREBASE_WEBAPP_CONFIG was not valid JSON; ignoring it.");
    return {};
  }
}

const injected = injectedFirebaseConfig();
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || injected.projectId || "";

const firebasePublicEnv: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || injected.apiKey || "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || injected.authDomain || "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || injected.storageBucket || "",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || injected.messagingSenderId || "",
  NEXT_PUBLIC_FIREBASE_APP_ID:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID || injected.appId || "",
  // Deliberately NOT guessed. Only databases in us-central1 use
  // `<name>.firebaseio.com`; every other region uses
  // `<name>.<region>.firebasedatabase.app`. Guessing the wrong host points the
  // app at a database that does not exist and fails silently at runtime, which
  // is far worse than an empty value — nothing uses RTDB until live classes are
  // added, and an empty value simply reports the feature as unconfigured.
  // Copy the real URL from the Firebase console when that time comes.
  NEXT_PUBLIC_FIREBASE_DATABASE_URL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || injected.databaseURL || "",
  // Present in FIREBASE_WEBAPP_CONFIG once Google Analytics is turned on for
  // this Firebase project (console → Project settings → Integrations), so
  // enabling it and redeploying is normally all this needs — nobody has to
  // type a measurement ID in by hand.
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || injected.measurementId || "",
};

/**
 * The one hostname phone sign-in works on.
 *
 * Firebase registers the reCAPTCHA keys behind phone auth against an explicit
 * list of hosts. A visitor who arrives on any other spelling of the site — the
 * `www.` alias most of all — gets a page that looks perfectly normal and a
 * sign-in that dies with INVALID_APP_CREDENTIAL: no SMS, no useful error. The
 * redirect below is the only place that can be fixed for everybody at once.
 *
 * Derived from NEXT_PUBLIC_APP_URL so there is still exactly one place the live
 * address is written down. Empty for local development, which redirects nothing.
 */
const canonicalHost = (() => {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").host;
    return host.startsWith("www.") || host.startsWith("localhost") ? "" : host;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: firebasePublicEnv,
  // Zoom's Meeting SDK is loaded from source.zoom.us at runtime rather than npm:
  // @zoom/meetingsdk pins react@18.2.0 as a peer dependency and would conflict
  // with React 19. See components/player/ZoomEmbed.tsx.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    if (!canonicalHost) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: `www.${canonicalHost}` }],
        destination: `https://${canonicalHost}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
