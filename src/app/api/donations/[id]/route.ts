import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { getApiUser } from "@/lib/auth";

const CATEGORIES = ["zakat", "infak", "sedekah", "wakaf"];
const DONATION_TYPES = ["uang", "barang"];
const DONOR_TYPES = ["perorangan", "organisasi"];

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
  if (typeof body.donorName === "string" && body.donorName.trim()) {
    patch.donorName = body.donorName.trim();
  }
  if (body.donorType && DONOR_TYPES.includes(body.donorType)) patch.donorType = body.donorType;
  if (body.category && CATEGORIES.includes(body.category)) patch.category = body.category;
  if (body.donationType && DONATION_TYPES.includes(body.donationType)) {
    patch.donationType = body.donationType;
  }
  if ("amount" in body) patch.amount = Math.max(0, Number(body.amount) || 0);
  if ("itemDescription" in body) patch.itemDescription = body.itemDescription?.trim() || null;
  if (body.donationDate) patch.donationDate = body.donationDate;
  if ("receivedBy" in body) patch.receivedBy = body.receivedBy?.trim() || user.name;
  if ("notes" in body) patch.notes = body.notes?.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui." }, { status: 400 });
  }

  const updated = await db
    .update(donations)
    .set(patch)
    .where(eq(donations.id, idNum))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Donasi tidak ditemukan." }, { status: 404 });
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

  const deleted = await db.delete(donations).where(eq(donations.id, idNum)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Donasi tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
