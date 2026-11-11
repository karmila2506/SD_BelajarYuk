import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  CheckCircle,
  Video,
  FileText,
  Star,
  X,
  Sparkles,
  Compass,
  Download,
  Image as ImageIcon,
  Maximize2,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { MateriPembelajaran } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';

interface MaterialViewerProps {
  isOpen: boolean;
  onClose: () => void;
  materi: MateriPembelajaran;
  onCompleted: () => void;
}

export const MaterialViewer: React.FC<MaterialViewerProps> = ({
  isOpen,
  onClose,
  materi,
  onCompleted,
}) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(materi.selesai_oleh_siswa || false);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);
  const [isDocReaderOpen, setIsDocReaderOpen] = useState(false);

  if (!isOpen || !user) return null;

  const handleMarkComplete = () => {
    if (isCompleted) return;

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });

    setIsCompleted(true);

    // Save completed progress
    const allMateri = localDB.getMateri();
    const updated = allMateri.map((m) => {
      if (m.id === materi.id) {
        return { ...m, selesai_oleh_siswa: true };
      }
      return m;
    });
    localDB.saveMateri(updated);

    // Give 2 stars for completing a lesson!
    const allProfiles = localDB.getProfiles();
    const updatedProfiles = allProfiles.map((p) => {
      if (p.id === user.id) {
        return {
          ...p,
          total_bintang: (p.total_bintang || 0) + 2,
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
      judul: 'Hebat! Materi Selesai Dipelajari ⭐⭐',
      pesan: `Kamu telah menyelesaikan materi "${materi.judul}" dan mendapatkan 2 Bintang belajar!`,
      tipe: 'materi_baru',
      dibaca: false,
      created_at: new Date().toISOString(),
    });
    localDB.saveNotifikasi(allNotifs);

    onCompleted();
  };

  const isLowerGrade = (user.tingkat_kelas || 1) <= 3;

  // Handle document download
  const handleDownloadDoc = () => {
    if (!materi.file_url) return;
    const link = document.createElement('a');
    link.href = materi.file_url;
    link.download = materi.file_nama || `Dokumen_${materi.judul.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle image download
  const handleDownloadImage = () => {
    if (!materi.gambar_url) return;
    const link = document.createElement('a');
    link.href = materi.gambar_url;
    link.download = `Ilustrasi_${materi.judul.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {materi.mapel_nama || 'Mata Pelajaran'}
              </span>
              <span className="text-xs font-semibold text-emerald-100">
                Topik: {materi.topik}
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-xl truncate mt-1">{materi.judul}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* CP & TP Kurikulum Merdeka Card */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4 text-emerald-600" />
              Tujuan Pembelajaran (Kurikulum Merdeka)
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700">
              <p>
                <strong className="text-emerald-900">Capaian (CP):</strong> {materi.capaian_pembelajaran}
              </p>
              <p>
                <strong className="text-emerald-900">Tujuan (TP):</strong> {materi.tujuan_pembelajaran}
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 1. GAMBAR & INFOGRAFIS DISPLAY */}
          {/* ============================================================== */}
          {materi.gambar_url && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
              <div className="relative group overflow-hidden bg-slate-900 max-h-80 flex items-center justify-center">
                <img
                  src={materi.gambar_url}
                  alt={materi.judul}
                  className="w-full h-auto max-h-80 object-contain mx-auto"
                />
                {/* Overlay actions */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setIsImageLightboxOpen(true)}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs shadow-md"
                    title="Perbesar gambar"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs shadow-md"
                    title="Unduh gambar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {materi.gambar_caption && (
                <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-600">
                  <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium italic">{materi.gambar_caption}</span>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. DOKUMEN / LKPD DISPLAY & PREVIEW / DOWNLOAD */}
          {/* ============================================================== */}
          {materi.file_url && (
            <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full mb-1">
                    <FileCheck className="w-3 h-3" />
                    <span>Modul / Lembar Kerja Peserta Didik (LKPD)</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                    {materi.file_nama || 'Lembar_Kerja_Peserta_Didik.pdf'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ukuran: {materi.file_ukuran || '250 KB'} • Langsung bisa dibaca di HP & komputer
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsDocReaderOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Buka & Baca Dokumen 📄</span>
                </button>

                <button
                  onClick={handleDownloadDoc}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                  title="Unduh berkas jika ingin disimpan"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. VIDEO PEMBELAJARAN */}
          {/* ============================================================== */}
          {(materi.tipe_konten === 'video' || materi.video_url) && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 p-2 sm:p-4 text-center text-white">
              <div className="aspect-video bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-4">
                <Video className="w-12 h-12 text-blue-400 mb-2 animate-pulse" />
                <h4 className="font-bold text-sm text-slate-200">Video Pembelajaran Interaktif</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Materi video interaktif untuk menemani belajar anak SD
                </p>
                {materi.video_url && (
                  <a
                    href={materi.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tonton Video di Tab Baru</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. PENJELASAN TEKS / CERITA MATERI */}
          {/* ============================================================== */}
          <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200/80">
            <h4 className="font-extrabold text-slate-800 text-base mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Penjelasan Materi Pembelajaran
            </h4>
            <p
              className={`text-slate-700 leading-relaxed whitespace-pre-line ${
                isLowerGrade ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}
            >
              {materi.deskripsi}
            </p>
          </div>

          {/* Teacher guidance info */}
          <div className="text-xs text-slate-500 italic">
            Diajarkan oleh: <span className="font-bold text-slate-700">{materi.guru_nama || 'Bapak/Ibu Guru'}</span>
          </div>
        </div>

        {/* Footer with Complete Button */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Selesaikan materi untuk mendapatkan 2 Bintang!</span>
          </div>

          <button
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className={`px-6 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-md ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Sudah Selesai Dipelajari ✓' : 'Tandai Selesai Belajar'}</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* IMAGE LIGHTBOX MODAL */}
      {/* ==================================================================== */}
      {isImageLightboxOpen && materi.gambar_url && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="max-w-4xl w-full flex items-center justify-between text-white mb-3">
            <p className="text-sm font-bold truncate">{materi.gambar_caption || materi.judul}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadImage}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Unduh</span>
              </button>
              <button
                onClick={() => setIsImageLightboxOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <img
            src={materi.gambar_url}
            alt={materi.judul}
            className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* DOCUMENT / LKPD READER MODAL (IN-APP PREVIEW WITHOUT FORCING DOWNLOAD) */}
      {/* ==================================================================== */}
      {isDocReaderOpen && (
        <DocumentPreviewModal
          isOpen={isDocReaderOpen}
          onClose={() => setIsDocReaderOpen(false)}
          documentTitle={materi.judul}
          documentUrl={materi.file_url}
          documentName={materi.file_nama}
          documentSize={materi.file_ukuran}
          documentTextContent={materi.deskripsi}
          subjectName={materi.mapel_nama}
          className={materi.rombel_nama}
          teacherName={materi.guru_nama}
        />
      )}
    </div>
  );
};
