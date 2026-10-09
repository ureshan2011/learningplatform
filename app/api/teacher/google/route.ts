import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonBody, teacherRoute } from "@/lib/exam-pack/guard";
import { clearGoogleConnection, getGoogleSettings, saveGoogleClient } from "@/lib/google/settings";
import { revokeToken } from "@/lib/google/oauth";

export const runtime = "nodejs";

const bodySchema = z.object({
  clientId: z
    .string()
    .trim()
    .min(10)
    .max(200)
    .regex(/\.apps\.googleusercontent\.com$/, "Client IDs end in .apps.googleusercontent.com"),
  clientSecret: z.string().trim().min(10).max(200),
});

/**
 * Saves the OAuth client the owner created in the Google Cloud console.
 *
 * Entered here for the reason PayHere's credentials are: setting a secret on
 * App Hosting needs a command line this platform's owner does not have. The
 * secret is stored server-read-only (`settings/*` in firestore.rules) and is
 * never sent back to a browser — the console only ever shows whether one is set.
 */
export async function POST(req: NextRequest) {
  const gate = await teacherRoute();
  if (gate.response) return gate.response;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", message: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  await saveGoogleClient(parsed.data);
  return NextResponse.json({ ok: true });
}

/** Disconnects the Google account. Revokes the token at Google too, so nothing is left behind. */
export async function DELETE() {
  const gate = await teacherRoute();
  if (gate.response) return gate.response;

  const settings = await getGoogleSettings();
  if (settings.refreshToken) await revokeToken(settings.refreshToken);
  await clearGoogleConnection();
  return NextResponse.json({ ok: true });
}
