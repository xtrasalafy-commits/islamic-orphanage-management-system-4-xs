import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { getApiUser } from "@/lib/auth";

const CATEGORIES = ["zakat", "infak", "sedekah", "wakaf"];
const DONATION_TYPES = ["uang", "barang"];
const DONOR_TYPES = ["perorangan", "organisasi"];

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const category = sp.get("category");

  const filters = [];
  if (q) filters.push(or(ilike(donations.donorName, `%${q}%`), ilike(donations.notes ?? "", `%${q}%`)));
  if (category && CATEGORIES.includes(category)) {
    filters.push(eq(donations.category, category as never));
  }

  const rows = await db
    .select()
    .from(donations)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(donations.donationDate), desc(donations.id));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const donorName = typeof body.donorName === "string" ? body.donorName.trim() : "";
  if (!donorName) return NextResponse.json({ error: "Nama donatur wajib diisi." }, { status: 400 });
  if (!CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Kategori donasi tidak valid." }, { status: 400 });
  }
  if (!DONATION_TYPES.includes(body.donationType)) {
    return NextResponse.json({ error: "Jenis donasi tidak valid." }, { status: 400 });
  }
  if (!body.donationDate) {
    return NextResponse.json({ error: "Tanggal donasi wajib diisi." }, { status: 400 });
  }

  const amount = body.donationType === "uang" ? Math.max(0, Number(body.amount) || 0) : 0;
  if (body.donationType === "uang" && amount <= 0) {
    return NextResponse.json({ error: "Nominal donasi wajib diisi." }, { status: 400 });
  }
  const itemDescription =
    body.donationType === "barang"
      ? typeof body.itemDescription === "string"
        ? body.itemDescription.trim()
        : ""
      : null;
  if (body.donationType === "barang" && !itemDescription) {
    return NextResponse.json({ error: "Deskripsi barang wajib diisi." }, { status: 400 });
  }

  const inserted = await db
    .insert(donations)
    .values({
      donorName,
      donorType: DONOR_TYPES.includes(body.donorType) ? body.donorType : "perorangan",
      category: body.category,
      donationType: body.donationType,
      amount,
      itemDescription,
      donationDate: body.donationDate,
      receivedBy: body.receivedBy?.trim() || user.name,
      notes: body.notes?.trim() || null,
    })
    .returning();

  return NextResponse.json(inserted[0], { status: 201 });
}
