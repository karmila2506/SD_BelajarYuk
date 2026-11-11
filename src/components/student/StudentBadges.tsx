import React from 'react';
import { Award, Star, Flame, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { Lencana } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StudentBadgesProps {
  badges: Lencana[];
}

export const StudentBadges: React.FC<StudentBadgesProps> = ({ badges }) => {
  const { user } = useAuth();
  if (!user) return null;

  const getBadgeIcon = (ikon: string, warna: string) => {
    switch (ikon) {
      case 'Award':
        return <Award className="w-8 h-8 text-amber-500" />;
      case 'Clock':
        return <Clock className="w-8 h-8 text-emerald-500" />;
      case 'Sparkles':
        return <Sparkles className="w-8 h-8 text-sky-500" />;
      case 'Flame':
        return <Flame className="w-8 h-8 text-orange-500" />;
      default:
        return <Star className="w-8 h-8 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-3xl p-6 shadow-lg shadow-amber-500/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Star className="w-8 h-8 fill-white" />
          </div>
          <div>
            <div className="text-3xl font-black">{user.total_bintang}</div>
            <div className="text-xs font-bold text-amber-100 uppercase tracking-wider">
              Total Bintang Terkumpul
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-3xl p-6 shadow-lg shadow-orange-500/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Flame className="w-8 h-8 fill-white" />
          </div>
          <div>
            <div className="text-3xl font-black">{user.streak_hari} Hari</div>
            <div className="text-xs font-bold text-orange-100 uppercase tracking-wider">
              Streak Belajar Aktif
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-lg shadow-blue-500/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="text-3xl font-black">
              {badges.filter((b) => b.didapat).length} / {badges.length}
            </div>
            <div className="text-xs font-bold text-blue-100 uppercase tracking-wider">
              Lencana Diraih
            </div>
          </div>
        </div>
      </div>

      {/* Badges list */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="mb-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Koleksi Lencana Penghargaan Saya
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Teruslah belajar setiap hari dan kumpulkan lencana kebanggaanmu tanpa perlu bersaing dengan orang lain!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-3xl border-2 transition text-center flex flex-col items-center justify-between ${
                b.didapat
                  ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xs ${
                  b.didapat ? 'bg-white' : 'bg-slate-200'
                }`}
              >
                {getBadgeIcon(b.ikon, b.warna)}
              </div>

              <div className="flex-1 mb-2">
                <h4 className="font-extrabold text-sm text-slate-800">{b.nama}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.deskripsi}</p>
              </div>

              {b.didapat ? (
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Diraih!
                </div>
              ) : (
                <div className="text-[11px] font-bold text-slate-400 bg-slate-200/70 px-3 py-1 rounded-full">
                  Belum Terbuka
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
