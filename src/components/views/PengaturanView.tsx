import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Save,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  FileSignature,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const PengaturanView: React.FC = () => {
  const {
    companyInfo,
    updateCompanyInfo,
    exportDataJSON,
    importDataJSON,
    resetToDemoData,
  } = useApp();

  const [formData, setFormData] = useState(companyInfo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyInfo(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataJSON(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* 1. Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">
          Pengaturan Aplikasi & Profil Kantor
        </h2>
        <p className="text-xs text-slate-500">
          Informasi ini digunakan sebagai kop surat pada Slip Gaji, Kwitansi resmi, dan dokumen lainnya.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Informasi Kantor */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              1. Identitas Kantor / Perusahaan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kantor / Perusahaan *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) =>
                  setFormData({ ...formData, slogan: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap Kantor *
              </label>
              <textarea
                required
                rows={2}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp Kantor *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Resmi Kantor *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Pejabat Penandatangan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileSignature className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              2. Otorisasi & Penandatangan Dokumen
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Finance / HRD (Penandatangan Slip & Kwitansi) *
              </label>
              <input
                type="text"
                required
                value={formData.financeName}
                onChange={(e) =>
                  setFormData({ ...formData, financeName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Finance / HRD
              </label>
              <input
                type="text"
                value={formData.financeTitle}
                onChange={(e) =>
                  setFormData({ ...formData, financeTitle: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Direktur / Pimpinan Kantor
              </label>
              <input
                type="text"
                value={formData.leaderName}
                onChange={(e) =>
                  setFormData({ ...formData, leaderName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Pimpinan
              </label>
              <input
                type="text"
                value={formData.leaderTitle}
                onChange={(e) =>
                  setFormData({ ...formData, leaderTitle: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Simpan Profil Kantor
            </button>
          </div>
        </div>
      </form>

      {/* 4. Backup, Restore & Reset Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            3. Pemeliharaan Data (Backup, Restore & Reset)
          </h3>
        </div>

        <p className="text-xs text-slate-500">
          Data aplikasi disimpan secara aman di browser lokal Anda. Anda dapat mengunduh file backup JSON kapan saja untuk disimpan atau dipindahkan ke komputer lain.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Download Backup */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">1. Backup Data</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Unduh seluruh data karyawan, gaji, kasbon, dan pengeluaran ke file JSON.
              </p>
            </div>
            <button
              type="button"
              onClick={exportDataJSON}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Backup JSON
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">2. Pulihkan / Restore</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Unggah file JSON cadangan untuk memulihkan seluruh data aplikasi.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Unggah File Backup
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-rose-900">3. Reset ke Data Demo</h4>
              <p className="text-[11px] text-rose-700 mt-1">
                Kembalikan data ke contoh awal untuk demonstrasi dan uji coba.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'Apakah Anda yakin ingin mereset data ke contoh demo awal? Data yang belum di-backup akan ditimpa.'
                  )
                ) {
                  resetToDemoData();
                }
              }}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset ke Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
