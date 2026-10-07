import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getApiUser, hashPassword } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Akses khusus Kepala Panti." }, { status: 403 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }
  if (idNum === user.id) {
    return NextResponse.json({ error: "Anda tidak dapat mengubah akun sendiri." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (body.role === "admin" || body.role === "pengurus") patch.role = body.role;
  if (typeof body.password === "string" && body.password.length >= 6) {
    patch.passwordHash = await hashPassword(body.password);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui." }, { status: 400 });
  }

  const updated = await db.update(users).set(patch).where(eq(users.id, idNum)).returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }
  const u = updated[0];
  return NextResponse.json({ id: u.id, name: u.name, email: u.email, role: u.role });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Akses khusus Kepala Panti." }, { status: 403 });
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }
  if (idNum === user.id) {
    return NextResponse.json({ error: "Anda tidak dapat menghapus akun sendiri." }, { status: 400 });
  }

  const deleted = await db.delete(users).where(eq(users.id, idNum)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
