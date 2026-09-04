import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminAuth, col } from "@/lib/firebase/admin";
import { requireTeacher, type SessionUser } from "@/lib/auth/session";
import { releaseDevice, revokeAllSessions } from "@/lib/auth/devices";
import { publicEnv } from "@/lib/env";
import type { Enrollment, Payment, Role, User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One person, in full, plus the actions a staff member can take on them.
 *
 * The detail read is deliberately per-user rather than folded into the
 * directory listing: enrollments and payments are two extra queries each, and
 * running them for three hundred rows to render a table nobody has expanded is
 * the kind of thing that turns a free Firestore tier into a bill.
 */

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_role"), role: z.enum(["student", "teacher", "admin", "parent"]) }),
  z.object({ action: z.literal("disable"), reason: z.string().trim().max(200).optional() }),
  z.object({ action: z.literal("enable") }),
  z.object({ action: z.literal("sign_out") }),
  z.object({ action: z.literal("release_devices"), deviceHash: z.string().trim().max(64).optional() }),
]);

/**
 * Changing a role or switching an account off is an access decision, so it is
 * admin-only — a second teacher account added later must not be able to
 * promote itself. Freeing a device or signing someone out is day-to-day class
 * admin, and any teacher can do it.
 */
function requiresAdmin(action: string): boolean {
  return action === "set_role" || action === "disable" || action === "enable";
}

async function staffOr(res: { status: number }): Promise<SessionUser | null> {
  try {
    return await requireTeacher();
  } catch (err) {
    res.status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const carrier = { status: 401 };
  const staff = await staffOr(carrier);
  if (!staff) return NextResponse.json({ error: "not_permitted" }, { status: carrier.status });

  const { uid } = await params;
  const snap = await col.users().doc(uid).get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const user = snap.data() as User;

  // Single equality filters only — narrowed and sorted in memory so no
  // composite index is needed. See the note at the top of lib/queries.ts.
  const [enrollSnap, paySnap] = await Promise.all([
    col.enrollments().where("uid", "==", uid).limit(50).get(),
    col.payments().where("uid", "==", uid).limit(100).get(),
  ]);

  const payments = paySnap.docs
    .map((d) => d.data() as Payment)
    .sort((a, b) => (b.paidAt ?? b.createdAt) - (a.paidAt ?? a.createdAt));

  return NextResponse.json({
    ok: true,
    user: {
      uid: user.uid,
      name: user.name,
      phone: user.phone,
      role: user.role,
      medium: user.medium,
      school: user.school,
      district: user.district,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referralRewarded: Boolean(user.referralRewarded),
      parentUid: user.parentUid,
      childUids: user.childUids ?? [],
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      lastDeviceSwapAt: user.lastDeviceSwapAt,
      disabled: Boolean(user.disabled),
      disabledReason: user.disabledReason,
      disabledAt: user.disabledAt,
      roleUpdatedBy: user.roleUpdatedBy,
      roleUpdatedAt: user.roleUpdatedAt,
      devices: (user.devices ?? []).sort((a, b) => b.lastSeenAt - a.lastSeenAt),
    },
    enrollments: enrollSnap.docs
      .map((d) => d.data() as Enrollment)
      .sort((a, b) => b.currentPeriodEnd - a.currentPeriodEnd),
    payments: payments.slice(0, 40),
    totalPaidLKR: payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amountLKR, 0),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const carrier = { status: 401 };
  const staff = await staffOr(carrier);
  if (!staff) return NextResponse.json({ error: "not_permitted" }, { status: carrier.status });

  let body: z.infer<typeof actionSchema>;
  try {
    body = actionSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (requiresAdmin(body.action) && staff.role !== "admin") {
    return NextResponse.json({ error: "admin_only" }, { status: 403 });
  }

  const { uid } = await params;
  const ref = col.users().doc(uid);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const target = snap.data() as User;

  switch (body.action) {
    case "set_role": {
      // Nobody may demote themselves. An admin who accidentally makes their own
      // account a student has locked themselves out of the only screen that
      // could undo it, and the recovery is a command line they do not have.
      if (uid === staff.uid && body.role !== "admin") {
        return NextResponse.json({ error: "cannot_demote_self" }, { status: 400 });
      }
      if (target.role === "admin" && body.role !== "admin" && (await isLastAdmin(uid))) {
        return NextResponse.json({ error: "last_admin" }, { status: 400 });
      }

      await ref.update({
        role: body.role,
        roleUpdatedBy: staff.uid,
        roleUpdatedAt: Date.now(),
      });
      await setClaims(uid, body.role, target.tenantId);
      // Their current session still carries the old role in its claims, and
      // access rules are evaluated from claims. Signing them out is what makes
      // the change take effect rather than take effect eventually.
      await revokeAllSessions(uid);
      return NextResponse.json({ ok: true, role: body.role });
    }

    case "disable": {
      if (uid === staff.uid) {
        return NextResponse.json({ error: "cannot_disable_self" }, { status: 400 });
      }
      await ref.update({
        disabled: true,
        disabledReason: body.reason ?? "",
        disabledBy: staff.uid,
        disabledAt: Date.now(),
      });
      await revokeAllSessions(uid);
      return NextResponse.json({ ok: true });
    }

    case "enable": {
      await ref.update({
        disabled: false,
        disabledReason: "",
        disabledBy: staff.uid,
        disabledAt: Date.now(),
      });
      return NextResponse.json({ ok: true });
    }

    case "sign_out": {
      await revokeAllSessions(uid);
      return NextResponse.json({ ok: true });
    }

    case "release_devices": {
      const devices = target.devices ?? [];
      const targets = body.deviceHash ? [body.deviceHash] : devices.map((d) => d.deviceHash);
      for (const hash of targets) await releaseDevice(uid, hash);
      return NextResponse.json({ ok: true, released: targets.length });
    }
  }
}

/** Guards the platform against ending up with no admin and no browser route back to one. */
async function isLastAdmin(uid: string): Promise<boolean> {
  const snap = await col.users().where("role", "==", "admin").limit(5).get();
  const admins = snap.docs
    .map((d) => d.data() as User)
    .filter((u) => u.tenantId === publicEnv.tenantId && u.uid !== uid);
  return admins.length === 0;
}

async function setClaims(uid: string, role: Role, tenantId: string): Promise<void> {
  const record = await adminAuth().getUser(uid);
  await adminAuth().setCustomUserClaims(uid, { ...(record.customClaims ?? {}), role, tenantId });
}
