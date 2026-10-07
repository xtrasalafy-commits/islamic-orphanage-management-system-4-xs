import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { children, donations, needs, protectionCases } from "@/db/schema";
import { getApiUser } from "@/lib/auth";
import type { DashboardStats } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });

  const now = new Date();
  const ym = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const monthStart = `${ym}-01`;
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = `${ym}-${String(lastDayOfMonth).padStart(2, "0")}`;

  const [
    totalRow,
    aktifRow,
    statusRows,
    needsMonthRows,
    plannedRow,
    needsCatRows,
    caseRows,
    donationAgg,
    barangRow,
    recentDonations,
    openCases,
  ] = await Promise.all([
    db.select({ v: count() }).from(children),
    db.select({ v: count() }).from(children).where(eq(children.status, "aktif")),
    db
      .select({ status: children.orphanStatus, v: count() })
      .from(children)
      .where(eq(children.status, "aktif"))
      .groupBy(children.orphanStatus),
    db
      .select({
        total: sql<number>`coalesce(sum(${needs.amount}), 0)::int`,
        v: count(),
      })
      .from(needs)
      .where(
        and(
          eq(needs.status, "terpenuhi"),
          gte(needs.needDate, monthStart),
          sql`${needs.needDate} <= ${monthEnd}`
        )
      ),
    db
      .select({ v: count() })
      .from(needs)
      .where(eq(needs.status, "direncanakan")),
    db
      .select({ category: needs.category, total: sql<number>`coalesce(sum(${needs.amount}), 0)::int` })
      .from(needs)
      .where(eq(needs.status, "terpenuhi"))
      .groupBy(needs.category),
    db
      .select({ status: protectionCases.status, severity: protectionCases.severity, v: count() })
      .from(protectionCases)
      .groupBy(protectionCases.status, protectionCases.severity),
    db
      .select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)::int`, v: count() })
      .from(donations)
      .where(
        and(
          eq(donations.donationType, "uang"),
          gte(donations.donationDate, monthStart),
          sql`${donations.donationDate} <= ${monthEnd}`
        )
      ),
    db
      .select({ v: count() })
      .from(donations)
      .where(
        and(
          eq(donations.donationType, "barang"),
          gte(donations.donationDate, monthStart),
          sql`${donations.donationDate} <= ${monthEnd}`
        )
      ),
    db
      .select()
      .from(donations)
      .orderBy(desc(donations.donationDate), desc(donations.id))
      .limit(5),
    db
      .select({
        id: protectionCases.id,
        childId: protectionCases.childId,
        title: protectionCases.title,
        caseType: protectionCases.caseType,
        severity: protectionCases.severity,
        status: protectionCases.status,
        reportDate: protectionCases.reportDate,
        childName: children.name,
      })
      .from(protectionCases)
      .innerJoin(children, eq(protectionCases.childId, children.id))
      .where(eq(protectionCases.status, "terbuka"))
      .orderBy(asc(protectionCases.reportDate))
      .limit(5),
  ]);

  // Donations series for last 6 months
  const series: { label: string; total: number }[] = [];
  const monthLabels = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    series.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      total: 0,
    });
    monthLabels.set(key, series.length - 1);
  }
  const keys = Array.from(monthLabels.keys());
  if (keys.length > 0) {
    const from = `${keys[0]}-01`;
    const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const to = `${ym}-${String(lastDayOfCurrentMonth).padStart(2, "0")}`;
    const rows = await db
      .select({
        d: donations.donationDate,
        amount: donations.amount,
      })
      .from(donations)
      .where(
        and(
          eq(donations.donationType, "uang"),
          gte(donations.donationDate, from),
          sql`${donations.donationDate} <= ${to}`
        )
      );
    for (const r of rows) {
      const key = r.d.slice(0, 7);
      const idx = monthLabels.get(key);
      if (idx !== undefined) series[idx].total += r.amount;
    }
  }

  const byStatus = { yatim: 0, piatu: 0, yatim_piatu: 0, dhuafa: 0 };
  for (const r of statusRows) {
    if (r.status) byStatus[r.status] = r.v;
  }

  const protection = { terbuka: 0, ditangani: 0, selesai: 0, beratAktif: 0 };
  for (const r of caseRows) {
    if (!r.status) continue;
    if (r.status !== "selesai") protection.beratAktif += r.severity === "berat" ? r.v : 0;
    if (r.status === "terbuka") protection.terbuka += r.v;
    if (r.status === "ditangani") protection.ditangani += r.v;
    if (r.status === "selesai") protection.selesai += r.v;
  }

  const stats: DashboardStats = {
    totalChildren: totalRow[0]?.v ?? 0,
    aktif: aktifRow[0]?.v ?? 0,
    byStatus,
    needsMonth: {
      fulfilled: needsMonthRows[0]?.v ?? 0,
      amount: needsMonthRows[0]?.total ?? 0,
      planned: plannedRow[0]?.v ?? 0,
    },
    needsByCategory: needsCatRows.map((r) => ({
      category: r.category!,
      total: r.total,
    })),
    protection,
    donationsMonth: {
      total: donationAgg[0]?.total ?? 0,
      count: donationAgg[0]?.v ?? 0,
      barang: barangRow[0]?.v ?? 0,
    },
    donationSeries: series,
    recentDonations: recentDonations.map((d) => ({ ...d })),
    openCases: openCases.map((c) => ({
      id: c.id,
      childId: c.childId,
      caseType: c.caseType,
      title: c.title,
      description: "",
      severity: c.severity,
      status: c.status,
      reportDate: c.reportDate,
      reportSource: null,
      handledBy: null,
      resolution: null,
      childName: c.childName,
    })),
  };

  return NextResponse.json(stats);
}
