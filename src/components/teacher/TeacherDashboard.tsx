import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Megaphone,
  Download,
  AlertCircle,
  TrendingUp,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { Rombel, MataPelajaran, Tugas, Pengumpulan } from '../../types';
import { getHeroBannerStyle } from '../../lib/themeHelper';
import { EditProfileModal } from '../common/EditProfileModal';
import { MaterialManager } from './MaterialManager';
import { TaskManager } from './TaskManager';
import { ClassGradeRecap } from './ClassGradeRecap';
import { AnnouncementManager } from './AnnouncementManager';
import { SubmissionGradingModal } from './SubmissionGradingModal';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface TeacherDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onShowToast }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'materi' | 'tugas' | 'rekap' | 'pengumuman'>('overview');
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [mapels, setMapels] = useState<MataPelajaran[]>([]);
  const [pendingGrading, setPendingGrading] = useState<Pengumpulan[]>([]);
  const [selectedSubForGrading, setSelectedSubForGrading] = useState<Pengumpulan | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const loadData = () => {
    if (!user) return;
    const allRombels = localDB.getRombel();
    // Isolasi Kelas Guru: Guru mengakses rombel kelas yang diampunya / menjadi wali kelas
    let myRombels = user.role === 'GURU'
      ? allRombels.filter((r) => r.wali_kelas_id === user.id || r.id === user.rombel_id)
      : allRombels;
    if (myRombels.length === 0) {
      myRombels = allRombels;
    }
    setRombels(myRombels);
    setMapels(localDB.getMapel());

    const myRombelIds = new Set(myRombels.map((r) => r.id));
    const allTugas = localDB.getTugas();
    const myTugasMap = new Map(allTugas.map((t) => [t.id, t]));

    const allSubs = localDB.getPengumpulan();
    // Isolasi Penilaian: Guru hanya melihat pengumpulan tugas dari kelas yang diampunya
    const mySubs = allSubs.filter((s) => {
      const task = myTugasMap.get(s.tugas_id);
      return task && myRombelIds.has(task.rombel_id);
    });

    setPendingGrading(mySubs.filter((s) => s.status !== 'sudah_dinilai'));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Real-time updates
  useRealtimeSubscription({
    table: 'pengumpulan',
    onChange: () => loadData(),
  });
  useRealtimeSubscription({
    table: 'tugas',
    onChange: () => loadData(),
  });
  useRealtimeSubscription({
    table: 'materi',
    onChange: () => loadData(),
  });
  useRealtimeSubscription({
    table: 'pengumuman',
    onChange: () => loadData(),
  });

  if (!user) return null;

  const banner = getHeroBannerStyle(user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Teacher Hero Banner */}
      <div
        style={banner.style}
        className={`${banner.className} flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300`}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Portal Pendidik • Kurikulum Merdeka</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
            Selamat Bertugas, {user.nama}! 👩‍🏫
          </h1>
          <p className="text-white/90 text-xs sm:text-sm mt-1.5 leading-relaxed drop-shadow-sm">
            {user.bio || 'Kelola materi ajar, rumuskan tugas kuis dengan bantuan AI, serta berikan penilaian dan masukan deskriptif yang membangkitkan rasa percaya diri siswa.'}
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

          <button
            onClick={() => setActiveTab('tugas')}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-500/30"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Buat Tugas Baru AI</span>
          </button>
        </div>

        {/* Decorative subtle background circle */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{rombels.length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Rombel Kelas</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">{pendingGrading.length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Perlu Dinilai</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{localDB.getMateri().length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Materi Aktif</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{localDB.getTugas().length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Tugas</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Pengumpulan Masuk ({pendingGrading.length})</span>
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('materi')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'materi' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kelola Materi</span>
          {activeTab === 'materi' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`pb-3 font-extrabold text-xs sm:text-sm shrink-0 transition relative flex items-center gap-2 ${
            activeTab === 'tugas' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Kelola Tugas & AI</span>
          {activeTab === 'tugas' && (
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
          <span>Rekap Nilai & CSV</span>
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
          <span>Pengumuman</span>
          {activeTab === 'pengumuman' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW (PENDING GRADING) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                Tugas Siswa Menunggu Penilaian Guru
              </h3>
              <p className="text-xs text-slate-500">
                Segera berikan feedback agar siswa termotivasi melihat hasil usahanya.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
                  <tr>
                    <th className="px-5 py-4">Nama Siswa</th>
                    <th className="px-5 py-4">NIS</th>
                    <th className="px-5 py-4">Tugas</th>
                    <th className="px-5 py-4">Waktu Dikumpulkan</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingGrading.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        Tidak ada tugas yang menunggu penilaian saat ini. Semua sudah selesai dinilai!
                      </td>
                    </tr>
                  ) : (
                    pendingGrading.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 font-bold text-slate-800">{sub.siswa_nama}</td>
                        <td className="px-5 py-4 text-slate-500">{sub.siswa_nis}</td>
                        <td className="px-5 py-4 font-medium text-slate-700">{sub.tugas_judul}</td>
                        <td className="px-5 py-4 text-slate-400">
                          {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleString('id-ID')
                            : 'Baru saja'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            Perlu Dinilai
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedSubForGrading(sub)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-xs shadow-md shadow-blue-500/20"
                          >
                            Beri Nilai & Masukan
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MATERI */}
      {activeTab === 'materi' && (
        <MaterialManager rombels={rombels} mapels={mapels} onShowToast={onShowToast} />
      )}

      {/* TAB CONTENT: TUGAS */}
      {activeTab === 'tugas' && (
        <TaskManager rombels={rombels} mapels={mapels} onShowToast={onShowToast} />
      )}

      {/* TAB CONTENT: REKAP NILAI */}
      {activeTab === 'rekap' && (
        <ClassGradeRecap rombels={rombels} onShowToast={onShowToast} />
      )}

      {/* TAB CONTENT: PENGUMUMAN */}
      {activeTab === 'pengumuman' && (
        <AnnouncementManager rombels={rombels} onShowToast={onShowToast} />
      )}

      {/* Submission Grading Modal */}
      {selectedSubForGrading && (
        <SubmissionGradingModal
          isOpen={Boolean(selectedSubForGrading)}
          onClose={() => setSelectedSubForGrading(null)}
          pengumpulan={selectedSubForGrading}
          onGraded={() => {
            onShowToast('Nilai dan feedback berhasil disimpan dan dikirim!', 'success');
            loadData();
          }}
        />
      )}

      {/* Edit Profile & Background Wallpaper Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
