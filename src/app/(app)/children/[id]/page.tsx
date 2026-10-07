"use client";

import { use, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Home,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import { api, fetcher, SWR_CONFIG } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks";
import type { ChildRow, CaseRow, NeedRow } from "@/lib/types";
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
  Select,
  TableSkeleton,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import {
  ageFrom,
  CASE_STATUS_LABEL,
  CASE_TYPE_LABEL,
  CATEGORY_DOT,
  CATEGORY_LABEL,
  CHILD_STATUS_LABEL,
  cn,
  formatShortDate,
  initials,
  ORPHAN_LABEL,
  rupiah,
  SEVERITY_LABEL,
  todayISO,
} from "@/lib/utils";

interface DetailPayload {
  child: ChildRow;
  needs: Omit<NeedRow, "childName">[];
  cases: Omit<CaseRow, "childName">[];
}

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const key = `/api/children/${id}`;
  const { data, isLoading, error } = useSWR<DetailPayload>(key, fetcher, SWR_CONFIG);
  const user = useCurrentUser();
  const { toast } = useToast();
  const [tab, setTab] = useState<"kebutuhan" | "perlindungan">("kebutuhan");

  const [editOpen, setEditOpen] = useState(false);
  const [needOpen, setNeedOpen] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "need" | "case"; id: number; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === "admin";
  const child = data?.child;

  const needsTotal = useMemo(
    () => (data?.needs ?? []).reduce((acc, n) => (n.status === "terpenuhi" ? acc + n.amount : acc), 0),
    [data]
  );

  const refresh = () => mutate(key);

  const removeItem = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const endpoint =
      deleteTarget.kind === "need" ? `/api/needs/${deleteTarget.id}` : `/api/protection/${deleteTarget.id}`;
    // optimistic refresh: drop row from local data immediately
    mutate(
      key,
      (d?: DetailPayload) =>
        d
          ? deleteTarget.kind === "need"
            ? { ...d, needs: d.needs.filter((n) => n.id !== deleteTarget.id) }
            : { ...d, cases: d.cases.filter((c) => c.id !== deleteTarget.id) }
          : d,
      { revalidate: false }
    );
    setDeleteTarget(null);
    try {
      await api.delete(endpoint);
      toast("success", "Data dihapus", `${deleteTarget.label} telah dihapus.`);
      refresh();
    } catch (err) {
      toast("error", "Gagal menghapus", err instanceof Error ? err.message : undefined);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link href="/children" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-pine-700">
          <ArrowLeft size={15} /> Kembali ke Anak Asuh
        </Link>
        <Card className="p-8 text-center text-sm text-rose-600">
          Data tidak ditemukan atau gagal dimuat.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/children" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-pine-700 hover:text-pine-900">
        <ArrowLeft size={15} /> Kembali ke Anak Asuh
      </Link>

      {isLoading || !child ? (
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="skeleton h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-6 w-56" />
              <div className="skeleton h-4 w-40" />
            </div>
          </div>
          <TableSkeleton rows={4} cols={4} />
        </Card>
      ) : (
        <>
          {/* Profile header */}
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-pine-800 via-pine-700 to-pine-600" />
            <div className="px-6 pb-6">
              <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  <span
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white text-lg font-bold shadow",
                      child.gender === "L" ? "bg-pine-200 text-pine-800" : "bg-amber-200 text-amber-800"
                    )}
                  >
                    {initials(child.name)}
                  </span>
                  <div className="pb-1">
                    <h1 className="font-display text-xl font-bold text-stone-900">{child.name}</h1>
                    <p className="text-sm text-stone-500">
                      {child.gender === "L" ? "Laki-laki" : "Perempuan"} ·{" "}
                      {ageFrom(child.birthDate).label}
                      {child.birthPlace ? ` · ${child.birthPlace}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <Badge tone={child.orphanStatus === "yatim_piatu" ? "violet" : child.orphanStatus === "yatim" ? "green" : child.orphanStatus === "piatu" ? "amber" : "sky"}>
                    {ORPHAN_LABEL[child.orphanStatus]}
                  </Badge>
                  <Badge tone={child.status === "aktif" ? "pine" : "stone"}>
                    {CHILD_STATUS_LABEL[child.status]}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil size={13} /> Ubah
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow icon={<CalendarDays size={14} />} label="Masuk panti" value={formatShortDate(child.admissionDate)} />
                <InfoRow icon={<GraduationCap size={14} />} label="Sekolah" value={child.school || "—"} />
                <InfoRow icon={<User size={14} />} label="Wali" value={child.guardianName || "—"} />
                <InfoRow icon={<Phone size={14} />} label="Kontak wali" value={child.guardianPhone || "—"} />
                <InfoRow icon={<MapPin size={14} />} label="Alamat asal" value={child.address || "—"} />
                <InfoRow icon={<HeartPulse size={14} />} label="Catatan kesehatan" value={child.healthNotes || "Tidak ada"} />
              </div>
              {child.notes ? (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                  <span className="font-bold">Catatan pengasuhan: </span>
                  {child.notes}
                </p>
              ) : null}
            </div>
          </Card>

          {/* Tabs */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl bg-stone-200/60 p-1">
              <TabButton active={tab === "kebutuhan"} onClick={() => setTab("kebutuhan")}>
                <HeartHandshake size={14} /> Kebutuhan Dasar
              </TabButton>
              <TabButton active={tab === "perlindungan"} onClick={() => setTab("perlindungan")}>
                <ShieldAlert size={14} /> Perlindungan
              </TabButton>
            </div>
            {tab === "kebutuhan" ? (
              <Button size="sm" onClick={() => setNeedOpen(true)}>
                <Plus size={14} /> Tambah
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCaseOpen(true)}>
                <Plus size={14} /> Lapor Kasus
              </Button>
            )}
          </div>

          {tab === "kebutuhan" ? (
            <Card className="mt-3">
              {data!.needs.length === 0 ? (
                <EmptyState
                  icon={<Home size={22} />}
                  title="Belum ada catatan kebutuhan"
                  description="Catat pemenuhan pangan, sandang, pendidikan, kesehatan, dan kebutuhan lainnya."
                />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {data!.needs.map((n) => (
                    <li key={n.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", CATEGORY_DOT[n.category])} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800">{n.description}</p>
                        <p className="text-xs text-stone-500">
                          {CATEGORY_LABEL[n.category]} · {formatShortDate(n.needDate)}
                          {n.fulfilledBy ? ` · oleh ${n.fulfilledBy}` : ""}
                        </p>
                      </div>
                      <span className="hidden text-sm font-bold text-stone-700 sm:block">
                        {rupiah(n.amount)}
                      </span>
                      <Badge tone={n.status === "terpenuhi" ? "green" : "amber"}>
                        {n.status === "terpenuhi" ? "Terpenuhi" : "Direncanakan"}
                      </Badge>
                      {isAdmin ? (
                        <IconButton
                          label="Hapus"
                          className="hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteTarget({ kind: "need", id: n.id, label: n.description })}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {data!.needs.length > 0 ? (
                <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/60 px-5 py-3 text-sm">
                  <span className="font-semibold text-stone-500">Total terpenuhi</span>
                  <span className="font-display font-bold text-pine-800">{rupiah(needsTotal)}</span>
                </div>
              ) : null}
            </Card>
          ) : (
            <Card className="mt-3">
              {data!.cases.length === 0 ? (
                <EmptyState
                  icon={<ShieldAlert size={22} />}
                  title="Tidak ada kasus perlindungan"
                  description="Alhamdulillah, belum ada laporan kasus untuk anak ini. Laporkan bila terjadi insiden."
                />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {data!.cases.map((c) => (
                    <li key={c.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-stone-800">{c.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{c.description}</p>
                          {c.resolution ? (
                            <p className="mt-2 rounded-lg bg-pine-50 px-3 py-2 text-xs text-pine-800">
                              <span className="font-bold">Penanganan: </span>
                              {c.resolution}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge tone={c.severity === "berat" ? "rose" : c.severity === "sedang" ? "amber" : "stone"}>
                            {SEVERITY_LABEL[c.severity]}
                          </Badge>
                          <Badge tone={c.status === "selesai" ? "green" : c.status === "terbuka" ? "rose" : "sky"}>
                            {CASE_STATUS_LABEL[c.status]}
                          </Badge>
                          {isAdmin ? (
                            <IconButton
                              label="Hapus"
                              className="hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => setDeleteTarget({ kind: "case", id: c.id, label: c.title })}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-stone-400">
                        {CASE_TYPE_LABEL[c.caseType]} · dilaporkan {formatShortDate(c.reportDate)}
                        {c.reportSource ? ` oleh ${c.reportSource}` : ""}
                        {c.handledBy ? ` · ditangani ${c.handledBy}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}

      {child ? (
        <>
          <EditChildModal open={editOpen} child={child} onClose={() => setEditOpen(false)} onSaved={refresh} />
          <AddNeedModal open={needOpen} childId={child.id} childName={child.name} onClose={() => setNeedOpen(false)} onSaved={refresh} />
          <AddCaseModal open={caseOpen} childId={child.id} childName={child.name} onClose={() => setCaseOpen(false)} onSaved={refresh} />
        </>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus catatan ini?"
        description={`Catatan "${deleteTarget?.label ?? ""}" akan dihapus permanen.`}
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeItem}
      />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50 px-3.5 py-2.5">
      <span className="mt-0.5 text-pine-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{label}</p>
        <p className="truncate text-sm font-semibold text-stone-700" title={value}>{value}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition",
        active ? "bg-white text-pine-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Edit child modal ----------------------------- */

function EditChildModal({
  open,
  child,
  onClose,
  onSaved,
}: {
  open: boolean;
  child: ChildRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    school: string;
    guardianName: string;
    guardianPhone: string;
    address: string;
    healthNotes: string;
    notes: string;
    status: string;
    orphanStatus: string;
  }>({
    name: child.name,
    school: child.school ?? "",
    guardianName: child.guardianName ?? "",
    guardianPhone: child.guardianPhone ?? "",
    address: child.address ?? "",
    healthNotes: child.healthNotes ?? "",
    notes: child.notes ?? "",
    status: child.status,
    orphanStatus: child.orphanStatus,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/api/children/${child.id}`, form);
      toast("success", "Data diperbarui", "Profil anak asuh berhasil disimpan.");
      onSaved();
      onClose();
    } catch (err) {
      toast("error", "Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ubah Data Anak" subtitle={child.name} wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap" required className="sm:col-span-2">
          <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Status Yatim/Piatu">
          <Select value={form.orphanStatus} onChange={(e) => setForm((f) => ({ ...f, orphanStatus: e.target.value }))}>
            <option value="yatim">Yatim</option>
            <option value="piatu">Piatu</option>
            <option value="yatim_piatu">Yatim Piatu</option>
            <option value="dhuafa">Dhuafa</option>
          </Select>
        </Field>
        <Field label="Keadaan">
          <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="aktif">Aktif di panti</option>
            <option value="adopsi">Diadopsi</option>
            <option value="mandiri">Sudah mandiri</option>
            <option value="keluar">Keluar</option>
          </Select>
        </Field>
        <Field label="Sekolah">
          <Input value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} />
        </Field>
        <Field label="No. HP Wali">
          <Input value={form.guardianPhone} onChange={(e) => setForm((f) => ({ ...f, guardianPhone: e.target.value }))} />
        </Field>
        <Field label="Wali" className="sm:col-span-2">
          <Input value={form.guardianName} onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))} />
        </Field>
        <Field label="Alamat Asal" className="sm:col-span-2">
          <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </Field>
        <Field label="Catatan Kesehatan" className="sm:col-span-2">
          <Input value={form.healthNotes} onChange={(e) => setForm((f) => ({ ...f, healthNotes: e.target.value }))} />
        </Field>
        <Field label="Catatan Pengasuhan" className="sm:col-span-2">
          <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------- Add need modal ------------------------------ */

export function AddNeedModal({
  open,
  childId,
  childName,
  onClose,
  onSaved,
}: {
  open: boolean;
  childId: number;
  childName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "pangan",
    description: "",
    amount: "",
    needDate: todayISO(),
    status: "terpenuhi",
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/needs", { ...form, childId, amount: Number(form.amount) || 0 });
      toast("success", "Kebutuhan dicatat", `Kebutuhan ${childName} berhasil ditambahkan.`);
      setForm({ category: "pangan", description: "", amount: "", needDate: todayISO(), status: "terpenuhi" });
      onSaved();
      onClose();
    } catch (err) {
      toast("error", "Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Tambah Kebutuhan Dasar" subtitle={`Untuk ${childName}`}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
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
            <option value="terpenuhi">Terpenuhi</option>
            <option value="direncanakan">Direncanakan</option>
          </Select>
        </Field>
        <Field label="Keterangan" required className="sm:col-span-2">
          <Input
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="cth: Seragam sekolah dan sepatu baru"
          />
        </Field>
        <Field label="Nilai (Rp)">
          <Input
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="cth: 350000"
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
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------- Add case modal ------------------------------ */

export function AddCaseModal({
  open,
  childId,
  childName,
  onClose,
  onSaved,
}: {
  open: boolean;
  childId: number;
  childName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/protection", { ...form, childId });
      toast("success", "Kasus dicatat", `Laporan perlindungan untuk ${childName} tersimpan.`);
      onSaved();
      onClose();
    } catch (err) {
      toast("error", "Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Lapor Kasus Perlindungan" subtitle={`Untuk ${childName}`} wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
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
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={saving}>{saving ? "Menyimpan..." : "Simpan Laporan"}</Button>
        </div>
      </form>
    </Modal>
  );
}
