/**
 * Which optional services are configured.
 *
 * The platform is built to be stood up one service at a time: create a Firebase
 * project, deploy, and the app is live — then add Zoom, payments and file
 * storage when you are ready for each.
 *
 * These checks are what make that work. Without them, an unconfigured service
 * throws from `requireServerEnv` and the page 500s, which looks like a broken
 * app rather than an unfinished setup.
 *
 * Safe to import from client components: it reads `NEXT_PUBLIC_*` values
 * directly and only ever asks the *server* whether secrets are present, never
 * exposing them.
 */

export type Feature = "zoom" | "payhere" | "r2";

/** Server secrets are absent in the browser, so presence checks run server-side. */
function serverHas(name: string): boolean {
  if (typeof window !== "undefined") return false;
  return Boolean(process.env[name]);
}

/**
 * Live classes. Needs both Zoom apps: Server-to-Server OAuth (create meetings,
 * register students) and Meeting SDK (join in the browser).
 */
export function zoomConfigured(): boolean {
  return (
    serverHas("ZOOM_ACCOUNT_ID") &&
    serverHas("ZOOM_S2S_CLIENT_ID") &&
    serverHas("ZOOM_S2S_CLIENT_SECRET") &&
    serverHas("ZOOM_HOST_USER_ID") &&
    serverHas("ZOOM_SDK_SECRET") &&
    Boolean(process.env.NEXT_PUBLIC_ZOOM_SDK_KEY)
  );
}

/**
 * Card payments, configured through the environment.
 *
 * Not the whole answer: credentials can also be entered in the teacher console
 * (see `getPayHereConfig`), which is the only route available to an owner with
 * no command line. Anything deciding whether to *offer* card payment must use
 * that async check instead — this one stays for the sync feature listing.
 */
export function payhereConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID) &&
    serverHas("PAYHERE_MERCHANT_SECRET")
  );
}

/** Notes, past papers and replays. */
export function r2Configured(): boolean {
  return (
    serverHas("R2_ACCOUNT_ID") &&
    serverHas("R2_ACCESS_KEY_ID") &&
    serverHas("R2_SECRET_ACCESS_KEY") &&
    serverHas("R2_BUCKET")
  );
}

export function isConfigured(feature: Feature): boolean {
  switch (feature) {
    case "zoom":
      return zoomConfigured();
    case "payhere":
      return payhereConfigured();
    case "r2":
      return r2Configured();
  }
}

/** What a student or teacher sees when a service has not been set up yet. */
export const FEATURE_LABEL: Record<Feature, string> = {
  zoom: "Live classes",
  payhere: "Card payments",
  r2: "Notes & past papers",
};

export const FEATURE_HINT: Record<Feature, string> = {
  zoom: "Zoom is not connected yet, so classes cannot be scheduled or joined.",
  payhere: "Card payment is not connected yet. Students can still send a bank deposit slip.",
  r2: "File storage is not connected yet, so notes and past papers cannot be downloaded.",
};
