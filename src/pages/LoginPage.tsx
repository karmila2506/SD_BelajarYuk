import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  School,
  Star,
  Users,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localDB } from '../lib/supabase';
import { Rombel, UserProfile, School as SchoolType } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginSiswa, loginStaff, loginSuperAdmin, registerUser, user, activeSchoolId, setActiveSchoolId } = useAuth();

  // Mode: LOGIN vs REGISTER
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Role in LOGIN: SISWA vs STAFF vs SUPER_ADMIN
  const [loginRole, setLoginRole] = useState<'SISWA' | 'STAFF' | 'SUPER_ADMIN'>('SISWA');

  // Role in REGISTER: SISWA vs GURU vs ADMIN
  const [registerRole, setRegisterRole] = useState<'SISWA' | 'GURU' | 'ADMIN'>('SISWA');

  // Schools list
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('sch-sdn01');

  // Student login form
  const [nis, setNis] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);

  // Staff login form
  const [email, setEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPass, setShowStaffPass] = useState(false);

  // Super Admin login form
  const [superAdminEmail, setSuperAdminEmail] = useState('superadmin@belajaryuk.id');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [superAdminMasterPin, setSuperAdminMasterPin] = useState('');
  const [showSuperPass, setShowSuperPass] = useState(false);

  // Register form states
  const [regNama, setRegNama] = useState('');
  const [regNisNip, setRegNisNip] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRombelId, setRegRombelId] = useState('');
  const [regAdminCode, setRegAdminCode] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const sList = localDB.getSchools();
    setSchools(sList);
    if (sList.length > 0) {
      setSelectedSchoolId(activeSchoolId || sList[0].id);
    }

    const rList = localDB.getRombel();
    setRombels(rList);
    setAllProfiles(localDB.getProfiles());
    if (rList.length > 0 && !regRombelId) {
      setRegRombelId(rList[0].id);
    }
  }, [activeSchoolId]);

  // Handle Rombel selection in register to auto-suggest NIS
  const handleRombelChange = (rombelId: string) => {
    setRegRombelId(rombelId);
    const selectedR = rombels.find((r) => r.id === rombelId);
    if (selectedR && registerRole === 'SISWA') {
      const existingInClass = allProfiles.filter(
        (p) => p.role === 'SISWA' && p.rombel_id === rombelId
      );
      const nextNum = selectedR.tingkat_kelas * 1000 + (existingInClass.length + 1);
      setRegNisNip(String(nextNum));
    }
  };

  // Student Login Submit
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) {
      setErrorMsg('Tuliskan Nomor Induk Siswa (NIS) kamu dulu ya!');
      return;
    }
    if (!studentPassword.trim()) {
      setErrorMsg('Kata sandi belum diisi.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const result = await loginSiswa(nis.trim(), studentPassword, selectedSchoolId);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || 'Gagal masuk. Periksa kembali NIS dan kata sandimu.');
    }
  };

  // Staff Login Submit
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !staffPassword.trim()) {
      setErrorMsg('Email/NIP dan kata sandi wajib diisi.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const result = await loginStaff(email.trim(), staffPassword, selectedSchoolId);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || 'Email atau kata sandi tidak sesuai.');
    }
  };

  // Super Admin Login Submit
  const handleSuperAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!superAdminEmail.trim() || !superAdminPassword.trim()) {
      setErrorMsg('Email dan kata sandi Super Admin wajib diisi.');
      return;
    }
    if (!superAdminMasterPin.trim()) {
      setErrorMsg('Kunci Keamanan Master (PIN) Super Admin wajib diisi.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const result = await loginSuperAdmin(superAdminEmail.trim(), superAdminPassword.trim(), superAdminMasterPin.trim());
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || 'Autentikasi Super Admin gagal.');
    }
  };

  // Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regNama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setErrorMsg('Kata sandi minimal 4 karakter.');
      return;
    }

    const targetSchool = schools.find((s) => s.id === selectedSchoolId) || schools[0];

    // Role specific validation
    if (registerRole === 'SISWA') {
      if (!regNisNip.trim()) {
        setErrorMsg('Nomor Induk Siswa (NIS) wajib diisi.');
        return;
      }
      const targetRombel = rombels.find((r) => r.id === regRombelId) || rombels[0];
      setIsLoading(true);
      const res = await registerUser(
        {
          nama: regNama.trim(),
          nis_nip: regNisNip.trim(),
          email: `${regNisNip.trim()}@belajaryuk.local`,
          role: 'SISWA',
          school_id: targetSchool?.id,
          school_nama: targetSchool?.nama,
          tingkat_kelas: targetRombel.tingkat_kelas,
          rombel_id: targetRombel.id,
          rombel_nama: targetRombel.nama,
        },
        regPassword.trim(),
        true
      );
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(`Pendaftaran berhasil! Selamat datang di ${targetSchool?.nama || 'BelajarYuk'}, ${res.user?.nama}! 🎉`);
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setErrorMsg(res.error || 'Pendaftaran gagal.');
      }
    } else if (registerRole === 'GURU') {
      if (!regEmail.trim()) {
        setErrorMsg('Email pendidik wajib diisi.');
        return;
      }
      const targetRombel = rombels.find((r) => r.id === regRombelId) || rombels[0];
      const nip = regNisNip.trim() || `GURU${Math.floor(100 + Math.random() * 900)}`;

      setIsLoading(true);
      const res = await registerUser(
        {
          nama: regNama.trim(),
          nis_nip: nip,
          email: regEmail.trim(),
          role: 'GURU',
          school_id: targetSchool?.id,
          school_nama: targetSchool?.nama,
          tingkat_kelas: targetRombel.tingkat_kelas,
          rombel_id: targetRombel.id,
          rombel_nama: targetRombel.nama,
        },
        regPassword.trim(),
        true
      );
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(`Akun Pendidik berhasil dibuat! Mengalihkan ke dashboard...`);
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setErrorMsg(res.error || 'Pendaftaran gagal.');
      }
    } else if (registerRole === 'ADMIN') {
      if (!regEmail.trim()) {
        setErrorMsg('Email administrator wajib diisi.');
        return;
      }
      // Check admin security pass code
      const cleanCode = regAdminCode.trim().toUpperCase();
      if (cleanCode !== 'SDMERDEKA2025' && cleanCode !== 'BELAJARYUK') {
        setErrorMsg('Kode Lisensi / Verifikasi Sekolah salah. Gunakan kode "SDMERDEKA2025" atau "BELAJARYUK".');
        return;
      }

      setIsLoading(true);
      const res = await registerUser(
        {
          nama: regNama.trim(),
          nis_nip: `ADMIN${Math.floor(10 + Math.random() * 90)}`,
          email: regEmail.trim(),
          role: 'ADMIN',
          school_id: targetSchool?.id,
          school_nama: targetSchool?.nama,
        },
        regPassword.trim(),
        true
      );
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg(`Akun Administrator untuk ${targetSchool?.nama || 'Sekolah'} berhasil didaftarkan! Mengalihkan...`);
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setErrorMsg(res.error || 'Pendaftaran gagal.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Branding */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Belajar<span className="text-blue-600">Yuk</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                SD Merdeka
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              E-Learning 6 Kelas SD • 30 Siswa & 6 Wali Kelas
            </p>
          </div>
        </div>

        {/* Global Mode Switcher Button */}
        <div className="flex items-center bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              authMode === 'LOGIN'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk (Sign In)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('REGISTER');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              authMode === 'REGISTER'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun Baru (Sign Up)</span>
          </button>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="max-w-2xl w-full mx-auto my-6 sm:my-8">
        <div className="bg-white rounded-4xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-hidden relative">
          {/* Header Switcher Inside Card */}
          <div className="flex border-b border-slate-100 pb-4 mb-6 items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                {authMode === 'LOGIN' ? (
                  <>
                    <span>Selamat Datang Kembali</span>
                    <span className="text-blue-600">👋</span>
                  </>
                ) : (
                  <>
                    <span>Registrasi Akun Baru</span>
                    <span className="text-emerald-500">✨</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {authMode === 'LOGIN'
                  ? 'Masukkan NIS/Email dan kata sandi untuk masuk dengan aman.'
                  : 'Daftarkan siswa, guru pengajar, atau admin sekolah baru secara terstruktur.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition"
            >
              {authMode === 'LOGIN' ? '+ Daftar Akun Baru' : 'Sudah punya akun? Masuk'}
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ====================================================================== */}
          {/* MODE 1: LOGIN (SIGN IN) */}
          {/* ====================================================================== */}
          {authMode === 'LOGIN' && (
            <div className="space-y-6">
              {/* Tab Selector: Siswa vs Staff vs Super Admin */}
              <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginRole('SISWA');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                    loginRole === 'SISWA'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Siswa SD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginRole('STAFF');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                    loginRole === 'STAFF'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <School className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guru & Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginRole('SUPER_ADMIN');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                    loginRole === 'SUPER_ADMIN'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-rose-500/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Super Admin</span>
                </button>
              </div>

              {/* School Selector (for Siswa and Staff) */}
              {loginRole !== 'SUPER_ADMIN' && schools.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <School className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Sekolah Kamu:</span>
                  </div>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => {
                      setSelectedSchoolId(e.target.value);
                      setActiveSchoolId(e.target.value);
                    }}
                    className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    {schools.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.nama} {sc.status_aktif ? '✓' : '(Nonaktif/Ditangguhkan)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* STUDENT LOGIN FORM */}
              {loginRole === 'SISWA' && (
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nomor Induk Siswa (NIS)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="Contoh: 1001 (Kelas 1), 2001 (Kelas 2), 3001 (Kelas 3)..."
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 text-base font-bold tracking-wide"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showStudentPass ? 'text' : 'password'}
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Contoh: budi123 atau 123456"
                        className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 text-base font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPass(!showStudentPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition p-1"
                        title={showStudentPass ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      >
                        {showStudentPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base transition flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 disabled:opacity-50 mt-2"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>{isLoading ? 'Sedang Masuk...' : 'Masuk Belajar Sekarang! 🚀'}</span>
                  </button>
                </form>
              )}

              {/* STAFF LOGIN FORM */}
              {loginRole === 'STAFF' && (
                <form onSubmit={handleStaffSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email atau NIP Pendidik / Admin
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="guru.sri@belajaryuk.id atau admin@belajaryuk.id"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-slate-800 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showStaffPass ? 'text' : 'password'}
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Masukkan kata sandi (bawaan: guru123 / admin123 / 123456)"
                        className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-slate-800 text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPass(!showStaffPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition p-1"
                      >
                        {showStaffPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Dashboard Guru / Admin'}</span>
                  </button>
                </form>
              )}

              {/* SUPER ADMIN LOGIN FORM */}
              {loginRole === 'SUPER_ADMIN' && (
                <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <div className="font-black flex items-center gap-1.5 mb-0.5">
                      <Crown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Akses Khusus Pengelola Platform BelajarYuk</span>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Memerlukan Kunci Keamanan Master (PIN) 2FA untuk mengakses pusat kendali multi-tenant.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Super Admin
                    </label>
                    <input
                      type="email"
                      value={superAdminEmail}
                      onChange={(e) => setSuperAdminEmail(e.target.value)}
                      placeholder="superadmin@belajaryuk.id"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showSuperPass ? 'text' : 'password'}
                        value={superAdminPassword}
                        onChange={(e) => setSuperAdminPassword(e.target.value)}
                        placeholder="Masukkan kata sandi Super Admin"
                        className="w-full px-4 py-3.5 pr-12 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-semibold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSuperPass(!showSuperPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition p-1"
                      >
                        {showSuperPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kunci Keamanan Master (Security PIN)
                    </label>
                    <input
                      type="password"
                      value={superAdminMasterPin}
                      onChange={(e) => setSuperAdminMasterPin(e.target.value)}
                      placeholder="Masukkan PIN Master (bawaan: MERDEKA99)"
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-rose-500 text-sm font-bold tracking-widest font-mono"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 disabled:opacity-50 mt-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>{isLoading ? 'Memverifikasi Akses Master...' : 'Buka Dashboard Super Admin'}</span>
                  </button>
                </form>
              )}

              {/* PANDUAN MASUK AKUN & KEAMANAN SISTEM (MENGGANTIKAN 1-KLIK DEMO) */}
              <div className="pt-5 border-t border-slate-100">
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2 text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Keamanan Akun Terproteksi (Autentikasi Sandi & PIN)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                    Uji coba 1-klik instan telah dinonaktifkan demi menjaga integritas data setiap pengguna. Silakan masuk dengan kredensial terverifikasi berikut:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-blue-700 flex items-center gap-1.5 mb-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>Siswa SD</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <strong className="text-slate-800">NIS:</strong> 1001-1005 (Kls 1) s/d 6001-6005 (Kls 6)
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <strong className="text-slate-800">Sandi:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-bold">123456</code>
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                        <School className="w-3.5 h-3.5 text-amber-600" />
                        <span>Guru / Wali</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        <strong className="text-slate-800">Email:</strong> guru.sri@belajaryuk.id
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <strong className="text-slate-800">Sandi:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-bold">guru123</code>
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-purple-700 flex items-center gap-1.5 mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>Admin Sekolah</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        <strong className="text-slate-800">Email:</strong> admin@belajaryuk.id
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <strong className="text-slate-800">Sandi:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-bold">admin123</code>
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/30">
                      <div className="font-bold text-rose-700 flex items-center gap-1.5 mb-1">
                        <Crown className="w-3.5 h-3.5 text-rose-600" />
                        <span>Super Admin</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">
                        <strong className="text-slate-800">Email:</strong> superadmin@belajaryuk.id
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        <strong className="text-slate-800">Sandi:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-bold">superadmin123</code>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        PIN: <code className="bg-rose-100 px-1 py-0.2 rounded text-rose-800 font-bold">MERDEKA99</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================================================================== */}
          {/* MODE 2: REGISTRASI AKUN BARU (SIGN UP) */}
          {/* ====================================================================== */}
          {authMode === 'REGISTER' && (
            <div className="space-y-6">
              {/* Role Selector: SISWA vs GURU vs ADMIN */}
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterRole('SISWA');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                    registerRole === 'SISWA'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Daftar Siswa SD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegisterRole('GURU');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                    registerRole === 'GURU'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <School className="w-3.5 h-3.5 text-white" />
                  <span>Daftar Guru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegisterRole('ADMIN');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-1.5 ${
                    registerRole === 'ADMIN'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Administrator</span>
                </button>
              </div>

              {/* REGISTRATION FORM */}
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap {registerRole === 'SISWA' ? 'Siswa' : 'Pendidik / Admin'}
                  </label>
                  <input
                    type="text"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    placeholder={
                      registerRole === 'SISWA'
                        ? 'Contoh: Ahmad Fauzan Pratama'
                        : registerRole === 'GURU'
                        ? 'Contoh: Ibu Rina Melati, S.Pd.'
                        : 'Contoh: Pak Dr. Hendra Setiawan'
                    }
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-semibold"
                    required
                  />
                </div>

                {/* Class / Rombel Selection for Siswa & Guru */}
                {(registerRole === 'SISWA' || registerRole === 'GURU') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {registerRole === 'SISWA' ? 'Pilih Kelas SD' : 'Penugasan Kelas / Wali Kelas'}
                    </label>
                    <select
                      value={regRombelId}
                      onChange={(e) => handleRombelChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-bold bg-white"
                    >
                      {rombels.map((r) => (
                        <option key={r.id} value={r.id}>
                          Kelas {r.tingkat_kelas} - {r.nama} ({r.fase})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* NIS for Siswa */}
                {registerRole === 'SISWA' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nomor Induk Siswa (NIS)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={regNisNip}
                      onChange={(e) => setRegNisNip(e.target.value)}
                      placeholder="Contoh: 1021"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-bold"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      NIS akan digunakan siswa saat masuk ke aplikasi BelajarYuk.
                    </p>
                  </div>
                )}

                {/* Email for Guru / Admin */}
                {(registerRole === 'GURU' || registerRole === 'ADMIN') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Resmi Sekolah
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nama@belajaryuk.id"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-semibold"
                      required
                    />
                  </div>
                )}

                {/* Admin Verification Code */}
                {registerRole === 'ADMIN' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kode Verifikasi / Lisensi Sekolah
                    </label>
                    <input
                      type="text"
                      value={regAdminCode}
                      onChange={(e) => setRegAdminCode(e.target.value)}
                      placeholder="Masukkan kode: SDMERDEKA2025"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-purple-600 text-sm font-bold tracking-wider uppercase"
                      required
                    />
                    <p className="text-[11px] text-purple-600 font-semibold mt-1">
                      Kunci verifikasi bawaan sekolah: <span className="font-mono underline">SDMERDEKA2025</span> atau <span className="font-mono underline">BELAJARYUK</span>
                    </p>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Buat Kata Sandi Akun
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 4 karakter (misal: 123456)"
                      className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition p-1"
                    >
                      {showRegPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 rounded-2xl text-white font-extrabold text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2 ${
                    registerRole === 'SISWA'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                      : registerRole === 'GURU'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                      : 'bg-purple-700 hover:bg-purple-800 shadow-purple-500/25'
                  }`}
                >
                  <UserPlus className="w-5 h-5" />
                  <span>
                    {isLoading
                      ? 'Mendaftarkan Akun...'
                      : registerRole === 'SISWA'
                      ? 'Daftar Siswa & Mulai Belajar! 🎒'
                      : registerRole === 'GURU'
                      ? 'Daftar Guru & Mulai Mengajar! 👩‍🏫'
                      : 'Daftar Administrator 👑'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-slate-500">
        BelajarYuk © 2025 • Platform Edukasi Digital Sekolah Dasar Kurikulum Merdeka (Kelas 1 - 6)
      </footer>
    </div>
  );
};
