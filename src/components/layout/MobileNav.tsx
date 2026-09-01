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
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, companyInfo } = useApp();

  if (!isOpen) return null;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'karyawan', label: 'Karyawan', icon: <Users className="w-5 h-5" /> },
    { id: 'gaji', label: 'Gaji & Payroll', icon: <Banknote className="w-5 h-5" /> },
    { id: 'kasbon', label: 'Kasbon Karyawan', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'pengeluaran', label: 'Pengeluaran Rutin', icon: <Receipt className="w-5 h-5" /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
  ];

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
          <div className="p-4 space-y-1.5">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Menu Navigasi
            </p>
            {navItems.map((item) => {
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">© 2026 KANTORKU. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
