import React, { useState } from 'react';
import {
  Star,
  Check,
  X,
  Award,
  MessageSquare,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Maximize2,
  HelpCircle,
  Sparkles,
  Eye,
  Bot,
} from 'lucide-react';
import { Pengumpulan, Tugas } from '../../types';
import { localDB } from '../../lib/supabase';
import { getBintangFromNilai, getDeskripsiNilai } from '../../lib/kurikulum';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';

interface SubmissionGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengumpulan: Pengumpulan;
  onGraded: () => void;
}

export const SubmissionGradingModal: React.FC<SubmissionGradingModalProps> = ({
  isOpen,
  onClose,
  pengumpulan,
  onGraded,
}) => {
  const [nilai, setNilai] = useState<number>(pengumpulan.nilai ?? 90);
  const [feedback, setFeedback] = useState<string>(
    pengumpulan.feedback || 'Hebat sekali! Pemahamanmu sudah sangat baik dan terus tingkatkan prestasimu!'
  );
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [isPreviewDocOpen, setIsPreviewDocOpen] = useState(false);

  if (!isOpen) return null;

  // Find corresponding task to display question contexts
  const allTugas = localDB.getTugas();
  const relatedTask: Tugas | undefined = allTugas.find((t) => t.id === pengumpulan.tugas_id);

  const deskripsi = getDeskripsiNilai(nilai);
  const bintang = getBintangFromNilai(nilai);

  const handleScoreChange = (newVal: number) => {
    const val = Math.max(0, Math.min(100, newVal));
    setNilai(val);
    const desc = getDeskripsiNilai(val);
    setFeedback(desc.penjelasan);
  };

  const handleSave = () => {
    const all = localDB.getPengumpulan();
    const updated = all.map((p) => {
      if (p.id === pengumpulan.id) {
        return {
          ...p,
          nilai,
          kategori_nilai: deskripsi.kategori,
          bintang,
          feedback: feedback.trim(),
          status: 'sudah_dinilai' as const,
          graded_at: new Date().toISOString(),
        };
      }
      return p;
    });

    localDB.savePengumpulan(updated);

    // Update student total stars
    if (bintang > (pengumpulan.bintang || 0)) {
      const allProfiles = localDB.getProfiles();
      const diff = bintang - (pengumpulan.bintang || 0);
      const updatedProfiles = allProfiles.map((prof) => {
        if (prof.id === pengumpulan.siswa_id) {
          return {
            ...prof,
            total_bintang: (prof.total_bintang || 0) + diff,
          };
        }
        return prof;
      });
      localDB.saveProfiles(updatedProfiles);
    }

    // Notify student real-time
    const allNotifs = localDB.getNotifikasi();
    allNotifs.unshift({
      id: `notif-${Date.now()}-${pengumpulan.siswa_id}`,
      user_id: pengumpulan.siswa_id,
      judul: `Nilai Tugas Diberikan Guru: ${pengumpulan.tugas_judul || 'Tugas'} ⭐`,
      pesan: `Ibu/Bapak Guru telah menilai tugasmu dengan skor ${nilai} (${deskripsi.kategori}). "${feedback.trim()}"`,
      link: '/tugas',
      tipe: 'nilai_keluar',
      dibaca: false,
      created_at: new Date().toISOString(),
    });
    localDB.saveNotifikasi(allNotifs);

    onGraded();
    onClose();
  };

  const isImageFile =
    pengumpulan.file_url &&
    (pengumpulan.file_url.startsWith('data:image') ||
      pengumpulan.file_url.endsWith('.jpg') ||
      pengumpulan.file_url.endsWith('.png') ||
      pengumpulan.file_url.endsWith('.jpeg'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Penilaian & Umpan Balik Guru
            </span>
            <h3 className="font-extrabold text-base sm:text-xl">{pengumpulan.siswa_nama}</h3>
            <p className="text-xs text-emerald-100">
              NIS: {pengumpulan.siswa_nis} {pengumpulan.tingkat_kelas ? `• Kelas ${pengumpulan.tingkat_kelas}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Judul Tugas:</span>
              <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">{pengumpulan.tugas_judul}</h4>
            </div>
            {pengumpulan.submitted_at && (
              <span className="text-[11px] text-slate-500 font-medium">
                Dikumpulkan: {new Date(pengumpulan.submitted_at).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* Auto Graded Notification Banner */}
          {pengumpulan.is_auto_graded && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 text-indigo-900 text-xs">
              <Bot className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-extrabold flex items-center gap-1.5">
                  Dinilai Otomatis oleh Sistem & AI Gemini
                  <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">Auto</span>
                </span>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Pilihan ganda dan soal uraian dievaluasi seketika. Bapak/Ibu guru tetap memiliki kendali penuh untuk menyesuaikan nilai atau catatan di bawah.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SISWA SUBMISSION DETAILS (JAWABAN & LAMPIRAN FOTO/BERKAS) */}
          {/* ============================================================== */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Lembar Jawaban & Evaluasi Siswa</span>
              </span>
              {pengumpulan.detail_evaluasi && pengumpulan.detail_evaluasi.length > 0 && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {pengumpulan.detail_evaluasi.length} Butir Soal Terperinci
                </span>
              )}
            </h5>

            {/* If Detailed Evaluation is present from Auto-grade */}
            {pengumpulan.detail_evaluasi && pengumpulan.detail_evaluasi.length > 0 ? (
              <div className="space-y-2.5">
                {pengumpulan.detail_evaluasi.map((item, idx) => {
                  const soalObj = relatedTask?.soal_list?.find((s) => s.id === item.soal_id || s.nomor === item.nomor);
                  return (
                    <div
                      key={item.soal_id || idx}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">
                          Soal No. {item.nomor} ({item.tipe.replace('_', ' ')})
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Skor: {item.skor_diperoleh}/{item.skor_maksimal}
                          </span>
                          {item.benar ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                              Tepat ✓
                            </span>
                          ) : (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                              Perlu Bimbingan
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-slate-700">{soalObj?.pertanyaan || `Soal butir ke-${item.nomor}`}</p>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1 text-[11px]">
                        <p>
                          <strong className="text-slate-500">Jawaban Siswa:</strong>{' '}
                          <span className="font-bold text-blue-800">{item.jawaban_siswa}</span>
                        </p>
                        <p>
                          <strong className="text-emerald-700">Kunci Jawaban:</strong>{' '}
                          <span className="font-bold text-emerald-900">{item.kunci_jawaban}</span>
                        </p>
                        {item.catatan_evaluasi && (
                          <p className="text-indigo-800 bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100 font-medium">
                            <strong>💡 Evaluasi AI:</strong> {item.catatan_evaluasi}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : pengumpulan.jawaban_teks && Object.keys(pengumpulan.jawaban_teks).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(pengumpulan.jawaban_teks).map(([soalId, ans], idx) => {
                  const soalObj = relatedTask?.soal_list?.find((s) => s.id === soalId);
                  const isCorrect =
                    soalObj &&
                    (ans.toLowerCase().includes(soalObj.kunci_jawaban.toLowerCase().slice(0, 2)) ||
                      ans.toLowerCase() === soalObj.kunci_jawaban.toLowerCase());

                  return (
                    <div
                      key={soalId}
                      className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-500 font-semibold">
                        <span>Soal No. {soalObj?.nomor || idx + 1}</span>
                        {isCorrect ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Jawaban Tepat ✓
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                            Kunci: {soalObj?.kunci_jawaban || '-'}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-slate-700">{soalObj?.pertanyaan}</p>
                      <p className="font-bold text-slate-900 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        Jawaban Siswa: <span className="text-blue-700">{ans}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Siswa mengumpulkan berkas/lembar tugas tanpa kuis pilihan ganda.
              </p>
            )}

            {/* If Student Attached Homework Photo / Document */}
            {pengumpulan.file_url && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">
                  📎 Lampiran Foto / Berkas Dokumen dari Siswa:
                </span>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isImageFile ? (
                      <ImageIcon className="w-6 h-6 text-indigo-600 shrink-0" />
                    ) : (
                      <FileText className="w-6 h-6 text-rose-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {pengumpulan.file_nama || 'Dokumen_Tugas_Siswa'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {isImageFile ? 'Foto Lembar Tugas' : 'Dokumen PDF / Berkas Tugas'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewDocOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka & Baca Dokumen</span>
                    </button>
                    <a
                      href={pengumpulan.file_url}
                      download={pengumpulan.file_nama || 'Berkas_Tugas.pdf'}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Student Note */}
            {pengumpulan.catatan_siswa && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Catatan Siswa:</strong> "{pengumpulan.catatan_siswa}"
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* GRADING INPUTS */}
          {/* ============================================================== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Skor Nilai Siswa (0 - 100)</label>
              <span className="text-2xl font-black text-blue-600">{nilai}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={nilai}
              onChange={(e) => handleScoreChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Quick Preset Score Buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              {[
                { val: 100, label: '100 (Sempurna)' },
                { val: 85, label: '85 (Baik)' },
                { val: 75, label: '75 (Cukup)' },
                { val: 65, label: '65 (Bimbingan)' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleScoreChange(item.val)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    nilai === item.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kurikulum Merdeka descriptive label & stars */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                Predikat Capaian Pembelajaran:
              </span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white text-blue-700 shadow-xs">
                {deskripsi.kategori}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Apresiasi Bintang Siswa:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= bintang ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Feedback textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan & Masukan Positif Guru (Feedback Ramah Anak)
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Berikan kata-kata motivasi dan apresiasi membangun..."
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-white"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Simpan & Kirim Nilai ke Siswa</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Student Photo */}
      {isPhotoLightboxOpen && pengumpulan.file_url && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="max-w-4xl w-full flex items-center justify-between text-white mb-3">
            <p className="text-sm font-bold">Foto Tugas: {pengumpulan.siswa_nama}</p>
            <button
              onClick={() => setIsPhotoLightboxOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img
            src={pengumpulan.file_url}
            alt="Foto Tugas Siswa"
            className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Document In-App Preview Modal */}
      {isPreviewDocOpen && pengumpulan.file_url && (
        <DocumentPreviewModal
          isOpen={isPreviewDocOpen}
          onClose={() => setIsPreviewDocOpen(false)}
          documentTitle={`Berkas Tugas Siswa: ${pengumpulan.siswa_nama}`}
          documentUrl={pengumpulan.file_url}
          documentName={pengumpulan.file_nama || 'Lembar_Tugas_Siswa'}
          documentTextContent={pengumpulan.catatan_siswa}
        />
      )}
    </div>
  );
};
