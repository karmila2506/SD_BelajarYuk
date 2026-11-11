import React, { useState, useRef, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Video,
  FileText,
  X,
  Check,
  Search,
  Upload,
  Image as ImageIcon,
  FileCheck,
  Eye,
  Download,
  Sparkles,
  Paperclip,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { MateriPembelajaran, Rombel, MataPelajaran } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';
import {
  KURIKULUM_MERDEKA_SAMPLE_TOPICS,
  getFaseFromKelas,
  getAvailableRombelForMapel,
  getRecommendedTopics,
} from '../../lib/kurikulum';
import {
  compressImageFile,
  readDocumentFile,
  EDUCATIONAL_IMAGE_PRESETS,
  EducationalPresetImage,
} from '../../lib/fileHelper';
import { MaterialViewer } from '../student/MaterialViewer';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { AIMaterialGeneratorModal } from './AIMaterialGeneratorModal';

interface MaterialManagerProps {
  rombels: Rombel[];
  mapels: MataPelajaran[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const MaterialManager: React.FC<MaterialManagerProps> = ({
  rombels,
  mapels,
  onShowToast,
}) => {
  const { user } = useAuth();
  const [materiList, setMateriList] = useState<MateriPembelajaran[]>(localDB.getMateri());
  const [selectedRombelId, setSelectedRombelId] = useState<string>('all');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<MateriPembelajaran | null>(null);
  const [previewMateri, setPreviewMateri] = useState<MateriPembelajaran | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{
    title: string;
    url?: string;
    name?: string;
    size?: string;
    content?: string;
    subject?: string;
    class?: string;
  } | null>(null);
  const [showPresetGallery, setShowPresetGallery] = useState(false);

  // Form states (integrated cascade)
  const [formMapelId, setFormMapelId] = useState(mapels[0]?.id || '');
  const [formRombelId, setFormRombelId] = useState(rombels[0]?.id || '');
  const [formJudul, setFormJudul] = useState('');
  const [formTopik, setFormTopik] = useState('');
  const [formCP, setFormCP] = useState('');
  const [formTP, setFormTP] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formTipe, setFormTipe] = useState<'teks' | 'gambar' | 'dokumen' | 'video' | 'kombinasi'>('teks');
  const [formVideoUrl, setFormVideoUrl] = useState('');

  // Media upload states
  const [formGambarUrl, setFormGambarUrl] = useState('');
  const [formGambarCaption, setFormGambarCaption] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formFileNama, setFormFileNama] = useState('');
  const [formFileUkuran, setFormFileUkuran] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setMateriList(localDB.getMateri());
  };

  useRealtimeSubscription({
    table: 'materi',
    onChange: () => loadData(),
  });

  if (!user) return null;

  const handleOpenCreate = () => {
    setEditingMateri(null);
    setFormRombelId(rombels[0]?.id || '');
    setFormMapelId(mapels[0]?.id || '');
    setFormJudul('');
    setFormTopik('');
    setFormCP('Peserta didik memahami konsep dasar sesuai capaian pembelajaran Kurikulum Merdeka.');
    setFormTP('Siswa mampu menjelaskan dan mempraktikkan materi dengan benar.');
    setFormDeskripsi('');
    setFormTipe('kombinasi');
    setFormVideoUrl('');
    setFormGambarUrl('');
    setFormGambarCaption('');
    setFormFileUrl('');
    setFormFileNama('');
    setFormFileUkuran('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MateriPembelajaran) => {
    setEditingMateri(m);
    setFormRombelId(m.rombel_id);
    setFormMapelId(m.mapel_id);
    setFormJudul(m.judul);
    setFormTopik(m.topik);
    setFormCP(m.capaian_pembelajaran);
    setFormTP(m.tujuan_pembelajaran);
    setFormDeskripsi(m.deskripsi);
    setFormTipe(m.tipe_konten);
    setFormVideoUrl(m.video_url || '');
    setFormGambarUrl(m.gambar_url || '');
    setFormGambarCaption(m.gambar_caption || '');
    setFormFileUrl(m.file_url || '');
    setFormFileNama(m.file_nama || '');
    setFormFileUkuran(m.file_ukuran || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bapak/Ibu yakin ingin menghapus materi pembelajaran ini?')) {
      const all = localDB.getMateri();
      const updated = all.filter((m) => m.id !== id);
      localDB.saveMateri(updated);
      loadData();
      onShowToast('Materi berhasil dihapus.', 'info');
    }
  };

  // Handle local image upload with compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await compressImageFile(file, 900, 900, 0.75);
      setFormGambarUrl(res.dataUrl);
      if (!formGambarCaption) {
        setFormGambarCaption(`Ilustrasi: ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
      onShowToast(`Gambar "${file.name}" (${res.size}) berhasil diunggah!`, 'success');
    } catch (err: any) {
      alert(err.message || 'Gagal memproses berkas gambar.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle local document upload
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDoc(true);
      const res = await readDocumentFile(file);
      setFormFileUrl(res.dataUrl);
      setFormFileNama(res.name);
      setFormFileUkuran(res.size);
      onShowToast(`Dokumen "${res.name}" (${res.size}) berhasil dilampirkan!`, 'success');
    } catch (err: any) {
      alert(err.message || 'Gagal membaca berkas dokumen.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Quick Preset LKPD generator for teacher
  const handleGeneratePresetLKPD = () => {
    const currentM = mapels.find((m) => m.id === formMapelId);
    const fileName = `LKPD_${formTopik ? formTopik.replace(/\s+/g, '_') : 'Kurikulum_Merdeka'}.pdf`;
    const simulatedDataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(
      `LEMBAR KERJA PESERTA DIDIK (LKPD) KURIKULUM MERDEKA\nMata Pelajaran: ${
        currentM?.nama || 'Umum'
      }\nTopik: ${formTopik || formJudul}\nCapaian Pembelajaran: ${formCP}\nTujuan Pembelajaran: ${formTP}\n\nInstruksi Siswa:\n1. Bacalah materi secara seksama.\n2. Kerjakan lembar pengamatan bersama teman kelompokmu.\n3. Buatlah kesimpulan dan presentasikan di depan kelas!`
    )}`;

    setFormFileUrl(simulatedDataUrl);
    setFormFileNama(fileName);
    setFormFileUkuran('180 KB');
    onShowToast(`Modul LKPD "${fileName}" berhasil dibuatkan otomatis!`, 'success');
  };

  // Select from curated educational presets
  const handleSelectPresetImage = (preset: EducationalPresetImage) => {
    setFormGambarUrl(preset.url);
    setFormGambarCaption(preset.caption);
    setShowPresetGallery(false);
    onShowToast(`Gambar preset "${preset.judul}" terpilih!`, 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formTopik.trim()) {
      alert('Judul dan topik materi wajib diisi!');
      return;
    }

    const currentR = rombels.find((r) => r.id === formRombelId);
    const currentM = mapels.find((m) => m.id === formMapelId);
    const all = localDB.getMateri();

    let computedTipe = formTipe;
    if (formGambarUrl && formFileUrl) {
      computedTipe = 'kombinasi';
    } else if (formGambarUrl && !formFileUrl && !formVideoUrl) {
      computedTipe = 'gambar';
    } else if (formFileUrl && !formGambarUrl && !formVideoUrl) {
      computedTipe = 'dokumen';
    }

    if (editingMateri) {
      const updated = all.map((m) => {
        if (m.id === editingMateri.id) {
          return {
            ...m,
            rombel_id: formRombelId,
            rombel_nama: currentR?.nama || m.rombel_nama,
            mapel_id: formMapelId,
            mapel_nama: currentM?.nama || m.mapel_nama,
            judul: formJudul.trim(),
            topik: formTopik.trim(),
            capaian_pembelajaran: formCP.trim(),
            tujuan_pembelajaran: formTP.trim(),
            deskripsi: formDeskripsi.trim(),
            tipe_konten: computedTipe,
            video_url: formVideoUrl.trim() || undefined,
            gambar_url: formGambarUrl || undefined,
            gambar_caption: formGambarCaption.trim() || undefined,
            file_url: formFileUrl || undefined,
            file_nama: formFileNama || undefined,
            file_ukuran: formFileUkuran || undefined,
          };
        }
        return m;
      });
      localDB.saveMateri(updated);
      onShowToast('Materi pembelajaran berhasil diperbarui!', 'success');
    } else {
      const newMateri: MateriPembelajaran = {
        id: `mat-${Date.now()}`,
        rombel_id: formRombelId,
        rombel_nama: currentR?.nama,
        mapel_id: formMapelId,
        mapel_nama: currentM?.nama,
        guru_id: user.id,
        guru_nama: user.nama,
        judul: formJudul.trim(),
        topik: formTopik.trim(),
        capaian_pembelajaran: formCP.trim(),
        tujuan_pembelajaran: formTP.trim(),
        deskripsi: formDeskripsi.trim(),
        tipe_konten: computedTipe,
        video_url: formVideoUrl.trim() || undefined,
        gambar_url: formGambarUrl || undefined,
        gambar_caption: formGambarCaption.trim() || undefined,
        file_url: formFileUrl || undefined,
        file_nama: formFileNama || undefined,
        file_ukuran: formFileUkuran || undefined,
        urutan: all.length + 1,
        created_at: new Date().toISOString(),
        selesai_oleh_siswa: false,
      };

      localDB.saveMateri([newMateri, ...all]);

      // Broadcast new material notification to all students in this rombel
      const notifs = localDB.getNotifikasi();
      const allProfiles = localDB.getProfiles();
      const classStudents = allProfiles.filter(
        (p) => p.role === 'SISWA' && p.rombel_id === formRombelId
      );

      const newNotifs = classStudents.map((st) => ({
        id: `notif-${Date.now()}-${st.id}`,
        user_id: st.id,
        judul: `Materi Baru: ${newMateri.judul} 📚`,
        pesan: `${user.nama} mengunggah materi pelajaran baru di kelasmu. Ayo pelajari dan kumpulkan bintang!`,
        link: '/materi',
        tipe: 'materi_baru' as const,
        dibaca: false,
        created_at: new Date().toISOString(),
      }));

      localDB.saveNotifikasi([...newNotifs, ...notifs]);
      onShowToast('Materi pembelajaran baru berhasil diterbitkan!', 'success');
    }

    setIsModalOpen(false);
    loadData();
  };

  const currentFormMapel = mapels.find((m) => m.id === formMapelId) || mapels[0];
  const availableFormRombels = useMemo(() => {
    return getAvailableRombelForMapel(currentFormMapel, rombels);
  }, [currentFormMapel, rombels]);

  const currentFormRombel =
    availableFormRombels.find((r: Rombel) => r.id === formRombelId) || availableFormRombels[0] || rombels[0];
  const formTingkatKelas = currentFormRombel?.tingkat_kelas || 1;

  const formRecommendedTopics = useMemo(() => {
    return getRecommendedTopics(formTingkatKelas, currentFormMapel?.nama);
  }, [formTingkatKelas, currentFormMapel?.nama]);

  const filteredMateri = materiList.filter((m) => {
    const matchRombel = selectedRombelId === 'all' || m.rombel_id === selectedRombelId;
    const matchMapel = selectedMapelFilter === 'all' || m.mapel_id === selectedMapelFilter;
    const matchSearch =
      m.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.mapel_nama && m.mapel_nama.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchRombel && matchMapel && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={selectedRombelId}
            onChange={(e) => setSelectedRombelId(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Kelas ({materiList.length})</option>
            {rombels.map((r) => (
              <option key={r.id} value={r.id}>
                Kelas {r.tingkat_kelas} - {r.nama}
              </option>
            ))}
          </select>

          {/* Subject Filter (Integrated Cascade) */}
          <select
            value={selectedMapelFilter}
            onChange={(e) => setSelectedMapelFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {mapels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, topik..."
              className="pl-9 pr-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>
        </div>

        {/* Action Buttons: AI Material Generator & Manual Add */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAIGeneratorOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Buat Materi dengan AI</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-blue-600 text-blue-600 font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Manual</span>
          </button>
        </div>
      </div>

      {/* Materi Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMateri.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-700 text-base">Belum Ada Materi</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Bapak/Ibu guru dapat menyusun materi kurikulum merdeka otomatis menggunakan AI Gemini atau mengunggah modul ajar manual.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setIsAIGeneratorOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Buat dengan AI</span>
              </button>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                + Tambah Manual
              </button>
            </div>
          </div>
        ) : (
          filteredMateri.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-300 transition-all shadow-xs hover:shadow-md p-5 flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Visual Image Banner Preview if exists */}
                {m.gambar_url ? (
                  <div className="relative -mx-5 -mt-5 mb-4 h-36 bg-slate-100 overflow-hidden">
                    <img
                      src={m.gambar_url}
                      alt={m.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-3 text-[11px] font-bold text-white bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-emerald-300" />
                      <span>Gambar / Infografis</span>
                    </span>
                  </div>
                ) : null}

                {/* Badges row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {m.rombel_nama || 'Kelas'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {m.mapel_nama || 'Mapel'}
                    </span>
                  </div>

                  {/* Media format badge */}
                  <div className="flex items-center gap-1">
                    {m.file_nama && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5"
                        title={m.file_nama}
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>Dokumen</span>
                      </span>
                    )}
                    {m.video_url && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-extrabold text-slate-800 text-base leading-snug line-clamp-2 mt-1">
                  {m.judul}
                </h4>
                <p className="text-xs text-blue-600 font-bold mt-1">Topik: {m.topik}</p>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {m.deskripsi}
                </p>

                {/* Attached Document file pill with direct In-App Reader button */}
                {m.file_nama && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate text-[11px]">
                        {m.file_nama}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDocument({
                          title: m.judul,
                          url: m.file_url,
                          name: m.file_nama,
                          size: m.file_ukuran,
                          subject: m.mapel_nama,
                          class: m.rombel_nama,
                          content: m.deskripsi,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[10px] transition shrink-0 ml-2"
                      title="Buka dokumen langsung di aplikasi"
                    >
                      Buka Dokumen 📄
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewMateri(m)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Siswa</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit materi"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus materi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ====================================================================== */}
      {/* MODAL FORM CREATE / EDIT MATERI (FULL UPLOAD SUPPORT) */}
      {/* ====================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                  Kurikulum Merdeka SD
                </span>
                <h3 className="font-extrabold text-base sm:text-xl">
                  {editingMateri ? 'Edit Materi Pembelajaran' : 'Tambah Materi Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Row 1: Mata Pelajaran & Kelas (Integrated Cascade) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Mata Pelajaran *
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Kategori: {currentFormMapel?.kategori || 'Wajib'}
                    </span>
                  </div>
                  <select
                    value={formMapelId}
                    onChange={(e) => {
                      const newMapelId = e.target.value;
                      setFormMapelId(newMapelId);
                      const targetM = mapels.find((m) => m.id === newMapelId);
                      const validRombels = getAvailableRombelForMapel(targetM, rombels);
                      if (validRombels.length > 0 && !validRombels.some((r) => r.id === formRombelId)) {
                        setFormRombelId(validRombels[0].id);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    {mapels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama} ({m.kategori})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Kelas Rombongan Belajar *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {getFaseFromKelas(formTingkatKelas)}
                    </span>
                  </div>
                  <select
                    value={formRombelId}
                    onChange={(e) => setFormRombelId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    {availableFormRombels.map((r: Rombel) => (
                      <option key={r.id} value={r.id}>
                        Kelas {r.tingkat_kelas} - {r.nama} ({r.fase})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Judul & Topik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Materi Pembelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJudul}
                    onChange={(e) => setFormJudul(e.target.value)}
                    placeholder={`Contoh: Belajar ${currentFormMapel?.nama} Ceria`}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bab / Topik Bahasan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTopik}
                    onChange={(e) => setFormTopik(e.target.value)}
                    placeholder={`Contoh topik ${currentFormMapel?.nama}...`}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Kurikulum Merdeka Suggestions strictly for this Mapel & Kelas */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  💡 Rekomendasi Topik Kurikulum Merdeka untuk {currentFormMapel?.nama} (Kelas {formTingkatKelas}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {formRecommendedTopics.slice(0, 5).map((item: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormTopik(item.topik);
                        setFormJudul(item.topik);
                        setFormCP(item.capaianPembelajaran);
                        setFormTP(item.tujuanPembelajaran);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                    >
                      + {item.topik}
                    </button>
                  ))}
                </div>
              </div>

              {/* CP & TP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capaian Pembelajaran (CP)
                  </label>
                  <textarea
                    rows={2}
                    value={formCP}
                    onChange={(e) => setFormCP(e.target.value)}
                    placeholder="Deskripsi Capaian Pembelajaran Kurikulum Merdeka..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tujuan Pembelajaran (TP)
                  </label>
                  <textarea
                    rows={2}
                    value={formTP}
                    onChange={(e) => setFormTP(e.target.value)}
                    placeholder="Tujuan yang diharapkan dikuasai peserta didik..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Deskripsi Teks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penjelasan & Narasi Materi (Bahasa Ramah Anak)
                </label>
                <textarea
                  rows={3}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Tuliskan uraian materi pelajaran yang menarik dan mudah dipahami siswa..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                />
              </div>

              {/* ============================================================== */}
              {/* MEDIA UPLOAD SECTION: GAMBAR & DOKUMEN & VIDEO */}
              {/* ============================================================== */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span>Media Lampiran (Gambar, Dokumen LKPD, & Video)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    Bisa diakses siswa secara langsung
                  </span>
                </div>

                {/* 1. UPLOAD GAMBAR / INFOGRAFIS */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>1. Unggah Gambar / Infografis Edukatif</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowPresetGallery(true)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Pilih dari Galeri Infografis SD</span>
                    </button>
                  </div>

                  {formGambarUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-2 flex flex-col sm:flex-row items-center gap-3">
                      <img
                        src={formGambarUrl}
                        alt="Preview"
                        className="w-24 h-24 sm:w-32 sm:h-24 object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 w-full space-y-1.5">
                        <input
                          type="text"
                          value={formGambarCaption}
                          onChange={(e) => setFormGambarCaption(e.target.value)}
                          placeholder="Beri keterangan/caption gambar..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="text-[11px] text-blue-600 hover:underline font-bold"
                          >
                            Ganti Gambar
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormGambarUrl('');
                              setFormGambarCaption('');
                            }}
                            className="text-[11px] text-rose-600 hover:underline font-bold"
                          >
                            Hapus Gambar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700">
                        Klik untuk unggah gambar dari komputer / HP
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Mendukung format JPG, PNG, WebP (Otomatis dioptimalkan untuk pembelajaran cepat)
                      </p>
                    </div>
                  )}

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                {/* 2. UPLOAD DOKUMEN / LKPD PDF */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-amber-600" />
                      <span>2. Unggah Dokumen / LKPD / Modul Ajar</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleGeneratePresetLKPD}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-amber-600" />
                      <span>Buat Template LKPD Cepat</span>
                    </button>
                  </div>

                  {formFileUrl ? (
                    <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {formFileNama || 'Dokumen_Pembelajaran.pdf'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formFileUkuran || 'Format Dokumen'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFormFileUrl('');
                          setFormFileNama('');
                          setFormFileUkuran('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => docInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-amber-50/30"
                    >
                      <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700">
                        Klik untuk unggah dokumen (PDF, LKPD, DOCX)
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Mendukung dokumen modul belajar, panduan praktikum, dan lembar kerja siswa
                      </p>
                    </div>
                  )}

                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={handleDocFileChange}
                    className="hidden"
                  />
                </div>

                {/* 3. TAUTAN VIDEO (OPSIONAL) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>3. Tautan Video Pembelajaran (YouTube / Google Drive) - Opsional</span>
                  </label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Semua materi langsung tersinkronisasi real-time ke siswa.
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan & Terbitkan Materi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PRESET GALLERY MODAL */}
      {/* ====================================================================== */}
      {showPresetGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  Galeri Infografis Kurikulum Merdeka SD 🖼️
                </h3>
                <p className="text-xs text-emerald-100">
                  Pilih ilustrasi edukatif beresolusi tinggi siap pakai
                </p>
              </div>
              <button
                onClick={() => setShowPresetGallery(false)}
                className="p-1 hover:bg-white/20 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EDUCATIONAL_IMAGE_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPresetImage(preset)}
                  className="rounded-2xl border border-slate-200 hover:border-emerald-500 p-2.5 cursor-pointer bg-white hover:bg-emerald-50/30 transition shadow-xs flex flex-col justify-between group"
                >
                  <div>
                    <img
                      src={preset.url}
                      alt={preset.judul}
                      className="w-full h-28 object-cover rounded-xl mb-2 group-hover:scale-102 transition"
                    />
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {preset.mapel}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500">
                        {preset.fase}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-800 leading-snug">
                      {preset.judul}
                    </h5>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                      {preset.caption}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-right">
                    <span className="text-[11px] font-bold text-emerald-600 group-hover:underline">
                      Pilih Gambar Ini →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MATERIAL VIEWER MODAL (TEACHER PREVIEW) */}
      {/* ====================================================================== */}
      {previewMateri && (
        <MaterialViewer
          isOpen={Boolean(previewMateri)}
          onClose={() => setPreviewMateri(null)}
          materi={previewMateri}
          onCompleted={() => {
            onShowToast('Pratinjau materi selesai dipelajari!', 'info');
          }}
        />
      )}

      {/* ====================================================================== */}
      {/* AI MATERIAL GENERATOR MODAL */}
      {/* ====================================================================== */}
      {isAIGeneratorOpen && (
        <AIMaterialGeneratorModal
          isOpen={isAIGeneratorOpen}
          onClose={() => setIsAIGeneratorOpen(false)}
          rombels={rombels}
          mapels={mapels}
          onMaterialCreated={(newMat) => {
            loadData();
            setIsAIGeneratorOpen(false);
            onShowToast(`🎉 Materi "${newMat.judul}" berhasil diterbitkan ke kelas!`, 'success');
          }}
          onCompanionQuizCreated={(newQuiz) => {
            onShowToast(`✨ Kuis pemahaman "${newQuiz.judul}" otomatis diterbitkan!`, 'info');
          }}
        />
      )}

      {/* ====================================================================== */}
      {/* IN-APP DOCUMENT PREVIEW MODAL */}
      {/* ====================================================================== */}
      {previewDocument && (
        <DocumentPreviewModal
          isOpen={Boolean(previewDocument)}
          onClose={() => setPreviewDocument(null)}
          documentTitle={previewDocument.title}
          documentUrl={previewDocument.url}
          documentName={previewDocument.name}
          documentSize={previewDocument.size}
          documentTextContent={previewDocument.content}
          subjectName={previewDocument.subject}
          className={previewDocument.class}
        />
      )}
    </div>
  );
};
