import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionCookie, toSafeUser, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    await createSessionCookie(user.id);
    return NextResponse.json({ user: toSafeUser(user) });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error("[auth/login] Error:", errMsg, errStack);

    let status = 500;
    let message = "Terjadi kesalahan server.";

    if (errMsg.includes("DATABASE_URL is required")) {
      status = 503;
      message = "DATABASE_URL belum dikonfigurasi.";
    } else if (errMsg.includes("ENOTFOUND") || errMsg.includes("ECONNREFUSED") || errMsg.includes("ETIMEDOUT")) {
      status = 503;
      message = "Gagal terhubung ke database.";
    } else if (errMsg.includes("relation") && errMsg.includes("does not exist")) {
      status = 500;
      message = "Schema database belum di-push. Jalankan: npm run db:push";
    }

    return NextResponse.json({ error: message, detail: errMsg }, { status });
  }
}
