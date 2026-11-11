import React, { useState } from 'react';
import { Download, Search, Star, Filter, CheckCircle2 } from 'lucide-react';
import { localDB } from '../../lib/supabase';
import { downloadCSV } from '../../lib/kurikulum';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface SchoolGradeRecapProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SchoolGradeRecap: React.FC<SchoolGradeRecapProps> = ({ onShowToast }) => {
  const [pengumpulanList, setPengumpulanList] = useState(localDB.getPengumpulan());
  const [search, setSearch] = useState('');

  useRealtimeSubscription({
    table: 'pengumpulan',
    onChange: () => {
      setPengumpulanList(localDB.getPengumpulan());
    },
  });

  const handleExportAll = () => {
    if (pengumpulanList.length === 0) {
      alert('Belum ada data nilai tersimpan.');
      return;
    }

    const headers = [
      'Nama Siswa',
      'NIS',
      'Tingkat Kelas',
      'Judul Tugas',
      'Nilai',
      'Predikat Kurikulum',
      'Bintang Apresiasi',
      'Feedback Guru',
      'Status',
      'Waktu Kumpul',
    ];

    const rows = pengumpulanList.map((p) => [
      p.siswa_nama || '-',
      p.siswa_nis || '-',
      p.tingkat_kelas ? `Kelas ${p.tingkat_kelas}` : '-',
      p.tugas_judul || '-',
      p.nilai ?? '-',
      p.kategori_nilai || '-',
      p.bintang ?? '-',
      p.feedback || '-',
      p.status,
      p.submitted_at ? new Date(p.submitted_at).toLocaleString('id-ID') : '-',
    ]);

    const filename = `Rekap_Nilai_Sekolah_BelajarYuk_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, headers, rows);
    onShowToast(`File ${filename} berhasil diunduh!`, 'success');
  };

  const filtered = pengumpulanList.filter(
    (p) =>
      p.siswa_nama?.toLowerCase().includes(search.toLowerCase()) ||
      p.siswa_nis?.toLowerCase().includes(search.toLowerCase()) ||
      p.tugas_judul?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari siswa, NIS, atau tugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          onClick={handleExportAll}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Seluruh Nilai Sekolah (CSV)</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-5 py-4">Siswa</th>
                <th className="px-5 py-4">NIS</th>
                <th className="px-5 py-4">Kelas</th>
                <th className="px-5 py-4">Tugas</th>
                <th className="px-5 py-4 text-center">Nilai</th>
                <th className="px-5 py-4">Capaian</th>
                <th className="px-5 py-4 text-center">Bintang</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-4 font-bold text-slate-800">{p.siswa_nama}</td>
                  <td className="px-5 py-4 text-slate-500 font-mono">{p.siswa_nis}</td>
                  <td className="px-5 py-4 font-semibold text-slate-600">
                    {p.tingkat_kelas ? `Kelas ${p.tingkat_kelas}` : '-'}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700 max-w-[200px] truncate">
                    {p.tugas_judul}
                  </td>
                  <td className="px-5 py-4 text-center font-black text-sm text-blue-600">
                    {p.nilai ?? '-'}
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
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          p.status === 'sudah_dinilai'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {p.status === 'sudah_dinilai' ? 'Dinilai' : 'Menunggu'}
                      </span>
                      {p.is_auto_graded && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200">
                          Auto
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
