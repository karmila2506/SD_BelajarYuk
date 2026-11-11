import React, { useState } from 'react';
import { School, BookOpen, Plus, Trash2, Edit2, Users, Check, X, ShieldCheck } from 'lucide-react';
import { Rombel, MataPelajaran, UserProfile, FaseKurikulum } from '../../types';
import { localDB } from '../../lib/supabase';
import { getFaseFromKelas } from '../../lib/kurikulum';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface RombelMapelManagerProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RombelMapelManager: React.FC<RombelMapelManagerProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'rombel' | 'mapel'>('rombel');
  const [rombels, setRombels] = useState<Rombel[]>(localDB.getRombel());
  const [mapels, setMapels] = useState<MataPelajaran[]>(localDB.getMapel());
  const [teachers, setTeachers] = useState<UserProfile[]>(
    localDB.getProfiles().filter((p) => p.role === 'GURU')
  );

  // Modal Rombel
  const [isRombelModalOpen, setIsRombelModalOpen] = useState(false);
  const [editingRombel, setEditingRombel] = useState<Rombel | null>(null);
  const [formRombelNama, setFormRombelNama] = useState('');
  const [formTingkatKelas, setFormTingkatKelas] = useState(1);
  const [formWaliKelasId, setFormWaliKelasId] = useState(teachers[0]?.id || '');

  // Modal Mapel
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
  const [formMapelNama, setFormMapelNama] = useState('');
  const [formMapelKode, setFormMapelKode] = useState('');
  const [formFaseTersedia, setFormFaseTersedia] = useState<'SEMUA' | 'FASE_B_C' | 'FASE_A'>('SEMUA');
  const [formWarna, setFormWarna] = useState('blue');

  const loadData = () => {
    setRombels(localDB.getRombel());
    setMapels(localDB.getMapel());
    setTeachers(localDB.getProfiles().filter((p) => p.role === 'GURU'));
  };

  useRealtimeSubscription({
    table: 'rombel',
    onChange: () => loadData(),
  });
  useRealtimeSubscription({
    table: 'mapel',
    onChange: () => loadData(),
  });
  useRealtimeSubscription({
    table: 'profiles',
    onChange: () => loadData(),
  });

  // Rombel Actions
  const handleOpenCreateRombel = () => {
    setEditingRombel(null);
    setFormRombelNama('');
    setFormTingkatKelas(1);
    setFormWaliKelasId(teachers[0]?.id || '');
    setIsRombelModalOpen(true);
  };

  const handleOpenEditRombel = (r: Rombel) => {
    setEditingRombel(r);
    setFormRombelNama(r.nama);
    setFormTingkatKelas(r.tingkat_kelas);
    setFormWaliKelasId(r.wali_kelas_id || teachers[0]?.id || '');
    setIsRombelModalOpen(true);
  };

  const handleDeleteRombel = (id: string) => {
    if (confirm('Yakin ingin menghapus rombel kelas ini?')) {
      const all = localDB.getRombel();
      const updated = all.filter((r) => r.id !== id);
      localDB.saveRombel(updated);
      loadData();
      onShowToast('Rombel kelas berhasil dihapus.', 'info');
    }
  };

  const handleSaveRombel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRombelNama.trim()) return;

    const all = localDB.getRombel();
    const wali = teachers.find((t) => t.id === formWaliKelasId);
    const fase = getFaseFromKelas(formTingkatKelas);

    if (editingRombel) {
      const updated = all.map((r) => {
        if (r.id === editingRombel.id) {
          return {
            ...r,
            nama: formRombelNama.trim(),
            tingkat_kelas: formTingkatKelas,
            fase,
            wali_kelas_id: formWaliKelasId,
            wali_kelas_nama: wali?.nama,
          };
        }
        return r;
      });
      localDB.saveRombel(updated);
      onShowToast('Rombel kelas berhasil diperbarui!', 'success');
    } else {
      const newR: Rombel = {
        id: `rmb-${Date.now()}`,
        nama: formRombelNama.trim(),
        tingkat_kelas: formTingkatKelas,
        fase,
        tahun_ajaran: '2024/2025',
        wali_kelas_id: formWaliKelasId,
        wali_kelas_nama: wali?.nama,
        total_siswa: 0,
      };
      all.push(newR);
      localDB.saveRombel(all);
      onShowToast(`Rombel ${newR.nama} berhasil ditambahkan!`, 'success');
    }

    setIsRombelModalOpen(false);
    loadData();
  };

  // Mapel Actions
  const handleOpenCreateMapel = () => {
    setEditingMapel(null);
    setFormMapelNama('');
    setFormMapelKode('');
    setFormFaseTersedia('SEMUA');
    setFormWarna('blue');
    setIsMapelModalOpen(true);
  };

  const handleOpenEditMapel = (m: MataPelajaran) => {
    setEditingMapel(m);
    setFormMapelNama(m.nama);
    setFormMapelKode(m.kode);
    setFormFaseTersedia(m.fase_tersedia as any);
    setFormWarna(m.warna);
    setIsMapelModalOpen(true);
  };

  const handleDeleteMapel = (id: string) => {
    if (confirm('Yakin ingin menghapus mata pelajaran ini?')) {
      const all = localDB.getMapel();
      const updated = all.filter((m) => m.id !== id);
      localDB.saveMapel(updated);
      loadData();
      onShowToast('Mata pelajaran berhasil dihapus.', 'info');
    }
  };

  const handleSaveMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMapelNama.trim() || !formMapelKode.trim()) return;

    const all = localDB.getMapel();
    if (editingMapel) {
      const updated = all.map((m) => {
        if (m.id === editingMapel.id) {
          return {
            ...m,
            nama: formMapelNama.trim(),
            kode: formMapelKode.trim().toUpperCase(),
            fase_tersedia: formFaseTersedia,
            warna: formWarna,
          };
        }
        return m;
      });
      localDB.saveMapel(updated);
      onShowToast('Mata pelajaran diperbarui!', 'success');
    } else {
      const newM: MataPelajaran = {
        id: `mpl-${Date.now()}`,
        nama: formMapelNama.trim(),
        kode: formMapelKode.trim().toUpperCase(),
        kategori: 'Wajib',
        fase_tersedia: formFaseTersedia,
        warna: formWarna,
        ikon: 'BookOpen',
        deskripsi: 'Kurikulum Merdeka SD',
      };
      all.push(newM);
      localDB.saveMapel(all);
      onShowToast('Mata pelajaran baru berhasil ditambahkan!', 'success');
    }

    setIsMapelModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveSubTab('rombel')}
          className={`pb-3 font-extrabold text-sm transition relative flex items-center gap-2 ${
            activeSubTab === 'rombel' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Kelola Rombel / Kelas ({rombels.length})</span>
          {activeSubTab === 'rombel' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('mapel')}
          className={`pb-3 font-extrabold text-sm transition relative flex items-center gap-2 ${
            activeSubTab === 'mapel' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mata Pelajaran Kurikulum Merdeka ({mapels.length})</span>
          {activeSubTab === 'mapel' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* SUBTAB: ROMBEL */}
      {activeSubTab === 'rombel' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Daftar rombongan belajar (rombel) SD kelas 1 sampai 6 beserta penetapan wali kelasnya.
            </p>
            <button
              onClick={handleOpenCreateRombel}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rombel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rombels.map((r) => {
              const studentCount = localDB
                .getProfiles()
                .filter((p) => p.role === 'SISWA' && p.rombel_id === r.id).length;

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        {r.fase}
                      </span>
                      <span className="text-xs font-bold text-slate-400">Kelas {r.tingkat_kelas}</span>
                    </div>

                    <h4 className="font-extrabold text-lg text-slate-800 mt-1">{r.nama}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Wali Kelas: <strong className="text-slate-700">{r.wali_kelas_nama || 'Belum Ditetapkan'}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Siswa Terdaftar: <strong className="text-blue-600">{studentCount} Siswa</strong>
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEditRombel(r)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRombel(r.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB: MAPEL */}
      {activeSubTab === 'mapel' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Master mata pelajaran Kurikulum Merdeka Sekolah Dasar (Fase A, B, C).
            </p>
            <button
              onClick={handleOpenCreateMapel}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mapels.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase font-mono">
                      {m.kode}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {m.fase_tersedia === 'FASE_B_C' ? 'Kelas 3-6' : 'Kelas 1-6'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-800">{m.nama}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.deskripsi}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleOpenEditMapel(m)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMapel(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Rombel */}
      {isRombelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-800 mb-3">
              {editingRombel ? 'Edit Rombel Kelas' : 'Tambah Rombel Baru'}
            </h3>
            <form onSubmit={handleSaveRombel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Rombel</label>
                <input
                  type="text"
                  required
                  value={formRombelNama}
                  onChange={(e) => setFormRombelNama(e.target.value)}
                  placeholder="Contoh: 1A (Ceria)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                <select
                  value={formTingkatKelas}
                  onChange={(e) => setFormTingkatKelas(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <option key={k} value={k}>
                      Kelas {k} ({getFaseFromKelas(k)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wali Kelas</label>
                <select
                  value={formWaliKelasId}
                  onChange={(e) => setFormWaliKelasId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRombelModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mapel */}
      {isMapelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-800 mb-3">
              {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mapel Baru'}
            </h3>
            <form onSubmit={handleSaveMapel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formMapelNama}
                  onChange={(e) => setFormMapelNama(e.target.value)}
                  placeholder="Contoh: Muatan Lokal Bahasa Daerah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Singkat</label>
                <input
                  type="text"
                  required
                  value={formMapelKode}
                  onChange={(e) => setFormMapelKode(e.target.value)}
                  placeholder="Contoh: MULOK"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tersedia untuk Fase</label>
                <select
                  value={formFaseTersedia}
                  onChange={(e) => setFormFaseTersedia(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="SEMUA">Semua Kelas (Kelas 1 - 6)</option>
                  <option value="FASE_B_C">Fase B & C (Kelas 3 - 6, misal IPAS)</option>
                  <option value="FASE_A">Fase A Saja (Kelas 1 - 2)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapelModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
