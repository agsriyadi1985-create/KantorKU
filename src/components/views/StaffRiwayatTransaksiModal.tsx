import React, { useState } from 'react';
import { Gaji, Kasbon, Karyawan, CompanyInfo } from '../../types';
import { Modal } from '../common/Modal';
import { SlipGajiModern } from '../print/SlipGajiModern';
import {
  Receipt,
  Banknote,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Wallet,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggal,
  getNamaBulan,
} from '../../utils/formatters';

interface StaffRiwayatTransaksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  karyawan?: Karyawan;
  companyInfo: CompanyInfo;
  gajiList: Gaji[];
  kasbonList: Kasbon[];
  initialTab?: 'gaji' | 'kasbon';
}

export const StaffRiwayatTransaksiModal: React.FC<StaffRiwayatTransaksiModalProps> = ({
  isOpen,
  onClose,
  karyawan,
  companyInfo,
  gajiList,
  kasbonList,
  initialTab = 'gaji',
}) => {
  const [activeTab, setActiveTab] = useState<'gaji' | 'kasbon'>(initialTab);
  const [selectedSlipGaji, setSelectedSlipGaji] = useState<Gaji | null>(null);
  const [expandedKasbonId, setExpandedKasbonId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter gaji khusus untuk karyawan ini, urutkan dari periode terbaru
  const myGaji = gajiList
    .filter((g) => g.karyawanId === karyawan?.id)
    .sort((a, b) => {
      if (b.periodeTahun !== a.periodeTahun) return b.periodeTahun - a.periodeTahun;
      return b.periodeBulan - a.periodeBulan;
    });

  // Filter kasbon khusus untuk karyawan ini, urutkan dari tanggal terbaru
  const myKasbon = kasbonList
    .filter((k) => k.karyawanId === karyawan?.id)
    .sort((a, b) => new Date(b.tanggalPinjam).getTime() - new Date(a.tanggalPinjam).getTime());

  // Statistik Gaji
  const totalGajiDiterima = myGaji
    .filter((g) => g.status === 'Dibayar')
    .reduce((acc, curr) => acc + curr.gajiBersih, 0);

  const gajiTerakhir = myGaji.find((g) => g.status === 'Dibayar') || myGaji[0];

  // Statistik Kasbon
  const totalKasbonSemua = myKasbon.reduce((acc, curr) => acc + curr.jumlahPinjaman, 0);
  const totalKasbonTerbayar = myKasbon.reduce((acc, curr) => acc + curr.sudahDibayar, 0);
  const totalSisaKasbon = myKasbon
    .filter((k) => k.status === 'Aktif')
    .reduce((acc, curr) => acc + curr.sisaPinjaman, 0);

  const getStatusGajiBadge = (status: Gaji['status']) => {
    switch (status) {
      case 'Dibayar':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Dibayar
          </span>
        );
      case 'Disetujui':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3" /> Disetujui
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  const getStatusKasbonBadge = (status: Kasbon['status']) => {
    switch (status) {
      case 'Lunas':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3" /> Lunas
          </span>
        );
      case 'Aktif':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Dibatalkan
          </span>
        );
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !selectedSlipGaji}
        onClose={onClose}
        title="Riwayat Transaksi"
        subtitle={`Karyawan: ${karyawan?.nama || 'Staf'} (${karyawan?.nik || '-'})`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Tab Selector Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('gaji')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'gaji'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Banknote className={`w-4 h-4 ${activeTab === 'gaji' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Pembayaran Gaji</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'gaji'
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {myGaji.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('kasbon')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'kasbon'
                  ? 'bg-white text-amber-700 shadow-sm border border-amber-100 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${activeTab === 'kasbon' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Riwayat Kasbon</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'kasbon'
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {myKasbon.length}
              </span>
            </button>
          </div>

          {/* ============================================================
              TAB 1: PEMBAYARAN GAJI (PAYROLL / SLIP GAJI)
              ============================================================ */}
          {activeTab === 'gaji' && (
            <div className="space-y-3.5">
              {/* Ringkasan Gaji */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Total Gaji Diterima</span>
                  </div>
                  <p className="text-sm sm:text-base font-black font-mono text-emerald-800">
                    {formatRupiah(totalGajiDiterima)}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">
                    Akumulasi slip berstatus dibayar
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>Gaji Terakhir</span>
                  </div>
                  <p className="text-sm sm:text-base font-black font-mono text-slate-800">
                    {gajiTerakhir ? formatRupiah(gajiTerakhir.gajiBersih) : '-'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">
                    {gajiTerakhir
                      ? `${getNamaBulan(gajiTerakhir.periodeBulan)} ${gajiTerakhir.periodeTahun}`
                      : 'Belum ada slip'}
                  </p>
                </div>
              </div>

              {/* Daftar Riwayat Slip Gaji */}
              <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                {myGaji.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Belum ada riwayat slip gaji</p>
                    <p className="text-xs text-slate-400">
                      Admin belum menerbitkan slip gaji untuk akun Anda.
                    </p>
                  </div>
                ) : (
                  myGaji.map((g) => (
                    <div
                      key={g.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs hover:border-emerald-300 transition-all space-y-2.5"
                    >
                      {/* Header Slip Item */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              Periode {getNamaBulan(g.periodeBulan)} {g.periodeTahun}
                            </h4>
                            {getStatusGajiBadge(g.status)}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {g.nomorSlip} • Dicetak: {formatTanggal(g.tanggalCetak)}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                            Gaji Bersih
                          </span>
                          <span className="text-sm font-black font-mono text-emerald-700">
                            {formatRupiah(g.gajiBersih)}
                          </span>
                        </div>
                      </div>

                      {/* Rincian Finansial Cepat */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Total Pendapatan</span>
                          <span className="font-bold text-slate-700 font-mono text-[11px]">
                            {formatRupiah(g.totalPendapatan)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Total Potongan</span>
                          <span className="font-bold text-rose-600 font-mono text-[11px]">
                            {g.totalPotongan > 0 ? `-${formatRupiah(g.totalPotongan)}` : 'Rp 0'}
                          </span>
                        </div>
                        {g.potongan.kasbon > 0 && (
                          <div className="col-span-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> Potongan Kasbon
                            </span>
                            <span className="font-bold font-mono text-amber-800">
                              -{formatRupiah(g.potongan.kasbon)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tombol Aksi: Cetak / Lihat Slip */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {g.tanggalBayar ? `Dibayarkan: ${formatTanggal(g.tanggalBayar)}` : 'Metode: Transfer'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedSlipGaji(g)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat & Cetak Slip</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 2: RIWAYAT KASBON (PINJAMAN & CICILAN)
              ============================================================ */}
          {activeTab === 'kasbon' && (
            <div className="space-y-3.5">
              {/* Ringkasan Kasbon */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Total Pinjaman
                  </span>
                  <p className="text-xs font-black font-mono text-slate-800 truncate">
                    {formatRupiah(totalKasbonSemua)}
                  </p>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
                    Sudah Dibayar
                  </span>
                  <p className="text-xs font-black font-mono text-emerald-800 truncate">
                    {formatRupiah(totalKasbonTerbayar)}
                  </p>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-2.5 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 block mb-0.5">
                    Sisa Kasbon
                  </span>
                  <p className="text-xs font-black font-mono text-amber-800 truncate">
                    {formatRupiah(totalSisaKasbon)}
                  </p>
                </div>
              </div>

              {/* Daftar Riwayat Kasbon */}
              <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                {myKasbon.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Belum ada riwayat kasbon</p>
                    <p className="text-xs text-slate-400">
                      Anda belum pernah mengajukan pinjaman kasbon.
                    </p>
                  </div>
                ) : (
                  myKasbon.map((kb) => {
                    const isExpanded = expandedKasbonId === kb.id;
                    const persentaseLunas =
                      kb.jumlahPinjaman > 0
                        ? Math.min(100, Math.round((kb.sudahDibayar / kb.jumlahPinjaman) * 100))
                        : 0;

                    return (
                      <div
                        key={kb.id}
                        className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5"
                      >
                        {/* Header Item */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {formatRupiah(kb.jumlahPinjaman)}
                              </h4>
                              {getStatusKasbonBadge(kb.status)}
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {kb.nomorKasbon} • Tanggal: {formatTanggal(kb.tanggalPinjam)}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                              Sisa Pinjaman
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-black font-mono ${
                                kb.sisaPinjaman > 0 ? 'text-amber-700' : 'text-slate-600'
                              }`}
                            >
                              {formatRupiah(kb.sisaPinjaman)}
                            </span>
                          </div>
                        </div>

                        {/* Detail Skema & Keterangan */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Skema & Tenor</span>
                            <p className="font-bold text-slate-700 text-[11px]">
                              {kb.skema === 'Sekali_Lunas'
                                ? 'Sekali Lunas'
                                : `Cicilan (${kb.tenorBulan} Bulan)`}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Cicilan / Bulan</span>
                            <p className="font-bold text-slate-800 font-mono text-[11px]">
                              {formatRupiah(kb.cicilanPerBulan)}
                            </p>
                          </div>
                          {kb.keterangan && (
                            <div className="col-span-2 pt-1.5 border-t border-slate-200/60">
                              <span className="text-[10px] text-slate-400 block">Keperluan:</span>
                              <p className="text-[11px] text-slate-700 italic">"{kb.keterangan}"</p>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar Pelunasan */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                            <span>Pelunasan: {persentaseLunas}%</span>
                            <span>Sudah Dibayar: {formatRupiah(kb.sudahDibayar)}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                kb.status === 'Lunas' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${persentaseLunas}%` }}
                            />
                          </div>
                        </div>

                        {/* Toggle Riwayat Cicilan */}
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setExpandedKasbonId(isExpanded ? null : kb.id)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors py-1 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 text-[11px]">
                              <FileText className="w-3.5 h-3.5 text-brand-600" />
                              <span>
                                Riwayat Pembayaran / Cicilan ({kb.riwayatPembayaran?.length || 0})
                              </span>
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {/* List Riwayat Cicilan */}
                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                              {!kb.riwayatPembayaran || kb.riwayatPembayaran.length === 0 ? (
                                <p className="text-[11px] text-slate-500 text-center py-2 italic">
                                  Belum ada catatan pembayaran cicilan untuk kasbon ini.
                                </p>
                              ) : (
                                kb.riwayatPembayaran.map((rp, idx) => (
                                  <div
                                    key={rp.id || idx}
                                    className="p-2 bg-white rounded-lg border border-slate-100 text-[11px] flex items-center justify-between gap-2"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>{formatTanggal(rp.tanggal)}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 pl-4.5">
                                        {rp.keterangan || `Potongan Periode ${rp.periode}`}
                                      </p>
                                    </div>
                                    <span className="font-bold font-mono text-emerald-700 shrink-0">
                                      +{formatRupiah(rp.nominal)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Footer Close Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Pratinjau Dokumen Slip Gaji (Modern Slip Document) */}
      {selectedSlipGaji && karyawan && (
        <Modal
          isOpen={!!selectedSlipGaji}
          onClose={() => setSelectedSlipGaji(null)}
          title="Slip Gaji Karyawan"
          subtitle={`Periode: ${getNamaBulan(selectedSlipGaji.periodeBulan)} ${selectedSlipGaji.periodeTahun}`}
          maxWidth="3xl"
        >
          <SlipGajiModern
            gaji={selectedSlipGaji}
            karyawan={karyawan}
            companyInfo={companyInfo}
            onClose={() => setSelectedSlipGaji(null)}
          />
        </Modal>
      )}
    </>
  );
};
