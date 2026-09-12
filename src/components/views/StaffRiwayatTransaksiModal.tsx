import React, { useState, useMemo } from 'react';
import { Gaji, Kasbon, Karyawan, CompanyInfo, TransaksiHarian } from '../../types';
import { useApp } from '../../context/AppContext';
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
  ReceiptText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggal,
  getNamaBulan,
  DAFTAR_BULAN,
} from '../../utils/formatters';

interface StaffRiwayatTransaksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  karyawan?: Karyawan;
  companyInfo: CompanyInfo;
  gajiList: Gaji[];
  kasbonList: Kasbon[];
  transaksiHarianList?: TransaksiHarian[];
  initialTab?: 'gaji' | 'kasbon' | 'transaksi_harian';
}

export const StaffRiwayatTransaksiModal: React.FC<StaffRiwayatTransaksiModalProps> = ({
  isOpen,
  onClose,
  karyawan,
  companyInfo,
  gajiList,
  kasbonList,
  transaksiHarianList: propTransaksiList,
  initialTab = 'gaji',
}) => {
  const { transaksiHarianList: contextTransaksiList } = useApp();
  const allTransaksi = useMemo(() => {
    return propTransaksiList || contextTransaksiList || [];
  }, [propTransaksiList, contextTransaksiList]);

  const [activeTab, setActiveTab] = useState<'gaji' | 'kasbon' | 'transaksi_harian'>(initialTab);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }

  const [selectedSlipGaji, setSelectedSlipGaji] = useState<Gaji | null>(null);
  const [expandedKasbonId, setExpandedKasbonId] = useState<string | null>(null);

  // Filter khusus Transaksi Harian (tersusun per bulan)
  const [trxFilterBulan, setTrxFilterBulan] = useState<number>(0); // 0 = Semua Bulan
  const [trxFilterTahun, setTrxFilterTahun] = useState<number>(new Date().getFullYear());
  const [trxSearch, setTrxSearch] = useState<string>('');

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

  // Grouping Transaksi Harian per bulan transaksi
  const groupedTrxByMonth = useMemo(() => {
    const filtered = allTransaksi.filter((t) => {
      const d = new Date(t.tanggal);
      const matchBulan = trxFilterBulan === 0 || d.getMonth() + 1 === trxFilterBulan;
      const matchTahun = isNaN(d.getFullYear()) || d.getFullYear() === trxFilterTahun;
      const matchSearch =
        !trxSearch ||
        t.keterangan.toLowerCase().includes(trxSearch.toLowerCase()) ||
        t.kategori.toLowerCase().includes(trxSearch.toLowerCase()) ||
        t.penerima.toLowerCase().includes(trxSearch.toLowerCase()) ||
        t.nomorTransaksi.toLowerCase().includes(trxSearch.toLowerCase()) ||
        t.penanggungJawab.toLowerCase().includes(trxSearch.toLowerCase());
      return matchBulan && matchTahun && matchSearch;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    const groups: { [key: string]: { year: number; month: number; items: TransaksiHarian[]; total: number } } = {};
    filtered.forEach((t) => {
      const d = new Date(t.tanggal);
      const y = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
      const m = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = { year: y, month: m, items: [], total: 0 };
      }
      groups[key].items.push(t);
      groups[key].total += t.nominal;
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allTransaksi, trxFilterBulan, trxFilterTahun, trxSearch]);

  const totalFilteredTrxNominal = useMemo(() => {
    return groupedTrxByMonth.reduce((acc, curr) => acc + curr[1].total, 0);
  }, [groupedTrxByMonth]);

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen && !selectedSlipGaji}
        onClose={onClose}
        title="Riwayat Transaksi"
        subtitle={`Karyawan: ${karyawan?.nama || 'Staf'} (${karyawan?.nik || '-'})`}
        maxWidth={activeTab === 'transaksi_harian' ? '3xl' : '2xl'}
      >
        <div className="space-y-4">
          {/* Tab Selector Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('gaji')}
              className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'gaji'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Banknote className={`w-4 h-4 shrink-0 ${activeTab === 'gaji' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="truncate">Gaji</span>
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
              className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'kasbon'
                  ? 'bg-white text-amber-700 shadow-sm border border-amber-100 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'kasbon' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="truncate">Kasbon</span>
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

            <button
              type="button"
              onClick={() => setActiveTab('transaksi_harian')}
              className={`flex-1 min-w-[135px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'transaksi_harian'
                  ? 'bg-white text-brand-700 shadow-sm border border-brand-100 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ReceiptText className={`w-4 h-4 shrink-0 ${activeTab === 'transaksi_harian' ? 'text-brand-600' : 'text-slate-400'}`} />
              <span className="truncate">Transaksi Harian</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'transaksi_harian'
                    ? 'bg-brand-100 text-brand-800 font-bold'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {allTransaksi.length}
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

          {/* ============================================================
              TAB 3: TRANSAKSI HARIAN KANTOR (MODE LIHAT PETUGAS, TERSUSUN PER BULAN)
              ============================================================ */}
          {activeTab === 'transaksi_harian' && (
            <div className="space-y-3.5">
              {/* Notice Bar: Mode Lihat (Read-Only) */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      Transparansi Transaksi Harian Kantor
                      <span className="text-[9px] font-semibold bg-white/10 text-emerald-300 px-2 py-0.2 rounded-full">
                        Mode Lihat (Read-Only)
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      Seluruh catatan pengeluaran harian kantor tersusun rapi per bulan transaksi.
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Total Beban</span>
                  <span className="text-xs font-black font-mono text-white">{formatRupiah(totalFilteredTrxNominal)}</span>
                </div>
              </div>

              {/* Filter Controls: Search & Bulan & Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trxSearch}
                    onChange={(e) => setTrxSearch(e.target.value)}
                    placeholder="Cari transaksi, penerima, atau nota..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={trxFilterBulan}
                    onChange={(e) => setTrxFilterBulan(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 shadow-2xs"
                  >
                    <option value={0}>Semua Bulan</option>
                    {DAFTAR_BULAN.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={trxFilterTahun}
                    onChange={(e) => setTrxFilterTahun(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 shadow-2xs"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* Transactions List Grouped by Month */}
              <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-1">
                {groupedTrxByMonth.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <ReceiptText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      Tidak ada catatan transaksi harian ditemukan
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Belum ada transaksi operasional kantor yang dicatat pada filter bulan ini.
                    </p>
                  </div>
                ) : (
                  groupedTrxByMonth.map(([key, group]) => {
                    const monthName = getNamaBulan(group.month);
                    return (
                      <div key={key} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                        {/* Month Header Banner */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-500" />
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                              Bulan {monthName} {group.year}
                            </h4>
                            <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.2 rounded-full">
                              {group.items.length} Transaksi
                            </span>
                          </div>
                          <span className="text-xs font-black font-mono text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                            {formatRupiah(group.total)}
                          </span>
                        </div>

                        {/* List of Transactions in This Month */}
                        <div className="space-y-2">
                          {group.items.map((trx) => (
                            <div
                              key={trx.id}
                              className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-100">
                                      {trx.nomorTransaksi}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.2 rounded">
                                      {trx.kategori}
                                    </span>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatTanggal(trx.tanggal)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-900 leading-snug pt-0.5">
                                    {trx.keterangan}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black font-mono text-slate-900 block">
                                    {formatRupiah(trx.nominal)}
                                  </span>
                                  <span className="text-[9px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">
                                    {trx.metodeBayar}
                                  </span>
                                </div>
                              </div>

                              {/* Footer Meta: Penerima, PIC & Nota */}
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-1">
                                <span className="truncate max-w-[200px]">
                                  Penerima: <strong className="text-slate-700 font-semibold">{trx.penerima || '-'}</strong>
                                </span>
                                <div className="flex items-center gap-2">
                                  {trx.penanggungJawab && (
                                    <span className="text-slate-400">
                                      PIC: {trx.penanggungJawab}
                                    </span>
                                  )}
                                  {trx.buktiNota && (
                                    <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded text-[9px]">
                                      Ref: {trx.buktiNota}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
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
