import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Star,
  Award,
  ChevronRight,
  Sparkles,
  Flame,
  Calendar,
  AlertCircle,
  FileCheck,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import {
  MataPelajaran,
  MateriPembelajaran,
  Tugas,
  Pengumpulan,
  Lencana,
  Pengumuman,
} from '../../types';
import { MaterialViewer } from './MaterialViewer';
import { TaskSolverModal } from './TaskSolverModal';
import { StudentBadges } from './StudentBadges';
import { EditProfileModal } from '../common/EditProfileModal';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { getHeroBannerStyle } from '../../lib/themeHelper';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface StudentDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onShowToast }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'materi' | 'tugas' | 'lencana'>('materi');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('all');
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [materiList, setMateriList] = useState<MateriPembelajaran[]>([]);
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [pengumpulanList, setPengumpulanList] = useState<Pengumpulan[]>([]);
  const [lencanaList, setLencanaList] = useState<Lencana[]>([]);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);

  // Selected item modals
  const [selectedMateri, setSelectedMateri] = useState<MateriPembelajaran | null>(null);
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [previewDocData, setPreviewDocData] = useState<{
    title: string;
    url?: string;
    name?: string;
    size?: string;
    subject?: string;
    class?: string;
    content?: string;
  } | null>(null);

  const tingkatKelas = user?.tingkat_kelas || 1;
  const isLowerGrade = tingkatKelas <= 3; // Kelas 1-3 adaptif

  const loadData = () => {
    if (!user) return;
    const allMapel = localDB.getMapel();
    // Filter mapel suitable for this grade
    const filteredMapel = allMapel.filter((m) => {
      if (tingkatKelas <= 2) return m.fase_tersedia !== 'FASE_B_C';
      return true;
    });
    setMapelList(filteredMapel);

    // Filter materi for this student's class
    const allMateri = localDB.getMateri();
    const myMateri = allMateri.filter(
      (m) => !user.rombel_id || m.rombel_id === user.rombel_id
    );
    setMateriList(myMateri);

    // Filter tugas for this student's class
    const allTugas = localDB.getTugas();
    const myTugas = allTugas.filter(
      (t) => !user.rombel_id || t.rombel_id === user.rombel_id
    );
    setTugasList(myTugas);

    // Get submissions by this student
    const allPengumpulan = localDB.getPengumpulan();
    const myPengumpulan = allPengumpulan.filter((p) => p.siswa_id === user.id);
    setPengumpulanList(myPengumpulan);

    setLencanaList(localDB.getLencana());
    setPengumumanList(localDB.getPengumuman());
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Real-time subscriptions
  useRealtimeSubscription({
    table: 'tugas',
    onChange: () => loadData(),
  });
  useRealtimeSubscription({
    table: 'materi',
    onChange: () => loadData(),
  });
  useRealtimeSubscription({
    table: 'pengumpulan',
    onChange: () => {
      loadData();
      refreshUser();
    },
  });
  useRealtimeSubscription({
    table: 'pengumuman',
    onChange: () => {
      loadData();
    },
  });

  if (!user) return null;

  // Filtered lists
  const displayMateri = materiList.filter(
    (m) => selectedMapelId === 'all' || m.mapel_id === selectedMapelId
  );
  const displayTugas = tugasList.filter(
    (t) => selectedMapelId === 'all' || t.mapel_id === selectedMapelId
  );

  const getTugasStatus = (tugasId: string) => {
    const sub = pengumpulanList.find((p) => p.tugas_id === tugasId);
    if (!sub) return { status: 'belum_dikerjakan', label: 'Belum Dikerjakan', sub: null };
    if (sub.status === 'sudah_dinilai' || (sub.nilai !== null && sub.nilai !== undefined)) {
      return { status: 'sudah_dinilai', label: `Nilai: ${sub.nilai}`, sub };
    }
    return { status: 'terkumpul', label: 'Sudah Terkumpul', sub };
  };

  const pendingTasks = tugasList.filter((t) => {
    const sub = pengumpulanList.find((p) => p.tugas_id === t.id);
    return !sub;
  });

  const banner = getHeroBannerStyle(user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Friendly Student Hero Banner */}
      <div className={banner.className} style={banner.style}>
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {user.rombel_nama || `Kelas ${tingkatKelas}`} • {tingkatKelas <= 2 ? 'Fase A' : tingkatKelas <= 4 ? 'Fase B' : 'Fase C'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowEditProfile(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold transition shadow-xs cursor-pointer border border-white/20 text-white"
              title="Ganti Tema Warna & Wallpaper Profil"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300" />
              <span>Ganti Background</span>
            </button>
          </div>

          <h1
            className={`font-black tracking-tight leading-tight ${
              isLowerGrade ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
            }`}
          >
            Halo, {user.nama.split(' ')[0]}! Senang melihatmu hari ini! 🌟
          </h1>

          <p
            className={`text-blue-100 font-medium mt-2 leading-relaxed ${
              isLowerGrade ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            }`}
          >
            {user.bio || 'Ayo jelajahi materi seru dan kerjakan tugasmu dengan gembira. Semakin rajin kamu belajar, semakin banyak bintang yang terkumpul!'}
          </p>

          {/* Quick Stats on Mobile */}
          <div className="flex sm:hidden items-center gap-3 mt-4 pt-3 border-t border-white/20">
            <div className="flex items-center gap-1.5 font-bold text-xs bg-white/10 px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>{user.total_bintang} Bintang</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-xs bg-white/10 px-3 py-1.5 rounded-xl">
              <Flame className="w-4 h-4 fill-orange-300 text-orange-300" />
              <span>{user.streak_hari} Hari Aktif</span>
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/10 rounded-full blur-2xl transform translate-x-1/4 translate-y-1/4 pointer-events-none" />
      </div>

      {/* School Announcements (if any) */}
      {pengumumanList.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase">
                Pengumuman Sekolah
              </span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {pengumumanList[0].judul}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{pengumumanList[0].konten}</p>
          </div>
        </div>
      )}

      {/* Pending Tasks Quick Reminder Banner */}
      {pendingTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-4 sm:p-6 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-yellow-200" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base">
                Ada {pendingTasks.length} Kuis & Tugas Baru Untukmu! 🚀
              </div>
              <p className="text-xs text-orange-100 font-medium mt-0.5">
                "{pendingTasks[0].judul}" menunggumu. Selesaikan sekarang dan kumpulkan bintang ceria!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('tugas');
              setSelectedTugas(pendingTasks[0]);
            }}
            className="px-5 py-2.5 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-extrabold text-xs sm:text-sm shadow-md transition shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Mulai Kerjakan
          </button>
        </div>
      )}

      {/* Subject Filter Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-black text-slate-800">Mata Pelajaran Kamu</h2>
          <span className="text-xs text-slate-500 font-bold">
            {selectedMapelId === 'all' ? 'Semua Pelajaran' : 'Difilter'}
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedMapelId('all')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shrink-0 transition flex items-center gap-2 ${
              selectedMapelId === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Semua Pelajaran</span>
          </button>

          {mapelList.map((m) => {
            const isSelected = selectedMapelId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMapelId(m.id)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm shrink-0 transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{m.nama}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabs (Materi, Tugas, Lencana) */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        <button
          onClick={() => setActiveTab('materi')}
          className={`pb-3 font-extrabold text-sm sm:text-base transition relative flex items-center gap-2 ${
            activeTab === 'materi'
              ? 'text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Materi Belajar ({displayMateri.length})</span>
          {activeTab === 'materi' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`pb-3 font-extrabold text-sm sm:text-base transition relative flex items-center gap-2 ${
            activeTab === 'tugas'
              ? 'text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck className="w-5 h-5" />
          <span>Tugas & Kuis ({displayTugas.length})</span>
          {activeTab === 'tugas' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('lencana')}
          className={`pb-3 font-extrabold text-sm sm:text-base transition relative flex items-center gap-2 ${
            activeTab === 'lencana'
              ? 'text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-5 h-5" />
          <span>Bintang & Lencana</span>
          {activeTab === 'lencana' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB CONTENT: MATERI */}
      {activeTab === 'materi' && (
        <div>
          {displayMateri.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Belum Ada Materi Belajar</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Bapak/Ibu guru akan segera mengunggah materi seru untuk kelasmu. Istirahat sejenak dulu yuk!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayMateri.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMateri(m)}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                        {m.mapel_nama}
                      </span>
                      {m.selesai_oleh_siswa ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Selesai
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          Belum Dibaca
                        </span>
                      )}
                    </div>

                    <h3
                      className={`font-black text-slate-800 group-hover:text-blue-600 transition leading-snug line-clamp-2 ${
                        isLowerGrade ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                      }`}
                    >
                      {m.judul}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {m.deskripsi}
                    </p>

                    {/* Attached Document pill with direct preview button */}
                    {m.file_nama && (
                      <div className="mt-3 p-2 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900 truncate text-[11px]">
                          📎 {m.file_nama}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDocData({
                              title: m.judul,
                              url: m.file_url,
                              name: m.file_nama,
                              size: m.file_ukuran,
                              subject: m.mapel_nama,
                              class: m.rombel_nama,
                              content: m.deskripsi,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] shrink-0 ml-1 transition shadow-xs"
                        >
                          Baca Dokumen 📄
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold truncate max-w-[150px]">
                      {m.guru_nama}
                    </span>
                    <button
                      className={`font-extrabold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition ${
                        isLowerGrade ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      <span>Buka Materi</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TUGAS */}
      {activeTab === 'tugas' && (
        <div>
          {displayTugas.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Belum Ada Tugas Aktif</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Hore! Semua tugasmu sudah selesai. Kamu bisa mengulang membaca materi atau beristirahat!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayTugas.map((t) => {
                const info = getTugasStatus(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTugas(t)}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                          {t.mapel_nama}
                        </span>

                        {info.status === 'sudah_dinilai' ? (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs px-2.5 py-1 rounded-xl border border-emerald-200">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{info.label}</span>
                          </div>
                        ) : info.status === 'terkumpul' ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                            Terkumpul
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200">
                            Belum Dikerjakan
                          </span>
                        )}
                      </div>

                      <h3
                        className={`font-black text-slate-800 group-hover:text-blue-600 transition leading-snug line-clamp-2 ${
                          isLowerGrade ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                        }`}
                      >
                        {t.judul}
                      </h3>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {t.instruksi}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Tenggat:{' '}
                          {new Date(t.deadline).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <button
                        className={`font-extrabold flex items-center gap-1 transition ${
                          info.status === 'sudah_dinilai'
                            ? 'text-emerald-600'
                            : 'text-blue-600 group-hover:translate-x-1'
                        } ${isLowerGrade ? 'text-sm' : 'text-xs'}`}
                      >
                        <span>{info.status === 'sudah_dinilai' ? 'Lihat Hasil' : 'Kerjakan'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: LENCANA */}
      {activeTab === 'lencana' && <StudentBadges badges={lencanaList} />}

      {/* Modals */}
      {selectedMateri && (
        <MaterialViewer
          isOpen={Boolean(selectedMateri)}
          onClose={() => setSelectedMateri(null)}
          materi={selectedMateri}
          onCompleted={() => {
            onShowToast('Hore! Kamu dapat 2 Bintang belajar baru!', 'success');
            loadData();
          }}
        />
      )}

      {selectedTugas && (
        <TaskSolverModal
          isOpen={Boolean(selectedTugas)}
          onClose={() => setSelectedTugas(null)}
          tugas={selectedTugas}
          existingPengumpulan={getTugasStatus(selectedTugas.id).sub || undefined}
          onSubmitted={() => {
            onShowToast('Tugas berhasil dikumpulkan!', 'success');
            loadData();
          }}
        />
      )}

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSuccess={(msg) => onShowToast(msg, 'success')}
      />

      {/* In-App Document Preview Modal */}
      {previewDocData && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDocData)}
          onClose={() => setPreviewDocData(null)}
          documentTitle={previewDocData.title}
          documentUrl={previewDocData.url}
          documentName={previewDocData.name}
          documentSize={previewDocData.size}
          documentTextContent={previewDocData.content}
          subjectName={previewDocData.subject}
          className={previewDocData.class}
        />
      )}
    </div>
  );
};
