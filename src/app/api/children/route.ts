import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { children } from "@/db/schema";
import { getApiUser } from "@/lib/auth";

const ORPHAN_STATUSES = ["yatim", "piatu", "yatim_piatu", "dhuafa"];
const CHILD_STATUSES = ["aktif", "adopsi", "keluar", "mandiri"];
const GENDERS = ["L", "P"];

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const orphanStatus = sp.get("orphanStatus");
  const status = sp.get("status");

  const filters = [];
  if (q) {
    filters.push(or(ilike(children.name, `%${q}%`), ilike(children.school ?? "", `%${q}%`)));
  }
  if (orphanStatus && ORPHAN_STATUSES.includes(orphanStatus)) {
    filters.push(eq(children.orphanStatus, orphanStatus as never));
  }
  if (status && CHILD_STATUSES.includes(status)) {
    filters.push(eq(children.status, status as never));
  }

  const rows = await db
    .select()
    .from(children)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(children.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Nama anak wajib diisi." }, { status: 400 });
  if (!GENDERS.includes(body.gender)) {
    return NextResponse.json({ error: "Jenis kelamin tidak valid." }, { status: 400 });
  }
  if (!body.birthDate) {
    return NextResponse.json({ error: "Tanggal lahir wajib diisi." }, { status: 400 });
  }
  if (!ORPHAN_STATUSES.includes(body.orphanStatus)) {
    return NextResponse.json({ error: "Status yatim/piatu tidak valid." }, { status: 400 });
  }
  if (!body.admissionDate) {
    return NextResponse.json({ error: "Tanggal masuk wajib diisi." }, { status: 400 });
  }

  const inserted = await db
    .insert(children)
    .values({
      name,
      gender: body.gender,
      birthDate: body.birthDate,
      birthPlace: body.birthPlace?.trim() || null,
      orphanStatus: body.orphanStatus,
      admissionDate: body.admissionDate,
      guardianName: body.guardianName?.trim() || null,
      guardianPhone: body.guardianPhone?.trim() || null,
      address: body.address?.trim() || null,
      school: body.school?.trim() || null,
      healthNotes: body.healthNotes?.trim() || null,
      notes: body.notes?.trim() || null,
      status: CHILD_STATUSES.includes(body.status) ? body.status : "aktif",
    })
    .returning();

  return NextResponse.json(inserted[0], { status: 201 });
}
