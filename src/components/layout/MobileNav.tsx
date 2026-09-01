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
  X,
  ChevronRight,
  UserCheck,
  LogOut,
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, companyInfo, currentUser, logout } = useApp();

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'Admin';

  const allNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'karyawan', label: 'Karyawan', icon: <Users className="w-5 h-5" />, adminOnly: true },
    { id: 'gaji', label: 'Gaji & Payroll', icon: <Banknote className="w-5 h-5" /> },
    { id: 'kasbon', label: 'Kasbon Karyawan', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'pengeluaran', label: 'Pengeluaran Rutin', icon: <Receipt className="w-5 h-5" /> },
    { id: 'users', label: 'Manajemen User', icon: <UserCheck className="w-5 h-5" />, adminOnly: true },
    { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-5 h-5" />, adminOnly: true },
  ];

  const visibleNavItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="fixed inset-0 z-50 md:hidden no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-900 text-white shadow-2xl flex flex-col justify-between z-10">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shadow-md">
                K
              </div>
              <div>
                <h2 className="font-extrabold text-sm tracking-tight text-white">KANTORKU</h2>
                <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{companyInfo.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu */}
          <div className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Menu Navigasi
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
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-brand-200" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer with User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
              }`}>
                {currentUser?.username?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser?.username}</p>
                <p className="text-[10px] text-slate-400">{currentUser?.role}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
