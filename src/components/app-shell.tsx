"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import type { SafeUser } from "@/lib/types";
import { cn, initials, ROLE_LABEL } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/children", label: "Anak Asuh", icon: Users },
  { href: "/needs", label: "Kebutuhan Dasar", icon: HeartHandshake },
  { href: "/protection", label: "Perlindungan", icon: ShieldCheck },
  { href: "/donations", label: "Donasi", icon: HandCoins },
];

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const items = user.role === "admin"
    ? [...NAV_ITEMS, { href: "/users", label: "Pengguna", icon: UserCog }]
    : NAV_ITEMS;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout", {});
      router.push("/login");
      router.refresh();
    } catch {
      toast("error", "Gagal keluar", "Silakan coba lagi.");
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col bg-pine-950 text-pine-100">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine-800 text-amber-300 shadow-inner">
          <MoonStar size={22} />
        </span>
        <div>
          <p className="font-display text-sm font-bold leading-tight text-white">Nurul Iman</p>
          <p className="text-[11px] font-semibold tracking-wide text-pine-300">
            PANTI ASUHAN ISLAMI
          </p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-pine-800 text-white shadow-sm"
                  : "text-pine-300 hover:bg-pine-900 hover:text-pine-100"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition",
                  active ? "text-amber-300" : "text-pine-400 group-hover:text-pine-200"
                )}
              />
              {item.label}
              {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-300" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-pine-900 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-pine-900/70 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-xs font-bold text-pine-950">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-pine-300">{ROLE_LABEL[user.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Keluar"
            title="Keluar"
            className="rounded-lg p-2 text-pine-300 transition hover:bg-pine-800 hover:text-white disabled:opacity-50"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-stone-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            {sidebar}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 rounded-lg p-2 text-pine-300 hover:bg-pine-900 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200 bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
          className="rounded-lg border border-stone-300 bg-white p-2 text-stone-600"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-950 text-amber-300">
            <MoonStar size={16} />
          </span>
          <span className="font-display text-sm font-bold">Panti Asuhan Nurul Iman</span>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">{children}</main>
    </div>
  );
}
