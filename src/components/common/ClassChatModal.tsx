import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Trash2, X, ShieldAlert, Sparkles } from 'lucide-react';
import { PesanChat, Rombel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { containsInappropriateContent, sanitizeText } from '../../lib/profanityFilter';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface ClassChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  rombel: Rombel;
}

export const ClassChatModal: React.FC<ClassChatModalProps> = ({ isOpen, onClose, rombel }) => {
  const { user } = useAuth();
  const [currentRombel, setCurrentRombel] = useState<Rombel>(rombel);
  const [messages, setMessages] = useState<PesanChat[]>([]);
  const [inputText, setInputText] = useState('');
  const [warning, setWarning] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentRombel(rombel);
  }, [rombel]);

  const accessibleRombels = React.useMemo(() => {
    const all = localDB.getRombel();
    if (!user) return [];
    if (user.role === 'SISWA') {
      return all.filter((r) => r.id === user.rombel_id);
    }
    if (user.role === 'GURU') {
      const myR = all.filter((r) => r.wali_kelas_id === user.id || r.id === user.rombel_id);
      return myR.length > 0 ? myR : all;
    }
    return all;
  }, [user]);

  const loadMessages = () => {
    if (!currentRombel) return;
    const data = localDB.getChat(currentRombel.id);
    setMessages(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      setWarning('');
    }
  }, [isOpen, currentRombel]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription to chat_kelas table
  useRealtimeSubscription({
    table: 'chat_kelas',
    onChange: () => {
      loadMessages();
    },
  });

  if (!isOpen || !user) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (containsInappropriateContent(text)) {
      setWarning(
        '🌸 Pesan tidak dapat dikirim karena mengandung kata yang kurang santun. Yuk gunakan bahasa yang sopan dan ramah untuk belajar bersama teman ya!'
      );
      return;
    }

    setWarning('');

    const newMsg: PesanChat = {
      id: `chat-${Date.now()}`,
      rombel_id: currentRombel.id,
      sender_id: user.id,
      sender_nama: user.nama,
      sender_role: user.role,
      pesan: sanitizeText(text),
      is_deleted: false,
      created_at: new Date().toISOString(),
    };

    localDB.sendChat(currentRombel.id, newMsg);
    setInputText('');
    loadMessages();
  };

  const handleDelete = (msgId: string) => {
    if (user.role !== 'GURU' && user.role !== 'ADMIN') return;
    if (confirm('Bapak/Ibu yakin ingin menghapus pesan ini dari ruang kelas?')) {
      localDB.deleteChat(msgId);
      loadMessages();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  Ruang Diskusi {currentRombel.nama}
                </h3>
                {accessibleRombels.length > 1 ? (
                  <select
                    value={currentRombel.id}
                    onChange={(e) => {
                      const found = accessibleRombels.find((r) => r.id === e.target.value);
                      if (found) setCurrentRombel(found);
                    }}
                    className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white border border-blue-200 text-blue-700 shadow-2xs focus:outline-none"
                  >
                    {accessibleRombels.map((r) => (
                      <option key={r.id} value={r.id}>
                        Kelas {r.nama} ({r.fase})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {currentRombel.fase}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tanya jawab ramah anak bersama Guru dan teman sekelas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning notification */}
        {warning && (
          <div className="p-3 mx-4 mt-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{warning}</span>
          </div>
        )}

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-700 text-base">Belum Ada Percakapan</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Mulai sapa Bapak/Ibu guru dan teman sekelas dengan pertanyaan seputar pelajaran hari ini!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === user.id;
              const isTeacher = m.sender_role === 'GURU';
              const isAdmin = m.sender_role === 'ADMIN';

              if (m.is_deleted) {
                return (
                  <div key={m.id} className="text-center my-2">
                    <span className="text-xs italic text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      (Pesan telah dihapus oleh moderator kelas)
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-xs font-bold text-slate-600">
                      {isMe ? 'Saya' : m.sender_nama}
                    </span>
                    {(isTeacher || isAdmin) && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {isAdmin ? 'Admin' : 'Guru'}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(m.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="group relative max-w-[85%]">
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : isTeacher
                          ? 'bg-amber-50 text-slate-800 border border-amber-200 rounded-tl-xs'
                          : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {m.pesan}
                    </div>

                    {(user.role === 'GURU' || user.role === 'ADMIN') && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        title="Hapus pesan (Moderasi Guru)"
                        className="opacity-0 group-hover:opacity-100 transition absolute -top-2 -right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              user.role === 'SISWA'
                ? 'Tulis pertanyaan atau sapaanmu dengan santun...'
                : 'Ketik pesan bimbingan untuk siswa...'
            }
            className="flex-1 px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
