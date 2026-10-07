-- SIMPAN Database Schema for Neon (PostgreSQL)
-- Jalankan SQL ini di Neon Console atau via psql

CREATE TYPE role AS ENUM ('admin', 'pengurus');
CREATE TYPE gender AS ENUM ('L', 'P');
CREATE TYPE orphan_status AS ENUM ('yatim', 'piatu', 'yatim_piatu', 'dhuafa');
CREATE TYPE child_status AS ENUM ('aktif', 'adopsi', 'keluar', 'mandiri');
CREATE TYPE need_category AS ENUM ('pangan', 'sandang', 'pendidikan', 'kesehatan', 'papan', 'ibadah');
CREATE TYPE need_status AS ENUM ('terpenuhi', 'direncanakan');
CREATE TYPE case_type AS ENUM ('perundungan', 'kekerasan', 'penelantaran', 'kesehatan', 'eksploitasi', 'hak_asuh', 'lainnya');
CREATE TYPE severity AS ENUM ('ringan', 'sedang', 'berat');
CREATE TYPE case_status AS ENUM ('terbuka', 'ditangani', 'selesai', 'dirujuk');
CREATE TYPE donation_category AS ENUM ('zakat', 'infak', 'sedekah', 'wakaf');
CREATE TYPE donation_type AS ENUM ('uang', 'barang');
CREATE TYPE donor_type AS ENUM ('perorangan', 'organisasi');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role role NOT NULL DEFAULT 'pengurus',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  token VARCHAR(128) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE children (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  gender gender NOT NULL,
  birth_date DATE NOT NULL,
  birth_place VARCHAR(120),
  orphan_status orphan_status NOT NULL,
  admission_date DATE NOT NULL,
  guardian_name VARCHAR(120),
  guardian_phone VARCHAR(32),
  address TEXT,
  school VARCHAR(120),
  health_notes TEXT,
  notes TEXT,
  status child_status NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE needs (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category need_category NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  need_date DATE NOT NULL,
  status need_status NOT NULL DEFAULT 'direncanakan',
  fulfilled_by VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE protection_cases (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  case_type case_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  severity severity NOT NULL,
  status case_status NOT NULL DEFAULT 'terbuka',
  report_date DATE NOT NULL,
  report_source VARCHAR(120),
  handled_by VARCHAR(120),
  resolution TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  donor_name VARCHAR(150) NOT NULL,
  donor_type donor_type NOT NULL DEFAULT 'perorangan',
  category donation_category NOT NULL,
  donation_type donation_type NOT NULL DEFAULT 'uang',
  amount INTEGER NOT NULL DEFAULT 0,
  item_description TEXT,
  donation_date DATE NOT NULL,
  received_by VARCHAR(120),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_children_status ON children(status);
CREATE INDEX idx_needs_child_id ON needs(child_id);
CREATE INDEX idx_needs_status ON needs(status);
CREATE INDEX idx_protection_cases_child_id ON protection_cases(child_id);
CREATE INDEX idx_protection_cases_status ON protection_cases(status);
CREATE INDEX idx_donations_donation_date ON donations(donation_date);
CREATE INDEX idx_donations_category ON donations(category);
