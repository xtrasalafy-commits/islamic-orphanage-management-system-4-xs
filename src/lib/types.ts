export type Role = "admin" | "pengurus";

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type OrphanStatus = "yatim" | "piatu" | "yatim_piatu" | "dhuafa";
export type ChildStatus = "aktif" | "adopsi" | "keluar" | "mandiri";
export type NeedCategory =
  | "pangan"
  | "sandang"
  | "pendidikan"
  | "kesehatan"
  | "papan"
  | "ibadah";
export type NeedStatus = "terpenuhi" | "direncanakan";
export type CaseType =
  | "perundungan"
  | "kekerasan"
  | "penelantaran"
  | "kesehatan"
  | "eksploitasi"
  | "hak_asuh"
  | "lainnya";
export type Severity = "ringan" | "sedang" | "berat";
export type CaseStatus = "terbuka" | "ditangani" | "selesai" | "dirujuk";
export type DonationCategory = "zakat" | "infak" | "sedekah" | "wakaf";
export type DonationType = "uang" | "barang";
export type DonorType = "perorangan" | "organisasi";

export interface ChildRow {
  id: number;
  name: string;
  gender: "L" | "P";
  birthDate: string;
  birthPlace: string | null;
  orphanStatus: OrphanStatus;
  admissionDate: string;
  guardianName: string | null;
  guardianPhone: string | null;
  address: string | null;
  school: string | null;
  healthNotes: string | null;
  notes: string | null;
  status: ChildStatus;
}

export interface NeedRow {
  id: number;
  childId: number;
  category: NeedCategory;
  description: string;
  amount: number;
  needDate: string;
  status: NeedStatus;
  fulfilledBy: string | null;
  childName: string;
}

export interface CaseRow {
  id: number;
  childId: number;
  caseType: CaseType;
  title: string;
  description: string;
  severity: Severity;
  status: CaseStatus;
  reportDate: string;
  reportSource: string | null;
  handledBy: string | null;
  resolution: string | null;
  childName: string;
}

export interface DonationRow {
  id: number;
  donorName: string;
  donorType: DonorType;
  category: DonationCategory;
  donationType: DonationType;
  amount: number;
  itemDescription: string | null;
  donationDate: string;
  receivedBy: string | null;
  notes: string | null;
}

export interface UserRow extends SafeUser {
  createdAt?: string;
}

export interface DashboardStats {
  totalChildren: number;
  aktif: number;
  byStatus: { yatim: number; piatu: number; yatim_piatu: number; dhuafa: number };
  needsMonth: { fulfilled: number; amount: number; planned: number };
  needsByCategory: { category: NeedCategory; total: number }[];
  protection: { terbuka: number; ditangani: number; selesai: number; beratAktif: number };
  donationsMonth: { total: number; count: number; barang: number };
  donationSeries: { label: string; total: number }[];
  recentDonations: DonationRow[];
  openCases: CaseRow[];
}
