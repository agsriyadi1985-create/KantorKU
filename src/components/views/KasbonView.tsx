import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Kasbon, SkemaKasbon } from '../../types';
import { Modal } from '../common/Modal';
import {
  CreditCard,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  AlertCircle,
  FileCheck,
  TrendingDown,
  User,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggal,
  formatTanggalSingkat,
} from '../../utils/formatters';

export const KasbonView: React.FC = () => {
  const {
    kasbonList,
    karyawanList,
    addKasbon,
    deleteKasbon,
    bayarKasbonManual,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailKasbon, setDetailKasbon] = useState<Kasbon | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payNominal, setPayNominal] = useState<number>(0);
  const [payKeterangan, setPayKeterangan] = useState('');

  // Form State
  const initialFormState = {
    karyawanId: '',
    tanggalPinjam: new Date().toISOString().split('T')[0],
    jumlahPinjaman: 1000000,
    skema: 'Cicilan' as SkemaKasbon,
    tenorBulan: 2,
    cicilanPerBulan: 500000,
    periodeMulai: `${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}`,
    keterangan: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filtered List
  const filteredKasbon = kasbonList.filter((k) => {
    const emp = karyawanList.find((e) => e.id === k.karyawanId);
    const matchStatus = filterStatus === 'Semua' || k.status === filterStatus;
    const matchSearch =
      !searchTerm ||
      k.nomorKasbon.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.keterangan.toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatus && matchSearch;
  });

  // Calculate Metrics
  const totalPinjamanAll = kasbonList.reduce((acc, c) => acc + c.jumlahPinjaman, 0);
  const totalSisaAll = kasbonList
    .filter((k) => k.status === 'Aktif')
    .reduce((acc, c) => acc + c.sisaPinjaman, 0);
  const totalTerbayarAll = kasbonList.reduce((acc, c) => acc + c.sudahDibayar, 0);

  const handleOpenAdd = () => {
    if (karyawanList.length === 0) {
      alert('Tambahkan data karyawan terlebih dahulu di Menu Karyawan.');
      return;
    }
    setFormData({
      ...initialFormState,
      karyawanId: karyawanList[0].id,
    });
    setIsFormOpen(true);
  };

  const handleJumlahChange = (nominal: number) => {
    const tenor = formData.skema === 'Sekali_Lunas' ? 1 : formData.tenorBulan;
    const cicilan = Math.ceil(nominal / tenor);
    setFormData({
      ...formData,
      jumlahPinjaman: nominal,
      cicilanPerBulan: cicilan,
    });
  };

  const handleTenorChange = (tenor: number) => {
    const cicilan = Math.ceil(formData.jumlahPinjaman / tenor);
    setFormData({
      ...formData,
      tenorBulan: tenor,
      cicilanPerBulan: cicilan,
    });
  };

  const handleSkemaChange = (skema: SkemaKasbon) => {
    const tenor = skema === 'Sekali_Lunas' ? 1 : 2;
    const cicilan = Math.ceil(formData.jumlahPinjaman / tenor);
    setFormData({
      ...formData,
      skema,
      tenorBulan: tenor,
      cicilanPerBulan: cicilan,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.karyawanId) {
      alert('Pilih karyawan peminjam');
      return;
    }

    addKasbon(formData);
    setIsFormOpen(false);
  };

  const handleManualPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailKasbon || payNominal <= 0) return;

    bayarKasbonManual(
      detailKasbon.id,
      payNominal,
      payKeterangan || 'Pembayaran kasbon tunai manual'
    );

    setIsPayModalOpen(false);
    setDetailKasbon(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Kasbon & Pinjaman Karyawan
          </h2>
          <p className="text-xs text-slate-500">
            Tersinkronisasi otomatis dengan pemotongan payroll di menu Gaji setiap bulannya
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Ajukan Kasbon Baru
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Total Pinjaman Dicairkan
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {formatRupiah(totalPinjamanAll)}
            </span>
            <span className="text-[10px] text-slate-400">
              {kasbonList.length} Transaksi Tercatat
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Sisa Pinjaman Belum Lunas
            </span>
            <span className="text-xl font-bold text-amber-900 mt-1 block">
              {formatRupiah(totalSisaAll)}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">
              {kasbonList.filter((k) => k.status === 'Aktif').length} Pinjaman Aktif
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Total Sudah Terbayar (Lunas)
            </span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              {formatRupiah(totalTerbayarAll)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Dari Potongan Gaji & Tunai
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nomor Kasbon, Nama Karyawan, atau Keperluan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Status Pinjaman</option>
            <option value="Aktif">Sedang Berjalan (Aktif)</option>
            <option value="Lunas">Sudah Lunas</option>
          </select>
        </div>
      </div>

      {/* 4. Kasbon List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredKasbon.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">
              Tidak ada data kasbon ditemukan
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Semua kasbon karyawan telah lunas atau belum ada pengajuan pinjaman baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">No Kasbon & Tgl</th>
                  <th className="py-3.5 px-4">Karyawan</th>
                  <th className="py-3.5 px-4">Skema & Tenor</th>
                  <th className="py-3.5 px-4">Total Pinjaman</th>
                  <th className="py-3.5 px-4">Sisa Saldo</th>
                  <th className="py-3.5 px-4">Status & Progress</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKasbon.map((kb) => {
                  const emp = karyawanList.find((k) => k.id === kb.karyawanId);
                  const progress = Math.round(
                    (kb.sudahDibayar / kb.jumlahPinjaman) * 100
                  );
                  return (
                    <tr key={kb.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-700 block">
                          {kb.nomorKasbon}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatTanggal(kb.tanggalPinjam)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{emp?.nama || 'Karyawan'}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {kb.keterangan || 'Pinjaman staf'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {kb.skema === 'Cicilan' ? `Cicilan ${kb.tenorBulan} Bulan` : 'Sekali Lunas'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {kb.skema === 'Cicilan'
                            ? `${formatRupiah(kb.cicilanPerBulan)} /bln`
                            : 'Potong 1x di Slip'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatRupiah(kb.jumlahPinjaman)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-amber-900 block">
                          {formatRupiah(kb.sisaPinjaman)}
                        </span>
                        <span className="text-[10px] text-emerald-600">
                          Terbayar: {formatRupiah(kb.sudahDibayar)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between items-center text-[10px]">
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded ${
                                kb.status === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {kb.status}
                            </span>
                            <span className="font-semibold text-slate-600">
                              {progress}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progress}%` }}
                              className={`h-full rounded-full ${
                                kb.status === 'Lunas' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailKasbon(kb)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                            title="Lihat Detail & Riwayat Potongan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Hapus catatan kasbon ${kb.nomorKasbon}?`
                                )
                              ) {
                                deleteKasbon(kb.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Kasbon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: Form Pengajuan Kasbon Baru */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Catat Pinjaman / Kasbon Karyawan"
        subtitle="Nominal ini akan otomatis disinkronkan ke pemotongan slip gaji karyawan."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Pilih Karyawan *
            </label>
            <select
              required
              value={formData.karyawanId}
              onChange={(e) =>
                setFormData({ ...formData, karyawanId: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500"
            >
              {karyawanList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nama} ({emp.nik}) - Gaji Pokok: {formatRupiah(emp.gajiPokok)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengajuan Pinjam *
              </label>
              <input
                type="date"
                required
                value={formData.tanggalPinjam}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPinjam: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Pinjaman (Rp) *
              </label>
              <input
                type="number"
                min="50000"
                step="50000"
                required
                value={formData.jumlahPinjaman}
                onChange={(e) => handleJumlahChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skema Pembayaran
              </label>
              <select
                value={formData.skema}
                onChange={(e) => handleSkemaChange(e.target.value as SkemaKasbon)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="Cicilan">Cicilan Bertahap</option>
                <option value="Sekali_Lunas">Potong Sekali Lunas</option>
              </select>
            </div>

            {formData.skema === 'Cicilan' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenor Cicilan
                </label>
                <select
                  value={formData.tenorBulan}
                  onChange={(e) => handleTenorChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value={2}>2 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={4}>4 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={10}>10 Bulan</option>
                  <option value={12}>12 Bulan</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenor
                </label>
                <input
                  type="text"
                  disabled
                  value="1 Bulan (Lunas)"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cicilan / Potongan per Bulan
              </label>
              <input
                type="text"
                disabled
                value={formatRupiah(formData.cicilanPerBulan)}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-brand-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keperluan / Catatan Pinjaman *
            </label>
            <textarea
              required
              rows={2}
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              placeholder="Contoh: Biaya berobat darurat keluarga, perbaikan kendaraan, dll."
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
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              Simpan Kasbon
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL: Detail Kasbon & Riwayat Potongan */}
      {detailKasbon && (
        <Modal
          isOpen={!!detailKasbon}
          onClose={() => setDetailKasbon(null)}
          title={`Detail Kasbon: ${detailKasbon.nomorKasbon}`}
          subtitle="Riwayat pemotongan otomatis dari slip gaji dan pembayaran manual."
          maxWidth="2xl"
        >
          {(() => {
            const emp = karyawanList.find((k) => k.id === detailKasbon.karyawanId);
            const progress = Math.round(
              (detailKasbon.sudahDibayar / detailKasbon.jumlahPinjaman) * 100
            );

            return (
              <div className="space-y-5">
                {/* Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-slate-900 text-base block">
                        {emp?.nama}
                      </span>
                      <span className="text-xs text-slate-500">
                        {emp?.jabatan} • NIK: {emp?.nik}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        detailKasbon.status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {detailKasbon.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Pinjaman</span>
                      <span className="font-bold text-slate-900">
                        {formatRupiah(detailKasbon.jumlahPinjaman)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sudah Terbayar</span>
                      <span className="font-bold text-emerald-600">
                        {formatRupiah(detailKasbon.sudahDibayar)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sisa Pinjaman</span>
                      <span className="font-bold text-amber-900">
                        {formatRupiah(detailKasbon.sisaPinjaman)}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Progress Pelunasan</span>
                      <span className="font-bold text-slate-800">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className="bg-brand-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Riwayat Pembayaran */}
                <div className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      Riwayat Pembayaran & Potongan Gaji
                    </h4>
                    {detailKasbon.status === 'Aktif' && (
                      <button
                        onClick={() => {
                          setPayNominal(detailKasbon.sisaPinjaman);
                          setPayKeterangan('');
                          setIsPayModalOpen(true);
                        }}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg"
                      >
                        + Catat Bayar Tunai
                      </button>
                    )}
                  </div>

                  {detailKasbon.riwayatPembayaran.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Belum ada riwayat potongan atau pembayaran untuk kasbon ini.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailKasbon.riwayatPembayaran.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs border border-slate-100"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {r.keterangan}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Tanggal: {formatTanggal(r.tanggal)} • Periode: {r.periode}
                            </span>
                          </div>
                          <span className="font-extrabold text-emerald-600">
                            - {formatRupiah(r.nominal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* 7. MODAL: Pembayaran Manual */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Catat Pembayaran Kasbon Manual"
        subtitle="Gunakan form ini jika karyawan melunasi kasbon secara tunai di luar slip gaji."
        maxWidth="md"
      >
        <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Bayar (Rp) *
            </label>
            <input
              type="number"
              min="10000"
              max={detailKasbon?.sisaPinjaman || 99999999}
              step="10000"
              required
              value={payNominal}
              onChange={(e) => setPayNominal(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan Pembayaran
            </label>
            <input
              type="text"
              value={payKeterangan}
              onChange={(e) => setPayKeterangan(e.target.value)}
              placeholder="Contoh: Titipan tunai langsung ke kasir"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
            >
              Konfirmasi Bayar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
