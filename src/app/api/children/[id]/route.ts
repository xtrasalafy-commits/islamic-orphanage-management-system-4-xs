import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, needs, protectionCases } from "@/db/schema";
import { getApiUser } from "@/lib/auth";

const ORPHAN_STATUSES = ["yatim", "piatu", "yatim_piatu", "dhuafa"];
const CHILD_STATUSES = ["aktif", "adopsi", "keluar", "mandiri"];
const GENDERS = ["L", "P"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const rows = await db.select().from(children).where(eq(children.id, idNum)).limit(1);
  const child = rows[0];
  if (!child) return NextResponse.json({ error: "Data anak tidak ditemukan." }, { status: 404 });

  const [childNeeds, childCases] = await Promise.all([
    db.select().from(needs).where(eq(needs.childId, idNum)).orderBy(desc(needs.needDate)),
    db
      .select()
      .from(protectionCases)
      .where(eq(protectionCases.childId, idNum))
      .orderBy(desc(protectionCases.reportDate)),
  ]);

  return NextResponse.json({ child, needs: childNeeds, cases: childCases });
}

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
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (body.gender && GENDERS.includes(body.gender)) patch.gender = body.gender;
  if (body.birthDate) patch.birthDate = body.birthDate;
  if ("birthPlace" in body) patch.birthPlace = body.birthPlace?.trim() || null;
  if (body.orphanStatus && ORPHAN_STATUSES.includes(body.orphanStatus)) {
    patch.orphanStatus = body.orphanStatus;
  }
  if (body.admissionDate) patch.admissionDate = body.admissionDate;
  if ("guardianName" in body) patch.guardianName = body.guardianName?.trim() || null;
  if ("guardianPhone" in body) patch.guardianPhone = body.guardianPhone?.trim() || null;
  if ("address" in body) patch.address = body.address?.trim() || null;
  if ("school" in body) patch.school = body.school?.trim() || null;
  if ("healthNotes" in body) patch.healthNotes = body.healthNotes?.trim() || null;
  if ("notes" in body) patch.notes = body.notes?.trim() || null;
  if (body.status && CHILD_STATUSES.includes(body.status)) patch.status = body.status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui." }, { status: 400 });
  }

  const updated = await db
    .update(children)
    .set(patch)
    .where(eq(children.id, idNum))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Data anak tidak ditemukan." }, { status: 404 });
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

  const deleted = await db.delete(children).where(eq(children.id, idNum)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Data anak tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
