export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'GURU' | 'SISWA';

export interface School {
  id: string;
  npsn: string;
  nama: string;
  jenjang: string; // e.g. "Sekolah Dasar (SD)"
  alamat: string;
  telepon?: string;
  email?: string;
  logo_url?: string;
  kepala_sekolah?: string;
  paket_layanan: 'GRATIS' | 'STANDAR' | 'PREMIUM_MERDEKA' | 'ENTERPRISE';
  status_aktif: boolean;
  masa_aktif_sampai: string;
  tahun_ajaran_aktif: string;
  semester_aktif: 'Ganjil' | 'Genap';
  created_at?: string;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  tahun: string; // e.g. "2024/2025"
  semester: 'Ganjil' | 'Genap';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export interface AuditLog {
  id: string;
  created_at?: string;
  timestamp?: string;
  user_id: string;
  user_nama: string;
  user_role: Role;
  school_id?: string;
  school_nama?: string;
  aksi: string;
  action?: string;
  deskripsi?: string;
  details?: string;
  ip_address?: string;
}

export interface UserProfile {
  id: string;
  nama: string;
  nis_nip: string; // NIS for student, NIP for teacher, username for admin/superadmin
  email: string;
  role: Role;
  school_id?: string;
  school_nama?: string;
  tingkat_kelas?: number; // 1-6 for students
  rombel_id?: string;
  rombel_nama?: string;
  avatar_url?: string;
  bg_theme?: string; // 'ocean' | 'nature' | 'sunset' | 'galaxy' | 'candy' | 'cyber' | 'rainbow'
  bg_image_url?: string; // Custom uploaded background image / wallpaper
  bio?: string; // Motto belajar / catatan profil
  streak_hari: number;
  total_bintang: number;
  aktif: boolean;
  created_at?: string;
}

export type FaseKurikulum = 'Fase A' | 'Fase B' | 'Fase C';

export interface Rombel {
  id: string;
  school_id?: string;
  nama: string; // e.g. "1A (Ceria)", "3A (Kreatif)"
  tingkat_kelas: number; // 1 - 6
  fase: FaseKurikulum;
  tahun_ajaran: string;
  wali_kelas_id?: string;
  wali_kelas_nama?: string;
  total_siswa?: number;
}

export interface MataPelajaran {
  id: string;
  school_id?: string;
  nama: string;
  kode: string;
  kategori: string;
  fase_tersedia: 'SEMUA' | 'FASE_B_C' | 'FASE_A';
  warna: string; // Tailwind color token: blue, emerald, amber, purple, rose, pink, orange, sky
  ikon: string;
  deskripsi: string;
}

export interface MateriPembelajaran {
  id: string;
  school_id?: string;
  rombel_id: string;
  rombel_nama?: string;
  mapel_id: string;
  mapel_nama?: string;
  guru_id: string;
  guru_nama?: string;
  judul: string;
  topik: string;
  capaian_pembelajaran: string;
  tujuan_pembelajaran: string;
  deskripsi: string;
  tipe_konten: 'teks' | 'video' | 'dokumen' | 'gambar' | 'kombinasi';
  status_terbit?: 'draft' | 'terbit';
  gambar_url?: string;
  gambar_caption?: string;
  file_url?: string;
  file_nama?: string;
  file_ukuran?: string;
  video_url?: string;
  urutan: number;
  created_at: string;
  selesai_oleh_siswa?: boolean;
}

export type TipeSoal = 'pilihan_ganda' | 'benar_salah' | 'isian' | 'esai';

export interface SoalTugas {
  id: string;
  tugas_id: string;
  nomor: number;
  tipe: TipeSoal;
  pertanyaan: string;
  pilihan?: string[]; // e.g. ["A. Buah", "B. Sayur", "C. Hewan"] or ["A. Benar", "B. Salah"]
  kunci_jawaban: string;
  pembahasan: string;
  skor_bobot: number;
}

export interface Tugas {
  id: string;
  school_id?: string;
  rombel_id: string;
  rombel_nama?: string;
  mapel_id: string;
  mapel_nama?: string;
  guru_id: string;
  guru_nama?: string;
  judul: string;
  instruksi: string;
  deadline: string;
  nilai_maksimal: number;
  tipe_pengumpulan: 'in_app' | 'upload_file' | 'kombinasi';
  tipe_penugasan?: 'tugas' | 'kuis';
  waktu_pengerjaan_menit?: number; // Quiz timer in minutes (e.g. 15, 30, 45, 60), 0 for unlimited
  jumlah_percobaan?: number; // Max attempt (e.g. 1, 2, or 99 unlimited)
  status_terbit?: 'draft' | 'terbit';
  is_ai_generated: boolean;
  created_at: string;
  soal_list?: SoalTugas[];
  // For student view
  status_pengumpulan?: StatusPengumpulan;
  nilai_siswa?: number | null;
  bintang_siswa?: number | null;
  feedback_siswa?: string;
  attempt_count?: number;
}

export type StatusPengumpulan = 'belum_dikerjakan' | 'terkumpul' | 'terlambat' | 'sudah_dinilai';

export interface Pengumpulan {
  id: string;
  school_id?: string;
  tugas_id: string;
  tugas_judul?: string;
  siswa_id: string;
  siswa_nama?: string;
  siswa_nis?: string;
  tingkat_kelas?: number;
  jawaban_teks?: Record<string, string>; // { [soalId]: jawaban }
  file_url?: string;
  file_nama?: string;
  file_ukuran?: string;
  catatan_siswa?: string;
  nilai?: number | null;
  kategori_nilai?: string | null; // "Sangat Mahir", "Sudah Berkembang", "Cukup", "Perlu Bimbingan"
  bintang?: number | null; // 1, 2, or 3
  feedback?: string;
  perlu_revisi?: boolean;
  catatan_revisi?: string;
  attempt_number?: number;
  status: StatusPengumpulan;
  is_auto_graded?: boolean;
  detail_evaluasi?: Array<{
    soal_id: string;
    nomor: number;
    tipe: TipeSoal;
    jawaban_siswa: string;
    kunci_jawaban: string;
    benar: boolean;
    skor_diperoleh: number;
    skor_maksimal: number;
    catatan_evaluasi: string;
  }>;
  submitted_at?: string;
  graded_at?: string;
  created_at?: string;
}

export interface Pengumuman {
  id: string;
  school_id?: string;
  rombel_id?: string | null; // null for school wide
  pembuat_id: string;
  pembuat_nama?: string;
  pembuat_role?: Role;
  judul: string;
  konten: string;
  prioritas: 'normal' | 'penting';
  created_at: string;
}

export interface Notifikasi {
  id: string;
  school_id?: string;
  user_id: string;
  judul: string;
  pesan: string;
  link?: string;
  tipe: 'tugas_baru' | 'materi_baru' | 'nilai_keluar' | 'pengumuman' | 'chat' | 'lencana';
  dibaca: boolean;
  created_at: string;
}

export interface PesanChat {
  id: string;
  school_id?: string;
  rombel_id: string;
  sender_id: string;
  sender_nama: string;
  sender_role: Role;
  pesan: string;
  is_deleted: boolean;
  created_at: string;
}

export interface Lencana {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  ikon: string;
  warna: string;
  didapat?: boolean;
  awarded_at?: string;
}
