import { FaseKurikulum } from '../types';

export function getFaseFromKelas(tingkat: number): FaseKurikulum {
  if (tingkat <= 2) return 'Fase A';
  if (tingkat <= 4) return 'Fase B';
  return 'Fase C';
}

export function getFaseDescription(fase: FaseKurikulum): string {
  switch (fase) {
    case 'Fase A':
      return 'Fase A (Kelas 1-2 SD): Kalimat super pendek (4-8 kata), kosakata konkret (buah, hewan, keluarga), 3 opsi pilihan ganda (A, B, C). Tanpa IPAS terpisah.';
    case 'Fase B':
      return 'Fase B (Kelas 3-4 SD): Pemahaman bacaan kontekstual 1-2 kalimat, konsep sains dasar IPAS, 4 opsi pilihan ganda (A, B, C, D).';
    case 'Fase C':
      return 'Fase C (Kelas 5-6 SD): Penalaran analitis (HOTS ringan kontekstual), pemecahan masalah sains & numerasi, 4 opsi pilihan ganda (A, B, C, D).';
  }
}

export function getDeskripsiNilai(nilai: number): {
  kategori: string;
  penjelasan: string;
  warna: string;
} {
  if (nilai >= 90) {
    return {
      kategori: 'Sangat Mahir',
      penjelasan: 'Luar biasa! Kamu sudah sangat menguasai materi ini dengan hebat dan mandiri.',
      warna: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    };
  }
  if (nilai >= 75) {
    return {
      kategori: 'Sudah Berkembang',
      penjelasan: 'Bagus sekali! Kamu sudah memahami tujuan pembelajaran dengan baik.',
      warna: 'text-blue-600 bg-blue-50 border-blue-200',
    };
  }
  if (nilai >= 60) {
    return {
      kategori: 'Cukup Berkembang',
      penjelasan: 'Sudah baik! Ayo terus berlatih agar pemahamanmu semakin mantap.',
      warna: 'text-amber-600 bg-amber-50 border-amber-200',
    };
  }
  return {
    kategori: 'Perlu Bimbingan',
    penjelasan: 'Tetap semangat! Jangan ragu bertanya pada bapak/ibu guru untuk belajar bersama lagi.',
    warna: 'text-rose-600 bg-rose-50 border-rose-200',
  };
}

export function getBintangFromNilai(nilai: number): number {
  if (nilai >= 85) return 3;
  if (nilai >= 70) return 2;
  return 1;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface KurikulumMerdekaTopic {
  mapelKode: string; // MTK, BINDO, IPAS, PANCASILA, BING, SENI, PJOK
  mapelNama: string;
  fase: FaseKurikulum;
  tingkatKelas: number[];
  topik: string;
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
}

export const KURIKULUM_MERDEKA_SAMPLE_TOPICS: KurikulumMerdekaTopic[] = [
  // ==================== FASE A (KELAS 1 - 2) ====================
  // Matematika Fase A
  {
    mapelKode: 'MTK',
    mapelNama: 'Matematika',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Berhitung Buah & Benda 1 sampai 10',
    capaianPembelajaran: 'Peserta didik menunjukkan pemahaman dan intuisi bilangan (number sense) pada bilangan cacah sampai 10.',
    tujuanPembelajaran: 'Siswa mampu membilang dan menuliskan banyak benda 1-10 menggunakan gambar buah dan hewan jinak.',
  },
  {
    mapelKode: 'MTK',
    mapelNama: 'Matematika',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Penjumlahan & Pengurangan Konkret sampai 20',
    capaianPembelajaran: 'Peserta didik melakukan operasi penjumlahan dan pengurangan menggunakan benda konkret.',
    tujuanPembelajaran: 'Siswa mampu menghitung hasil tambah dan kurang menggunakan cerita gambar apel, jeruk, dan kelereng.',
  },
  {
    mapelKode: 'MTK',
    mapelNama: 'Matematika',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Mengenal Bangun Datar Sederhana (Segitiga, Segiempat, Lingkaran)',
    capaianPembelajaran: 'Peserta didik mengenal berbagai bangun datar dan bangun ruang menggunakan benda konkret.',
    tujuanPembelajaran: 'Siswa dapat mengidentifikasi benda berbentuk lingkaran (jam dinding), segitiga (atap), dan segiempat (buku).',
  },
  // Bahasa Indonesia Fase A
  {
    mapelKode: 'BINDO',
    mapelNama: 'Bahasa Indonesia',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Mengenal Huruf Vokal A-I-U-E-O dan Suku Kata',
    capaianPembelajaran: 'Peserta didik melafalkan bunyi huruf dan membaca suku kata sederhana secara fasih.',
    tujuanPembelajaran: 'Siswa dapat membaca dan melengkapi kata benda 2 suku kata seperti bo-la, bu-ku, me-ja, pi-to.',
  },
  {
    mapelKode: 'BINDO',
    mapelNama: 'Bahasa Indonesia',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Menyimak Cerita Pendek dan Kosakata Hewan Jinak',
    capaianPembelajaran: 'Peserta didik bersikap menjadi pendengar yang penuh perhatian dan menceritakan kembali ide pokok.',
    tujuanPembelajaran: 'Siswa mampu menjawab pertanyaan siapa, di mana, dan apa dari cerita dongeng hewan kelinci dan kura-kura.',
  },
  // Pendidikan Pancasila Fase A
  {
    mapelKode: 'PANCASILA',
    mapelNama: 'Pendidikan Pancasila',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Simbol 5 Sila Pancasila dan Gotong Royong di Rumah',
    capaianPembelajaran: 'Peserta didik mengenal lima simbol sila Pancasila dalam lambang negara Garuda Pancasila.',
    tujuanPembelajaran: 'Siswa dapat memasangkan lambang sila (bintang, rantai, pohon beringin, kepala banteng, padi kapas) dan contoh sikap rukun.',
  },
  {
    mapelKode: 'PANCASILA',
    mapelNama: 'Pendidikan Pancasila',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Aturan Menjaga Kebersihan di Rumah dan Sekolah',
    capaianPembelajaran: 'Peserta didik mengidentifikasi aturan yang berlaku di rumah dan di sekolah serta melaksanakannya.',
    tujuanPembelajaran: 'Siswa mampu menyebutkan contoh membuang sampah pada tempatnya, merapikan mainan, dan berpamitan.',
  },
  // Seni & PJOK Fase A
  {
    mapelKode: 'SENI',
    mapelNama: 'Seni Rupa',
    fase: 'Fase A',
    tingkatKelas: [1, 2],
    topik: 'Mengenal Warna Primer dan Garis Lengkung-Lurus',
    capaianPembelajaran: 'Peserta didik mampu mengidentifikasi unsur rupa berupa garis, bentuk, dan warna primer.',
    tujuanPembelajaran: 'Siswa dapat membedakan warna merah, kuning, dan biru serta membuat pola garis ceria.',
  },

  // ==================== FASE B (KELAS 3 - 4) ====================
  // IPAS Fase B
  {
    mapelKode: 'IPAS',
    mapelNama: 'IPAS (Sains & Sosial)',
    fase: 'Fase B',
    tingkatKelas: [3, 4],
    topik: 'Bagian Tubuh Tumbuhan dan Fungsinya',
    capaianPembelajaran: 'Peserta didik menganalisis hubungan antara bentuk serta fungsi bagian tubuh pada tumbuhan.',
    tujuanPembelajaran: 'Siswa dapat mengidentifikasi fungsi akar, batang, daun, bunga, dan buah serta fotosintesis dasar.',
  },
  {
    mapelKode: 'IPAS',
    mapelNama: 'IPAS (Sains & Sosial)',
    fase: 'Fase B',
    tingkatKelas: [3, 4],
    topik: 'Wujud Zat (Padat, Cair, Gas) dan Perubahannya',
    capaianPembelajaran: 'Mengidentifikasi wujud zat dan mendeskripsikan perubahannya dalam kehidupan sehari-hari.',
    tujuanPembelajaran: 'Siswa dapat membedakan peristiwa mencair, membeku, menguap, mengembun, dan menyublim lewat contoh nyata.',
  },
  {
    mapelKode: 'IPAS',
    mapelNama: 'IPAS (Sains & Sosial)',
    fase: 'Fase B',
    tingkatKelas: [3, 4],
    topik: 'Pengaruh Gaya Otot, Gaya Gesek, dan Gaya Gravitasi',
    capaianPembelajaran: 'Peserta didik mendemonstrasikan berbagai jenis gaya dan pengaruhnya terhadap arah gerak dan bentuk benda.',
    tujuanPembelajaran: 'Siswa mampu menjelaskan bagaimana rem sepeda bekerja dan mengapa benda jatuh ke bawah.',
  },
  // Matematika Fase B
  {
    mapelKode: 'MTK',
    mapelNama: 'Matematika',
    fase: 'Fase B',
    tingkatKelas: [3, 4],
    topik: 'Operasi Perkalian dan Pembagian Bilangan Cacah',
    capaianPembelajaran: 'Peserta didik memahami operasi perkalian dan pembagian bilangan cacah sampai 1000.',
    tujuanPembelajaran: 'Siswa mampu menyelesaikan soal cerita perkalian dan pembagian dalam kehidupan sehari-hari secara runtut.',
  },
  {
    mapelKode: 'MTK',
    mapelNama: 'Matematika',
    fase: 'Fase B',
    tingkatKelas: [3, 4],
    topik: 'Mengenal Pecahan Senilai dengan Model Gambar Konkret',
    capaianPembelajaran: 'Peserta didik membandingkan dan mengurutkan pecahan dengan pembilang satu dan pecahan berpenyebut sama.',
    tujuanPembelajaran: 'Siswa dapat menunjukkan 1/2 sama dengan 2/4 melalui pemotongan gambar pizza atau kue bolu.',
  },
  // Bahasa Indonesia Fase B
  {
    mapelKode: 'BINDO',
    mapelNama: 'Bahasa Indonesia',
    fase: 'Fase B',
    tingkatKelas: [3, 4],
    topik: 'Menemukan Ide Pokok Paragraf dan Kalimat Utama',
    capaianPembelajaran: 'Peserta didik memahami informasi dan menemukan ide pokok serta ide pendukung pada teks narasi dan eksposisi.',
    tujuanPembelajaran: 'Siswa mampu membaca teks 2 paragraf tentang lingkungan dan menentukan ide pokok tiap paragraf.',
  },
  // Pendidikan Pancasila Fase B
  {
    mapelKode: 'PANCASILA',
    mapelNama: 'Pendidikan Pancasila',
    fase: 'Fase B',
    tingkatKelas: [3, 4],
    topik: 'Menghargai Keberagaman Suku, Agama, dan Budaya di Lingkungan Sekitar',
    capaianPembelajaran: 'Peserta didik mengidentifikasi keragaman budaya, kearifan lokal, dan agama di lingkungan RT/RW.',
    tujuanPembelajaran: 'Siswa dapat memberikan contoh sikap toleransi dan kerja sama antar teman yang berbeda latar belakang suku.',
  },

  // ==================== FASE C (KELAS 5 - 6) ====================
  // IPAS Fase C
  {
    mapelKode: 'IPAS',
    mapelNama: 'IPAS (Sains & Sosial)',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Rantai Makanan & Jaring-Jaring Makanan Ekosistem Sawah',
    capaianPembelajaran: 'Menyelidiki hubungan saling ketergantungan antar komponen biotik dan abiotik dalam ekosistem.',
    tujuanPembelajaran: 'Siswa mampu menyusun rantai makanan dan menganalisis dampak perburuan ular sawah terhadap populasi tikus.',
  },
  {
    mapelKode: 'IPAS',
    mapelNama: 'IPAS (Sains & Sosial)',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Sistem Organ Pernapasan dan Pencernaan Manusia',
    capaianPembelajaran: 'Peserta didik mendeskripsikan struktur dan fungsi organ tubuh serta cara menjaga kesehatannya.',
    tujuanPembelajaran: 'Siswa mampu mengurutkan jalannya udara pernapasan dari hidung ke paru-paru dan pencegahan penyakit.',
  },
  {
    mapelKode: 'IPAS',
    mapelNama: 'IPAS (Sains & Sosial)',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Rangkaian Listrik Seri dan Paralel serta Hemat Energi',
    capaianPembelajaran: 'Mendeskripsikan sistem tata energi dan rangkaian listrik sederhana beserta pemanfaatannya.',
    tujuanPembelajaran: 'Siswa mampu membandingkan nyala lampu pada rangkaian seri dan paralel serta aksi hemat listrik rumah.',
  },
  {
    mapelKode: 'IPAS',
    mapelNama: 'IPAS (Sains & Sosial)',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Sistem Tata Surya dan Karakteristik 8 Planet',
    capaianPembelajaran: 'Peserta didik menjelaskan sistem tata surya dan karakteristik planet-planet anggota tata surya.',
    tujuanPembelajaran: 'Siswa dapat mengurutkan 8 planet dari matahari serta membedakan planet dalam dan planet luar.',
  },
  // Matematika Fase C
  {
    mapelKode: 'MTK',
    mapelNama: 'Matematika',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Operasi Penjumlahan & Pengurangan Pecahan Berpenyebut Beda',
    capaianPembelajaran: 'Peserta didik membandingkan, mengurutkan, dan melakukan operasi hitung pecahan dengan penyebut berbeda.',
    tujuanPembelajaran: 'Siswa mampu menyamakan penyebut menggunakan KPK lalu menghitung hasil penjumlahan pecahan secara tepat.',
  },
  {
    mapelKode: 'MTK',
    mapelNama: 'Matematika',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Menghitung Keliling dan Luas Bangun Datar Gabungan',
    capaianPembelajaran: 'Peserta didik menentukan keliling dan luas berbagai bentuk bangun datar gabungan.',
    tujuanPembelajaran: 'Siswa dapat memecahkan masalah kontekstual mencari luas kebun berbentuk persegi panjang dan segitiga.',
  },
  // Bahasa Indonesia Fase C
  {
    mapelKode: 'BINDO',
    mapelNama: 'Bahasa Indonesia',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Teks Eksplanasi Ilmiah dan Menemukan Sebab-Akibat',
    capaianPembelajaran: 'Peserta didik menganalisis informasi, fakta, dan hubungan sebab-akibat dalam teks eksplanasi.',
    tujuanPembelajaran: 'Siswa mampu menjelaskan terjadinya fenomena gerhana bulan atau daur air berdasarkan teks ilmiah populer.',
  },
  // Pendidikan Pancasila Fase C
  {
    mapelKode: 'PANCASILA',
    mapelNama: 'Pendidikan Pancasila',
    fase: 'Fase C',
    tingkatKelas: [5, 6],
    topik: 'Musyawarah Mufakat dan Norma dalam Kehidupan Bermasyarakat',
    capaianPembelajaran: 'Menganalisis penerapan nilai-nilai Pancasila dalam musyawarah untuk mufakat di lingkungan sekitar.',
    tujuanPembelajaran: 'Siswa mampu memberikan contoh pelaksanaan musyawarah pemilihan ketua kelas dan menghargai keputusan bersama.',
  },
];

import { MataPelajaran, Rombel } from '../types';

/**
 * Filter classes (Rombel) strictly corresponding to a selected subject (Mata Pelajaran).
 * E.g., IPAS is only for Fase B & C (Kelas 3-6).
 */
export function getAvailableRombelForMapel(
  mapel: MataPelajaran | string | undefined,
  rombels: Rombel[]
): Rombel[] {
  if (!mapel) return rombels;
  const isIpas = typeof mapel === 'string'
    ? mapel.toLowerCase().includes('ipas') || mapel.toLowerCase().includes('alam dan sosial')
    : mapel.fase_tersedia === 'FASE_B_C' || mapel.nama.toLowerCase().includes('ipas');

  if (isIpas) {
    return rombels.filter((r) => r.tingkat_kelas >= 3);
  }

  const isFaseAOnly = typeof mapel === 'string'
    ? false
    : mapel.fase_tersedia === 'FASE_A';

  if (isFaseAOnly) {
    return rombels.filter((r) => r.tingkat_kelas <= 2);
  }

  return rombels;
}

/**
 * Filter subjects (Mata Pelajaran) strictly corresponding to a selected class level (Tingkat Kelas).
 * E.g., Kelas 1 & 2 will not see IPAS as a standalone subject.
 */
export function getAvailableMapelForKelas(
  tingkatKelas: number,
  mapels: MataPelajaran[]
): MataPelajaran[] {
  if (tingkatKelas <= 2) {
    return mapels.filter((m) => m.fase_tersedia !== 'FASE_B_C');
  }
  return mapels.filter((m) => m.fase_tersedia !== 'FASE_A');
}

/**
 * Filter topics strictly by class level AND selected subject
 * Never return disconnected subjects if a subject is chosen!
 */
export function getRecommendedTopics(tingkatKelas: number, mapelNama?: string): KurikulumMerdekaTopic[] {
  const fase = getFaseFromKelas(tingkatKelas);
  const filtered = KURIKULUM_MERDEKA_SAMPLE_TOPICS.filter((t) => t.fase === fase);

  if (mapelNama && mapelNama !== 'all') {
    const lower = mapelNama.toLowerCase();
    const mapelMatch = filtered.filter((t) => {
      const tLower = t.mapelNama.toLowerCase();
      if (lower.includes('matematika') && tLower.includes('matematika')) return true;
      if (lower.includes('ipas') && tLower.includes('ipas')) return true;
      if (lower.includes('indonesia') && tLower.includes('indonesia')) return true;
      if (lower.includes('pancasila') && tLower.includes('pancasila')) return true;
      if (lower.includes('seni') && tLower.includes('seni')) return true;
      if (lower.includes('inggris') && tLower.includes('inggris')) return true;
      if (lower.includes('pjok') && tLower.includes('pjok')) return true;
      return tLower === lower || lower.includes(tLower) || tLower.includes(lower);
    });

    if (mapelMatch.length > 0) {
      return mapelMatch;
    }

    // Dynamic subject-tailored topics if not explicitly listed in samples
    return [
      {
        mapelKode: 'UMUM',
        mapelNama,
        fase,
        tingkatKelas: [tingkatKelas],
        topik: `Pengenalan Konsep Dasar ${mapelNama}`,
        capaianPembelajaran: `Peserta didik memahami konsep dasar mata pelajaran ${mapelNama} sesuai capaian ${fase}.`,
        tujuanPembelajaran: `Siswa mampu menjelaskan dan mempraktikkan konsep dasar ${mapelNama} dalam kehidupan sehari-hari.`,
      },
      {
        mapelKode: 'UMUM',
        mapelNama,
        fase,
        tingkatKelas: [tingkatKelas],
        topik: `Penerapan dan Eksplorasi ${mapelNama} di Lingkungan Sekitar`,
        capaianPembelajaran: `Peserta didik mengamati dan menerapkan materi ${mapelNama} di rumah dan sekolah.`,
        tujuanPembelajaran: `Siswa dapat mengidentifikasi contoh nyata dan manfaat pembelajaran ${mapelNama}.`,
      },
      {
        mapelKode: 'UMUM',
        mapelNama,
        fase,
        tingkatKelas: [tingkatKelas],
        topik: `Karya Kreatif dan Refleksi ${mapelNama}`,
        capaianPembelajaran: `Peserta didik menghasilkan karya atau menyelesaikan tantangan sederhana ${mapelNama}.`,
        tujuanPembelajaran: `Siswa mampu menunjukkan hasil kreasi dan berdiskusi bersama teman sekelas.`,
      },
    ];
  }

  return filtered;
}

export interface CurriculumWarning {
  type: 'critical' | 'advisory' | 'pedagogical';
  title: string;
  message: string;
}

/**
 * Real-time Intelligent Pedagogical & Curriculum Validator
 * Mengidentifikasi ketidaksesuaian input: usia anak, fase kurikulum merdeka, tingkat kesulitan, tipe soal.
 */
export function detectKurikulumWarnings(
  tingkatKelas: number,
  mapelNama: string,
  topik: string,
  tingkatKesulitan: 'mudah' | 'sedang' | 'sulit',
  tipeSoal: 'pilihan_ganda' | 'isian' | 'esai' | 'campuran'
): CurriculumWarning[] {
  const warnings: CurriculumWarning[] = [];
  const cleanTopik = (topik || '').trim().toLowerCase();
  const lowerMapel = (mapelNama || '').toLowerCase();
  const isFaseA = tingkatKelas <= 2;
  const isFaseB = tingkatKelas === 3 || tingkatKelas === 4;

  // 1. Validasi Mata Pelajaran IPAS di Fase A (Kelas 1-2)
  if (isFaseA && (lowerMapel.includes('ipas') || lowerMapel.includes('ipa') || lowerMapel.includes('ips'))) {
    warnings.push({
      type: 'critical',
      title: 'Struktur Kurikulum Merdeka Fase A',
      message:
        'Pada Kurikulum Merdeka Kemendikbudristek, mata pelajaran IPAS baru diajarkan mandiri mulai Kelas 3 (Fase B). Untuk Kelas 1-2, materi sains/sosial disatukan dalam Bahasa Indonesia atau Pendidikan Pancasila. AI akan mengadaptasi bahasa soal ke kata-kata super konkret usia 6-8 tahun.',
    });
  }

  // 2. Validasi Topik Kosong atau Terlalu Singkat
  if (!cleanTopik) {
    warnings.push({
      type: 'critical',
      title: 'Topik Pembelajaran Diperlukan',
      message: 'Silakan masukkan nama bab atau topik pembelajaran yang ingin diujikan kepada siswa.',
    });
  } else if (cleanTopik.length < 3) {
    warnings.push({
      type: 'advisory',
      title: 'Topik Terlalu Pendek',
      message: 'Topik terlalu singkat. Berikan nama materi yang lebih spesifik (misal: "Penjumlahan Buah 1-10" bukan sekadar "hitung").',
    });
  }

  // 3. Validasi Konten Terlalu Abstrak/Lanjut untuk Anak SD
  const advancedKeywords = [
    'integral', 'turunan', 'aljabar linier', 'trigonometri', 'diferensial',
    'matriks', 'fotosintesis c4', 'kimia organik', 'stoikiometri', 'reaksi redoks',
    'politik praktis', 'makroekonomi', 'hukum tata negara', 'algoritma greedy'
  ];

  const foundAdvanced = advancedKeywords.find((kw) => cleanTopik.includes(kw));
  if (foundAdvanced) {
    warnings.push({
      type: 'critical',
      title: 'Topik Terlalu Tinggi untuk Tingkat SD',
      message: `Topik mengandung konsep lanjut ("${foundAdvanced}") yang melampaui capaian Kurikulum Merdeka SD. Disarankan menggunakan konsep dasar yang dekat dengan kehidupan peserta didik.`,
    });
  }

  // 4. Validasi Tingkat Kesulitan di Fase A (Kelas 1-2)
  if (isFaseA && tingkatKesulitan === 'sulit') {
    warnings.push({
      type: 'advisory',
      title: 'Pedagogi Soal Sulit di Kelas 1-2',
      message:
        'Untuk siswa usia 6-8 tahun, kategori "Sulit" diwujudkan melalui perbandingan logika konkret (misal: "Manakah keranjang yang lebih banyak?"), bukan rumus abstrak atau teks panjang.',
    });
  }

  // 5. Validasi Tipe Soal Esai di Fase A (Kelas 1-2)
  if (isFaseA && tipeSoal === 'esai') {
    warnings.push({
      type: 'pedagogical',
      title: 'Literasi Menulis Siswa Fase A',
      message:
        'Siswa Kelas 1-2 baru mulai merangkai kata. Soal esai disarankan berupa jawaban 1 kalimat pendek atau memanfaatkan foto tugas tulisan tangan di buku tulis.',
    });
  }

  // 6. Sinkronisasi Topik dengan Mata Pelajaran
  if (cleanTopik.length >= 4) {
    const looksLikeMath = cleanTopik.includes('hitung') || cleanTopik.includes('tambah') || cleanTopik.includes('kali') || cleanTopik.includes('pecahan') || cleanTopik.includes('angka') || cleanTopik.includes('geometri');
    const looksLikeScience = cleanTopik.includes('rantai') || cleanTopik.includes('ekosistem') || cleanTopik.includes('tumbuhan') || cleanTopik.includes('organ') || cleanTopik.includes('listrik') || cleanTopik.includes('planet');

    if (lowerMapel.includes('matematika') && looksLikeScience) {
      warnings.push({
        type: 'advisory',
        title: 'Ketidaksesuaian Topik dan Mapel',
        message: `Mata pelajaran yang dipilih adalah "Matematika", tetapi topik "${topik}" tampak seperti materi IPAS/Sains. AI akan tetap mencoba mengaitkan numerasi atau Anda dapat mengganti mata pelajaran ke IPAS.`,
      });
    } else if (lowerMapel.includes('bahasa') && looksLikeMath) {
      warnings.push({
        type: 'advisory',
        title: 'Ketidaksesuaian Topik dan Mapel',
        message: `Mata pelajaran yang dipilih adalah "Bahasa Indonesia", namun topik "${topik}" bernuansa Matematika. AI akan memfokuskan pada literasi membaca angka atau Anda dapat mengganti Mapel ke Matematika.`,
      });
    }
  }

  return warnings;
}

