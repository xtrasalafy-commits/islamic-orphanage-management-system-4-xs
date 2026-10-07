/* Seed script: run with `npx tsx --env-file=.env scripts/seed.ts` */
import { config } from "dotenv";
config();

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { children, donations, needs, protectionCases, users } from "../src/db/schema";

const PASSWORD = "panti123";

/** Format a Date as YYYY-MM-DD (UTC-safe enough for demo data). */
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Date n days from today (negative = past). */
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
}

/** Date `m` months ago on day `day` (clamped to today for current month). */
function monthsAgo(m: number, day: number) {
  const now = new Date();
  const clamped = m === 0 ? Math.min(day, now.getDate()) : day;
  const d = new Date(now.getFullYear(), now.getMonth() - m, Math.max(1, clamped));
  return iso(d);
}

async function main() {
  console.log("Memeriksa data yang sudah ada...");
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    console.log("Database sudah berisi data. Seed dilewati.");
    return;
  }

  const hash = await bcrypt.hash(PASSWORD, 10);

  console.log("Menambahkan pengguna...");
  const [admin, maryam, bilal] = await db
    .insert(users)
    .values([
      { name: "Ust. Ahmad Fauzi", email: "ahmad@nuruliman.or.id", passwordHash: hash, role: "admin" },
      { name: "Ustzh. Siti Maryam", email: "maryam@nuruliman.or.id", passwordHash: hash, role: "pengurus" },
      { name: "Bilal Ramadhan", email: "bilal@nuruliman.or.id", passwordHash: hash, role: "pengurus" },
    ])
    .returning();

  console.log("Menambahkan anak asuh...");
  const childRows = await db
    .insert(children)
    .values([
      {
        name: "Muhammad Rizki Ramadhan",
        gender: "L",
        birthDate: "2016-03-14",
        birthPlace: "Yogyakarta",
        orphanStatus: "yatim",
        admissionDate: "2022-07-18",
        guardianName: "Hasan Basri (paman)",
        guardianPhone: "0812 2789 4451",
        address: "Jl. Kaliurang KM 7, Sleman",
        school: "SDN Condongcatur 1",
        healthNotes: "Alergi kacang",
        notes: "Sangat suka menghafal surah pendek, juara lomba tahfidz tingkat kecamatan.",
        status: "aktif",
      },
      {
        name: "Aisyah Putri Maharani",
        gender: "P",
        birthDate: "2013-11-02",
        birthPlace: "Bantul",
        orphanStatus: "yatim_piatu",
        admissionDate: "2020-01-10",
        guardianName: "Nenek Suminah",
        guardianPhone: "0813 9012 3378",
        address: "Imogiri Timur, Bantul",
        school: "MTs Nurul Iman",
        healthNotes: null,
        notes: "Bercita-cita menjadi dokter. Rajin membantu adik-adik belajar.",
        status: "aktif",
      },
      {
        name: "Ahmad Zaki Pratama",
        gender: "L",
        birthDate: "2011-05-21",
        birthPlace: "Kulon Progo",
        orphanStatus: "piatu",
        admissionDate: "2023-02-01",
        guardianName: "Bpk. Slamet (ayah)",
        guardianPhone: "0821 3345 0921",
        address: "Wates, Kulon Progo",
        school: "MTs Nurul Iman",
        healthNotes: "Asma ringan, membawa inhaler",
        notes: null,
        status: "aktif",
      },
      {
        name: "Fatimah Azzahra",
        gender: "P",
        birthDate: "2017-08-09",
        birthPlace: "Yogyakarta",
        orphanStatus: "yatim_piatu",
        admissionDate: "2021-06-14",
        guardianName: "Bibi Khotimah",
        guardianPhone: "0857 4321 8865",
        address: "Gamping, Sleman",
        school: "SD Muhammadiyah 3",
        healthNotes: null,
        notes: "Pemalu, butuh pendampingan adaptasi sosial.",
        status: "aktif",
      },
      {
        name: "Yusuf Alfarizi",
        gender: "L",
        birthDate: "2009-12-30",
        birthPlace: "Gunungkidul",
        orphanStatus: "dhuafa",
        admissionDate: "2021-09-01",
        guardianName: "Ibu Rohimah (ibu)",
        guardianPhone: "0819 0456 2233",
        address: "Wonosari, Gunungkidul",
        school: "MA Nurul Iman",
        healthNotes: null,
        notes: "Aktif di klub futsal dan menjadi muadzin masjid panti.",
        status: "aktif",
      },
      {
        name: "Khadijah Rahma Anindita",
        gender: "P",
        birthDate: "2014-04-17",
        birthPlace: "Sleman",
        orphanStatus: "yatim",
        admissionDate: "2023-07-17",
        guardianName: "Ibu Nurul (ibu)",
        guardianPhone: "0838 6677 1122",
        address: "Ngaglik, Sleman",
        school: "SDN Condongcatur 1",
        healthNotes: "Memakai kacamata minus 1,5",
        notes: null,
        status: "aktif",
      },
      {
        name: "Ibrahim Malik",
        gender: "L",
        birthDate: "2012-01-25",
        birthPlace: "Bantul",
        orphanStatus: "yatim_piatu",
        admissionDate: "2020-11-23",
        guardianName: "Paman Sarif",
        guardianPhone: "0812 5544 7788",
        address: "Kasihan, Bantul",
        school: "MTs Nurul Iman",
        healthNotes: null,
        notes: "Tertarik pada kaligrafi, ikut ekstrakurikuler khat.",
        status: "aktif",
      },
      {
        name: "Zainab Husna Kamila",
        gender: "P",
        birthDate: "2018-06-05",
        birthPlace: "Yogyakarta",
        orphanStatus: "dhuafa",
        admissionDate: "2024-01-08",
        guardianName: "Ibu Lastri (ibu)",
        guardianPhone: "0856 2211 4433",
        address: "Tegalrejo, Kota Yogyakarta",
        school: "TK Aisyiyah Bustanul Athfal",
        healthNotes: null,
        notes: null,
        status: "aktif",
      },
      {
        name: "Umar Abdullah Hakim",
        gender: "L",
        birthDate: "2008-10-11",
        birthPlace: "Kulon Progo",
        orphanStatus: "yatim",
        admissionDate: "2019-07-15",
        guardianName: "Ibu Siti (ibu)",
        guardianPhone: "0877 9900 5566",
        address: "Pengasih, Kulon Progo",
        school: "MA Nurul Iman",
        healthNotes: null,
        notes: "Ketua asrama putra, dipersiapkan program kemandirian.",
        status: "aktif",
      },
      {
        name: "Halimah Salsabila",
        gender: "P",
        birthDate: "2015-02-28",
        birthPlace: "Gunungkidul",
        orphanStatus: "piatu",
        admissionDate: "2022-03-21",
        guardianName: "Bpk. Darto (ayah)",
        guardianPhone: "0821 8899 3344",
        address: "Playen, Gunungkidul",
        school: "SD Muhammadiyah 3",
        healthNotes: null,
        notes: null,
        status: "aktif",
      },
      {
        name: "Ali Akbar Ramadhan",
        gender: "L",
        birthDate: "2007-09-19",
        birthPlace: "Yogyakarta",
        orphanStatus: "yatim_piatu",
        admissionDate: "2018-08-20",
        guardianName: "-",
        guardianPhone: null,
        address: "Jetis, Kota Yogyakarta",
        school: "SMK Negeri 2 Yogyakarta",
        healthNotes: null,
        notes: "Diterima magang di bengkel mitra. Mulai hidup mandiri.",
        status: "mandiri",
      },
    ])
    .returning();

  const cid = (name: string) => childRows.find((c) => c.name === name)!.id;

  console.log("Menambahkan catatan kebutuhan dasar...");
  await db.insert(needs).values([
    { childId: cid("Muhammad Rizki Ramadhan"), category: "pangan", description: "Kebutuhan makan & bekal sekolah sebulan", amount: 900000, needDate: daysFromNow(-2), status: "terpenuhi", fulfilledBy: "Ustzh. Siti Maryam" },
    { childId: cid("Muhammad Rizki Ramadhan"), category: "pendidikan", description: "Iuran SPP bulan berjalan", amount: 175000, needDate: daysFromNow(-4), status: "terpenuhi", fulfilledBy: "Ust. Ahmad Fauzi" },
    { childId: cid("Muhammad Rizki Ramadhan"), category: "ibadah", description: "Al-Qur'an baru untuk hafalan", amount: 85000, needDate: daysFromNow(-30), status: "terpenuhi", fulfilledBy: "Bilal Ramadhan" },
    { childId: cid("Aisyah Putri Maharani"), category: "sandang", description: "Seragam pramuka dan jilbab baru", amount: 420000, needDate: daysFromNow(-3), status: "terpenuhi", fulfilledBy: "Ustzh. Siti Maryam" },
    { childId: cid("Aisyah Putri Maharani"), category: "pendidikan", description: "Buku paket semester berjalan", amount: 310000, needDate: daysFromNow(9), status: "direncanakan", fulfilledBy: null },
    { childId: cid("Ahmad Zaki Pratama"), category: "kesehatan", description: "Kontrol asma & obat inhaler bulanan", amount: 260000, needDate: daysFromNow(-1), status: "terpenuhi", fulfilledBy: "Ustzh. Siti Maryam" },
    { childId: cid("Ahmad Zaki Pratama"), category: "ibadah", description: "Perlengkapan sholat (peci & sarung)", amount: 130000, needDate: daysFromNow(-21), status: "terpenuhi", fulfilledBy: "Bilal Ramadhan" },
    { childId: cid("Fatimah Azzahra"), category: "kesehatan", description: "Vitamin anak dan pemeriksaan gigi", amount: 200000, needDate: daysFromNow(12), status: "direncanakan", fulfilledBy: null },
    { childId: cid("Fatimah Azzahra"), category: "papan", description: "Kasur & seprai baru asrama putri", amount: 650000, needDate: daysFromNow(-40), status: "terpenuhi", fulfilledBy: "Ust. Ahmad Fauzi" },
    { childId: cid("Yusuf Alfarizi"), category: "pendidikan", description: "Pendaftaran lomba tahfidz provinsi", amount: 150000, needDate: daysFromNow(15), status: "direncanakan", fulfilledBy: null },
    { childId: cid("Yusuf Alfarizi"), category: "sandang", description: "Jersey & sepatu futsal", amount: 380000, needDate: daysFromNow(-25), status: "terpenuhi", fulfilledBy: "Bilal Ramadhan" },
    { childId: cid("Khadijah Rahma Anindita"), category: "kesehatan", description: "Kacamata baru (minus bertambah)", amount: 550000, needDate: daysFromNow(8), status: "direncanakan", fulfilledBy: null },
    { childId: cid("Ibrahim Malik"), category: "ibadah", description: "Alat kaligrafi untuk ekstrakurikuler", amount: 240000, needDate: daysFromNow(-5), status: "terpenuhi", fulfilledBy: "Bilal Ramadhan" },
    { childId: cid("Zainab Husna Kamila"), category: "sandang", description: "Seragam TK dua stel", amount: 300000, needDate: daysFromNow(-2), status: "terpenuhi", fulfilledBy: "Ustzh. Siti Maryam" },
    { childId: cid("Umar Abdullah Hakim"), category: "pendidikan", description: "Biaya ujian praktik MA", amount: 275000, needDate: daysFromNow(18), status: "direncanakan", fulfilledBy: null },
    { childId: cid("Halimah Salsabila"), category: "pangan", description: "Susu & makanan tambahan bulanan", amount: 400000, needDate: daysFromNow(-3), status: "terpenuhi", fulfilledBy: "Ustzh. Siti Maryam" },
  ]);

  console.log("Menambahkan kasus perlindungan...");
  await db.insert(protectionCases).values([
    {
      childId: cid("Muhammad Rizki Ramadhan"),
      caseType: "perundungan",
      title: "Ejekan dari teman saat mengaji",
      description: "Rizki diejek karena belum lancar membaca huruf sambung, menjadi enggan mengikuti TPA sore.",
      severity: "ringan",
      status: "ditangani",
      reportDate: daysFromNow(-2),
      reportSource: "Pengasuh asrama putra",
      handledBy: "Ustzh. Siti Maryam",
      resolution: "Mediasi antar anak dan pendampingan mengaji privat tiga kali seminggu.",
    },
    {
      childId: cid("Ahmad Zaki Pratama"),
      caseType: "kesehatan",
      title: "Serangan asma saat olahraga",
      description: "Zaki sesak napas saat pelajaran olahraga, dibawa ke klinik terdekat oleh pengurus.",
      severity: "sedang",
      status: "selesai",
      reportDate: daysFromNow(-18),
      reportSource: "Guru olahraga MTs",
      handledBy: "Ust. Ahmad Fauzi",
      resolution: "Penanganan klinik selesai, inhaler selalu dibawa, surat keterangan sekolah diserahkan.",
    },
    {
      childId: cid("Fatimah Azzahra"),
      caseType: "hak_asuh",
      title: "Permintaan pengasuhan oleh kerabat jauh",
      description: "Kerabat jauh datang meminta hak asuh tanpa dokumen resmi. Perlu verifikasi keluarga dan koordinasi dinas sosial.",
      severity: "berat",
      status: "ditangani",
      reportDate: daysFromNow(-4),
      reportSource: "Kepala Panti",
      handledBy: "Ust. Ahmad Fauzi",
      resolution: "Menunggu verifikasi silsilah dan pertemuan dengan pekerja sosial Dinsos DIY.",
    },
    {
      childId: cid("Zainab Husna Kamila"),
      caseType: "kesehatan",
      title: "Demam tinggi dua hari",
      description: "Zainab demam 39°C selama dua hari, perlu pemeriksaan dokter anak.",
      severity: "ringan",
      status: "selesai",
      reportDate: daysFromNow(-10),
      reportSource: "Pengasuh asrama putri",
      handledBy: "Ustzh. Siti Maryam",
      resolution: "Dinyatakan radang tenggorokan ringan, sembuh setelah pengobatan tiga hari.",
    },
    {
      childId: cid("Yusuf Alfarizi"),
      caseType: "penelantaran",
      title: "Iuran sekolah menunggak dua bulan",
      description: "Administrasi sekolah menahan rapor karena tunggakan. Berisiko menghambat kenaikan kelas.",
      severity: "sedang",
      status: "terbuka",
      reportDate: daysFromNow(-1),
      reportSource: "Wali kelas MA",
      handledBy: null,
      resolution: null,
    },
    {
      childId: cid("Umar Abdullah Hakim"),
      caseType: "lainnya",
      title: "Adaptasi jadwal magang dan asrama",
      description: "Umar kesulitan membagi waktu magang dengan kegiatan wajib panti, sempat dua kali izin mendadak.",
      severity: "ringan",
      status: "dirujuk",
      reportDate: daysFromNow(-26),
      reportSource: "Pembina asrama",
      handledBy: "Ust. Ahmad Fauzi",
      resolution: "Dirujuk ke program kemandirian yayasan untuk penyesuaian jadwal.",
    },
  ]);

  console.log("Menambahkan donasi...");
  await db.insert(donations).values([
    { donorName: "H. Abdullah Saleh", donorType: "perorangan", category: "zakat", donationType: "uang", amount: 2500000, itemDescription: null, donationDate: monthsAgo(0, 4), receivedBy: "Ust. Ahmad Fauzi", notes: "Zakat maal tahunan" },
    { donorName: "Majelis Ta'lim Al-Ikhlas", donorType: "organisasi", category: "infak", donationType: "uang", amount: 1750000, itemDescription: null, donationDate: monthsAgo(0, 2), receivedBy: "Bilal Ramadhan", notes: "Infak rutin bulanan" },
    { donorName: "Ibu Ratna Dewi", donorType: "perorangan", category: "sedekah", donationType: "barang", amount: 0, itemDescription: "20 kg beras, 5 dus mi instan, 10 liter minyak goreng", donationDate: monthsAgo(0, 5), receivedBy: "Ustzh. Siti Maryam", notes: null },
    { donorName: "PT Berkah Sejahtera", donorType: "organisasi", category: "zakat", donationType: "uang", amount: 5000000, itemDescription: null, donationDate: monthsAgo(1, 3), receivedBy: "Ust. Ahmad Fauzi", notes: "Zakat perusahaan" },
    { donorName: "Hamba Allah", donorType: "perorangan", category: "sedekah", donationType: "uang", amount: 500000, itemDescription: null, donationDate: monthsAgo(1, 21), receivedBy: "Bilal Ramadhan", notes: "Tidak ingin dicatat namanya" },
    { donorName: "Keluarga Bpk. Sudirman", donorType: "perorangan", category: "wakaf", donationType: "uang", amount: 10000000, itemDescription: null, donationDate: monthsAgo(2, 18), receivedBy: "Ust. Ahmad Fauzi", notes: "Wakaf pembangunan mushola baru" },
    { donorName: "Komunitas Sedekah Jumat", donorType: "organisasi", category: "sedekah", donationType: "barang", amount: 0, itemDescription: "30 paket alat tulis dan tas sekolah", donationDate: monthsAgo(2, 24), receivedBy: "Ustzh. Siti Maryam", notes: null },
    { donorName: "Ibu Hj. Aminah", donorType: "perorangan", category: "infak", donationType: "uang", amount: 750000, itemDescription: null, donationDate: monthsAgo(3, 14), receivedBy: "Ustzh. Siti Maryam", notes: "Diniatkan untuk almarhum suami" },
    { donorName: "Toko Buku Islami Cahaya", donorType: "organisasi", category: "sedekah", donationType: "barang", amount: 0, itemDescription: "40 mushaf Al-Qur'an dan 25 buku iqra", donationDate: monthsAgo(3, 8), receivedBy: "Bilal Ramadhan", notes: null },
    { donorName: "Bpk. Hendra Wijaya", donorType: "perorangan", category: "zakat", donationType: "uang", amount: 1250000, itemDescription: null, donationDate: monthsAgo(4, 20), receivedBy: "Ust. Ahmad Fauzi", notes: null },
    { donorName: "Masjid Agung Al-Falah", donorType: "organisasi", category: "infak", donationType: "uang", amount: 2000000, itemDescription: null, donationDate: monthsAgo(4, 12), receivedBy: "Ust. Ahmad Fauzi", notes: "Penyaluran kotak infak Jumat" },
    { donorName: "Ibu Sari Puspita", donorType: "perorangan", category: "sedekah", donationType: "barang", amount: 0, itemDescription: "Pakaian layak pakai 3 kardus", donationDate: monthsAgo(5, 6), receivedBy: "Ustzh. Siti Maryam", notes: null },
    { donorName: "Bpk. Ridwan Kamil", donorType: "perorangan", category: "infak", donationType: "uang", amount: 300000, itemDescription: null, donationDate: monthsAgo(5, 22), receivedBy: "Bilal Ramadhan", notes: null },
    { donorName: "Yayasan Peduli Anak Sholeh", donorType: "organisasi", category: "sedekah", donationType: "uang", amount: 3500000, itemDescription: null, donationDate: monthsAgo(2, 10), receivedBy: "Ust. Ahmad Fauzi", notes: "Bantuan beasiswa semester" },
  ]);

  console.log("Seed selesai! Login demo: ahmad@nuruliman.or.id / maryam@nuruliman.or.id, sandi: panti123");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  })
  .finally(() => pool.end().catch(() => undefined));
