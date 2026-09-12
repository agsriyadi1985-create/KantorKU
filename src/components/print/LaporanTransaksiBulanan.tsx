import React, { useState } from 'react';
import { TransaksiHarian, CompanyInfo } from '../../types';
import {
  formatRupiah,
  formatTanggal,
  getNamaBulan,
  angkaKeTerbilang,
  formatTanggalSingkat,
} from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { Printer, Download, Loader2, FileSpreadsheet } from 'lucide-react';

interface LaporanTransaksiBulananProps {
  transaksiList: TransaksiHarian[];
  bulan: number;
  tahun: number;
  companyInfo: CompanyInfo;
  petugasName?: string;
  onClose?: () => void;
}

export const LaporanTransaksiBulanan: React.FC<LaporanTransaksiBulananProps> = ({
  transaksiList,
  bulan,
  tahun,
  companyInfo,
  petugasName,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Urutkan transaksi berdasarkan tanggal secara kronologis (1 sd akhir bulan)
  const sortedTransaksi = [...transaksiList].sort((a, b) => {
    return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
  });

  const totalNominal = sortedTransaksi.reduce((acc, curr) => acc + curr.nominal, 0);
  const namaBulanStr = getNamaBulan(bulan);
  const terbilangStr = angkaKeTerbilang(totalNominal);

  // Rekapitulasi Pengeluaran per Kategori
  const rekapKategori = sortedTransaksi.reduce((acc, curr) => {
    acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.nominal;
    return acc;
  }, {} as Record<string, number>);

  const listRekapKategori = Object.entries(rekapKategori).map(([kategori, total]) => ({
    kategori,
    total,
    persentase: totalNominal > 0 ? (total / totalNominal) * 100 : 0,
    count: sortedTransaksi.filter((t) => t.kategori === kategori).length,
  }));

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const paperFormat: [number, number] = orientation === 'landscape' ? [297, 210] : [210, 297]; // A4 mm
    await downloadElementAsPDF('printable-laporan-bulanan', {
      filename: `Laporan_Transaksi_${namaBulanStr}_${tahun}.pdf`,
      orientation,
      format: paperFormat,
      marginMm: 6,
      multiPage: true,
    });
    setIsDownloading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Tanggal cetak hari ini
  const todayFormatted = formatTanggal(new Date().toISOString().split('T')[0]);

  return (
    <div className="flex flex-col items-center">
      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="w-full max-w-5xl mb-4 flex items-center justify-between no-print bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              Laporan Pengeluaran Bulanan - {namaBulanStr} {tahun}
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                {sortedTransaksi.length} Transaksi
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Total Beban: <span className="text-white font-bold font-mono">{formatRupiah(totalNominal)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Orientation toggle */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setOrientation('landscape')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                orientation === 'landscape'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Landscape A4
            </button>
            <button
              type="button"
              onClick={() => setOrientation('portrait')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                orientation === 'portrait'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Portrait A4
            </button>
          </div>

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
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengunduh PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Unduh PDF (A4)
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen
          </button>
        </div>
      </div>

      {/* Main Printable Document */}
      <div
        id="printable-laporan-bulanan"
        className={`print-page w-full ${
          orientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
        } bg-white text-slate-900 border-2 border-slate-300 rounded-2xl p-6 sm:p-10 shadow-2xl print:shadow-none print:border-none print:p-4 relative`}
      >
        {/* ============================================================
            1. KOP SURAT RESMI KANTOR (Standard Formal Letterhead)
        ============================================================ */}
        <div className="flex items-center justify-between pb-3 gap-4">
          {/* Logo Perusahaan */}
          <div className="w-20 h-20 shrink-0 flex items-center justify-center">
            <img
              src={companyInfo.logoUrl || '/logo.png'}
              alt={companyInfo.name || 'Logo'}
              className="w-18 h-18 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== window.location.origin + '/logo.png') {
                  target.src = '/logo.png';
                }
              }}
            />
          </div>

          {/* Profil Kantor / Instansi */}
          <div className="flex-1 text-center px-2">
            <h1 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight leading-snug">
              {companyInfo.name || 'PT. KANTORKU DIGITAL NUSANTARA'}
            </h1>
            {companyInfo.slogan && (
              <p className="text-xs font-semibold text-slate-600 italic mt-0.5">
                {companyInfo.slogan}
              </p>
            )}
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              {companyInfo.address}
            </p>
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-2 mt-0.5 flex-wrap">
              {companyInfo.phone && <span>Telp: {companyInfo.phone}</span>}
              {companyInfo.email && <span>• Email: {companyInfo.email}</span>}
              {companyInfo.website && <span>• Web: {companyInfo.website}</span>}
            </div>
          </div>

          {/* Spacer to balance center alignment */}
          <div className="w-20 shrink-0 hidden sm:block" />
        </div>

        {/* Garis Ganda Pembatas Kop Surat Resmi (Double Line) */}
        <div className="border-b-[3px] border-slate-900 mt-1" />
        <div className="border-b border-slate-900 mt-0.5 mb-5" />

        {/* ============================================================
            2. JUDUL DOKUMEN & PERIODE
        ============================================================ */}
        <div className="text-center mb-6">
          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider underline decoration-2 underline-offset-4">
            LAPORAN REKAPITULASI TRANSAKSI PENGELUARAN BULANAN
          </h2>
          <p className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wide">
            PERIODE: BULAN {namaBulanStr} {tahun}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Dicetak otomatis melalui Sistem Informasi Operasional KANTORKU pada {todayFormatted}
          </p>
        </div>

        {/* ============================================================
            3. TABEL RINCIAN TRANSAKSI HARIAN
        ============================================================ */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-2 text-center border-r border-slate-300 w-9">No</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 whitespace-nowrap">Tanggal</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 whitespace-nowrap">No. Transaksi</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[160px]">Uraian Pengeluaran</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300">Kategori</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300 whitespace-nowrap">Metode</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300">Penerima / Vendor</th>
                <th className="py-2.5 px-2.5 border-r border-slate-300">Petugas</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {sortedTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    Tidak ada transaksi pengeluaran tercatat pada bulan {namaBulanStr} {tahun}.
                  </td>
                </tr>
              ) : (
                sortedTransaksi.map((trx, idx) => (
                  <tr key={trx.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="py-2 px-2 text-center border-r border-slate-300 font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 whitespace-nowrap text-slate-700">
                      {formatTanggalSingkat(trx.tanggal)}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {trx.nomorTransaksi}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-slate-900 font-medium">
                      {trx.keterangan}
                      {trx.buktiNota && (
                        <span className="block text-[9px] text-slate-400 font-mono">
                          Ref: {trx.buktiNota}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 text-slate-700 font-medium">
                      {trx.kategori}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 text-slate-600 whitespace-nowrap">
                      {trx.metodeBayar}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 text-slate-800">
                      {trx.penerima || '-'}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-300 text-slate-600">
                      {trx.penanggungJawab || '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(trx.nominal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sortedTransaksi.length > 0 && (
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 text-xs">
                <tr>
                  <td colSpan={8} className="py-2.5 px-4 text-right uppercase tracking-wider">
                    Total Pengeluaran Bulan {namaBulanStr} {tahun}:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-900 font-black whitespace-nowrap">
                    {formatRupiah(totalNominal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ============================================================
            4. KOTAK TERBILANG & RINGKASAN REKAPITULASI
        ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6">
          {/* Kotak Terbilang Bahasa Indonesia */}
          <div className="sm:col-span-7 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-1">
              Terbilang:
            </span>
            <p className="font-bold text-slate-800 italic text-[11px] leading-relaxed">
              # {terbilangStr} #
            </p>
          </div>

          {/* Ringkasan Singkat per Pos Kategori */}
          <div className="sm:col-span-5 bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-1.5">
              Rekapitulasi Pos Pengeluaran:
            </span>
            <div className="space-y-1 text-[10px] max-h-24 overflow-y-auto pr-1">
              {listRekapKategori.map((item) => (
                <div key={item.kategori} className="flex items-center justify-between text-slate-700">
                  <span className="truncate max-w-[140px]" title={item.kategori}>
                    • {item.kategori} ({item.count})
                  </span>
                  <span className="font-mono font-semibold">{formatRupiah(item.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Footer Document Code */}
        <div className="mt-8 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
          <span>KANTORKU PRO • Dokumen Laporan Pengeluaran Resmi</span>
          <span className="font-mono">
            KODE: LAP-TRX-{tahun}{String(bulan).padStart(2, '0')} • {sortedTransaksi.length} Data
          </span>
        </div>
      </div>
    </div>
  );
};
