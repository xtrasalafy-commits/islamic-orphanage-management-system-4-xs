import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, needs } from "@/db/schema";
import { getApiUser } from "@/lib/auth";

const CATEGORIES = ["pangan", "sandang", "pendidikan", "kesehatan", "papan", "ibadah"];
const STATUSES = ["terpenuhi", "direncanakan"];

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const childId = sp.get("childId");
  const category = sp.get("category");
  const status = sp.get("status");

  const filters = [];
  if (childId && Number.isInteger(Number(childId))) {
    filters.push(eq(needs.childId, Number(childId)));
  }
  if (category && CATEGORIES.includes(category)) {
    filters.push(eq(needs.category, category as never));
  }
  if (status && STATUSES.includes(status)) {
    filters.push(eq(needs.status, status as never));
  }

  const rows = await db
    .select({
      id: needs.id,
      childId: needs.childId,
      category: needs.category,
      description: needs.description,
      amount: needs.amount,
      needDate: needs.needDate,
      status: needs.status,
      fulfilledBy: needs.fulfilledBy,
      createdAt: needs.createdAt,
      childName: children.name,
    })
    .from(needs)
    .innerJoin(children, eq(needs.childId, children.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(needs.needDate), desc(needs.id));

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

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    return NextResponse.json({ error: "Keterangan kebutuhan wajib diisi." }, { status: 400 });
  }
  if (!CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
  }
  if (!body.needDate) {
    return NextResponse.json({ error: "Tanggal kebutuhan wajib diisi." }, { status: 400 });
  }
  const amount = Math.max(0, Number(body.amount) || 0);

  const inserted = await db
    .insert(needs)
    .values({
      childId,
      category: body.category,
      description,
      amount,
      needDate: body.needDate,
      status: STATUSES.includes(body.status) ? body.status : "direncanakan",
      fulfilledBy: body.fulfilledBy?.trim() || user.name,
    })
    .returning();

  return NextResponse.json(inserted[0], { status: 201 });
}
