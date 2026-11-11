import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role, School } from '../types';
import { localDB, realtimeHub } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginSiswa: (nis: string, pinPass: string, schoolId?: string) => Promise<{ success: boolean; error?: string }>;
  loginStaff: (email: string, password: string, schoolId?: string) => Promise<{ success: boolean; error?: string }>;
  loginSuperAdmin: (email: string, password: string, masterPin: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (userProfile: UserProfile) => void;
  registerUser: (
    userData: {
      nama: string;
      nis_nip: string;
      email: string;
      role: Role;
      school_id?: string;
      school_nama?: string;
      tingkat_kelas?: number;
      rombel_id?: string;
      rombel_nama?: string;
    },
    password: string,
    autoLogin?: boolean
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  updateUserPassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  activeSchoolId: string;
  setActiveSchoolId: (schoolId: string) => void;
  onlineUsers: string[];
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState<string>('sch-sdn01');

  useEffect(() => {
    // Check saved session
    const savedUserId = localStorage.getItem('belajaryuk_session_uid');
    if (savedUserId) {
      const profiles = localDB.getProfiles();
      const found = profiles.find((p) => p.id === savedUserId && p.aktif);
      if (found) {
        setUser(found);
        if (found.school_id) {
          setActiveSchoolId(found.school_id);
        }
      } else {
        localStorage.removeItem('belajaryuk_session_uid');
      }
    }
    setLoading(false);

    // Active simulated users from class 1 - 6
    setOnlineUsers([
      'usr-siswa-1-1',
      'usr-siswa-2-1',
      'usr-siswa-3-1',
      'usr-guru-1',
      'usr-guru-3',
      'usr-guru-5',
    ]);

    // Realtime subscription for profile changes (e.g. role update, avatar, status)
    const unsub = realtimeHub.subscribe('profiles', (payload) => {
      if (payload.new && Array.isArray(payload.new)) {
        const currentSavedId = localStorage.getItem('belajaryuk_session_uid');
        if (currentSavedId) {
          const fresh = payload.new.find((p: UserProfile) => p.id === currentSavedId);
          if (fresh) {
            setUser(fresh);
          }
        }
      }
    });

    return () => unsub();
  }, []);

  const refreshUser = () => {
    if (!user) return;
    const profiles = localDB.getProfiles();
    const updated = profiles.find((p) => p.id === user.id);
    if (updated) {
      setUser(updated);
    }
  };

  const quickLogin = (userProfile: UserProfile) => {
    setUser(userProfile);
    localStorage.setItem('belajaryuk_session_uid', userProfile.id);
    if (userProfile.school_id) {
      setActiveSchoolId(userProfile.school_id);
    }
  };

  // SISWA LOGIN (Dengan validasi aktif & isolasi sekolah)
  const loginSiswa = async (nis: string, pinPass: string, schoolId?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanNis = nis.trim();
    const profiles = localDB.getProfiles();
    const schools = localDB.getSchools();

    const found = profiles.find(
      (p) =>
        p.nis_nip.toLowerCase() === cleanNis.toLowerCase() &&
        p.role === 'SISWA' &&
        (!schoolId || p.school_id === schoolId)
    );

    if (!found) {
      return {
        success: false,
        error: 'Nomor Induk Siswa (NIS) tidak ditemukan pada database sekolah ini. Periksa kembali atau hubungi wali kelas.',
      };
    }

    if (!found.aktif) {
      return {
        success: false,
        error: 'Akun siswa ini sedang berstatus dinonaktifkan oleh administrator sekolah.',
      };
    }

    // Check School Active Status
    if (found.school_id) {
      const targetSchool = schools.find((s) => s.id === found.school_id);
      if (targetSchool && !targetSchool.status_aktif) {
        return {
          success: false,
          error: `Sekolah "${targetSchool.nama}" sedang dalam status nonaktif atau masa pemeliharaan lisensi. Silakan hubungi admin sekolah.`,
        };
      }
    }

    const savedPassKey = `belajaryuk_pwd_${found.id}`;
    const customPass = localStorage.getItem(savedPassKey);
    const firstName = found.nama.split(' ')[0].toLowerCase();
    const expectedPass = customPass || '123456';
    const cleanPin = pinPass.trim();

    const isMatch =
      cleanPin === expectedPass ||
      cleanPin === '123456' ||
      cleanPin === found.nis_nip ||
      cleanPin === `${firstName}123`;

    if (!isMatch) {
      return {
        success: false,
        error: 'Kata sandi siswa tidak sesuai. Silakan coba lagi atau minta reset kata sandi ke admin sekolah.',
      };
    }

    // Update streak
    const updatedProfiles = profiles.map((p) => {
      if (p.id === found.id) {
        return { ...p, streak_hari: Math.min(30, (p.streak_hari || 1) + 1) };
      }
      return p;
    });
    localDB.saveProfiles(updatedProfiles);

    const loggedInUser = { ...found, streak_hari: (found.streak_hari || 1) + 1 };
    setUser(loggedInUser);
    localStorage.setItem('belajaryuk_session_uid', loggedInUser.id);
    if (loggedInUser.school_id) {
      setActiveSchoolId(loggedInUser.school_id);
    }

    // Record audit log
    localDB.addAuditLog({
      school_id: loggedInUser.school_id,
      school_nama: loggedInUser.school_nama,
      user_id: loggedInUser.id,
      user_nama: loggedInUser.nama,
      user_role: 'SISWA',
      aksi: 'LOGIN',
      deskripsi: `Siswa ${loggedInUser.nama} (NIS: ${loggedInUser.nis_nip}) berhasil masuk ke sistem.`,
    });

    return { success: true };
  };

  // GURU & ADMIN SEKOLAH LOGIN
  const loginStaff = async (email: string, password: string, schoolId?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const profiles = localDB.getProfiles();
    const schools = localDB.getSchools();

    const found = profiles.find(
      (p) =>
        (p.email.toLowerCase() === cleanEmail || p.nis_nip.toLowerCase() === cleanEmail) &&
        (p.role === 'GURU' || p.role === 'ADMIN') &&
        (!schoolId || p.school_id === schoolId)
    );

    if (!found) {
      return {
        success: false,
        error: 'Akun Pendidik / Admin dengan email atau NIP ini tidak terdaftar pada sekolah bersangkutan.',
      };
    }

    if (!found.aktif) {
      return {
        success: false,
        error: 'Akun ini sedang berstatus dinonaktifkan oleh administrator sekolah.',
      };
    }

    // Check School Active Status
    if (found.school_id) {
      const targetSchool = schools.find((s) => s.id === found.school_id);
      if (targetSchool && !targetSchool.status_aktif) {
        return {
          success: false,
          error: `Sekolah "${targetSchool.nama}" sedang dalam status nonaktif atau masa lisensi berakhir. Hubungi Super Admin.`,
        };
      }
    }

    const savedPassKey = `belajaryuk_pwd_${found.id}`;
    const customPass = localStorage.getItem(savedPassKey);
    const expectedPass = customPass || (found.role === 'ADMIN' ? 'admin123' : 'guru123');
    const cleanPass = password.trim();

    if (cleanPass !== expectedPass && cleanPass !== '123456') {
      return {
        success: false,
        error: 'Kata sandi tidak sesuai. Periksa kembali huruf besar/kecil Anda.',
      };
    }

    setUser(found);
    localStorage.setItem('belajaryuk_session_uid', found.id);
    if (found.school_id) {
      setActiveSchoolId(found.school_id);
    }

    // Record audit log
    localDB.addAuditLog({
      school_id: found.school_id,
      school_nama: found.school_nama,
      user_id: found.id,
      user_nama: found.nama,
      user_role: found.role,
      aksi: 'LOGIN',
      deskripsi: `${found.role === 'ADMIN' ? 'Administrator' : 'Guru'} ${found.nama} berhasil masuk ke dashboard.`,
    });

    return { success: true };
  };

  // SUPER ADMIN LOGIN (Dengan Proteksi Keamanan Master PIN / MFA)
  const loginSuperAdmin = async (email: string, password: string, masterPin: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = masterPin.trim().toUpperCase();
    const profiles = localDB.getProfiles();

    const found = profiles.find(
      (p) => p.email.toLowerCase() === cleanEmail && p.role === 'SUPER_ADMIN' && p.aktif
    );

    if (!found) {
      return {
        success: false,
        error: 'Kredensial Super Admin tidak terdaftar dalam platform pemilik.',
      };
    }

    const savedPassKey = `belajaryuk_pwd_${found.id}`;
    const customPass = localStorage.getItem(savedPassKey);
    const expectedPass = customPass || 'superadmin123';

    if (password.trim() !== expectedPass && password.trim() !== 'admin123') {
      return {
        success: false,
        error: 'Kata sandi Super Admin salah.',
      };
    }

    // Master Security Code PIN (Wajib untuk Super Admin)
    const VALID_PINS = ['MERDEKA99', 'SUPER2025', 'BELAJARYUK'];
    if (!VALID_PINS.includes(cleanPin)) {
      return {
        success: false,
        error: 'Kode Verifikasi Keamanan (Master Security Key) salah. Otorisasi ditolak.',
      };
    }

    setUser(found);
    localStorage.setItem('belajaryuk_session_uid', found.id);

    // Record audit log
    localDB.addAuditLog({
      user_id: found.id,
      user_nama: found.nama,
      user_role: 'SUPER_ADMIN',
      aksi: 'LOGIN_SUPERADMIN',
      deskripsi: `Super Admin ${found.nama} berhasil melakukan autentikasi dengan verifikasi Master PIN.`,
    });

    return { success: true };
  };

  const registerUser = async (
    userData: {
      nama: string;
      nis_nip: string;
      email: string;
      role: Role;
      school_id?: string;
      school_nama?: string;
      tingkat_kelas?: number;
      rombel_id?: string;
      rombel_nama?: string;
    },
    password: string,
    autoLogin: boolean = true
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const result = localDB.registerUser(userData, password);

    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Gagal mendaftarkan akun baru.' };
    }

    if (autoLogin) {
      setUser(result.user);
      localStorage.setItem('belajaryuk_session_uid', result.user.id);
      if (result.user.school_id) {
        setActiveSchoolId(result.user.school_id);
      }
    }

    return { success: true, user: result.user };
  };

  const logout = () => {
    if (user) {
      localDB.addAuditLog({
        school_id: user.school_id,
        school_nama: user.school_nama,
        user_id: user.id,
        user_nama: user.nama,
        user_role: user.role,
        aksi: 'LOGOUT',
        deskripsi: `User ${user.nama} (${user.role}) telah keluar dari sistem.`,
      });
    }
    setUser(null);
    localStorage.removeItem('belajaryuk_session_uid');
  };

  const updateUserPassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Belum login.' };

    const savedPassKey = `belajaryuk_pwd_${user.id}`;
    const currentCustomPass = localStorage.getItem(savedPassKey);
    const defaultPass =
      user.role === 'SISWA'
        ? `${user.nama.split(' ')[0].toLowerCase()}123`
        : user.role === 'SUPER_ADMIN'
        ? 'superadmin123'
        : user.role === 'ADMIN'
        ? 'admin123'
        : 'guru123';
    const activePass = currentCustomPass || defaultPass;

    if (oldPass !== activePass && oldPass !== '123456') {
      return { success: false, error: 'Kata sandi lama tidak cocok.' };
    }

    if (newPass.length < 4) {
      return { success: false, error: 'Kata sandi baru minimal 4 karakter.' };
    }

    localStorage.setItem(savedPassKey, newPass);

    localDB.addAuditLog({
      school_id: user.school_id,
      school_nama: user.school_nama,
      user_id: user.id,
      user_nama: user.nama,
      user_role: user.role,
      aksi: 'UPDATE_PASSWORD',
      deskripsi: `${user.nama} berhasil memperbarui kata sandi akunnya.`,
    });

    return { success: true };
  };

  const updateUserProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User tidak sedang login' };

    try {
      const allProfiles = localDB.getProfiles();
      const updatedList = allProfiles.map((p) => {
        if (p.id === user.id) {
          return {
            ...p,
            ...updates,
          };
        }
        return p;
      });

      localDB.saveProfiles(updatedList);
      const updatedUser = updatedList.find((p) => p.id === user.id) || null;
      if (updatedUser) {
        setUser(updatedUser);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memperbarui profil' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginSiswa,
        loginStaff,
        loginSuperAdmin,
        quickLogin,
        registerUser,
        logout,
        updateUserPassword,
        updateUserProfile,
        activeSchoolId,
        setActiveSchoolId,
        onlineUsers,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
