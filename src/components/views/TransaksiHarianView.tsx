import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TransaksiHarian, MetodeBayar } from '../../types';
import { Modal } from '../common/Modal';
import { LaporanTransaksiBulanan } from '../print/LaporanTransaksiBulanan';
import {
  PlusCircle,
  Search,
  Printer,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  TrendingUp,
  ReceiptText,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggal,
  DAFTAR_BULAN,
  getNamaBulan,
} from '../../utils/formatters';

const KATEGORI_TRANSAKSI_OPTIONS = [
  'Konsumsi & Dapur',
  'BBM & Transportasi',
  'ATK & Fotocopy',
  'Operasional Harian',
  'Konsumsi Rapat & Tamu',
  'Logistik & Pengiriman',
  'Kebersihan & Perlengkapan',
  'Maintenance & Servis',
  'Lain-lain',
];

const QUICK_TAGS = [
  { label: 'Bensin & Transport', cat: 'BBM & Transportasi' },
  { label: 'Air Galon & Pantry', cat: 'Konsumsi & Dapur' },
  { label: 'Kertas HVS & ATK', cat: 'ATK & Fotocopy' },
  { label: 'Snack Rapat Tamu', cat: 'Konsumsi Rapat & Tamu' },
  { label: 'Ongkir Dokumen / Paket', cat: 'Logistik & Pengiriman' },
  { label: 'Peralatan & Sabun', cat: 'Kebersihan & Perlengkapan' },
];

export const TransaksiHarianView: React.FC = () => {
  const {
    transaksiHarianList,
    companyInfo,
    currentUser,
    addTransaksiHarian,
    updateTransaksiHarian,
    deleteTransaksiHarian,
  } = useApp();

  const now = new Date();
  const [filterBulan, setFilterBulan] = useState<number>(now.getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [filterMetode, setFilterMetode] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Form State
  const initialFormState: Omit<TransaksiHarian, 'id' | 'nomorTransaksi'> = {
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'ATK & Fotocopy',
    keterangan: '',
    nominal: 50000,
    metodeBayar: 'Kas Tunai',
    penerima: '',
    penanggungJawab: currentUser?.nama || companyInfo.financeName || 'Admin Finance',
    buktiNota: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filtered List based on Month, Year, Category, Payment Method, and Search Term
  const filteredTransaksi = useMemo(() => {
    return transaksiHarianList.filter((t) => {
      const d = new Date(t.tanggal);
      const matchBulan = filterBulan === 0 || d.getMonth() + 1 === filterBulan;
      const matchTahun = isNaN(d.getFullYear()) || d.getFullYear() === filterTahun;
      const matchKategori = filterKategori === 'Semua' || t.kategori === filterKategori;
      const matchMetode = filterMetode === 'Semua' || t.metodeBayar === filterMetode;
      const matchSearch =
        !searchTerm ||
        t.nomorTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.penerima.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.penanggungJawab.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.buktiNota && t.buktiNota.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchBulan && matchTahun && matchKategori && matchMetode && matchSearch;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [transaksiHarianList, filterBulan, filterTahun, filterKategori, filterMetode, searchTerm]);

  // Transaksi 1 bulan penuh (khusus untuk cetak laporan bulanan)
  const monthlyTransactionsForReport = useMemo(() => {
    return transaksiHarianList.filter((t) => {
      const d = new Date(t.tanggal);
      return (d.getMonth() + 1 === filterBulan || filterBulan === 0) && d.getFullYear() === filterTahun;
    });
  }, [transaksiHarianList, filterBulan, filterTahun]);

  // KPI Calculations
  const totalPengeluaranBulan = useMemo(() => {
    return filteredTransaksi.reduce((acc, curr) => acc + curr.nominal, 0);
  }, [filteredTransaksi]);

  const rataRataTransaksi = useMemo(() => {
    return filteredTransaksi.length > 0 ? Math.round(totalPengeluaranBulan / filteredTransaksi.length) : 0;
  }, [filteredTransaksi, totalPengeluaranBulan]);

  const transaksiTerbesar = useMemo(() => {
    if (filteredTransaksi.length === 0) return null;
    return [...filteredTransaksi].sort((a, b) => b.nominal - a.nominal)[0];
  }, [filteredTransaksi]);

  // Rekap Distribusi Kategori
  const kategoriStats = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransaksi.forEach((t) => {
      map[t.kategori] = (map[t.kategori] || 0) + t.nominal;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTransaksi]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...initialFormState,
      tanggal: new Date().toISOString().split('T')[0],
      penanggungJawab: currentUser?.nama || companyInfo.financeName || 'Admin Finance',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: TransaksiHarian) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal,
      kategori: item.kategori,
      keterangan: item.keterangan,
      nominal: item.nominal,
      metodeBayar: item.metodeBayar,
      penerima: item.penerima,
      penanggungJawab: item.penanggungJawab,
      buktiNota: item.buktiNota || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan || formData.nominal <= 0) {
      alert('Mohon lengkapi uraian keterangan pengeluaran dan nominal dengan benar.');
      return;
    }

    if (editingId) {
      await updateTransaksiHarian(editingId, formData);
      setIsFormOpen(false);
    } else {
      await addTransaksiHarian(formData);
      setIsFormOpen(false);
    }
  };

  const handleDelete = (item: TransaksiHarian) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus transaksi "${item.keterangan}" (${formatRupiah(
          item.nominal
        )})?`
      )
    ) {
      deleteTransaksiHarian(item.id);
    }
  };

  const applyQuickTag = (tag: { label: string; cat: string }) => {
    setFormData((prev) => ({
      ...prev,
      kategori: tag.cat,
      keterangan: prev.keterangan ? `${prev.keterangan} - ${tag.label}` : tag.label,
    }));
  };

  return (
    <div className="space-y-6 pb-14">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <ReceiptText className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Pencatatan Transaksi Harian
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan semua pengeluaran operasional harian kantor selama 1 bulan dan cetak laporan resmi PDF lengkap Kop Surat.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Tombol Cetak Laporan Bulanan (PDF & Kop Resmi) */}
          <button
            type="button"
            onClick={() => setIsPrintReportOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            title="Cetak Laporan Rekapitulasi Pengeluaran 1 Bulan (PDF & Kop Resmi)"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Laporan PDF (Kop Resmi)</span>
          </button>

          {/* Tombol Catat Transaksi Baru */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat Transaksi Harian</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Pengeluaran Bulan Ini */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Total Beban Bulan {getNamaBulan(filterBulan)}
            </span>
            <span className="p-1.5 rounded-lg bg-white/10 text-white">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
              {formatRupiah(totalPengeluaranBulan)}
            </h3>
            <p className="text-[11px] text-brand-300 mt-0.5">
              Tercatat pada tahun {filterTahun}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-700/60">
            <span>Filter: {filterBulan === 0 ? 'Semua Bulan' : getNamaBulan(filterBulan)} {filterTahun}</span>
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Transaksi
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900">
              {filteredTransaksi.length} <span className="text-xs font-semibold text-slate-400">Transaksi</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pengeluaran harian operasional
            </p>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Aktif & tervalidasi</span>
          </div>
        </div>

        {/* Card 3: Rata-Rata per Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Rata-Rata Transaksi
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900">
              {formatRupiah(rataRataTransaksi)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rerata per pengeluaran kas
            </p>
          </div>
          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Estimasi beban operasional</span>
          </div>
        </div>

        {/* Card 4: Pengeluaran Terbesar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Transaksi Terbesar
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-lg sm:text-xl font-black font-mono text-slate-900 truncate">
              {transaksiTerbesar ? formatRupiah(transaksiTerbesar.nominal) : 'Rp 0'}
            </h3>
            <p className="text-[11px] text-slate-500 truncate" title={transaksiTerbesar?.keterangan || ''}>
              {transaksiTerbesar ? transaksiTerbesar.keterangan : 'Belum ada transaksi'}
            </p>
          </div>
          <div className="text-[10px] text-amber-600 font-semibold pt-2 border-t border-slate-100 truncate">
            {transaksiTerbesar?.kategori || '-'}
          </div>
        </div>
      </div>

      {/* 3. Category Distribution Chips */}
      {kategoriStats.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Komposisi Pengeluaran Bulan Ini per Pos / Kategori:
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {kategoriStats.map(([cat, amount]) => {
              const pct = totalPengeluaranBulan > 0 ? Math.round((amount / totalPengeluaranBulan) * 100) : 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterKategori(filterKategori === cat ? 'Semua' : cat)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    filterKategori === cat
                      ? 'bg-brand-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                  }`}
                >
                  <span className="truncate max-w-[150px]">{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    filterKategori === cat ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-800'
                  }`}>
                    {pct}% • {formatRupiah(amount)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Filters Bar (Bulan, Tahun, Kategori, Metode, Pencarian) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari transaksi, penerima, nota, atau petugas..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        {/* Bulan */}
        <div className="sm:col-span-2">
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-semibold text-slate-800"
          >
            <option value={0}>Semua Bulan</option>
            {DAFTAR_BULAN.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tahun */}
        <div className="sm:col-span-2">
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-semibold text-slate-800"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {/* Kategori */}
        <div className="sm:col-span-2">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-medium text-slate-800 truncate"
          >
            <option value="Semua">Semua Kategori</option>
            {KATEGORI_TRANSAKSI_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Metode Pembayaran */}
        <div className="sm:col-span-2">
          <select
            value={filterMetode}
            onChange={(e) => setFilterMetode(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-medium text-slate-800"
          >
            <option value="Semua">Semua Metode</option>
            <option value="Kas Tunai">Kas Tunai</option>
            <option value="Petty Cash">Petty Cash</option>
            <option value="Transfer Bank">Transfer Bank</option>
          </select>
        </div>
      </div>

      {/* 5. Main Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredTransaksi.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">
              Belum ada transaksi pengeluaran harian
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ada catatan pengeluaran pada filter bulan {getNamaBulan(filterBulan)} {filterTahun}.
              Klik tombol di bawah untuk mencatat pengeluaran harian baru.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Catat Transaksi Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tanggal & No. Trx</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Uraian Pengeluaran</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Metode Bayar</th>
                  <th className="py-3.5 px-4">Penerima & Petugas</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Nominal</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransaksi.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-brand-700 block">
                        {item.nomorTransaksi}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatTanggal(item.tanggal)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 leading-snug">
                        {item.keterangan}
                      </p>
                      {item.buktiNota && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          No. Nota/Ref: {item.buktiNota}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block font-bold text-[10px] text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100/60">
                        {item.kategori}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block font-semibold text-[11px] px-2 py-0.5 rounded ${
                        item.metodeBayar === 'Kas Tunai'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.metodeBayar === 'Petty Cash'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-sky-50 text-sky-700'
                      }`}>
                        {item.metodeBayar}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 truncate max-w-[160px]">
                        {item.penerima || '-'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        PIC: {item.penanggungJawab || '-'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-extrabold text-slate-900 text-sm font-mono">
                      {formatRupiah(item.nominal)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Transaksi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 text-right uppercase text-xs tracking-wider">
                    Total Pengeluaran Pada Filter Ini ({filteredTransaksi.length} Data):
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base font-black whitespace-nowrap">
                    {formatRupiah(totalPengeluaranBulan)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 6. MODAL: Form Catat Transaksi Harian Baru / Edit */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Transaksi Pengeluaran Harian' : 'Catat Transaksi Pengeluaran Harian'}
        subtitle="Pencatatan beban operasional harian kantor per bulan dengan nomor transaksi otomatis."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Tag Presets (Only when creating new) */}
          {!editingId && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-2">
                Shortcut Cepat Kebutuhan Kantor:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => applyQuickTag(tag)}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 text-slate-700 rounded-lg border border-slate-200 font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    + {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pos Kategori Pengeluaran *
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                {KATEGORI_TRANSAKSI_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uraian / Keterangan Pengeluaran *
            </label>
            <input
              type="text"
              required
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Contoh: Beli 5 rim kertas HVS A4 & pulpen kantor"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Transaksi (Rp) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={formData.nominal || ''}
                onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {formatRupiah(formData.nominal)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={formData.metodeBayar}
                onChange={(e) => setFormData({ ...formData, metodeBayar: e.target.value as MetodeBayar })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="Kas Tunai">Kas Tunai</option>
                <option value="Petty Cash">Petty Cash (Kas Kecil)</option>
                <option value="Transfer Bank">Transfer Bank</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dibayarkan Kepada (Vendor / Toko / Penerima)
              </label>
              <input
                type="text"
                value={formData.penerima}
                onChange={(e) => setFormData({ ...formData, penerima: e.target.value })}
                placeholder="Contoh: Toko ATK Bintang / SPBU Pertamina"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penanggung Jawab / Petugas Pencatat
              </label>
              <input
                type="text"
                value={formData.penanggungJawab}
                onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                placeholder="Nama staf atau admin finance"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan / Nomor Nota (Opsional)
            </label>
            <input
              type="text"
              value={formData.buktiNota}
              onChange={(e) => setFormData({ ...formData, buktiNota: e.target.value })}
              placeholder="Contoh: No. Struk 8891 / Bon tersimpan di map finance"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <ReceiptText className="w-4 h-4" />
              {editingId ? 'Simpan Perubahan' : 'Simpan Transaksi Harian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. MODAL: Pratinjau & Cetak Laporan Rekapitulasi Bulanan (PDF & Kop Resmi) */}
      {isPrintReportOpen && (
        <Modal
          isOpen={isPrintReportOpen}
          onClose={() => setIsPrintReportOpen(false)}
          title={`Laporan Pengeluaran Bulanan - ${getNamaBulan(filterBulan)} ${filterTahun}`}
          maxWidth="5xl"
        >
          <LaporanTransaksiBulanan
            transaksiList={monthlyTransactionsForReport}
            bulan={filterBulan || now.getMonth() + 1}
            tahun={filterTahun}
            companyInfo={companyInfo}
            petugasName={currentUser?.nama || companyInfo.financeName}
            onClose={() => setIsPrintReportOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};
