import React from 'react';
import { Loader2, Database, Wifi } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 gap-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-2xl shadow-brand-500/40 text-white font-black text-3xl">
          K
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">KANTORKU</h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Manajemen Kantor & Payroll</p>
        </div>
      </div>

      {/* Loading Animation */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
          <span className="text-sm font-medium">Menghubungkan ke database...</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Supabase Badge */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs text-slate-400">
        <Database className="w-3.5 h-3.5 text-emerald-400" />
        <span>Powered by</span>
        <span className="font-bold text-emerald-400">Supabase Realtime</span>
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
      </div>
    </div>
  );
};
