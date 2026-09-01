import React, { useState } from 'react';
import { PengeluaranRutin, CompanyInfo } from '../../types';
import {
  formatRupiah,
  formatTanggal,
  angkaKeTerbilang,
} from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { Printer, Download, Loader2 } from 'lucide-react';

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
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    await downloadElementAsPDF('printable-kwitansi', {
      filename: `Kwitansi-${pengeluaran.nomorKwitansi}.pdf`,
      orientation: 'landscape',
      format: [210, 148.5], // Kertas A4 dibagi 2 sama besar (A5 Landscape: 210mm x 148.5mm)
      marginMm: 5,
    });
    setIsDownloading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const terbilang = angkaKeTerbilang(pengeluaran.nominal);

  return (
    <div className="flex flex-col items-center">
      {/* Action Toolbar (Hidden during print) */}
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between no-print bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-200">
            Kwitansi Resmi Pengeluaran Kas - {pengeluaran.nomorKwitansi} (Ukuran: 1/2 Kertas A4)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengunduh PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Unduh PDF (1/2 A4)
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Kwitansi
          </button>
        </div>
      </div>

      {/* Kwitansi Sheet - Strict 1/2 A4 Proportion */}
      <div
        id="printable-kwitansi"
        className="print-page w-full max-w-3xl bg-white text-slate-900 border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-xl print:shadow-none print:border print:border-slate-800 print:p-5 relative overflow-hidden"
      >
        {/* Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-600 via-sky-500 to-slate-800" />

        {/* 1. Header Kwitansi */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-slate-800 gap-3 mt-1">
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
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-tight">
                {companyInfo.name}
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight">{companyInfo.address}</p>
              <p className="text-[10px] text-slate-400">Telp: {companyInfo.phone}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="inline-block bg-slate-900 text-white px-2.5 py-0.5 rounded text-[11px] font-black tracking-wider uppercase mb-0.5">
              KWITANSI / BUKTI KAS KELUAR
            </div>
            <p className="text-xs font-mono font-bold text-brand-700">
              No: {pengeluaran.nomorKwitansi}
            </p>
          </div>
        </div>

        {/* 2. Isi Kwitansi (Format Standar Formal Indonesia) */}
        <div className="my-4 space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 py-1 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Sudah Terima Dari
            </span>
            <span className="font-bold text-slate-900 sm:col-span-3 text-xs sm:text-sm">
              : {companyInfo.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 py-1 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Banyaknya Uang
            </span>
            <div className="sm:col-span-3 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-800 font-bold italic text-xs">
              : # {terbilang} #
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 py-1 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Untuk Pembayaran
            </span>
            <div className="sm:col-span-3 text-slate-900 font-medium">
              : <span className="font-bold">{pengeluaran.kategori}</span> - {pengeluaran.keperluan}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 py-1 border-b border-dashed border-slate-200 items-baseline">
            <span className="font-semibold text-slate-500 sm:col-span-1">
              Metode Pembayaran
            </span>
            <span className="font-semibold text-slate-800 sm:col-span-3">
              : {pengeluaran.metodeBayar} (Kepada: {pengeluaran.dibayarkanKepada})
            </span>
          </div>

          {pengeluaran.catatan && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 py-1 border-b border-dashed border-slate-200 items-baseline">
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
        <div className="mt-6 pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Nominal Box */}
          <div className="w-full sm:w-auto">
            <div className="border-2 border-slate-800 bg-slate-50 px-5 py-2.5 rounded-xl shadow-xs inline-block">
              <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">
                Jumlah Terbayar
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatRupiah(pengeluaran.nominal)}
              </span>
            </div>
          </div>

          {/* Kolom Tanda Tangan Penerima (Sisi Kanan) */}
          <div className="w-full sm:w-auto text-right text-xs">
            <div className="inline-block text-center min-w-[200px]">
              <p className="text-slate-600 mb-12 text-xs leading-relaxed">
                Tanjungpinang, {formatTanggal(pengeluaran.tanggal)}
                <br />
                <span className="font-medium text-slate-500">Penerima,</span>
              </p>
              <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-6 pb-0.5 min-w-[150px]">
                {pengeluaran.dibayarkanKepada}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Vendor / Staf</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
          <span>Dicetak otomatis melalui Aplikasi KANTORKU (Format: 1/2 Kertas A4)</span>
          <span className="font-mono">ID: {pengeluaran.id}</span>
        </div>
      </div>
    </div>
  );
};
