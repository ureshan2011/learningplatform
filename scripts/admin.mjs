#!/usr/bin/env node
/**
 * Setup CLI for a fresh Firebase project.
 *
 * Plain Node + firebase-admin so it needs no extra toolchain:
 *   node scripts/admin.mjs seed
 *   node scripts/admin.mjs make-teacher +94771234567
 *   node scripts/admin.mjs release-devices +94771234567
 *
 * Reads credentials from .env.local.
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

loadEnvLocal();

const app = initializeApp({
  credential: cert({
    projectId: required("FIREBASE_PROJECT_ID"),
    clientEmail: required("FIREBASE_CLIENT_EMAIL"),
    privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);
const auth = getAuth(app);
const TENANT = process.env.NEXT_PUBLIC_TENANT_ID || "default";

const [command, arg] = process.argv.slice(2);

switch (command) {
  case "seed":
    await seed();
    break;
  case "make-teacher":
    await makeTeacher(arg);
    break;
  case "release-devices":
    await releaseDevices(arg);
    break;
  default:
    console.log("Usage: node scripts/admin.mjs <seed|make-teacher|release-devices> [phone]");
    process.exit(1);
}
process.exit(0);

async function seed() {
  const subjects = [
    {
      id: "al-ict",
      tenantId: TENANT,
      name: "A/L ICT",
      grade: "AL",
      medium: "sinhala",
      priceLKR: 2500,
      description: "Grade 12-13 ICT, theory and structured essay technique.",
      syllabusTopics: [
        "Concepts of ICT",
        "Fundamentals of computer systems",
        "Data representation",
        "Logic gates and Boolean algebra",
        "Operating systems",
        "Data communication and networking",
        "System analysis and design",
        "Database management",
        "Programming",
        "Web development",
        "ICT in business",
        "New trends",
      ],
      active: true,
    },
  ];

  const batch = db.batch();
  for (const subject of subjects) {
    batch.set(db.collection("subjects").doc(subject.id), subject, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${subjects.length} subjects into tenant "${TENANT}".`);
}

async function makeTeacher(phone) {
  if (!phone) throw new Error("Pass the teacher's phone in E.164, e.g. +94771234567");

  const record = await auth.getUserByPhoneNumber(phone);
  const ref = db.collection("users").doc(record.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("That user has not signed in yet. Sign in once, then re-run this.");
  }

  await ref.update({ role: "teacher" });
  const claims = record.customClaims ?? {};
  await auth.setCustomUserClaims(record.uid, { ...claims, role: "teacher", tenantId: TENANT });
  // Force a fresh token so the new role takes effect on the next sign-in.
  await auth.revokeRefreshTokens(record.uid);

  console.log(`${phone} (${record.uid}) is now a teacher. Sign in again to pick up the role.`);
}

async function releaseDevices(phone) {
  if (!phone) throw new Error("Pass the student's phone in E.164, e.g. +94771234567");

  const record = await auth.getUserByPhoneNumber(phone);
  await db.collection("users").doc(record.uid).update({ devices: [] });
  await auth.revokeRefreshTokens(record.uid);
  console.log(`Cleared all bound devices for ${phone}. They can sign in fresh.`);
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

/** Minimal .env.local parser — avoids pulling in dotenv for one script. */
function loadEnvLocal() {
  let raw;
  try {
    raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return; // fall back to the ambient environment
  }
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (process.env[key]) continue;
    process.env[key] = value.trim().replace(/^["']|["']$/g, "");
  }
}
