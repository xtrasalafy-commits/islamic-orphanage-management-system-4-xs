"use client";

import { useMemo, useState, type FormEvent } from "react";
import useSWR, { mutate } from "swr";
import { Pencil, Plus, ShieldCheck, SearchX, Trash2 } from "lucide-react";
import { api, fetcher, SWR_CONFIG } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks";
import type { CaseRow, CaseStatus, ChildRow } from "@/lib/types";
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
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, cn, formatShortDate, SEVERITY_LABEL, todayISO } from "@/lib/utils";

type CaseForm = {
  childId: string;
  caseType: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  reportDate: string;
  reportSource: string;
  handledBy: string;
  resolution: string;
};

const emptyForm = (): CaseForm => ({
  childId: "",
  caseType: "perundungan",
  title: "",
  description: "",
  severity: "ringan",
  status: "terbuka",
  reportDate: todayISO(),
  reportSource: "",
  handledBy: "",
  resolution: "",
});

const STATUS_TONE: Record<CaseStatus, "rose" | "sky" | "green" | "violet"> = {
  terbuka: "rose",
  ditangani: "sky",
  selesai: "green",
  dirujuk: "violet",
};

export default function ProtectionPage() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState("");
  const [caseType, setCaseType] = useState("");

  const listKey = useMemo(() => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (caseType) sp.set("caseType", caseType);
    return `/api/protection?${sp.toString()}`;
  }, [status, caseType]);

  const { data, isLoading } = useSWR<CaseRow[]>(listKey, fetcher, SWR_CONFIG);
  const { data: childList } = useSWR<ChildRow[]>("/api/children", fetcher, SWR_CONFIG);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaseRow | null>(null);
  const [form, setForm] = useState<CaseForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CaseRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [movingId, setMovingId] = useState<number | null>(null);

  const hasFilters = status !== "" || caseType !== "";

  const counts = useMemo(() => {
    const rows = data ?? [];
    const count = (s: CaseStatus) => rows.filter((r) => r.status === s).length;
    return {
      terbuka: count("terbuka"),
      ditangani: count("ditangani"),
      selesai: count("selesai"),
      dirujuk: count("dirujuk"),
    };
  }, [data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (c: CaseRow) => {
    setEditing(c);
    setForm({
      childId: String(c.childId),
      caseType: c.caseType,
      title: c.title,
      description: c.description,
      severity: c.severity,
      status: c.status,
      reportDate: c.reportDate,
      reportSource: c.reportSource ?? "",
      handledBy: c.handledBy ?? "",
      resolution: c.resolution ?? "",
    });
    setModalOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/api/protection/${editing.id}`, form);
        toast("success", "Kasus diperbarui", form.title);
      } else {
        await api.post("/api/protection", form);
        toast("success", "Laporan kasus tersimpan", form.title);
      }
      await mutate(listKey);
      setModalOpen(false);
    } catch (err) {
      toast("error", "Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  /** Optimistic status move. */
  const moveStatus = async (c: CaseRow, next: CaseStatus) => {
    if (next === c.status) return;
    setMovingId(c.id);
    await mutate(
      listKey,
      (rows?: CaseRow[]) => rows?.map((r) => (r.id === c.id ? { ...r, status: next } : r)),
      { revalidate: false }
    );
    try {
      await api.patch(`/api/protection/${c.id}`, { status: next });
      toast("success", `Status menjadi "${CASE_STATUS_LABEL[next]}"`, c.title);
      mutate(listKey);
    } catch (err) {
      toast("error", "Gagal mengubah status", err instanceof Error ? err.message : undefined);
      mutate(listKey);
    } finally {
      setMovingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    await mutate(listKey, (rows?: CaseRow[]) => rows?.filter((r) => r.id !== deleting.id), {
      revalidate: false,
    });
    const removed = deleting;
    setDeleting(null);
    try {
      await api.delete(`/api/protection/${removed.id}`);
      toast("success", "Kasus dihapus", removed.title);
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
        title="Perlindungan Anak"
        subtitle="Setiap anak berhak merasa aman. Catat dan tangani setiap laporan dengan cepat."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Lapor Kasus
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiChip label="Terbuka" value={counts.terbuka} tone="rose" loading={isLoading} />
        <KpiChip label="Ditangani" value={counts.ditangani} tone="sky" loading={isLoading} />
        <KpiChip label="Selesai" value={counts.selesai} tone="green" loading={isLoading} />
        <KpiChip label="Dirujuk" value={counts.dirujuk} tone="violet" loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
          <option value="">Semua status</option>
          <option value="terbuka">Terbuka</option>
          <option value="ditangani">Ditangani</option>
          <option value="selesai">Selesai</option>
          <option value="dirujuk">Dirujuk</option>
        </Select>
        <Select value={caseType} onChange={(e) => setCaseType(e.target.value)} className="sm:w-56">
          <option value="">Semua jenis kasus</option>
          <option value="perundungan">Perundungan</option>
          <option value="kekerasan">Kekerasan</option>
          <option value="penelantaran">Penelantaran</option>
          <option value="kesehatan">Kesehatan Darurat</option>
          <option value="eksploitasi">Eksploitasi</option>
          <option value="hak_asuh">Sengketa Hak Asuh</option>
          <option value="lainnya">Lainnya</option>
        </Select>
        {hasFilters ? (
          <Button
            variant="ghost"
            onClick={() => {
              setStatus("");
              setCaseType("");
            }}
          >
            Bersihkan filter
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <Card>
          <TableSkeleton rows={5} cols={4} />
        </Card>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={c.severity === "berat" ? "rose" : c.severity === "sedang" ? "amber" : "stone"}>
                      {SEVERITY_LABEL[c.severity]}
                    </Badge>
                    <Badge tone="pine">{CASE_TYPE_LABEL[c.caseType]}</Badge>
                    <span className="text-xs text-stone-400">
                      dilaporkan {formatShortDate(c.reportDate)}
                      {c.reportSource ? ` · ${c.reportSource}` : ""}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-sm font-bold text-stone-900">{c.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">{c.description}</p>
                  {c.resolution ? (
                    <p className="mt-2 rounded-lg bg-pine-50 px-3 py-2 text-xs leading-relaxed text-pine-800">
                      <span className="font-bold">Penanganan: </span>
                      {c.resolution}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs font-semibold text-stone-600">
                    Anak: <span className="text-pine-800">{c.childName}</span>
                    {c.handledBy ? <span className="font-normal text-stone-400"> · ditangani {c.handledBy}</span> : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Select
                      value={c.status}
                      disabled={movingId === c.id}
                      onChange={(e) => moveStatus(c, e.target.value as CaseStatus)}
                      className="h-8 w-36 border-none bg-transparent px-2 text-xs font-bold"
                      style={{ backgroundColor: "transparent" }}
                    >
                      <option value="terbuka">Terbuka</option>
                      <option value="ditangani">Ditangani</option>
                      <option value="selesai">Selesai</option>
                      <option value="dirujuk">Dirujuk</option>
                    </Select>
                    <Badge tone={STATUS_TONE[c.status]}>{CASE_STATUS_LABEL[c.status]}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton label="Ubah kasus" onClick={() => openEdit(c)}>
                      <Pencil size={15} />
                    </IconButton>
                    {isAdmin ? (
                      <IconButton
                        label="Hapus"
                        className="hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => setDeleting(c)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : hasFilters ? (
        <Card>
          <EmptyState
            icon={<SearchX size={24} />}
            title="Tidak ada kasus dengan filter ini"
            description="Ubah filter status atau jenis kasus."
            action={
              <Button variant="outline" size="sm" onClick={() => { setStatus(""); setCaseType(""); }}>
                Bersihkan filter
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<ShieldCheck size={24} />}
            title="Alhamdulillah, belum ada laporan kasus"
            description="Bila terjadi insiden yang menyangkut keselamatan atau hak anak, segera catat di sini agar tertangani."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} /> Lapor Kasus
              </Button>
            }
          />
        </Card>
      )}

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Kasus Perlindungan" : "Lapor Kasus Perlindungan"}
        subtitle="Data kasus bersifat rahasia dan hanya dapat diakses pengurus"
        wide
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
          <Field label="Judul Kasus" required className="sm:col-span-2">
            <Input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="cth: Perundungan saat kegiatan mengaji"
            />
          </Field>
          <Field label="Jenis Kasus" required>
            <Select value={form.caseType} onChange={(e) => setForm((f) => ({ ...f, caseType: e.target.value }))}>
              <option value="perundungan">Perundungan</option>
              <option value="kekerasan">Kekerasan</option>
              <option value="penelantaran">Penelantaran</option>
              <option value="kesehatan">Kesehatan Darurat</option>
              <option value="eksploitasi">Eksploitasi</option>
              <option value="hak_asuh">Sengketa Hak Asuh</option>
              <option value="lainnya">Lainnya</option>
            </Select>
          </Field>
          <Field label="Tingkat Keparahan" required>
            <Select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
              <option value="ringan">Ringan</option>
              <option value="sedang">Sedang</option>
              <option value="berat">Berat</option>
            </Select>
          </Field>
          <Field label="Deskripsi Kejadian" required className="sm:col-span-2">
            <Textarea
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Uraikan kronologi singkat kejadian..."
            />
          </Field>
          <Field label="Tanggal Lapor" required>
            <Input
              type="date"
              required
              value={form.reportDate}
              onChange={(e) => setForm((f) => ({ ...f, reportDate: e.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="terbuka">Terbuka</option>
              <option value="ditangani">Ditangani</option>
              <option value="dirujuk">Dirujuk</option>
              <option value="selesai">Selesai</option>
            </Select>
          </Field>
          <Field label="Sumber Laporan">
            <Input
              value={form.reportSource}
              onChange={(e) => setForm((f) => ({ ...f, reportSource: e.target.value }))}
              placeholder="cth: Pengasuh asrama"
            />
          </Field>
          <Field label="Penanggung Jawab">
            <Input
              value={form.handledBy}
              onChange={(e) => setForm((f) => ({ ...f, handledBy: e.target.value }))}
              placeholder="cth: Ust. Ahmad Fauzi"
            />
          </Field>
          <Field label="Catatan Penanganan" className="sm:col-span-2">
            <Textarea
              value={form.resolution}
              onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
              placeholder="Langkah penanganan yang telah dilakukan"
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Laporan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus kasus perlindungan?"
        description={`Laporan "${deleting?.title ?? ""}" akan dihapus permanen. Pastikan kasus benar-benar tidak valid.`}
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
  value: number;
  tone: "rose" | "sky" | "green" | "violet";
  loading: boolean;
}) {
  const tones = {
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3", tones[tone])}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      {loading ? (
        <div className="skeleton mt-1 h-6 w-12" />
      ) : (
        <p className="mt-0.5 font-display text-lg font-bold">{value}</p>
      )}
    </div>
  );
}
