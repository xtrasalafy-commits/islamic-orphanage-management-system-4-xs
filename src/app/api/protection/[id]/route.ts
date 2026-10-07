import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { protectionCases } from "@/db/schema";
import { getApiUser } from "@/lib/auth";

const CASE_TYPES = [
  "perundungan",
  "kekerasan",
  "penelantaran",
  "kesehatan",
  "eksploitasi",
  "hak_asuh",
  "lainnya",
];
const SEVERITIES = ["ringan", "sedang", "berat"];
const STATUSES = ["terbuka", "ditangani", "selesai", "dirujuk"];

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
  if (body.caseType && CASE_TYPES.includes(body.caseType)) patch.caseType = body.caseType;
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.description === "string" && body.description.trim()) {
    patch.description = body.description.trim();
  }
  if (body.severity && SEVERITIES.includes(body.severity)) patch.severity = body.severity;
  if (body.status && STATUSES.includes(body.status)) patch.status = body.status;
  if (body.reportDate) patch.reportDate = body.reportDate;
  if ("reportSource" in body) patch.reportSource = body.reportSource?.trim() || null;
  if ("handledBy" in body) patch.handledBy = body.handledBy?.trim() || null;
  if ("resolution" in body) patch.resolution = body.resolution?.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui." }, { status: 400 });
  }

  const updated = await db
    .update(protectionCases)
    .set(patch)
    .where(eq(protectionCases.id, idNum))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: "Kasus tidak ditemukan." }, { status: 404 });
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

  const deleted = await db.delete(protectionCases).where(eq(protectionCases.id, idNum)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Kasus tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
