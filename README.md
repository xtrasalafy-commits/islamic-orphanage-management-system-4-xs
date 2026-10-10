# SIMPAAN — Sistem Manajemen Panti Asuhan

> **Open Source oleh MZF — 2026**

SIMPAN (Sistem Manajemen Panti Asuhan) adalah aplikasi web untuk membantu pengurus panti asuhan mencatat anak asuh, memantau pemenuhan kebutuhan dasar, menangani kasus perlindungan anak, dan mengelola donasi zakat, infak, sedekah, dan wakaf dalam satu tempat.

Web app ini **gratis & bebas iklan**. Jika ingin mendukung pengembangan, kunjungi halaman [Trakteer](https://trakteer.id/perpus_opera/) atau klik tombol **"Traktir Kopi"** di sudut kanan bawah layar.

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Screenshot / Demo](#screenshot--demo)
- [Persyaratan](#persyaratan)
- [Instalasi & Setup Lokal](#instalasi--setup-lokal)
- [Setup Database (Neon)](#setup-database-neon)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Download Source Code](#download-source-code)
- [Akun Demo](#akun-demo)
- [Struktur Proyek](#struktur-proyek)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## Fitur

- **Dasbor** — Ringkasan jumlah anak asuh, kebutuhan terpenuhi bulan ini, kasus perlindungan terbuka, donasi bulan ini, grafik donasi 6 bulan, dan donasi terbaru.
- **Manajemen Anak Asuh** — CRUD data anak (nama, jenis kelamin, tanggal lahir, status yatim/piatu, wali, sekolah, alamat, catatan kesehatan). Detail anak menampilkan riwayat kebutuhan & kasus perlindungan.
- **Kebutuhan Dasar** — Pencatatan pemenuhan kebutuhan pangan, sandang, pendidikan, kesehatan, tempat tinggal, dan ibadah. Toggle status terpenuhi/direncanakan dengan satu klik.
- **Perlindungan Anak** — Pencatatan & penanganan kasus (perundungan, kekerasan, penelantaran, kesehatan, eksploitasi, hak asuh) dengan tingkat keparahan dan status.
- **Donasi** — Pencatatan donasi uang & barang (zakat, infak, sedekah, wakaf) dengan filter & ringkasan total.
- **Manajemen Pengguna** — Admin (Kepala Panti) dapat menambah/mengubah/menghapus pengurus, mengganti peran, dan mereset kata sandi.
- **Autentikasi** — Login berbasis session cookie (bcrypt + token), perlindungan rute sisi server.
- **Responsive** — Tampilan optimal di desktop, tablet, dan mobile.
- **Trakteer Widget** — Floating widget untuk dukungan via Trakteer dengan QR code.

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Bahasa | TypeScript 5.9 |
| Database | PostgreSQL via [Neon](https://neon.tech/) (serverless driver) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) 0.45 |
| UI | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/) |
| Data Fetching | [SWR](https://swr.vercel.app/) |
| Font | Manrope + Sora (next/font) |
| QR Code | [qrcode.react](https://www.npmjs.com/package/qrcode.react) |
| Source Download | [adm-zip](https://www.npmjs.com/package/adm-zip) |
| Password Hashing | [bcryptjs](https://www.npmjs.com/package/bcryptjs) |

## Screenshot / Demo

_Setelah deploy, tambahkan screenshot di sini._

## Persyaratan

- **Node.js** 18.18+ (direkomendasikan 20+)
- **npm** 10+ (atau pnpm/yarn/bun)
- **Database PostgreSQL** — [Neon](https://neon.tech/) (gratis, direkomendasikan) atau PostgreSQL lokal

## Instalasi & Setup Lokal

```bash
# 1. Clone repository
git clone https://github.com/USERNAME/islamic-orphanage-management-system.git
cd islamic-orphanage-management-system

# 2. Install dependencies
npm install

# 3. Buat file .env dan isi DATABASE_URL
cp .env.example .env
# Edit .env, isi dengan URL database Neon Anda

# 4. Buat schema di database
npx drizzle-kit push

# 5. Isi data contoh (seed)
npx tsx --env-file=.env scripts/seed.ts

# 6. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Setup Database (Neon)

1. **Buat akun & project** di [Neon Console](https://console.neon.tech/).
2. Salin **connection string** (format pooler) dari dashboard Neon.
3. Buat file `.env` di root proyek:
   ```
   DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require
   ```
4. Jalankan `npx drizzle-kit push` untuk membuat seluruh tabel.
5. Jalankan `npx tsx --env-file=.env scripts/seed.ts` untuk mengisi data contoh.

> **Alternatif tanpa ORM:** Jalankan `scripts/schema.sql` + `scripts/seed.sql` langsung di Neon Console (SQL Editor).

## Deploy ke Vercel

1. Push kode ke repository GitHub/GitLab/Bitbucket.
2. Buka [Vercel Dashboard](https://vercel.com/new) dan import repository.
3. Pada **Environment Variables**, tambahkan:
   - `DATABASE_URL` = URL koneksi Neon (format pooler, `?sslmode=require`)
4. Klik **Deploy**.

> **Penting:** Aplikasi ini menggunakan **Neon serverless driver** (`@neondatabase/serverless` + `drizzle-orm/neon-http`) yang berkomunikasi via HTTP, bukan TCP Pool. Ini wajib untuk Vercel serverless — driver `pg` tradisional akan mengalami "connection terminated" saat cold start.

> **Catatan:** Pastikan schema database sudah dibuat (`drizzle-kit push` atau `schema.sql`) **sebelum** deploy, karena build Next.js memerlukan `DATABASE_URL`.

## Download Source Code

Klik tombol **"Download Source Code Lengkap"** di dalam modal Trakteer (tombol "Traktir Kopi" di sudut kanan bawah layar), atau akses langsung endpoint:

```
GET /api/download-source
```

Endpoint ini akan membuat file ZIP berisi seluruh source code secara on-the-fly dan mengunduhnya sebagai `simpan-source-code.zip`.

## Akun Demo

Setelah seeding, gunakan akun berikut (sandinya sama untuk semua):

| Peran | Email | Sandi |
|---|---|---|
| Kepala Panti (Admin) | `ahmad@nuruliman.or.id` | `panti123` |
| Pengurus / Pengasuh | `maryam@nuruliman.or.id` | `panti123` |
| Pengurus / Pengasuh | `bilal@nuruliman.or.id` | `panti123` |

## Struktur Proyek

```
.
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes (REST)
│   │   │   ├── auth/               # login, logout, me
│   │   │   ├── children/           # CRUD anak asuh
│   │   │   ├── donations/          # CRUD donasi
│   │   │   ├── download-source/    # Download source code (zip)
│   │   │   ├── health/             # Health check DB
│   │   │   ├── needs/              # CRUD kebutuhan dasar
│   │   │   ├── protection/         # CRUD kasus perlindungan
│   │   │   ├── stats/              # Statistik dasbor
│   │   │   └── users/              # CRUD pengguna (admin)
│   │   ├── (app)/                  # Halaman app (butuh login)
│   │   │   ├── children/
│   │   │   ├── dashboard/
│   │   │   ├── donations/
│   │   │   ├── needs/
│   │   │   ├── protection/
│   │   │   └── users/
│   │   ├── login/                  # Halaman login
│   │   ├── globals.css             # Styling global + tema
│   │   ├── layout.tsx              # Root layout (Toast + Trakteer)
│   │   └── page.tsx                # Redirect ke /login atau /dashboard
│   ├── components/
│   │   ├── app-shell.tsx           # Sidebar + mobile drawer
│   │   ├── charts.tsx              # Grafik donut & bar (SVG)
│   │   ├── toast.tsx               # Sistem notifikasi toast
│   │   ├── trakteer-widget.tsx     # Floating widget Trakteer + QR
│   │   └── ui.tsx                  # Komponen UI (Button, Modal, dll)
│   ├── db/
│   │   ├── index.ts                # Koneksi database (pg Pool)
│   │   └── schema.ts               # Drizzle schema (tabel & tipe)
│   └── lib/
│       ├── api.ts                  # Fetcher & helper API client
│       ├── auth.ts                 # Session & password hashing
│       ├── hooks.ts                # useCurrentUser hook
│       ├── types.ts                # Tipe TypeScript bersama
│       └── utils.ts                # Formatter rupiah, tanggal, label
├── scripts/
│   ├── schema.sql                  # Schema SQL untuk Neon Console
│   ├── seed.sql                    # Data contoh (SQL)
│   └── seed.ts                     # Data contoh (Drizzle ORM)
├── .env.example                    # Template environment variables
├── drizzle.config.ts               # Konfigurasi Drizzle Kit
└── package.json
```

## Kontribusi

Kontribusi sangat diterima! Silakan buat Pull Request atau Issue di repository.

## Lisensi

**Open Source oleh MZF — 2026**

Kode ini bebas digunakan, dimodifikasi, dan didistribusikan untuk tujuan amal dan pengembangan panti asuhan.
