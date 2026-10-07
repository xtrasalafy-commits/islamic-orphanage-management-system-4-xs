"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Eye, Pencil, Plus, Search, SearchX, Trash2, Users } from "lucide-react";
import { api, fetcher, SWR_CONFIG } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks";
import type { ChildRow } from "@/lib/types";
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
import {
  ageFrom,
  CHILD_STATUS_LABEL,
  cn,
  formatShortDate,
  initials,
  ORPHAN_LABEL,
  todayISO,
} from "@/lib/utils";

type ChildForm = {
  name: string;
  gender: "L" | "P";
  birthDate: string;
  birthPlace: string;
  orphanStatus: string;
  admissionDate: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  school: string;
  healthNotes: string;
  notes: string;
  status: string;
};

const emptyForm = (): ChildForm => ({
  name: "",
  gender: "L",
  birthDate: "",
  birthPlace: "",
  orphanStatus: "yatim_piatu",
  admissionDate: todayISO(),
  guardianName: "",
  guardianPhone: "",
  address: "",
  school: "",
  healthNotes: "",
  notes: "",
  status: "aktif",
});

export default function ChildrenPage() {
  const user = useCurrentUser();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [orphanStatus, setOrphanStatus] = useState("");
  const [status, setStatus] = useState("");

  const listKey = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (orphanStatus) sp.set("orphanStatus", orphanStatus);
    if (status) sp.set("status", status);
    return `/api/children?${sp.toString()}`;
  }, [q, orphanStatus, status]);

  const { data, isLoading } = useSWR<ChildRow[]>(listKey, fetcher, SWR_CONFIG);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChildRow | null>(null);
  const [form, setForm] = useState<ChildForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ChildRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const isAdmin = user?.role === "admin";
  const hasFilters = q.trim() !== "" || orphanStatus !== "" || status !== "";

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (child: ChildRow) => {
    setEditing(child);
    setForm({
      name: child.name,
      gender: child.gender,
      birthDate: child.birthDate,
      birthPlace: child.birthPlace ?? "",
      orphanStatus: child.orphanStatus,
      admissionDate: child.admissionDate,
      guardianName: child.guardianName ?? "",
      guardianPhone: child.guardianPhone ?? "",
      address: child.address ?? "",
      school: child.school ?? "",
      healthNotes: child.healthNotes ?? "",
      notes: child.notes ?? "",
      status: child.status,
    });
    setModalOpen(true);
  };

  const set = (key: keyof ChildForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/api/children/${editing.id}`, form);
        toast("success", "Data anak diperbarui", `${form.name} berhasil disimpan.`);
      } else {
        await api.post("/api/children", form);
        toast("success", "Anak asuh ditambahkan", `${form.name} terdaftar sebagai anak asuh.`);
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
    // Optimistic: remove row immediately, revalidate on failure.
    await mutate(listKey, (rows?: ChildRow[]) => rows?.filter((r) => r.id !== deleting.id), {
      revalidate: false,
    });
    setDeleting(null);
    try {
      await api.delete(`/api/children/${deleting.id}`);
      toast("success", "Data anak dihapus", `${deleting.name} telah dihapus dari daftar.`);
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
        title="Anak Asuh"
        subtitle="Data anak yatim, piatu, dan dhuafa yang diasuh panti."
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Tambah Anak
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            className="pl-9"
            placeholder="Cari nama atau sekolah..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={orphanStatus} onChange={(e) => setOrphanStatus(e.target.value)} className="sm:w-48">
          <option value="">Semua status yatim/piatu</option>
          <option value="yatim">Yatim</option>
          <option value="piatu">Piatu</option>
          <option value="yatim_piatu">Yatim Piatu</option>
          <option value="dhuafa">Dhuafa</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
          <option value="">Semua keadaan</option>
          <option value="aktif">Aktif</option>
          <option value="adopsi">Adopsi</option>
          <option value="mandiri">Mandiri</option>
          <option value="keluar">Keluar</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-3 font-bold">Anak</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Wali / Kontak</th>
                  <th className="px-4 py-3 font-bold">Sekolah</th>
                  <th className="px-4 py-3 font-bold">Masuk</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((child) => (
                  <tr key={child.id} className="group transition hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            child.gender === "L"
                              ? "bg-pine-100 text-pine-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {initials(child.name)}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/children/${child.id}`}
                            className="block truncate font-bold text-stone-800 hover:text-pine-700"
                          >
                            {child.name}
                          </Link>
                          <p className="text-xs text-stone-500">
                            {child.gender === "L" ? "Laki-laki" : "Perempuan"} ·{" "}
                            {ageFrom(child.birthDate).label}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          tone={
                            child.orphanStatus === "yatim_piatu"
                              ? "violet"
                              : child.orphanStatus === "yatim"
                                ? "green"
                                : child.orphanStatus === "piatu"
                                  ? "amber"
                                  : "sky"
                          }
                        >
                          {ORPHAN_LABEL[child.orphanStatus]}
                        </Badge>
                        {child.status !== "aktif" ? (
                          <Badge tone="stone">{CHILD_STATUS_LABEL[child.status]}</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-700">{child.guardianName || "—"}</p>
                      <p className="text-xs text-stone-500">{child.guardianPhone || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{child.school || "—"}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatShortDate(child.admissionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:transition group-hover:opacity-100">
                        <Link href={`/children/${child.id}`}>
                          <IconButton label="Lihat detail">
                            <Eye size={15} />
                          </IconButton>
                        </Link>
                        <IconButton label="Ubah" onClick={() => openEdit(child)}>
                          <Pencil size={15} />
                        </IconButton>
                        {isAdmin ? (
                          <IconButton
                            label="Hapus"
                            className="hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => setDeleting(child)}
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
            title="Tidak ada hasil yang cocok"
            description="Coba ubah kata kunci pencarian atau bersihkan filter."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQ("");
                  setOrphanStatus("");
                  setStatus("");
                }}
              >
                Bersihkan filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users size={24} />}
            title="Belum ada data anak asuh"
            description="Tambahkan anak asuh pertama untuk mulai mengelola kebutuhan dan perlindungannya."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={14} /> Tambah Anak
              </Button>
            }
          />
        )}
      </Card>

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Data Anak" : "Tambah Anak Asuh"}
        subtitle={editing ? `Perbarui informasi ${editing.name}` : "Lengkapi profil anak asuh baru"}
        wide
      >
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap" required className="sm:col-span-2">
            <Input
              required
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="cth: Muhammad Rizki Ramadhan"
            />
          </Field>
          <Field label="Jenis Kelamin" required>
            <Select value={form.gender} onChange={(e) => set("gender")(e.target.value)}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
          </Field>
          <Field label="Status Yatim/Piatu" required>
            <Select value={form.orphanStatus} onChange={(e) => set("orphanStatus")(e.target.value)}>
              <option value="yatim">Yatim (ayah wafat)</option>
              <option value="piatu">Piatu (ibu wafat)</option>
              <option value="yatim_piatu">Yatim Piatu</option>
              <option value="dhuafa">Dhuafa</option>
            </Select>
          </Field>
          <Field label="Tanggal Lahir" required>
            <Input
              type="date"
              required
              value={form.birthDate}
              onChange={(e) => set("birthDate")(e.target.value)}
            />
          </Field>
          <Field label="Tempat Lahir">
            <Input
              value={form.birthPlace}
              onChange={(e) => set("birthPlace")(e.target.value)}
              placeholder="cth: Yogyakarta"
            />
          </Field>
          <Field label="Tanggal Masuk Panti" required>
            <Input
              type="date"
              required
              value={form.admissionDate}
              onChange={(e) => set("admissionDate")(e.target.value)}
            />
          </Field>
          <Field label="Keadaan">
            <Select value={form.status} onChange={(e) => set("status")(e.target.value)}>
              <option value="aktif">Aktif di panti</option>
              <option value="adopsi">Diadopsi</option>
              <option value="mandiri">Sudah mandiri</option>
              <option value="keluar">Keluar</option>
            </Select>
          </Field>
          <Field label="Nama Wali / Kerabat">
            <Input
              value={form.guardianName}
              onChange={(e) => set("guardianName")(e.target.value)}
              placeholder="cth: Bpk. Hasan (paman)"
            />
          </Field>
          <Field label="No. HP Wali">
            <Input
              value={form.guardianPhone}
              onChange={(e) => set("guardianPhone")(e.target.value)}
              placeholder="cth: 0812 3456 7890"
            />
          </Field>
          <Field label="Sekolah" className="sm:col-span-2">
            <Input
              value={form.school}
              onChange={(e) => set("school")(e.target.value)}
              placeholder="cth: SDN 1 Melati / MTs Nurul Iman"
            />
          </Field>
          <Field label="Alamat Asal" className="sm:col-span-2">
            <Textarea
              value={form.address}
              onChange={(e) => set("address")(e.target.value)}
              placeholder="Alamat keluarga / asal anak"
            />
          </Field>
          <Field label="Catatan Kesehatan" className="sm:col-span-2">
            <Input
              value={form.healthNotes}
              onChange={(e) => set("healthNotes")(e.target.value)}
              placeholder="cth: alergi kacang, asma ringan"
            />
          </Field>
          <Field label="Catatan Lain" className="sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Informasi tambahan pengasuhan"
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Anak"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus data anak?"
        description={`Seluruh data kebutuhan dan kasus perlindungan milik ${deleting?.name ?? ""} juga akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`}
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
