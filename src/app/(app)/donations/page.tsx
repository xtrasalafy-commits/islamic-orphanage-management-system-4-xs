"use client";

import { useMemo, useState, type FormEvent } from "react";
import useSWR, { mutate } from "swr";
import { HandCoins, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { api, fetcher, SWR_CONFIG } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks";
import type { DonationRow } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Select,
  TableSkeleton,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { cn, DONATION_CATEGORY_LABEL, formatShortDate, rupiah, todayISO } from "@/lib/utils";

type DonationForm = {
  donorName: string;
  donorType: string;
  category: string;
  donationType: string;
  amount: string;
  itemDescription: string;
  donationDate: string;
  receivedBy: string;
  notes: string;
};

const emptyForm = (): DonationForm => ({
  donorName: "",
  donorType: "perorangan",
  category: "infak",
  donationType: "uang",
  amount: "",
  itemDescription: "",
  donationDate: todayISO(),
  receivedBy: "",
  notes: "",
});

export default function DonationsPage() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const listKey = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (category) sp.set("category", category);
    return `/api/donations?${sp.toString()}`;
  }, [q, category]);

  const { data, isLoading } = useSWR<DonationRow[]>(listKey, fetcher, SWR_CONFIG);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DonationRow | null>(null);
  const [form, setForm] = useState<DonationForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<DonationRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const hasFilters = q.trim() !== "" || category !== "";

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      money: rows.filter((r) => r.donationType === "uang").reduce((acc, r) => acc + r.amount, 0),
      count: rows.length,
      barang: rows.filter((r) => r.donationType === "barang").length,
    };
  }, [data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (d: DonationRow) => {
    setEditing(d);
    setForm({
      donorName: d.donorName,
      donorType: d.donorType,
      category: d.category,
      donationType: d.donationType,
      amount: String(d.amount),
      itemDescription: d.itemDescription ?? "",
      donationDate: d.donationDate,
      receivedBy: d.receivedBy ?? "",
      notes: d.notes ?? "",
    });
    setModalOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, amount: Number(form.amount) || 0 };
    try {
      if (editing) {
        await api.patch(`/api/donations/${editing.id}`, payload);
        toast("success", "Donasi diperbarui", `Donasi ${form.donorName} tersimpan.`);
      } else {
        await api.post("/api/donations", payload);
        toast("success", "Donasi dicatat", "Jazakumullah khairan. Donasi berhasil dicatat.");
      }
      await mutate(listKey);
      setModalOpen(false);
    } catch (err) {
      toast("error", "Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    await mutate(listKey, (rows?: DonationRow[]) => rows?.filter((r) => r.id !== deleting.id), {
      revalidate: false,
    });
    const removed = deleting;
    setDeleting(null);
    try {
      await api.delete(`/api/donations/${removed.id}`);
      toast("success", "Donasi dihapus", `Catatan ${removed.donorName} telah dihapus.`);
      mutate(listKey);
    } catch (err) {
      toast("error", "Gagal menghapus", err instanceof Error ? err.message : undefined);
      mutate(listKey);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Donasi"
        subtitle="Catatan zakat, infak, sedekah, dan wakaf dari para donatur."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Catat Donasi
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiChip label="Total uang (tampilan ini)" value={rupiah(totals.money)} tone="pine" loading={isLoading} />
        <KpiChip label="Jumlah catatan" value={String(totals.count)} tone="green" loading={isLoading} />
        <KpiChip label="Donasi barang" value={String(totals.barang)} tone="amber" loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            className="pl-9"
            placeholder="Cari donatur atau catatan..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-44">
          <option value="">Semua kategori</option>
          <option value="zakat">Zakat</option>
          <option value="infak">Infak</option>
          <option value="sedekah">Sedekah</option>
          <option value="wakaf">Wakaf</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold">Donatur</th>
                  <th className="px-4 py-3 font-bold">Kategori</th>
                  <th className="px-4 py-3 font-bold">Donasi</th>
                  <th className="px-4 py-3 font-bold">Diterima oleh</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((d) => (
                  <tr key={d.id} className="group transition hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                      {formatShortDate(d.donationDate)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-stone-800">{d.donorName}</p>
                      <p className="text-xs text-stone-400">
                        {d.donorType === "organisasi" ? "Organisasi / Lembaga" : "Perorangan"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          d.category === "zakat"
                            ? "pine"
                            : d.category === "wakaf"
                              ? "violet"
                              : d.category === "infak"
                                ? "sky"
                                : "amber"
                        }
                      >
                        {DONATION_CATEGORY_LABEL[d.category]}
                      </Badge>
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      {d.donationType === "uang" ? (
                        <span className="font-bold text-pine-800">{rupiah(d.amount)}</span>
                      ) : (
                        <span className="text-stone-700" title={d.itemDescription ?? ""}>
                          <span className="truncate">{d.itemDescription}</span>
                        </span>
                      )}
                      {d.notes ? <p className="mt-0.5 truncate text-xs text-stone-400">{d.notes}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{d.receivedBy || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label="Ubah" onClick={() => openEdit(d)}>
                          <Pencil size={15} />
                        </IconButton>
                        {isAdmin ? (
                          <IconButton
                            label="Hapus"
                            className="hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => setDeleting(d)}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-stone-200 bg-stone-50/60">
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-stone-400">
                    Total uang pada tampilan ini
                  </td>
                  <td colSpan={3} className="px-4 py-3 font-display font-bold text-pine-800">
                    {rupiah(totals.money)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : hasFilters ? (
          <EmptyState
            icon={<SearchX size={24} />}
            title="Tidak ada donasi yang cocok"
            description="Coba ubah kata kunci atau kategori."
            action={
              <Button variant="outline" size="sm" onClick={() => { setQ(""); setCategory(""); }}>
                Bersihkan filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<HandCoins size={24} />}
            title="Belum ada donasi tercatat"
            description="Setiap amanah donatur perlu tercatat dengan rapi. Catat donasi pertama sekarang."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} /> Catat Donasi
              </Button>
            }
          />
        )}
      </Card>

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Donasi" : "Catat Donasi"}
        subtitle="Zakat · Infak · Sedekah · Wakaf"
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Donatur" required>
            <Input
              required
              value={form.donorName}
              onChange={(e) => setForm((f) => ({ ...f, donorName: e.target.value }))}
              placeholder="cth: H. Abdullah"
            />
          </Field>
          <Field label="Tipe Donatur">
            <Select value={form.donorType} onChange={(e) => setForm((f) => ({ ...f, donorType: e.target.value }))}>
              <option value="perorangan">Perorangan</option>
              <option value="organisasi">Organisasi / Lembaga</option>
            </Select>
          </Field>
          <Field label="Kategori" required>
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="zakat">Zakat</option>
              <option value="infak">Infak</option>
              <option value="sedekah">Sedekah</option>
              <option value="wakaf">Wakaf</option>
            </Select>
          </Field>
          <Field label="Tanggal" required>
            <Input
              type="date"
              required
              value={form.donationDate}
              onChange={(e) => setForm((f) => ({ ...f, donationDate: e.target.value }))}
            />
          </Field>
          <Field label="Jenis Donasi" required className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              {(["uang", "barang"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, donationType: t }))}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-bold transition",
                    form.donationType === t
                      ? "border-pine-500 bg-pine-50 text-pine-800"
                      : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                  )}
                >
                  {t === "uang" ? "Uang" : "Barang"}
                </button>
              ))}
            </div>
          </Field>
          {form.donationType === "uang" ? (
            <Field label="Nominal (Rp)" required className="sm:col-span-2">
              <Input
                type="number"
                min={0}
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="cth: 500000"
              />
            </Field>
          ) : (
            <Field label="Deskripsi Barang" required className="sm:col-span-2">
              <Input
                required
                value={form.itemDescription}
                onChange={(e) => setForm((f) => ({ ...f, itemDescription: e.target.value }))}
                placeholder="cth: 20 kg beras, 5 dus mi instan"
              />
            </Field>
          )}
          <Field label="Diterima Oleh" className="sm:col-span-2">
            <Input
              value={form.receivedBy}
              onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))}
              placeholder={user ? `Kosongkan untuk memakai nama Anda (${user.name})` : "Nama penerima"}
            />
          </Field>
          <Field label="Catatan / Doa Donatur" className="sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="cth: diniatkan untuk almarhum ayah donatur"
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Donasi"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus catatan donasi?"
        description={`Catatan donasi dari ${deleting?.donorName ?? ""} akan dihapus permanen.`}
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function KpiChip({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: string;
  tone: "green" | "pine" | "amber";
  loading: boolean;
}) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    pine: "border-pine-200 bg-pine-50 text-pine-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3", tones[tone])}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      {loading ? (
        <div className="skeleton mt-1 h-6 w-24" />
      ) : (
        <p className="mt-0.5 truncate font-display text-lg font-bold">{value}</p>
      )}
    </div>
  );
}
