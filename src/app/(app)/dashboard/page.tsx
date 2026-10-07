"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  HandCoins,
  HeartHandshake,
  PackageOpen,
  ShieldAlert,
  Users,
} from "lucide-react";
import { fetcher, SWR_CONFIG } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import {
  Badge,
  Card,
  PageHeader,
  Skeleton,
} from "@/components/ui";
import { BarsChart, DonutChart } from "@/components/charts";
import {
  CASE_TYPE_LABEL,
  DONATION_CATEGORY_LABEL,
  formatShortDate,
  rupiah,
} from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR<DashboardStats>("/api/stats", fetcher, SWR_CONFIG);
  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Assalamu'alaikum"
        subtitle={`Ringkasan panti per ${monthLabel}. Semoga setiap amanah tercatat dengan baik.`}
      />

      {error ? (
        <Card className="p-8 text-center text-sm text-rose-600">
          Gagal memuat ringkasan. Muat ulang halaman untuk mencoba lagi.
        </Card>
      ) : null}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={isLoading}
          icon={<Users size={18} />}
          iconClass="bg-pine-100 text-pine-700"
          label="Anak Asuh Aktif"
          value={data ? String(data.aktif) : null}
          sub={data ? `${data.totalChildren} anak terdaftar` : null}
        />
        <StatCard
          loading={isLoading}
          icon={<HeartHandshake size={18} />}
          iconClass="bg-amber-100 text-amber-700"
          label="Kebutuhan Terpenuhi Bulan Ini"
          value={data ? String(data.needsMonth.fulfilled) : null}
          sub={data ? rupiah(data.needsMonth.amount) : null}
        />
        <StatCard
          loading={isLoading}
          icon={<ShieldAlert size={18} />}
          iconClass="bg-rose-100 text-rose-700"
          label="Kasus Perlindungan Terbuka"
          value={data ? String(data.protection.terbuka) : null}
          sub={data ? `${data.protection.ditangani} sedang ditangani` : null}
        />
        <StatCard
          loading={isLoading}
          icon={<CircleDollarSign size={18} />}
          iconClass="bg-emerald-100 text-emerald-700"
          label="Donasi Uang Bulan Ini"
          value={data ? rupiah(data.donationsMonth.total) : null}
          sub={
            data ? `${data.donationsMonth.count} donatur · ${data.donationsMonth.barang} barang` : null
          }
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-stone-900">
                Donasi Uang 6 Bulan Terakhir
              </h2>
              <p className="text-xs text-stone-500">Akumulasi per bulan (rupiah)</p>
            </div>
            <Link
              href="/donations"
              className="flex items-center gap-1 text-xs font-bold text-pine-700 hover:text-pine-900"
            >
              Lihat semua <ArrowRight size={13} />
            </Link>
          </div>
          {isLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <BarsChart data={data?.donationSeries ?? []} />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-sm font-bold text-stone-900">Status Anak Aktif</h2>
          <p className="mb-4 text-xs text-stone-500">Berdasarkan kondisi yatim/piatu</p>
          {isLoading ? (
            <div className="flex items-center gap-6">
              <Skeleton className="h-36 w-36 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : (
            <DonutChart
              centerLabel="Anak"
              centerValue={data?.aktif ?? 0}
              segments={[
                { label: "Yatim", value: data?.byStatus.yatim ?? 0, color: "#348062" },
                { label: "Piatu", value: data?.byStatus.piatu ?? 0, color: "#d97706" },
                { label: "Yatim Piatu", value: data?.byStatus.yatim_piatu ?? 0, color: "#7c3aed" },
                { label: "Dhuafa", value: data?.byStatus.dhuafa ?? 0, color: "#0ea5e9" },
              ]}
            />
          )}
        </Card>
      </div>

      {/* Lists */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Open protection cases */}
        <Card>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-rose-100 p-1.5 text-rose-600">
                <AlertTriangle size={15} />
              </span>
              <h2 className="font-display text-sm font-bold text-stone-900">
                Kasus Perlindungan Perlu Tindakan
              </h2>
            </div>
            <Link
              href="/protection"
              className="flex items-center gap-1 text-xs font-bold text-pine-700 hover:text-pine-900"
            >
              Kelola <ArrowRight size={13} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.openCases.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-stone-500">
              <PackageOpen size={16} className="text-pine-600" />
              Alhamdulillah, tidak ada kasus terbuka saat ini.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {data?.openCases.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      c.severity === "berat"
                        ? "bg-rose-500"
                        : c.severity === "sedang"
                          ? "bg-amber-500"
                          : "bg-stone-300"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{c.title}</p>
                    <p className="truncate text-xs text-stone-500">
                      {c.childName} · {CASE_TYPE_LABEL[c.caseType]} ·{" "}
                      {formatShortDate(c.reportDate)}
                    </p>
                  </div>
                  <Badge tone={c.severity === "berat" ? "rose" : c.severity === "sedang" ? "amber" : "stone"}>
                    {c.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent donations */}
        <Card>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-pine-100 p-1.5 text-pine-700">
                <HandCoins size={15} />
              </span>
              <h2 className="font-display text-sm font-bold text-stone-900">Donasi Terbaru</h2>
            </div>
            <Link
              href="/donations"
              className="flex items-center gap-1 text-xs font-bold text-pine-700 hover:text-pine-900"
            >
              Lihat semua <ArrowRight size={13} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.recentDonations.length === 0 ? (
            <p className="px-5 py-6 text-sm text-stone-500">Belum ada donasi tercatat.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {data?.recentDonations.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">{d.donorName}</p>
                    <p className="truncate text-xs text-stone-500">
                      {DONATION_CATEGORY_LABEL[d.category]} · {formatShortDate(d.donationDate)}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-bold text-pine-700">
                    {d.donationType === "uang" ? rupiah(d.amount) : "Barang"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Needs by category */}
      <Card className="mt-4 p-5">
        <h2 className="font-display text-sm font-bold text-stone-900">
          Pemenuhan Kebutuhan Dasar (Terpenuhi, Semua Waktu)
        </h2>
        <p className="mb-4 text-xs text-stone-500">
          Total nilai per kategori · buka{" "}
          <Link href="/needs" className="font-bold text-pine-700 hover:underline">
            Kebutuhan Dasar
          </Link>{" "}
          untuk detail
        </p>
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.needsByCategory ?? []).map((n) => (
              <div
                key={n.category}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3"
              >
                <span className="text-sm font-semibold capitalize text-stone-700">{n.category}</span>
                <span className="text-sm font-bold text-pine-800">{rupiah(n.total)}</span>
              </div>
            ))}
            {data && data.needsByCategory.length === 0 ? (
              <p className="text-sm text-stone-500">Belum ada kebutuhan terpenuhi.</p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  loading,
  icon,
  iconClass,
  label,
  value,
  sub,
}: {
  loading: boolean;
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string | null;
  sub?: string | null;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className={`rounded-xl p-2.5 ${iconClass}`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-7 w-24" />
          ) : (
            <p className="mt-0.5 truncate font-display text-xl font-bold text-stone-900">
              {value ?? "—"}
            </p>
          )}
          {sub && !loading ? <p className="mt-0.5 text-xs text-stone-500">{sub}</p> : null}
        </div>
      </div>
    </Card>
  );
}
