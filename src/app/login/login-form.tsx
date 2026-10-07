"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MoonStar, ShieldCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { label: "Kepala Panti (Admin)", email: "ahmad@nuruliman.or.id", hint: "Akses penuh" },
  { label: "Pengurus / Pengasuh", email: "maryam@nuruliman.or.id", hint: "Kelola data harian" },
];

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ user: { name: string } }>("/api/auth/login", {
        email,
        password,
      });
      toast("success", `Assalamu'alaikum, ${res.user.name}`, "Anda berhasil masuk.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal masuk. Coba lagi.";
      setError(message);
      toast("error", "Gagal masuk", message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-pine-950 p-10 text-pine-100 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-800 text-amber-300">
            <MoonStar size={24} />
          </span>
          <div>
            <p className="font-display text-base font-bold text-white">Nurul Iman</p>
            <p className="text-xs font-semibold tracking-wide text-pine-300">
              PANTI ASUHAN ISLAMI
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-snug text-white">
            Merawat amanah,
            <br />
            menumbuhkan harapan.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-pine-300">
            Sistem Manajemen Panti Asuhan (SIMPAN) membantu pengurus mencatat anak asuh,
            memantau pemenuhan kebutuhan dasar, menangani kasus perlindungan, dan mengelola
            donasi zakat, infak, dan sedekah dalam satu tempat.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-pine-800 bg-pine-900/60 p-4">
            <ShieldCheck className="shrink-0 text-amber-300" size={28} />
            <p className="text-xs leading-relaxed text-pine-200">
              Setiap anak berhak mendapat pengasuhan yang layak, aman, dan penuh kasih sayang
              sesuai nilai-nilai Islam.
            </p>
          </div>
        </div>

        <p className="relative text-[11px] text-pine-400">
          Yayasan Nurul Iman · Jl. Melati No. 12, Yogyakarta
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine-950 text-amber-300">
              <MoonStar size={20} />
            </span>
            <div>
              <p className="font-display text-sm font-bold">Nurul Iman</p>
              <p className="text-[11px] font-semibold tracking-wide text-stone-500">
                PANTI ASUHAN ISLAMI
              </p>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-stone-900">Masuk ke SIMPAN</h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Gunakan akun pengurus untuk mengelola data panti.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email" required>
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="nama@nuruliman.or.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Kata Sandi" required>
              <Input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                {error}
              </p>
            ) : null}
            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Memeriksa..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-dashed border-pine-300 bg-pine-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-pine-700">
              Akun demo · sandi: <span className="font-mono">panti123</span>
            </p>
            <div className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("panti123");
                    setError(null);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-pine-200 bg-white px-3 py-2 text-left transition hover:border-pine-400"
                >
                  <span>
                    <span className="block text-sm font-bold text-stone-800">{acc.label}</span>
                    <span className="block text-xs text-stone-500">{acc.email}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase text-pine-600">
                    {acc.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
