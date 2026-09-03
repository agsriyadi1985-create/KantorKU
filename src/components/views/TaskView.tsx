import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { Modal } from '../common/Modal';
import { StatCard } from '../common/StatCard';
import {
  CheckSquare,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  User as UserIcon,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Shield,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { formatTanggal, normalizeNIK } from '../../utils/formatters';

const STATUS_OPTIONS: TaskStatus[] = ['On Process', 'Selesai', 'Batal'];
const PRIORITY_OPTIONS: TaskPriority[] = ['Rendah', 'Sedang', 'Tinggi', 'Mendesak'];

export const TaskView: React.FC = () => {
  const {
    taskList,
    karyawanList,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    clearAllTasks,
    currentUser,
  } = useApp();

  const isAdmin = currentUser?.role === 'Admin';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterPriority, setFilterPriority] = useState<string>('Semua');
  const [filterStaff, setFilterStaff] = useState<string>('Semua');

  // Modals State
  const [isFullFormOpen, setIsFullFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusEditingTask, setStatusEditingTask] = useState<Task | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<TaskStatus>('On Process');
  const [statusCatatanStaff, setStatusCatatanStaff] = useState('');

  // Full Form Data (Admin only)
  const initialFormData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
    judul: '',
    deskripsi: '',
    assignedTo: karyawanList[0]?.id || '',
    assignedToNama: karyawanList[0]?.nama || '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    prioritas: 'Sedang',
    status: 'On Process',
    catatanStaff: '',
    createdBy: currentUser?.nama || 'Admin',
  };

  const [formData, setFormData] = useState(initialFormData);

  // Filtered Task List
  const filteredTasks = taskList.filter((task) => {
    const matchSearch =
      !searchTerm ||
      task.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedToNama.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'Semua' || task.status === filterStatus;
    const matchPriority = filterPriority === 'Semua' || task.prioritas === filterPriority;
    const matchStaff =
      filterStaff === 'Semua' ||
      task.assignedTo === filterStaff ||
      task.assignedToNama === filterStaff;

    return matchSearch && matchStatus && matchPriority && matchStaff;
  });

  // Metrics
  const totalTasks = taskList.length;
  const totalOnProcess = taskList.filter((t) => t.status === 'On Process').length;
  const totalSelesai = taskList.filter((t) => t.status === 'Selesai').length;
  const totalBatal = taskList.filter((t) => t.status === 'Batal').length;
  const totalMendesak = taskList.filter((t) => t.prioritas === 'Mendesak' && t.status !== 'Selesai').length;

  // Handlers for Admin Full Form
  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setEditingTaskId(null);
    const defaultKaryawan = karyawanList[0];
    setFormData({
      ...initialFormData,
      assignedTo: defaultKaryawan ? defaultKaryawan.id : '',
      assignedToNama: defaultKaryawan ? defaultKaryawan.nama : (currentUser?.nama || 'Staf'),
      createdBy: currentUser?.nama || 'Admin',
    });
    setIsFullFormOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    if (!isAdmin) return;
    setEditingTaskId(task.id);
    setFormData({
      judul: task.judul,
      deskripsi: task.deskripsi,
      assignedTo: task.assignedTo || '',
      assignedToNama: task.assignedToNama,
      deadline: task.deadline,
      prioritas: task.prioritas,
      status: task.status,
      catatanStaff: task.catatanStaff || '',
      createdBy: task.createdBy || 'Admin',
    });
    setIsFullFormOpen(true);
  };

  const handleFullFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!formData.judul.trim()) {
      alert('Mohon masukkan judul tugas.');
      return;
    }

    if (formData.assignedTo === 'ALL') {
      if (karyawanList.length === 0) {
        alert('Belum ada data karyawan.');
        return;
      }

      if (editingTaskId) {
        const [firstEmp, ...restEmps] = karyawanList;
        if (firstEmp) {
          await updateTask(editingTaskId, {
            ...formData,
            assignedTo: firstEmp.id,
            assignedToNama: firstEmp.nama,
          });
        }
        for (const rest of restEmps) {
          await addTask({
            ...formData,
            assignedTo: rest.id,
            assignedToNama: rest.nama,
          });
        }
      } else {
        for (const emp of karyawanList) {
          await addTask({
            ...formData,
            assignedTo: emp.id,
            assignedToNama: emp.nama,
          });
        }
      }
    } else {
      if (editingTaskId) {
        await updateTask(editingTaskId, formData);
      } else {
        await addTask(formData);
      }
    }
    setIsFullFormOpen(false);
  };

  const handleDelete = async (task: Task) => {
    if (!isAdmin) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus tugas "${task.judul}"?`)) {
      await deleteTask(task.id);
    }
  };

  // Helper: Cek apakah task ditugaskan ke staf saat ini (atau jika user adalah admin)
  const isTaskAssignedToMe = (t: Task | null | undefined): boolean => {
    if (!t) return false;
    if (isAdmin) return true;
    if (!currentUser) return false;

    if (
      t.assignedTo === 'ALL' ||
      t.assignedToNama?.toUpperCase().includes('ALL') ||
      t.assignedToNama?.toLowerCase().includes('semua')
    ) {
      return true;
    }

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
    return false;
  };

  // Handlers for Status Change Modal (Available for Staff & Admin)
  const handleOpenStatusModal = (task: Task) => {
    setStatusEditingTask(task);
    setSelectedNewStatus(task.status);
    setStatusCatatanStaff(task.catatanStaff || '');
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusEditingTask) return;
    if (!isTaskAssignedToMe(statusEditingTask)) {
      alert('Hanya karyawan yang ditugaskan yang dapat mengubah status pekerjaan ini.');
      setIsStatusModalOpen(false);
      return;
    }
    await updateTaskStatus(statusEditingTask.id, selectedNewStatus, statusCatatanStaff.trim());
    setIsStatusModalOpen(false);
  };

  // Helper styling
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Selesai
          </span>
        );
      case 'On Process':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            On Process
          </span>
        );
      case 'Batal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Batal
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Mendesak':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
            Mendesak
          </span>
        );
      case 'Tinggi':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            Tinggi
          </span>
        );
      case 'Sedang':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Sedang
          </span>
        );
      case 'Rendah':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Rendah
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Daftar Tugas & Pekerjaan (Task)
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isAdmin
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}
            >
              {isAdmin ? 'Admin (Akses Penuh)' : 'Staff (Edit Status)'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pencatatan tugas tim, penugasan pekerjaan staf, dan pemantauan status progres secara realtime
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {taskList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA tugas dalam daftar?')) {
                    clearAllTasks();
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold rounded-xl border border-rose-200 transition-all active:scale-95 cursor-pointer"
                title="Kosongkan seluruh tugas"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Hapus Semua Tugas</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Staff Info Banner if Staff logged in */}
      {!isAdmin && (
        <div className="p-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-sky-600 text-white rounded-xl shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p className="font-bold text-sky-950">Akses Petugas Staff:</p>
            <p className="mt-0.5 text-slate-600">
              Anda dapat melihat daftar seluruh tugas yang sedang berjalan dan memperbarui status pekerjaan (
              <span className="font-semibold text-sky-700">On Process</span>,{' '}
              <span className="font-semibold text-emerald-700">Selesai</span>,{' '}
              <span className="font-semibold text-rose-700">Batal</span>) serta menambahkan catatan progres pada tugas terkait.
            </p>
          </div>
        </div>
      )}

      {/* 3. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Tugas"
          value={`${totalTasks} Tugas`}
          icon={<CheckSquare className="w-5 h-5 text-brand-600" />}
          iconBgColor="bg-brand-50"
          iconTextColor="text-brand-600"
          subtitle="Tercatat dalam sistem"
        />
        <StatCard
          title="Sedang Dikerjakan"
          value={`${totalOnProcess} Tugas`}
          icon={<Clock className="w-5 h-5 text-sky-600" />}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-600"
          subtitle="Status On Process"
        />
        <StatCard
          title="Tugas Selesai"
          value={`${totalSelesai} Tugas`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          subtitle="Berhasil diselesaikan"
        />
        <StatCard
          title="Batal / Mendesak"
          value={`${totalBatal} Batal`}
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          subtitle={`${totalMendesak} Prioritas Mendesak`}
        />
      </div>

      {/* 4. Filters & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul tugas, deskripsi, atau staf..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        {/* Filter Status */}
        <div className="sm:col-span-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          >
            <option value="Semua">Semua Status Pekerjaan</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Prioritas */}
        <div className="sm:col-span-2">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          >
            <option value="Semua">Semua Prioritas</option>
            {PRIORITY_OPTIONS.map((pr) => (
              <option key={pr} value={pr}>
                Prioritas: {pr}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Staf */}
        <div className="sm:col-span-3">
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          >
            <option value="Semua">Semua Staf Penanggung Jawab</option>
            {karyawanList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} ({k.jabatan})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Tasks List View */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">Tidak ada tugas ditemukan</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isAdmin
              ? 'Klik tombol "Buat Tugas Baru" untuk mencatat dan membagikan tugas kepada staf.'
              : 'Belum ada tugas yang cocok dengan filter pencarian.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'Selesai';
            const isCancelled = task.status === 'Batal';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isDone
                    ? 'border-emerald-100 bg-emerald-50/10'
                    : isCancelled
                    ? 'border-rose-100 bg-rose-50/10 opacity-75'
                    : 'border-slate-200/80 hover:border-brand-300'
                }`}
              >
                {/* Card Top / Header */}
                <div className="p-5 space-y-3">
                  {/* Badges row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.prioritas)}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" />
                      <span>Deadline: {formatTanggal(task.deadline)}</span>
                    </div>
                  </div>

                  {/* Task Title & Description */}
                  <div>
                    <h3
                      className={`text-base font-bold tracking-tight ${
                        isDone
                          ? 'text-slate-700 line-through decoration-emerald-500'
                          : isCancelled
                          ? 'text-slate-500 line-through'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.judul}
                    </h3>
                    {task.deskripsi && (
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                        {task.deskripsi}
                      </p>
                    )}
                  </div>

                  {/* Catatan Staff if any */}
                  {task.catatanStaff && (
                    <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 text-[11px] block">
                          Catatan Progress Staf:
                        </span>
                        <p className="text-slate-600 mt-0.5">{task.catatanStaff}</p>
                      </div>
                    </div>
                  )}

                  {/* Assigned Staf & Creator Info */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center font-bold text-[11px]">
                        <UserIcon className="w-3.5 h-3.5 text-brand-600" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                          Ditugaskan Ke
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {task.assignedToNama || 'Belum Ditugaskan'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <span>Oleh: {task.createdBy || 'Admin'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2">
                  {/* Status Change Button (Available for Assigned Staff & Admin) */}
                  {isTaskAssignedToMe(task) ? (
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                      title="Ubah Status Pekerjaan (Selesai, On Process, Batal)"
                    >
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      <span>Ubah Status</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      title="Lihat Rincian Tugas (Hanya Baca)"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lihat Rincian</span>
                    </button>
                  )}

                  {/* Admin Specific Actions: Full Edit & Delete */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(task)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Seluruh Data Tugas"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. MODAL: Ubah Status / Rincian Pekerjaan (Untuk Staff & Admin) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusEditingTask && !isTaskAssignedToMe(statusEditingTask) ? "Rincian Tugas Pekerjaan" : "Ubah Status Pekerjaan"}
        subtitle={statusEditingTask ? `Tugas: "${statusEditingTask.judul}"` : ''}
        maxWidth="md"
      >
        {statusEditingTask && !isTaskAssignedToMe(statusEditingTask) ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                  Mode Hanya Lihat (Read-Only)
                </h4>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Tugas ini ditugaskan kepada <b>{statusEditingTask.assignedToNama}</b>. Semua staf dapat membaca rincian tugas ini, namun hanya staf yang ditugaskan yang dapat mengedit atau mengubah status pengerjaannya.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Status Pengerjaan:</span>
                <div>{getStatusBadge(statusEditingTask.status)}</div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Prioritas:</span>
                <div>{getPriorityBadge(statusEditingTask.prioritas)}</div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Batas Waktu (Deadline):</span>
                <span className="font-bold text-slate-800">{formatTanggal(statusEditingTask.deadline)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Ditugaskan Kepada:</span>
                <span className="font-bold text-slate-800">{statusEditingTask.assignedToNama}</span>
              </div>
              {statusEditingTask.catatanStaff && (
                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                  <span className="text-slate-500 font-medium block">Catatan Progres Staf:</span>
                  <p className="text-slate-800 font-semibold bg-white p-2.5 rounded-xl border border-slate-200">
                    {statusEditingTask.catatanStaff}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Status Pekerjaan *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {STATUS_OPTIONS.map((st) => {
                  const isSelected = selectedNewStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedNewStatus(st)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                Catatan Progres / Keterangan Staf (Opsional)
              </label>
              <textarea
                rows={3}
                value={statusCatatanStaff}
                onChange={(e) => setStatusCatatanStaff(e.target.value)}
                placeholder="Contoh: Pekerjaan telah diselesaikan dan dokumen sudah dikirim ke direksi..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Status
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. MODAL: Tambah / Edit Tugas Lengkap (Admin Only) */}
      {isAdmin && (
        <Modal
          isOpen={isFullFormOpen}
          onClose={() => setIsFullFormOpen(false)}
          title={editingTaskId ? 'Edit Rincian Tugas' : 'Buat & Kirim Tugas Baru'}
          subtitle="Admin dapat menentukan judul, penanggung jawab, tenggat waktu, dan prioritas tugas."
          maxWidth="xl"
        >
          <form onSubmit={handleFullFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Tugas / Pekerjaan *
              </label>
              <input
                type="text"
                required
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder="Contoh: Rekonsiliasi Slip Gaji Periode September 2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi / Instruksi Pekerjaan
              </label>
              <textarea
                rows={3}
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Rincian langkah pengerjaan atau instruksi khusus untuk staf..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ditugaskan Kepada (Staf) *
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'ALL') {
                      setFormData({
                        ...formData,
                        assignedTo: 'ALL',
                        assignedToNama: 'SEMUA KARYAWAN (ALL)',
                      });
                    } else {
                      const emp = karyawanList.find((k) => k.id === val);
                      setFormData({
                        ...formData,
                        assignedTo: val,
                        assignedToNama: emp ? emp.nama : '',
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Pilih Staf Penanggung Jawab --</option>
                  <option value="ALL" className="font-bold text-brand-700 bg-brand-50">
                    📢 ALL - Semua Karyawan ({karyawanList.length} Orang)
                  </option>
                  {karyawanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} ({k.jabatan ? `${k.jabatan} - ` : ''}{k.nik})
                    </option>
                  ))}
                </select>

                {formData.assignedTo === 'ALL' && (
                  <div className="mt-1.5 p-2 bg-brand-50 border border-brand-200 rounded-xl flex items-start gap-1.5 text-[11px] text-brand-800">
                    <Users className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                    <span>
                      Tugas ini akan otomatis <strong>diterbitkan & di-push ke semua ({karyawanList.length}) karyawan</strong>.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenggat Waktu (Deadline) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Prioritas
                </label>
                <select
                  value={formData.prioritas}
                  onChange={(e) =>
                    setFormData({ ...formData, prioritas: e.target.value as TaskPriority })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                >
                  {PRIORITY_OPTIONS.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Pekerjaan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as TaskStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Staf (Opsional)
              </label>
              <input
                type="text"
                value={formData.catatanStaff}
                onChange={(e) => setFormData({ ...formData, catatanStaff: e.target.value })}
                placeholder="Catatan tambahan progres pekerjaan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFullFormOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                {editingTaskId ? 'Simpan Perubahan' : 'Terbitkan & Kirim Tugas'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
