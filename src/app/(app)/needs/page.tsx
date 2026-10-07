"use client";

import { useMemo, useState, type FormEvent } from "react";
import useSWR, { mutate } from "swr";
import { PackageOpen, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { api, fetcher, SWR_CONFIG } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks";
import type { ChildRow, NeedRow } from "@/lib/types";
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
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { CATEGORY_DOT, CATEGORY_LABEL, cn, formatShortDate, rupiah, todayISO } from "@/lib/utils";

type NeedForm = {
  childId: string;
  category: string;
  description: string;
  amount: string;
  needDate: string;
  status: string;
};

const emptyForm = (): NeedForm => ({
  childId: "",
  category: "pangan",
  description: "",
  amount: "",
  needDate: todayISO(),
  status: "direncanakan",
});

export default function NeedsPage() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [childId, setChildId] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const listKey = useMemo(() => {
    const sp = new URLSearchParams();
    if (childId) sp.set("childId", childId);
    if (category) sp.set("category", category);
    if (status) sp.set("status", status);
    return `/api/needs?${sp.toString()}`;
  }, [childId, category, status]);

  const { data, isLoading } = useSWR<NeedRow[]>(listKey, fetcher, SWR_CONFIG);
  const { data: childList } = useSWR<ChildRow[]>("/api/children", fetcher, SWR_CONFIG);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NeedRow | null>(null);
  const [form, setForm] = useState<NeedForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<NeedRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const hasFilters = childId !== "" || category !== "" || status !== "";

  const totals = useMemo(() => {
    const rows = data ?? [];
    const fulfilled = rows.filter((r) => r.status === "terpenuhi");
    return {
      fulfilledCount: fulfilled.length,
      fulfilledAmount: fulfilled.reduce((acc, r) => acc + r.amount, 0),
      planned: rows.filter((r) => r.status === "direncanakan").length,
    };
  }, [data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (need: NeedRow) => {
    setEditing(need);
    setForm({
      childId: String(need.childId),
      category: need.category,
      description: need.description,
      amount: String(need.amount),
      needDate: need.needDate,
      status: need.status,
    });
    setModalOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, amount: Number(form.amount) || 0 };
    try {
      if (editing) {
        await api.patch(`/api/needs/${editing.id}`, payload);
        toast("success", "Kebutuhan diperbarui", form.description);
      } else {
        await api.post("/api/needs", payload);
        toast("success", "Kebutuhan dicatat", form.description);
      }
      await mutate(listKey);
      setModalOpen(false);
    } catch (err) {
      toast("error", "Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  /** Optimistic status toggle. */
  const toggleStatus = async (need: NeedRow) => {
    const next = need.status === "terpenuhi" ? "direncanakan" : "terpenuhi";
    setTogglingId(need.id);
    // optimistic update
    await mutate(
      listKey,
      (rows?: NeedRow[]) => rows?.map((r) => (r.id === need.id ? { ...r, status: next as NeedRow["status"] } : r)),
      { revalidate: false }
    );
    try {
      await api.patch(`/api/needs/${need.id}`, { status: next });
      toast(
        "success",
        next === "terpenuhi" ? "Kebutuhan ditandai terpenuhi" : "Kebutuhan ditandai direncanakan",
        need.description
      );
      mutate(listKey);
    } catch (err) {
      toast("error", "Gagal mengubah status", err instanceof Error ? err.message : undefined);
      mutate(listKey);
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    await mutate(listKey, (rows?: NeedRow[]) => rows?.filter((r) => r.id !== deleting.id), {
      revalidate: false,
    });
    const removed = deleting;
    setDeleting(null);
    try {
      await api.delete(`/api/needs/${removed.id}`);
      toast("success", "Kebutuhan dihapus", removed.description);
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
        title="Kebutuhan Dasar"
        subtitle="Pantau pemenuhan pangan, sandang, pendidikan, kesehatan, tempat tinggal, dan kebutuhan ibadah."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Catat Kebutuhan
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiChip label="Terpenuhi (tampilan ini)" value={String(totals.fulfilledCount)} tone="green" loading={isLoading} />
        <KpiChip label="Nilai terpenuhi" value={rupiah(totals.fulfilledAmount)} tone="pine" loading={isLoading} />
        <KpiChip label="Direncanakan" value={String(totals.planned)} tone="amber" loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 lg:flex-row">
        <Select value={childId} onChange={(e) => setChildId(e.target.value)} className="lg:w-64">
          <option value="">Semua anak asuh</option>
          {(childList ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="lg:w-52">
          <option value="">Semua kategori</option>
          <option value="pangan">Pangan</option>
          <option value="sandang">Sandang</option>
          <option value="pendidikan">Pendidikan</option>
          <option value="kesehatan">Kesehatan</option>
          <option value="papan">Tempat Tinggal</option>
          <option value="ibadah">Ibadah & Rohani</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:w-48">
          <option value="">Semua status</option>
          <option value="terpenuhi">Terpenuhi</option>
          <option value="direncanakan">Direncanakan</option>
        </Select>
        {(hasFilters) && (
          <Button
            variant="ghost"
            onClick={() => {
              setChildId("");
              setCategory("");
              setStatus("");
            }}
          >
            Bersihkan filter
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  <th className="px-4 py-3 font-bold">Anak</th>
                  <th className="px-4 py-3 font-bold">Kebutuhan</th>
                  <th className="px-4 py-3 text-right font-bold">Nilai</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((need) => (
                  <tr key={need.id} className="group transition hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                      {formatShortDate(need.needDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-800">{need.childName}</td>
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="truncate font-semibold text-stone-700">{need.description}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                        <span className={cn("h-2 w-2 rounded-full", CATEGORY_DOT[need.category])} />
                        {CATEGORY_LABEL[need.category]}
                        {need.fulfilledBy && need.status === "terpenuhi" ? ` · ${need.fulfilledBy}` : ""}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-stone-700">
                      {need.amount > 0 ? rupiah(need.amount) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(need)}
                        disabled={togglingId === need.id}
                        title="Klik untuk mengubah status"
                        className="transition active:scale-95 disabled:opacity-60"
                      >
                        <Badge tone={need.status === "terpenuhi" ? "green" : "amber"}>
                          {need.status === "terpenuhi" ? "Terpenuhi" : "Direncanakan"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton label="Ubah" onClick={() => openEdit(need)}>
                          <Pencil size={15} />
                        </IconButton>
                        {isAdmin ? (
                          <IconButton
                            label="Hapus"
                            className="hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => setDeleting(need)}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : hasFilters ? (
          <EmptyState
            icon={<SearchX size={24} />}
            title="Tidak ada kebutuhan yang cocok"
            description="Ubah kombinasi filter untuk melihat catatan lainnya."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChildId("");
                  setCategory("");
                  setStatus("");
                }}
              >
                Bersihkan filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<PackageOpen size={24} />}
            title="Belum ada catatan kebutuhan"
            description="Catat pemenuhan kebutuhan dasar anak asuh agar hak mereka terpantau dengan baik."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} /> Catat Kebutuhan
              </Button>
            }
          />
        )}
      </Card>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-400">
        <Search size={12} /> Klik badge status untuk menandai terpenuhi / direncanakan secara cepat.
      </p>

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Kebutuhan" : "Catat Kebutuhan Dasar"}
        subtitle="Pemenuhan hak dasar anak asuh"
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Anak Asuh" required className="sm:col-span-2">
            <Select
              required
              value={form.childId}
              onChange={(e) => setForm((f) => ({ ...f, childId: e.target.value }))}
              disabled={editing !== null}
            >
              <option value="">Pilih anak asuh...</option>
              {(childList ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kategori" required>
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="pangan">Pangan</option>
              <option value="sandang">Sandang</option>
              <option value="pendidikan">Pendidikan</option>
              <option value="kesehatan">Kesehatan</option>
              <option value="papan">Tempat Tinggal</option>
              <option value="ibadah">Ibadah & Rohani</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="direncanakan">Direncanakan</option>
              <option value="terpenuhi">Terpenuhi</option>
            </Select>
          </Field>
          <Field label="Keterangan" required className="sm:col-span-2">
            <Input
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="cth: Bayaran SPP bulan berjalan"
            />
          </Field>
          <Field label="Nilai (Rp)" hint="Isi 0 bila tidak berbentuk uang.">
            <Input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="cth: 250000"
            />
          </Field>
          <Field label="Tanggal" required>
            <Input
              type="date"
              required
              value={form.needDate}
              onChange={(e) => setForm((f) => ({ ...f, needDate: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus catatan kebutuhan?"
        description={`Catatan "${deleting?.description ?? ""}" akan dihapus permanen.`}
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
        <div className="skeleton mt-1 h-6 w-20" />
      ) : (
        <p className="mt-0.5 truncate font-display text-lg font-bold">{value}</p>
      )}
    </div>
  );
}
