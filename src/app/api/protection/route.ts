import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, protectionCases } from "@/db/schema";
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

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const caseType = sp.get("caseType");

  const filters = [];
  if (status && STATUSES.includes(status)) {
    filters.push(eq(protectionCases.status, status as never));
  }
  if (caseType && CASE_TYPES.includes(caseType)) {
    filters.push(eq(protectionCases.caseType, caseType as never));
  }

  const rows = await db
    .select({
      id: protectionCases.id,
      childId: protectionCases.childId,
      caseType: protectionCases.caseType,
      title: protectionCases.title,
      description: protectionCases.description,
      severity: protectionCases.severity,
      status: protectionCases.status,
      reportDate: protectionCases.reportDate,
      reportSource: protectionCases.reportSource,
      handledBy: protectionCases.handledBy,
      resolution: protectionCases.resolution,
      createdAt: protectionCases.createdAt,
      childName: children.name,
    })
    .from(protectionCases)
    .innerJoin(children, eq(protectionCases.childId, children.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(protectionCases.reportDate), desc(protectionCases.id));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const childId = Number(body.childId);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: "Pilih anak asuh terlebih dahulu." }, { status: 400 });
  }
  const childExists = await db
    .select({ id: children.id })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);
  if (childExists.length === 0) {
    return NextResponse.json({ error: "Anak asuh tidak ditemukan." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!title) return NextResponse.json({ error: "Judul kasus wajib diisi." }, { status: 400 });
  if (!description) {
    return NextResponse.json({ error: "Deskripsi kasus wajib diisi." }, { status: 400 });
  }
  if (!CASE_TYPES.includes(body.caseType)) {
    return NextResponse.json({ error: "Jenis kasus tidak valid." }, { status: 400 });
  }
  if (!SEVERITIES.includes(body.severity)) {
    return NextResponse.json({ error: "Tingkat keparahan tidak valid." }, { status: 400 });
  }
  if (!body.reportDate) {
    return NextResponse.json({ error: "Tanggal lapor wajib diisi." }, { status: 400 });
  }

  const inserted = await db
    .insert(protectionCases)
    .values({
      childId,
      caseType: body.caseType,
      title,
      description,
      severity: body.severity,
      status: STATUSES.includes(body.status) ? body.status : "terbuka",
      reportDate: body.reportDate,
      reportSource: body.reportSource?.trim() || null,
      handledBy: body.handledBy?.trim() || null,
      resolution: body.resolution?.trim() || null,
    })
    .returning();

  return NextResponse.json(inserted[0], { status: 201 });
}
