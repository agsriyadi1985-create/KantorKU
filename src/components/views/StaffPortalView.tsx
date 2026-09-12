import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, SkemaKasbon } from '../../types';
import { Modal } from '../common/Modal';
import { StaffRiwayatTransaksiModal } from './StaffRiwayatTransaksiModal';
import {
  CheckSquare,
  CreditCard,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Send,
  MessageSquare,
  RefreshCw,
  Banknote,
  Phone,
  MapPin,
  Eye,
  FileText,
  UserCheck,
  Save,
  Lock,
  Receipt,
} from 'lucide-react';
import { formatRupiah, formatTanggal, formatDateTime, getNamaBulan, normalizeNIK } from '../../utils/formatters';

const STATUS_OPTIONS: TaskStatus[] = ['On Process', 'Selesai', 'Batal'];

export const StaffPortalView: React.FC = () => {
  const {
    currentUser,
    karyawanList,
    taskList,
    fetchTasks,
    kasbonList,
    gajiList,
    transaksiHarianList,
    updateTaskStatus,
    addKasbon,
    companyInfo,
  } = useApp();

  // ── 1. Resolve active karyawan (priority: karyawanId → NIK match → name match) ──
  const resolveId = (): string => {
    if (!currentUser) return karyawanList[0]?.id || '';
    if (currentUser.karyawanId) {
      const byId = karyawanList.find((k) => k.id === currentUser.karyawanId);
      if (byId) return byId.id;
    }
    const normUsername = normalizeNIK(currentUser.username);
    const byNIK = karyawanList.find((k) => normalizeNIK(k.nik) === normUsername);
    if (byNIK) return byNIK.id;
    const byNama = karyawanList.find(
      (k) =>
        k.nama.toLowerCase().includes(currentUser.nama.toLowerCase()) ||
        currentUser.nama.toLowerCase().includes(k.nama.toLowerCase())
    );
    return byNama?.id || karyawanList[0]?.id || '';
  };

  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>('');

  useEffect(() => {
    if (karyawanList.length > 0) {
      setSelectedKaryawanId(resolveId());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, karyawanList.length]);

  const activeKaryawan = karyawanList.find((k) => k.id === selectedKaryawanId);

  // ── 2. Realtime Live Clock ──
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(currentTime);

  const formattedClock = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(currentTime);

  // ── 3. Helper: Cek apakah task ditugaskan ke staf yang sedang aktif / login ──
  const isTaskAssignedToMe = (t: Task | null | undefined): boolean => {
    if (!t) return false;
    if (currentUser?.role === 'Admin') return true;

    // 1. If assigned to ALL / Semua Karyawan
    if (
      t.assignedTo === 'ALL' ||
      t.assignedToNama?.toUpperCase().includes('ALL') ||
      t.assignedToNama?.toLowerCase().includes('semua')
    ) {
      return true;
    }

    // 2. Match against activeKaryawan
    if (activeKaryawan) {
      if (t.assignedTo && t.assignedTo === activeKaryawan.id) return true;
      if (t.assignedTo && normalizeNIK(t.assignedTo) === normalizeNIK(activeKaryawan.nik)) return true;

      const taskName = (t.assignedToNama || '').trim().toLowerCase();
      const empName = (activeKaryawan.nama || '').trim().toLowerCase();
      if (taskName && empName) {
        if (taskName.includes(empName) || empName.includes(taskName)) return true;
        const taskFirst = taskName.split(' ')[0];
        const empFirst = empName.split(' ')[0];
        if (taskFirst && empFirst && taskFirst === empFirst && taskFirst.length > 2) return true;
      }
    }

    // 3. Match against currentUser
    if (currentUser) {
      if (currentUser.karyawanId && t.assignedTo === currentUser.karyawanId) return true;
      const userNormNIK = normalizeNIK(currentUser.username);
      if (t.assignedTo && normalizeNIK(t.assignedTo) === userNormNIK) return true;
      const userName = (currentUser.nama || '').trim().toLowerCase();
      const taskName = (t.assignedToNama || '').trim().toLowerCase();
      if (userName && taskName) {
        if (taskName.includes(userName) || userName.includes(taskName)) return true;
        const userFirst = userName.split(' ')[0];
        const taskFirst = taskName.split(' ')[0];
        if (userFirst && taskFirst && userFirst === taskFirst && userFirst.length > 2) return true;
      }
    }

    return false;
  };

  const myTasks = taskList.filter((t) => isTaskAssignedToMe(t));
  const onProcessCount = myTasks.filter((t) => t.status === 'On Process').length;
  const myKasbonList = kasbonList.filter((k) => k.karyawanId === activeKaryawan?.id);
  const activeKasbon = myKasbonList.find((k) => k.status === 'Aktif' && k.sisaPinjaman > 0);
  const myGajiList = gajiList.filter((g) => g.karyawanId === activeKaryawan?.id);

  // ── 4. Modal States ──
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskFilterTab, setTaskFilterTab] = useState<'semua' | 'saya'>('semua');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TaskStatus>('On Process');
  const [catatanInput, setCatatanInput] = useState('');

  const displayedTasks = taskFilterTab === 'saya' ? myTasks : taskList;

  const [isKasbonModalOpen, setIsKasbonModalOpen] = useState(false);
  const [isRiwayatModalOpen, setIsRiwayatModalOpen] = useState(false);
  const [riwayatInitialTab, setRiwayatInitialTab] = useState<'gaji' | 'kasbon' | 'transaksi_harian'>('gaji');
  const currentMonthYear = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}`;
  const [kasbonNominal, setKasbonNominal] = useState<number>(1000000);
  const [kasbonSkema, setKasbonSkema] = useState<SkemaKasbon>('Cicilan');
  const [kasbonTenor, setKasbonTenor] = useState<number>(2);
  const [kasbonKeterangan, setKasbonKeterangan] = useState('');
  const [isSubmittingKasbon, setIsSubmittingKasbon] = useState(false);

  // ── Handlers ──
  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setCatatanInput(task.catatanStaff || '');
    setIsDetailModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (selectedTask.status === 'Selesai') {
      setIsDetailModalOpen(false);
      return;
    }
    // CEK HAK AKSES: Hanya staf yang ditugaskan atau Admin yang dapat mengubah status
    if (!isTaskAssignedToMe(selectedTask)) {
      alert('Hanya karyawan yang ditugaskan yang dapat mengedit dan mengubah status pekerjaan ini.');
      setIsDetailModalOpen(false);
      return;
    }
    await updateTaskStatus(selectedTask.id, newStatus, catatanInput.trim());
    setIsDetailModalOpen(false);
  };

  const cicilanCalc = () => {
    if (kasbonSkema === 'Sekali_Lunas') return kasbonNominal;
    return Math.ceil(kasbonNominal / (kasbonTenor || 1));
  };

  const handleKasbonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKaryawan) { alert('Profil karyawan belum tersedia.'); return; }
    if (kasbonNominal <= 0) { alert('Nominal kasbon tidak valid.'); return; }
    if (!kasbonKeterangan.trim()) { alert('Mohon isi keperluan kasbon.'); return; }
    setIsSubmittingKasbon(true);
    try {
      await addKasbon({
        karyawanId: activeKaryawan.id,
        tanggalPinjam: currentTime.toISOString().split('T')[0],
        jumlahPinjaman: kasbonNominal,
        skema: kasbonSkema,
        tenorBulan: kasbonSkema === 'Sekali_Lunas' ? 1 : kasbonTenor,
        cicilanPerBulan: cicilanCalc(),
        periodeMulai: currentMonthYear,
        keterangan: `[Pengajuan Staf] ${kasbonKeterangan.trim()}`,
      });
      setIsKasbonModalOpen(false);
      setKasbonKeterangan('');
    } finally {
      setIsSubmittingKasbon(false);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    if (status === 'Selesai') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Selesai
      </span>
    );
    if (status === 'On Process') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
        <Clock className="w-3 h-3" /> On Process
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <XCircle className="w-3 h-3" /> Batal
      </span>
    );
  };

  // ── Loading state when karyawan not yet loaded ──
  if (karyawanList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-black text-xl">
            {currentUser?.username?.substring(0, 2).toUpperCase() || 'ST'}
          </span>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-slate-800">
            {currentUser?.nama || currentUser?.username || 'Selamat Datang'}
          </h3>
          <p className="text-xs text-slate-500">Memuat data karyawan...</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div className="max-w-md mx-auto w-full space-y-4 pb-8 select-none">

      {/* ═══════════════════════════════════════════════════
          1. KARTU PROFIL KARYAWAN
      ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        {/* Header strip */}
        <div className="h-20 bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="absolute top-2.5 right-3 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-bold text-white tracking-wider uppercase border border-white/20">
            {companyInfo.logoText || 'KANTORKU'}
          </div>
        </div>

        <div className="px-5 pb-5 pt-0">
          {/* Avatar */}
          <div className="flex justify-center -mt-11 mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg ring-4 ring-brand-500/20">
                {activeKaryawan?.avatarUrl ? (
                  <img src={activeKaryawan.avatarUrl} alt={activeKaryawan.nama} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl">
                    {(activeKaryawan?.nama || currentUser?.nama || 'ST').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
          </div>

          {/* Name & title */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {activeKaryawan?.nama || currentUser?.nama || 'Karyawan'}
            </h2>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                {activeKaryawan?.jabatan || 'Staff'}
              </span>
              <span className="text-slate-400 text-[11px]">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {activeKaryawan?.divisi || 'Divisi Umum'}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">NIK</span>
                <p className="font-mono font-bold text-slate-800 text-[11px] truncate">
                  {activeKaryawan?.nik || currentUser?.username || '-'}
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                <p className="font-bold text-emerald-700 text-[11px]">{activeKaryawan?.status || 'Tetap'}</p>
              </div>
            </div>

            {/* Sisa Kasbon */}
            <div
              onClick={() => {
                setRiwayatInitialTab('kasbon');
                setIsRiwayatModalOpen(true);
              }}
              title="Klik untuk melihat riwayat kasbon"
              className="pt-2 border-t border-slate-200/60 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 p-1 -mx-1 rounded-xl transition-all group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-700 transition-colors flex items-center gap-1">
                <span>Sisa Kasbon</span>
                <span className="text-[9px] text-amber-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  (Rincian)
                </span>
              </span>
              <span className={`text-xs font-black font-mono ${activeKasbon ? 'text-amber-700' : 'text-slate-600'}`}>
                {activeKasbon ? formatRupiah(activeKasbon.sisaPinjaman) : 'Rp 0 (Lunas)'}
              </span>
            </div>

            {/* Gaji Pokok */}
            <div
              onClick={() => {
                setRiwayatInitialTab('gaji');
                setIsRiwayatModalOpen(true);
              }}
              title="Klik untuk melihat riwayat slip gaji"
              className="pt-2 border-t border-slate-200/60 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 p-1 -mx-1 rounded-xl transition-all group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gaji Pokok</span>
                <span className="text-[9px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  (Slip)
                </span>
              </span>
              <span className="text-xs font-black font-mono text-emerald-700">
                {formatRupiah(activeKaryawan?.gajiPokok || 0)}
              </span>
            </div>

            {/* Nomor Kontak */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>Nomor Kontak</span>
              </span>
              <span className="text-xs font-bold font-mono text-slate-800">
                {activeKaryawan?.noHp || '-'}
              </span>
            </div>

            {/* Alamat Petugas */}
            <div className="pt-2 border-t border-slate-200/60 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Alamat Petugas</span>
              </span>
              <p className="text-[11px] font-medium text-slate-700 leading-snug pl-4">
                {activeKaryawan?.alamat || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          2. MENU UTAMA: TASK, PENGAJUAN KASBON & RIWAYAT TRANSAKSI (3 MENU SEJAJAR)
      ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Card 1: TASK */}
        <button
          type="button"
          onClick={() => {
            fetchTasks();
            setIsTaskModalOpen(true);
          }}
          className="bg-white hover:bg-slate-50 p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-97"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-brand-600 block truncate">
                Menu Utama
              </span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight line-clamp-2 min-h-[2rem]">
                TASK
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                Tugas & Status
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 truncate">
              {onProcessCount} Process
            </span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </button>

        {/* Card 2: PENGAJUAN KASBON */}
        <button
          type="button"
          onClick={() => setIsKasbonModalOpen(true)}
          className="bg-white hover:bg-slate-50 p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-97"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-amber-600 block truncate">
                Fasilitas
              </span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight line-clamp-2 min-h-[2rem]">
                PENGAJUAN KASBON
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                Bulan Berjalan
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 truncate">
              Ajukan
            </span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </button>

        {/* Card 3: RIWAYAT TRANSAKSI */}
        <button
          type="button"
          onClick={() => {
            setRiwayatInitialTab('gaji');
            setIsRiwayatModalOpen(true);
          }}
          className="bg-white hover:bg-slate-50 p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-97"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-emerald-600 block truncate">
                Keuangan
              </span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight line-clamp-2 min-h-[2rem]">
                RIWAYAT TRANSAKSI
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                Gaji, Kasbon & Transaksi Harian
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 truncate">
              {transaksiHarianList.length > 0 ? `${transaksiHarianList.length} Trx` : `${myGajiList.length} Slip`}
            </span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          3. TANGGAL & JAM REALTIME
      ═══════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-4 text-white shadow-lg border border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-28 h-28 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-brand-400 text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Waktu & Tanggal Realtime</span>
            </div>
            <h4 className="text-sm font-extrabold text-white leading-tight truncate">{formattedDate}</h4>
            <p className="text-[10px] text-slate-400">Waktu Lokal Indonesia</p>
          </div>
          <div className="text-right shrink-0 bg-slate-950/60 border border-slate-700/70 px-3 py-2 rounded-2xl shadow-inner">
            <div className="flex items-center gap-1.5 font-mono text-base font-black text-brand-400 tracking-wider">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{formattedClock}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block text-center mt-0.5">LIVE</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL: DAFTAR TASK
      ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Daftar Tugas & Pekerjaan"
        subtitle={`Staf: ${activeKaryawan?.nama || 'Karyawan'}`}
        maxWidth="lg"
      >
        {/* Header Tab Filter: Semua Tugas vs Tugas Saya */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setTaskFilterTab('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                taskFilterTab === 'semua'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Tugas ({taskList.length})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilterTab('saya')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                taskFilterTab === 'saya'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tugas Saya ({myTasks.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchTasks()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
            <span>Segarkan</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {displayedTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {taskFilterTab === 'saya'
                    ? 'Belum ada tugas yang ditugaskan ke Anda'
                    : 'Belum ada tugas pekerjaan'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {taskFilterTab === 'saya'
                    ? 'Anda dapat meninjau tugas pekerjaan kantor lainnya di tab "Semua Tugas".'
                    : 'Admin belum membuat tugas pekerjaan.'}
                </p>
              </div>
            </div>
          ) : (
            displayedTasks.map((task) => {
              const isAssigned = isTaskAssignedToMe(task);
              return (
                <div key={task.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getStatusBadge(task.status)}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {task.prioritas}
                      </span>
                      {isAssigned ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Tugas Anda
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" /> {task.assignedToNama || 'Petugas Lain'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Deadline: {formatTanggal(task.deadline)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{task.judul}</h4>
                    {task.deskripsi && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.deskripsi}</p>}
                  </div>

                  {task.catatanStaff && (
                    <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-900 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[11px] block">Catatan Progres:</span>
                        <p className="text-[11px]">{task.catatanStaff}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Oleh: {task.createdBy || 'Admin'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(task)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer ${
                        isAssigned
                          ? 'bg-brand-600 hover:bg-brand-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail & Ubah Status</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lihat (Hanya Baca)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════
          MODAL: DETAIL LENGKAP TUGAS & UBAH STATUS
      ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Lengkap Tugas"
        subtitle="Rincian penugasan pekerjaan & formulir pembaruan status"
        maxWidth="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            {/* Header: Judul & Badges */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(selectedTask.status)}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                    Prioritas: {selectedTask.prioritas}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  Deadline: {formatTanggal(selectedTask.deadline)}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {selectedTask.judul}
              </h3>
            </div>

            {/* Informasi Detail Penugasan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ditugaskan Kepada
                </span>
                <p className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                  <span>{selectedTask.assignedToNama || activeKaryawan?.nama || 'Petugas'}</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Dibuat Oleh (Admin)
                </span>
                <p className="font-bold text-slate-800 text-[11px]">
                  {selectedTask.createdBy || 'Agus Riyadi (Admin)'}
                </p>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Waktu Tugas Diinput Admin
                </span>
                <p className="font-mono font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>{formatDateTime(selectedTask.createdAt)}</span>
                </p>
              </div>
            </div>

            {/* Deskripsi / Instruksi Pekerjaan */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
                <span>Deskripsi & Instruksi Pekerjaan:</span>
              </span>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap pl-1">
                {selectedTask.deskripsi ? selectedTask.deskripsi : 'Tidak ada instruksi tambahan dari admin.'}
              </p>
            </div>

            {/* Status Section: Read-Only if Selesai OR Not Assigned to current employee */}
            {selectedTask.status === 'Selesai' ? (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                {/* Banner Status Selesai / Terkunci */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                        Tugas Ini Telah Selesai
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-md">
                        <Lock className="w-2.5 h-2.5" /> Terkunci (Hanya Lihat)
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-snug">
                      Tugas yang sudah ditandai selesai telah dikunci secara otomatis dan tidak dapat diubah kembali oleh petugas.
                    </p>
                  </div>
                </div>

                {/* Catatan Petugas (Jika Ada) */}
                {selectedTask.catatanStaff && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Catatan Penyelesaian Petugas:
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {selectedTask.catatanStaff}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : !isTaskAssignedToMe(selectedTask) ? (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                {/* Banner Bukan Petugas yang Ditugaskan */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                        Mode Hanya Lihat (Read-Only)
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                        Ditugaskan ke: {selectedTask.assignedToNama || 'Petugas Lain'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Tugas ini ditugaskan kepada <b>{selectedTask.assignedToNama}</b>. Semua karyawan dapat melihat rincian instruksi tugas ini, namun hanya karyawan yang ditugaskan yang dapat mengedit atau mengubah status pengerjaannya.
                    </p>
                  </div>
                </div>

                {/* Catatan Petugas (Jika Ada) */}
                {selectedTask.catatanStaff && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Catatan Progres Petugas:
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {selectedTask.catatanStaff}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* Form Ubah Status Pekerjaan */
              <form onSubmit={handleSaveStatus} className="space-y-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Ubah Status Pekerjaan Ini *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.map((st) => {
                      const isSelected = newStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? st === 'Selesai'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                                : st === 'On Process'
                                ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300'
                                : 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {st === 'Selesai' && <CheckCircle2 className="w-4 h-4" />}
                          {st === 'On Process' && <Clock className="w-4 h-4" />}
                          {st === 'Batal' && <XCircle className="w-4 h-4" />}
                          <span>{st}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Progres / Keterangan Petugas (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={catatanInput}
                    onChange={(e) => setCatatanInput(e.target.value)}
                    placeholder="Contoh: Pekerjaan telah selesai dikerjakan dan berkas sudah dikirim..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Status</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════
          MODAL: PENGAJUAN KASBON
      ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isKasbonModalOpen}
        onClose={() => setIsKasbonModalOpen(false)}
        title="Pengajuan Kasbon"
        subtitle={`${activeKaryawan?.nama || 'Karyawan'} (${activeKaryawan?.nik || ''})`}
        maxWidth="md"
      >
        <form onSubmit={handleKasbonSubmit} className="space-y-3.5">
          {activeKasbon && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Kasbon Aktif:</span>
                <p className="text-[11px]">Sisa {formatRupiah(activeKasbon.sisaPinjaman)} akan tetap berjalan.</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">Periode: {getNamaBulan(currentTime.getMonth() + 1)} {currentTime.getFullYear()}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 font-mono">{currentMonthYear}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Pinjaman (Rp) *</label>
            <input
              type="number" min={50000} step={50000} required
              value={kasbonNominal || ''}
              onChange={(e) => setKasbonNominal(Number(e.target.value))}
              placeholder="Contoh: 1000000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {[500000, 1000000, 1500000, 2000000].map((p) => (
                <button key={p} type="button" onClick={() => setKasbonNominal(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    kasbonNominal === p ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}>
                  {formatRupiah(p)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Skema</label>
              <select value={kasbonSkema} onChange={(e) => setKasbonSkema(e.target.value as SkemaKasbon)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500">
                <option value="Cicilan">Cicilan Bulanan</option>
                <option value="Sekali_Lunas">Sekali Lunas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tenor (Bulan)</label>
              <select disabled={kasbonSkema === 'Sekali_Lunas'} value={kasbonSkema === 'Sekali_Lunas' ? 1 : kasbonTenor}
                onChange={(e) => setKasbonTenor(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 disabled:opacity-50">
                {[1, 2, 3, 6, 12].map((t) => <option key={t} value={t}>{t} Bulan</option>)}
              </select>
            </div>
          </div>

          <div className="p-3 bg-brand-50/60 border border-brand-100 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-brand-900 font-semibold">Estimasi Potong Gaji:</span>
            <span className="text-brand-900 font-black font-mono text-sm">{formatRupiah(cicilanCalc())} / bulan</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keperluan *</label>
            <input type="text" required value={kasbonKeterangan} onChange={(e) => setKasbonKeterangan(e.target.value)}
              placeholder="Contoh: Biaya pengobatan / pendidikan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setIsKasbonModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
              Batal
            </button>
            <button type="submit" disabled={isSubmittingKasbon}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingKasbon ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════
          MODAL: RIWAYAT TRANSAKSI (GAJI & KASBON)
      ═══════════════════════════════════════════════════ */}
      <StaffRiwayatTransaksiModal
        isOpen={isRiwayatModalOpen}
        onClose={() => setIsRiwayatModalOpen(false)}
        karyawan={activeKaryawan}
        companyInfo={companyInfo}
        gajiList={gajiList}
        kasbonList={kasbonList}
        transaksiHarianList={transaksiHarianList}
        initialTab={riwayatInitialTab}
      />

    </div>
  );
};
