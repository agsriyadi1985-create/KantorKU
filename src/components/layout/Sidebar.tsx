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
  Building2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, companyInfo } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      desc: 'Ringkasan & Analitik',
    },
    {
      id: 'karyawan',
      label: 'Karyawan',
      icon: <Users className="w-5 h-5" />,
      desc: 'Data Lengkap Staf',
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
      id: 'pengaturan',
      label: 'Pengaturan & Profil',
      icon: <Settings className="w-5 h-5" />,
      desc: 'Kop Surat & Backup Data',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex-col justify-between hidden md:flex shrink-0 h-screen sticky top-0 select-none shadow-xl">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-black text-xl tracking-wider">
            K
          </div>
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              KANTORKU
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
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
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

      {/* Footer Info */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-300 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">Sistem Aktif & Terlindungi</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Data tersimpan lokal & tersinkronisasi otomatis.
        </p>
      </div>
    </aside>
  );
};
