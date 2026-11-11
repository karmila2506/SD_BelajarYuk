import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Award,
  Star,
  ArrowRight,
  ArrowLeft,
  Send,
  X,
  Sparkles,
  Camera,
  Upload,
  Paperclip,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Tugas, SoalTugas, Pengumpulan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { getBintangFromNilai, getDeskripsiNilai } from '../../lib/kurikulum';
import { compressImageFile } from '../../lib/fileHelper';

interface TaskSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  tugas: Tugas;
  existingPengumpulan?: Pengumpulan;
  onSubmitted: () => void;
}

export const TaskSolverModal: React.FC<TaskSolverModalProps> = ({
  isOpen,
  onClose,
  tugas,
  existingPengumpulan,
  onSubmitted,
}) => {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    existingPengumpulan?.jawaban_teks || {}
  );
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string>(
    existingPengumpulan?.file_url || ''
  );
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string>(
    existingPengumpulan?.file_nama || ''
  );
  const [studentNote, setStudentNote] = useState<string>(
    existingPengumpulan?.catatan_siswa || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [showReview, setShowReview] = useState(false);

  const [result, setResult] = useState<{
    score: number;
    bintang: number;
    kategori: string;
    penjelasan: string;
    detail_evaluasi?: any[];
  } | null>(
    existingPengumpulan?.nilai !== null && existingPengumpulan?.nilai !== undefined
      ? {
          score: existingPengumpulan.nilai,
          bintang: existingPengumpulan.bintang || 3,
          kategori: existingPengumpulan.kategori_nilai || 'Sangat Mahir',
          penjelasan: existingPengumpulan.feedback || 'Hebat sekali!',
          detail_evaluasi: existingPengumpulan.detail_evaluasi || [],
        }
      : null
  );

  if (!isOpen || !user) return null;

  const soalList: SoalTugas[] = tugas.soal_list || [];
  const currentSoal = soalList[currentIdx];
  const isReadOnly = existingPengumpulan?.status === 'sudah_dinilai';
  const isLowerGrade = (user.tingkat_kelas || 1) <= 3;

  const handleSelectOption = (soalId: string, optionText: string) => {
    if (isReadOnly) return;
    setAnswers((prev) => ({
      ...prev,
      [soalId]: optionText,
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImageFile(file, 900, 900, 0.7);
      setUploadedPhotoUrl(res.dataUrl);
      setUploadedPhotoName(file.name);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto.');
    }
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;

    // Check if any question remains unanswered
    const unanswered = soalList.filter((s) => !answers[s.id]);
    if (unanswered.length > 0 && !uploadedPhotoUrl) {
      if (!confirm(`Masih ada ${unanswered.length} soal yang belum kamu jawab. Yakin ingin mengumpulkan dan melihat nilaimu sekarang?`)) {
        return;
      }
    }

    setIsSubmitting(true);

    let finalScore = 100;
    let bintang = 3;
    let kategori = 'Sangat Mahir';
    let feedback = 'Luar biasa! Kamu menyelesaikan tugas dengan sangat baik.';
    let detailEvaluasi: any[] = [];

    try {
      // Panggil auto-grading API (Gemini AI untuk soal uraian/esai & validasi otomatis)
      const res = await fetch('/api/auto-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soal_list: soalList,
          jawaban_siswa: answers,
          tingkat_kelas: user.tingkat_kelas || 1,
          mapel_nama: tugas.mapel_nama || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          finalScore = data.nilai_akhir;
          bintang = data.bintang;
          kategori = data.kategori_nilai;
          feedback = data.feedback;
          detailEvaluasi = data.detail_evaluasi || [];
        }
      }
    } catch (err) {
      console.warn('Auto-grade API fetch error, fallback to local grading engine:', err);
    }

    // Fallback if detailEvaluasi wasn't populated
    if (!detailEvaluasi || detailEvaluasi.length === 0) {
      let totalScore = 0;
      let maxWeight = 0;

      detailEvaluasi = soalList.map((s) => {
        maxWeight += s.skor_bobot;
        const studentAns = (answers[s.id] || '').trim();
        const correctAns = (s.kunci_jawaban || '').trim();
        let isCorrect = false;

        if (s.tipe === 'pilihan_ganda' || s.tipe === 'benar_salah') {
          const studentLetter = studentAns.match(/^[A-D]/i)?.[0]?.toUpperCase();
          const correctLetter = correctAns.match(/^[A-D]/i)?.[0]?.toUpperCase();
          isCorrect = Boolean(
            (studentLetter && correctLetter && studentLetter === correctLetter) ||
            (studentAns.length > 0 && studentAns.toLowerCase() === correctAns.toLowerCase()) ||
            (studentAns.toLowerCase().includes('benar') && correctAns.toLowerCase().includes('benar')) ||
            (studentAns.toLowerCase().includes('salah') && correctAns.toLowerCase().includes('salah'))
          );
        } else if (s.tipe === 'isian') {
          const cleanStudent = studentAns.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanCorrect = correctAns.toLowerCase().replace(/[^a-z0-9]/g, '');
          isCorrect = Boolean(
            cleanStudent.length > 0 &&
            (cleanStudent === cleanCorrect || cleanCorrect.includes(cleanStudent) || cleanStudent.includes(cleanCorrect))
          );
        } else {
          isCorrect = studentAns.length >= 4 || Boolean(uploadedPhotoUrl);
        }

        const skorPoin = isCorrect ? s.skor_bobot : (s.tipe === 'esai' ? Math.round(s.skor_bobot * 0.7) : 0);
        totalScore += skorPoin;

        return {
          soal_id: s.id,
          nomor: s.nomor,
          tipe: s.tipe,
          jawaban_siswa: studentAns || '(Tidak dijawab)',
          kunci_jawaban: correctAns,
          benar: isCorrect,
          skor_diperoleh: skorPoin,
          skor_maksimal: s.skor_bobot,
          catatan_evaluasi: isCorrect
            ? 'Hebat! Jawabanmu sudah tepat sesuai materi.'
            : (s.tipe === 'esai' ? 'Jawaban telah tersimpan dan diperiksa guru.' : `Kunci jawaban yang tepat: ${s.kunci_jawaban}`),
        };
      });

      finalScore = maxWeight > 0 ? Math.min(100, Math.round((totalScore / maxWeight) * 100)) : 100;
      bintang = getBintangFromNilai(finalScore);
      const deskripsi = getDeskripsiNilai(finalScore);
      kategori = deskripsi.kategori;
      feedback = deskripsi.penjelasan;
    }

    // Fire celebratory Confetti!
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    const newSub: Pengumpulan = {
      id: existingPengumpulan?.id || `sub-${Date.now()}`,
      tugas_id: tugas.id,
      tugas_judul: tugas.judul,
      siswa_id: user.id,
      siswa_nama: user.nama,
      siswa_nis: user.nis_nip,
      tingkat_kelas: user.tingkat_kelas,
      jawaban_teks: answers,
      file_url: uploadedPhotoUrl || undefined,
      file_nama: uploadedPhotoName || undefined,
      catatan_siswa: studentNote.trim() || undefined,
      nilai: finalScore,
      kategori_nilai: kategori,
      bintang: bintang,
      feedback: feedback,
      status: 'sudah_dinilai',
      is_auto_graded: true,
      detail_evaluasi: detailEvaluasi,
      submitted_at: new Date().toISOString(),
      graded_at: new Date().toISOString(),
    };

    const allSubs = localDB.getPengumpulan();
    const updatedSubs = allSubs.filter((s) => !(s.tugas_id === tugas.id && s.siswa_id === user.id));
    updatedSubs.push(newSub);
    localDB.savePengumpulan(updatedSubs);

    // Update student's stars in profile immediately
    const allProfiles = localDB.getProfiles();
    const updatedProfiles = allProfiles.map((p) => {
      if (p.id === user.id) {
        return {
          ...p,
          total_bintang: (p.total_bintang || 0) + bintang,
        };
      }
      return p;
    });
    localDB.saveProfiles(updatedProfiles);

    // Add notification
    const allNotifs = localDB.getNotifikasi();
    allNotifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: user.id,
      judul: `Hore! Nilaimu Langsung Keluar: ${finalScore} ⭐`,
      pesan: `Selamat! Kamu mendapatkan nilai ${finalScore} dan ${bintang} Bintang pada tugas ${tugas.judul}. ${feedback}`,
      tipe: 'nilai_keluar',
      dibaca: false,
      created_at: new Date().toISOString(),
    });
    localDB.saveNotifikasi(allNotifs);

    // Display result screen directly
    setResult({
      score: finalScore,
      bintang,
      kategori,
      penjelasan: feedback,
      detail_evaluasi: detailEvaluasi,
    });
    setIsSubmitting(false);
    onSubmitted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              {tugas.mapel_nama || 'Tugas Siswa'}
            </span>
            <h3 className="font-extrabold text-base sm:text-xl truncate mt-1">{tugas.judul}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {result ? (
            /* Celebration & Immediate Score Screen */
            <div className="text-center py-5 sm:py-7 space-y-5">
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-200 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 animate-bounce">
                <Award className="w-10 h-10 drop-shadow" />
              </div>
              <div>
                <h4 className="text-2xl sm:text-3xl font-black text-slate-800">Tugas Selesai! Hore! 🎉</h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Nilaimu langsung dihitung dan tersimpan di buku rapormu:
                </p>
              </div>

              {/* Stars display */}
              <div className="flex justify-center items-center gap-2.5 py-1">
                {[1, 2, 3].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-11 h-11 transition-all ${
                      starIdx <= result.bintang
                        ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-md'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Grand Immediate Score Display Card */}
              <div className="inline-block px-8 py-4 rounded-3xl bg-gradient-to-b from-blue-50 to-indigo-50/80 border-2 border-blue-200 shadow-sm">
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block mb-1">
                  Nilai Akhir Tugas
                </span>
                <div className="text-5xl font-black text-blue-700 tracking-tight">
                  {result.score}
                  <span className="text-lg text-blue-400 font-bold ml-1">/100</span>
                </div>
                <div className="text-xs font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full mt-2 inline-block">
                  {result.kategori}
                </div>
              </div>

              <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Catatan Pembelajaran:</span>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  "{result.penjelasan}"
                </p>
              </div>

              {/* If attached photo */}
              {uploadedPhotoUrl && (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 px-3 rounded-xl inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Foto tugas berhasil dikirimkan ke guru</span>
                </div>
              )}

              {/* Toggle Question Review Breakdown */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowReview(!showReview)}
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-200 transition"
                >
                  {showReview ? '▲ Tutup Pembahasan Soal' : '▼ Lihat Rincian Pembahasan Soal'}
                </button>

                {showReview && (
                  <div className="mt-4 text-left space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h5 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                        Pembahasan & Kunci Jawaban Tiap Soal:
                      </h5>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        ⚡ Dinilai Otomatis oleh Sistem & AI
                      </span>
                    </div>

                    {soalList.map((s, sIdx) => {
                      const studentAns = answers[s.id] || '(Belum dijawab)';
                      const evalDetail = result?.detail_evaluasi?.find((d: any) => d.soal_id === s.id || d.nomor === s.nomor);
                      const isCorrect = evalDetail ? evalDetail.benar : (
                        s.tipe === 'pilihan_ganda'
                          ? (studentAns.match(/^[A-D]/i)?.[0]?.toUpperCase() === s.kunci_jawaban.match(/^[A-D]/i)?.[0]?.toUpperCase() ||
                              studentAns.toLowerCase() === s.kunci_jawaban.toLowerCase())
                          : Boolean(studentAns)
                      );
                      const skorDiperoleh = evalDetail ? evalDetail.skor_diperoleh : (isCorrect ? s.skor_bobot : 0);

                      return (
                        <div key={sIdx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">
                              Soal No. {sIdx + 1} ({s.skor_bobot} Poin) • <span className="uppercase text-[10px] text-slate-500">{s.tipe.replace('_', ' ')}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                Skor: {skorDiperoleh}/{s.skor_bobot}
                              </span>
                              {isCorrect ? (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                  ✓ Benar
                                </span>
                              ) : s.tipe === 'pilihan_ganda' || s.tipe === 'benar_salah' ? (
                                <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                  Belum Tepat
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                  Sebagian Tepat
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold text-slate-700">{s.pertanyaan}</p>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1 text-[11px]">
                            <p>
                              <strong className="text-slate-500">Jawabanmu:</strong>{' '}
                              <span className="font-bold text-slate-800">{studentAns}</span>
                            </p>
                            <p>
                              <strong className="text-emerald-700">Kunci Jawaban:</strong>{' '}
                              <span className="font-bold text-emerald-900">{s.kunci_jawaban}</span>
                            </p>
                            {evalDetail?.catatan_evaluasi && (
                              <p className="text-indigo-700 bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100 mt-1 font-medium">
                                <strong>💡 Catatan Evaluasi AI:</strong> {evalDetail.catatan_evaluasi}
                              </p>
                            )}
                            {s.pembahasan && (
                              <p className="text-slate-500 italic pt-0.5">
                                <strong>Penjelasan Materi:</strong> {s.pembahasan}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition shadow-lg shadow-blue-500/25"
                >
                  Kembali ke Dashboard Belajar
                </button>
              </div>
            </div>
          ) : (
            /* Active Question Screen */
            <div>
              {/* Question Index Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500">
                  Pertanyaan {currentIdx + 1} dari {soalList.length}
                </span>
                <div className="flex gap-1.5">
                  {soalList.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                        i === currentIdx
                          ? 'bg-blue-600 text-white'
                          : answers[soalList[i].id]
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              {currentSoal ? (
                <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200/80 mb-5">
                  <div className="text-xs font-bold text-blue-600 mb-1">
                    Soal No. {currentSoal.nomor}
                  </div>
                  <h4
                    className={`font-extrabold text-slate-800 leading-relaxed ${
                      isLowerGrade ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                    }`}
                  >
                    {currentSoal.pertanyaan}
                  </h4>
                </div>
              ) : null}

              {/* Multiple Choice & True/False Options */}
              {currentSoal && (currentSoal.tipe === 'pilihan_ganda' || currentSoal.tipe === 'benar_salah') && (
                <div className="space-y-3">
                  {(currentSoal.pilihan || ['A. Benar', 'B. Salah']).map((option, optIdx) => {
                    const isSelected = answers[currentSoal.id] === option;
                    return (
                      <button
                        key={optIdx}
                        disabled={isReadOnly}
                        onClick={() => handleSelectOption(currentSoal.id, option)}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        } ${isLowerGrade ? 'text-base sm:text-lg font-bold' : 'text-sm font-semibold'}`}
                      >
                        <span className="text-slate-800">{option}</span>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer / Isian / Esai */}
              {currentSoal && currentSoal.tipe !== 'pilihan_ganda' && currentSoal.tipe !== 'benar_salah' && (
                <div>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={answers[currentSoal.id] || ''}
                    onChange={(e) => handleSelectOption(currentSoal.id, e.target.value)}
                    placeholder="Tulis jawabanmu di sini..."
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
                  />
                </div>
              )}

              {/* ============================================================== */}
              {/* ATTACH PHOTO / HOMEWORK SECTION (FOR STUDENTS) */}
              {/* ============================================================== */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Unggah Foto Buku Tulis / Lembar Tugas (Opsional)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Bisa foto tugas tulisan tangan
                  </span>
                </div>

                {uploadedPhotoUrl ? (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedPhotoUrl}
                        alt="Foto Tugas"
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 truncate">
                          {uploadedPhotoName || 'Foto_Tugas_Siswa.jpg'}
                        </p>
                        <p className="text-[10px] text-emerald-700">Foto siap dikirim ke guru</p>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedPhotoUrl('');
                          setUploadedPhotoName('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  !isReadOnly && (
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-3 text-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/20 flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">
                        Ambil / Pilih Foto Lembar Tugas
                      </span>
                    </div>
                  )
                )}

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {/* Optional Student Note */}
                {!isReadOnly && (
                  <div>
                    <input
                      type="text"
                      value={studentNote}
                      onChange={(e) => setStudentNote(e.target.value)}
                      placeholder="Pesan untuk Bapak/Ibu Guru (opsional)..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {!result && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIdx < soalList.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(soalList.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <span>Berikutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isReadOnly}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim...' : 'Kumpulkan Tugas 🚀'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
