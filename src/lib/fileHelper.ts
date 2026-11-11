/**
 * Utility for image compression, file handling, and educational presets
 * Ensures images and documents uploaded by teachers and students
 * remain lightweight and responsive without overloading browser storage.
 */

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compresses an image file using HTML5 Canvas to keep local storage fast and lightweight.
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 900,
  maxHeight: number = 900,
  quality: number = 0.75
): Promise<{ dataUrl: string; size: string; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar tidak didukung.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            dataUrl: e.target?.result as string,
            size: formatFileSize(file.size),
            name: file.name,
          });
        }

        // Fill white background for transparent PNG converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          size: formatFileSize(approxBytes),
          name: file.name,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads document (PDF, DOCX, LKPD) as data URL.
 */
export async function readDocumentFile(
  file: File
): Promise<{ dataUrl: string; size: string; name: string; type: string }> {
  return new Promise((resolve, reject) => {
    // If file is very large (> 10MB in localStorage/browser memory), alert
    if (file.size > 10 * 1024 * 1024) {
      return reject(
        new Error('Ukuran berkas melebihi batas maksimal 10 MB untuk pratinjau browser.')
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    let detectedType = file.type;
    if (!detectedType) {
      if (ext === 'pdf') detectedType = 'application/pdf';
      else if (ext === 'docx') detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === 'doc') detectedType = 'application/msword';
      else if (ext === 'txt') detectedType = 'text/plain';
      else detectedType = 'application/octet-stream';
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca dokumen.'));
    reader.onload = (e) => {
      resolve({
        dataUrl: e.target?.result as string,
        size: formatFileSize(file.size),
        name: file.name,
        type: detectedType,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Educational presets for teachers to attach ready-to-use illustrations
 * according to Kurikulum Merdeka subjects.
 */
export interface EducationalPresetImage {
  id: string;
  judul: string;
  mapel: string;
  fase: string;
  url: string;
  caption: string;
}

export const EDUCATIONAL_IMAGE_PRESETS: EducationalPresetImage[] = [
  {
    id: 'img-preset-ekosistem',
    judul: 'Rantai Makanan & Jaring Ekosistem Sawah',
    mapel: 'IPAS (Sains)',
    fase: 'Fase C (Kelas 5-6)',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&auto=format&fit=crop&q=80',
    caption: 'Aliran energi dari produsen padi ke konsumen belalang, katak, ular, dan burung elang.',
  },
  {
    id: 'img-preset-tumbuhan',
    judul: 'Anatomi Tumbuhan (Akar, Batang, Daun & Bunga)',
    mapel: 'IPAS (Sains)',
    fase: 'Fase B (Kelas 3-4)',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&auto=format&fit=crop&q=80',
    caption: 'Fungsi klorofil pada daun untuk fotosintesis dan akar untuk menyerap unsur hara tanah.',
  },
  {
    id: 'img-preset-tatasurya',
    judul: 'Eksplorasi Tata Surya & 8 Planet Mengitari Matahari',
    mapel: 'IPAS (Sains)',
    fase: 'Fase C (Kelas 5-6)',
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=900&auto=format&fit=crop&q=80',
    caption: 'Susunan orbit planet tata surya: Merkurius hingga Neptunus mengelilingi matahari.',
  },
  {
    id: 'img-preset-buah',
    judul: 'Berhitung Angka 1-10 dengan Buah-buahan Segar',
    mapel: 'Matematika',
    fase: 'Fase A (Kelas 1-2)',
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=900&auto=format&fit=crop&q=80',
    caption: 'Mengenal bilangan cacah dan penjumlahan konkret menggunakan buah jeruk dan apel.',
  },
  {
    id: 'img-preset-wujudzat',
    judul: 'Eksperimen Perubahan Wujud Zat (Padat, Cair, Gas)',
    mapel: 'IPAS (Sains)',
    fase: 'Fase B (Kelas 3-4)',
    url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=900&auto=format&fit=crop&q=80',
    caption: 'Fenomena mencairnya es dan mengembunnya uap air dalam kehidupan sehari-hari.',
  },
  {
    id: 'img-preset-pancasila',
    judul: 'Gotong Royong & Karakter Pelajar Pancasila',
    mapel: 'Pendidikan Pancasila',
    fase: 'Semua Fase (Kelas 1-6)',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&auto=format&fit=crop&q=80',
    caption: 'Penerapan nilai sila Pancasila: saling membantu, bertoleransi, dan bermusyawarah.',
  },
];
