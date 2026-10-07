import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getApiUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Akses khusus Kepala Panti." }, { status: 403 });
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.id));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Akses khusus Kepala Panti." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "admin" ? "admin" : "pengurus";

  if (!name) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Kata sandi minimal 6 karakter." },
      { status: 400 }
    );
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const inserted = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password), role })
    .returning();

  const created = inserted[0];
  return NextResponse.json(
    { id: created.id, name: created.name, email: created.email, role: created.role },
    { status: 201 }
  );
}
