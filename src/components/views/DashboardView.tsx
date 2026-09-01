import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import {
  Users,
  Banknote,
  CreditCard,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileText,
  DollarSign,
  PieChart,
  CheckSquare,
} from 'lucide-react';
import { formatRupiah, formatTanggal, getNamaBulan } from '../../utils/formatters';
import { StaffPortalView } from './StaffPortalView';

export const DashboardView: React.FC = () => {
  const {
    karyawanList,
    gajiList,
    kasbonList,
    pengeluaranList,
    taskList,
    setActiveTab,
    companyInfo,
    currentUser,
  } = useApp();

  // If user is Staff, render the dedicated Staff Mobile Portal matching the user's wireframe
  if (currentUser?.role === 'Staff') {
    return <StaffPortalView />;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Calculations
  const totalKaryawan = karyawanList.length;
  const karyawanTetap = karyawanList.filter((k) => k.status === 'Tetap').length;
  const karyawanKontrak = karyawanList.filter((k) => k.status === 'Kontrak').length;

  // Total Gaji bulan berjalan (atau total gaji tercatat)
  const gajiBulanIni = gajiList.filter(
    (g) => g.periodeBulan === currentMonth && g.periodeTahun === currentYear
  );
  const totalGajiBulanIni = gajiBulanIni.reduce((acc, curr) => acc + curr.gajiBersih, 0);
  const totalGajiAll = gajiList.reduce((acc, curr) => acc + curr.gajiBersih, 0);

  // Total Kasbon Aktif
  const kasbonAktif = kasbonList.filter((k) => k.status === 'Aktif');
  const totalSisaKasbon = kasbonAktif.reduce((acc, curr) => acc + curr.sisaPinjaman, 0);
  const totalKasbonTercatat = kasbonList.reduce((acc, curr) => acc + curr.jumlahPinjaman, 0);

  // Total Pengeluaran Rutin Bulan Ini
  const pengeluaranBulanIni = pengeluaranList.filter((p) => {
    const d = new Date(p.tanggal);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  const totalPengeluaranBulanIni = pengeluaranBulanIni.reduce(
    (acc, curr) => acc + curr.nominal,
    0
  );

  // Total Arus Kas Keluar (Gaji + Pengeluaran Rutin Bulan Ini)
  const totalBebanOperasionalBulanIni = (totalGajiBulanIni > 0 ? totalGajiBulanIni : totalGajiAll) + totalPengeluaranBulanIni;

  // Breakdown Kategori Pengeluaran
  const pengeluaranByKategori: { [key: string]: number } = {};
  pengeluaranList.forEach((item) => {
    pengeluaranByKategori[item.kategori] =
      (pengeluaranByKategori[item.kategori] || 0) + item.nominal;
  });

  const topCategories = Object.entries(pengeluaranByKategori)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalSemuaPengeluaran = Object.values(pengeluaranByKategori).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Manajemen Kantor Real-Time
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Selamat Datang di {companyInfo.name}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Semua data operasional kantor, payroll karyawan, pemotongan kasbon otomatis, dan pencatatan kas keluar siap dikelola dengan lancar dan cepat.
          </p>
        </div>

        {/* Quick Actions in Banner */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('task')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            Tugas (Task)
          </button>
          <button
            onClick={() => setActiveTab('gaji')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Banknote className="w-4 h-4 text-brand-400" />
            Buat Slip Gaji
          </button>
          <button
            onClick={() => setActiveTab('kasbon')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-brand-400" />
            Catat Kasbon
          </button>
          <button
            onClick={() => setActiveTab('pengeluaran')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            Catat Pengeluaran
          </button>
          <button
            onClick={() => setActiveTab('karyawan')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-sky-400" />
            Kelola Karyawan
          </button>
        </div>
      </div>

      {/* 2. Four Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Karyawan"
          value={`${totalKaryawan} Orang`}
          subtitle={`${karyawanTetap} Tetap • ${karyawanKontrak} Kontrak`}
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-blue-50"
          iconTextColor="text-blue-600"
          onClick={() => setActiveTab('karyawan')}
        />
        <StatCard
          title={`Total Payroll (${getNamaBulan(currentMonth)})`}
          value={formatRupiah(totalGajiBulanIni > 0 ? totalGajiBulanIni : totalGajiAll)}
          subtitle={`${gajiBulanIni.length > 0 ? gajiBulanIni.length : gajiList.length} Slip Gaji Diterbitkan`}
          icon={<Banknote className="w-6 h-6" />}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          onClick={() => setActiveTab('gaji')}
        />
        <StatCard
          title="Sisa Kasbon Karyawan"
          value={formatRupiah(totalSisaKasbon)}
          subtitle={`${kasbonAktif.length} Pinjaman Belum Lunas`}
          icon={<CreditCard className="w-6 h-6" />}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
          onClick={() => setActiveTab('kasbon')}
        />
        <StatCard
          title={`Pengeluaran Rutin (${getNamaBulan(currentMonth)})`}
          value={formatRupiah(totalPengeluaranBulanIni)}
          subtitle={`${pengeluaranBulanIni.length} Transaksi Tercatat`}
          icon={<Receipt className="w-6 h-6" />}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          onClick={() => setActiveTab('pengeluaran')}
        />
      </div>

      {/* 3. Middle Section: Total Cashflow Overview & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Operational Cost Summary Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Ringkasan Alokasi Anggaran ({getNamaBulan(currentMonth)} {currentYear})
              </h3>
              <p className="text-xs text-slate-500">
                Kombinasi Pengeluaran Gaji & Beban Rutin Operasional Kantor
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-brand-50 text-brand-700 rounded-full">
              Periode Aktif
            </span>
          </div>

          {/* Big Number */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">
                Total Beban Kas Keluar Bulan Ini
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatRupiah(totalBebanOperasionalBulanIni)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Beban Payroll Gaji
                </span>
                <p className="font-bold text-slate-800">
                  {formatRupiah(totalGajiBulanIni > 0 ? totalGajiBulanIni : totalGajiAll)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Operasional Rutin
                </span>
                <p className="font-bold text-slate-800">
                  {formatRupiah(totalPengeluaranBulanIni)}
                </p>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Proporsi Beban:</span>
              <span>
                Gaji (
                {totalBebanOperasionalBulanIni > 0
                  ? Math.round(
                      ((totalGajiBulanIni > 0 ? totalGajiBulanIni : totalGajiAll) /
                        totalBebanOperasionalBulanIni) *
                        100
                    )
                  : 0}
                %) • Operasional (
                {totalBebanOperasionalBulanIni > 0
                  ? Math.round(
                      (totalPengeluaranBulanIni / totalBebanOperasionalBulanIni) * 100
                    )
                  : 0}
                %)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    totalBebanOperasionalBulanIni > 0
                      ? ((totalGajiBulanIni > 0 ? totalGajiBulanIni : totalGajiAll) /
                          totalBebanOperasionalBulanIni) *
                        100
                      : 50
                  }%`,
                }}
                className="bg-emerald-500 h-full"
                title="Gaji Karyawan"
              />
              <div
                style={{
                  width: `${
                    totalBebanOperasionalBulanIni > 0
                      ? (totalPengeluaranBulanIni / totalBebanOperasionalBulanIni) * 100
                      : 50
                  }%`,
                }}
                className="bg-rose-500 h-full"
                title="Pengeluaran Rutin"
              />
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] text-slate-500 block">Rata-rata Gaji</span>
              <span className="text-sm font-bold text-slate-800">
                {formatRupiah(
                  totalKaryawan > 0
                    ? (totalGajiBulanIni > 0 ? totalGajiBulanIni : totalGajiAll) /
                        (gajiBulanIni.length || totalKaryawan)
                    : 0
                )}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-[11px] text-slate-500 block">Kasbon Terbayar</span>
              <span className="text-sm font-bold text-emerald-600">
                {formatRupiah(totalKasbonTercatat - totalSisaKasbon)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 block">Kwitansi Tercetak</span>
              <span className="text-sm font-bold text-brand-600">
                {pengeluaranList.length} Transaksi
              </span>
            </div>
          </div>
        </div>

        {/* Top Operational Expenses by Category */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PieChart className="w-4 h-4 text-brand-600" />
                Pengeluaran Terbesar
              </h3>
              <button
                onClick={() => setActiveTab('pengeluaran')}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3.5">
              {topCategories.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Belum ada catatan pengeluaran rutin.
                </p>
              ) : (
                topCategories.map(([kategori, nominal]) => {
                  const percent =
                    totalSemuaPengeluaran > 0
                      ? Math.round((nominal / totalSemuaPengeluaran) * 100)
                      : 0;
                  return (
                    <div key={kategori} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 truncate max-w-[140px]">
                          {kategori}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatRupiah(nominal)} ({percent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="bg-brand-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('pengeluaran')}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-brand-600" />
              Catat Pengeluaran Baru
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Active Kasbon Monitoring & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Kasbon Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                Kasbon Karyawan Berjalan
              </h3>
              <p className="text-xs text-slate-500">
                Pinjaman yang otomatis tersinkron memotong gaji bulanan
              </p>
            </div>
            <button
              onClick={() => setActiveTab('kasbon')}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Kelola Kasbon
            </button>
          </div>

          <div className="space-y-3">
            {kasbonAktif.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Semua kasbon karyawan saat ini sudah lunas!
                </p>
              </div>
            ) : (
              kasbonAktif.map((kb) => {
                const emp = karyawanList.find((k) => k.id === kb.karyawanId);
                const progress = Math.round(
                  (kb.sudahDibayar / kb.jumlahPinjaman) * 100
                );
                return (
                  <div
                    key={kb.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-amber-200 bg-slate-50/50 hover:bg-amber-50/30 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {emp?.nama || 'Karyawan'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {emp?.jabatan} • No: {kb.nomorKasbon}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-amber-900 block">
                          Sisa: {formatRupiah(kb.sisaPinjaman)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Total Pinjam: {formatRupiah(kb.jumlahPinjaman)}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>
                          {kb.skema === 'Cicilan'
                            ? `Cicilan: ${formatRupiah(kb.cicilanPerBulan)} /bln`
                            : 'Potong Sekali Lunas'}
                        </span>
                        <span className="font-semibold text-slate-700">
                          Terbayar: {progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${progress}%` }}
                          className="bg-amber-500 h-full rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Routine Expenses */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Riwayat Pengeluaran Terbaru
              </h3>
              <p className="text-xs text-slate-500">
                Kwitansi pengeluaran operasional yang baru dicatat
              </p>
            </div>
            <button
              onClick={() => setActiveTab('pengeluaran')}
              className="text-xs text-brand-600 font-semibold hover:underline cursor-pointer"
            >
              Lihat Kwitansi
            </button>
          </div>

          <div className="space-y-3">
            {pengeluaranList.slice(0, 4).map((peng) => (
              <div
                key={peng.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 transition-all text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block truncate max-w-[200px] sm:max-w-xs">
                    {peng.keperluan}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                      {peng.kategori}
                    </span>
                    <span>• {formatTanggal(peng.tanggal)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-900 block">
                    {formatRupiah(peng.nominal)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {peng.nomorKwitansi}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Active Tasks Overview Widget */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-brand-600" />
              Tugas & Pekerjaan Berjalan (Task On Process)
            </h3>
            <p className="text-xs text-slate-500">
              Pekerjaan yang saat ini sedang diproses oleh staf kantor
            </p>
          </div>
          <button
            onClick={() => setActiveTab('task')}
            className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            Buka Menu Task
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {taskList.filter((t) => t.status === 'On Process').length === 0 ? (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Semua tugas telah diselesaikan dengan baik!
              </p>
            </div>
          ) : (
            taskList
              .filter((t) => t.status === 'On Process')
              .slice(0, 3)
              .map((task) => (
                <div
                  key={task.id}
                  onClick={() => setActiveTab('task')}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-300 bg-slate-50/40 hover:bg-white transition-all cursor-pointer space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 animate-pulse">
                        On Process
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Deadline: {formatTanggal(task.deadline)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-2">
                      {task.judul}
                    </h4>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                      Staf: {task.assignedToNama}
                    </span>
                    <span className="text-brand-600 font-bold hover:underline">
                      Detail &rarr;
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
