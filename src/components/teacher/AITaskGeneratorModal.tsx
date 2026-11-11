import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Edit3,
  Lightbulb,
  CheckCircle2,
  Scale,
  BookOpen,
} from 'lucide-react';
import { Rombel, MataPelajaran, Tugas, SoalTugas } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import {
  getFaseFromKelas,
  getFaseDescription,
  getRecommendedTopics,
  getAvailableRombelForMapel,
  getAvailableMapelForKelas,
  detectKurikulumWarnings,
  KurikulumMerdekaTopic,
} from '../../lib/kurikulum';

interface AITaskGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rombels: Rombel[];
  mapels: MataPelajaran[];
  onTaskCreated: (task: Tugas) => void;
}

export const AITaskGeneratorModal: React.FC<AITaskGeneratorModalProps> = ({
  isOpen,
  onClose,
  rombels,
  mapels,
  onTaskCreated,
}) => {
  const { user } = useAuth();
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapels[0]?.id || '');
  const [selectedRombelId, setSelectedRombelId] = useState<string>(rombels[0]?.id || '');
  const [topik, setTopik] = useState('');
  const [tingkatKesulitan, setTingkatKesulitan] = useState<'mudah' | 'sedang' | 'sulit'>('sedang');
  const [jumlahSoal, setJumlahSoal] = useState<number>(5);
  const [tipeSoal, setTipeSoal] = useState<'pilihan_ganda' | 'isian' | 'esai' | 'campuran'>('pilihan_ganda');
  const [instruksiTambahan, setInstruksiTambahan] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [draftResult, setDraftResult] = useState<{
    judul_tugas: string;
    deskripsi_tugas: string;
    capaian_pembelajaran_singkat: string;
    soal: {
      nomor: number;
      tipe: string;
      pertanyaan: string;
      pilihan?: string[];
      kunci_jawaban: string;
      pembahasan: string;
      skor_bobot: number;
    }[];
  } | null>(null);

  // Editable draft states
  const [generatedSource, setGeneratedSource] = useState<'gemini' | 'smart-curriculum-ai' | ''>('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editedDeadlineDays, setEditedDeadlineDays] = useState(3);

  const currentMapel = mapels.find((m) => m.id === selectedMapelId) || mapels[0];

  // Cascading: Rombels matching selected Mata Pelajaran
  const availableRombels = useMemo(() => {
    return getAvailableRombelForMapel(currentMapel, rombels);
  }, [currentMapel, rombels]);

  useEffect(() => {
    if (availableRombels.length > 0 && !availableRombels.some((r) => r.id === selectedRombelId)) {
      setSelectedRombelId(availableRombels[0].id);
    }
  }, [availableRombels, selectedRombelId]);

  const currentRombel =
    availableRombels.find((r) => r.id === selectedRombelId) || availableRombels[0] || rombels[0];
  const tingkatKelas = currentRombel?.tingkat_kelas || 1;

  // Dynamic real-time pedagogical warning detector
  const activeWarnings = useMemo(() => {
    return detectKurikulumWarnings(
      tingkatKelas,
      currentMapel?.nama || '',
      topik,
      tingkatKesulitan,
      tipeSoal
    );
  }, [tingkatKelas, currentMapel?.nama, topik, tingkatKesulitan, tipeSoal]);

  // Synchronized topic recommendation chips for the active class & subject
  const recommendedTopics = useMemo(() => {
    return getRecommendedTopics(tingkatKelas, currentMapel?.nama);
  }, [tingkatKelas, currentMapel?.nama]);

  if (!isOpen || !user) return null;

  const handleRombelChange = (rombelId: string) => {
    setSelectedRombelId(rombelId);
  };

  const handleGenerate = async () => {
    if (!topik.trim()) {
      setError('Mohon masukkan nama topik atau bab pembelajaran yang ingin diujikan.');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tingkat_kelas: currentRombel?.tingkat_kelas || tingkatKelas,
          mata_pelajaran: currentMapel?.nama || 'Matematika',
          topik: topik.trim(),
          tingkat_kesulitan: tingkatKesulitan,
          jumlah_soal: jumlahSoal,
          tipe_soal: tipeSoal,
          instruksi_tambahan: instruksiTambahan,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gagal menyusun soal kuis.');
      }

      setDraftResult(resData.data);
      setGeneratedSource(resData.source || 'gemini');
      setEditedTitle(resData.data.judul_tugas || `Latihan ${currentMapel?.nama}: ${topik}`);
      setEditedDesc(resData.data.deskripsi_tugas || 'Kerjakan tugas latihan ini dengan teliti dan gembira!');
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 'Terjadi kendala saat merumuskan soal. Pastikan koneksi dan Gemini API aktif.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Draft editing helpers
  const updateQuestionText = (qIndex: number, text: string) => {
    if (!draftResult) return;
    const updated = [...draftResult.soal];
    updated[qIndex].pertanyaan = text;
    setDraftResult({ ...draftResult, soal: updated });
  };

  const updateQuestionAnswerKey = (qIndex: number, key: string) => {
    if (!draftResult) return;
    const updated = [...draftResult.soal];
    updated[qIndex].kunci_jawaban = key;
    setDraftResult({ ...draftResult, soal: updated });
  };

  const updateQuestionExplanation = (qIndex: number, exp: string) => {
    if (!draftResult) return;
    const updated = [...draftResult.soal];
    updated[qIndex].pembahasan = exp;
    setDraftResult({ ...draftResult, soal: updated });
  };

  const updateOptionText = (qIndex: number, optIndex: number, newText: string) => {
    if (!draftResult) return;
    const updated = [...draftResult.soal];
    const opts = [...(updated[qIndex].pilihan || [])];
    opts[optIndex] = newText;
    updated[qIndex].pilihan = opts;
    setDraftResult({ ...draftResult, soal: updated });
  };

  const removeQuestion = (qIndex: number) => {
    if (!draftResult) return;
    if (draftResult.soal.length <= 1) {
      alert('Tugas harus memiliki minimal 1 butir soal.');
      return;
    }
    const updated = draftResult.soal.filter((_, idx) => idx !== qIndex);
    // Renumber
    const renumbered = updated.map((q, idx) => ({ ...q, nomor: idx + 1 }));
    setDraftResult({ ...draftResult, soal: renumbered });
  };

  const handleAddQuestion = () => {
    if (!draftResult) return;
    const isFaseA = tingkatKelas <= 2;
    const nextNomor = draftResult.soal.length + 1;
    const defaultWeight = Math.round(100 / nextNomor);

    const newQuestion = {
      nomor: nextNomor,
      tipe: tipeSoal === 'isian' ? 'isian' : tipeSoal === 'esai' ? 'esai' : 'pilihan_ganda',
      pertanyaan: `Pertanyaan baru nomor ${nextNomor} tentang ${topik}:`,
      pilihan:
        tipeSoal === 'pilihan_ganda' || tipeSoal === 'campuran'
          ? isFaseA
            ? ['A. Jawaban Pertama', 'B. Jawaban Kedua', 'C. Jawaban Ketiga']
            : ['A. Jawaban A', 'B. Jawaban B', 'C. Jawaban C', 'D. Jawaban D']
          : undefined,
      kunci_jawaban:
        tipeSoal === 'pilihan_ganda' || tipeSoal === 'campuran' ? 'A. Jawaban Pertama' : 'Kunci Jawaban',
      pembahasan: 'Penjelasan yang mendidik dan menyemangati peserta didik.',
      skor_bobot: defaultWeight,
    };

    setDraftResult({
      ...draftResult,
      soal: [...draftResult.soal, newQuestion],
    });
  };

  const handleBalanceWeights = () => {
    if (!draftResult || draftResult.soal.length === 0) return;
    const count = draftResult.soal.length;
    const base = Math.floor(100 / count);
    const rem = 100 - base * count;

    const rebalanced = draftResult.soal.map((s, idx) => ({
      ...s,
      skor_bobot: idx === 0 ? base + rem : base,
    }));

    setDraftResult({ ...draftResult, soal: rebalanced });
  };

  const totalScoreWeight = (draftResult?.soal || []).reduce(
    (sum, q) => sum + (Number(q.skor_bobot) || 0),
    0
  );

  const handleSaveAndPublish = () => {
    if (!draftResult) return;

    // Validate that all questions have question text and answer key
    for (const q of draftResult.soal) {
      if (!q.pertanyaan.trim()) {
        alert(`Soal No. ${q.nomor} belum memiliki kalimat pertanyaan.`);
        return;
      }
      if (!q.kunci_jawaban.trim()) {
        alert(`Soal No. ${q.nomor} belum memiliki kunci jawaban.`);
        return;
      }
    }

    const newTaskId = `tug-${Date.now()}`;
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + editedDeadlineDays);

    const formattedSoal: SoalTugas[] = (draftResult.soal || []).map((s, idx) => ({
      id: `soal-${newTaskId}-${idx + 1}`,
      tugas_id: newTaskId,
      nomor: idx + 1,
      tipe: (s.tipe as any) || 'pilihan_ganda',
      pertanyaan: s.pertanyaan,
      pilihan: s.pilihan,
      kunci_jawaban: s.kunci_jawaban,
      pembahasan: s.pembahasan || '',
      skor_bobot: s.skor_bobot || Math.round(100 / draftResult.soal.length),
    }));

    const newTask: Tugas = {
      id: newTaskId,
      rombel_id: currentRombel.id,
      rombel_nama: currentRombel.nama,
      mapel_id: currentMapel.id,
      mapel_nama: currentMapel.nama,
      guru_id: user.id,
      guru_nama: user.nama,
      judul: editedTitle,
      instruksi: editedDesc,
      deadline: deadlineDate.toISOString(),
      nilai_maksimal: 100,
      tipe_pengumpulan: 'in_app',
      is_ai_generated: true,
      created_at: new Date().toISOString(),
      soal_list: formattedSoal,
    };

    const allTugas = localDB.getTugas();
    allTugas.unshift(newTask);
    localDB.saveTugas(allTugas);

    // Notify all 20 students of that rombel
    const allNotifs = localDB.getNotifikasi();
    const allProfiles = localDB.getProfiles();
    const classStudents = allProfiles.filter(
      (p) => p.role === 'SISWA' && p.rombel_id === currentRombel.id
    );

    classStudents.forEach((st) => {
      allNotifs.unshift({
        id: `notif-${Date.now()}-${st.id}`,
        user_id: st.id,
        judul: `Tugas Baru: ${newTask.judul}`,
        pesan: `Bapak/Ibu Guru telah merilis tugas latihan baru untuk kelas ${currentRombel.nama}. Ayo buka dan kerjakan!`,
        link: '/tugas',
        tipe: 'tugas_baru',
        dibaca: false,
        created_at: new Date().toISOString(),
      });
    });
    localDB.saveNotifikasi(allNotifs);

    onTaskCreated(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl">AI Generator Tugas SD</h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-300 text-amber-900 uppercase tracking-wide">
                  Kurikulum Merdeka
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Merumuskan soal sinkron sesuai fase belajar anak, tingkat kesulitan, dan validasi kurikulum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!draftResult ? (
            /* CONFIGURATION FORM */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Mata Pelajaran *
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Kategori: {currentMapel?.kategori || 'Wajib'}
                    </span>
                  </div>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold bg-white"
                  >
                    {mapels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} ({m.kategori})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Target Kelas Rombel *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {getFaseFromKelas(tingkatKelas)}
                    </span>
                  </div>
                  <select
                    value={selectedRombelId}
                    onChange={(e) => handleRombelChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold bg-white"
                  >
                    {availableRombels.map((r) => (
                      <option key={r.id} value={r.id}>
                        Kelas {r.nama} ({r.fase})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Bab / Topik Pembelajaran *
                  </label>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {getFaseFromKelas(tingkatKelas)} (Kelas {tingkatKelas} SD)
                  </span>
                </div>
                <input
                  type="text"
                  value={topik}
                  onChange={(e) => setTopik(e.target.value)}
                  placeholder={
                    tingkatKelas <= 2
                      ? 'Contoh: Berhitung Buah 1-10 / Mengenal Huruf Vokal A-I-U-E-O'
                      : tingkatKelas <= 4
                      ? 'Contoh: Wujud Zat dan Perubahannya / Bagian Tubuh Tumbuhan'
                      : 'Contoh: Rantai Makanan Ekosistem Sawah / Tata Surya'
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold bg-white"
                />

                {/* Quick Recommendation Chips Synchronized with Subject and Class */}
                {recommendedTopics.length > 0 && (
                  <div className="mt-2.5">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rekomendasi Topik {currentMapel?.nama} ({getFaseFromKelas(tingkatKelas)}):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendedTopics.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTopik(item.topik);
                            setInstruksiTambahan(item.tujuanPembelajaran);
                          }}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition text-left"
                        >
                          + {item.topik}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Pedagogical & Curriculum Warnings Panel */}
              {activeWarnings.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                    Pemeriksaan Kurikulum & Pedagogi:
                  </span>
                  {activeWarnings.map((w, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                        w.type === 'critical'
                          ? 'bg-rose-50/90 border-rose-300 text-rose-900'
                          : w.type === 'advisory'
                          ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                          : 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
                      }`}
                    >
                      {w.type === 'critical' ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      ) : w.type === 'advisory' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-extrabold text-[11px] mb-0.5">{w.title}</div>
                        <div className="text-[11px] leading-relaxed opacity-90">{w.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={tingkatKesulitan}
                    onChange={(e) => setTingkatKesulitan(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold bg-white"
                  >
                    <option value="mudah">Mudah (Pemahaman Awal)</option>
                    <option value="sedang">Sedang (Standar Kurikulum)</option>
                    <option value="sulit">Tantangan (Penalaran / HOTS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jumlah Soal
                  </label>
                  <select
                    value={jumlahSoal}
                    onChange={(e) => setJumlahSoal(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold bg-white"
                  >
                    <option value={3}>3 Soal (Kuis Ringkas)</option>
                    <option value={5}>5 Soal (Standar Efektif)</option>
                    <option value={10}>10 Soal (Latihan Lengkap)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipe Soal
                  </label>
                  <select
                    value={tipeSoal}
                    onChange={(e) => setTipeSoal(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold bg-white"
                  >
                    <option value="pilihan_ganda">
                      Pilihan Ganda ({tingkatKelas <= 2 ? '3 Opsi: A, B, C' : '4 Opsi: A, B, C, D'})
                    </option>
                    <option value="isian">Isian Singkat</option>
                    <option value="esai">Esai / Uraian</option>
                    <option value="campuran">Campuran (Pilihan + Isian)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Guru Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={instruksiTambahan}
                  onChange={(e) => setInstruksiTambahan(e.target.value)}
                  placeholder="Misal: Gunakan analogi buah apel, atau sertakan contoh kegiatan di rumah..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>

              {/* Kurikulum Merdeka AI Rule Hint Banner */}
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  tingkatKelas <= 2
                    ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                    : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="font-black flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    Kaidah Kurikulum Merdeka untuk {getFaseFromKelas(tingkatKelas)} (Kelas {tingkatKelas} SD):
                  </span>
                </div>
                {tingkatKelas <= 2 ? (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                    <li>
                      <strong>Kalimat Super Pendek (4-8 kata):</strong> Menyesuaikan fase awal kemampuan literasi membaca anak usia 6-8 tahun.
                    </li>
                    <li>
                      <strong>Objek Nyata Konkret:</strong> Buah (apel, jeruk), hewan jinak (kucing, kelinci), benda sekolah (buku, pensil).
                    </li>
                    <li>
                      <strong>Pilihan Ganda 3 Opsi (A, B, C):</strong> Mencegah kebingungan memilih dari terlalu banyak opsi.
                    </li>
                  </ul>
                ) : tingkatKelas <= 4 ? (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                    <li>
                      <strong>Konteks 1-2 Kalimat:</strong> Mengenalkan pemahaman bacaan dan keterkaitan sains IPAS dalam kehidupan sehari-hari.
                    </li>
                    <li>
                      <strong>Pilihan Ganda 4 Opsi (A, B, C, D):</strong> Melatih kemampuan membedakan konsep dan logika pilihan.
                    </li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                    <li>
                      <strong>Penalaran Kritis & HOTS Ringan:</strong> Menganalisis sebab-akibat, rantai makanan, dan pemecahan masalah numerasi kontekstual.
                    </li>
                    <li>
                      <strong>Pilihan Ganda 4 Opsi (A, B, C, D) & Esai Analitis:</strong> Menyiapkan kompetensi asesmen standar nasional.
                    </li>
                  </ul>
                )}
              </div>
            </div>
          ) : (
            /* DRAFT PREVIEW & INTERACTIVE EDITING */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Draft Kuis Siap Ditinjau ({draftResult.soal.length} Soal)
                  </span>
                  {generatedSource === 'gemini' ? (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Gemini 3.8 Flash Engine
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Kurikulum Merdeka Engine
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                    {currentMapel?.nama} • Kelas {tingkatKelas}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    Generate Ulang
                  </button>
                </div>
              </div>

              {/* Title & instructions edit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Judul Tugas Kuis</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Batas Waktu (Hari)</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={editedDeadlineDays}
                    onChange={(e) => setEditedDeadlineDays(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Petunjuk untuk Siswa</label>
                <input
                  type="text"
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Score Weight Banner */}
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  totalScoreWeight === 100
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>
                    Total Bobot Skor: <strong>{totalScoreWeight} / 100</strong>
                    {totalScoreWeight !== 100 && ' (Disarankan total tepat 100 poin)'}
                  </span>
                </div>
                {totalScoreWeight !== 100 && (
                  <button
                    onClick={handleBalanceWeights}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition"
                  >
                    Seimbangkan ke 100
                  </button>
                )}
              </div>

              {/* Soal List preview & edit */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Daftar Butir Soal ({draftResult.soal.length} Soal)</span>
                  </h4>
                  <button
                    onClick={handleAddQuestion}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Butir Soal</span>
                  </button>
                </div>

                {draftResult.soal.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg">
                          No. {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 uppercase">
                          {q.tipe === 'pilihan_ganda' ? 'Pilihan Ganda' : q.tipe === 'isian' ? 'Isian Singkat' : 'Esai'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Bobot:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={q.skor_bobot}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            const updated = [...draftResult.soal];
                            updated[idx].skor_bobot = val;
                            setDraftResult({ ...draftResult, soal: updated });
                          }}
                          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                        />
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                          title="Hapus butir soal ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Kalimat Pertanyaan:
                      </label>
                      <textarea
                        rows={2}
                        value={q.pertanyaan}
                        onChange={(e) => updateQuestionText(idx, e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Multiple Choice Options (if applicable) */}
                    {q.tipe === 'pilihan_ganda' && q.pilihan && q.pilihan.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500">
                          Opsi Pilihan (Klik untuk menjadikannya Kunci Jawaban):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.pilihan.map((p, pIdx) => {
                            const isCorrect =
                              q.kunci_jawaban &&
                              (p.startsWith(q.kunci_jawaban.charAt(0)) || p === q.kunci_jawaban);
                            return (
                              <div
                                key={pIdx}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <input
                                  type="text"
                                  value={p}
                                  onChange={(e) => updateOptionText(idx, pIdx, e.target.value)}
                                  className="w-full bg-transparent border-none text-xs focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuestionAnswerKey(idx, p)}
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md transition shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                  title="Jadikan Kunci Jawaban"
                                >
                                  {isCorrect ? '✓ KUNCI' : 'PILIH'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Answer Key & Explanation */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                          Kunci Jawaban:
                        </label>
                        <input
                          type="text"
                          value={q.kunci_jawaban}
                          onChange={(e) => updateQuestionAnswerKey(idx, e.target.value)}
                          placeholder="Masukkan kunci jawaban pasti..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-emerald-900 bg-emerald-50/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Pembahasan & Umpan Balik Positif:
                        </label>
                        <input
                          type="text"
                          value={q.pembahasan}
                          onChange={(e) => updateQuestionExplanation(idx, e.target.value)}
                          placeholder="Penjelasan ringkas menyemangati siswa..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Merumuskan Soal Kurikulum Merdeka...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Soal dengan AI</span>
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
                onClick={handleSaveAndPublish}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Publikasikan ke Kelas</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
