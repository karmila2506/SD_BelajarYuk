import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { TeacherDashboard } from '../components/teacher/TeacherDashboard';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { SuperAdminDashboard } from '../components/superadmin/SuperAdminDashboard';
import { ToastContainer, ToastMessage } from '../components/common/Toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleShowToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Header onShowToast={handleShowToast} />

        <main className="pb-12">
          {user.role === 'SUPER_ADMIN' && <SuperAdminDashboard onShowToast={handleShowToast} />}
          {user.role === 'ADMIN' && <AdminDashboard onShowToast={handleShowToast} />}
          {user.role === 'GURU' && <TeacherDashboard onShowToast={handleShowToast} />}
          {user.role === 'SISWA' && <StudentDashboard onShowToast={handleShowToast} />}
        </main>
      </div>

      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-600">
            BelajarYuk • Sekolah Dasar Kurikulum Merdeka
          </p>
          <p className="text-slate-400">
            Terhubung ke Supabase & Gemini AI Task Generator
          </p>
        </div>
      </footer>

      {/* Floating Toasts */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};
