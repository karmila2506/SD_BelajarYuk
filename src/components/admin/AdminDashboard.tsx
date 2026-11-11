import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  FileCheck,
  Radio,
  Download,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Megaphone,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { Rombel, UserProfile, School as SchoolType } from '../../types';
import { getHeroBannerStyle } from '../../lib/themeHelper';
import { EditProfileModal } from '../common/EditProfileModal';
import { AccountManager } from './AccountManager';
import { RombelMapelManager } from './RombelMapelManager';
import { SchoolGradeRecap } from './SchoolGradeRecap';
import { AnnouncementManager } from '../teacher/AnnouncementManager';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface AdminDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowToast }) => {
  const { user, onlineUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<'akun' | 'rombel' | 'rekap' | 'pengumuman' | 'profil'>('akun');
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentSchool, setCurrentSchool] = useState<SchoolType | null>(null);
  const [schoolForm, setSchoolForm] = useState({
    nama: '',
    npsn: '',
    kepala_sekolah: '',
    alamat: '',
    telepon: '',
    email: '',
    tahun_ajaran_aktif: '2024/2025',
    semester_aktif: 'Ganjil' as 'Ganjil' | 'Genap',
  });
  const [totalMateri, setTotalMateri] = useState(0);
  const [totalTugas, setTotalTugas] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const loadStats = () => {
    setRombels(localDB.getRombel());
    const profs = localDB.getProfiles();
    setProfiles(profs);
    setTotalMateri(localDB.getMateri().length);
    setTotalTugas(localDB.getTugas().length);

    const schools = localDB.getSchools();
    const mySchool = schools.find((s) => s.id === user?.school_id) || schools[0];
    if (mySchool) {
      setCurrentSchool(mySchool);
      setSchoolForm({
        nama: mySchool.nama,
        npsn: mySchool.npsn,
        kepala_sekolah: mySchool.kepala_sekolah || '',
        alamat: mySchool.alamat || '',
        telepon: mySchool.telepon || '',
        email: mySchool.email || '',
        tahun_ajaran_aktif: mySchool.tahun_ajaran_aktif,
        semester_aktif: mySchool.semester_aktif,
      });
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useRealtimeSubscription({
    table: 'profiles',
    onChange: () => loadStats(),
  });
  useRealtimeSubscription({
    table: 'tugas',
    onChange: () => loadStats(),
  });
  useRealtimeSubscription({
    table: 'materi',
    onChange: () => loadStats(),
  });
  useRealtimeSubscription({
    table: 'rombel',
    onChange: () => loadStats(),
  });
  useRealtimeSubscription({
    table: 'pengumuman',
    onChange: () => loadStats(),
  });

  if (!user) return null;

  const totalSiswa = profiles.filter((p) => p.role === 'SISWA').length;
  const totalGuru = profiles.filter((p) => p.role === 'GURU').length;
  const activeStudentsOnline = profiles.filter(
    (p) => p.role === 'SISWA' && onlineUsers.includes(p.id)
  );
  const banner = getHeroBannerStyle(user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Admin Hero Banner */}
      <div
        style={banner.style}
        className={`${banner.className} flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300`}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-white/20">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Administrator Sekolah • Kurikulum Merdeka</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
            Dashboard Manajemen BelajarYuk 👑
          </h1>
          <p className="text-white/90 text-xs sm:text-sm mt-1.5 leading-relaxed drop-shadow-sm">
            {user.bio || 'Pusat kendali akun guru dan siswa SD, struktur rombongan belajar, mata pelajaran, serta monitoring capaian nilai seluruh sekolah.'}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition flex items-center gap-2 border border-white/30 shadow-md"
            title="Ganti tema warna background atau unggah wallpaper foto profil kamu"
          >
            <Palette className="w-4 h-4 text-amber-300" />
            <span>Ganti Background</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSiswa}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase">Siswa SD</div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalGuru}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase">Guru Pendidik</div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
            <School className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{rombels.length}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase">Rombel Kelas</div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{localDB.getMapel().length}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase">Mata Pelajaran</div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalTugas}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Tugas</div>
        </div>

        {/* Real-time Presence Indicator */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 relative">
            <Radio className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeStudentsOnline.length + 1}</div>
          <div className="text-[11px] font-bold text-slate-500 uppercase">Online Realtime</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('akun')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'akun' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Akun Guru & Siswa</span>
          {activeTab === 'akun' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('rombel')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'rombel' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Rombel & Mapel</span>
          {activeTab === 'rombel' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('rekap')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'rekap' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Rekap & Monitoring Nilai</span>
          {activeTab === 'rekap' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('pengumuman')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'pengumuman' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Pengumuman Sekolah</span>
          {activeTab === 'pengumuman' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profil')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'profil' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <School className="w-4 h-4 text-indigo-600" />
          <span>Profil Sekolah & Tahun Ajaran</span>
          {activeTab === 'profil' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'akun' && (
        <AccountManager rombels={rombels} onShowToast={onShowToast} />
      )}

      {activeTab === 'rombel' && (
        <RombelMapelManager onShowToast={onShowToast} />
      )}

      {activeTab === 'rekap' && (
        <SchoolGradeRecap onShowToast={onShowToast} />
      )}

      {activeTab === 'pengumuman' && (
        <AnnouncementManager rombels={rombels} onShowToast={onShowToast} />
      )}

      {activeTab === 'profil' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-black text-slate-900">Identitas Sekolah & Tahun Ajaran</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data resmi satuan pendidikan, nama kepala sekolah, dan konfigurasi semester Kurikulum Merdeka.
              </p>
            </div>

            {currentSchool && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase border border-amber-200">
                  Paket: {currentSchool.paket_layanan.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  Lisensi Aktif s/d {currentSchool.masa_aktif_sampai}
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!currentSchool) return;
              localDB.updateSchool(currentSchool.id, schoolForm);
              localDB.addAuditLog({
                user_id: user.id,
                user_nama: user.nama,
                user_role: 'ADMIN',
                school_id: currentSchool.id,
                school_nama: schoolForm.nama,
                aksi: 'UPDATE_SCHOOL_PROFILE',
                deskripsi: `Admin ${user.nama} memperbarui profil sekolah ${schoolForm.nama} (Tahun Ajaran: ${schoolForm.tahun_ajaran_aktif} ${schoolForm.semester_aktif})`,
              });
              loadStats();
              onShowToast('Profil identitas sekolah dan tahun ajaran berhasil disimpan!', 'success');
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Satuan Pendidikan *
                </label>
                <input
                  type="text"
                  value={schoolForm.nama}
                  onChange={(e) => setSchoolForm({ ...schoolForm, nama: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Pokok Sekolah Nasional (NPSN) *
                </label>
                <input
                  type="text"
                  value={schoolForm.npsn}
                  onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={schoolForm.kepala_sekolah}
                  onChange={(e) => setSchoolForm({ ...schoolForm, kepala_sekolah: e.target.value })}
                  placeholder="Nama Kepala Sekolah beserta gelar"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  value={schoolForm.alamat}
                  onChange={(e) => setSchoolForm({ ...schoolForm, alamat: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={schoolForm.telepon}
                  onChange={(e) => setSchoolForm({ ...schoolForm, telepon: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Resmi Sekolah
                </label>
                <input
                  type="email"
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Tahun Ajaran Aktif *
                  </label>
                  <input
                    type="text"
                    value={schoolForm.tahun_ajaran_aktif}
                    onChange={(e) => setSchoolForm({ ...schoolForm, tahun_ajaran_aktif: e.target.value })}
                    placeholder="2024/2025"
                    className="w-full px-4 py-2 rounded-xl bg-white border border-blue-300 text-sm font-bold text-blue-950 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Semester Aktif *
                  </label>
                  <select
                    value={schoolForm.semester_aktif}
                    onChange={(e) => setSchoolForm({ ...schoolForm, semester_aktif: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-blue-300 text-sm font-bold text-blue-950 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ganjil">Semester Ganjil (Gasal)</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
              >
                <School className="w-4 h-4" />
                <span>Simpan Perubahan Profil Sekolah</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Database Reset Helper for Demo */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>BelajarYuk Kurikulum Merdeka • Terintegrasi Supabase & Gemini AI</span>
        <button
          onClick={() => {
            if (confirm('Kembalikan semua data ke pengaturan awal (Seed Data asli)?')) {
              localDB.resetToDefaults();
            }
          }}
          className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Data ke Bawaan (Seed Asli)
        </button>
      </div>

      {/* Edit Profile & Background Wallpaper Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
