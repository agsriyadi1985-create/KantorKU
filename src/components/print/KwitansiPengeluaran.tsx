import React from 'react';
import { PengeluaranRutin, CompanyInfo } from '../../types';
import {
  formatRupiah,
  formatTanggal,
  angkaKeTerbilang,
} from '../../utils/formatters';
import { Printer, X, Receipt, CheckCircle, Stamp } from 'lucide-react';

interface KwitansiPengeluaranProps {
  pengeluaran: PengeluaranRutin;
  companyInfo: CompanyInfo;
  onClose?: () => void;
}

export const KwitansiPengeluaran: React.FC<KwitansiPengeluaranProps> = ({
  pengeluaran,
  companyInfo,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const terbilang = angkaKeTerbilang(pengeluaran.nominal);

  return (
    <div className="flex flex-col items-center">
      {/* Action Toolbar (Hidden during print) */}
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between no-print bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-200">
            Kwitansi Resmi Pengeluaran Kas - {pengeluaran.nomorKwitansi}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Tutup
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak Kwitansi
          </button>
        </div>
      </div>

      {/* Kwitansi Sheet */}
      <div
        id="printable-kwitansi"
        className="print-page w-full max-w-3xl bg-white text-slate-900 border-2 border-slate-300 rounded-2xl p-8 sm:p-10 shadow-xl print:shadow-none print:border print:border-slate-800 print:p-6 relative overflow-hidden"
      >
        {/* Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-600 via-sky-500 to-slate-800" />

        {/* 1. Header Kwitansi */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-slate-800 gap-4 mt-2">
          <div className="flex items-center gap-3">
            <img
              src={companyInfo.logoUrl || '/logo.png'}
              alt={companyInfo.name || 'Logo Perusahaan'}
              className="w-12 h-12 object-contain shrink-0"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + '/logo.png') {
                  target.src = '/logo.png';
                }
              }}
            />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                {companyInfo.name}
              </h2>
              <p className="text-xs text-slate-500">{companyInfo.address}</p>
              <p className="text-[11px] text-slate-400">Telp: {companyInfo.phone}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black tracking-wider uppercase mb-1">
              KWITANSI / BUKTI KAS KELUAR
            </div>
            <p className="text-xs font-mono font-bold text-brand-700">
              No: {pengeluaran.nomorKwitansi}
            </p>
          </div>
        </div>

        {/* 2. Isi Kwitansi (Format Standar Formal Indonesia) */}
        <div className="my-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-1.5 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Sudah Terima Dari
            </span>
            <span className="font-bold text-slate-900 sm:col-span-3 text-sm">
              : {companyInfo.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-1.5 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Banyaknya Uang
            </span>
            <div className="sm:col-span-3 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800 font-bold italic">
              : # {terbilang} #
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-1.5 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Untuk Pembayaran
            </span>
            <div className="sm:col-span-3 text-slate-900 font-medium">
              : <span className="font-bold">{pengeluaran.kategori}</span> - {pengeluaran.keperluan}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-1.5 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Metode Pembayaran
            </span>
            <span className="font-semibold text-slate-800 sm:col-span-3">
              : {pengeluaran.metodeBayar} (Kepada: {pengeluaran.dibayarkanKepada})
            </span>
          </div>

          {pengeluaran.catatan && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-1.5 border-b border-dashed border-slate-200 items-baseline">
              <span className="font-semibold text-slate-500 sm:col-span-1">
                Keterangan Tambahan
              </span>
              <span className="text-slate-600 sm:col-span-3">
                : {pengeluaran.catatan}
              </span>
            </div>
          )}
        </div>

        {/* 3. Jumlah Nominal Box & Tanda Tangan */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Nominal Box */}
          <div className="w-full sm:w-auto">
            <div className="border-2 border-slate-800 bg-slate-50 px-6 py-3 rounded-xl shadow-xs inline-block">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                Jumlah Terbayar
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {formatRupiah(pengeluaran.nominal)}
              </span>
            </div>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="w-full sm:w-auto grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-14">Petugas / Kasir,</p>
              <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-3 pb-0.5">
                {pengeluaran.petugas || companyInfo.financeName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Finance Admin</p>
            </div>

            <div>
              <p className="text-slate-500 mb-14">
                Jakarta, {formatTanggal(pengeluaran.tanggal)}
                <br />
                Penerima,
              </p>
              <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-3 pb-0.5">
                {pengeluaran.dibayarkanKepada}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Vendor / Staf</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>Dicetak otomatis melalui Aplikasi KANTORKU</span>
          <span className="font-mono">ID: {pengeluaran.id}</span>
        </div>
      </div>
    </div>
  );
};
