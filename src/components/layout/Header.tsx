import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Building,
  Menu,
  Sparkles,
  Download,
} from 'lucide-react';
import { formatTanggal } from '../../utils/formatters';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { activeTab, companyInfo, exportDataJSON } = useApp();

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
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-30 flex items-center justify-between shadow-xs no-print">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {pageInfo.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Date Badge & Quick Backup */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200/70 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span>{formatTanggal(todayStr)}</span>
        </div>

        <button
          onClick={exportDataJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          title="Backup Seluruh Data ke file JSON"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Backup</span>
        </button>
      </div>
    </header>
  );
};
