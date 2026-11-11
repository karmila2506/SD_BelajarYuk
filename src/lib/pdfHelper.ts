import * as pdfjsLibRaw from 'pdfjs-dist';

// Resolves module differences between bundlers / SSR
export const pdfjsLib: any = (pdfjsLibRaw as any).default || pdfjsLibRaw;

// Set up worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use locally hosted worker inside /public/pdf.worker.min.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

/**
 * Converts a data URI or base64 string to ArrayBuffer for PDF.js or Mammoth
 */
export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  try {
    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index !== -1) {
      const base64 = dataUrl.slice(base64Index + 8);
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }

    const commaIndex = dataUrl.indexOf(',');
    const raw = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
    const decoded = decodeURIComponent(raw);
    const encoder = new TextEncoder();
    return encoder.encode(decoded).buffer;
  } catch (err) {
    console.error('Gagal mengonversi data URI ke ArrayBuffer:', err);
    throw new Error('Format berkas tidak valid.');
  }
}

/**
 * Checks if a data URI or URL represents a genuine PDF document.
 * Checks MIME type, base64 header (%PDF- is 'JVBERi' in base64), or file extension.
 */
export function isRealPdf(urlOrData?: string, fileName?: string): boolean {
  if (!urlOrData) return false;

  // 1. Check data URI prefix
  if (urlOrData.startsWith('data:application/pdf')) return true;

  // 2. Check base64 magic bytes for %PDF- ('JVBERi')
  if (urlOrData.startsWith('data:') && urlOrData.includes(';base64,')) {
    const b64 = urlOrData.split(';base64,')[1] || '';
    if (b64.startsWith('JVBERi')) return true;
  }

  // 3. Raw PDF header string
  if (urlOrData.startsWith('%PDF-')) return true;

  // 4. Blob or HTTP URL with .pdf
  if (
    (urlOrData.startsWith('http://') ||
      urlOrData.startsWith('https://') ||
      urlOrData.startsWith('blob:') ||
      urlOrData.startsWith('/')) &&
    (fileName?.toLowerCase().endsWith('.pdf') || urlOrData.toLowerCase().includes('.pdf'))
  ) {
    return true;
  }

  // 5. File name has .pdf AND data is base64 (might have been saved with generic MIME like application/octet-stream)
  if (
    fileName?.toLowerCase().endsWith('.pdf') &&
    urlOrData.startsWith('data:') &&
    urlOrData.includes(';base64,')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if file is a Word (.docx) document
 */
export function isDocxFile(urlOrData?: string, fileName?: string): boolean {
  if (!urlOrData && !fileName) return false;
  const name = fileName?.toLowerCase() || '';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return true;
  if (urlOrData && urlOrData.includes('wordprocessingml.document')) return true;
  return false;
}
