import React, { useEffect, useRef, useState, useCallback } from 'react';
import { pdfjsLib, dataUrlToArrayBuffer } from '../../lib/pdfHelper';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface PdfViewerProps {
  documentUrl: string;
  zoomLevel: number; // percentage, e.g. 100
  rotation: number; // degrees: 0, 90, 180, 270
  viewMode: 'continuous' | 'single';
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesLoaded: (total: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentUrl,
  zoomLevel,
  rotation,
  viewMode,
  currentPage,
  onPageChange,
  onTotalPagesLoaded,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // References to keep track of active render tasks to cancel them cleanly on re-render
  const renderTasksRef = useRef<Map<number, any>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Load PDF document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        let loadingTask: any;

        if (documentUrl.startsWith('data:')) {
          const buffer = dataUrlToArrayBuffer(documentUrl);
          loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          });
        } else {
          loadingTask = pdfjsLib.getDocument({
            url: documentUrl,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          });
        }

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          onTotalPagesLoaded(doc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (!isCancelled) {
          setError(
            err?.message ||
              'Gagal memuat dokumen PDF. Berkas mungkin rusak atau tidak didukung.'
          );
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [documentUrl]);

  // Render a specific page to a canvas
  const renderPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDoc) return;

      try {
        // Cancel previous render task for this page if running
        const existingTask = renderTasksRef.current.get(pageNumber);
        if (existingTask) {
          try {
            existingTask.cancel();
          } catch (e) {
            // ignore cancellation
          }
          renderTasksRef.current.delete(pageNumber);
        }

        const page = await pdfDoc.getPage(pageNumber);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (zoomLevel / 100) * dpr * 1.25; // 1.25 baseline for readability
        const viewport = page.getViewport({ scale, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        // Clear canvas with white background before rendering
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.set(pageNumber, renderTask);

        await renderTask.promise;
        renderTasksRef.current.delete(pageNumber);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, zoomLevel, rotation]
  );

  // Trigger page rendering when doc, zoom, rotation, or current page changes
  useEffect(() => {
    if (!pdfDoc) return;

    if (viewMode === 'single') {
      const canvas = canvasRefs.current.get(currentPage);
      if (canvas) {
        renderPage(currentPage, canvas);
      }
    } else {
      // Continuous mode: render all pages
      for (let p = 1; p <= totalPages; p++) {
        const canvas = canvasRefs.current.get(p);
        if (canvas) {
          renderPage(p, canvas);
        }
      }
    }

    return () => {
      // Cleanup all active renders
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch (e) {
          // ignore
        }
      });
      renderTasksRef.current.clear();
    };
  }, [pdfDoc, zoomLevel, rotation, viewMode, currentPage, totalPages, renderPage]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-slate-500 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-spin">
          <Loader2 className="w-8 h-8" />
        </div>
        <p className="font-extrabold text-sm text-slate-700">Membuka Dokumen PDF...</p>
        <p className="text-xs text-slate-400">Menyiapkan halaman agar dapat dibaca langsung oleh anak</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[350px] max-w-md mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Dokumen Belum Dapat Dibuka</h4>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. SINGLE PAGE MODE */}
      {viewMode === 'single' ? (
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Canvas Wrapper with paper shadow */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden max-w-full transition-all duration-150">
            <canvas
              ref={(el) => {
                if (el) canvasRefs.current.set(currentPage, el);
                else canvasRefs.current.delete(currentPage);
              }}
              className="block max-w-full h-auto mx-auto"
            />
          </div>

          {/* Sticky Quick Navigator for Single Page */}
          {totalPages > 1 && (
            <div className="sticky bottom-2 z-10 flex items-center gap-3 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-700 text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold font-mono">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 2. CONTINUOUS SCROLL MODE (ALL PAGES) */
        <div className="flex flex-col items-center space-y-6 w-full max-w-4xl">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              className="flex flex-col items-center w-full relative group"
            >
              {/* Page Number Tag */}
              <div className="self-center mb-1.5 px-3 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold shadow-xs">
                Halaman {pageNum} dari {totalPages}
              </div>

              {/* Page Paper Canvas */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden max-w-full transition-all duration-150">
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(pageNum, el);
                    else canvasRefs.current.delete(pageNum);
                  }}
                  className="block max-w-full h-auto mx-auto"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
