"use client";

import { useState, type FormEvent } from "react";
import useSWR, { mutate } from "swr";
import { KeyRound, Plus, ShieldAlert, Trash2, UserCog } from "lucide-react";
import { api, fetcher, SWR_CONFIG } from "@/lib/api";
import { useCurrentUser } from "@/lib/hooks";
import type { UserRow } from "@/lib/types";
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
import { initials, ROLE_LABEL } from "@/lib/utils";

const KEY = "/api/users";

export default function UsersPage() {
  const me = useCurrentUser();
  const { toast } = useToast();
  const { data, isLoading, error } = useSWR<UserRow[]>(me ? KEY : null, fetcher, SWR_CONFIG);

  const [addOpen, setAddOpen] = useState(false);
  const [pwUser, setPwUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "pengurus" });
  const [newPassword, setNewPassword] = useState("");

  if (me && me.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <EmptyState
            icon={<ShieldAlert size={24} />}
            title="Akses khusus Kepala Panti"
            description="Halaman pengguna hanya dapat diakses oleh akun dengan peran Kepala Panti."
          />
        </Card>
      </div>
    );
  }

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(KEY, form);
      toast("success", "Pengguna ditambahkan", `${form.name} kini dapat masuk ke SIMPAN.`);
      setForm({ name: "", email: "", password: "", role: "pengurus" });
      setAddOpen(false);
      mutate(KEY);
    } catch (err) {
      toast("error", "Gagal menambahkan", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = async (u: UserRow) => {
    const next = u.role === "admin" ? "pengurus" : "admin";
    // optimistic
    await mutate(KEY, (rows?: UserRow[]) => rows?.map((r) => (r.id === u.id ? { ...r, role: next as UserRow["role"] } : r)), {
      revalidate: false,
    });
    try {
      await api.patch(`/api/users/${u.id}`, { role: next });
      toast("success", "Peran diperbarui", `${u.name} sekarang ${ROLE_LABEL[next]}.`);
      mutate(KEY);
    } catch (err) {
      toast("error", "Gagal mengubah peran", err instanceof Error ? err.message : undefined);
      mutate(KEY);
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    setBusy(true);
    try {
      await api.patch(`/api/users/${pwUser.id}`, { password: newPassword });
      toast("success", "Kata sandi diperbarui", `Kata sandi ${pwUser.name} telah diganti.`);
      setPwUser(null);
      setNewPassword("");
    } catch (err) {
      toast("error", "Gagal mengganti sandi", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    await mutate(KEY, (rows?: UserRow[]) => rows?.filter((r) => r.id !== deleting.id), {
      revalidate: false,
    });
    const removed = deleting;
    setDeleting(null);
    try {
      await api.delete(`/api/users/${removed.id}`);
      toast("success", "Pengguna dihapus", `${removed.name} telah dihapus.`);
      mutate(KEY);
    } catch (err) {
      toast("error", "Gagal menghapus", err instanceof Error ? err.message : undefined);
      mutate(KEY);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Pengguna"
        subtitle="Kelola akun pengurus yang dapat mengakses sistem."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Tambah Pengguna
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : error ? (
          <EmptyState
            icon={<ShieldAlert size={24} />}
            title="Gagal memuat pengguna"
            description="Anda mungkin tidak memiliki akses ke halaman ini."
          />
        ) : data && data.length > 0 ? (
          <ul className="divide-y divide-stone-100">
            {data.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-100 text-sm font-bold text-pine-700">
                  {initials(u.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-stone-800">
                    {u.name}
                    {u.id === me?.id ? <Badge tone="stone">Anda</Badge> : null}
                  </p>
                  <p className="truncate text-xs text-stone-500">{u.email}</p>
                </div>
                <button
                  disabled={u.id === me?.id}
                  onClick={() => toggleRole(u)}
                  title="Klik untuk mengganti peran"
                  className="disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Badge tone={u.role === "admin" ? "pine" : "sky"}>{ROLE_LABEL[u.role]}</Badge>
                </button>
                <div className="flex items-center gap-1">
                  <IconButton label="Ganti kata sandi" onClick={() => { setPwUser(u); setNewPassword(""); }}>
                    <KeyRound size={15} />
                  </IconButton>
                  {u.id !== me?.id ? (
                    <IconButton
                      label="Hapus"
                      className="hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => setDeleting(u)}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<UserCog size={24} />} title="Belum ada pengguna" />
        )}
      </Card>

      {/* Add user modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Pengguna" subtitle="Buat akun pengurus baru">
        <form onSubmit={submitAdd} className="space-y-4">
          <Field label="Nama Lengkap" required>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="cth: Ust. Budi Santoso" />
          </Field>
          <Field label="Email" required>
            <Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="nama@nuruliman.or.id" />
          </Field>
          <Field label="Kata Sandi" required hint="Minimal 6 karakter.">
            <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </Field>
          <Field label="Peran">
            <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="pengurus">Pengurus</option>
              <option value="admin">Kepala Panti</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button type="submit" loading={busy}>{busy ? "Menyimpan..." : "Tambah"}</Button>
          </div>
        </form>
      </Modal>

      {/* Password modal */}
      <Modal open={pwUser !== null} onClose={() => setPwUser(null)} title="Ganti Kata Sandi" subtitle={pwUser?.email}>
        <form onSubmit={submitPassword} className="space-y-4">
          <Field label="Kata Sandi Baru" required hint="Minimal 6 karakter.">
            <Input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPwUser(null)}>Batal</Button>
            <Button type="submit" loading={busy}>{busy ? "Menyimpan..." : "Perbarui Sandi"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus pengguna?"
        description={`Akun ${deleting?.name ?? ""} tidak akan bisa masuk lagi ke sistem.`}
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
