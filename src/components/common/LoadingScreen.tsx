import React, { useState, useEffect } from 'react';
import { Loader2, Database, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface LoadingScreenProps {
  onBypass?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onBypass }) => {
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowNotice(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 gap-6 p-4 select-none">
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

      {/* Slow Connection / Offline Bypass Notice */}
      {showSlowNotice && (
        <div className="flex flex-col items-center gap-3 max-w-sm text-center bg-slate-800/90 border border-amber-500/30 rounded-2xl p-4 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <WifiOff className="w-4 h-4" />
            <span>Koneksi Database Memakan Waktu Lama</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Database Supabase sedang tidak merespons (kemungkinan project sedang di-pause). Anda dapat langsung membuka aplikasi menggunakan data lokal perangkat.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-1">
            {onBypass && (
              <button
                type="button"
                onClick={onBypass}
                className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-brand-500/20"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span>Buka Mode Offline</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      )}

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
