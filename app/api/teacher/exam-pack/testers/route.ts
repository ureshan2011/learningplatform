import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { jsonBody, teacherRoute } from "@/lib/exam-pack/guard";
import { grantTestAccess, isTester, removeTestAccess, resetTestData } from "@/lib/exam-pack/testers";

export const runtime = "nodejs";

const uid = z.string().min(1).max(128);

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("grant"), phone: z.string().trim().min(6).max(20) }),
  z.object({ action: z.literal("reset"), uid }),
  z.object({ action: z.literal("remove"), uid }),
  /** The teacher's own papers and booking — from rehearsing on the teacher account itself. */
  z.object({ action: z.literal("reset_me") }),
]);

const GRANT_ERRORS: Record<string, string> = {
  invalid_phone: "That is not a Sri Lankan mobile number.",
  not_found: "No account has that number yet. Sign in with it once first, then try again.",
  is_staff: "That number is a teacher or admin account — it already sees everything. Use a student number.",
  already_buyer: "That number has bought the pack. Test access is only for your own test accounts.",
};

/**
 * Test accounts: give one the pack without paying, put its papers back to
 * the start, or take the pack away. Only ever acts on accounts whose access is
 * a test grant — a real buyer cannot be reset or removed from here.
 */
export async function POST(req: NextRequest) {
  const gate = await teacherRoute();
  if (gate.response) return gate.response;

  const parsed = bodySchema.safeParse(await jsonBody(req));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const body = parsed.data;

  switch (body.action) {
    case "grant": {
      const outcome = await grantTestAccess(body.phone);
      return outcome.ok
        ? NextResponse.json({ ok: true, name: outcome.name, until: outcome.until })
        : NextResponse.json({ error: outcome.reason, message: GRANT_ERRORS[outcome.reason] }, { status: 409 });
    }
    case "reset":
    case "remove": {
      if (!(await isTester(body.uid))) {
        return NextResponse.json(
          { error: "not_a_tester", message: "That account is not a test account." },
          { status: 409 },
        );
      }
      if (body.action === "reset") await resetTestData(body.uid);
      else await removeTestAccess(body.uid);
      return NextResponse.json({ ok: true });
    }
    case "reset_me":
      await resetTestData(gate.user.uid);
      return NextResponse.json({ ok: true });
  }
}
