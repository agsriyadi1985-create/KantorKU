import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Gaji, Karyawan, StatusGaji } from '../../types';
import { Modal } from '../common/Modal';
import { SlipGajiModern } from '../print/SlipGajiModern';
import {
  Banknote,
  PlusCircle,
  Printer,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Building,
  User,
  Sparkles,
  FileText,
  DollarSign,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggal,
  DAFTAR_BULAN,
  getNamaBulan,
} from '../../utils/formatters';

export const GajiView: React.FC = () => {
  const {
    gajiList,
    karyawanList,
    kasbonList,
    companyInfo,
    addGaji,
    updateGaji,
    deleteGaji,
    markGajiAsPaid,
    getActiveKasbonByKaryawan,
  } = useApp();

  const now = new Date();
  const [filterBulan, setFilterBulan] = useState<number>(now.getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState<number>(now.getFullYear());
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState<Gaji | null>(null);

  // Form State
  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>('');
  const [formPeriodeBulan, setFormPeriodeBulan] = useState<number>(now.getMonth() + 1);
  const [formPeriodeTahun, setFormPeriodeTahun] = useState<number>(now.getFullYear());
  const [formStatus, setFormStatus] = useState<StatusGaji>('Dibayar');
  const [formCatatan, setFormCatatan] = useState('');

  // Income Components
  const [gajiPokok, setGajiPokok] = useState<number>(0);
  const [tunjanganMakan, setTunjanganMakan] = useState<number>(0);
  const [tunjanganTransport, setTunjanganTransport] = useState<number>(0);
  const [tunjanganJabatan, setTunjanganJabatan] = useState<number>(0);
  const [lembur, setLembur] = useState<number>(0);
  const [bonusKinerja, setBonusKinerja] = useState<number>(0);
  const [tunjanganLain, setTunjanganLain] = useState<number>(0);
  const [ketTunjanganLain, setKetTunjanganLain] = useState('');

  // Deduction Components
  const [potonganKasbon, setPotonganKasbon] = useState<number>(0);
  const [kasbonId, setKasbonId] = useState<string | undefined>(undefined);
  const [activeKasbonInfo, setActiveKasbonInfo] = useState<any>(null);
  const [bpjsKesehatan, setBpjsKesehatan] = useState<number>(0);
  const [bpjsKetenagakerjaan, setBpjsKetenagakerjaan] = useState<number>(0);
  const [pph21, setPph21] = useState<number>(0);
  const [potonganAbsen, setPotonganAbsen] = useState<number>(0);
  const [potonganLain, setPotonganLain] = useState<number>(0);
  const [ketPotonganLain, setKetPotonganLain] = useState('');

  // Filtered List
  const filteredGaji = gajiList.filter((g) => {
    const karyawan = karyawanList.find((k) => k.id === g.karyawanId);
    const matchBulan = filterBulan === 0 || g.periodeBulan === filterBulan;
    const matchTahun = g.periodeTahun === filterTahun;
    const matchStatus = filterStatus === 'Semua' || g.status === filterStatus;
    const matchSearch =
      !searchTerm ||
      g.nomorSlip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      karyawan?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      karyawan?.nik.toLowerCase().includes(searchTerm.toLowerCase());

    return matchBulan && matchTahun && matchStatus && matchSearch;
  });

  // Handle Employee Selection & Auto-fill Data + Kasbon Sync
  const handleSelectEmployee = (karyawanId: string) => {
    setSelectedKaryawanId(karyawanId);
    const emp = karyawanList.find((k) => k.id === karyawanId);
    if (!emp) return;

    // 1. Auto-fill base income from employee master
    setGajiPokok(emp.gajiPokok);
    setTunjanganMakan(emp.tunjanganMakan);
    setTunjanganTransport(emp.tunjanganTransport);
    setTunjanganJabatan(emp.tunjanganJabatan);
    setLembur(0);
    setBonusKinerja(0);
    setTunjanganLain(0);
    setKetTunjanganLain('');

    // 2. Standard BPJS Estimate (e.g., 1% Kes, 2% TK)
    setBpjsKesehatan(Math.round(emp.gajiPokok * 0.01));
    setBpjsKetenagakerjaan(Math.round(emp.gajiPokok * 0.02));
    setPph21(0);
    setPotonganAbsen(0);
    setPotonganLain(0);
    setKetPotonganLain('');

    // 3. AUTO-SYNC KASBON
    const activeKasbon = getActiveKasbonByKaryawan(karyawanId);
    if (activeKasbon) {
      const deduction =
        activeKasbon.skema === 'Cicilan'
          ? Math.min(activeKasbon.cicilanPerBulan, activeKasbon.sisaPinjaman)
          : activeKasbon.sisaPinjaman;

      setPotonganKasbon(deduction);
      setKasbonId(activeKasbon.id);
      setActiveKasbonInfo(activeKasbon);
    } else {
      setPotonganKasbon(0);
      setKasbonId(undefined);
      setActiveKasbonInfo(null);
    }
  };

  const handleOpenCreateModal = () => {
    if (karyawanList.length === 0) {
      alert('Belum ada data karyawan. Tambahkan karyawan terlebih dahulu di Menu Karyawan.');
      return;
    }
    const defaultEmp = karyawanList[0];
    handleSelectEmployee(defaultEmp.id);
    setFormPeriodeBulan(filterBulan > 0 ? filterBulan : now.getMonth() + 1);
    setFormPeriodeTahun(filterTahun);
    setFormStatus('Dibayar');
    setFormCatatan('');
    setIsFormOpen(true);
  };

  // Live Calculations
  const totalPendapatan =
    Number(gajiPokok || 0) +
    Number(tunjanganMakan || 0) +
    Number(tunjanganTransport || 0) +
    Number(tunjanganJabatan || 0) +
    Number(lembur || 0) +
    Number(bonusKinerja || 0) +
    Number(tunjanganLain || 0);

  const totalPotongan =
    Number(potonganKasbon || 0) +
    Number(bpjsKesehatan || 0) +
    Number(bpjsKetenagakerjaan || 0) +
    Number(pph21 || 0) +
    Number(potonganAbsen || 0) +
    Number(potonganLain || 0);

  const gajiBersih = Math.max(0, totalPendapatan - totalPotongan);

  const handleSubmitSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKaryawanId) {
      alert('Pilih karyawan terlebih dahulu');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newGaji = addGaji({
      karyawanId: selectedKaryawanId,
      periodeBulan: formPeriodeBulan,
      periodeTahun: formPeriodeTahun,
      tanggalBayar: formStatus === 'Dibayar' ? today : undefined,
      status: formStatus,
      pendapatan: {
        gajiPokok,
        tunjanganMakan,
        tunjanganTransport,
        tunjanganJabatan,
        lembur,
        bonusKinerja,
        tunjanganLain,
        ketTunjanganLain,
      },
      potongan: {
        kasbon: potonganKasbon,
        kasbonId: kasbonId,
        bpjsKesehatan,
        bpjsKetenagakerjaan,
        pph21,
        potonganAbsen,
        potonganLain,
        ketPotonganLain,
      },
      totalPendapatan,
      totalPotongan,
      gajiBersih,
      catatan: formCatatan,
    });

    setIsFormOpen(false);
    // Optionally open print preview directly
    setSelectedSlipForPrint(newGaji);
  };

  const handleDeleteSlip = (slip: Gaji) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus slip gaji ${slip.nomorSlip}?`
      )
    ) {
      deleteGaji(slip.id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Slip Gaji (Payroll)
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan gaji bulanan, pemotongan kasbon otomatis, dan cetak slip gaji modern
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Buat Slip Gaji Baru
        </button>
      </div>

      {/* 2. Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nomor Slip, Nama Karyawan, atau NIK..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        {/* Bulan */}
        <div className="sm:col-span-3">
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

        {/* Status */}
        <div className="sm:col-span-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-semibold text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            <option value="Dibayar">Dibayar (Paid)</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* 3. Payroll Slip Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredGaji.length === 0 ? (
          <div className="p-12 text-center">
            <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">
              Tidak ada slip gaji pada periode ini
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Silakan klik tombol "Buat Slip Gaji Baru" untuk mencatat penggajian karyawan bulan ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">No Slip & Periode</th>
                  <th className="py-3.5 px-4">Karyawan</th>
                  <th className="py-3.5 px-4">Total Pendapatan</th>
                  <th className="py-3.5 px-4">Potongan (Kasbon)</th>
                  <th className="py-3.5 px-4">Gaji Bersih (THP)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi & Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGaji.map((g) => {
                  const emp = karyawanList.find((k) => k.id === g.karyawanId);
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-700 block">
                          {g.nomorSlip}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {getNamaBulan(g.periodeBulan)} {g.periodeTahun}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{emp?.nama || 'Karyawan Dihapus'}</p>
                        <p className="text-[11px] text-slate-400">
                          {emp?.jabatan} • NIK: {emp?.nik}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatRupiah(g.totalPendapatan)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-rose-600 font-semibold block">
                          - {formatRupiah(g.totalPotongan)}
                        </span>
                        {g.potongan.kasbon > 0 && (
                          <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                            Kasbon: {formatRupiah(g.potongan.kasbon)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {formatRupiah(g.gajiBersih)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {emp?.namaBank} {emp?.noRekening}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            g.status === 'Dibayar'
                              ? 'bg-emerald-50 text-emerald-700'
                              : g.status === 'Disetujui'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSlipForPrint(g)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                            title="Pratinjau & Cetak Slip Gaji Modern"
                          >
                            <Printer className="w-3.5 h-3.5 text-brand-300" />
                            Cetak
                          </button>

                          {g.status !== 'Dibayar' && (
                            <button
                              onClick={() => markGajiAsPaid(g.id)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title="Tandai Sudah Dibayar"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSlip(g)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Slip"
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

      {/* 4. MODAL: Buat Slip Gaji Baru (With Live Auto-Sync) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Buat Slip Gaji Karyawan"
        subtitle="Sistem secara otomatis menyinkronkan data kasbon dan gaji pokok."
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmitSlip} className="space-y-6">
          {/* Baris 1: Pilih Karyawan & Periode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Pilih Karyawan *
              </label>
              <select
                required
                value={selectedKaryawanId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500"
              >
                {karyawanList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} ({emp.nik}) - {emp.jabatan}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Periode Bulan
              </label>
              <select
                value={formPeriodeBulan}
                onChange={(e) => setFormPeriodeBulan(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500"
              >
                {DAFTAR_BULAN.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Periode Tahun & Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={formPeriodeTahun}
                  onChange={(e) => setFormPeriodeTahun(Number(e.target.value))}
                  className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as StatusGaji)}
                  className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                >
                  <option value="Dibayar">Dibayar</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alert Sinkronisasi Kasbon (Jika ada kasbon aktif) */}
          {activeKasbonInfo && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-amber-900">
                  Sinkronisasi Kasbon Terdeteksi ({activeKasbonInfo.nomorKasbon})
                </span>
                <p className="text-amber-800">
                  Karyawan ini memiliki sisa pinjaman{' '}
                  <strong>{formatRupiah(activeKasbonInfo.sisaPinjaman)}</strong>.
                  Potongan otomatis{' '}
                  <strong>{formatRupiah(potonganKasbon)}</strong> telah ditambahkan ke
                  tabel potongan di bawah.
                </p>
              </div>
            </div>
          )}

          {/* Form Pendapatan & Potongan 2 Kolom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Kolom 1: Pendapatan */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  1. Rincian Pendapatan (Earnings)
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {formatRupiah(totalPendapatan)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-slate-600 mb-0.5">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={gajiPokok}
                    onChange={(e) => setGajiPokok(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Tunj. Makan</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={tunjanganMakan}
                      onChange={(e) => setTunjanganMakan(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Tunj. Transport</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={tunjanganTransport}
                      onChange={(e) => setTunjanganTransport(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Tunj. Jabatan</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={tunjanganJabatan}
                      onChange={(e) => setTunjanganJabatan(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Uang Lembur</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={lembur}
                      onChange={(e) => setLembur(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Bonus / Insentif</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={bonusKinerja}
                      onChange={(e) => setBonusKinerja(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Tunjangan Lain</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={tunjanganLain}
                      onChange={(e) => setTunjanganLain(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom 2: Pemotongan */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  2. Rincian Pemotongan (Deductions)
                </span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  {formatRupiah(totalPotongan)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Potongan Kasbon */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5">
                    Potongan Kasbon (Tersinkron Otomatis)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={potonganKasbon}
                    onChange={(e) => setPotonganKasbon(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-amber-50/70 border border-amber-300 rounded-lg font-bold text-amber-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">BPJS Kesehatan</label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={bpjsKesehatan}
                      onChange={(e) => setBpjsKesehatan(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">BPJS Ketenagakerjaan</label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={bpjsKetenagakerjaan}
                      onChange={(e) =>
                        setBpjsKetenagakerjaan(Number(e.target.value))
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5">PPh 21 (Pajak)</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={pph21}
                      onChange={(e) => setPph21(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Potongan Absensi</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={potonganAbsen}
                      onChange={(e) => setPotonganAbsen(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-0.5">Potongan Lainnya</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={potonganLain}
                    onChange={(e) => setPotonganLain(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Box Take Home Pay */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Gaji Bersih Diterima (Take Home Pay)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {formatRupiah(gajiBersih)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Simpan & Terbitkan Slip
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL / PRATINJAU SLIP GAJI MODERN (SIAP CETAK) */}
      {selectedSlipForPrint && (
        <Modal
          isOpen={!!selectedSlipForPrint}
          onClose={() => setSelectedSlipForPrint(null)}
          title="Pratinjau Slip Gaji"
          maxWidth="4xl"
        >
          {(() => {
            const emp = karyawanList.find(
              (k) => k.id === selectedSlipForPrint.karyawanId
            );
            if (!emp) return <p>Data karyawan tidak ditemukan</p>;
            return (
              <SlipGajiModern
                gaji={selectedSlipForPrint}
                karyawan={emp}
                companyInfo={companyInfo}
                onClose={() => setSelectedSlipForPrint(null)}
              />
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
