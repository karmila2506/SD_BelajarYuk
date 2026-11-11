import React, { useState, useRef } from 'react';
import {
  Palette,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Camera,
  Trash2,
  Smile,
  Shield,
  Star,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { THEME_PRESETS, AVATAR_PRESETS, ThemePreset } from '../../lib/themeHelper';
import { compressImageFile } from '../../lib/fileHelper';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const { user, updateUserProfile } = useAuth();

  const [nama, setNama] = useState(user?.nama || '');
  const [bio, setBio] = useState(user?.bio || 'Rajin belajar demi masa depan gemilang!');
  const [selectedTheme, setSelectedTheme] = useState<string>(user?.bg_theme || 'ocean');
  const [customBgUrl, setCustomBgUrl] = useState<string>(user?.bg_image_url || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress to max 1000px, 0.75 quality to prevent localStorage quota issues
      const res = await compressImageFile(file, 1000, 500, 0.75);
      setCustomBgUrl(res.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto background.');
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImageFile(file, 250, 250, 0.8);
      setAvatarUrl(res.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto avatar.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile({
      nama: nama.trim(),
      bio: bio.trim(),
      bg_theme: selectedTheme,
      bg_image_url: customBgUrl || undefined,
      avatar_url: avatarUrl || user.avatar_url,
    });
    setIsSaving(false);

    if (result.success) {
      const msg = 'Profil dan tema background berhasil disimpan! ✨';
      if (onShowToast) onShowToast(msg, 'success');
      if (onSuccess) onSuccess(msg);
      onClose();
    } else {
      alert(result.error || 'Gagal menyimpan perubahan profil.');
    }
  };

  const currentPreset = THEME_PRESETS[selectedTheme] || THEME_PRESETS.ocean;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Palette className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">Edit Profil & Tema Background</h3>
              <p className="text-xs text-blue-100">
                Personalisasi warna kartu, foto background, avatar, dan moto belajarmu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Live Preview Banner */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Pratinjau Banner Profilmu:
            </label>
            <div
              className={`rounded-3xl p-5 text-white shadow-md relative overflow-hidden transition-all duration-300 ${
                customBgUrl ? '' : currentPreset.bannerClass
              }`}
              style={
                customBgUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.78)), url(${customBgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
            >
              <div className="relative z-10 flex items-center gap-4">
                <img
                  src={avatarUrl || user.avatar_url}
                  alt={nama}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 p-1 border-2 border-white/60 shadow-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md uppercase tracking-wide">
                      {user.role === 'SISWA' ? user.rombel_nama || `Kelas ${user.tingkat_kelas}` : user.role}
                    </span>
                    {user.role === 'SISWA' && (
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-300" />
                        {user.total_bintang} Bintang
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-black truncate mt-1">
                    {nama || user.nama}
                  </h4>
                  <p className="text-xs text-blue-100 italic truncate mt-0.5">
                    "{bio || 'Rajin belajar demi masa depan!'}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Pilih Tema Gradasi Background */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                1. Pilih Tema Warna / Gradasi Background
              </label>
              {customBgUrl && (
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                  (Tertimpa oleh Foto Kustom)
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {Object.values(THEME_PRESETS).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTheme(t.id);
                  }}
                  className={`p-2.5 rounded-2xl border-2 text-left transition flex flex-col justify-between h-20 ${
                    selectedTheme === t.id && !customBgUrl
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-full h-6 rounded-xl bg-gradient-to-r ${t.previewGradient} shadow-inner`} />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] font-extrabold text-slate-800 truncate">
                      {t.nama.split(' ')[0]} {t.nama.split(' ')[1] || ''}
                    </span>
                    {selectedTheme === t.id && !customBgUrl && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Upload Wallpaper / Foto Background Sendiri */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  2. Pasang Foto / Wallpaper Sendiri
                </label>
                <p className="text-[11px] text-slate-500">
                  Upload gambar favoritmu (pemandangan, kartun, foto ruang kelas, dll)
                </p>
              </div>

              {customBgUrl && (
                <button
                  type="button"
                  onClick={() => setCustomBgUrl('')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Foto</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadBg}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center gap-2 shadow-2xs"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>{customBgUrl ? 'Ganti Foto Wallpaper' : 'Pilih Foto dari Perangkat'}</span>
              </button>
              {customBgUrl && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Foto Aktif Digunakan
                </span>
              )}
            </div>
          </div>

          {/* Section 3: Ganti Avatar Karakter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                3. Pilih Avatar Karaktermu
              </label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadAvatar}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Foto Sendiri</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_PRESETS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarUrl(av.url)}
                  className={`p-1.5 rounded-2xl border-2 transition flex flex-col items-center gap-1 ${
                    avatarUrl === av.url
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-blue-300 bg-white'
                  }`}
                  title={av.nama}
                >
                  <img
                    src={av.url}
                    alt={av.nama}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-100"
                  />
                  <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">
                    {av.nama.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Edit Nama & Moto Belajar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Tampilan
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Moto Belajar / Bio Singkat
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contoh: Belajar dengan tekun dan gembira!"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
