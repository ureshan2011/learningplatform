import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth/session";
import { listSubjects } from "@/lib/queries";
import { getLedger, ledgerToCsv } from "@/lib/payments/ledger";
import { colomboDateString } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The whole payment ledger as a CSV download.
 *
 * A browser-only owner still has to hand something to an accountant, and
 * "log in and look at my dashboard" is not that. One file, every payment,
 * openable in Excel — which is what a Sri Lankan accountant will ask for.
 */
export async function GET() {
  try {
    await requireTeacher();
  } catch (err) {
    const status = (err as Error).message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "not_permitted" }, { status });
  }

  const subjects = await listSubjects();
  const { rows } = await getLedger(subjects);
  // Excel on a Windows machine reads a UTF-8 CSV as Latin-1 unless it finds a
  // byte-order mark, which turns every Sinhala name and "Rs" sign into
  // mojibake. The BOM costs three bytes and prevents that.
  const csv = `﻿${ledgerToCsv(rows)}`;

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ict-campus-payments-${colomboDateString(Date.now())}.csv"`,
      "cache-control": "no-store",
    },
  });
}
