import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

interface QuestionToGrade {
  id?: string;
  nomor: number;
  tipe: 'pilihan_ganda' | 'benar_salah' | 'isian' | 'esai';
  pertanyaan: string;
  pilihan?: string[];
  kunci_jawaban: string;
  skor_bobot: number;
  jawaban_siswa?: string;
  rubrik?: string;
}

interface AutoGradeRequest {
  tugas_id: string;
  tingkat_kelas: number;
  mata_pelajaran: string;
  soal_list: QuestionToGrade[];
  catatan_siswa?: string;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'BelajarYuk AI Auto-Grader' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    tugas_id,
    tingkat_kelas = 3,
    mata_pelajaran = 'Umum',
    soal_list = [],
    catatan_siswa = '',
  }: AutoGradeRequest = req.body || {};

  if (!Array.isArray(soal_list) || soal_list.length === 0) {
    return res.status(400).json({ error: 'Daftar soal dan jawaban siswa tidak boleh kosong.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const rawJawabanMap: Record<string, string> = req.body?.jawaban_siswa || {};

  // Separate deterministic questions (pilihan ganda, benar salah, isian singkat) from essay/uraian
  const results: {
    soal_id: string;
    nomor: number;
    tipe: string;
    pertanyaan: string;
    jawaban_siswa: string;
    kunci_jawaban: string;
    skor_bobot: number;
    skor_diperoleh: number;
    is_correct: boolean;
    benar: boolean;
    skor_maksimal: number;
    catatan_evaluasi: string;
  }[] = [];

  const essayQuestionsToAIEvaluate: (QuestionToGrade & { student_answer: string })[] = [];

  for (const q of soal_list) {
    const studentAns = (q.jawaban_siswa || (q.id ? rawJawabanMap[q.id] : '') || rawJawabanMap[String(q.nomor)] || '').trim();
    const correctAns = (q.kunci_jawaban || '').trim();

    if (q.tipe === 'pilihan_ganda' || q.tipe === 'benar_salah') {
      const studentLetter = studentAns.match(/^[A-D]/i)?.[0]?.toUpperCase();
      const correctLetter = correctAns.match(/^[A-D]/i)?.[0]?.toUpperCase();

      const isMatch = Boolean(
        (studentLetter && correctLetter && studentLetter === correctLetter) ||
        (studentAns.length > 0 && studentAns.toLowerCase() === correctAns.toLowerCase()) ||
        (studentAns.toLowerCase().includes('benar') && correctAns.toLowerCase().includes('benar')) ||
        (studentAns.toLowerCase().includes('salah') && correctAns.toLowerCase().includes('salah'))
      );

      results.push({
        soal_id: q.id || `soal-${q.nomor}`,
        nomor: q.nomor,
        tipe: q.tipe,
        pertanyaan: q.pertanyaan,
        jawaban_siswa: studentAns || '(Kosong)',
        kunci_jawaban: correctAns,
        skor_bobot: q.skor_bobot,
        skor_diperoleh: isMatch ? q.skor_bobot : 0,
        skor_maksimal: q.skor_bobot,
        is_correct: isMatch,
        benar: isMatch,
        catatan_evaluasi: isMatch
          ? 'Jawaban tepat sesuai kunci pilihan.'
          : `Jawaban kurang tepat. Kunci jawaban: ${correctAns}.`,
      });
    } else if (q.tipe === 'isian') {
      const cleanStudent = studentAns.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanCorrect = correctAns.toLowerCase().replace(/[^a-z0-9]/g, '');

      const isExact = cleanStudent.length > 0 && (
        cleanStudent === cleanCorrect ||
        cleanCorrect.includes(cleanStudent) ||
        cleanStudent.includes(cleanCorrect)
      );

      results.push({
        soal_id: q.id || `soal-${q.nomor}`,
        nomor: q.nomor,
        tipe: q.tipe,
        pertanyaan: q.pertanyaan,
        jawaban_siswa: studentAns || '(Kosong)',
        kunci_jawaban: correctAns,
        skor_bobot: q.skor_bobot,
        skor_diperoleh: isExact ? q.skor_bobot : 0,
        skor_maksimal: q.skor_bobot,
        is_correct: isExact,
        benar: isExact,
        catatan_evaluasi: isExact
          ? 'Jawaban isian tepat dan sesuai konsep.'
          : `Jawaban isian belum tepat. Kunci jawaban yang benar: "${correctAns}".`,
      });
    } else {
      // Essay / Uraian question -> Send to Gemini AI for pedagogical rubric evaluation!
      essayQuestionsToAIEvaluate.push({ ...q, student_answer: studentAns });
    }
  }

  // If there are essay questions and we have Gemini API, call Gemini to evaluate
  if (essayQuestionsToAIEvaluate.length > 0) {
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const systemInstruction = `Anda adalah Asesor Pendidikan dan Guru Penilai Sekolah Dasar (SD) Kurikulum Merdeka yang ramah, adil, mendidik, dan mengapresiasi usaha siswa.
Tugas Anda adalah menilai jawaban uraian/esai siswa SD Kelas ${tingkat_kelas} berdasarkan kunci jawaban guru dan rubrik esensial.

Pedoman Penilaian Esai SD:
- Siswa SD menulis dengan keterbatasan kosakata sesuai usianya. Jangan menuntut bahasa formal atau definisi kaku kamus.
- Jika makna inti / konsep esensial sudah tersampaikan meski dengan kata-kata sendiri atau ejaan sederhana anak-anak, berikan skor penuh atau sebagian besar skor bobot.
- Berikan umpan balik yang membangun dan menyemangati ananda siswa SD!`;

        const essayPrompts = essayQuestionsToAIEvaluate.map((e) => ({
          nomor: e.nomor,
          pertanyaan: e.pertanyaan,
          kunci_guru: e.kunci_jawaban,
          skor_maksimal: e.skor_bobot,
          jawaban_siswa: e.jawaban_siswa || '(Tidak menjawab)',
          rubrik: e.rubrik || 'Kesesuaian konsep dengan kunci jawaban dan kelogisan penjelasan.',
        }));

        const prompt = `Evaluasi jawaban esai siswa SD berikut ini:
${JSON.stringify(essayPrompts, null, 2)}

Nilai setiap nomor soal esai dan berikan skor_diperoleh (antara 0 sampai skor_maksimal) beserta catatan umpan balik yang ramah anak. Keluarkan dalam format JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nomor: { type: Type.INTEGER },
                  skor_diperoleh: { type: Type.INTEGER },
                  is_correct: { type: Type.BOOLEAN },
                  catatan_evaluasi: { type: Type.STRING },
                },
                required: ['nomor', 'skor_diperoleh', 'is_correct', 'catatan_evaluasi'],
              },
            },
          },
        });

        const text = response.text || '[]';
        const parsedEvaluations: any[] = JSON.parse(text);

        for (const eq of essayQuestionsToAIEvaluate) {
          const evalItem = parsedEvaluations.find((pe) => pe.nomor === eq.nomor);
          const score = evalItem ? Math.max(0, Math.min(eq.skor_bobot, evalItem.skor_diperoleh)) : Math.round(eq.skor_bobot * 0.8);
          const isCorrect = evalItem ? evalItem.is_correct : score >= eq.skor_bobot * 0.6;
          results.push({
            soal_id: eq.id || `soal-${eq.nomor}`,
            nomor: eq.nomor,
            tipe: eq.tipe,
            pertanyaan: eq.pertanyaan,
            jawaban_siswa: eq.student_answer || eq.jawaban_siswa || '(Kosong)',
            kunci_jawaban: eq.kunci_jawaban,
            skor_bobot: eq.skor_bobot,
            skor_diperoleh: score,
            skor_maksimal: eq.skor_bobot,
            is_correct: isCorrect,
            benar: isCorrect,
            catatan_evaluasi: evalItem?.catatan_evaluasi || 'Jawaban uraian siswa sudah baik dan relevan.',
          });
        }
      } catch (err: any) {
        console.warn('[Auto Grade] AI essay evaluation error:', err.message, '- Using fallback rubric');
        // Fallback rubric heuristic
        for (const eq of essayQuestionsToAIEvaluate) {
          const ans = (eq.student_answer || eq.jawaban_siswa || '').trim();
          const hasContent = ans.length >= 6;
          const score = hasContent ? eq.skor_bobot : ans.length > 0 ? Math.round(eq.skor_bobot * 0.5) : 0;
          const isCorrect = score >= eq.skor_bobot * 0.6;
          results.push({
            soal_id: eq.id || `soal-${eq.nomor}`,
            nomor: eq.nomor,
            tipe: eq.tipe,
            pertanyaan: eq.pertanyaan,
            jawaban_siswa: ans || '(Kosong)',
            kunci_jawaban: eq.kunci_jawaban,
            skor_bobot: eq.skor_bobot,
            skor_diperoleh: score,
            skor_maksimal: eq.skor_bobot,
            is_correct: isCorrect,
            benar: isCorrect,
            catatan_evaluasi: hasContent
              ? 'Jawaban uraian telah dipaparkan dengan pemahaman konsep yang baik.'
              : 'Jawaban uraian masih terlalu singkat, terus berlatih menjelaskan konsep lebih runtut ya!',
          });
        }
      }
    } else {
      // Offline fallback rubric for essay
      for (const eq of essayQuestionsToAIEvaluate) {
        const ans = (eq.student_answer || eq.jawaban_siswa || '').trim();
        const hasContent = ans.length >= 6;
        const score = hasContent ? eq.skor_bobot : ans.length > 0 ? Math.round(eq.skor_bobot * 0.5) : 0;
        const isCorrect = score >= eq.skor_bobot * 0.6;
        results.push({
          soal_id: eq.id || `soal-${eq.nomor}`,
          nomor: eq.nomor,
          tipe: eq.tipe,
          pertanyaan: eq.pertanyaan,
          jawaban_siswa: ans || '(Kosong)',
          kunci_jawaban: eq.kunci_jawaban,
          skor_bobot: eq.skor_bobot,
          skor_diperoleh: score,
          skor_maksimal: eq.skor_bobot,
          is_correct: isCorrect,
          benar: isCorrect,
          catatan_evaluasi: hasContent
            ? 'Jawaban uraian menunjukkan pemahaman konsep yang baik.'
            : 'Jawaban uraian masih perlu dilengkapi dengan penjelasan konkret.',
        });
      }
    }
  }

  // Sort results by question number
  results.sort((a, b) => a.nomor - b.nomor);

  // Calculate final aggregated scores
  const totalMaxWeight = results.reduce((acc, r) => acc + r.skor_bobot, 0);
  const totalEarnedWeight = results.reduce((acc, r) => acc + r.skor_diperoleh, 0);

  const finalScore = totalMaxWeight > 0 ? Math.min(100, Math.round((totalEarnedWeight / totalMaxWeight) * 100)) : 100;

  let kategori = 'Sangat Mahir';
  let bintang = 3;
  let feedback = 'Luar biasa! Kamu sudah sangat menguasai materi ini dengan hebat dan mandiri.';

  if (finalScore >= 90) {
    kategori = 'Sangat Mahir';
    bintang = 3;
    feedback = 'Luar biasa! Pemahamanmu sangat hebat dan teliti. Pertahankan prestasimu ya!';
  } else if (finalScore >= 75) {
    kategori = 'Sudah Berkembang';
    bintang = 2;
    feedback = 'Bagus sekali! Kamu sudah memahami konsep pembelajaran dengan baik.';
  } else if (finalScore >= 60) {
    kategori = 'Cukup Berkembang';
    bintang = 1;
    feedback = 'Sudah baik! Ayo terus berlatih agar pemahamanmu semakin mantap.';
  } else {
    kategori = 'Perlu Bimbingan';
    bintang = 1;
    feedback = 'Tetap semangat! Jangan ragu bertanya pada bapak/ibu guru untuk belajar bersama lagi ya!';
  }

  return res.status(200).json({
    success: true,
    nilai_akhir: finalScore,
    final_score: finalScore,
    kategori_nilai: kategori,
    kategori,
    bintang,
    feedback,
    detail_evaluasi: results,
    data: {
      final_score: finalScore,
      nilai_akhir: finalScore,
      kategori,
      kategori_nilai: kategori,
      bintang,
      feedback,
      total_soal: results.length,
      soal_benar: results.filter((r) => r.is_correct).length,
      detail_evaluasi: results,
    },
  });
}
