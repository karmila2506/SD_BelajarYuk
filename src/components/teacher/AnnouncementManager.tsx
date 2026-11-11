import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { Pengumuman, Rombel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface AnnouncementManagerProps {
  rombels: Rombel[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({ rombels, onShowToast }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Pengumuman[]>(localDB.getPengumuman());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formRombelId, setFormRombelId] = useState<string>('all');
  const [formJudul, setFormJudul] = useState('');
  const [formKonten, setFormKonten] = useState('');
  const [formPrioritas, setFormPrioritas] = useState<'normal' | 'penting'>('normal');

  const loadData = () => {
    setAnnouncements(localDB.getPengumuman());
  };

  useRealtimeSubscription({
    table: 'pengumuman',
    onChange: () => loadData(),
  });

  if (!user) return null;

  const handleDelete = (id: string) => {
    if (confirm('Hapus pengumuman ini?')) {
      const all = localDB.getPengumuman();
      const updated = all.filter((a) => a.id !== id);
      localDB.savePengumuman(updated);
      loadData();
      onShowToast('Pengumuman berhasil dihapus.', 'info');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formKonten.trim()) {
      alert('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    const newP: Pengumuman = {
      id: `pgm-${Date.now()}`,
      rombel_id: formRombelId === 'all' ? null : formRombelId,
      pembuat_id: user.id,
      pembuat_nama: user.nama,
      pembuat_role: user.role,
      judul: formJudul.trim(),
      konten: formKonten.trim(),
      prioritas: formPrioritas,
      created_at: new Date().toISOString(),
    };

    const all = localDB.getPengumuman();
    all.unshift(newP);
    localDB.savePengumuman(all);

    // Notify users
    const notifs = localDB.getNotifikasi();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: 'all',
      judul: `Pengumuman: ${newP.judul}`,
      pesan: newP.konten.slice(0, 100) + '...',
      tipe: 'pengumuman',
      dibaca: false,
      created_at: new Date().toISOString(),
    });
    localDB.saveNotifikasi(notifs);

    setIsModalOpen(false);
    setFormJudul('');
    setFormKonten('');
    loadData();
    onShowToast('Pengumuman baru berhasil diterbitkan!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          Daftar Pengumuman Kelas & Sekolah
        </h3>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengumuman</span>
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div
            key={a.id}
            className={`p-5 sm:p-6 rounded-3xl border transition flex items-start justify-between gap-4 ${
              a.prioritas === 'penting'
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                    a.prioritas === 'penting'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {a.prioritas === 'penting' ? 'Penting' : 'Info Kelas'}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(a.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-xs text-slate-500">• Oleh: {a.pembuat_nama}</span>
              </div>

              <h4 className="font-extrabold text-slate-800 text-base">{a.judul}</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.konten}</p>
            </div>

            <button
              onClick={() => handleDelete(a.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Hapus pengumuman"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800">Buat Pengumuman Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Kelas</label>
                <select
                  value={formRombelId}
                  onChange={(e) => setFormRombelId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="all">Seluruh Sekolah</option>
                  {rombels.map((r) => (
                    <option key={r.id} value={r.id}>
                      Kelas {r.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Pengingat Tugas Tematik Hari Ini"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
                <select
                  value={formPrioritas}
                  onChange={(e) => setFormPrioritas(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="normal">Normal</option>
                  <option value="penting">Penting (Ditandai Khusus)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pengumuman</label>
                <textarea
                  rows={4}
                  required
                  value={formKonten}
                  onChange={(e) => setFormKonten(e.target.value)}
                  placeholder="Tulis informasi untuk dibaca siswa dan orang tua..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Terbitkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
