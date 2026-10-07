-- SIMPAN Example Seed Data for Neon (PostgreSQL)
-- Sandi default untuk semua pengguna: panti123
-- Jalankan SET search_path = public; terlebih dahulu jika perlu

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Ust. Ahmad Fauzi', 'ahmad@nuruliman.or.id', '$2a$10$rQ7p2H9X8k2Y6Z3vW5xQ.e7bC1dF4gH6iJ8kL0mN2oP4qR6sT8uV', 'admin'),
  ('Ustzh. Siti Maryam', 'maryam@nuruliman.or.id', '$2a$10$rQ7p2H9X8k2Y6Z3vW5xQ.e7bC1dF4gH6iJ8kL0mN2oP4qR6sT8uV', 'pengurus'),
  ('Bilal Ramadhan', 'bilal@nuruliman.or.id', '$2a$10$rQ7p2H9X8k2Y6Z3vW5xQ.e7bC1dF4gH6iJ8kL0mN2oP4qR6sT8uV', 'pengurus');

INSERT INTO children (name, gender, birth_date, birth_place, orphan_status, admission_date, guardian_name, guardian_phone, address, school, health_notes, notes, status) VALUES
  ('Muhammad Rizki Ramadhan', 'L', '2016-03-14', 'Yogyakarta', 'yatim', '2022-07-18', 'Hasan Basri (paman)', '0812 2789 4451', 'Jl. Kaliurang KM 7, Sleman', 'SDN Condongcatur 1', 'Alergi kacang', 'Sangat suka menghafal surah pendek, juara lomba tahfidz tingkat kecamatan.', 'aktif'),
  ('Aisyah Putri Maharani', 'P', '2013-11-02', 'Bantul', 'yatim_piatu', '2020-01-10', 'Nenek Suminah', '0813 9012 3378', 'Imogiri Timur, Bantul', 'MTs Nurul Iman', NULL, 'Bercita-cita menjadi dokter. Rajin membantu adik-adik belajar.', 'aktif'),
  ('Ahmad Zaki Pratama', 'L', '2011-05-21', 'Kulon Progo', 'piatu', '2023-02-01', 'Bpk. Slamet (ayah)', '0821 3345 0921', 'Wates, Kulon Progo', 'MTs Nurul Iman', 'Asma ringan, membawa inhaler', NULL, 'aktif'),
  ('Fatimah Azzahra', 'P', '2017-08-09', 'Yogyakarta', 'yatim_piatu', '2021-06-14', 'Bibi Khotimah', '0857 4321 8865', 'Gamping, Sleman', 'SD Muhammadiyah 3', NULL, 'Pemalu, butuh pendampingan adaptasi sosial.', 'aktif'),
  ('Yusuf Alfarizi', 'L', '2009-12-30', 'Gunungkidul', 'dhuafa', '2021-09-01', 'Ibu Rohimah (ibu)', '0819 0456 2233', 'Wonosari, Gunungkidul', 'MA Nurul Iman', NULL, 'Aktif di klub futsal dan menjadi muadzin masjid panti.', 'aktif'),
  ('Khadijah Rahma Anindita', 'P', '2014-04-17', 'Sleman', 'yatim', '2023-07-17', 'Ibu Nurul (ibu)', '0838 6677 1122', 'Ngaglik, Sleman', 'SDN Condongcatur 1', 'Memakai kacamata minus 1,5', NULL, 'aktif'),
  ('Ibrahim Malik', 'L', '2012-01-25', 'Bantul', 'yatim_piatu', '2020-11-23', 'Paman Sarif', '0812 5544 7788', 'Kasihan, Bantul', 'MTs Nurul Iman', NULL, 'Tertarik pada kaligrafi, ikut ekstrakurikuler khat.', 'aktif'),
  ('Zainab Husna Kamila', 'P', '2018-06-05', 'Yogyakarta', 'dhuafa', '2024-01-08', 'Ibu Lastri (ibu)', '0856 2211 4433', 'Tegalrejo, Kota Yogyakarta', 'TK Aisyiyah Bustanul Athfal', NULL, NULL, 'aktif'),
  ('Umar Abdullah Hakim', 'L', '2008-10-11', 'Kulon Progo', 'yatim', '2019-07-15', 'Ibu Siti (ibu)', '0877 9900 5566', 'Pengasih, Kulon Progo', 'MA Nurul Iman', NULL, 'Ketua asrama putra, dipersiapkan program kemandirian.', 'aktif'),
  ('Halimah Salsabila', 'P', '2015-02-28', 'Gunungkidul', 'piatu', '2022-03-21', 'Bpk. Darto (ayah)', '0821 8899 3344', 'Playen, Gunungkidul', 'SD Muhammadiyah 3', NULL, NULL, 'aktif'),
  ('Ali Akbar Ramadhan', 'L', '2007-09-19', 'Yogyakarta', 'yatim_piatu', '2018-08-20', '-', NULL, 'Jetis, Kota Yogyakarta', 'SMK Negeri 2 Yogyakarta', NULL, 'Diterima magang di bengkel mitra. Mulai hidup mandiri.', 'mandiri');

-- Kebutuhan dasar
INSERT INTO needs (child_id, category, description, amount, need_date, status, fulfilled_by) VALUES
  (1, 'pangan', 'Kebutuhan makan & bekal sekolah sebulan', 900000, CURRENT_DATE - INTERVAL '2 days', 'terpenuhi', 'Ustzh. Siti Maryam'),
  (1, 'pendidikan', 'Iuran SPP bulan berjalan', 175000, CURRENT_DATE - INTERVAL '4 days', 'terpenuhi', 'Ust. Ahmad Fauzi'),
  (1, 'ibadah', 'Al-Qur''an baru untuk hafalan', 85000, CURRENT_DATE - INTERVAL '30 days', 'terpenuhi', 'Bilal Ramadhan'),
  (2, 'sandang', 'Seragam pramuka dan jilbab baru', 420000, CURRENT_DATE - INTERVAL '3 days', 'terpenuhi', 'Ustzh. Siti Maryam'),
  (2, 'pendidikan', 'Buku paket semester berjalan', 310000, CURRENT_DATE + INTERVAL '9 days', 'direncanakan', NULL),
  (3, 'kesehatan', 'Kontrol asma & obat inhaler bulanan', 260000, CURRENT_DATE - INTERVAL '1 day', 'terpenuhi', 'Ustzh. Siti Maryam'),
  (3, 'ibadah', 'Perlengkapan sholat (peci & sarung)', 130000, CURRENT_DATE - INTERVAL '21 days', 'terpenuhi', 'Bilal Ramadhan'),
  (4, 'kesehatan', 'Vitamin anak dan pemeriksaan gigi', 200000, CURRENT_DATE + INTERVAL '12 days', 'direncanakan', NULL),
  (4, 'papan', 'Kasur & seprai baru asrama putri', 650000, CURRENT_DATE - INTERVAL '40 days', 'terpenuhi', 'Ust. Ahmad Fauzi'),
  (5, 'pendidikan', 'Pendaftaran lomba tahfidz provinsi', 150000, CURRENT_DATE + INTERVAL '15 days', 'direncanakan', NULL),
  (5, 'sandang', 'Jersey & sepatu futsal', 380000, CURRENT_DATE - INTERVAL '25 days', 'terpenuhi', 'Bilal Ramadhan'),
  (6, 'kesehatan', 'Kacamata baru (minus bertambah)', 550000, CURRENT_DATE + INTERVAL '8 days', 'direncanakan', NULL),
  (7, 'ibadah', 'Alat kaligrafi untuk ekstrakurikuler', 240000, CURRENT_DATE - INTERVAL '5 days', 'terpenuhi', 'Bilal Ramadhan'),
  (8, 'sandang', 'Seragam TK dua stel', 300000, CURRENT_DATE - INTERVAL '2 days', 'terpenuhi', 'Ustzh. Siti Maryam'),
  (9, 'pendidikan', 'Biaya ujian praktik MA', 275000, CURRENT_DATE + INTERVAL '18 days', 'direncanakan', NULL),
  (10, 'pangan', 'Susu & makanan tambahan bulanan', 400000, CURRENT_DATE - INTERVAL '3 days', 'terpenuhi', 'Ustzh. Siti Maryam');

-- Kasus perlindungan
INSERT INTO protection_cases (child_id, case_type, title, description, severity, status, report_date, report_source, handled_by, resolution) VALUES
  (1, 'perundungan', 'Ejekan dari teman saat mengaji', 'Rizki diejek karena belum lancar membaca huruf sambung, menjadi enggan mengikuti TPA sore.', 'ringan', 'ditangani', CURRENT_DATE - INTERVAL '2 days', 'Pengasuh asrama putra', 'Ustzh. Siti Maryam', 'Mediasi antar anak dan pendampingan mengaji privat tiga kali seminggu.'),
  (3, 'kesehatan', 'Serangan asma saat olahraga', 'Zaki sesak napas saat pelajaran olahraga, dibawa ke klinik terdekat oleh pengurus.', 'sedang', 'selesai', CURRENT_DATE - INTERVAL '18 days', 'Guru olahraga MTs', 'Ust. Ahmad Fauzi', 'Penanganan klinik selesai, inhaler selalu dibawa, surat keterangan sekolah diserahkan.'),
  (4, 'hak_asuh', 'Permintaan pengasuhan oleh kerabat jauh', 'Kerabat jauh datang meminta hak asuh tanpa dokumen resmi. Perlu verifikasi keluarga dan koordinasi dinas sosial.', 'berat', 'ditangani', CURRENT_DATE - INTERVAL '4 days', 'Kepala Panti', 'Ust. Ahmad Fauzi', 'Menunggu verifikasi silsilah dan pertemuan dengan pekerja sosial Dinsos DIY.'),
  (8, 'kesehatan', 'Demam tinggi dua hari', 'Zainab demam 39°C selama dua hari, perlu pemeriksaan dokter anak.', 'ringan', 'selesai', CURRENT_DATE - INTERVAL '10 days', 'Pengasuh asrama putri', 'Ustzh. Siti Maryam', 'Dinyatakan radang tenggorokan ringan, sembuh setelah pengobatan tiga hari.'),
  (5, 'penelantaran', 'Iuran sekolah menunggak dua bulan', 'Administrasi sekolah menahan rapor karena tunggakan. Berisiko menghambat kenaikan kelas.', 'sedang', 'terbuka', CURRENT_DATE - INTERVAL '1 day', 'Wali kelas MA', NULL, NULL),
  (9, 'lainnya', 'Adaptasi jadwal magang dan asrama', 'Umar kesulitan membagi waktu magang dengan kegiatan wajib panti, sempat dua kali izin mendadak.', 'ringan', 'dirujuk', CURRENT_DATE - INTERVAL '26 days', 'Pembina asrama', 'Ust. Ahmad Fauzi', 'Dirujuk ke program kemandirian yayasan untuk penyesuaian jadwal.');

-- Donasi
INSERT INTO donations (donor_name, donor_type, category, donation_type, amount, item_description, donation_date, received_by, notes) VALUES
  ('H. Abdullah Saleh', 'perorangan', 'zakat', 'uang', 2500000, NULL, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days', 'Ust. Ahmad Fauzi', 'Zakat maal tahunan'),
  ('Majelis Ta''lim Al-Ikhlas', 'organisasi', 'infak', 'uang', 1750000, NULL, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 days', 'Bilal Ramadhan', 'Infak rutin bulanan'),
  ('Ibu Ratna Dewi', 'perorangan', 'sedekah', 'barang', 0, '20 kg beras, 5 dus mi instan, 10 liter minyak goreng', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days', 'Ustzh. Siti Maryam', NULL),
  ('PT Berkah Sejahtera', 'organisasi', 'zakat', 'uang', 5000000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' + INTERVAL '3 days', 'Ust. Ahmad Fauzi', 'Zakat perusahaan'),
  ('Hamba Allah', 'perorangan', 'sedekah', 'uang', 500000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' + INTERVAL '21 days', 'Bilal Ramadhan', 'Tidak ingin dicatat namanya'),
  ('Keluarga Bpk. Sudirman', 'perorangan', 'wakaf', 'uang', 10000000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months' + INTERVAL '18 days', 'Ust. Ahmad Fauzi', 'Wakaf pembangunan mushola baru'),
  ('Komunitas Sedekah Jumat', 'organisasi', 'sedekah', 'barang', 0, '30 paket alat tulis dan tas sekolah', DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months' + INTERVAL '24 days', 'Ustzh. Siti Maryam', NULL),
  ('Ibu Hj. Aminah', 'perorangan', 'infak', 'uang', 750000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months' + INTERVAL '14 days', 'Ustzh. Siti Maryam', 'Diniatkan untuk almarhum suami'),
  ('Toko Buku Islami Cahaya', 'organisasi', 'sedekah', 'barang', 0, '40 mushaf Al-Qur''an dan 25 buku iqra', DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months' + INTERVAL '8 days', 'Bilal Ramadhan', NULL),
  ('Bpk. Hendra Wijaya', 'perorangan', 'zakat', 'uang', 1250000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '4 months' + INTERVAL '20 days', 'Ust. Ahmad Fauzi', NULL),
  ('Masjid Agung Al-Falah', 'organisasi', 'infak', 'uang', 2000000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '4 months' + INTERVAL '12 days', 'Ust. Ahmad Fauzi', 'Penyaluran kotak infak Jumat'),
  ('Ibu Sari Puspita', 'perorangan', 'sedekah', 'barang', 0, 'Pakaian layak pakai 3 kardus', DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months' + INTERVAL '6 days', 'Ustzh. Siti Maryam', NULL),
  ('Bpk. Ridwan Kamil', 'perorangan', 'infak', 'uang', 300000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months' + INTERVAL '22 days', 'Bilal Ramadhan', NULL),
  ('Yayasan Peduli Anak Sholeh', 'organisasi', 'sedekah', 'uang', 3500000, NULL, DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months' + INTERVAL '10 days', 'Ust. Ahmad Fauzi', 'Bantuan beasiswa semester');
