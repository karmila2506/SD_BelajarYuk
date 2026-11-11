import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import { dataUrlToArrayBuffer } from '../../lib/pdfHelper';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

interface DocxViewerProps {
  documentUrl: string;
  documentTitle: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ documentUrl, documentTitle }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function parseDocx() {
      try {
        const arrayBuffer = dataUrlToArrayBuffer(documentUrl);
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!isCancelled) {
          setHtmlContent(result.value);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error converting DOCX:', err);
        if (!isCancelled) {
          setError(err?.message || 'Gagal membaca format berkas dokumen Word.');
          setLoading(false);
        }
      }
    }

    parseDocx();

    return () => {
      isCancelled = true;
    };
  }, [documentUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px] text-slate-500 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-spin">
          <Loader2 className="w-8 h-8" />
        </div>
        <p className="font-extrabold text-sm text-slate-700">Membaca Dokumen Word...</p>
        <p className="text-xs text-slate-400">Menyusun materi agar anak dapat membaca langsung</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h4 className="font-bold text-slate-800 text-sm">Gagal Menampilkan Dokumen</h4>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-10 font-sans text-slate-800 space-y-6">
      <div className="border-b pb-4">
        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
          Dokumen Word (.docx)
        </span>
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-2">{documentTitle}</h2>
      </div>

      <div
        className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-3"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
