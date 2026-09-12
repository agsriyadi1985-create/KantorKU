import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Receipt,
  CreditCard,
  Settings,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  LogOut,
  CheckSquare,
  ReceiptText,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, companyInfo, currentUser, logout } = useApp();

  const isAdmin = currentUser?.role === 'Admin';

  const allNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    desc: string;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      desc: 'Ringkasan & Analitik',
    },
    {
      id: 'task',
      label: 'Tugas (Task)',
      icon: <CheckSquare className="w-5 h-5" />,
      desc: 'Pencatatan & Status Progres',
    },
    {
      id: 'karyawan',
      label: 'Karyawan',
      icon: <Users className="w-5 h-5" />,
      desc: 'Data Lengkap Staf',
      adminOnly: true, // Staff cannot access
    },
    {
      id: 'gaji',
      label: 'Gaji & Payroll',
      icon: <Banknote className="w-5 h-5" />,
      desc: 'Slip Gaji Modern',
    },
    {
      id: 'kasbon',
      label: 'Kasbon Karyawan',
      icon: <CreditCard className="w-5 h-5" />,
      desc: 'Pinjaman & Sinkronisasi',
    },
    {
      id: 'pengeluaran',
      label: 'Pengeluaran Rutin',
      icon: <Receipt className="w-5 h-5" />,
      desc: 'Operasional & Kwitansi',
    },
    {
      id: 'transaksi_harian',
      label: 'Transaksi Harian',
      icon: <ReceiptText className="w-5 h-5" />,
      desc: 'Catatan 1 Bulan & Cetak',
    },
    {
      id: 'users',
      label: 'Manajemen User',
      icon: <UserCheck className="w-5 h-5" />,
      desc: 'Hak Akses & Petugas',
      adminOnly: true,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan & Profil',
      icon: <Settings className="w-5 h-5" />,
      desc: 'Kop Surat & Database',
      adminOnly: true,
    },
  ];

  // Filter based on role: Staff only sees Dashboard, Gaji, Kasbon, Pengeluaran
  const visibleNavItems = allNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside className="w-64 bg-slate-900 text-white flex-col justify-between hidden md:flex shrink-0 h-screen sticky top-0 select-none shadow-xl">
      {/* Brand Header & Menu */}
      <div className="overflow-y-auto flex-1">
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <img
            src={companyInfo.logoUrl || '/logo.png'}
            alt="Logo"
            className="w-10 h-10 object-contain rounded-xl p-0.5 shrink-0"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== window.location.origin + '/logo.png') {
                target.src = '/logo.png';
              }
            }}
          />
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              {companyInfo.logoText || 'KANTORKU'}
              <span className="text-[10px] uppercase font-bold tracking-widest bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate max-w-[140px]" title={companyInfo.name}>
              {companyInfo.name}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-6 space-y-1.5">
          <div className="px-3 flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Menu Utama
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
              isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
            }`}>
              {currentUser?.role || 'Staff'}
            </span>
          </div>

          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="text-left">
                    <p className="leading-none">{item.label}</p>
                    <span
                      className={`text-[10px] block mt-1 font-normal ${
                        isActive ? 'text-brand-100' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-brand-200" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
            }`}>
              {currentUser?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser?.username || 'Pengguna'}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.role || 'Staff'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Keluar (Logout)"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
