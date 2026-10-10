import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { count } from "drizzle-orm";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      checks.database = { ok: false, detail: "DATABASE_URL is not set" };
    } else {
      checks.database = { ok: true, detail: `DATABASE_URL is set (ends with: ...${databaseUrl.slice(-20)})` };
    }

    try {
      await db.select({ count: count() }).from(users).limit(1);
      checks.query = { ok: true, detail: "Database query succeeded" };
    } catch (queryErr) {
      const qErrMsg = queryErr instanceof Error ? queryErr.message : String(queryErr);
      checks.query = { ok: false, detail: `Query failed: ${qErrMsg}` };
    }
  } catch (setupErr) {
    const setupErrMsg = setupErr instanceof Error ? setupErr.message : String(setupErr);
    checks.database = { ok: false, detail: `Database setup failed: ${setupErrMsg}` };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? "ok" : "error", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
