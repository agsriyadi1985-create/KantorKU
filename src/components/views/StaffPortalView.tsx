import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, TaskPriority, Kasbon, SkemaKasbon, Karyawan } from '../../types';
import { Modal } from '../common/Modal';
import {
  CheckSquare,
  CreditCard,
  Clock,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Send,
  PlusCircle,
  Briefcase,
  BadgeCheck,
  Building2,
  DollarSign,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { formatRupiah, formatTanggal, getNamaBulan, normalizeNIK } from '../../utils/formatters';

const STATUS_OPTIONS: TaskStatus[] = ['On Process', 'Selesai', 'Batal'];

export const StaffPortalView: React.FC = () => {
  const {
    currentUser,
    karyawanList,
    taskList,
    kasbonList,
    updateTaskStatus,
    addKasbon,
    companyInfo,
  } = useApp();

  // 1. Determine active employee by karyawanId first, then NIK match, then name match
  const resolveKaryawan = () => {
    if (currentUser?.karyawanId) {
      const byId = karyawanList.find((k) => k.id === currentUser.karyawanId);
      if (byId) return byId.id;
    }
    // Username "KTK2026001" -> NIK "KTK-2026-001"
    const normUsername = normalizeNIK(currentUser?.username);
    const byNIK = karyawanList.find((k) => normalizeNIK(k.nik) === normUsername);
    if (byNIK) return byNIK.id;
    // Fallback: name match
    const byNama = karyawanList.find(
      (k) =>
        k.nama.toLowerCase().includes(currentUser?.nama.toLowerCase() || '') ||
        currentUser?.nama.toLowerCase().includes(k.nama.toLowerCase())
    );
    if (byNama) return byNama.id;
    return karyawanList[0]?.id || '';
  };

  const [selectedKaryawanId, setSelectedKaryawanId] = useState<string>(resolveKaryawan);

  useEffect(() => {
    setSelectedKaryawanId(resolveKaryawan());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, karyawanList.length]);

  const activeKaryawan = karyawanList.find((k) => k.id === selectedKaryawanId) || karyawanList[0];

  // 2. Realtime Live Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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

  // 3. Employee's active kasbon & tasks — strict filter to current employee only
  const myTasks = taskList.filter((t) => {
    if (!activeKaryawan) return false;
    return (
      t.assignedTo === activeKaryawan.id ||
      t.assignedToNama.toLowerCase().includes(activeKaryawan.nama.toLowerCase()) ||
      activeKaryawan.nama.toLowerCase().includes(t.assignedToNama.toLowerCase())
    );
  });

  // displayTasks is purely filtered to the active employee (never leaks other employees' tasks)
  const displayTasks = myTasks;
  const onProcessTasksCount = displayTasks.filter((t) => t.status === 'On Process').length;
  const selesaiTasksCount = displayTasks.filter((t) => t.status === 'Selesai').length;

  const myKasbonList = kasbonList.filter((k) => k.karyawanId === activeKaryawan?.id);
  const activeKasbon = myKasbonList.find((k) => k.status === 'Aktif' && k.sisaPinjaman > 0);

  // 4. Modal States
  // Modal Task List & Update Status
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<Task | null>(null);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TaskStatus>('On Process');
  const [catatanStaffInput, setCatatanStaffInput] = useState('');

  // Modal Pengajuan Kasbon
  const [isKasbonModalOpen, setIsKasbonModalOpen] = useState(false);
  const currentMonthYear = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}`;
  const [kasbonNominal, setKasbonNominal] = useState<number>(1000000);
  const [kasbonSkema, setKasbonSkema] = useState<SkemaKasbon>('Cicilan');
  const [kasbonTenor, setKasbonTenor] = useState<number>(2);
  const [kasbonKeterangan, setKasbonKeterangan] = useState('');
  const [isSubmittingKasbon, setIsSubmittingKasbon] = useState(false);

  // Handlers
  const handleOpenEditStatus = (task: Task) => {
    setSelectedTaskForStatus(task);
    setNewStatus(task.status);
    setCatatanStaffInput(task.catatanStaff || '');
    setIsEditStatusModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForStatus) return;
    await updateTaskStatus(selectedTaskForStatus.id, newStatus, catatanStaffInput.trim());
    setIsEditStatusModalOpen(false);
  };

  const handleCicilanCalc = () => {
    if (kasbonSkema === 'Sekali_Lunas') return kasbonNominal;
    return Math.ceil(kasbonNominal / (kasbonTenor || 1));
  };

  const handlePengajuanKasbonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKaryawan) {
      alert('Profil karyawan belum dipilih.');
      return;
    }
    if (kasbonNominal <= 0) {
      alert('Mohon masukkan nominal kasbon yang valid.');
      return;
    }
    if (!kasbonKeterangan.trim()) {
      alert('Mohon isi keperluan pengajuan kasbon.');
      return;
    }

    setIsSubmittingKasbon(true);
    try {
      const todayStr = currentTime.toISOString().split('T')[0];
      const cicilan = handleCicilanCalc();

      await addKasbon({
        karyawanId: activeKaryawan.id,
        tanggalPinjam: todayStr,
        jumlahPinjaman: kasbonNominal,
        skema: kasbonSkema,
        tenorBulan: kasbonSkema === 'Sekali_Lunas' ? 1 : kasbonTenor,
        cicilanPerBulan: cicilan,
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
    switch (status) {
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Selesai
          </span>
        );
      case 'On Process':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 animate-pulse">
            <Clock className="w-3 h-3 text-sky-600" />
            On Process
          </span>
        );
      case 'Batal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Batal
          </span>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto w-full space-y-4 pb-8 select-none">
      {/* ─── LOADING / SKELETON STATE ─── */}
      {karyawanList.length === 0 && (
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
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {karyawanList.length > 0 && (
      <>
      {/* ─────────────────────────────────────────────────────────────
          1. TOP: FOTO PROFIL & DATA KARYAWAN CARD
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden relative">
        {/* Top Header Background Pattern */}
        <div className="h-20 bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-800 relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="absolute top-2.5 right-3 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-bold text-white tracking-wider uppercase border border-white/20">
            {companyInfo.logoText || 'KANTORKU'}
          </div>
        </div>

        {/* Profile Avatar & Info Body */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar Circle */}
          <div className="flex justify-center -mt-11 mb-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg ring-4 ring-brand-500/20">
                {activeKaryawan?.avatarUrl ? (
                  <img
                    src={activeKaryawan.avatarUrl}
                    alt={activeKaryawan.nama}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-inner">
                    {activeKaryawan?.nama
                      ? activeKaryawan.nama.substring(0, 2).toUpperCase()
                      : currentUser?.username?.substring(0, 2).toUpperCase() || 'ST'}
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online Aktif" />
            </div>
          </div>

          {/* Employee Names & Titles */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {activeKaryawan?.nama || currentUser?.nama || 'Staf Karyawan'}
            </h2>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                {activeKaryawan?.jabatan || 'Staff Operasional'}
              </span>
              <span className="text-[11px] text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {activeKaryawan?.divisi || 'Divisi Umum'}
              </span>
            </div>
          </div>

          {/* Quick Info Grid Badge */}
          <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nomor Induk (NIK)
              </span>
              <p className="font-mono font-bold text-slate-800 text-[11px] truncate">
                {activeKaryawan?.nik || 'KTK-STAFF-01'}
              </p>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status Karyawan
              </span>
              <p className="font-bold text-emerald-700 text-[11px]">
                {activeKaryawan?.status || 'Tetap'}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sisa Kasbon Aktif
              </span>
              <span className={`text-xs font-black font-mono ${
                activeKasbon ? 'text-amber-700' : 'text-slate-600'
              }`}>
                {activeKasbon ? formatRupiah(activeKasbon.sisaPinjaman) : 'Rp 0 (Lunas)'}
              </span>
            </div>
          </div>

          {/* Switch Profile Dropdown if multiple karyawan */}
          {karyawanList.length > 1 && (
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Pilih Profil Anda:</span>
              <select
                value={selectedKaryawanId}
                onChange={(e) => setSelectedKaryawanId(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {karyawanList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.nik})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MIDDLE: 2 CARD ACTION MENU (TASK & PENGAJUAN KASBON)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card 1: TASK (Tugas Saya) */}
        <button
          type="button"
          onClick={() => setIsTaskModalOpen(true)}
          className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-97 relative overflow-hidden"
        >
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-brand-600 block">
                Menu Utama
              </span>
              <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                TASK
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                Tugas & Status
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between w-full">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              {onProcessTasksCount} On Process
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 2: PENGAJUAN KASBON */}
        <button
          type="button"
          onClick={() => setIsKasbonModalOpen(true)}
          className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-97 relative overflow-hidden"
        >
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 block">
                Fasilitas
              </span>
              <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                PENGAJUAN KASBON
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                Bulan Berjalan
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between w-full">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Ajukan Pinjaman
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM: TANGGAL & JAM REALTIME (LIVE CLOCK WIDGET)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg border border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          {/* Left: Date info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Waktu & Tanggal Realtime</span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
              {formattedDate}
            </h4>
            <p className="text-[11px] text-slate-400">
              Waktu Lokal Indonesia • Sistem Terhubung
            </p>
          </div>

          {/* Right: Live Digital Clock */}
          <div className="text-right shrink-0 bg-slate-950/60 border border-slate-700/70 px-3.5 py-2 rounded-2xl shadow-inner">
            <div className="flex items-center gap-1.5 font-mono text-base sm:text-lg font-black text-brand-400 tracking-wider">
              <Clock className="w-4 h-4 text-brand-400 animate-pulse" />
              <span>{formattedClock}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block text-center mt-0.5">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MODAL: DAFTAR TASK & UBAH STATUS
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Daftar Tugas & Pekerjaan Saya"
        subtitle={`Staf: ${activeKaryawan?.nama || 'Karyawan'}`}
        maxWidth="lg"
      >
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {displayTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Belum ada tugas yang ditugaskan</p>
              <p className="text-xs text-slate-400 mt-1">Admin belum membuat tugas baru untuk Anda.</p>
            </div>
          ) : (
            displayTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(task.status)}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {task.prioritas}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Deadline: {formatTanggal(task.deadline)}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{task.judul}</h4>
                  {task.deskripsi && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.deskripsi}</p>
                  )}
                </div>

                {task.catatanStaff && (
                  <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-900 flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[11px] block">Catatan Progres Staf:</span>
                      <p className="text-sky-800 text-[11px]">{task.catatanStaff}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Oleh: {task.createdBy || 'Admin'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditStatus(task)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Ubah Status Pekerjaan</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL: UBAH STATUS PEKERJAAN (SELESAI, ON PROCESS, BATAL)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditStatusModalOpen}
        onClose={() => setIsEditStatusModalOpen(false)}
        title="Ubah Status Pekerjaan"
        subtitle={selectedTaskForStatus?.judul || ''}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Status Pekerjaan *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((st) => {
                const isSelected = newStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? st === 'Selesai'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                          : st === 'On Process'
                          ? 'bg-sky-500 text-white border-sky-600 shadow-md'
                          : 'bg-rose-500 text-white border-rose-600 shadow-md'
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
              Catatan Progres Staf (Opsional)
            </label>
            <textarea
              rows={3}
              value={catatanStaffInput}
              onChange={(e) => setCatatanStaffInput(e.target.value)}
              placeholder="Contoh: Pekerjaan sudah 100% selesai dan dokumen siap di-review..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditStatusModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95"
            >
              Simpan Status
            </button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL: FORM PENGAJUAN KASBON BULAN BERJALAN
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isKasbonModalOpen}
        onClose={() => setIsKasbonModalOpen(false)}
        title="Pengajuan Kasbon Karyawan"
        subtitle={`Pemohon: ${activeKaryawan?.nama || 'Karyawan'} (${activeKaryawan?.nik || ''})`}
        maxWidth="md"
      >
        <form onSubmit={handlePengajuanKasbonSubmit} className="space-y-3.5">
          {/* Active kasbon notice if any */}
          {activeKasbon && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Perhatian:</span>
                <p className="text-[11px]">
                  Anda masih memiliki kasbon aktif sebesar <strong>{formatRupiah(activeKasbon.sisaPinjaman)}</strong>. Pengajuan baru akan ditambahkan ke sistem.
                </p>
              </div>
            </div>
          )}

          {/* Periode Bulan Berjalan info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Periode Pemotongan
              </span>
              <span className="font-bold text-slate-800">
                Bulan Berjalan ({getNamaBulan(currentTime.getMonth() + 1)} {currentTime.getFullYear()})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 font-mono">
              {currentMonthYear}
            </span>
          </div>

          {/* Nominal Kasbon Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Pinjaman (Rp) *
            </label>
            <input
              type="number"
              min={50000}
              step={50000}
              required
              value={kasbonNominal || ''}
              onChange={(e) => setKasbonNominal(Number(e.target.value))}
              placeholder="Contoh: 1000000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-brand-500 font-mono"
            />
            {/* Quick Nominal Presets */}
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {[500000, 1000000, 1500000, 2000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setKasbonNominal(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    kasbonNominal === preset
                      ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {formatRupiah(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Skema & Tenor */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skema Pengembalian
              </label>
              <select
                value={kasbonSkema}
                onChange={(e) => setKasbonSkema(e.target.value as SkemaKasbon)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="Cicilan">Cicilan Bulanan</option>
                <option value="Sekali_Lunas">Potong Sekali Lunas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenor (Bulan)
              </label>
              <select
                disabled={kasbonSkema === 'Sekali_Lunas'}
                value={kasbonSkema === 'Sekali_Lunas' ? 1 : kasbonTenor}
                onChange={(e) => setKasbonTenor(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              >
                <option value={1}>1 Bulan</option>
                <option value={2}>2 Bulan</option>
                <option value={3}>3 Bulan</option>
                <option value={6}>6 Bulan</option>
                <option value={12}>12 Bulan</option>
              </select>
            </div>
          </div>

          {/* Simulasi Cicilan */}
          <div className="p-3 bg-brand-50/60 border border-brand-100 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-brand-900 font-semibold">Estimasi Potong Gaji:</span>
            <span className="text-brand-900 font-black font-mono text-sm">
              {formatRupiah(handleCicilanCalc())} / bulan
            </span>
          </div>

          {/* Keperluan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keperluan Pinjaman *
            </label>
            <input
              type="text"
              required
              value={kasbonKeterangan}
              onChange={(e) => setKasbonKeterangan(e.target.value)}
              placeholder="Contoh: Kebutuhan mendesak pengobatan keluarga / biaya pendidikan"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsKasbonModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingKasbon}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingKasbon ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
            </button>
          </div>
        </form>
      </Modal>
      </>
      )}
    </div>
  );
};
