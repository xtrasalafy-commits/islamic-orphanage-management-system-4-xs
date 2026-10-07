import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { needs } from "@/db/schema";
import { getApiUser } from "@/lib/auth";

const CATEGORIES = ["pangan", "sandang", "pendidikan", "kesehatan", "papan", "ibadah"];
const STATUSES = ["terpenuhi", "direncanakan"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (body.category && CATEGORIES.includes(body.category)) patch.category = body.category;
  if (typeof body.description === "string" && body.description.trim()) {
    patch.description = body.description.trim();
  }
  if ("amount" in body) patch.amount = Math.max(0, Number(body.amount) || 0);
  if (body.needDate) patch.needDate = body.needDate;
  if (body.status && STATUSES.includes(body.status)) patch.status = body.status;
  if ("fulfilledBy" in body) patch.fulfilledBy = body.fulfilledBy?.trim() || user.name;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui." }, { status: 400 });
  }

  const updated = await db.update(needs).set(patch).where(eq(needs.id, idNum)).returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Data kebutuhan tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya Kepala Panti yang dapat menghapus data." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const deleted = await db.delete(needs).where(eq(needs.id, idNum)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Data kebutuhan tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
