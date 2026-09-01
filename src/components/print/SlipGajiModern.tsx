import React, { useState } from 'react';
import { Gaji, Karyawan, CompanyInfo } from '../../types';
import {
  formatRupiah,
  formatTanggal,
  getNamaBulan,
  angkaKeTerbilang,
} from '../../utils/formatters';
import { downloadElementAsPDF } from '../../utils/pdfGenerator';
import { Printer, Download, CheckCircle, Shield, Building2, QrCode, Loader2 } from 'lucide-react';

interface SlipGajiModernProps {
  gaji: Gaji;
  karyawan: Karyawan;
  companyInfo: CompanyInfo;
  onClose?: () => void;
}

export const SlipGajiModern: React.FC<SlipGajiModernProps> = ({
  gaji,
  karyawan,
  companyInfo,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    await downloadElementAsPDF('printable-slip', {
      filename: `SlipGaji-${karyawan.nama.replace(/\s+/g, '_')}-${gaji.nomorSlip}.pdf`,
      orientation: 'portrait',
      format: 'a4',
      marginMm: 6,
    });
    setIsDownloading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const periodeLabel = `${getNamaBulan(gaji.periodeBulan)} ${gaji.periodeTahun}`;
  const terbilang = angkaKeTerbilang(gaji.gajiBersih);

  return (
    <div className="flex flex-col items-center">
      {/* Action Toolbar (Hidden during print) */}
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between no-print bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-200">
            Pratinjau Slip Gaji Modern - {gaji.nomorSlip}
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
                Unduh PDF
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Slip Gaji
          </button>
        </div>
      </div>

      {/* Modern Minimalist Slip Document */}
      <div
        id="printable-slip"
        className="print-page w-full max-w-3xl bg-white text-slate-900 border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-xl print:shadow-none print:border-none print:p-0 relative overflow-hidden"
      >
        {/* Subtle Background Watermark Graphic */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-slate-50 rounded-full blur-2xl pointer-events-none -z-0 opacity-70" />

        {/* 1. Header Minimalis */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={companyInfo.logoUrl || '/logo.png'}
              alt={companyInfo.name || 'Logo Perusahaan'}
              className="w-14 h-14 object-contain shrink-0"
              onError={(e) => {
                // Fallback to /logo.png if custom logo fails
                const target = e.currentTarget;
                if (target.src !== window.location.origin + '/logo.png') {
                  target.src = '/logo.png';
                }
              }}
            />
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {companyInfo.name}
              </h1>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                {companyInfo.address}
              </p>
              <p className="text-[11px] text-slate-400">
                Telp: {companyInfo.phone} | Email: {companyInfo.email}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-1">
              <Shield className="w-3 h-3 text-brand-600" />
              Dokumen Rahasia
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
              Slip Gaji Karyawan
            </h2>
            <p className="text-xs font-semibold text-brand-700 font-mono">
              {gaji.nomorSlip}
            </p>
            <p className="text-xs text-slate-500 font-medium">Periode: {periodeLabel}</p>
          </div>
        </div>

        {/* 2. Employee Info Grid (Minimalist Bento Card) */}
        <div className="relative z-10 my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama Lengkap</span>
            <span className="font-bold text-slate-900 block truncate">{karyawan.nama}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">NIK / ID</span>
            <span className="font-mono font-bold text-slate-800 block">{karyawan.nik}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jabatan / Divisi</span>
            <span className="font-medium text-slate-800 block truncate">
              {karyawan.jabatan} ({karyawan.divisi})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status / Rekening</span>
            <span className="font-medium text-slate-800 block truncate">
              {karyawan.status} • {karyawan.namaBank} {karyawan.noRekening}
            </span>
          </div>
        </div>

        {/* 3. Side-by-Side Modern Income & Deduction Table */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
          {/* Penerimaan / Pendapatan */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  A. Penerimaan (Earnings)
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Penambahan
                </span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Gaji Pokok</span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(gaji.pendapatan.gajiPokok)}
                  </span>
                </div>
                {gaji.pendapatan.tunjanganJabatan > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tunjangan Jabatan</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.pendapatan.tunjanganJabatan)}
                    </span>
                  </div>
                )}
                {gaji.pendapatan.tunjanganMakan > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tunjangan Makan</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.pendapatan.tunjanganMakan)}
                    </span>
                  </div>
                )}
                {gaji.pendapatan.tunjanganTransport > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tunjangan Transportasi</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.pendapatan.tunjanganTransport)}
                    </span>
                  </div>
                )}
                {gaji.pendapatan.lembur > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Uang Lembur (Overtime)</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.pendapatan.lembur)}
                    </span>
                  </div>
                )}
                {gaji.pendapatan.bonusKinerja > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Bonus Kinerja / Insentif</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.pendapatan.bonusKinerja)}
                    </span>
                  </div>
                )}
                {gaji.pendapatan.tunjanganLain > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                      {gaji.pendapatan.ketTunjanganLain || 'Tunjangan Lainnya'}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.pendapatan.tunjanganLain)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center font-bold text-xs">
              <span className="text-slate-800">Total Penerimaan (A)</span>
              <span className="text-slate-900">{formatRupiah(gaji.totalPendapatan)}</span>
            </div>
          </div>

          {/* Pemotongan */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  B. Potongan (Deductions)
                </span>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  Pengurangan
                </span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                {/* Kasbon Highlight */}
                {gaji.potongan.kasbon > 0 ? (
                  <div className="flex justify-between items-center bg-amber-50/70 -mx-2 px-2 py-1 rounded">
                    <span className="font-semibold text-amber-900 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Potongan Kasbon / Pinjaman
                    </span>
                    <span className="font-bold text-amber-900">
                      {formatRupiah(gaji.potongan.kasbon)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Potongan Kasbon</span>
                    <span>Rp 0</span>
                  </div>
                )}

                {gaji.potongan.bpjsKesehatan > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">BPJS Kesehatan</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.potongan.bpjsKesehatan)}
                    </span>
                  </div>
                )}

                {gaji.potongan.bpjsKetenagakerjaan > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">BPJS Ketenagakerjaan</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.potongan.bpjsKetenagakerjaan)}
                    </span>
                  </div>
                )}

                {gaji.potongan.pph21 > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">PPh 21 (Pajak)</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.potongan.pph21)}
                    </span>
                  </div>
                )}

                {gaji.potongan.potonganAbsen > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Potongan Absensi / Terlambat</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.potongan.potonganAbsen)}
                    </span>
                  </div>
                )}

                {gaji.potongan.potonganLain > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                      {gaji.potongan.ketPotonganLain || 'Potongan Lainnya'}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(gaji.potongan.potonganLain)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center font-bold text-xs">
              <span className="text-slate-800">Total Potongan (B)</span>
              <span className="text-rose-600">{formatRupiah(gaji.totalPotongan)}</span>
            </div>
          </div>
        </div>

        {/* 4. Minimalist Modern Take Home Pay (THP) Hero Box */}
        <div className="relative z-10 my-6 bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block">
              Gaji Bersih Diterima (Take Home Pay = A - B)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiah(gaji.gajiBersih)}
            </div>
            <div className="text-xs text-brand-300 italic">
              Terbilang: {terbilang}
            </div>
          </div>

          <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 text-left sm:text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Status Pembayaran</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg mt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {gaji.status === 'Dibayar' ? 'LUNAS DITRANSFER' : 'SIAP DIBAYARKAN'}
            </span>
          </div>
        </div>

        {/* 5. Catatan Tambahan (Jika Ada) */}
        {gaji.catatan && (
          <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Catatan Khusus:</span> {gaji.catatan}
          </div>
        )}

        {/* 6. Signatures & Digital Verification Footer */}
        <div className="relative z-10 mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs text-center">
          <div>
            <p className="text-slate-500 mb-16">Diterima Oleh Karyawan,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-4 pb-1">
              {karyawan.nama}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">NIK: {karyawan.nik}</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            {/* Minimalist QR Mock for verification */}
            <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 inline-block mb-1">
              <QrCode className="w-12 h-12 text-slate-700" />
            </div>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
              VALID DIGITALLY
            </p>
            <p className="text-[8px] text-slate-400">
              Dicetak: {formatTanggal(gaji.tanggalCetak)}
            </p>
          </div>

          <div>
            <p className="text-slate-500 mb-16">Disetujui & Dikeluarkan Oleh,</p>
            <p className="font-bold text-slate-900 border-b border-slate-400 inline-block px-4 pb-1">
              {companyInfo.financeName}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{companyInfo.financeTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
