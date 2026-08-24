#!/usr/bin/env node
/**
 * One-command setup.
 *
 *   npm run setup
 *
 * Replaces five separate commands: fetches your Firebase web config, reads your
 * service account key, writes .env.local, deploys the security rules, and seeds
 * the two ICT subjects.
 *
 * Safe to re-run — it asks before overwriting .env.local, and seeding merges
 * rather than replacing.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });
const ENV_PATH = new URL("../.env.local", import.meta.url);
const TOTAL = 5;

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

function step(n, text) {
  console.log(`\n${c.bold(`[${n}/${TOTAL}]`)} ${text}`);
}

/** Runs the firebase CLI via npx so no global install is needed. */
function firebase(args, { capture = false } = {}) {
  return execFileSync("npx", ["--yes", "firebase-tools@latest", ...args], {
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
  });
}

async function main() {
  console.log(c.bold("\nICT Class — setup\n"));
  console.log("First, in the Firebase console (console.firebase.google.com):");
  console.log("  1. Create a project");
  console.log("  2. Authentication → Sign-in method → enable " + c.bold("Phone"));
  console.log("  3. Create " + c.bold("Firestore") + " and " + c.bold("Realtime Database"));
  console.log("  4. Upgrade to the " + c.bold("Blaze") + " plan " + c.dim("(stays free within quotas)"));
  console.log("  5. Add a " + c.bold("Web app") + " to the project");
  console.log(
    "  6. Project settings → Service accounts → " +
      c.bold("Generate new private key") +
      c.dim(" (downloads a .json file)"),
  );

  const ready = await rl.question("\nDone all six? [y/N] ");
  if (!/^y/i.test(ready.trim())) {
    console.log("\nNo problem — run " + c.bold("npm run setup") + " again when ready.");
    return;
  }

  // --- 1. Sign in and select the project -----------------------------------
  step(1, "Signing in to Firebase");
  try {
    firebase(["login"]);
  } catch {
    console.log(c.yellow("Already signed in, or login was skipped. Continuing."));
  }

  const projectId = (await rl.question("\nFirebase project ID: ")).trim();
  if (!projectId) throw new Error("A project ID is required.");
  firebase(["use", projectId]);

  // --- 2. Web config --------------------------------------------------------
  step(2, "Reading your Firebase web config");
  const webConfig = readWebConfig();
  console.log(c.green("Found web app: ") + webConfig.appId);

  // --- 3. Service account ---------------------------------------------------
  step(3, "Reading your service account key");
  console.log(
    c.dim("Local development only — in production App Hosting uses the\n") +
      c.dim("service account automatically and no key is stored."),
  );
  const serviceAccount = await readServiceAccount();

  await writeEnvLocal(projectId, webConfig, serviceAccount);

  // --- 4. Security rules ----------------------------------------------------
  step(4, "Deploying security rules");
  firebase(["deploy", "--only", "firestore:rules,firestore:indexes,database,storage"]);

  // --- 5. Seed --------------------------------------------------------------
  if (serviceAccount) {
    step(5, "Creating the O/L ICT and A/L ICT subjects");
    execFileSync("node", ["scripts/admin.mjs", "seed"], { stdio: "inherit" });
  } else {
    step(5, c.yellow("Skipping subject seeding — no service account key given"));
    console.log("Add the key to .env.local later, then: " + c.bold("node scripts/admin.mjs seed"));
  }

  printNextSteps(serviceAccount);
}

function readWebConfig() {
  try {
    const raw = firebase(["apps:sdkconfig", "WEB", "--json"], { capture: true });
    const parsed = JSON.parse(raw);
    const config = parsed.result?.sdkConfig ?? parsed.sdkConfig;
    if (!config?.apiKey) throw new Error("no sdkConfig in the CLI response");
    return config;
  } catch (err) {
    console.error(
      c.red("\nCould not read the web app config.") +
        "\nMake sure you added a Web app to the project (step 5 above).",
    );
    throw err;
  }
}

/** Reads client_email and private_key out of the downloaded service account JSON. */
async function readServiceAccount() {
  const path = (
    await rl.question("\nPath to the downloaded .json key " + c.dim("(Enter to skip): "))
  )
    .trim()
    // Drag-and-drop into a terminal often wraps the path in quotes.
    .replace(/^['"]|['"]$/g, "");

  if (!path) return null;

  if (!existsSync(path)) {
    console.log(c.yellow(`No file at ${path} — skipping.`));
    return null;
  }

  try {
    const json = JSON.parse(readFileSync(path, "utf8"));
    if (!json.client_email || !json.private_key) {
      console.log(c.yellow("That file is missing client_email/private_key — skipping."));
      return null;
    }
    console.log(c.green("Read key for ") + json.client_email);
    return json;
  } catch {
    console.log(c.yellow("Could not parse that file as JSON — skipping."));
    return null;
  }
}

async function writeEnvLocal(projectId, webConfig, serviceAccount) {
  if (existsSync(ENV_PATH) && readFileSync(ENV_PATH, "utf8").trim()) {
    // Never silently clobber a file that may already hold working secrets.
    const overwrite = await rl.question("\n.env.local already exists. Overwrite? [y/N] ");
    if (!/^y/i.test(overwrite.trim())) {
      console.log(c.yellow("Kept your existing .env.local."));
      return;
    }
  }

  const lines = [
    "# Written by npm run setup. Safe to edit.",
    "NEXT_PUBLIC_APP_URL=http://localhost:3000",
    "NEXT_PUBLIC_TENANT_ID=default",
    "",
    `NEXT_PUBLIC_FIREBASE_API_KEY=${webConfig.apiKey}`,
    `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${webConfig.authDomain}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${webConfig.projectId}`,
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${webConfig.storageBucket}`,
    `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${webConfig.messagingSenderId}`,
    `NEXT_PUBLIC_FIREBASE_APP_ID=${webConfig.appId}`,
    `NEXT_PUBLIC_FIREBASE_DATABASE_URL=${
      webConfig.databaseURL ?? `https://${projectId}-default-rtdb.firebaseio.com`
    }`,
    "",
    "# Admin credentials — local development only. Production uses the",
    "# App Hosting service account, so no key is stored there.",
    `FIREBASE_PROJECT_ID=${projectId}`,
    `FIREBASE_CLIENT_EMAIL=${serviceAccount?.client_email ?? ""}`,
    // Escape newlines: .env cannot hold a literal multi-line value.
    `FIREBASE_PRIVATE_KEY="${(serviceAccount?.private_key ?? "").replace(/\n/g, "\\n")}"`,
    "",
    "# Zoom, PayHere and Cloudflare R2 get added later — just ask in chat.",
    "",
  ];

  writeFileSync(ENV_PATH, lines.join("\n"));
  console.log(c.green("Wrote .env.local"));
}

function printNextSteps(serviceAccount) {
  console.log(c.green("\n\nSetup complete.\n"));
  console.log(c.bold("Run it locally"));
  console.log("  npm run dev          " + c.dim("→ http://localhost:3000"));
  if (serviceAccount) {
    console.log("  Sign in with your phone, then make yourself the teacher:");
    console.log("  node scripts/admin.mjs make-teacher +94771234567");
  }
  console.log(c.bold("\nGo live"));
  console.log("  Firebase console → App Hosting → connect this GitHub repo.");
  console.log(c.dim("  Nothing to configure — it deploys as-is.\n"));
  console.log(
    c.dim("Zoom, payments and file storage are not set up yet, and the app\n") +
      c.dim("says so where they would appear. Ask in chat to add each one.\n"),
  );
}

try {
  await main();
} catch (err) {
  console.error(c.red("\nSetup failed: ") + (err?.message ?? err));
  process.exitCode = 1;
} finally {
  rl.close();
}
