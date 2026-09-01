import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PengeluaranRutin,
  KategoriPengeluaran,
  MetodeBayar,
} from '../../types';
import { Modal } from '../common/Modal';
import { KwitansiPengeluaran } from '../print/KwitansiPengeluaran';
import {
  Receipt,
  PlusCircle,
  Search,
  Printer,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  DollarSign,
  Tag,
  CreditCard,
  Building,
  CheckCircle2,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggal,
  DAFTAR_BULAN,
} from '../../utils/formatters';

const KATEGORI_OPTIONS: KategoriPengeluaran[] = [
  'Listrik PLN',
  'Air PDAM',
  'Internet & Wifi',
  'ATK & Cetak',
  'Sewa Tempat & Kantor',
  'Konsumsi & Dapur',
  'Transportasi & BBM',
  'Kebersihan & Keamanan',
  'Maintenance & Peralatan',
  'Pemasaran & Iklan',
  'Lain-lain',
];

export const PengeluaranView: React.FC = () => {
  const {
    pengeluaranList,
    companyInfo,
    addPengeluaran,
    updatePengeluaran,
    deletePengeluaran,
  } = useApp();

  const now = new Date();
  const [filterBulan, setFilterBulan] = useState<number>(now.getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedKwitansiForPrint, setSelectedKwitansiForPrint] =
    useState<PengeluaranRutin | null>(null);

  // Form State
  const initialFormState: Omit<PengeluaranRutin, 'id' | 'nomorKwitansi'> = {
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Internet & Wifi',
    nominal: 500000,
    metodeBayar: 'Transfer Bank',
    dibayarkanKepada: '',
    petugas: companyInfo.financeName || 'Admin Finance',
    keperluan: '',
    catatan: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filtered List
  const filteredPengeluaran = pengeluaranList.filter((p) => {
    const d = new Date(p.tanggal);
    const matchBulan = filterBulan === 0 || d.getMonth() + 1 === filterBulan;
    const matchTahun = d.getFullYear() === filterTahun;
    const matchKategori =
      filterKategori === 'Semua' || p.kategori === filterKategori;
    const matchSearch =
      !searchTerm ||
      p.nomorKwitansi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dibayarkanKepada.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.keperluan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kategori.toLowerCase().includes(searchTerm.toLowerCase());

    return matchBulan && matchTahun && matchKategori && matchSearch;
  });

  // Calculate Metrics
  const totalBebanFiltered = filteredPengeluaran.reduce(
    (acc, curr) => acc + curr.nominal,
    0
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      ...initialFormState,
      petugas: companyInfo.financeName || 'Admin Finance',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: PengeluaranRutin) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal,
      kategori: item.kategori,
      nominal: item.nominal,
      metodeBayar: item.metodeBayar,
      dibayarkanKepada: item.dibayarkanKepada,
      petugas: item.petugas,
      keperluan: item.keperluan,
      catatan: item.catatan || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dibayarkanKepada || !formData.keperluan || formData.nominal <= 0) {
      alert('Mohon lengkapi penerima pembayaran, keperluan, dan nominal transaksi.');
      return;
    }

    if (editingId) {
      await updatePengeluaran(editingId, formData);
      setIsFormOpen(false);
    } else {
      const created = await addPengeluaran(formData);
      setIsFormOpen(false);
      if (created) setSelectedKwitansiForPrint(created);
    }
  };

  const handleDelete = (item: PengeluaranRutin) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus transaksi ${item.nomorKwitansi} (${formatRupiah(
          item.nominal
        )})?`
      )
    ) {
      deletePengeluaran(item.id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Transaksi Pengeluaran Rutin
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan beban operasional bulanan kantor dan cetak kwitansi resmi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Catat Pengeluaran Baru
        </button>
      </div>

      {/* 2. Top Summary Widget */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
            Total Pengeluaran Pada Filter Terpilih
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 block">
            {formatRupiah(totalBebanFiltered)}
          </span>
          <span className="text-xs text-brand-300">
            {filteredPengeluaran.length} Transaksi Tercatat
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">
            Format Kwitansi otomatis siap cetak A4 / A5
          </span>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari No Kwitansi, Penerima, atau Keperluan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        {/* Kategori */}
        <div className="sm:col-span-3">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-medium text-slate-700"
          >
            <option value="Semua">Semua Kategori</option>
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Bulan */}
        <div className="sm:col-span-2">
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-semibold text-slate-700"
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
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-semibold text-slate-700"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* 4. Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredPengeluaran.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">
              Tidak ada transaksi pengeluaran ditemukan
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Klik tombol "Catat Pengeluaran Baru" untuk menambahkan transaksi operasional kantor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">No Kwitansi & Tgl</th>
                  <th className="py-3.5 px-4">Kategori & Keperluan</th>
                  <th className="py-3.5 px-4">Dibayarkan Kepada</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Petugas</th>
                  <th className="py-3.5 px-4 text-center">Cetak Kwitansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPengeluaran.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-brand-700 block">
                        {item.nomorKwitansi}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatTanggal(item.tanggal)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block font-bold text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded mb-0.5">
                        {item.kategori}
                      </span>
                      <p className="font-semibold text-slate-900 truncate">
                        {item.keperluan}
                      </p>
                      {item.catatan && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.catatan}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {item.dibayarkanKepada}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">
                        {item.metodeBayar}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      {formatRupiah(item.nominal)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {item.petugas || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedKwitansiForPrint(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                          title="Cetak Kwitansi Resmi"
                        >
                          <Printer className="w-3.5 h-3.5 text-brand-300" />
                          Kwitansi
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Edit Transaksi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: Form Catat Pengeluaran Baru / Edit */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Transaksi Pengeluaran' : 'Catat Pengeluaran Rutin Kantor'}
        subtitle="Nomor kwitansi dan terbilang bahasa Indonesia dibuat secara otomatis."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Pengeluaran *
              </label>
              <select
                value={formData.kategori}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kategori: e.target.value as KategoriPengeluaran,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Transaksi (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={formData.nominal || ''}
                onChange={(e) =>
                  setFormData({ ...formData, nominal: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={formData.metodeBayar}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metodeBayar: e.target.value as MetodeBayar,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Kas Tunai">Kas Tunai</option>
                <option value="Petty Cash">Petty Cash (Kas Kecil)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dibayarkan Kepada (Vendor / Penerima) *
              </label>
              <input
                type="text"
                required
                value={formData.dibayarkanKepada}
                onChange={(e) =>
                  setFormData({ ...formData, dibayarkanKepada: e.target.value })
                }
                placeholder="Contoh: PT PLN / Toko ATK Bintang"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas / Admin Pencatat
              </label>
              <input
                type="text"
                value={formData.petugas}
                onChange={(e) =>
                  setFormData({ ...formData, petugas: e.target.value })
                }
                placeholder="Nama staf finance"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Untuk Pembayaran (Keperluan) *
            </label>
            <input
              type="text"
              required
              value={formData.keperluan}
              onChange={(e) =>
                setFormData({ ...formData, keperluan: e.target.value })
              }
              placeholder="Contoh: Tagihan internet dedicated fiber 100 Mbps periode September 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={formData.catatan}
              onChange={(e) =>
                setFormData({ ...formData, catatan: e.target.value })
              }
              placeholder="Contoh: No Pelanggan 129038290 / Nota tersimpan di map finance"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              {editingId ? 'Simpan Perubahan' : 'Catat & Terbitkan Kwitansi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL: Pratinjau & Cetak Kwitansi Resmi */}
      {selectedKwitansiForPrint && (
        <Modal
          isOpen={!!selectedKwitansiForPrint}
          onClose={() => setSelectedKwitansiForPrint(null)}
          title="Pratinjau Kwitansi / Bukti Kas Keluar"
          maxWidth="3xl"
        >
          <KwitansiPengeluaran
            pengeluaran={selectedKwitansiForPrint}
            companyInfo={companyInfo}
            onClose={() => setSelectedKwitansiForPrint(null)}
          />
        </Modal>
      )}
    </div>
  );
};
