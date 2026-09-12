-- ================================================================
-- KANTORKU - Supabase Database Schema v2.1 (Include User Management)
-- Jalankan script ini di: Supabase Dashboard → SQL Editor → Run
-- ================================================================

-- 1. Tabel company_info (Profil Kantor)
CREATE TABLE IF NOT EXISTS company_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'PT. KANTORKU DIGITAL NUSANTARA',
  slogan TEXT DEFAULT 'Solusi Manajemen Kantor Cerdas & Terintegrasi',
  address TEXT DEFAULT 'Jakarta, Indonesia',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  leader_name TEXT DEFAULT '',
  leader_title TEXT DEFAULT 'Direktur Utama',
  finance_name TEXT DEFAULT '',
  finance_title TEXT DEFAULT 'Head of Finance & HR',
  logo_text TEXT DEFAULT 'KANTORKU',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel karyawan (Master Data Karyawan)
CREATE TABLE IF NOT EXISTS karyawan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nik TEXT NOT NULL,
  nama TEXT NOT NULL,
  divisi TEXT NOT NULL DEFAULT 'Umum',
  jabatan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Tetap',
  email TEXT DEFAULT '',
  no_hp TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  tanggal_masuk DATE DEFAULT CURRENT_DATE,
  gaji_pokok BIGINT NOT NULL DEFAULT 0,
  tunjangan_makan BIGINT DEFAULT 0,
  tunjangan_transport BIGINT DEFAULT 0,
  tunjangan_jabatan BIGINT DEFAULT 0,
  nama_bank TEXT DEFAULT 'BCA',
  no_rekening TEXT DEFAULT '',
  atas_nama_rekening TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel kasbon (Pinjaman Karyawan)
CREATE TABLE IF NOT EXISTS kasbon (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  karyawan_id UUID REFERENCES karyawan(id) ON DELETE CASCADE,
  nomor_kasbon TEXT NOT NULL,
  tanggal_pinjam DATE NOT NULL,
  jumlah_pinjaman BIGINT NOT NULL,
  skema TEXT NOT NULL DEFAULT 'Cicilan',
  tenor_bulan INTEGER DEFAULT 1,
  cicilan_per_bulan BIGINT DEFAULT 0,
  sisa_pinjaman BIGINT NOT NULL,
  sudah_dibayar BIGINT DEFAULT 0,
  periode_mulai TEXT DEFAULT '',
  keterangan TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Aktif',
  riwayat_pembayaran JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel gaji (Slip Gaji / Payroll)
CREATE TABLE IF NOT EXISTS gaji (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_slip TEXT NOT NULL,
  karyawan_id UUID REFERENCES karyawan(id) ON DELETE CASCADE,
  periode_bulan INTEGER NOT NULL,
  periode_tahun INTEGER NOT NULL,
  tanggal_cetak DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_bayar DATE,
  status TEXT NOT NULL DEFAULT 'Draft',
  -- Pendapatan (prefix p_)
  p_gaji_pokok BIGINT DEFAULT 0,
  p_tunjangan_makan BIGINT DEFAULT 0,
  p_tunjangan_transport BIGINT DEFAULT 0,
  p_tunjangan_jabatan BIGINT DEFAULT 0,
  p_lembur BIGINT DEFAULT 0,
  p_bonus_kinerja BIGINT DEFAULT 0,
  p_tunjangan_lain BIGINT DEFAULT 0,
  p_ket_tunjangan_lain TEXT,
  -- Potongan (prefix pot_)
  pot_kasbon BIGINT DEFAULT 0,
  pot_kasbon_id UUID REFERENCES kasbon(id) ON DELETE SET NULL,
  pot_bpjs_kesehatan BIGINT DEFAULT 0,
  pot_bpjs_ketenagakerjaan BIGINT DEFAULT 0,
  pot_pph21 BIGINT DEFAULT 0,
  pot_potongan_absen BIGINT DEFAULT 0,
  pot_potongan_lain BIGINT DEFAULT 0,
  pot_ket_potongan_lain TEXT,
  -- Summary
  total_pendapatan BIGINT DEFAULT 0,
  total_potongan BIGINT DEFAULT 0,
  gaji_bersih BIGINT DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel pengeluaran_rutin (Pengeluaran Operasional)
CREATE TABLE IF NOT EXISTS pengeluaran_rutin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_kwitansi TEXT NOT NULL,
  tanggal DATE NOT NULL,
  kategori TEXT NOT NULL,
  nominal BIGINT NOT NULL,
  metode_bayar TEXT NOT NULL DEFAULT 'Transfer Bank',
  dibayarkan_kepada TEXT NOT NULL,
  petugas TEXT DEFAULT '',
  keperluan TEXT NOT NULL,
  catatan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel app_users (Manajemen User & Hak Akses)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff', -- 'Admin' | 'Staff'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel tasks (Manajemen Tugas / Pekerjaan)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT DEFAULT '',
  assigned_to UUID REFERENCES karyawan(id) ON DELETE SET NULL,
  assigned_to_nama TEXT NOT NULL DEFAULT '',
  deadline DATE,
  prioritas TEXT NOT NULL DEFAULT 'Sedang', -- 'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak'
  status TEXT NOT NULL DEFAULT 'On Process', -- 'On Process' | 'Selesai' | 'Batal'
  catatan_staff TEXT DEFAULT '',
  created_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel transaksi_harian (Pencatatan Pengeluaran Harian Selama 1 Bulan)
CREATE TABLE IF NOT EXISTS transaksi_harian (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_transaksi TEXT NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori TEXT NOT NULL,
  keterangan TEXT NOT NULL,
  nominal BIGINT NOT NULL DEFAULT 0,
  metode_bayar TEXT NOT NULL DEFAULT 'Kas Tunai',
  penerima TEXT DEFAULT '',
  penanggung_jawab TEXT DEFAULT '',
  bukti_nota TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Admin User AGUS jika belum ada
INSERT INTO app_users (username, password, nama, role, is_active)
VALUES ('AGUS', '@Agustsus2', 'Agus Riyadi (Admin)', 'Admin', true)
ON CONFLICT (username) DO NOTHING;

-- Insert Default Staff User jika belum ada
INSERT INTO app_users (username, password, nama, role, is_active)
VALUES ('STAFF', 'staff123', 'Petugas Keuangan', 'Staff', true)
ON CONFLICT (username) DO NOTHING;

-- ================================================================
-- Enable Row Level Security (RLS) dengan akses penuh untuk anon
-- ================================================================
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE karyawan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kasbon ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaji ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengeluaran_rutin ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_harian ENABLE ROW LEVEL SECURITY;

-- Buat policy permissive (izinkan semua operasi)
DO $$ BEGIN
  CREATE POLICY "Allow all" ON company_info FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON karyawan FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON kasbon FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON gaji FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON pengeluaran_rutin FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON app_users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON transaksi_harian FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- Enable Realtime untuk semua tabel
-- ================================================================
ALTER TABLE company_info REPLICA IDENTITY FULL;
ALTER TABLE karyawan REPLICA IDENTITY FULL;
ALTER TABLE kasbon REPLICA IDENTITY FULL;
ALTER TABLE gaji REPLICA IDENTITY FULL;
ALTER TABLE pengeluaran_rutin REPLICA IDENTITY FULL;
ALTER TABLE app_users REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE transaksi_harian REPLICA IDENTITY FULL;

-- Tambahkan ke Supabase Realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE company_info;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE karyawan;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE kasbon;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE gaji;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pengeluaran_rutin;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE app_users;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transaksi_harian;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Selesai! Database KANTORKU siap digunakan.
SELECT 'Schema KANTORKU v2.3 berhasil dibuat!' AS status;
