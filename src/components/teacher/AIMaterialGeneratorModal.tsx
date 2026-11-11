import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  RefreshCw,
  Check,
  X,
  BookOpen,
  FileText,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  FileCheck,
  Timer,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Rombel, MataPelajaran, MateriPembelajaran, Tugas, SoalTugas } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import {
  getFaseFromKelas,
  getFaseDescription,
  getRecommendedTopics,
  getAvailableRombelForMapel,
  getAvailableMapelForKelas,
  detectKurikulumWarnings,
} from '../../lib/kurikulum';

interface AIMaterialGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rombels: Rombel[];
  mapels: MataPelajaran[];
  onMaterialCreated: (material: MateriPembelajaran) => void;
  onCompanionQuizCreated?: (quiz: Tugas) => void;
}

export const AIMaterialGeneratorModal: React.FC<AIMaterialGeneratorModalProps> = ({
  isOpen,
  onClose,
  rombels,
  mapels,
  onMaterialCreated,
  onCompanionQuizCreated,
}) => {
  const { user } = useAuth();

  // Integrated cascade state
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapels[0]?.id || '');
  const [selectedRombelId, setSelectedRombelId] = useState<string>(rombels[0]?.id || '');
  const [topik, setTopik] = useState('');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState('');
  const [capaianPembelajaran, setCapaianPembelajaran] = useState('');
  const [includeCompanionQuiz, setIncludeCompanionQuiz] = useState(true);
  const [jumlahKuis, setJumlahKuis] = useState<number>(3);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Generated draft state
  const [draftResult, setDraftResult] = useState<{
    judul: string;
    deskripsi_singkat: string;
    capaian_pembelajaran: string;
    tujuan_pembelajaran: string;
    uraian_materi: string;
    poin_penting: string[];
    contoh_nyata: string;
    aktivitas_siswa: string;
    lkpd_panduan: string;
    soal_kuis?: {
      nomor: number;
      tipe: string;
      pertanyaan: string;
      pilihan?: string[];
      kunci_jawaban: string;
      pembahasan: string;
      skor_bobot: number;
    }[];
  } | null>(null);

  // Active Mapel from database
  const currentMapel = mapels.find((m) => m.id === selectedMapelId) || mapels[0];

  // Integrated cascade: filter rombels matching the selected Mapel
  const availableRombels = useMemo(() => {
    return getAvailableRombelForMapel(currentMapel, rombels);
  }, [currentMapel, rombels]);

  // Ensure selected rombel is in available rombels
  useEffect(() => {
    if (availableRombels.length > 0 && !availableRombels.some((r) => r.id === selectedRombelId)) {
      setSelectedRombelId(availableRombels[0].id);
    }
  }, [availableRombels, selectedRombelId]);

  const currentRombel =
    availableRombels.find((r) => r.id === selectedRombelId) || availableRombels[0] || rombels[0];
  const tingkatKelas = currentRombel?.tingkat_kelas || 1;

  // Integrated recommendation topics strictly matching selected Mapel & Kelas
  const recommendedTopics = useMemo(() => {
    return getRecommendedTopics(tingkatKelas, currentMapel?.nama);
  }, [tingkatKelas, currentMapel?.nama]);

  // Pedagogical warnings
  const activeWarnings = useMemo(() => {
    return detectKurikulumWarnings(
      tingkatKelas,
      currentMapel?.nama || '',
      topik,
      'sedang',
      'campuran'
    );
  }, [tingkatKelas, currentMapel?.nama, topik]);

  if (!isOpen || !user) return null;

  const handleSelectTopicChip = (topicItem: any) => {
    setTopik(topicItem.topik);
    setTujuanPembelajaran(topicItem.tujuanPembelajaran);
    setCapaianPembelajaran(topicItem.capaianPembelajaran);
  };

  const handleGenerate = async () => {
    if (!topik.trim()) {
      setError('Silakan pilih atau masukkan topik materi pembelajaran.');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tingkat_kelas: tingkatKelas,
          mata_pelajaran: currentMapel?.nama || 'Matematika',
          topik: topik.trim(),
          tujuan_pembelajaran: tujuanPembelajaran.trim(),
          capaian_pembelajaran: capaianPembelajaran.trim(),
          include_quiz: includeCompanionQuiz,
          jumlah_soal_kuis: jumlahKuis,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal membuat materi dengan AI.');
      }

      setDraftResult(resData.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Kendala saat menghubungi AI. Silakan coba kembali.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishAll = () => {
    if (!draftResult) return;

    const newMaterialId = `mat-${Date.now()}`;

    // Combine material narrative and sections into structured description
    const fullContent = `${draftResult.uraian_materi}

📌 Poin Penting (Ayo Ingat!):
${draftResult.poin_penting.map((p) => `• ${p}`).join('\n')}

🌟 Contoh dalam Kehidupan Nyata:
${draftResult.contoh_nyata}

🔬 Aktivitas Belajar / Eksperimen Mini:
${draftResult.aktivitas_siswa}`;

    // Format LKPD document as downloadable/viewable data URL
    const lkpdFileName = `LKPD_${draftResult.judul.replace(/\s+/g, '_')}.txt`;
    const lkpdDataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(
      draftResult.lkpd_panduan || fullContent
    )}`;

    const newMateri: MateriPembelajaran = {
      id: newMaterialId,
      rombel_id: currentRombel.id,
      rombel_nama: currentRombel.nama,
      mapel_id: currentMapel.id,
      mapel_nama: currentMapel.nama,
      guru_id: user.id,
      guru_nama: user.nama,
      judul: draftResult.judul,
      topik: topik.trim(),
      capaian_pembelajaran: draftResult.capaian_pembelajaran,
      tujuan_pembelajaran: draftResult.tujuan_pembelajaran,
      deskripsi: fullContent,
      tipe_konten: 'dokumen',
      file_url: lkpdDataUrl,
      file_nama: lkpdFileName,
      file_ukuran: '120 KB',
      urutan: localDB.getMateri().length + 1,
      created_at: new Date().toISOString(),
      selesai_oleh_siswa: false,
    };

    const allMateri = localDB.getMateri();
    localDB.saveMateri([newMateri, ...allMateri]);

    // Send notifications to students in this class
    const allNotifs = localDB.getNotifikasi();
    const allProfiles = localDB.getProfiles();
    const classStudents = allProfiles.filter(
      (p) => p.role === 'SISWA' && p.rombel_id === currentRombel.id
    );

    classStudents.forEach((st) => {
      allNotifs.unshift({
        id: `notif-${Date.now()}-${st.id}`,
        user_id: st.id,
        judul: `Materi Baru: ${newMateri.judul} 📚`,
        pesan: `${user.nama} telah menerbitkan materi pembelajaran baru di kelas ${currentRombel.nama}. Ayo buka dan baca langsung!`,
        link: '/materi',
        tipe: 'materi_baru',
        dibaca: false,
        created_at: new Date().toISOString(),
      });
    });

    // Optionally publish companion Quiz if requested and available!
    if (includeCompanionQuiz && draftResult.soal_kuis && draftResult.soal_kuis.length > 0) {
      const newQuizId = `tug-ai-${Date.now()}`;
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 5);

      const formattedSoal: SoalTugas[] = draftResult.soal_kuis.map((s, idx) => ({
        id: `soal-${newQuizId}-${idx + 1}`,
        tugas_id: newQuizId,
        nomor: idx + 1,
        tipe: (s.tipe as any) || 'pilihan_ganda',
        pertanyaan: s.pertanyaan,
        pilihan: s.pilihan,
        kunci_jawaban: s.kunci_jawaban,
        pembahasan: s.pembahasan || '',
        skor_bobot: s.skor_bobot || Math.round(100 / draftResult.soal_kuis!.length),
      }));

      const newQuiz: Tugas = {
        id: newQuizId,
        school_id: user.school_id,
        rombel_id: currentRombel.id,
        rombel_nama: currentRombel.nama,
        mapel_id: currentMapel.id,
        mapel_nama: currentMapel.nama,
        guru_id: user.id,
        guru_nama: user.nama,
        judul: `Kuis Pemahaman: ${draftResult.judul}`,
        instruksi: `Kerjakan kuis latihan pemahaman materi "${draftResult.judul}" berikut dengan teliti dan gembira!`,
        deadline: deadlineDate.toISOString(),
        nilai_maksimal: 100,
        tipe_pengumpulan: 'in_app',
        tipe_penugasan: 'kuis',
        waktu_pengerjaan_menit: 20,
        jumlah_percobaan: 2,
        status_terbit: 'terbit',
        is_ai_generated: true,
        created_at: new Date().toISOString(),
        soal_list: formattedSoal,
      };

      const allTugas = localDB.getTugas();
      localDB.saveTugas([newQuiz, ...allTugas]);

      if (onCompanionQuizCreated) {
        onCompanionQuizCreated(newQuiz);
      }
    }

    localDB.saveNotifikasi(allNotifs);
    onMaterialCreated(newMateri);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl">Generate Materi AI Guru</h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-300 text-amber-900 uppercase tracking-wide">
                  Kurikulum Merdeka SD
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                AI Gemini menyusun materi ajar ramah anak, modul LKPD, dan kuis otomatis terpadu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!draftResult ? (
            /* STEP 1: CONFIGURATION FORM (INTEGRATED CASCADE) */
            <div className="space-y-4">
              {/* Row 1: Mata Pelajaran & Kelas Rombel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      1. Pilih Mata Pelajaran *
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Kategori: {currentMapel?.kategori || 'Wajib'}
                    </span>
                  </div>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold bg-white"
                  >
                    {mapels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} ({m.kategori})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {currentMapel?.deskripsi}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      2. Kelas Rombel Belajar *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {getFaseFromKelas(tingkatKelas)}
                    </span>
                  </div>
                  <select
                    value={selectedRombelId}
                    onChange={(e) => setSelectedRombelId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold bg-white"
                  >
                    {availableRombels.map((r) => (
                      <option key={r.id} value={r.id}>
                        Kelas {r.nama} ({r.fase})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hanya menampilkan kelas yang sesuai dengan mata pelajaran {currentMapel?.nama}.
                  </p>
                </div>
              </div>

              {/* Row 2: Topik Pembelajaran */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    3. Topik / Bab Pembelajaran *
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    {currentMapel?.nama} • Kelas {tingkatKelas}
                  </span>
                </div>
                <input
                  type="text"
                  value={topik}
                  onChange={(e) => setTopik(e.target.value)}
                  placeholder={`Contoh topik ${currentMapel?.nama} Kelas ${tingkatKelas}...`}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold bg-white"
                />

                {/* Integrated Kurikulum Merdeka Topic Chips */}
                {recommendedTopics.length > 0 && (
                  <div className="mt-2.5">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rekomendasi Kurikulum Merdeka untuk {currentMapel?.nama} (Kelas {tingkatKelas}):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendedTopics.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectTopicChip(item)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition text-left"
                        >
                          + {item.topik}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Capaian & Tujuan Pembelajaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tujuan Pembelajaran (TP) *
                  </label>
                  <textarea
                    rows={2}
                    value={tujuanPembelajaran}
                    onChange={(e) => setTujuanPembelajaran(e.target.value)}
                    placeholder="Siswa mampu menjelaskan dan memberikan contoh konkret..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Capaian Pembelajaran (CP) - Opsional
                  </label>
                  <textarea
                    rows={2}
                    value={capaianPembelajaran}
                    onChange={(e) => setCapaianPembelajaran(e.target.value)}
                    placeholder="Peserta didik menganalisis dan menerapkan konsep..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Pedagogical Warnings if any */}
              {activeWarnings.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {activeWarnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">{w.title}: </span>
                        <span>{w.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Companion Quiz Checkbox & Setting */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCompanionQuiz}
                    onChange={(e) => setIncludeCompanionQuiz(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-blue-600" />
                    <span>Buat Soal & Kuis Otomatis Berdasarkan Materi Ini</span>
                  </span>
                </label>
                <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                  AI akan langsung merumuskan 3-5 butir soal pemahaman (pilihan ganda / benar salah) yang siap diujikan kepada siswa dengan penilaian otomatis.
                </p>

                {includeCompanionQuiz && (
                  <div className="pl-6 pt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Jumlah Soal Kuis:</span>
                    <select
                      value={jumlahKuis}
                      onChange={(e) => setJumlahKuis(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value={3}>3 Butir Soal (Ringkas Cepat)</option>
                      <option value={5}>5 Butir Soal (Latihan Lengkap)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: GENERATED DRAFT PREVIEW & EDITING */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Materi Selesai Disusun
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    {currentMapel?.nama} • {currentRombel?.nama}
                  </span>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  Generate Ulang
                </button>
              </div>

              {/* Title & Short Desc Edit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Materi Pembelajaran</label>
                <input
                  type="text"
                  value={draftResult.judul}
                  onChange={(e) => setDraftResult({ ...draftResult, judul: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white"
                />
              </div>

              {/* Narrative Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian Materi (Bahasa Ramah Anak SD)
                </label>
                <textarea
                  rows={5}
                  value={draftResult.uraian_materi}
                  onChange={(e) => setDraftResult({ ...draftResult, uraian_materi: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed bg-white"
                />
              </div>

              {/* Key Takeaways & Real World Example */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                  <span className="font-extrabold text-amber-900 block mb-1">📌 Poin Penting (Ayo Ingat!):</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {draftResult.poin_penting.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="font-extrabold text-blue-900 block mb-1">🌟 Contoh Nyata:</span>
                  <p className="text-slate-700 leading-relaxed">{draftResult.contoh_nyata}</p>
                </div>
              </div>

              {/* Hands-on Activity & LKPD */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Lembar Kerja Peserta Didik (LKPD) Siap Baca Langsung</span>
                </span>
                <textarea
                  rows={4}
                  value={draftResult.lkpd_panduan}
                  onChange={(e) => setDraftResult({ ...draftResult, lkpd_panduan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-serif leading-relaxed bg-white"
                />
              </div>

              {/* Companion Quiz Preview */}
              {includeCompanionQuiz && draftResult.soal_kuis && draftResult.soal_kuis.length > 0 && (
                <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-indigo-600" />
                      <span>Kuis Pemahaman Terpadu ({draftResult.soal_kuis.length} Butir Soal)</span>
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Dinilai Otomatis
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {draftResult.soal_kuis.map((q, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-700">
                          <span>Soal No. {idx + 1} ({q.tipe})</span>
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Kunci: {q.kunci_jawaban}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">{q.pertanyaan}</p>
                        {q.pilihan && (
                          <div className="flex flex-wrap gap-1 text-[11px] text-slate-500 pt-1">
                            {q.pilihan.map((p, pIdx) => (
                              <span key={pIdx} className="bg-slate-100 px-2 py-0.5 rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-600 hover:bg-white transition"
          >
            Batal
          </button>

          {!draftResult ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topik.trim()}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Merumuskan Materi Ajar SD...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Materi dengan AI</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setDraftResult(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-white transition"
              >
                Ubah Parameter
              </button>
              <button
                onClick={handlePublishAll}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Terbitkan Materi {includeCompanionQuiz ? '+ Kuis' : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
