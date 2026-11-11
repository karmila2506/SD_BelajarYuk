import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  FileCheck2,
  Activity,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Download,
  School as SchoolIcon,
  Crown,
  Filter,
  RefreshCw,
  Sparkles,
  Calendar,
  Eye,
  Trash2,
  Edit3,
  Sliders,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { School, UserProfile, AuditLog, Role } from '../../types';

interface SuperAdminDashboardProps {
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onShowToast }) => {
  const { user, activeSchoolId, setActiveSchoolId } = useAuth();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SEKOLAH' | 'ADMINS' | 'AUDIT_LOGS' | 'KONFIGURASI'>('OVERVIEW');

  // Data states
  const [schools, setSchools] = useState<School[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filter states
  const [searchSchool, setSearchSchool] = useState('');
  const [filterPackage, setFilterPackage] = useState<string>('ALL');
  const [searchAudit, setSearchAudit] = useState('');
  const [filterAuditSchool, setFilterAuditSchool] = useState<string>('ALL');
  const [filterAuditRole, setFilterAuditRole] = useState<string>('ALL');

  // Modals
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [targetAdminUser, setTargetAdminUser] = useState<UserProfile | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // School Form state
  const [schoolForm, setSchoolForm] = useState({
    npsn: '',
    nama: '',
    jenjang: 'Sekolah Dasar (SD)',
    alamat: '',
    telepon: '',
    email: '',
    kepala_sekolah: '',
    paket_layanan: 'PREMIUM_MERDEKA' as 'STANDAR' | 'PREMIUM_MERDEKA' | 'ENTERPRISE',
    status_aktif: true,
    masa_aktif_sampai: '2026-12-31',
    tahun_ajaran_aktif: '2024/2025',
    semester_aktif: 'Ganjil' as 'Ganjil' | 'Genap',
  });

  // Admin Form state
  const [adminForm, setAdminForm] = useState({
    nama: '',
    email: '',
    password: '',
    school_id: '',
  });

  const loadAllData = () => {
    const s = localDB.getSchools();
    const p = localDB.getProfiles();
    const a = localDB.getAuditLogs();
    setSchools(s);
    setProfiles(p);
    setAuditLogs(a);
    if (s.length > 0 && !adminForm.school_id) {
      setAdminForm((prev) => ({ ...prev, school_id: s[0].id }));
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Platform Metrics
  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.status_aktif).length;
  const inactiveSchools = totalSchools - activeSchools;
  const totalSchoolAdmins = profiles.filter((p) => p.role === 'ADMIN').length;
  const totalTeachers = profiles.filter((p) => p.role === 'GURU').length;
  const totalStudents = profiles.filter((p) => p.role === 'SISWA').length;
  const totalMaterials = localDB.getMateri().length;
  const totalTasks = localDB.getTugas().length;

  // School CRUD
  const handleOpenAddSchool = () => {
    setEditingSchool(null);
    setSchoolForm({
      npsn: '',
      nama: '',
      jenjang: 'Sekolah Dasar (SD)',
      alamat: '',
      telepon: '',
      email: '',
      kepala_sekolah: '',
      paket_layanan: 'PREMIUM_MERDEKA',
      status_aktif: true,
      masa_aktif_sampai: '2026-12-31',
      tahun_ajaran_aktif: '2024/2025',
      semester_aktif: 'Ganjil',
    });
    setShowAddSchoolModal(true);
  };

  const handleOpenEditSchool = (sc: School) => {
    setEditingSchool(sc);
    setSchoolForm({
      npsn: sc.npsn,
      nama: sc.nama,
      jenjang: sc.jenjang,
      alamat: sc.alamat,
      telepon: sc.telepon || '',
      email: sc.email || '',
      kepala_sekolah: sc.kepala_sekolah || '',
      paket_layanan: sc.paket_layanan as any,
      status_aktif: sc.status_aktif,
      masa_aktif_sampai: sc.masa_aktif_sampai,
      tahun_ajaran_aktif: sc.tahun_ajaran_aktif,
      semester_aktif: sc.semester_aktif,
    });
    setShowAddSchoolModal(true);
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.nama.trim() || !schoolForm.npsn.trim()) {
      onShowToast('Nama Sekolah dan NPSN wajib diisi.', 'error');
      return;
    }

    if (editingSchool) {
      localDB.updateSchool(editingSchool.id, {
        ...schoolForm,
      });
      localDB.addAuditLog({
        user_id: user?.id || 'superadmin',
        user_nama: user?.nama || 'Super Admin',
        user_role: 'SUPER_ADMIN',
        school_id: editingSchool.id,
        school_nama: schoolForm.nama,
        aksi: 'UPDATE_SCHOOL',
        deskripsi: `Super Admin memperbarui data sekolah ${schoolForm.nama} (NPSN: ${schoolForm.npsn})`,
      });
      onShowToast(`Sekolah ${schoolForm.nama} berhasil diperbarui!`, 'success');
    } else {
      const newSc = localDB.createSchool({
        ...schoolForm,
      });
      localDB.addAuditLog({
        user_id: user?.id || 'superadmin',
        user_nama: user?.nama || 'Super Admin',
        user_role: 'SUPER_ADMIN',
        school_id: newSc.id,
        school_nama: newSc.nama,
        aksi: 'CREATE_SCHOOL',
        deskripsi: `Super Admin menambahkan sekolah baru: ${newSc.nama} (Paket: ${newSc.paket_layanan})`,
      });
      onShowToast(`Sekolah ${newSc.nama} berhasil didaftarkan!`, 'success');
    }

    setShowAddSchoolModal(false);
    loadAllData();
  };

  const handleToggleSchoolStatus = (sc: School) => {
    const nextStatus = !sc.status_aktif;
    localDB.updateSchool(sc.id, { status_aktif: nextStatus });
    localDB.addAuditLog({
      user_id: user?.id || 'superadmin',
      user_nama: user?.nama || 'Super Admin',
      user_role: 'SUPER_ADMIN',
      school_id: sc.id,
      school_nama: sc.nama,
      aksi: nextStatus ? 'ACTIVATE_SCHOOL' : 'SUSPEND_SCHOOL',
      deskripsi: `Super Admin mengubah status sekolah ${sc.nama} menjadi ${nextStatus ? 'AKTIF' : 'DITANGGUHKAN/NONAKTIF'}`,
    });
    onShowToast(`Status ${sc.nama} kini ${nextStatus ? 'Aktif' : 'Nonaktif/Ditangguhkan'}`, 'info');
    loadAllData();
  };

  const handleDeleteSchool = (sc: School) => {
    if (!window.confirm(`PERINGATAN KEAMANAN:\nApakah Anda yakin ingin menghapus sekolah "${sc.nama}"?\nSeluruh data yang terikat akan dihapus secara permanen.`)) {
      return;
    }
    localDB.deleteSchool(sc.id);
    localDB.addAuditLog({
      user_id: user?.id || 'superadmin',
      user_nama: user?.nama || 'Super Admin',
      user_role: 'SUPER_ADMIN',
      school_id: sc.id,
      school_nama: sc.nama,
      aksi: 'DELETE_SCHOOL',
      deskripsi: `Super Admin menghapus sekolah ${sc.nama} (NPSN: ${sc.npsn}) dari sistem.`,
    });
    onShowToast(`Sekolah ${sc.nama} telah dihapus.`, 'info');
    loadAllData();
  };

  // Add School Admin
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.nama.trim() || !adminForm.email.trim() || !adminForm.password.trim() || !adminForm.school_id) {
      onShowToast('Seluruh kolom form administrator wajib diisi.', 'error');
      return;
    }

    const targetSchool = schools.find((s) => s.id === adminForm.school_id);
    if (!targetSchool) {
      onShowToast('Pilih sekolah yang valid.', 'error');
      return;
    }

    const res = await localDB.registerUser(
      {
        nama: adminForm.nama.trim(),
        email: adminForm.email.trim(),
        nis_nip: `ADM-${Math.floor(100 + Math.random() * 900)}`,
        role: 'ADMIN',
        school_id: targetSchool.id,
        school_nama: targetSchool.nama,
      },
      adminForm.password.trim()
    );

    if (res.success) {
      localDB.addAuditLog({
        user_id: user?.id || 'superadmin',
        user_nama: user?.nama || 'Super Admin',
        user_role: 'SUPER_ADMIN',
        school_id: targetSchool.id,
        school_nama: targetSchool.nama,
        aksi: 'PROVISION_ADMIN',
        deskripsi: `Super Admin membuat akun administrator baru (${adminForm.nama} - ${adminForm.email}) untuk ${targetSchool.nama}`,
      });
      onShowToast(`Akun Admin untuk ${targetSchool.nama} berhasil dibuat!`, 'success');
      setShowAddAdminModal(false);
      setAdminForm({ nama: '', email: '', password: '', school_id: schools[0]?.id || '' });
      loadAllData();
    } else {
      onShowToast(res.error || 'Gagal membuat admin sekolah.', 'error');
    }
  };

  // Reset Admin Password
  const handleResetPassword = () => {
    if (!targetAdminUser || !newAdminPassword.trim()) {
      onShowToast('Kata sandi baru wajib diisi.', 'error');
      return;
    }
    const res = localDB.updatePassword(targetAdminUser.id, newAdminPassword.trim());
    if (res.success) {
      localDB.addAuditLog({
        user_id: user?.id || 'superadmin',
        user_nama: user?.nama || 'Super Admin',
        user_role: 'SUPER_ADMIN',
        school_id: targetAdminUser.school_id,
        school_nama: targetAdminUser.school_nama,
        aksi: 'RESET_PASSWORD',
        deskripsi: `Super Admin me-reset kata sandi akun ${targetAdminUser.nama} (${targetAdminUser.email})`,
      });
      onShowToast(`Kata sandi akun ${targetAdminUser.nama} berhasil direset!`, 'success');
      setShowResetPasswordModal(false);
      setTargetAdminUser(null);
      setNewAdminPassword('');
    } else {
      onShowToast('Gagal mereset kata sandi.', 'error');
    }
  };

  // Export Audit Logs to CSV
  const handleExportAuditLogsCSV = () => {
    if (auditLogs.length === 0) {
      onShowToast('Belum ada log aktivitas untuk diekspor.', 'info');
      return;
    }

    const headers = ['Waktu (ISO)', 'Aktor', 'Role', 'Sekolah', 'Aksi', 'Keterangan', 'IP Address'];
    const rows = auditLogs.map((log) => [
      `"${log.created_at || log.timestamp || ''}"`,
      `"${log.user_nama.replace(/"/g, '""')}"`,
      `"${log.user_role}"`,
      `"${(log.school_nama || 'Platform Global').replace(/"/g, '""')}"`,
      `"${log.aksi || log.action || ''}"`,
      `"${(log.deskripsi || log.details || '').replace(/"/g, '""')}"`,
      `"${log.ip_address || '127.0.0.1'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BelajarYuk_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Audit Log berhasil diekspor ke CSV!', 'success');
  };

  // Filtered Schools
  const filteredSchools = schools.filter((sc) => {
    const matchSearch =
      sc.nama.toLowerCase().includes(searchSchool.toLowerCase()) ||
      sc.npsn.includes(searchSchool) ||
      (sc.kepala_sekolah && sc.kepala_sekolah.toLowerCase().includes(searchSchool.toLowerCase()));
    const matchPkg = filterPackage === 'ALL' || sc.paket_layanan === filterPackage;
    return matchSearch && matchPkg;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchSchool = filterAuditSchool === 'ALL' || log.school_id === filterAuditSchool;
    const matchRole = filterAuditRole === 'ALL' || log.user_role === filterAuditRole;
    const matchText =
      !searchAudit ||
      log.user_nama.toLowerCase().includes(searchAudit.toLowerCase()) ||
      (log.deskripsi && log.deskripsi.toLowerCase().includes(searchAudit.toLowerCase())) ||
      log.aksi.toLowerCase().includes(searchAudit.toLowerCase());
    return matchSchool && matchRole && matchText;
  });

  const schoolAdminsList = profiles.filter((p) => p.role === 'ADMIN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-8 animate-in fade-in">
      {/* Super Admin Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-4xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-rose-400" />
              <span>SUPER ADMIN • PENGELOLA UTAMA PLATFORM BELAJARYUK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pusat Manajemen Multi-Tenant & Lisensi Sekolah
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau ekosistem sekolah dasar di Indonesia, lisensi Kurikulum Merdeka, penugasan admin sekolah, dan audit keamanan sistem dalam satu kendali terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddSchool}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sekolah Baru</span>
            </button>
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md transition flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>Buat Akun Admin</span>
            </button>
          </div>
        </div>

        {/* Global Active School Selector / Inspector */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <SchoolIcon className="w-4 h-4 text-indigo-400" />
            <span className="font-bold">Fokus Inspeksi Sekolah Saat Ini:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-400/30">
              {schools.find((s) => s.id === activeSchoolId)?.nama || 'SD Negeri 01 Merdeka Mandiri (Bawaan)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Ganti Target Sekolah:
            </label>
            <select
              value={activeSchoolId || ''}
              onChange={(e) => {
                setActiveSchoolId(e.target.value);
                const chosen = schools.find((s) => s.id === e.target.value);
                onShowToast(`Beralih fokus ke sekolah: ${chosen?.nama}`, 'info');
              }}
              className="bg-slate-800/90 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400"
            >
              {schools.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.nama} ({sc.status_aktif ? 'Aktif' : 'Nonaktif'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shrink-0 ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Statistik Platform</span>
        </button>

        <button
          onClick={() => setActiveTab('SEKOLAH')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shrink-0 ${
            activeTab === 'SEKOLAH'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Manajemen Sekolah ({schools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ADMINS')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shrink-0 ${
            activeTab === 'ADMINS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Admin Sekolah ({schoolAdminsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shrink-0 ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Audit Log Aktivitas ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('KONFIGURASI')}
          className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shrink-0 ${
            activeTab === 'KONFIGURASI'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Konfigurasi & Paket</span>
        </button>
      </div>

      {/* ====================================================================== */}
      {/* TAB 1: OVERVIEW & STATISTIK */}
      {/* ====================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sekolah Terdaftar</span>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{totalSchools}</div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <span className="text-emerald-600 font-bold">{activeSchools} Aktif</span>
                <span>•</span>
                <span className="text-rose-600 font-bold">{inactiveSchools} Ditangguhkan</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guru & Pendidik</span>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{totalTeachers}</div>
              <p className="text-xs text-slate-500 font-semibold">
                {totalSchoolAdmins} Admin Sekolah Pengelola
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa Aktif</span>
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{totalStudents}</div>
              <p className="text-xs text-slate-500 font-semibold">
                Tersebar di 6 Tingkat Kelas SD
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Materi & Tugas</span>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{totalMaterials + totalTasks}</div>
              <p className="text-xs text-slate-500 font-semibold">
                {totalMaterials} Materi • {totalTasks} Tugas/Kuis
              </p>
            </div>
          </div>

          {/* Service Package Distribution & Health Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Distribusi Paket Layanan</span>
              </h3>
              <div className="space-y-3">
                {['PREMIUM_MERDEKA', 'STANDAR', 'ENTERPRISE'].map((pkg) => {
                  const count = schools.filter((s) => s.paket_layanan === pkg).length;
                  const pct = totalSchools > 0 ? Math.round((count / totalSchools) * 100) : 0;
                  return (
                    <div key={pkg} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{pkg.replace('_', ' ')}</span>
                        <span>{count} Sekolah ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pkg === 'PREMIUM_MERDEKA'
                              ? 'bg-amber-500'
                              : pkg === 'ENTERPRISE'
                              ? 'bg-purple-600'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Aktivitas Sistem Terbaru</span>
                </h3>
                <button
                  onClick={() => setActiveTab('AUDIT_LOGS')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Lihat Seluruh Log &rarr;
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">{log.user_nama}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {log.user_role}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {log.school_nama || 'Platform'}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.deskripsi || log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.created_at || log.timestamp || Date.now()).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: MANAJEMEN SEKOLAH */}
      {/* ====================================================================== */}
      {activeTab === 'SEKOLAH' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Daftar Sekolah Terdaftar</h2>
              <p className="text-xs text-slate-500">
                Kelola izin penggunaan, paket lisensi Kurikulum Merdeka, dan status keaktifan sekolah mitra.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchSchool}
                  onChange={(e) => setSearchSchool(e.target.value)}
                  placeholder="Cari nama sekolah / NPSN..."
                  className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500 w-48 sm:w-60"
                />
              </div>

              {/* Package filter */}
              <select
                value={filterPackage}
                onChange={(e) => setFilterPackage(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="ALL">Semua Paket</option>
                <option value="PREMIUM_MERDEKA">Premium Merdeka</option>
                <option value="STANDAR">Standar</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>

              <button
                onClick={handleOpenAddSchool}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sekolah</span>
              </button>
            </div>
          </div>

          {/* School Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sekolah & NPSN</th>
                  <th className="py-3 px-4">Kepala Sekolah</th>
                  <th className="py-3 px-4">Paket Layanan</th>
                  <th className="py-3 px-4">Tahun Ajaran</th>
                  <th className="py-3 px-4">Masa Aktif</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredSchools.map((sc) => {
                  const studentCount = profiles.filter((p) => p.role === 'SISWA' && p.school_id === sc.id).length;
                  const teacherCount = profiles.filter((p) => p.role === 'GURU' && p.school_id === sc.id).length;

                  return (
                    <tr key={sc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100">
                            <SchoolIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{sc.nama}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              NPSN: {sc.npsn} • {studentCount} Siswa • {teacherCount} Guru
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{sc.kepala_sekolah || '-'}</div>
                        <div className="text-[11px] text-slate-400">{sc.email || sc.telepon || '-'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            sc.paket_layanan === 'PREMIUM_MERDEKA'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : sc.paket_layanan === 'ENTERPRISE'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          <span>{sc.paket_layanan.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800">
                        {sc.tahun_ajaran_aktif} ({sc.semester_aktif})
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {sc.masa_aktif_sampai}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleSchoolStatus(sc)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition ${
                            sc.status_aktif
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                          title="Klik untuk mengubah status aktif/nonaktif"
                        >
                          {sc.status_aktif ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Ditangguhkan</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveSchoolId(sc.id);
                              onShowToast(`Beralih fokus ke ${sc.nama}`, 'info');
                            }}
                            className={`p-1.5 rounded-lg border transition ${
                              activeSchoolId === sc.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                            }`}
                            title="Inspeksi data sekolah ini"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditSchool(sc)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
                            title="Edit Data Sekolah"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSchool(sc)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                            title="Hapus Sekolah"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: ADMIN SEKOLAH */}
      {/* ====================================================================== */}
      {activeTab === 'ADMINS' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Pengelola & Administrator Sekolah</h2>
              <p className="text-xs text-slate-500">
                Daftar akun admin yang memiliki wewenang mengelola data guru, siswa, kelas, dan mapel di masing-masing sekolah.
              </p>
            </div>

            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Akun Admin Sekolah</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolAdminsList.map((adm) => {
              const sc = schools.find((s) => s.id === adm.school_id);

              return (
                <div key={adm.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={adm.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'}
                        alt={adm.nama}
                        className="w-10 h-10 rounded-xl object-cover bg-purple-100 border border-purple-200"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{adm.nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{adm.email}</div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black">
                      ADMIN
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <SchoolIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{sc?.nama || adm.school_nama || 'Sekolah Belum Ditetapkan'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ID Akun: <span className="font-mono">{adm.id}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setTargetAdminUser(adm);
                        setNewAdminPassword('');
                        setShowResetPasswordModal(true);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset Sandi</span>
                    </button>

                    <button
                      onClick={() => {
                        if (sc) {
                          setActiveSchoolId(sc.id);
                          onShowToast(`Beralih fokus ke ${sc.nama}`, 'info');
                        }
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspeksi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 4: AUDIT LOG AKTIVITAS PLATFORM */}
      {/* ====================================================================== */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <span>Audit Log Keamanan & Aktivitas Platform</span>
              </h2>
              <p className="text-xs text-slate-500">
                Rekaman immutable terhadap aktivitas login, perubahan kata sandi, provisi akun, dan modifikasi data penting.
              </p>
            </div>

            <button
              onClick={handleExportAuditLogsCSV}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Audit CSV</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder="Cari aksi, pengguna, catatan..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filterAuditSchool}
              onChange={(e) => setFilterAuditSchool(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">Semua Sekolah & Global</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>

            <select
              value={filterAuditRole}
              onChange={(e) => setFilterAuditRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">Semua Role Pengguna</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin Sekolah</option>
              <option value="GURU">Guru Pendidik</option>
              <option value="SISWA">Siswa SD</option>
            </select>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aktor / Pengguna</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Sekolah</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Keterangan Aktivitas</th>
                  <th className="py-3 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                      Tidak ada catatan audit yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at || log.timestamp || Date.now()).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        {log.user_nama}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            log.user_role === 'SUPER_ADMIN'
                              ? 'bg-rose-100 text-rose-800'
                              : log.user_role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : log.user_role === 'GURU'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.user_role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {log.school_nama || 'Global'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {log.aksi || log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">
                        {log.deskripsi || log.details}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 5: KONFIGURASI GLOBAL & PAKET */}
      {/* ====================================================================== */}
      {activeTab === 'KONFIGURASI' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4 lg:col-span-2">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Konfigurasi Operasional Platform</span>
            </h3>

            <div className="space-y-4 divide-y divide-slate-100">
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">Registrasi Terbuka untuk Sekolah</div>
                  <div className="text-xs text-slate-500">
                    Izinkan guru dan siswa membuat akun melalui kode verifikasi sekolah.
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  AKTIF
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">AI Task & Quiz Generator (Gemini 2.5)</div>
                  <div className="text-xs text-slate-500">
                    Endpoint backend <code className="text-blue-600">/api/generate-task</code> terhubung secara server-side.
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                  ONLINE
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">Isolasi Multi-Tenant Data</div>
                  <div className="text-xs text-slate-500">
                    Pemisahan data kelas, materi, dan tugas antar <code className="text-slate-700">school_id</code> aktif.
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  TERISOLASI
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Tingkat Paket Layanan</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-1">
                <div className="font-black text-amber-900 flex items-center justify-between">
                  <span>PREMIUM MERDEKA</span>
                  <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded-full font-bold">Terpopuler</span>
                </div>
                <p className="text-amber-800">
                  Akses tanpa batas AI Generator, 6 tingkat kelas SD lengkap, kuota upload gambar/dokumen, rekap nilai semester, dan dukungan prioritas.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-1">
                <div className="font-black text-blue-900">STANDAR</div>
                <p className="text-blue-800">
                  Fitur dasar kelas 1–6, kuis manual, materi teks/link, dan rekap pembelajaran sederhana.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-1">
                <div className="font-black text-purple-900">ENTERPRISE (DINAS / YAYASAN)</div>
                <p className="text-purple-800">
                  Dukungan multi-cabang sekolah, integrasi Supabase khusus, SLA 99.9%, dan audit kepatuhan kurikulum.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: TAMBAH / EDIT SEKOLAH */}
      {/* ====================================================================== */}
      {showAddSchoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-4xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingSchool ? 'Edit Data Sekolah' : 'Tambah Sekolah Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Daftarkan sekolah dan konfigurasikan lisensi paket BelajarYuk.
                </p>
              </div>
              <button
                onClick={() => setShowAddSchoolModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Resmi Sekolah *
                  </label>
                  <input
                    type="text"
                    value={schoolForm.nama}
                    onChange={(e) => setSchoolForm({ ...schoolForm, nama: e.target.value })}
                    placeholder="Contoh: SD Negeri 05 Merdeka Sejahtera"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NPSN (Nomor Pokok Sekolah) *
                  </label>
                  <input
                    type="text"
                    value={schoolForm.npsn}
                    onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                    placeholder="Contoh: 20109988"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={schoolForm.kepala_sekolah}
                    onChange={(e) => setSchoolForm({ ...schoolForm, kepala_sekolah: e.target.value })}
                    placeholder="Contoh: Ibu Hj. Sri Rahayu, M.Pd."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat Lengkap Sekolah
                  </label>
                  <input
                    type="text"
                    value={schoolForm.alamat}
                    onChange={(e) => setSchoolForm({ ...schoolForm, alamat: e.target.value })}
                    placeholder="Jl. Pendidikan No. 12, Kelurahan, Kecamatan, Kota"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Paket Layanan
                  </label>
                  <select
                    value={schoolForm.paket_layanan}
                    onChange={(e) => setSchoolForm({ ...schoolForm, paket_layanan: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="PREMIUM_MERDEKA">Premium Merdeka (Lengkap + AI)</option>
                    <option value="STANDAR">Standar</option>
                    <option value="ENTERPRISE">Enterprise (Dinas / Multi-Cabang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Masa Berlaku Lisensi Sampai
                  </label>
                  <input
                    type="date"
                    value={schoolForm.masa_aktif_sampai}
                    onChange={(e) => setSchoolForm({ ...schoolForm, masa_aktif_sampai: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tahun Ajaran Aktif
                  </label>
                  <input
                    type="text"
                    value={schoolForm.tahun_ajaran_aktif}
                    onChange={(e) => setSchoolForm({ ...schoolForm, tahun_ajaran_aktif: e.target.value })}
                    placeholder="2024/2025"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Semester Aktif
                  </label>
                  <select
                    value={schoolForm.semester_aktif}
                    onChange={(e) => setSchoolForm({ ...schoolForm, semester_aktif: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSchoolModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSchool ? 'Simpan Perubahan' : 'Daftarkan Sekolah'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: BUAT AKUN ADMIN SEKOLAH */}
      {/* ====================================================================== */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-4xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Buat Akun Admin Sekolah</h3>
                <p className="text-xs text-slate-500">
                  Tugaskan administrator resmi untuk sekolah mitra.
                </p>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Sekolah Mitra *
                </label>
                <select
                  value={adminForm.school_id}
                  onChange={(e) => setAdminForm({ ...adminForm, school_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-purple-600 bg-white"
                  required
                >
                  {schools.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.nama} (NPSN: {sc.npsn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Administrator *
                </label>
                <input
                  type="text"
                  value={adminForm.nama}
                  onChange={(e) => setAdminForm({ ...adminForm, nama: e.target.value })}
                  placeholder="Contoh: Pak Budi Santoso, S.Kom."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Administrator *
                </label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="admin@sdn05.sch.id"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi Sementara *
                </label>
                <input
                  type="text"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter (misal: admin123)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-purple-600 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Buat Akun Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL: RESET PASSWORD ADMIN */}
      {/* ====================================================================== */}
      {showResetPasswordModal && targetAdminUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Reset Kata Sandi</h4>
                <p className="text-xs text-slate-500">{targetAdminUser.nama}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="text"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Masukkan sandi baru"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm"
              >
                Simpan Sandi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
