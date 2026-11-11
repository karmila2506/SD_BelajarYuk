import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { UserProfile, Role, Rombel } from '../../types';
import { localDB } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface AccountManagerProps {
  rombels: Rombel[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ rombels, onShowToast }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(localDB.getProfiles());
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'GURU' | 'SISWA'>('ALL');
  const [classFilter, setClassFilter] = useState<'ALL' | '1' | '2' | '3' | '4' | '5' | '6'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formNisNip, setFormNisNip] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role>('SISWA');
  const [formKelas, setFormKelas] = useState<number>(1);
  const [formRombelId, setFormRombelId] = useState<string>(rombels[0]?.id || '');
  const [formPassword, setFormPassword] = useState('123456');

  const loadData = () => {
    setProfiles(localDB.getProfiles());
  };

  useRealtimeSubscription({
    table: 'profiles',
    onChange: () => loadData(),
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormNama('');
    setFormNisNip('');
    setFormEmail('');
    setFormRole('SISWA');
    setFormKelas(1);
    setFormRombelId(rombels[0]?.id || '');
    setFormPassword('123456');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormNama(user.nama);
    setFormNisNip(user.nis_nip);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormKelas(user.tingkat_kelas || 1);
    setFormRombelId(user.rombel_id || rombels[0]?.id || '');
    setFormPassword('');
    setIsModalOpen(true);
  };

  const handleToggleAktif = (userId: string) => {
    const all = localDB.getProfiles();
    const updated = all.map((p) => {
      if (p.id === userId) {
        return { ...p, aktif: !p.aktif };
      }
      return p;
    });
    localDB.saveProfiles(updated);
    loadData();
    onShowToast('Status akun berhasil diubah.', 'info');
  };

  const handleResetPassword = (user: UserProfile) => {
    const newPass = prompt(
      `Reset kata sandi untuk ${user.nama} (${user.nis_nip}):`,
      user.role === 'SISWA' ? `${user.nama.split(' ')[0].toLowerCase()}123` : 'guru123'
    );
    if (newPass) {
      localStorage.setItem(`belajaryuk_pwd_${user.id}`, newPass.trim());
      onShowToast(`Kata sandi ${user.nama} diubah menjadi "${newPass.trim()}"`, 'success');
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm('Yakin ingin menghapus akun ini secara permanen?')) {
      const all = localDB.getProfiles();
      const updated = all.filter((p) => p.id !== userId);
      localDB.saveProfiles(updated);
      loadData();
      onShowToast('Akun berhasil dihapus.', 'info');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formNisNip.trim()) {
      alert('Nama dan NIS/NIP wajib diisi!');
      return;
    }

    const all = localDB.getProfiles();
    const currentR = rombels.find((r) => r.id === formRombelId);

    if (editingUser) {
      const updated = all.map((p) => {
        if (p.id === editingUser.id) {
          return {
            ...p,
            nama: formNama.trim(),
            nis_nip: formNisNip.trim(),
            email: formEmail.trim() || `${formNisNip.trim()}@belajaryuk.local`,
            role: formRole,
            tingkat_kelas: formRole === 'SISWA' ? formKelas : undefined,
            rombel_id: formRole === 'SISWA' ? formRombelId : undefined,
            rombel_nama: formRole === 'SISWA' ? currentR?.nama : undefined,
          };
        }
        return p;
      });
      localDB.saveProfiles(updated);
      onShowToast('Data akun berhasil diperbarui!', 'success');
    } else {
      // Check duplicate
      if (all.some((p) => p.nis_nip === formNisNip.trim())) {
        alert('NIS / NIP ini sudah digunakan oleh akun lain!');
        return;
      }

      const newId = `usr-${formRole.toLowerCase()}-${Date.now()}`;
      const newU: UserProfile = {
        id: newId,
        nama: formNama.trim(),
        nis_nip: formNisNip.trim(),
        email: formEmail.trim() || `${formNisNip.trim()}@belajaryuk.local`,
        role: formRole,
        tingkat_kelas: formRole === 'SISWA' ? formKelas : undefined,
        rombel_id: formRole === 'SISWA' ? formRombelId : undefined,
        rombel_nama: formRole === 'SISWA' ? currentR?.nama : undefined,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formNama.trim())}`,
        streak_hari: 1,
        total_bintang: 0,
        aktif: true,
      };

      if (formPassword.trim()) {
        localStorage.setItem(`belajaryuk_pwd_${newId}`, formPassword.trim());
      }

      all.push(newU);
      localDB.saveProfiles(all);
      onShowToast(`Akun ${newU.nama} berhasil didaftarkan!`, 'success');
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleBulkImportCSV = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const all = localDB.getProfiles();
    let imported = 0;

    lines.forEach((line) => {
      const parts = line.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        const [nis, nama, kelasStr, rombelNama] = parts;
        if (nis && nama && !all.some((p) => p.nis_nip === nis)) {
          const kls = parseInt(kelasStr, 10) || 1;
          const rmb = rombels.find((r) => r.nama.includes(rombelNama || '')) || rombels[0];
          const newId = `usr-siswa-${Date.now()}-${imported}`;
          all.push({
            id: newId,
            nama,
            nis_nip: nis,
            email: `${nis}@belajaryuk.local`,
            role: 'SISWA',
            tingkat_kelas: kls,
            rombel_id: rmb?.id,
            rombel_nama: rmb?.nama,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nama)}`,
            streak_hari: 1,
            total_bintang: 0,
            aktif: true,
          });
          imported++;
        }
      }
    });

    localDB.saveProfiles(all);
    loadData();
    setIsImportModalOpen(false);
    setCsvText('');
    onShowToast(`Berhasil mengimpor ${imported} akun siswa!`, 'success');
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchRole = roleFilter === 'ALL' || p.role === roleFilter;
    const matchClass =
      classFilter === 'ALL' || (p.tingkat_kelas && String(p.tingkat_kelas) === classFilter);
    const matchSearch =
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nis_nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchClass && matchSearch;
  });

  const handleExportCSV = () => {
    if (filteredProfiles.length === 0) {
      onShowToast('Tidak ada data pengguna untuk diekspor.', 'info');
      return;
    }
    const headers = ['ID', 'Nama Lengkap', 'NIS / NIP', 'Email', 'Role', 'Tingkat Kelas', 'Rombel', 'Total Bintang', 'Status Aktif'];
    const rows = filteredProfiles.map((p) => [
      `"${p.id}"`,
      `"${p.nama.replace(/"/g, '""')}"`,
      `"${p.nis_nip}"`,
      `"${p.email}"`,
      `"${p.role}"`,
      `"${p.tingkat_kelas || '-'}"`,
      `"${(p.rombel_nama || '-').replace(/"/g, '""')}"`,
      `"${p.total_bintang || 0}"`,
      `"${p.aktif ? 'Aktif' : 'Nonaktif'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Pengguna_BelajarYuk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Data akun berhasil diekspor ke CSV/Excel!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <div className="flex rounded-2xl bg-white border border-slate-200 p-1">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  roleFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Semua ({profiles.length})
              </button>
              <button
                onClick={() => setRoleFilter('GURU')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  roleFilter === 'GURU' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Guru ({profiles.filter((p) => p.role === 'GURU').length})
              </button>
              <button
                onClick={() => setRoleFilter('SISWA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  roleFilter === 'SISWA' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Siswa ({profiles.filter((p) => p.role === 'SISWA').length})
              </button>
            </div>

            {/* Class Filter (Kelas 1-6) */}
            <div className="flex rounded-2xl bg-white border border-slate-200 p-1 overflow-x-auto">
              <button
                onClick={() => setClassFilter('ALL')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                  classFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua Kelas
              </button>
              {(['1', '2', '3', '4', '5', '6'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setClassFilter(k)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                    classFilter === k ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Kls {k} ({profiles.filter((p) => p.role === 'SISWA' && p.tingkat_kelas === Number(k)).length})
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIS, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
            title="Ekspor seluruh daftar pengguna yang terfilter ke format CSV / Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-5 py-4">Nama Lengkap</th>
                <th className="px-5 py-4">NIS / NIP</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Kelas / Rombel</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                        alt={p.nama}
                        className="w-8 h-8 rounded-xl object-cover bg-slate-100"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{p.nama}</div>
                        <div className="text-[11px] text-slate-400">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-700">{p.nis_nip}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                        p.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : p.role === 'GURU'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {p.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-600">
                    {p.role === 'SISWA' ? p.rombel_nama || `Kelas ${p.tingkat_kelas}` : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleAktif(p.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                        p.aktif
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {p.aktif ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleResetPassword(p)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                        title="Reset Kata Sandi"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="Edit Profil"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {p.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Akun Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role)</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Role)}
                  disabled={Boolean(editingUser)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="SISWA">Siswa (Sekolah Dasar)</option>
                  <option value="GURU">Guru Pendidik</option>
                  <option value="ADMIN">Administrator Sekolah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso / Ibu Siti Rahma, S.Pd."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {formRole === 'SISWA' ? 'NIS (Nomor Induk Siswa) *' : 'NIP / ID Guru *'}
                </label>
                <input
                  type="text"
                  required
                  value={formNisNip}
                  onChange={(e) => setFormNisNip(e.target.value)}
                  placeholder={formRole === 'SISWA' ? '1001' : 'GURU101'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              {formRole === 'SISWA' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                    <select
                      value={formKelas}
                      onChange={(e) => setFormKelas(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      {[1, 2, 3, 4, 5, 6].map((k) => (
                        <option key={k} value={k}>
                          Kelas {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rombel</label>
                    <select
                      value={formRombelId}
                      onChange={(e) => setFormRombelId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    >
                      {rombels.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Aktif *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@belajaryuk.id"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Awal
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Bawaan untuk siswa: nama depan kecil + 123 (contoh: budi123)
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
                  <span>Simpan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800">
                Impor Data Siswa Sekaligus (CSV)
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Format per baris: <code className="bg-slate-100 px-1 py-0.5 rounded">NIS, Nama Siswa, Tingkat Kelas (1-6), Nama Rombel</code>
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`1003, Rian Pratama, 1, 1A (Ceria)\n1004, Maya Putri, 1, 1A (Ceria)\n3003, Dimas Anggara, 3, 3A (Kreatif)`}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleBulkImportCSV}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Impor Semua Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
