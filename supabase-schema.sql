-- ==============================================================================
-- BELAJARYUK: E-LEARNING SEKOLAH DASAR (KURIKULUM MERDEKA)
-- SUPABASE POSTGRESQL SCHEMA + RLS + REALTIME + SEED DATA
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES IF EXIST (FOR CLEAN RESET)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS lencana_siswa CASCADE;
DROP TABLE IF EXISTS lencana CASCADE;
DROP TABLE IF EXISTS chat_kelas CASCADE;
DROP TABLE IF EXISTS notifikasi CASCADE;
DROP TABLE IF EXISTS pengumuman CASCADE;
DROP TABLE IF EXISTS pengumpulan CASCADE;
DROP TABLE IF EXISTS soal CASCADE;
DROP TABLE IF EXISTS tugas CASCADE;
DROP TABLE IF EXISTS materi_progress CASCADE;
DROP TABLE IF EXISTS materi CASCADE;
DROP TABLE IF EXISTS rombel_guru_mapel CASCADE;
DROP TABLE IF EXISTS rombel_siswa CASCADE;
DROP TABLE IF EXISTS mapel CASCADE;
DROP TABLE IF EXISTS rombel CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- 3. SCHOOLS TABLE (MULTI-TENANT SATUAN PENDIDIKAN BERLISENSI)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npsn VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(200) NOT NULL,
    jenjang VARCHAR(50) DEFAULT 'Sekolah Dasar (SD)',
    alamat TEXT DEFAULT '',
    telepon VARCHAR(50) DEFAULT '',
    email VARCHAR(150) DEFAULT '',
    logo_url TEXT DEFAULT '',
    kepala_sekolah VARCHAR(150) DEFAULT '',
    paket_layanan VARCHAR(50) DEFAULT 'PREMIUM_MERDEKA' CHECK (paket_layanan IN ('STANDAR', 'PREMIUM_MERDEKA', 'ENTERPRISE')),
    status_aktif BOOLEAN DEFAULT true,
    masa_aktif_sampai DATE DEFAULT '2026-12-31',
    tahun_ajaran_aktif VARCHAR(20) DEFAULT '2024/2025',
    semester_aktif VARCHAR(20) DEFAULT 'Ganjil' CHECK (semester_aktif IN ('Ganjil', 'Genap')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACADEMIC YEARS TABLE
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    tahun VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDIT LOGS TABLE (IMMUTABLE AUDIT TRAIL)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id VARCHAR(100) NOT NULL,
    user_nama VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    school_nama VARCHAR(200),
    aksi VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1'
);

-- 6. PROFILES TABLE (SUPER ADMIN, ADMIN, GURU, SISWA)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE, -- Terhubung ke auth.users jika menggunakan Supabase Auth
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    school_nama VARCHAR(200) DEFAULT '',
    nama VARCHAR(150) NOT NULL,
    nis_nip VARCHAR(50) UNIQUE NOT NULL, -- NIS untuk siswa, NIP/Username untuk Guru & Admin
    email VARCHAR(150) UNIQUE NOT NULL, -- Email internal untuk siswa (misal: 1001@belajaryuk.local)
    role VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'GURU', 'SISWA')),
    tingkat_kelas INT CHECK (tingkat_kelas BETWEEN 1 AND 6), -- Hanya untuk siswa
    avatar_url TEXT DEFAULT '',
    bg_theme VARCHAR(50) DEFAULT 'ocean',
    bg_image_url TEXT DEFAULT '',
    streak_hari INT DEFAULT 1,
    total_bintang INT DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROMBEL / KELAS (1A, 2A, 3A, 4A, 5A, 6A)
CREATE TABLE rombel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(50) NOT NULL, -- Contoh: "1A", "3A", "5A"
    tingkat_kelas INT NOT NULL CHECK (tingkat_kelas BETWEEN 1 AND 6),
    fase VARCHAR(10) NOT NULL CHECK (fase IN ('Fase A', 'Fase B', 'Fase C')),
    tahun_ajaran VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    wali_kelas_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MATA PELAJARAN (KURIKULUM MERDEKA SD)
CREATE TABLE mapel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(100) NOT NULL,
    kode VARCHAR(20) UNIQUE NOT NULL,
    kategori VARCHAR(50) DEFAULT 'Wajib',
    fase_tersedia VARCHAR(50) NOT NULL DEFAULT 'SEMUA', -- 'SEMUA', 'FASE_B_C' (untuk IPAS)
    warna VARCHAR(30) DEFAULT 'blue', -- blue, emerald, amber, purple, rose, sky, orange
    ikon VARCHAR(50) DEFAULT 'BookOpen',
    deskripsi TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RELASI ROMBEL DAN SISWA
CREATE TABLE rombel_siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID NOT NULL REFERENCES rombel(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tahun_ajaran VARCHAR(20) NOT NULL DEFAULT '2024/2025',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rombel_id, siswa_id)
);

-- 7. RELASI ROMBEL, GURU, DAN MAPEL PENGAMPU
CREATE TABLE rombel_guru_mapel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID NOT NULL REFERENCES rombel(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES mapel(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rombel_id, guru_id, mapel_id)
);

-- 8. MATERI PEMBELAJARAN
CREATE TABLE materi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID NOT NULL REFERENCES rombel(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES mapel(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    topik VARCHAR(150) NOT NULL,
    capaian_pembelajaran TEXT NOT NULL,
    tujuan_pembelajaran TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    tipe_konten VARCHAR(30) DEFAULT 'teks', -- teks, video, dokumen, kombinasi
    file_url TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    urutan INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MATERI PROGRESS (PER SISWA)
CREATE TABLE materi_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materi_id UUID NOT NULL REFERENCES materi(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    selesai BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    UNIQUE(materi_id, siswa_id)
);

-- 10. TUGAS / ASESMEN
CREATE TABLE tugas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID NOT NULL REFERENCES rombel(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES mapel(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    instruksi TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    nilai_maksimal INT DEFAULT 100,
    tipe_pengumpulan VARCHAR(30) DEFAULT 'in_app', -- in_app (kuis langsung), upload_file, esai
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SOAL TUGAS (UNTUK IN-APP QUIZ / TUGAS LANGSUNG)
CREATE TABLE soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tugas_id UUID NOT NULL REFERENCES tugas(id) ON DELETE CASCADE,
    nomor INT NOT NULL,
    tipe VARCHAR(30) NOT NULL CHECK (tipe IN ('pilihan_ganda', 'isian', 'esai')),
    pertanyaan TEXT NOT NULL,
    pilihan JSONB, -- Array string contoh: ["A. Kucing", "B. Kambing", "C. Harimau"]
    kunci_jawaban TEXT NOT NULL,
    pembahasan TEXT DEFAULT '',
    skor_bobot INT DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PENGUMPULAN & NILAI
CREATE TABLE pengumpulan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tugas_id UUID NOT NULL REFERENCES tugas(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    jawaban_teks JSONB, -- Simpan jawaban pilihan ganda / isian siswa
    file_url TEXT DEFAULT '',
    nilai NUMERIC(5,2) DEFAULT NULL,
    kategori_nilai VARCHAR(50) DEFAULT NULL, -- 'Perlu Bimbingan', 'Cukup', 'Sudah Berkembang', 'Sangat Mahir'
    bintang INT DEFAULT NULL, -- 1, 2, atau 3 bintang untuk kelas 1-2
    feedback TEXT DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'belum_dikerjakan' CHECK (status IN ('belum_dikerjakan', 'terkumpul', 'terlambat', 'sudah_dinilai')),
    submitted_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tugas_id, siswa_id)
);

-- 13. PENGUMUMAN
CREATE TABLE pengumuman (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID REFERENCES rombel(id) ON DELETE CASCADE, -- NULL = untuk seluruh sekolah
    pembuat_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    konten TEXT NOT NULL,
    prioritas VARCHAR(20) DEFAULT 'normal' CHECK (prioritas IN ('normal', 'penting')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFIKASI
CREATE TABLE notifikasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    judul VARCHAR(150) NOT NULL,
    pesan TEXT NOT NULL,
    link VARCHAR(200) DEFAULT '',
    tipe VARCHAR(30) DEFAULT 'info', -- tugas_baru, materi_baru, nilai_keluar, pengumuman, chat
    dibaca BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CHAT KELAS (RUANG TANYA JAWAB TERMODERASI)
CREATE TABLE chat_kelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID NOT NULL REFERENCES rombel(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pesan TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. LENCANA GAMIFIKASI
CREATE TABLE lencana (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT NOT NULL,
    ikon VARCHAR(50) NOT NULL,
    warna VARCHAR(30) NOT NULL
);

CREATE TABLE lencana_siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lencana_id UUID NOT NULL REFERENCES lencana(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, lencana_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rombel ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE rombel_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE rombel_guru_mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE materi_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumpulan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lencana ENABLE ROW LEVEL SECURITY;
ALTER TABLE lencana_siswa ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() OR id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Helper function: Check if current teacher teaches this rombel
CREATE OR REPLACE FUNCTION is_guru_of_rombel(target_rombel_id UUID)
RETURNS boolean AS $$
BEGIN
  IF current_user_role() = 'ADMIN' THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM rombel WHERE id = target_rombel_id AND (wali_kelas_id = auth.uid() OR wali_kelas_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  ) OR EXISTS (
    SELECT 1 FROM rombel_guru_mapel WHERE rombel_id = target_rombel_id AND (guru_id = auth.uid() OR guru_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function: Check if current student is enrolled in this rombel
CREATE OR REPLACE FUNCTION is_siswa_of_rombel(target_rombel_id UUID)
RETURNS boolean AS $$
BEGIN
  IF current_user_role() = 'ADMIN' THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM rombel_siswa WHERE rombel_id = target_rombel_id AND (siswa_id = auth.uid() OR siswa_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE (id = auth.uid() OR user_id = auth.uid()) AND rombel_id = target_rombel_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. PROFILES POLICIES
-- Siswa hanya bisa melihat profil sendiri, guru, dan teman sekelas. Siswa TIDAK BISA melihat siswa kelas lain.
CREATE POLICY "Strict profiles read" ON profiles FOR SELECT TO authenticated
    USING (
      auth.uid() = user_id OR auth.uid() = id
      OR current_user_role() = 'ADMIN'
      OR (current_user_role() = 'GURU' AND (role = 'GURU' OR EXISTS (
          SELECT 1 FROM rombel_siswa rs
          JOIN rombel_guru_mapel rgm ON rs.rombel_id = rgm.rombel_id
          WHERE rs.siswa_id = profiles.id AND (rgm.guru_id = auth.uid() OR rgm.guru_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
      )))
      OR (current_user_role() = 'SISWA' AND (
          role = 'GURU' OR (role = 'SISWA' AND EXISTS (
              SELECT 1 FROM profiles me WHERE (me.id = auth.uid() OR me.user_id = auth.uid()) AND me.rombel_id = profiles.rombel_id
          ))
      ))
    );

CREATE POLICY "Admin full access profiles" ON profiles
    FOR ALL TO authenticated USING (current_user_role() = 'ADMIN');

CREATE POLICY "User update own profile" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = id);

-- 2. ROMBEL & MAPEL POLICIES
CREATE POLICY "Allow read rombel for assigned or admin" ON rombel FOR SELECT TO authenticated
    USING (
      current_user_role() = 'ADMIN'
      OR is_guru_of_rombel(id)
      OR is_siswa_of_rombel(id)
    );
CREATE POLICY "Admin manage rombel" ON rombel FOR ALL TO authenticated USING (current_user_role() = 'ADMIN');

CREATE POLICY "Allow read mapel for all" ON mapel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage mapel" ON mapel FOR ALL TO authenticated USING (current_user_role() = 'ADMIN');

-- 3. MATERI POLICIES (Guru hanya bisa kelola kelas yang diajarnya, Siswa hanya kelasnya)
CREATE POLICY "Read materi for class members" ON materi FOR SELECT TO authenticated
    USING (
      current_user_role() = 'ADMIN'
      OR is_guru_of_rombel(rombel_id)
      OR is_siswa_of_rombel(rombel_id)
    );

CREATE POLICY "Guru create and update materi in taught classes" ON materi FOR ALL TO authenticated
    USING (
      current_user_role() = 'ADMIN'
      OR (current_user_role() = 'GURU' AND is_guru_of_rombel(rombel_id))
    );

-- 4. MATERI PROGRESS (Data siswa terisolasi penuh)
CREATE POLICY "Siswa manage own progress" ON materi_progress FOR ALL TO authenticated
    USING (
      siswa_id = auth.uid() OR siswa_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR current_user_role() = 'ADMIN'
      OR (current_user_role() = 'GURU' AND EXISTS (SELECT 1 FROM materi WHERE materi.id = materi_progress.materi_id AND is_guru_of_rombel(materi.rombel_id)))
    );

-- 5. TUGAS & SOAL (Guru hanya akses kelas yang diajar, Siswa hanya kelasnya)
CREATE POLICY "Read tugas for class members" ON tugas FOR SELECT TO authenticated
    USING (
      current_user_role() = 'ADMIN'
      OR is_guru_of_rombel(rombel_id)
      OR is_siswa_of_rombel(rombel_id)
    );

CREATE POLICY "Guru manage tugas in taught classes" ON tugas FOR ALL TO authenticated
    USING (
      current_user_role() = 'ADMIN'
      OR (current_user_role() = 'GURU' AND is_guru_of_rombel(rombel_id))
    );

CREATE POLICY "Read soal for allowed tugas" ON soal FOR SELECT TO authenticated
    USING (
      EXISTS (SELECT 1 FROM tugas WHERE tugas.id = soal.tugas_id AND (
        current_user_role() = 'ADMIN' OR is_guru_of_rombel(tugas.rombel_id) OR is_siswa_of_rombel(tugas.rombel_id)
      ))
    );

CREATE POLICY "Guru manage soal in taught classes" ON soal FOR ALL TO authenticated
    USING (
      EXISTS (SELECT 1 FROM tugas WHERE tugas.id = soal.tugas_id AND (
        current_user_role() = 'ADMIN' OR is_guru_of_rombel(tugas.rombel_id)
      ))
    );

-- 6. PENGUMPULAN POLICIES (ISOLASI KETAT: Siswa A TIDAK BISA melihat Siswa B, Guru HANYA kelas yang diajar)
CREATE POLICY "Strict read pengumpulan" ON pengumpulan FOR SELECT TO authenticated
    USING (
      -- Siswa hanya melihat miliknya sendiri! Siswa B tidak bisa melihat nilai Siswa A!
      (current_user_role() = 'SISWA' AND (siswa_id = auth.uid() OR siswa_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())))
      -- Guru HANYA melihat pengumpulan di rombel yang diajarnya!
      OR (current_user_role() = 'GURU' AND EXISTS (
          SELECT 1 FROM tugas WHERE tugas.id = pengumpulan.tugas_id AND is_guru_of_rombel(tugas.rombel_id)
      ))
      -- Admin melihat semua
      OR current_user_role() = 'ADMIN'
    );

CREATE POLICY "Siswa insert own pengumpulan" ON pengumpulan FOR INSERT TO authenticated
    WITH CHECK (
      (siswa_id = auth.uid() OR siswa_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
      AND EXISTS (SELECT 1 FROM tugas WHERE tugas.id = pengumpulan.tugas_id AND is_siswa_of_rombel(tugas.rombel_id))
    );

CREATE POLICY "Siswa update own or Guru grade taught class" ON pengumpulan FOR UPDATE TO authenticated
    USING (
      ((siswa_id = auth.uid() OR siswa_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())) AND status != 'sudah_dinilai')
      OR (current_user_role() = 'GURU' AND EXISTS (SELECT 1 FROM tugas WHERE tugas.id = pengumpulan.tugas_id AND is_guru_of_rombel(tugas.rombel_id)))
      OR current_user_role() = 'ADMIN'
    );

-- 7. CHAT KELAS POLICIES (Terisolasi per Rombel Kelas)
CREATE POLICY "Class members read chat" ON chat_kelas FOR SELECT TO authenticated
    USING (
      current_user_role() = 'ADMIN'
      OR is_guru_of_rombel(rombel_id)
      OR is_siswa_of_rombel(rombel_id)
    );

CREATE POLICY "Class members send chat" ON chat_kelas FOR INSERT TO authenticated
    WITH CHECK (
      current_user_role() = 'ADMIN'
      OR (current_user_role() = 'GURU' AND is_guru_of_rombel(rombel_id))
      OR (current_user_role() = 'SISWA' AND is_siswa_of_rombel(rombel_id) AND (sender_id = auth.uid() OR sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())))
    );

CREATE POLICY "Guru or Admin delete/moderate chat in taught rombel" ON chat_kelas FOR UPDATE TO authenticated
    USING (
      current_user_role() = 'ADMIN'
      OR (current_user_role() = 'GURU' AND is_guru_of_rombel(rombel_id))
    );

-- 8. NOTIFIKASI POLICIES
CREATE POLICY "User see own notifications" ON notifikasi FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR user_id = 'all' OR current_user_role() = 'ADMIN');
CREATE POLICY "System insert notifications" ON notifikasi FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "User mark read notifications" ON notifikasi FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 9. LENCANA
CREATE POLICY "Read badges" ON lencana FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read user badges" ON lencana_siswa FOR SELECT TO authenticated
    USING (
      siswa_id = auth.uid() OR siswa_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR current_user_role() IN ('GURU', 'ADMIN')
    );

-- ==============================================================================
-- AKTIFKAN SUPABASE REALTIME
-- ==============================================================================
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE pengumpulan;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifikasi;
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_kelas;
  ALTER PUBLICATION supabase_realtime ADD TABLE materi;
  ALTER PUBLICATION supabase_realtime ADD TABLE tugas;
  ALTER PUBLICATION supabase_realtime ADD TABLE pengumuman;
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
COMMIT;

-- ==============================================================================
-- DATA AWAL / SEED DATA KURIKULUM MERDEKA SD
-- ==============================================================================

-- Mapel SD Kurikulum Merdeka
INSERT INTO mapel (id, nama, kode, kategori, fase_tersedia, warna, ikon, deskripsi) VALUES
('b1000000-0000-0000-0000-000000000001', 'Pendidikan Pancasila', 'PANCASILA', 'Wajib', 'SEMUA', 'rose', 'ShieldCheck', 'Membangun karakter profil pelajar Pancasila yang berbudi pekerti luhur.'),
('b1000000-0000-0000-0000-000000000002', 'Bahasa Indonesia', 'BINDO', 'Wajib', 'SEMUA', 'blue', 'BookOpen', 'Keterampilan menyimak, membaca, memirsa, berbicara, dan menulis.'),
('b1000000-0000-0000-0000-000000000003', 'Matematika', 'MTK', 'Wajib', 'SEMUA', 'amber', 'Calculator', 'Kemampuan numerasi, penalaran spasial, logika, dan pemecahan masalah.'),
('b1000000-0000-0000-0000-000000000004', 'IPAS (Ilmu Pengetahuan Alam dan Sosial)', 'IPAS', 'Wajib', 'FASE_B_C', 'emerald', 'Compass', 'Eksplorasi fenomena alam dan lingkungan sosial budaya (dimulai dari Kelas 3 SD).'),
('b1000000-0000-0000-0000-000000000005', 'Pendidikan Agama & Budi Pekerti', 'AGAMA', 'Wajib', 'SEMUA', 'purple', 'Heart', 'Penanaman nilai keimanan, ketakwaan, akhlak mulia, dan toleransi.'),
('b1000000-0000-0000-0000-000000000006', 'Seni dan Budaya', 'SENI', 'Wajib', 'SEMUA', 'pink', 'Palette', 'Eksplorasi ekspresi seni rupa, musik, tari, dan prakarya tradisional.'),
('b1000000-0000-0000-0000-000000000007', 'PJOK (Pendidikan Jasmani & Olahraga)', 'PJOK', 'Wajib', 'SEMUA', 'orange', 'Activity', 'Aktivitas kebugaran jasmani, kesehatan motorik, dan kerja sama tim.'),
('b1000000-0000-0000-0000-000000000008', 'Bahasa Inggris', 'BING', 'Pilihan', 'SEMUA', 'sky', 'Globe', 'Pengenalan kosakata dasar bahasa internasional dengan interaktif dan lagu ceria.');

-- Akun 1 Admin, 2 Guru, 6 Siswa
-- Password demo untuk semua akun: admin123 / guru123 / [nama]123
INSERT INTO profiles (id, nama, nis_nip, email, role, tingkat_kelas, avatar_url, streak_hari, total_bintang) VALUES
-- Admin
('a1000000-0000-0000-0000-000000000001', 'Pak Rudi Hartono, M.Pd.', 'ADMIN01', 'admin@belajaryuk.id', 'ADMIN', NULL, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 10, 0),

-- Guru 1 (Fase A & B)
('a2000000-0000-0000-0000-000000000001', 'Ibu Sri Wahyuni, S.Pd.', 'GURU101', 'guru.sri@belajaryuk.id', 'GURU', NULL, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 14, 0),

-- Guru 2 (Fase C)
('a2000000-0000-0000-0000-000000000002', 'Pak Ahmad Fauzi, S.Pd.', 'GURU102', 'guru.ahmad@belajaryuk.id', 'GURU', NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 12, 0),

-- Siswa Kelas 1 (Fase A)
('a3000000-0000-0000-0000-000000000001', 'Budi Santoso', '1001', '1001@belajaryuk.local', 'SISWA', 1, 'https://api.dicebear.com/7.x/bottts/svg?seed=Budi', 5, 24),
('a3000000-0000-0000-0000-000000000002', 'Siti Aisyah', '1002', '1002@belajaryuk.local', 'SISWA', 1, 'https://api.dicebear.com/7.x/bottts/svg?seed=Siti', 6, 28),

-- Siswa Kelas 3 (Fase B)
('a3000000-0000-0000-0000-000000000003', 'Edo Pratama', '3001', '3001@belajaryuk.local', 'SISWA', 3, 'https://api.dicebear.com/7.x/bottts/svg?seed=Edo', 4, 35),
('a3000000-0000-0000-0000-000000000004', 'Dayu Wijaya', '3002', '3002@belajaryuk.local', 'SISWA', 3, 'https://api.dicebear.com/7.x/bottts/svg?seed=Dayu', 7, 42),

-- Siswa Kelas 5 (Fase C)
('a3000000-0000-0000-0000-000000000005', 'Lani Melani', '5001', '5001@belajaryuk.local', 'SISWA', 5, 'https://api.dicebear.com/7.x/bottts/svg?seed=Lani', 8, 55),
('a3000000-0000-0000-0000-000000000006', 'Udin Setiawan', '5002', '5002@belajaryuk.local', 'SISWA', 5, 'https://api.dicebear.com/7.x/bottts/svg?seed=Udin', 3, 30);

-- Rombel (Kelas)
INSERT INTO rombel (id, nama, tingkat_kelas, fase, wali_kelas_id) VALUES
('c1000000-0000-0000-0000-000000000001', '1A (Ceria)', 1, 'Fase A', 'a2000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000002', '2A (Hebat)', 2, 'Fase A', 'a2000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000003', '3A (Kreatif)', 3, 'Fase B', 'a2000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000004', '4A (Pintar)', 4, 'Fase B', 'a2000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000005', '5A (Mandiri)', 5, 'Fase C', 'a2000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000006', '6A (Unggul)', 6, 'Fase C', 'a2000000-0000-0000-0000-000000000002');

-- Penempatan Siswa ke Rombel
INSERT INTO rombel_siswa (rombel_id, siswa_id) VALUES
('c1000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000001'), -- Budi -> 1A
('c1000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000002'), -- Siti -> 1A
('c1000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003'), -- Edo -> 3A
('c1000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000004'), -- Dayu -> 3A
('c1000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000005'), -- Lani -> 5A
('c1000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000006'); -- Udin -> 5A

-- Penugasan Guru ke Rombel & Mapel
INSERT INTO rombel_guru_mapel (rombel_id, guru_id, mapel_id) VALUES
('c1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002'), -- Bu Sri -> 1A B.Indo
('c1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003'), -- Bu Sri -> 1A MTK
('c1000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004'), -- Bu Sri -> 3A IPAS
('c1000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004'), -- Pak Ahmad -> 5A IPAS
('c1000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003'); -- Pak Ahmad -> 5A MTK

-- Lencana Gamifikasi
INSERT INTO lencana (id, kode, nama, deskripsi, ikon, warna) VALUES
('e1000000-0000-0000-0000-000000000001', 'RAJIN_BELAJAR', 'Rajin Belajar', 'Menyelesaikan 5 materi pembelajaran dengan tekun.', 'Award', 'amber'),
('e1000000-0000-0000-0000-000000000002', 'TEPAT_WAKTU', 'Tugas Tepat Waktu', 'Mengumpulkan tugas sebelum batas waktu.', 'Clock', 'emerald'),
('e1000000-0000-0000-0000-000000000003', 'JUARA_KUIS', 'Bintang Cemerlang', 'Mendapatkan nilai sempurna 100 pada kuis.', 'Sparkles', 'sky'),
('e1000000-0000-0000-0000-000000000004', 'STREAK_7_HARI', 'Pejuang Semangat', 'Aktif belajar selama 7 hari berturut-turut.', 'Flame', 'orange');

-- Contoh Materi Pembelajaran Berbasis Kurikulum Merdeka
INSERT INTO materi (id, rombel_id, mapel_id, guru_id, judul, topik, capaian_pembelajaran, tujuan_pembelajaran, deskripsi, tipe_konten, video_url) VALUES
(
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000001',
    'Mengenal Angka dan Berhitung Buah 1 sampai 10',
    'Bilangan Cacah sampai 10',
    'Peserta didik menunjukkan pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 10.',
    'Siswa mampu membilang banyak benda sampai dengan 10 menggunakan benda konkret dan gambar buah-buahan.',
    'Halo anak-anak hebat! Di materi ini kita akan menghitung buah apel, jeruk, dan pisang bersama teman-teman!',
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
),
(
    'd1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000001',
    'Bagian Tubuh Tumbuhan dan Fungsinya',
    'Tumbuhan Sumber Kehidupan di Bumi',
    'Peserta didik menganalisis hubungan antara bentuk serta fungsi bagian tubuh pada tumbuhan (akar, batang, daun, bunga, buah).',
    'Siswa dapat mengidentifikasi 5 bagian utama tumbuhan dan menyebutkan fungsi akar dan daun dengan benar.',
    'Tahukah kalian mengapa tumbuhan bisa berdiri tegak dan daunnya berwarna hijau? Mari pelajari fotosintesis dan bagian tumbuhan di sini!',
    'teks',
    ''
),
(
    'd1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000005',
    'b1000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000002',
    'Ekosistem dan Rantai Makanan di Sekitar Kita',
    'Harmoni dalam Ekosistem',
    'Peserta didik menyelidiki bagaimana hubungan saling ketergantungan antar komponen biotik dan abiotik dapat memengaruhi kestabilan suatu ekosistem di lingkungan sekitarnya.',
    'Siswa dapat menyusun rantai makanan sederhana pada ekosistem sawah dan hutan dengan benar.',
    'Mari amati bagaimana padi dimakan belalang, belalang dimakan katak, dan seterusnya. Rantai makanan menjaga bumi tetap seimbang!',
    'teks',
    ''
);

-- Contoh Tugas Interaktif
INSERT INTO tugas (id, rombel_id, mapel_id, guru_id, judul, instruksi, deadline, nilai_maksimal, tipe_pengumpulan) VALUES
(
    'f1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000001',
    'Kuis Ceria: Menghitung Buah Kesukaan',
    'Pilihlah jawaban yang paling tepat ya adik-adik hebat!',
    NOW() + INTERVAL '3 days',
    100,
    'in_app'
),
(
    'f1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000001',
    'Latihan IPAS: Bagian Tumbuhan',
    'Jawab kuis berikut dengan teliti. Semangat belajar!',
    NOW() + INTERVAL '4 days',
    100,
    'in_app'
),
(
    'f1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000005',
    'b1000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000002',
    'Tantangan Rantai Makanan & Ekosistem Sawah',
    'Kerjakan kuis penalaran sains berikut ini.',
    NOW() + INTERVAL '5 days',
    100,
    'in_app'
);

-- Soal untuk Tugas 1 (Kelas 1 - Fase A: 3 Opsi A, B, C)
INSERT INTO soal (tugas_id, nomor, tipe, pertanyaan, pilihan, kunci_jawaban, pembahasan, skor_bobot) VALUES
(
    'f1000000-0000-0000-0000-000000000001',
    1,
    'pilihan_ganda',
    'Ada 3 buah apel merah di meja. Ibu menaruh 2 buah apel lagi. Berapa jumlah semua apel?',
    '["A. 4 apel", "B. 5 apel", "C. 6 apel"]'::jsonb,
    'B. 5 apel',
    'Hebat! 3 ditambah 2 sama dengan 5.',
    50
),
(
    'f1000000-0000-0000-0000-000000000001',
    2,
    'pilihan_ganda',
    'Manakah angka yang lebih besar dari 6?',
    '["A. 4", "B. 5", "C. 8"]'::jsonb,
    'C. 8',
    'Pintar sekali! 8 berada di setelah angka 6 dan nilainya lebih besar.',
    50
);

-- Soal untuk Tugas 2 (Kelas 3 - Fase B: 4 Opsi)
INSERT INTO soal (tugas_id, nomor, tipe, pertanyaan, pilihan, kunci_jawaban, pembahasan, skor_bobot) VALUES
(
    'f1000000-0000-0000-0000-000000000002',
    1,
    'pilihan_ganda',
    'Bagian tumbuhan yang bertugas menyerap air dan mineral dari dalam tanah adalah ...',
    '["A. Daun", "B. Batang", "C. Akar", "D. Bunga"]'::jsonb,
    'C. Akar',
    'Tepat sekali! Akar menembus ke dalam tanah untuk menyerap air dan zat hara.',
    50
),
(
    'f1000000-0000-0000-0000-000000000002',
    2,
    'pilihan_ganda',
    'Zat hijau daun yang membantu tumbuhan memasak makanannya disebut ...',
    '["A. Oksigen", "B. Klorofil", "C. Karbon", "D. Nektar"]'::jsonb,
    'B. Klorofil',
    'Luar biasa! Klorofil adalah pigmen hijau daun penyerap energi matahari.',
    50
);

-- Pengumuman Awal
INSERT INTO pengumuman (pembuat_id, judul, konten, prioritas) VALUES
('a1000000-0000-0000-0000-000000000001', 'Selamat Datang di BelajarYuk Semester Baru!', 'Selamat datang para siswa dan guru hebat. Mari belajar dengan gembira dan penuh rasa ingin tahu melalui Kurikulum Merdeka!', 'penting');
