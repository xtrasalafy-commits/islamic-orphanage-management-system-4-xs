import type {
  CaseStatus,
  CaseType,
  ChildStatus,
  DonationCategory,
  NeedCategory,
  OrphanStatus,
  Severity,
} from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function rupiah(value: number) {
  return rupiahFmt.format(value || 0);
}

export function formatShortDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateLong(iso: string) {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ageFrom(birthDate: string) {
  const b = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, label: `${years} thn ${months} bln` };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const ORPHAN_LABEL: Record<OrphanStatus, string> = {
  yatim: "Yatim",
  piatu: "Piatu",
  yatim_piatu: "Yatim Piatu",
  dhuafa: "Dhuafa",
};

export const CHILD_STATUS_LABEL: Record<ChildStatus, string> = {
  aktif: "Aktif",
  adopsi: "Adopsi",
  keluar: "Keluar",
  mandiri: "Mandiri",
};

export const CATEGORY_LABEL: Record<NeedCategory, string> = {
  pangan: "Pangan",
  sandang: "Sandang",
  pendidikan: "Pendidikan",
  kesehatan: "Kesehatan",
  papan: "Tempat Tinggal",
  ibadah: "Ibadah & Rohani",
};

export const CATEGORY_DOT: Record<NeedCategory, string> = {
  pangan: "bg-amber-500",
  sandang: "bg-sky-500",
  pendidikan: "bg-violet-500",
  kesehatan: "bg-rose-500",
  papan: "bg-orange-500",
  ibadah: "bg-pine-500",
};

export const NEED_STATUS_LABEL: Record<string, string> = {
  terpenuhi: "Terpenuhi",
  direncanakan: "Direncanakan",
};

export const CASE_TYPE_LABEL: Record<CaseType, string> = {
  perundungan: "Perundungan",
  kekerasan: "Kekerasan",
  penelantaran: "Penelantaran",
  kesehatan: "Kesehatan Darurat",
  eksploitasi: "Eksploitasi",
  hak_asuh: "Sengketa Hak Asuh",
  lainnya: "Lainnya",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  ringan: "Ringan",
  sedang: "Sedang",
  berat: "Berat",
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  terbuka: "Terbuka",
  ditangani: "Ditangani",
  selesai: "Selesai",
  dirujuk: "Dirujuk",
};

export const DONATION_CATEGORY_LABEL: Record<DonationCategory, string> = {
  zakat: "Zakat",
  infak: "Infak",
  sedekah: "Sedekah",
  wakaf: "Wakaf",
};

export const ROLE_LABEL: Record<string, string> = {
  admin: "Kepala Panti",
  pengurus: "Pengurus",
};

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
