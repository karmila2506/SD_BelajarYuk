import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Sparkles,
  Trash2,
  Clock,
  Calendar,
  Check,
  X,
  Search,
  Eye,
  HelpCircle,
  Timer,
  RotateCcw,
  BookOpen,
  Award,
} from 'lucide-react';
import { Tugas, Rombel, MataPelajaran, SoalTugas, TipeSoal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { AITaskGeneratorModal } from './AITaskGeneratorModal';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';
import { getAvailableRombelForMapel, getFaseFromKelas } from '../../lib/kurikulum';

interface TaskManagerProps {
  rombels: Rombel[];
  mapels: MataPelajaran[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  rombels,
  mapels,
  onShowToast,
}) => {
  const { user } = useAuth();
  const [tugasList, setTugasList] = useState<Tugas[]>(localDB.getTugas());
  const [selectedRombelId, setSelectedRombelId] = useState<string>('all');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>('all');
  const [filterType, setFilterType] = useState<'ALL' | 'KUIS' | 'TUGAS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isManualQuizOpen, setIsManualQuizOpen] = useState(false);
  const [selectedTaskQuestions, setSelectedTaskQuestions] = useState<Tugas | null>(null);

  // Manual Quiz Form State
  const [quizForm, setQuizForm] = useState({
    judul: '',
    rombel_id: rombels[0]?.id || '',
    mapel_id: mapels[0]?.id || '',
    instruksi: 'Bacalah setiap butir soal dengan teliti sebelum memilih jawaban yang paling tepat.',
    waktu_pengerjaan_menit: 30,
    jumlah_percobaan: 2,
    deadline_days: 7,
    soal_list: [
      {
        id: `soal-${Date.now()}-1`,
        tugas_id: '',
        nomor: 1,
        tipe: 'pilihan_ganda' as TipeSoal,
        pertanyaan: 'Sila pertama Pancasila dilambangkan dengan simbol...',
        pilihan: ['A. Bintang', 'B. Rantai Emas', 'C. Pohon Beringin', 'D. Kepala Banteng'],
        kunci_jawaban: 'A',
        pembahasan: 'Sila ke-1 "Ketuhanan Yang Maha Esa" dilambangkan dengan perisai Bintang emas bercahaya.',
        skor_bobot: 20,
      },
      {
        id: `soal-${Date.now()}-2`,
        tugas_id: '',
        nomor: 2,
        tipe: 'benar_salah' as TipeSoal,
        pertanyaan: 'Matahari terbit dari sebelah barat dan tenggelam di sebelah timur.',
        pilihan: ['A. Benar', 'B. Salah'],
        kunci_jawaban: 'B. Salah',
        pembahasan: 'Matahari terbit di sebelah timur dan tenggelam di sebelah barat.',
        skor_bobot: 20,
      },
      {
        id: `soal-${Date.now()}-3`,
        tugas_id: '',
        nomor: 3,
        tipe: 'isian' as TipeSoal,
        pertanyaan: 'Ibu kota negara Republik Indonesia adalah...',
        pilihan: [],
        kunci_jawaban: 'Jakarta',
        pembahasan: 'Ibu kota negara Indonesia saat ini adalah DKI Jakarta.',
        skor_bobot: 20,
      },
    ] as SoalTugas[],
  });

  const loadData = () => {
    setTugasList(localDB.getTugas());
  };

  useRealtimeSubscription({
    table: 'tugas',
    onChange: () => loadData(),
  });

  if (!user) return null;

  const handleDelete = (id: string) => {
    if (confirm('Bapak/Ibu yakin ingin menghapus kuis/tugas ini? Seluruh data pengumpulan siswa akan ikut terhapus.')) {
      const all = localDB.getTugas();
      const target = all.find((t) => t.id === id);
      const updated = all.filter((t) => t.id !== id);
      localDB.saveTugas(updated);
      localDB.addAuditLog({
        user_id: user.id,
        user_nama: user.nama,
        user_role: 'GURU',
        school_id: user.school_id,
        school_nama: user.school_nama,
        aksi: 'DELETE_TASK',
        deskripsi: `Guru ${user.nama} menghapus tugas/kuis "${target?.judul || id}"`,
      });
      loadData();
      onShowToast('Tugas/Kuis berhasil dihapus.', 'info');
    }
  };

  const allowedRombelIds = new Set(rombels.map((r) => r.id));

  const filteredTugas = tugasList.filter((t) => {
    if (user.role === 'GURU' && !allowedRombelIds.has(t.rombel_id)) {
      return false;
    }
    const matchRombel = selectedRombelId === 'all' || t.rombel_id === selectedRombelId;
    const matchMapel = selectedMapelFilter === 'all' || t.mapel_id === selectedMapelFilter;
    const matchType =
      filterType === 'ALL' ||
      (filterType === 'KUIS' && (t.tipe_penugasan === 'kuis' || t.waktu_pengerjaan_menit)) ||
      (filterType === 'TUGAS' && t.tipe_penugasan !== 'kuis' && !t.waktu_pengerjaan_menit);
    const matchSearch =
      t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.instruksi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRombel && matchMapel && matchType && matchSearch;
  });

  // Add question to manual quiz
  const handleAddQuestion = (type: TipeSoal = 'pilihan_ganda') => {
    const nextNum = quizForm.soal_list.length + 1;
    const newQ: SoalTugas = {
      id: `soal-${Date.now()}-${nextNum}`,
      tugas_id: '',
      nomor: nextNum,
      tipe: type,
      pertanyaan: `Pertanyaan nomor ${nextNum}...`,
      pilihan:
        type === 'pilihan_ganda'
          ? ['A. Pilihan Satu', 'B. Pilihan Dua', 'C. Pilihan Tiga', 'D. Pilihan Empat']
          : type === 'benar_salah'
          ? ['A. Benar', 'B. Salah']
          : [],
      kunci_jawaban: type === 'pilihan_ganda' ? 'A' : type === 'benar_salah' ? 'A. Benar' : 'Jawaban',
      pembahasan: 'Pembahasan materi terkait.',
      skor_bobot: 20,
    };
    setQuizForm((prev) => ({
      ...prev,
      soal_list: [...prev.soal_list, newQ],
    }));
  };

  // Remove question
  const handleRemoveQuestion = (idx: number) => {
    setQuizForm((prev) => ({
      ...prev,
      soal_list: prev.soal_list.filter((_, i) => i !== idx).map((s, i) => ({ ...s, nomor: i + 1 })),
    }));
  };

  // Update question field
  const handleUpdateQuestion = (idx: number, field: keyof SoalTugas, val: any) => {
    setQuizForm((prev) => {
      const copy = [...prev.soal_list];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, soal_list: copy };
    });
  };

  // Save manual quiz
  const handleSaveManualQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.judul.trim()) {
      onShowToast('Judul kuis wajib diisi.', 'error');
      return;
    }
    if (quizForm.soal_list.length === 0) {
      onShowToast('Kuis harus memiliki minimal 1 butir soal.', 'error');
      return;
    }

    const targetRombel = rombels.find((r) => r.id === quizForm.rombel_id) || rombels[0];
    const targetMapel = mapels.find((m) => m.id === quizForm.mapel_id) || mapels[0];

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + (quizForm.deadline_days || 7));

    const totalWeight = quizForm.soal_list.reduce((acc, curr) => acc + (curr.skor_bobot || 20), 0);

    const newQuizId = `tugas-quiz-${Date.now()}`;
    const finalizedQuestions = quizForm.soal_list.map((s, idx) => ({
      ...s,
      id: `soal-${newQuizId}-${idx + 1}`,
      tugas_id: newQuizId,
      nomor: idx + 1,
    }));

    const newQuiz: Tugas = {
      id: newQuizId,
      school_id: user.school_id,
      rombel_id: targetRombel.id,
      rombel_nama: targetRombel.nama,
      mapel_id: targetMapel.id,
      mapel_nama: targetMapel.nama,
      guru_id: user.id,
      guru_nama: user.nama,
      judul: quizForm.judul.trim(),
      instruksi: quizForm.instruksi.trim(),
      deadline: deadlineDate.toISOString(),
      nilai_maksimal: totalWeight || 100,
      tipe_pengumpulan: 'in_app',
      tipe_penugasan: 'kuis',
      waktu_pengerjaan_menit: Number(quizForm.waktu_pengerjaan_menit) || 0,
      jumlah_percobaan: Number(quizForm.jumlah_percobaan) || 1,
      status_terbit: 'terbit',
      is_ai_generated: false,
      created_at: new Date().toISOString(),
      soal_list: finalizedQuestions,
    };

    const currentTugas = localDB.getTugas();
    localDB.saveTugas([newQuiz, ...currentTugas]);

    // Notify all students in the rombel
    const allProfiles = localDB.getProfiles();
    const studentsInClass = allProfiles.filter((p) => p.role === 'SISWA' && p.rombel_id === targetRombel.id);
    const notifs = localDB.getNotifikasi();
    const newNotifs = studentsInClass.map((st) => ({
      id: `notif-quiz-${Date.now()}-${st.id}`,
      user_id: st.id,
      judul: `Kuis Baru: ${newQuiz.judul} ⏱️`,
      pesan: `Bapak/Ibu ${user.nama} telah menerbitkan kuis ${targetMapel.nama} (${newQuiz.waktu_pengerjaan_menit ? `${newQuiz.waktu_pengerjaan_menit} menit` : 'tanpa batas waktu'}). Ayo kerjakan dan kumpulkan bintangmu!`,
      link: '/dashboard',
      tipe: 'tugas_baru' as const,
      dibaca: false,
      created_at: new Date().toISOString(),
    }));
    localDB.saveNotifikasi([...newNotifs, ...notifs]);

    // Audit log
    localDB.addAuditLog({
      user_id: user.id,
      user_nama: user.nama,
      user_role: 'GURU',
      school_id: user.school_id,
      school_nama: user.school_nama,
      aksi: 'CREATE_QUIZ',
      deskripsi: `Guru ${user.nama} membuat Kuis Interaktif "${newQuiz.judul}" untuk kelas ${targetRombel.nama} (${finalizedQuestions.length} butir soal, timer ${newQuiz.waktu_pengerjaan_menit}m)`,
    });

    loadData();
    setIsManualQuizOpen(false);
    onShowToast(`🎉 Kuis "${newQuiz.judul}" berhasil diterbitkan ke kelas!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Selector */}
          <select
            value={selectedRombelId}
            onChange={(e) => setSelectedRombelId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Semua Kelas Rombel</option>
            {rombels.map((r) => (
              <option key={r.id} value={r.id}>
                Kelas {r.nama} ({r.fase})
              </option>
            ))}
          </select>

          {/* Mapel Filter Selector */}
          <select
            value={selectedMapelFilter}
            onChange={(e) => setSelectedMapelFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {mapels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>

          {/* Type Filter Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({tugasList.length})
            </button>
            <button
              onClick={() => setFilterType('KUIS')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                filterType === 'KUIS' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Kuis Interaktif</span>
            </button>
            <button
              onClick={() => setFilterType('TUGAS')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                filterType === 'TUGAS' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Tugas Biasa</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas / kuis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Action Buttons: AI vs Manual Quiz */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualQuizOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-blue-600 text-blue-600 font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Timer className="w-4 h-4 text-blue-600" />
            <span>+ Buat Kuis Manual</span>
          </button>

          <button
            onClick={() => setIsAIModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate AI Task</span>
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTugas.map((t) => {
          const isQuiz = t.tipe_penugasan === 'kuis' || Boolean(t.waktu_pengerjaan_menit);

          return (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {t.rombel_nama}
                    </span>
                    {isQuiz && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                        <Timer className="w-3 h-3" />
                        KUIS
                      </span>
                    )}
                  </div>
                  {t.is_ai_generated && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      AI Generated
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-slate-800 line-clamp-2 mt-1">
                  {t.judul}
                </h3>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{t.mapel_nama}</p>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {t.instruksi}
                </p>

                {/* Badges for Quiz Timer & Attempt */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {t.waktu_pengerjaan_menit ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                      <Timer className="w-3.5 h-3.5" />
                      Durasi: {t.waktu_pengerjaan_menit} Menit
                    </span>
                  ) : null}

                  {t.jumlah_percobaan ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 font-bold text-[11px] border border-slate-200">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      Batas: {t.jumlah_percobaan >= 99 ? 'Tak Terbatas' : `${t.jumlah_percobaan}x Coba`}
                    </span>
                  ) : null}

                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Tenggat:{' '}
                      {new Date(t.deadline).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedTaskQuestions(t)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition py-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Lihat {t.soal_list?.length || 0} Soal</span>
                </button>

                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Hapus Tugas/Kuis"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: VIEW QUESTIONS */}
      {selectedTaskQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600">
                  {selectedTaskQuestions.mapel_nama} • {selectedTaskQuestions.rombel_nama}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-800">
                  {selectedTaskQuestions.judul}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskQuestions(null)}
                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {(!selectedTaskQuestions.soal_list || selectedTaskQuestions.soal_list.length === 0) ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  Tidak ada butir soal tersimpan pada penugasan ini.
                </p>
              ) : (
                selectedTaskQuestions.soal_list.map((s, idx) => (
                  <div key={s.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Soal No. {s.nomor} ({s.tipe})</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                        Bobot: {s.skor_bobot} Poin
                      </span>
                    </div>

                    <p className="text-sm font-extrabold text-slate-800">{s.pertanyaan}</p>

                    {s.pilihan && s.pilihan.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                        {s.pilihan.map((p, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl border ${
                              p.startsWith(s.kunci_jawaban.charAt(0)) || p === s.kunci_jawaban
                                ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 text-xs text-slate-600 space-y-1">
                      <p>
                        <strong className="text-emerald-800">Kunci Jawaban:</strong> {s.kunci_jawaban}
                      </p>
                      {s.pembahasan && (
                        <p className="italic text-slate-500">
                          <strong>Pembahasan:</strong> {s.pembahasan}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTaskQuestions(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL QUIZ BUILDER */}
      {isManualQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-4xl max-w-3xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-600" />
                  <span>Buat Kuis Interaktif Manual</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rancang kuis pilihan ganda, benar/salah, atau isian singkat lengkap dengan durasi timer dan nilai otomatis.
                </p>
              </div>
              <button
                onClick={() => setIsManualQuizOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualQuiz} className="space-y-5">
              {/* Basic Quiz Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Judul Kuis *
                  </label>
                  <input
                    type="text"
                    value={quizForm.judul}
                    onChange={(e) => setQuizForm({ ...quizForm, judul: e.target.value })}
                    placeholder="Contoh: Kuis Harian Bab 1 - Pancasila & Lambang Negara"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Mata Pelajaran - Integrated First */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={quizForm.mapel_id}
                    onChange={(e) => {
                      const newMapelId = e.target.value;
                      const targetM = mapels.find((m) => m.id === newMapelId);
                      const validR = getAvailableRombelForMapel(targetM, rombels);
                      const stillValid = validR.some((r) => r.id === quizForm.rombel_id);
                      setQuizForm({
                        ...quizForm,
                        mapel_id: newMapelId,
                        rombel_id: stillValid ? quizForm.rombel_id : (validR[0]?.id || rombels[0]?.id || ''),
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    {mapels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Kelas Rombel - Filtered according to selected Mapel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Kelas Rombel (Sesuai Mapel) *
                  </label>
                  {(() => {
                    const activeMapel = mapels.find((m) => m.id === quizForm.mapel_id);
                    const validRombels = getAvailableRombelForMapel(activeMapel, rombels);
                    return (
                      <select
                        value={quizForm.rombel_id}
                        onChange={(e) => setQuizForm({ ...quizForm, rombel_id: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500 bg-white"
                      >
                        {validRombels.map((r) => (
                          <option key={r.id} value={r.id}>
                            Kelas {r.nama} ({r.fase})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Durasi Timer Kuis (Menit)
                  </label>
                  <select
                    value={quizForm.waktu_pengerjaan_menit}
                    onChange={(e) => setQuizForm({ ...quizForm, waktu_pengerjaan_menit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value={0}>Tanpa Batas Waktu (Santai)</option>
                    <option value={15}>15 Menit</option>
                    <option value={30}>30 Menit (Standar)</option>
                    <option value={45}>45 Menit</option>
                    <option value={60}>60 Menit (Ujian)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Percobaan Siswa
                  </label>
                  <select
                    value={quizForm.jumlah_percobaan}
                    onChange={(e) => setQuizForm({ ...quizForm, jumlah_percobaan: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value={1}>1 Kali Kesempatan (Ujian)</option>
                    <option value={2}>2 Kali Kesempatan</option>
                    <option value={3}>3 Kali Kesempatan</option>
                    <option value={99}>Tidak Terbatas (Latihan Bebas)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Instruksi Pengerjaan
                  </label>
                  <textarea
                    rows={2}
                    value={quizForm.instruksi}
                    onChange={(e) => setQuizForm({ ...quizForm, instruksi: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Questions List Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Daftar Butir Soal Kuis ({quizForm.soal_list.length} Butir)
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('pilihan_ganda')}
                      className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200"
                    >
                      + Pilihan Ganda
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('benar_salah')}
                      className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-xl border border-purple-200"
                    >
                      + Benar / Salah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('isian')}
                      className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200"
                    >
                      + Isian Singkat
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {quizForm.soal_list.map((s, idx) => (
                    <div key={s.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            Soal No. {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            Tipe: {s.tipe.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Hapus butir soal ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={s.pertanyaan}
                        onChange={(e) => handleUpdateQuestion(idx, 'pertanyaan', e.target.value)}
                        placeholder="Tuliskan pertanyaan soal..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                        required
                      />

                      {/* Options editor for Pilihan Ganda */}
                      {s.tipe === 'pilihan_ganda' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {(s.pilihan || ['A.', 'B.', 'C.', 'D.']).map((opt, optIdx) => (
                            <input
                              key={optIdx}
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(s.pilihan || [])];
                                newOpts[optIdx] = e.target.value;
                                handleUpdateQuestion(idx, 'pilihan', newOpts);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
                              placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                            />
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                            Kunci Jawaban Tepat
                          </label>
                          <input
                            type="text"
                            value={s.kunci_jawaban}
                            onChange={(e) => handleUpdateQuestion(idx, 'kunci_jawaban', e.target.value)}
                            placeholder="Contoh: A atau Jakarta"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-emerald-300 font-bold text-emerald-900 focus:outline-none focus:border-emerald-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Pembahasan Edukatif
                          </label>
                          <input
                            type="text"
                            value={s.pembahasan}
                            onChange={(e) => handleUpdateQuestion(idx, 'pembahasan', e.target.value)}
                            placeholder="Penjelasan mengapa jawaban tersebut benar"
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualQuizOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terbitkan Kuis Sekarang 🚀</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Task Generator Modal */}
      {isAIModalOpen && (
        <AITaskGeneratorModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          rombels={rombels}
          mapels={mapels}
          onTaskCreated={(newTask) => {
            loadData();
            setIsAIModalOpen(false);
            onShowToast(`🎉 Tugas "${newTask.judul}" berhasil diterbitkan ke kelas!`, 'success');
          }}
        />
      )}
    </div>
  );
};
