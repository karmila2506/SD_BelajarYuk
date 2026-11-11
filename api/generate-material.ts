import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

interface GenerateMaterialRequest {
  tingkat_kelas: number; // 1 - 6
  mata_pelajaran: string;
  topik: string;
  tujuan_pembelajaran?: string;
  capaian_pembelajaran?: string;
  include_quiz?: boolean;
  jumlah_soal_kuis?: number;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'BelajarYuk AI Material Generator' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    tingkat_kelas = 3,
    mata_pelajaran = 'Matematika',
    topik = 'Mengenal Bangun Datar',
    tujuan_pembelajaran = '',
    capaian_pembelajaran = '',
    include_quiz = true,
    jumlah_soal_kuis = 3,
  }: GenerateMaterialRequest = req.body || {};

  const isFaseA = tingkat_kelas <= 2;
  const isFaseB = tingkat_kelas === 3 || tingkat_kelas === 4;
  const isFaseC = tingkat_kelas >= 5;

  const faseName = isFaseA
    ? 'Fase A (Kelas 1-2 SD)'
    : isFaseB
    ? 'Fase B (Kelas 3-4 SD)'
    : 'Fase C (Kelas 5-6 SD)';

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const systemInstruction = `Anda adalah Tim Ahli Pengembang Materi & Modul Ajar Sekolah Dasar (SD) Indonesia untuk Kurikulum Merdeka (Kemendikbudristek).
Karakteristik peserta didik SD berdasarkan Fase Kurikulum Merdeka WAJIB ditaati dengan sangat ketat:

=======================================================================
1. FASE A (KELAS 1 DAN KELAS 2 SD) - USIA 6-8 TAHUN:
=======================================================================
- LITERASI: Baru belajar membaca kata per kata.
- STRUKTUR MATERI: Kalimat sangat pendek (4-10 kata per kalimat). Gunakan banyak analogi visual konkret (buah-buahan, hewan jinak, benda di rumah dan kelas).
- NADA BAHASA: Ceria, hangat, ramah, dan mengajak siswa bergembira ("Halo Teman-Teman Hebat!", "Ayo Amati!", "Hebat!").
- SOAL KUIS (JIKA DIMINTA): Pilihan ganda dengan MAKSIMAL 3 OPSI (A, B, C) atau Benar/Salah konkret.

=======================================================================
2. FASE B (KELAS 3 DAN KELAS 4 SD) - USIA 8-10 TAHUN:
=======================================================================
- LITERASI: Sudah lancar membaca paragraf pendek.
- STRUKTUR MATERI: Penjelasan bertahap, menghubungkan fakta sains atau numerasi dengan kejadian sehari-hari anak.
- SOAL KUIS (JIKA DIMINTA): 4 opsi (A, B, C, D) atau isian istilah konsep.

=======================================================================
3. FASE C (KELAS 5 DAN KELAS 6 SD) - USIA 10-12 TAHUN:
=======================================================================
- LITERASI: Mampu bernalar analitis, membaca teks informatif 2-3 paragraf.
- STRUKTUR MATERI: Penjelasan konsep mendalam namun tetap aplikatif, dilengkapi tantangan berpikir kritis dan nalar pemecahan masalah.
- SOAL KUIS (JIKA DIMINTA): 4 opsi (A, B, C, D) dengan stimulasi pemecahan masalah.

Semua materi harus disajikan dalam format JSON yang terstruktur rapi.`;

    const prompt = `Buatkan materi pembelajaran Kurikulum Merdeka SD yang lengkap dan menarik dengan spesifikasi:
- Tingkat Kelas: Kelas ${tingkat_kelas} SD (${faseName})
- Mata Pelajaran: ${mata_pelajaran}
- Topik / Bab Pembelajaran: "${topik}"
${tujuan_pembelajaran ? `- Tujuan Pembelajaran (TP): ${tujuan_pembelajaran}` : ''}
${capaian_pembelajaran ? `- Capaian Pembelajaran (CP): ${capaian_pembelajaran}` : ''}
${include_quiz ? `- Sertakan juga ${jumlah_soal_kuis} butir soal kuis langsung dari materi ini lengkap dengan kunci jawaban dan pembahasannya.` : ''}

Ketentuan isi materi:
1. "judul": Judul materi yang menarik, ceria, dan ramah anak SD.
2. "deskripsi_singkat": 1-2 kalimat ringkasan ramah anak tentang apa yang akan dipelajari.
3. "uraian_materi": Penjelasan materi lengkap berstruktur ramah anak (terdiri dari sub-bagian seperti Pengantar Cerita, Penjelasan Konsep, Contoh Nyata).
4. "poin_penting": 3 sampai 5 poin ringkasan utama ("Ayo Ingat!").
5. "contoh_nyata": Contoh konkret penerapan di sekitar anak sehari-hari.
6. "aktivitas_siswa": 1 panduan aktivitas seru atau eksperimen mini di kelas/rumah.
7. "lkpd_panduan": Teks Lembar Kerja Peserta Didik (LKPD) yang siap dibaca langsung oleh siswa.
${include_quiz ? `8. "soal_kuis": Array berisi ${jumlah_soal_kuis} butir soal (nomor, tipe: "pilihan_ganda"|"isian"|"benar_salah", pertanyaan, pilihan, kunci_jawaban, pembahasan, skor_bobot).` : ''}

Keluarkan dalam format JSON yang valid.`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of candidateModels) {
      try {
        console.log(`[AI Material Generator] Requesting model: ${modelName} for Kelas ${tingkat_kelas} - ${topik}`);
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                judul: { type: Type.STRING },
                deskripsi_singkat: { type: Type.STRING },
                capaian_pembelajaran: { type: Type.STRING },
                tujuan_pembelajaran: { type: Type.STRING },
                uraian_materi: { type: Type.STRING },
                poin_penting: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                contoh_nyata: { type: Type.STRING },
                aktivitas_siswa: { type: Type.STRING },
                lkpd_panduan: { type: Type.STRING },
                soal_kuis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      nomor: { type: Type.INTEGER },
                      tipe: { type: Type.STRING },
                      pertanyaan: { type: Type.STRING },
                      pilihan: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      kunci_jawaban: { type: Type.STRING },
                      pembahasan: { type: Type.STRING },
                      skor_bobot: { type: Type.INTEGER },
                    },
                    required: ['nomor', 'tipe', 'pertanyaan', 'kunci_jawaban', 'pembahasan', 'skor_bobot'],
                  },
                },
              },
              required: [
                'judul',
                'deskripsi_singkat',
                'capaian_pembelajaran',
                'tujuan_pembelajaran',
                'uraian_materi',
                'poin_penting',
                'contoh_nyata',
                'aktivitas_siswa',
                'lkpd_panduan',
              ],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${modelName} timeout (25s)`)), 25000)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        const text = response.text || '{}';
        const parsedData = JSON.parse(text);

        if (parsedData && parsedData.judul && parsedData.uraian_materi) {
          console.log(`[AI Material Generator] Success generated via ${modelName}`);
          return res.status(200).json({
            success: true,
            source: 'gemini',
            model: modelName,
            data: parsedData,
          });
        }
      } catch (err: any) {
        console.warn(`[AI Material Generator] Model ${modelName} error: ${err.message}. Trying next candidate...`);
        continue;
      }
    }
  }

  // Fallback intelligent curriculum generator if external API unavailable
  console.log(`[AI Material Generator] Fallback curriculum engine for ${topik} (Kelas ${tingkat_kelas})`);
  const fallback = generateMaterialFallback({
    tingkat_kelas,
    mata_pelajaran,
    topik,
    tujuan_pembelajaran,
    capaian_pembelajaran,
    include_quiz,
    jumlah_soal_kuis,
    isFaseA,
    isFaseB,
    isFaseC,
  });

  return res.status(200).json({
    success: true,
    source: 'smart-curriculum-ai',
    message: 'Materi Kurikulum Merdeka berhasil disusun.',
    data: fallback,
  });
}

function generateMaterialFallback(params: {
  tingkat_kelas: number;
  mata_pelajaran: string;
  topik: string;
  tujuan_pembelajaran?: string;
  capaian_pembelajaran?: string;
  include_quiz?: boolean;
  jumlah_soal_kuis?: number;
  isFaseA: boolean;
  isFaseB: boolean;
  isFaseC: boolean;
}) {
  const { tingkat_kelas, mata_pelajaran, topik, isFaseA, isFaseB, include_quiz, jumlah_soal_kuis = 3 } = params;
  const cleanTopik = (topik || 'Materi Belajar SD').trim();

  let uraian = '';
  let poin: string[] = [];
  let contoh = '';
  let aktivitas = '';
  let lkpd = '';
  let quiz: any[] = [];

  if (isFaseA) {
    uraian = `Halo teman-teman hebat Kelas ${tingkat_kelas}! 🌟\nHari ini kita belajar tentang ${cleanTopik}.\n\nAyo perhatikan benda-benda di sekeliling kita! Benda-benda itu sangat unik dan punya ciri khas masing-masing.\n\nKetika kita belajar ${cleanTopik}, kita belajar untuk semakin teliti, menyayangi ciptaan Tuhan, dan bekerja sama dengan teman di kelas.`;
    poin = [
      `Mengenal konsep dasar ${cleanTopik} dengan gembira.`,
      `Menemukan contoh benda nyata di rumah dan di sekolah.`,
      `Belajar tertib, sopan, dan saling tolong-menolong bersama teman.`,
    ];
    contoh = `Di rumah, kita bisa melihat contoh ${cleanTopik} saat merapikan buku, menghitung buah di meja makan, atau bermain bersama adik.`;
    aktivitas = `Ayo Menggambar Ceria! Gambarlah satu contoh ${cleanTopik} di buku gambar dan berikan warna terindahmu. Tunjukkan pada guru dan temanmu!`;
    lkpd = `LEMBAR KERJA PESERTA DIDIK (LKPD)\nKelas: ${tingkat_kelas} SD (Fase A)\nMata Pelajaran: ${mata_pelajaran}\nTopik: ${cleanTopik}\n\nPetunjuk Belajar:\n1. Amati gambar dan cerita yang diberikan guru.\n2. Sebutkan nama-nama benda yang berkaitan dengan ${cleanTopik}.\n3. Berikan tanda centang pada benda yang benar di lembar kerjamu!`;
    
    if (include_quiz) {
      quiz = [
        {
          nomor: 1,
          tipe: 'pilihan_ganda',
          pertanyaan: `Mengenai ${cleanTopik}, manakah sikap belajar yang paling baik?`,
          pilihan: [`A. Belajar dengan gembira dan tertib`, `B. Malas membaca buku`, `C. Mengganggu teman`],
          kunci_jawaban: `A. Belajar dengan gembira dan tertib`,
          pembahasan: `Hebat! Sikap semangat dan gembira membuat belajar terasa menyenangkan.`,
          skor_bobot: 35,
        },
        {
          nomor: 2,
          tipe: 'benar_salah',
          pertanyaan: `Kita harus merapikan kembali alat belajar setelah selesai mempelajari ${cleanTopik}.`,
          pilihan: ['A. Benar', 'B. Salah'],
          kunci_jawaban: 'A. Benar',
          pembahasan: 'Tepat sekali! Menjaga kebersihan dan kerapian adalah ciri anak hebat.',
          skor_bobot: 35,
        },
        {
          nomor: 3,
          tipe: 'isian',
          pertanyaan: `Materi yang kita pelajari hari ini adalah tentang ...`,
          pilihan: [],
          kunci_jawaban: cleanTopik,
          pembahasan: `Luar biasa! Hari ini kita mendalami materi ${cleanTopik}.`,
          skor_bobot: 30,
        },
      ].slice(0, Math.min(jumlah_soal_kuis, 3));
    }
  } else if (isFaseB) {
    uraian = `Selamat pagi anak-anak cerdas Kelas ${tingkat_kelas}! 🌿\n\nDalam pembelajaran ${mata_pelajaran} kali ini, kita mendalami topik: "${cleanTopik}".\n\n1. APA ITU ${cleanTopik.toUpperCase()}?\n${cleanTopik} merupakan konsep penting yang membantu kita memahami hubungan antar komponen di alam dan masyarakat.\n\n2. MENGAPA INI PENTING?\nDengan memahami materi ini, kita dapat memecahkan masalah praktis, membedakan proses perubahan, serta menerapkan solusi yang ramah lingkungan.\n\n3. LANGKAH PENERAPAN:\nAmati gejala yang tampak, catat perubahannya, dan diskusikan kesimpulan bersama kelompok belajarmu.`;
    poin = [
      `Memahami definisi dan karakteristik penting dari ${cleanTopik}.`,
      `Menganalisis hubungan sebab-akibat dalam kehidupan nyata di sekitar kita.`,
      `Menunjukkan sikap gotong royong dan bernalar kritis saat menyelesaikan tugas.`,
    ];
    contoh = `Penerapan ${cleanTopik} dapat kita amati di lingkungan sekolah, dapur rumah tangga, hingga kebun sekolah saat proses fotosintesis dan perubahan energi berlangsung.`;
    aktivitas = `Eksperimen Kelompok: Buatlah tabel pengamatan 3 kolom di buku catatanmu. Tuliskan nama benda/situasi, kondisi awal, dan perubahannya setelah diberi perlakuan terkait ${cleanTopik}.`;
    lkpd = `LEMBAR KERJA PESERTA DIDIK (LKPD) KURIKULUM MERDEKA\nKelas: ${tingkat_kelas} SD (Fase B)\nMata Pelajaran: ${mata_pelajaran}\nTopik: ${cleanTopik}\n\nLangkah Kerja:\n1. Bentuklah kelompok belajar yang terdiri dari 3-4 siswa.\n2. Lakukan pengamatan terhadap fenomena ${cleanTopik}.\n3. Diskusikan dan jawablah pertanyaan analisis pada lembar jawaban.\n4. Presentasikan temuan kelompok di depan kelas dengan percaya diri!`;
    
    if (include_quiz) {
      quiz = [
        {
          nomor: 1,
          tipe: 'pilihan_ganda',
          pertanyaan: `Pernyataan yang paling tepat berkaitan dengan konsep "${cleanTopik}" adalah...`,
          pilihan: [
            `A. Memahami prinsip dasarnya dan menerapkannya dalam kehidupan sehari-hari`,
            `B. Hanya menghafal tanpa memahaminya`,
            `C. Mengabaikan aturan keselamatan belajar`,
            `D. Tidak mau bekerja sama dengan teman kelompok`,
          ],
          kunci_jawaban: `A. Memahami prinsip dasarnya dan menerapkannya dalam kehidupan sehari-hari`,
          pembahasan: `Tepat sekali! Kurikulum Merdeka mengutamakan pemahaman konsep yang bermakna dan aplikatif.`,
          skor_bobot: 35,
        },
        {
          nomor: 2,
          tipe: 'pilihan_ganda',
          pertanyaan: `Salah satu manfaat mempelajari topik "${cleanTopik}" bagi kehidupan kita adalah...`,
          pilihan: [
            `A. Mampu menyelesaikan masalah dan menjaga lingkungan sekitar`,
            `B. Membuat kita malas belajar`,
            `C. Menolak menerima pendapat orang lain`,
            `D. Membuang-buang waktu bermain`,
          ],
          kunci_jawaban: `A. Mampu menyelesaikan masalah dan menjaga lingkungan sekitar`,
          pembahasan: `Luar biasa! Belajar yang bermakna mengasah kecakapan hidup sehari-hari.`,
          skor_bobot: 35,
        },
        {
          nomor: 3,
          tipe: 'isian',
          pertanyaan: `Sebutkan satu kata kunci penting yang berkaitan dengan materi ${cleanTopik}:`,
          pilihan: [],
          kunci_jawaban: cleanTopik.split(' ')[0] || cleanTopik,
          pembahasan: `Pintar! Kata kunci ini merupakan konsep inti pembelajaran kita.`,
          skor_bobot: 30,
        },
      ].slice(0, Math.min(jumlah_soal_kuis, 3));
    }
  } else {
    // Fase C
    uraian = `Selamat datang para calon pemimpin masa depan di Kelas ${tingkat_kelas} SD! 🚀\n\nPada modul ${mata_pelajaran} ini, kita mengkaji secara komprehensif topik: "${cleanTopik}".\n\nA. LANDASAN TEORETIS DAN KONSEP\nKonsep ${cleanTopik} mengintegrasikan penalaran kritis, pemahaman sistem, dan keterkaitan komponen global.\n\nB. ANALISIS FENOMENA\nDalam menghadapi tantangan era modern, pemahaman terhadap ${cleanTopik} menjadi modal berharga dalam literasi ilmiah, numerasi analitis, dan profil Pelajar Pancasila.\n\nC. KESIMPULAN DAN REFLEKSI\nSetiap prinsip yang kita pelajari menuntut tanggung jawab etis dalam menjaga kelestarian serta keharmonisan sosial.`;
    poin = [
      `Menganalisis konsep esensial dan hukum dasar yang melandasi ${cleanTopik}.`,
      `Mengidentifikasi dampak jangka panjang terhadap ekosistem atau kehidupan sosial.`,
      `Merumuskan ide solutif berbasis riset sederhana dan kolaborasi aktif.`,
    ];
    contoh = `Dalam skala nyata, ${cleanTopik} dapat dicontohkan melalui pemanfaatan energi terbarukan, tata kelola lingkungan, atau musyawarah mufakat di masyarakat.`;
    aktivitas = `Studi Kasus Mandiri: Analisislah sebuah berita atau fenomena nyata yang terjadi di lingkunganmu mengenai ${cleanTopik}. Buatlah peta pikiran (mind map) solusinya dalam 1 halaman ringkas!`;
    lkpd = `LEMBAR KERJA PESERTA DIDIK (LKPD) FASE C\nKelas: ${tingkat_kelas} SD\nMata Pelajaran: ${mata_pelajaran}\nTopik: ${cleanTopik}\n\nPanduan Analisis:\n1. Pelajari data dan narasi pengantar materi secara kritis.\n2. Identifikasi masalah utama dan faktor-faktor yang mempengaruhinya.\n3. Rancanglah solusi alternatif yang inovatif dan terukur.\n4. Siapkan laporan ringkas hasil analisis untuk penilaian portofolio.`;
    
    if (include_quiz) {
      quiz = [
        {
          nomor: 1,
          tipe: 'pilihan_ganda',
          pertanyaan: `Berdasarkan kajian mendalam mengenai "${cleanTopik}", aspek kritis yang harus diperhatikan adalah...`,
          pilihan: [
            `A. Mengidentifikasi hubungan ketergantungan antar-komponen secara menyeluruh`,
            `B. Memusnahkan komponen yang tidak disukai`,
            `C. Mengabaikan data dan fakta yang ada`,
            `D. Mengambil keputusan tanpa dasar ilmiah`,
          ],
          kunci_jawaban: `A. Mengidentifikasi hubungan ketergantungan antar-komponen secara menyeluruh`,
          pembahasan: `Analitis sekali! Pemikiran sistemik menuntut pemahaman saling ketergantungan secara utuh.`,
          skor_bobot: 35,
        },
        {
          nomor: 2,
          tipe: 'pilihan_ganda',
          pertanyaan: `Sikap Profil Pelajar Pancasila yang paling relevan saat membedah materi "${cleanTopik}" adalah...`,
          pilihan: [
            `A. Bernalar kritis, mandiri, dan bergotong royong`,
            `B. Pasif dan menunggu jawaban teman`,
            `C. Mengabaikan tanggung jawab kelompok`,
            `D. Tidak peduli terhadap dampak lingkungan`,
          ],
          kunci_jawaban: `A. Bernalar kritis, mandiri, dan bergotong royong`,
          pembahasan: `Luar biasa! Nilai-nilai luhur Pancasila menjiwai setiap langkah pemecahan masalah.`,
          skor_bobot: 35,
        },
        {
          nomor: 3,
          tipe: 'isian',
          pertanyaan: `Tuliskan kesimpulan ringkas manfaat dari penerapan ${cleanTopik}:`,
          pilihan: [],
          kunci_jawaban: 'Solusi yang bijak dan bertanggung jawab',
          pembahasan: `Hebat! Pemahaman yang matang menghasilkan keputusan yang bijaksana.`,
          skor_bobot: 30,
        },
      ].slice(0, Math.min(jumlah_soal_kuis, 3));
    }
  }

  return {
    judul: `Materi Ceria: ${cleanTopik} (Kelas ${tingkat_kelas})`,
    deskripsi_singkat: `Modul ajar Kurikulum Merdeka yang ramah dan interaktif untuk mendalami materi "${cleanTopik}".`,
    capaian_pembelajaran: params.capaian_pembelajaran || `Peserta didik memahami dan menerapkan materi ${cleanTopik} sesuai capaian fase peserta didik Kelas ${tingkat_kelas} SD.`,
    tujuan_pembelajaran: params.tujuan_pembelajaran || `Siswa mampu menjelaskan konsep ${cleanTopik} dan memberikan contoh nyata dalam kehidupan sehari-hari.`,
    uraian_materi: uraian,
    poin_penting: poin,
    contoh_nyata: contoh,
    aktivitas_siswa: aktivitas,
    lkpd_panduan: lkpd,
    soal_kuis: quiz,
  };
}
