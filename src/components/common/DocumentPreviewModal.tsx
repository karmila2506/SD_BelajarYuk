import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  FileCheck,
  BookOpen,
  Sparkles,
  Scroll,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { isRealPdf, isDocxFile } from '../../lib/pdfHelper';
import { PdfViewer } from './PdfViewer';
import { DocxViewer } from './DocxViewer';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentUrl?: string;
  documentName?: string;
  documentSize?: string;
  documentType?: 'pdf' | 'dokumen' | 'gambar' | 'lkpd' | 'text';
  documentTextContent?: string;
  subjectName?: string;
  className?: string;
  teacherName?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentUrl,
  documentName,
  documentSize,
  documentType = 'pdf',
  documentTextContent,
  subjectName,
  className,
  teacherName,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [pdfRotation, setPdfRotation] = useState<number>(0);
  const [pdfViewMode, setPdfViewMode] = useState<'continuous' | 'single'>('continuous');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasFinishedReading, setHasFinishedReading] = useState(false);

  if (!isOpen) return null;

  const fileName = documentName || `${documentTitle.replace(/\s+/g, '_')}.pdf`;

  // Detect genuine file types
  const isImage =
    documentType === 'gambar' ||
    Boolean(
      documentUrl &&
        (documentUrl.startsWith('data:image') ||
          /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(documentUrl) ||
          /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName))
    );

  const isPdf = !isImage && isRealPdf(documentUrl, fileName);
  const isDocx = !isImage && !isPdf && isDocxFile(documentUrl, fileName);

  const activeTextContent = useMemo(() => {
    if (documentTextContent) return documentTextContent;
    if (documentUrl && documentUrl.startsWith('data:text/')) {
      try {
        const commaIdx = documentUrl.indexOf(',');
        if (commaIdx !== -1) {
          const raw = documentUrl.slice(commaIdx + 1);
          return decodeURIComponent(raw.replace(/\+/g, ' '));
        }
      } catch (e) {
        // ignore
      }
    }
    return '';
  }, [documentTextContent, documentUrl]);

  const handleDownload = () => {
    if (!documentUrl && !documentTextContent) return;

    if (documentUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (documentTextContent) {
      const blob = new Blob([documentTextContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFinishedReading = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setHasFinishedReading(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full max-w-none rounded-none'
            : 'w-full max-w-5xl h-[94vh] max-h-[96vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="px-3.5 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between gap-2.5 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300">
              {isImage ? (
                <Maximize2 className="w-4 h-4" />
              ) : isPdf ? (
                <FileCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <FileText className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/20">
                  {isImage
                    ? 'Gambar'
                    : isPdf
                    ? 'Dokumen PDF'
                    : isDocx
                    ? 'Dokumen Word'
                    : 'Modul / LKPD'}
                </span>
                {subjectName && (
                  <span className="text-[10px] font-bold text-slate-300 hidden sm:inline">
                    • {subjectName}
                  </span>
                )}
                {className && (
                  <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                    ({className})
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm truncate text-white mt-0.5">
                {documentTitle}
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* View Mode Toggle for PDF (Continuous scroll vs Single page) */}
            {isPdf && (
              <div className="hidden md:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setPdfViewMode('continuous')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    pdfViewMode === 'continuous'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Tampilkan semua halaman (gulir ke bawah)"
                >
                  <Scroll className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Gulir Semua</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfViewMode('single')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                    pdfViewMode === 'single'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Tampilkan 1 halaman per layar (buku)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[11px]">1 Halaman</span>
                </button>
              </div>
            )}

            {/* Page Counter for PDF Single Mode */}
            {isPdf && pdfViewMode === 'single' && totalPages > 1 && (
              <div className="hidden lg:flex items-center bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-700 text-[11px] font-bold text-slate-300 font-mono">
                Hal {currentPage} / {totalPages}
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-slate-300">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 hover:text-white rounded-lg transition"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="text-[11px] font-mono px-1.5 sm:px-2 text-slate-300 min-w-[38px] sm:min-w-[42px] text-center hover:text-white"
                title="Kembalikan ukuran normal (100%)"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(220, z + 15))}
                className="p-1 hover:text-white rounded-lg transition"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotation for images & PDFs */}
            {(isImage || isPdf) && (
              <button
                type="button"
                onClick={() => {
                  if (isImage) setImageRotation((r) => (r + 90) % 360);
                  if (isPdf) setPdfRotation((r) => (r + 90) % 360);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Putar Dokumen 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Cetak Dokumen"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
              title="Unduh Berkas ke Perangkat"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Unduh Berkas</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
              title="Tutup Pratinjau"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Viewer Body (Scrollable, Zoomable, Crisp Canvas/HTML) */}
        <div className="flex-1 overflow-auto bg-slate-200/70 p-2 sm:p-6 flex items-start justify-center">
          {/* 1. PDF VIEWER (Direct in-app rendering via HTML5 Canvas using PDF.js - NO plugin crash / sad face) */}
          {isPdf && documentUrl ? (
            <PdfViewer
              documentUrl={documentUrl}
              zoomLevel={zoomLevel}
              rotation={pdfRotation}
              viewMode={pdfViewMode}
              currentPage={currentPage}
              onPageChange={(p) => setCurrentPage(p)}
              onTotalPagesLoaded={(tot) => setTotalPages(tot)}
            />
          ) : isDocx && documentUrl ? (
            /* 2. DOCX (WORD) VIEWER */
            <DocxViewer documentUrl={documentUrl} documentTitle={documentTitle} />
          ) : isImage && documentUrl ? (
            /* 3. IMAGE VIEWER */
            <div className="flex items-center justify-center min-h-full w-full p-2">
              <img
                src={documentUrl}
                alt={documentTitle}
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${imageRotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-xl bg-white border border-slate-200"
              />
            </div>
          ) : (
            /* 4. FORMATTED A4 EDUCATIONAL WORKSHEET / LKPD READER */
            <div
              style={{
                width: `${Math.min(100, Math.max(70, zoomLevel))}%`,
                maxWidth: '850px',
              }}
              className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-10 font-serif text-slate-800 transition-all duration-150 space-y-6"
            >
              {/* Official SD Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="font-sans font-black text-xs sm:text-sm tracking-wider uppercase text-blue-900">
                  KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
                </div>
                <div className="font-sans font-extrabold text-sm sm:text-base text-slate-800 uppercase">
                  MODUL & LEMBAR KERJA PESERTA DIDIK (LKPD) KURIKULUM MERDEKA
                </div>
                <div className="font-sans text-xs text-slate-500 font-semibold">
                  Tahun Ajaran 2024/2025 • {className || 'Kelas Sekolah Dasar (SD)'}
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">MATA PELAJARAN</span>
                  <span className="font-black text-slate-800">{subjectName || 'Kurikulum Merdeka'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">KELAS / ROMBEL</span>
                  <span className="font-black text-slate-800">{className || 'Kelas SD'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">GURU PENGAMPU</span>
                  <span className="font-black text-slate-800">{teacherName || 'Bapak/Ibu Guru'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">STATUS DOKUMEN</span>
                  <span className="font-black text-emerald-700">Dapat Dibaca Langsung</span>
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="text-center py-2">
                <h2 className="font-sans font-black text-lg sm:text-2xl text-slate-900 uppercase tracking-tight">
                  {documentTitle}
                </h2>
                <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full mt-2" />
              </div>

              {/* Document Text Body */}
              <div className="font-sans text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
                {activeTextContent ? (
                  activeTextContent
                ) : (
                  <>
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-bold text-blue-900 mb-1">A. Petunjuk Pengerjaan & Pembelajaran:</h4>
                      <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                        <li>Bacalah uraian materi pembelajaran yang diberikan guru dengan cermat.</li>
                        <li>Diskusikan bersama teman sekelompokmu bila menemui konsep menarik.</li>
                        <li>Catatlah hal-hal penting dan amati contoh konkret di sekelilingmu.</li>
                        <li>Selesaikan latihan dan kuis di aplikasi BelajarYuk untuk mengumpulkan bintang prestasimu!</li>
                      </ol>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        B. Pokok Bahasan & Ringkasan Materi:
                      </h4>
                      <p className="text-slate-700">
                        Pembelajaran ini mengajak siswa SD untuk aktif mengamati, bertanya, mencoba, dan menyimpulkan secara mandiri dengan bimbingan guru dan orang tua.
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <h4 className="font-bold text-emerald-900">C. Nilai Karakter Pelajar Pancasila:</h4>
                      <p className="text-emerald-800">
                        Mandiri, Bernalar Kritis, Bergotong Royong, dan Berakhlak Mulia dalam belajar bersama teman.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Signature / Validation Footer */}
              <div className="font-sans pt-8 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <p className="font-semibold">Mengetahui,</p>
                  <p className="font-bold text-slate-800 mt-8">Bapak/Ibu Guru Kelas</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Paraf Orang Tua / Wali:</p>
                  <div className="h-8" />
                  <p className="font-bold text-slate-800">( ............................................ )</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status & Secondary Actions */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="truncate">
              {fileName} {documentSize ? `(${documentSize})` : ''} • Dibuka langsung di aplikasi
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              title="Unduh salinan berkas jika dibutuhkan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan Salinan (Unduh)</span>
            </button>
            <button
              type="button"
              onClick={handleFinishedReading}
              className={`px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition shadow-md ${
                hasFinishedReading
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {hasFinishedReading ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hebat! Sudah Dibaca ⭐</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Selesai Membaca</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
