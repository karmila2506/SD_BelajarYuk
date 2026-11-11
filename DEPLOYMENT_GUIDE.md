# Panduan Lengkap Deploy Aplikasi BelajarYuk ke Vercel & Supabase

Aplikasi **BelajarYuk** adalah platform Learning Management System (LMS) berbasis web untuk Sekolah Dasar kelas 1–6 dengan Kurikulum Merdeka. Dilengkapi arsitektur multi-tenant berlisensi sekolah, 4 role terstruktur (**Super Admin**, **Admin Sekolah**, **Guru / Wali Kelas**, dan **Siswa SD**), generator tugas AI berbasis Gemini 2.5 server-side proxy, serta sinkronisasi data reaktif.

---

## 1. Persiapan Database di Supabase (Multi-Tenant & RLS)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru (*New Project*).
2. Beri nama proyek, misalnya: `belajaryuk-sd-merdeka`.
3. Setelah database selesai dibuat:
   - Masuk ke menu **SQL Editor** di sidebar kiri.
   - Klik **New Query**.
   - Buka file `supabase-schema.sql` dari repositori ini, salin seluruh isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
4. Skrip tersebut secara otomatis akan:
   - Membuat seluruh tabel (`schools`, `academic_years`, `audit_logs`, `profiles`, `rombel`, `mapel`, `materi`, `tugas`, `soal`, `pengumpulan`, `notifikasi`, `chat_kelas`, `lencana`, dll).
   - Mengaktifkan **Row Level Security (RLS)** dengan pemisahan tenant via `school_id`.
   - Mengaktifkan **Supabase Realtime** pada tabel `pengumpulan`, `notifikasi`, `chat_kelas`, `materi`, `tugas`, dan `profiles`.
   - Menambahkan data awal (Seed Data): 3 Sekolah Berlisensi, 1 Super Admin, 1 Admin Sekolah, 6 Guru/Wali Kelas, dan 30 Siswa SD (Kelas 1 - 6 lengkap).
5. Dapatkan kredensial API:
   - Masuk ke **Project Settings** > **API**.
   - Salin **Project URL** (ini adalah `VITE_SUPABASE_URL`).
   - Salin **anon public key** (ini adalah `VITE_SUPABASE_ANON_KEY`).

---

## 2. Konfigurasi Gemini API Key

1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Buat API Key baru.
3. Simpan key ini sebagai `GEMINI_API_KEY`. (Digunakan server-side di `/api/generate-task.ts` tanpa pernah bocor ke browser client).

---

## 3. Deploy ke Vercel

### Metode A: Melalui Vercel Dashboard (Rekomendasi)
1. Push kode aplikasi BelajarYuk ini ke repositori GitHub atau GitLab Anda.
2. Buka [Vercel Dashboard](https://vercel.com/) dan klik **Add New...** > **Project**.
3. Hubungkan repositori GitHub Anda dan pilih repositori `BelajarYuk`.
4. Konfigurasi Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Buka bagian **Environment Variables** dan tambahkan variabel berikut:
   | Key | Value | Keterangan |
   |-----|-------|------------|
   | `GEMINI_API_KEY` | `AIzaSy...` | API Key dari Google AI Studio |
   | `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | URL Project Supabase Anda |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Anon Key Supabase Anda |
6. File `vercel.json` sudah disediakan di root direktori untuk menangani routing SPA React dan Serverless Function `/api/generate-task`.
7. Klik tombol **Deploy**.

---

## 4. Kredensial Akun Bawaan (4 Role Sistem)

### 🔴 1. Super Admin (Platform Owner & Operator)
- **Email**: `superadmin@belajaryuk.id`
- **Kata Sandi**: `superadmin123` atau `123456`
- **Kunci Keamanan Master (PIN)**: `MERDEKA99` (atau `SUPER2025`, `BELAJARYUK`)
- **Fitur**: Pusat manajemen sekolah multi-tenant, CRUD izin & lisensi sekolah (Standar, Premium, Enterprise), aktivasi/penangguhan sekolah, provisi admin sekolah, audit log sistem lintas platform, dan inspeksi sekolah.

### 🟣 2. Admin Sekolah (Pengelola Satuan Pendidikan)
- **Email**: `admin@belajaryuk.id`
- **Kata Sandi**: `admin123`
- **Fitur**: Dashboard sekolah, manajemen profil identitas sekolah (NPSN, kepala sekolah, logo), pengaturan tahun ajaran aktif & semester, penempatan guru wali kelas, manajemen akun guru & siswa, impor & ekspor CSV/Excel, dan pengumuman sekolah.

### 🟡 3. Guru & Wali Kelas (Pendidik Terisolasi Kelas)
- **Email**:
  - Kelas 1: `guru.sri@belajaryuk.id` (Sandi: `guru123`)
  - Kelas 2: `guru.nurul@belajaryuk.id` (Sandi: `guru123`)
  - Kelas 3: `guru.bambang@belajaryuk.id` (Sandi: `guru123`)
  - Kelas 4: `guru.dewi@belajaryuk.id` (Sandi: `guru123`)
  - Kelas 5: `guru.ahmad@belajaryuk.id` (Sandi: `guru123`)
  - Kelas 6: `guru.hendra@belajaryuk.id` (Sandi: `guru123`)
- **Fitur**: Upload materi lengkap (dokumen, gambar, link video, teks), buat kuis interaktif dengan timer & percobaan, AI Task Generator (Gemini), penilaian tugas siswa, rekap nilai & ekspor CSV.

### 🔵 4. Siswa SD (Kelas 1 - 6)
- **Kelas 1**: NIS `1001` - `1005` (Sandi: `123456`)
- **Kelas 2**: NIS `2001` - `2005` (Sandi: `123456`)
- **Kelas 3**: NIS `3001` - `3005` (Sandi: `123456`)
- **Kelas 4**: NIS `4001` - `4005` (Sandi: `123456`)
- **Kelas 5**: NIS `5001` - `5005` (Sandi: `123456`)
- **Kelas 6**: NIS `6001` - `6005` (Sandi: `123456`)
- **Fitur**: Mengerjakan kuis interaktif, nilai dan bintang langsung keluar seketika, rincian pembahasan jawaban, upload foto lembar kerja, streak belajar harian, dan ganti background tema sendiri.
