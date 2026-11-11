import React, { useState, useEffect } from 'react';
import {
  Bell,
  MessageSquare,
  Flame,
  Star,
  LogOut,
  KeyRound,
  ChevronDown,
  Sparkles,
  GraduationCap,
  Users,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationModal } from './NotificationModal';
import { ClassChatModal } from './ClassChatModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { EditProfileModal } from './EditProfileModal';
import { localDB } from '../../lib/supabase';
import { Notifikasi, Rombel } from '../../types';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface HeaderProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowToast }) => {
  const { user, logout, onlineUsers } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [selectedRombel, setSelectedRombel] = useState<Rombel | null>(null);

  const loadNotifications = () => {
    if (!user) return;
    const all = localDB.getNotifikasi();
    const myNotifs = all.filter((n) => n.user_id === user.id || n.user_id === 'all');
    setNotifications(myNotifs);
  };

  useEffect(() => {
    loadNotifications();
    const rombels = localDB.getRombel();
    if (user?.rombel_id) {
      const myR = rombels.find((r) => r.id === user.rombel_id);
      setSelectedRombel(myR || rombels[0]);
    } else if (user?.role === 'GURU') {
      const myR = rombels.find((r) => r.wali_kelas_id === user.id);
      setSelectedRombel(myR || rombels[0]);
    } else {
      setSelectedRombel(rombels[0]);
    }
  }, [user]);

  // Realtime subscription for notifications
  useRealtimeSubscription({
    table: 'notifikasi',
    onInsert: (newNotif) => {
      if (user && (newNotif.user_id === user.id || newNotif.user_id === 'all')) {
        onShowToast(`🔔 ${newNotif.judul}`, 'info');
      }
    },
    onChange: () => {
      loadNotifications();
    },
  });

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  const handleMarkAsRead = (id?: string) => {
    const all = localDB.getNotifikasi();
    const updated = all.map((n) => {
      if (id ? n.id === id : n.user_id === user.id || n.user_id === 'all') {
        return { ...n, dibaca: true };
      }
      return n;
    });
    localDB.saveNotifikasi(updated);
    loadNotifications();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Belajar<span className="text-blue-600">Yuk</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                  SD Merdeka
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Portal E-Learning Ceria Kelas 1 - 6</p>
            </div>
          </div>

          {/* Center Info / Gamification (Student only) */}
          {user.role === 'SISWA' && (
            <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-1.5 text-amber-600 font-extrabold text-sm" title="Total Bintang Kamu">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{user.total_bintang} Bintang</span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-sm" title="Streak Belajar Harian">
                <Flame className="w-4 h-4 fill-orange-400 text-orange-500" />
                <span>{user.streak_hari} Hari Aktif</span>
              </div>
            </div>
          )}

          {/* Right actions: Chat, Notif, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Class Chat Button */}
            {selectedRombel && (
              <button
                onClick={() => setShowChat(true)}
                title={`Diskusi Kelas ${selectedRombel.nama}`}
                className="relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm transition border border-indigo-200/80 shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Diskusi Kelas</span>
              </button>
            )}

            {/* Notifications Button */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 sm:pr-3 rounded-2xl hover:bg-slate-100 border border-slate-200/80 transition"
              >
                <div className="relative">
                  <img
                    src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                    alt={user.nama}
                    className="w-9 h-9 rounded-xl object-cover bg-blue-100 border border-slate-200"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      onlineUsers.includes(user.id) || true ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[130px] leading-tight">
                    {user.nama}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        user.role === 'SUPER_ADMIN'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'GURU'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user.role}
                    </span>
                    {user.school_nama && (
                      <span className="text-[10px] text-slate-500 font-bold truncate max-w-[110px]" title={user.school_nama}>
                        {user.school_nama}
                      </span>
                    )}
                    {user.tingkat_kelas && (
                      <span className="text-[10px] text-slate-500 font-bold">
                        Kelas {user.tingkat_kelas}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{user.nama}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {user.role === 'SISWA' ? `NIS: ${user.nis_nip}` : user.email}
                    </p>
                    {user.rombel_nama && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {user.rombel_nama}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowEditProfileModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition"
                  >
                    <Palette className="w-4 h-4 text-blue-500" />
                    <span>Ganti Background & Profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    Ubah Kata Sandi
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                      onShowToast('Sampai jumpa lagi! Kamu berhasil keluar akun.', 'info');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Keluar (Logout)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
      />

      {selectedRombel && (
        <ClassChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          rombel={selectedRombel}
        />
      )}

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => onShowToast('Kata sandi berhasil diperbarui!', 'success')}
      />

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onSuccess={(msg) => onShowToast(msg, 'success')}
      />
    </>
  );
};
