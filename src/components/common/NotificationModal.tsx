import React from 'react';
import { Bell, Check, Sparkles, BookOpen, MessageSquare, Award, X } from 'lucide-react';
import { Notifikasi } from '../../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notifikasi[];
  onMarkAsRead: (id?: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
}) => {
  if (!isOpen) return null;

  const getIcon = (tipe: Notifikasi['tipe']) => {
    switch (tipe) {
      case 'nilai_keluar':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'materi_baru':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'tugas_baru':
        return <Award className="w-5 h-5 text-emerald-500" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Notifikasi Saya</h3>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} pesan baru belum dibaca` : 'Semua pesan sudah dibaca'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAsRead()}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition"
              >
                Tandai Semua Dibaca
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-3">
                <Bell className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-700 text-base">Belum Ada Notifikasi</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Kabar gembira seperti nilai tugas dan materi baru dari Bapak/Ibu guru akan muncul di sini!
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkAsRead(n.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex gap-3.5 items-start ${
                  n.dibaca
                    ? 'bg-white border-slate-100 hover:border-slate-200 opacity-80'
                    : 'bg-blue-50/50 border-blue-200/80 shadow-xs'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                  {getIcon(n.tipe)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-sm text-slate-800 truncate">{n.judul}</h5>
                    {!n.dibaca && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.pesan}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
