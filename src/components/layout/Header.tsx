import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Menu,
  Download,
  ShieldCheck,
  Shield,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { activeTab, exportDataJSON, currentUser, logout } = useApp();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Realtime live clock (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard Overview',
          subtitle: 'Ringkasan performa finansial, karyawan, dan operasional kantor.',
        };
      case 'karyawan':
        return {
          title: 'Kelola Data Karyawan',
          subtitle: 'Database lengkap biodata, struktur gaji, dan riwayat karyawan.',
        };
      case 'gaji':
        return {
          title: 'Gaji & Penggajian (Payroll)',
          subtitle: 'Pencatatan gaji bulanan dan cetak slip gaji modern.',
        };
      case 'kasbon':
        return {
          title: 'Kasbon & Pinjaman Karyawan',
          subtitle: 'Pencatatan pinjaman yang otomatis terpotong saat proses penggajian.',
        };
      case 'pengeluaran':
        return {
          title: 'Pengeluaran Rutin Kantor',
          subtitle: 'Pencatatan biaya operasional kantor & cetak kwitansi resmi.',
        };
      case 'users':
        return {
          title: 'Manajemen User & Hak Akses',
          subtitle: 'Atur akun petugas, password, serta izin akses modul aplikasi.',
        };
      case 'pengaturan':
        return {
          title: 'Pengaturan & Profil Kantor',
          subtitle: 'Sesuaikan kop surat, tanda tangan dokumen, dan backup data.',
        };
      default:
        return { title: 'KANTORKU', subtitle: 'Aplikasi Manajemen Kantor' };
    }
  };

  const pageInfo = getPageTitle();
  const isAdmin = currentUser?.role === 'Admin';

  // Format date in Indonesian locale based on client device local time
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime);

  const formattedClock = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(currentTime);

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xs no-print">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {pageInfo.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Realtime Date/Clock Badge & User Role & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Realtime Date & Live Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/70 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
          <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
          <span>{formattedDate}</span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 font-mono text-brand-700 bg-brand-50/80 px-2 py-0.5 rounded-md border border-brand-100/60">
            <Clock className="w-3 h-3 text-brand-600 animate-pulse" />
            <span>{formattedClock}</span>
          </div>
        </div>

        {/* User Role Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
          isAdmin
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-sky-50 text-sky-800 border border-sky-200'
        }`}>
          {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> : <Shield className="w-3.5 h-3.5 text-sky-600" />}
          <span>{currentUser?.username || 'User'}</span>
          <span className="opacity-60 text-[10px]">({currentUser?.role || 'Staff'})</span>
        </div>

        {/* Backup button (Admin only) */}
        {isAdmin && (
          <button
            onClick={exportDataJSON}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Backup Seluruh Data ke file JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Backup</span>
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-1.5 sm:px-3 sm:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          title="Keluar dari Akun"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
