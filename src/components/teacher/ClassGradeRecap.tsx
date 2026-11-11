import React, { useState, useEffect } from 'react';
import { Download, Star, Award, Search, Filter } from 'lucide-react';
import { Rombel, Tugas, Pengumpulan, UserProfile } from '../../types';
import { localDB } from '../../lib/supabase';
import { downloadCSV } from '../../lib/kurikulum';
import { SubmissionGradingModal } from './SubmissionGradingModal';

import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface ClassGradeRecapProps {
  rombels: Rombel[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ClassGradeRecap: React.FC<ClassGradeRecapProps> = ({ rombels, onShowToast }) => {
  const [selectedRombelId, setSelectedRombelId] = useState<string>(rombels[0]?.id || '');
  const [pengumpulanList, setPengumpulanList] = useState<Pengumpulan[]>(localDB.getPengumpulan());
  const [selectedSubForGrading, setSelectedSubForGrading] = useState<Pengumpulan | null>(null);

  const loadData = () => {
    setPengumpulanList(localDB.getPengumpulan());
  };

  useEffect(() => {
    if ((!selectedRombelId || !rombels.some((r) => r.id === selectedRombelId)) && rombels.length > 0) {
      setSelectedRombelId(rombels[0].id);
    }
  }, [rombels, selectedRombelId]);

  useRealtimeSubscription({
    table: 'pengumpulan',
    onChange: () => loadData(),
  });

  const currentRombel = rombels.find((r) => r.id === selectedRombelId) || rombels[0];
  const allTugas = localDB.getTugas().filter((t) => t.rombel_id === selectedRombelId);
  const allProfiles = localDB.getProfiles();
  const classStudents = allProfiles.filter(
    (p) => p.role === 'SISWA' && p.rombel_id === selectedRombelId
  );

  const filteredPengumpulan = pengumpulanList.filter((p) => {
    return classStudents.some((st) => st.id === p.siswa_id);
  });

  const handleExportCSV = () => {
    if (filteredPengumpulan.length === 0) {
      alert('Belum ada data nilai pengumpulan pada kelas ini.');
      return;
    }

    const headers = [
      'Nama Siswa',
      'NIS',
      'Judul Tugas',
      'Nilai',
      'Predikat Kurikulum',
      'Bintang',
      'Feedback Guru',
      'Status',
      'Waktu Kumpul',
    ];

    const rows = filteredPengumpulan.map((p) => [
      p.siswa_nama || '-',
      p.siswa_nis || '-',
      p.tugas_judul || '-',
      p.nilai ?? '-',
      p.kategori_nilai || '-',
      p.bintang ?? '-',
      p.feedback || '-',
      p.status,
      p.submitted_at ? new Date(p.submitted_at).toLocaleString('id-ID') : '-',
    ]);

    const filename = `Rekap_Nilai_Kelas_${currentRombel?.nama || 'SD'}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, headers, rows);
    onShowToast(`File ${filename} berhasil diunduh!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={selectedRombelId}
            onChange={(e) => setSelectedRombelId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {rombels.map((r) => (
              <option key={r.id} value={r.id}>
                Kelas {r.nama} ({r.fase})
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-bold">
            {classStudents.length} Siswa Terdaftar
          </span>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Rekap Nilai ke CSV</span>
        </button>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-5 py-4">Siswa</th>
                <th className="px-5 py-4">NIS</th>
                <th className="px-5 py-4">Judul Tugas</th>
                <th className="px-5 py-4 text-center">Nilai</th>
                <th className="px-5 py-4">Predikat Capaian</th>
                <th className="px-5 py-4 text-center">Bintang</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPengumpulan.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                    Belum ada pengumpulan tugas dari siswa kelas ini.
                  </td>
                </tr>
              ) : (
                filteredPengumpulan.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-bold text-slate-800">{p.siswa_nama}</td>
                    <td className="px-5 py-4 text-slate-500 font-semibold">{p.siswa_nis}</td>
                    <td className="px-5 py-4 text-slate-700 font-medium max-w-[200px] truncate">
                      {p.tugas_judul}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.nilai !== null && p.nilai !== undefined ? (
                        <span className="font-black text-sm text-blue-600">{p.nilai}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {p.kategori_nilai || '-'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.bintang ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {p.bintang}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {p.status === 'sudah_dinilai' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            Sudah Dinilai
                          </span>
                          {p.is_auto_graded && (
                            <span className="inline-block px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black border border-indigo-200">
                              ⚡ Auto
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                          Menunggu Penilaian
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedSubForGrading(p)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold transition text-xs"
                      >
                        {p.status === 'sudah_dinilai' ? 'Edit Nilai' : 'Beri Nilai'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubForGrading && (
        <SubmissionGradingModal
          isOpen={Boolean(selectedSubForGrading)}
          onClose={() => setSelectedSubForGrading(null)}
          pengumpulan={selectedSubForGrading}
          onGraded={() => {
            onShowToast('Nilai dan masukan berhasil tersimpan!', 'success');
            loadData();
          }}
        />
      )}
    </div>
  );
};
