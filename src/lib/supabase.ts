import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserProfile,
  Rombel,
  MataPelajaran,
  MateriPembelajaran,
  Tugas,
  Pengumpulan,
  Pengumuman,
  Notifikasi,
  PesanChat,
  Lencana,
  School,
  AuditLog,
  Role,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_ROMBEL,
  INITIAL_MAPEL,
  INITIAL_MATERI,
  INITIAL_TUGAS,
  INITIAL_PENGUMPULAN,
  INITIAL_PENGUMUMAN,
  INITIAL_NOTIFIKASI,
  INITIAL_CHAT,
  INITIAL_LENCANA,
  INITIAL_SCHOOLS,
  INITIAL_AUDIT_LOGS,
} from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isLiveSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// LOCAL STORAGE REACTIVE STORE (HYBRID SYSTEM & MULTI-TAB REALTIME SYNC)
// ==============================================================================

type RealtimeCallback = (payload: { event: string; table: string; new: any; old: any }) => void;

class RealtimeHub {
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();

  subscribe(table: string, callback: RealtimeCallback): () => void {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table)!.add(callback);
    return () => {
      this.listeners.get(table)?.delete(callback);
    };
  }

  notify(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', newRecord: any, oldRecord: any = null) {
    const tableListeners = this.listeners.get(table);
    if (tableListeners) {
      tableListeners.forEach((cb) => cb({ event, table, new: newRecord, old: oldRecord }));
    }
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach((cb) => cb({ event, table, new: newRecord, old: oldRecord }));
    }
  }
}

export const realtimeHub = new RealtimeHub();

// Cross-tab real-time event listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('belajaryuk_')) {
      const table = e.key.replace('belajaryuk_', '');
      let parsed = null;
      try {
        parsed = e.newValue ? JSON.parse(e.newValue) : null;
      } catch {
        parsed = null;
      }
      realtimeHub.notify(table, 'UPDATE', parsed);
    }
  });
}

// Current dataset version: multi-tenant schools, superadmin, audit logs, and in-app doc reader
const CURRENT_DATASET_VERSION = 'v8_sd_in_app_doc_reader';

function checkAndAutoMigrateData() {
  try {
    const existingVersion = localStorage.getItem('belajaryuk_dataset_version');
    const existingProfilesRaw = localStorage.getItem('belajaryuk_profiles');
    const existingProfiles = existingProfilesRaw ? JSON.parse(existingProfilesRaw) : [];

    // Migrate if version doesn't match or profiles array is empty/invalid
    if (existingVersion !== CURRENT_DATASET_VERSION || !Array.isArray(existingProfiles) || existingProfiles.length < 30) {
      // Preserve any custom user-registered profiles that don't start with usr-siswa- or usr-guru- or usr-admin- or usr-superadmin-
      const customCreatedUsers: UserProfile[] = Array.isArray(existingProfiles)
        ? existingProfiles.filter(
            (p: UserProfile) =>
              p &&
              p.id &&
              !p.id.startsWith('usr-superadmin-') &&
              !p.id.startsWith('usr-admin-') &&
              !p.id.startsWith('usr-guru-') &&
              !p.id.startsWith('usr-siswa-')
          )
        : [];

      const mergedProfiles = [...INITIAL_PROFILES, ...customCreatedUsers];

      localStorage.setItem('belajaryuk_schools', JSON.stringify(INITIAL_SCHOOLS));
      localStorage.setItem('belajaryuk_audit_logs', JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem('belajaryuk_profiles', JSON.stringify(mergedProfiles));
      localStorage.setItem('belajaryuk_rombel', JSON.stringify(INITIAL_ROMBEL));
      localStorage.setItem('belajaryuk_mapel', JSON.stringify(INITIAL_MAPEL));
      // Preserve any custom user-uploaded materi (e.g. uploaded documents)
      const existingMateriRaw = localStorage.getItem('belajaryuk_materi');
      let customMateri: any[] = [];
      try {
        const parsedMateri = existingMateriRaw ? JSON.parse(existingMateriRaw) : [];
        if (Array.isArray(parsedMateri)) {
          customMateri = parsedMateri.filter((m: any) => m && m.id && !m.id.startsWith('mat-'));
        }
      } catch {
        customMateri = [];
      }
      const mergedMateri = [...INITIAL_MATERI, ...customMateri];
      localStorage.setItem('belajaryuk_materi', JSON.stringify(mergedMateri));
      localStorage.setItem('belajaryuk_tugas', JSON.stringify(INITIAL_TUGAS));
      localStorage.setItem('belajaryuk_pengumpulan', JSON.stringify(INITIAL_PENGUMPULAN));
      localStorage.setItem('belajaryuk_pengumuman', JSON.stringify(INITIAL_PENGUMUMAN));
      localStorage.setItem('belajaryuk_notifikasi', JSON.stringify(INITIAL_NOTIFIKASI));
      localStorage.setItem('belajaryuk_chat', JSON.stringify(INITIAL_CHAT));
      localStorage.setItem('belajaryuk_lencana', JSON.stringify(INITIAL_LENCANA));
      localStorage.setItem('belajaryuk_dataset_version', CURRENT_DATASET_VERSION);
    }
  } catch (err) {
    console.warn('Auto migration error:', err);
  }
}

// Execute migration check on module initialization
checkAndAutoMigrateData();

function loadStorage<T>(key: string, initial: T): T {
  try {
    const item = localStorage.getItem(`belajaryuk_${key}`);
    return item ? JSON.parse(item) : initial;
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}`, e);
    return initial;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`belajaryuk_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing localStorage for ${key}`, e);
  }
}

export const localDB = {
  getProfiles(): UserProfile[] {
    return loadStorage<UserProfile[]>('profiles', INITIAL_PROFILES);
  },
  saveProfiles(data: UserProfile[]) {
    saveStorage('profiles', data);
    realtimeHub.notify('profiles', 'UPDATE', data);
  },

  getRombel(): Rombel[] {
    return loadStorage<Rombel[]>('rombel', INITIAL_ROMBEL);
  },
  saveRombel(data: Rombel[]) {
    saveStorage('rombel', data);
    realtimeHub.notify('rombel', 'UPDATE', data);
  },

  getMapel(): MataPelajaran[] {
    return loadStorage<MataPelajaran[]>('mapel', INITIAL_MAPEL);
  },
  saveMapel(data: MataPelajaran[]) {
    saveStorage('mapel', data);
    realtimeHub.notify('mapel', 'UPDATE', data);
  },

  getMateri(): MateriPembelajaran[] {
    return loadStorage<MateriPembelajaran[]>('materi', INITIAL_MATERI);
  },
  saveMateri(data: MateriPembelajaran[]) {
    saveStorage('materi', data);
    realtimeHub.notify('materi', 'UPDATE', data);
  },

  getTugas(): Tugas[] {
    return loadStorage<Tugas[]>('tugas', INITIAL_TUGAS);
  },
  saveTugas(data: Tugas[]) {
    saveStorage('tugas', data);
    realtimeHub.notify('tugas', 'UPDATE', data);
  },

  getPengumpulan(): Pengumpulan[] {
    return loadStorage<Pengumpulan[]>('pengumpulan', INITIAL_PENGUMPULAN);
  },
  savePengumpulan(data: Pengumpulan[]) {
    saveStorage('pengumpulan', data);
    realtimeHub.notify('pengumpulan', 'UPDATE', data);
  },

  getPengumuman(): Pengumuman[] {
    return loadStorage<Pengumuman[]>('pengumuman', INITIAL_PENGUMUMAN);
  },
  savePengumuman(data: Pengumuman[]) {
    saveStorage('pengumuman', data);
    realtimeHub.notify('pengumuman', 'UPDATE', data);
  },

  getNotifikasi(): Notifikasi[] {
    return loadStorage<Notifikasi[]>('notifikasi', INITIAL_NOTIFIKASI);
  },
  saveNotifikasi(data: Notifikasi[]) {
    saveStorage('notifikasi', data);
    realtimeHub.notify('notifikasi', 'UPDATE', data);
  },

  getChat(rombelId: string): PesanChat[] {
    const all = loadStorage<PesanChat[]>('chat', INITIAL_CHAT);
    return all.filter((c) => c.rombel_id === rombelId);
  },
  sendChat(rombelId: string, message: PesanChat) {
    const all = loadStorage<PesanChat[]>('chat', INITIAL_CHAT);
    const updated = [...all, message];
    saveStorage('chat', updated);
    realtimeHub.notify('chat_kelas', 'INSERT', message);
  },
  deleteChat(chatId: string) {
    const all = loadStorage<PesanChat[]>('chat', INITIAL_CHAT);
    const updated = all.map((c) => (c.id === chatId ? { ...c, is_deleted: true } : c));
    saveStorage('chat', updated);
    realtimeHub.notify('chat_kelas', 'UPDATE', { id: chatId, is_deleted: true });
  },

  getLencana(): Lencana[] {
    return loadStorage<Lencana[]>('lencana', INITIAL_LENCANA);
  },

  // ============================================================================
  // MULTI-TENANT SEKOLAH (SUPER ADMIN & ADMIN SEKOLAH)
  // ============================================================================
  getSchools(): School[] {
    return loadStorage<School[]>('schools', INITIAL_SCHOOLS);
  },
  saveSchools(data: School[]) {
    saveStorage('schools', data);
    realtimeHub.notify('schools', 'UPDATE', data);
  },
  createSchool(schoolData: Omit<School, 'id' | 'created_at'>): School {
    const schools = this.getSchools();
    const newSchool: School = {
      ...schoolData,
      id: `sch-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [newSchool, ...schools];
    this.saveSchools(updated);
    this.addAuditLog({
      school_id: newSchool.id,
      school_nama: newSchool.nama,
      user_id: 'usr-superadmin-1',
      user_nama: 'Super Admin',
      user_role: 'SUPER_ADMIN',
      aksi: 'TAMBAH_SEKOLAH',
      deskripsi: `Mendaftarkan sekolah baru: ${newSchool.nama} (NPSN: ${newSchool.npsn}).`,
    });
    return newSchool;
  },
  updateSchool(id: string, updates: Partial<School>): School | null {
    const schools = this.getSchools();
    const target = schools.find((s) => s.id === id);
    if (!target) return null;
    const updatedSchool = { ...target, ...updates };
    const updated = schools.map((s) => (s.id === id ? updatedSchool : s));
    this.saveSchools(updated);
    this.addAuditLog({
      school_id: id,
      school_nama: updatedSchool.nama,
      user_id: 'usr-superadmin-1',
      user_nama: 'Super Admin',
      user_role: 'SUPER_ADMIN',
      aksi: 'UPDATE_SEKOLAH',
      deskripsi: `Memperbarui data dan lisensi sekolah: ${updatedSchool.nama}.`,
    });
    return updatedSchool;
  },
  deleteSchool(id: string): boolean {
    const schools = this.getSchools();
    const target = schools.find((s) => s.id === id);
    if (!target) return false;
    const updated = schools.filter((s) => s.id !== id);
    this.saveSchools(updated);
    this.addAuditLog({
      school_id: id,
      school_nama: target.nama,
      user_id: 'usr-superadmin-1',
      user_nama: 'Super Admin',
      user_role: 'SUPER_ADMIN',
      aksi: 'HAPUS_SEKOLAH',
      deskripsi: `Menghapus sekolah: ${target.nama}.`,
    });
    return true;
  },

  // ============================================================================
  // AUDIT LOGS PLATFORM
  // ============================================================================
  getAuditLogs(): AuditLog[] {
    return loadStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  },
  addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    const updated = [newLog, ...logs.slice(0, 199)]; // Simpan 200 log terbaru
    saveStorage('audit_logs', updated);
    realtimeHub.notify('audit_logs', 'INSERT', newLog);
    return newLog;
  },

  // ============================================================================
  // REGISTER NEW USER (SISWA, GURU, ADMIN) DENGAN INTEGRASI REALTIME
  // ============================================================================
  registerUser(
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
    customPassword?: string
  ): { success: boolean; user?: UserProfile; error?: string } {
    const profiles = this.getProfiles();
    const cleanNisNip = userData.nis_nip.trim();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check duplicate NIS/NIP
    if (profiles.some((p) => p.nis_nip.toLowerCase() === cleanNisNip.toLowerCase())) {
      return {
        success: false,
        error: `Nomor Induk (${cleanNisNip}) sudah terdaftar dalam sistem. Gunakan nomor lain.`,
      };
    }

    // Check duplicate email
    if (cleanEmail && profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: `Email (${cleanEmail}) sudah digunakan oleh akun lain.`,
      };
    }

    const newId = `reg-${userData.role.toLowerCase()}-${Date.now()}`;
    const avatar =
      userData.role === 'SISWA'
        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.nama)}`
        : userData.role === 'GURU'
        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userData.nama)}`
        : `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(userData.nama)}`;

    const newProfile: UserProfile = {
      id: newId,
      school_id: userData.school_id || 'sch-sdn01',
      school_nama: userData.school_nama || 'SD Negeri 01 Merdeka Mandiri',
      nama: userData.nama.trim(),
      nis_nip: cleanNisNip,
      email: cleanEmail || `${cleanNisNip}@belajaryuk.local`,
      role: userData.role,
      tingkat_kelas: userData.tingkat_kelas,
      rombel_id: userData.rombel_id,
      rombel_nama: userData.rombel_nama,
      avatar_url: avatar,
      streak_hari: userData.role === 'SISWA' ? 1 : 10,
      total_bintang: userData.role === 'SISWA' ? 15 : 0,
      aktif: true,
      created_at: new Date().toISOString(),
    };

    // Save profile
    const updatedProfiles = [...profiles, newProfile];
    this.saveProfiles(updatedProfiles);

    // Save custom password in localStorage
    if (customPassword) {
      localStorage.setItem(`belajaryuk_pwd_${newId}`, customPassword.trim());
    }

    // Update Rombel if Siswa or Guru
    if (userData.role === 'SISWA' && userData.rombel_id) {
      const rombels = this.getRombel();
      const updatedRombels = rombels.map((r) => {
        if (r.id === userData.rombel_id) {
          return { ...r, total_siswa: (r.total_siswa || 0) + 1 };
        }
        return r;
      });
      this.saveRombel(updatedRombels);
    }

    // Send Welcome Notification
    const notifs = this.getNotifikasi();
    const welcomeNotif: Notifikasi = {
      id: `notif-welcome-${Date.now()}`,
      user_id: newId,
      judul: 'Selamat Datang di BelajarYuk SD Merdeka! 🎉',
      pesan: `Halo ${newProfile.nama}, akunmu telah aktif di ${newProfile.school_nama}. Mari mulai petualangan belajar yang menyenangkan!`,
      link: '/dashboard',
      tipe: 'pengumuman',
      dibaca: false,
      created_at: new Date().toISOString(),
    };
    this.saveNotifikasi([welcomeNotif, ...notifs]);

    // Audit log
    this.addAuditLog({
      school_id: newProfile.school_id,
      school_nama: newProfile.school_nama,
      user_id: newProfile.id,
      user_nama: newProfile.nama,
      user_role: newProfile.role,
      aksi: 'REGISTRASI_USER',
      deskripsi: `Mendaftarkan akun baru ${newProfile.nama} (${newProfile.role}) dengan NIS/NIP ${newProfile.nis_nip}.`,
    });

    return { success: true, user: newProfile };
  },

  // Update/Reset User Password
  updatePassword(userId: string, newPassword: string): { success: boolean; error?: string } {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'Kata sandi minimal 4 karakter.' };
    }
    localStorage.setItem(`belajaryuk_pwd_${userId}`, newPassword.trim());
    return { success: true };
  },

  // Reset to default seed
  resetToDefaults() {
    localStorage.removeItem('belajaryuk_schools');
    localStorage.removeItem('belajaryuk_audit_logs');
    localStorage.removeItem('belajaryuk_profiles');
    localStorage.removeItem('belajaryuk_rombel');
    localStorage.removeItem('belajaryuk_mapel');
    localStorage.removeItem('belajaryuk_materi');
    localStorage.removeItem('belajaryuk_tugas');
    localStorage.removeItem('belajaryuk_pengumpulan');
    localStorage.removeItem('belajaryuk_pengumuman');
    localStorage.removeItem('belajaryuk_notifikasi');
    localStorage.removeItem('belajaryuk_chat');
    localStorage.removeItem('belajaryuk_lencana');
    localStorage.removeItem('belajaryuk_dataset_version');
    localStorage.removeItem('belajaryuk_session_uid');
    window.location.reload();
  },
};
