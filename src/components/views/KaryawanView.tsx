import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Karyawan, StatusKaryawan } from '../../types';
import { Modal } from '../common/Modal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building,
  CreditCard,
  Briefcase,
  Calendar,
  Eye,
  CheckCircle2,
  Banknote,
  Receipt,
  LayoutGrid,
  Table as TableIcon,
  Camera,
  Upload,
  X,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/formatters';

const DIVISI_OPTIONS = [
  'Semua Divisi',
  'Teknologi Informasi',
  'Finance & HR',
  'Operasional',
  'Marketing & Sales',
  'Desain & Kreatif',
  'Umum & Legal',
];

export const KaryawanView: React.FC = () => {
  const {
    karyawanList,
    addKaryawan,
    updateKaryawan,
    deleteKaryawan,
    gajiList,
    kasbonList,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivisi, setFilterDivisi] = useState('Semua Divisi');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailKaryawan, setDetailKaryawan] = useState<Karyawan | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialFormState: Omit<Karyawan, 'id'> = {
    nik: '',
    nama: '',
    divisi: 'Teknologi Informasi',
    jabatan: '',
    status: 'Tetap',
    email: '',
    noHp: '',
    alamat: '',
    tanggalMasuk: new Date().toISOString().split('T')[0],
    gajiPokok: 5000000,
    tunjanganMakan: 500000,
    tunjanganTransport: 400000,
    tunjanganJabatan: 0,
    namaBank: 'BCA',
    noRekening: '',
    atasNamaRekening: '',
    avatarUrl: '',
  };

  const [formData, setFormData] = useState<Omit<Karyawan, 'id'>>(initialFormState);

  // Filtered List
  const filteredKaryawan = karyawanList.filter((emp) => {
    const matchSearch =
      emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDivisi =
      filterDivisi === 'Semua Divisi' || emp.divisi === filterDivisi;

    const matchStatus =
      filterStatus === 'Semua' || emp.status === filterStatus;

    return matchSearch && matchDivisi && matchStatus;
  });

  const handleOpenAdd = () => {
    const nextNik = `KTK-${new Date().getFullYear()}-${String(
      karyawanList.length + 1
    ).padStart(3, '0')}`;
    setEditingId(null);
    setFormData({
      ...initialFormState,
      nik: nextNik,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Karyawan) => {
    setEditingId(emp.id);
    setFormData({
      nik: emp.nik,
      nama: emp.nama,
      divisi: emp.divisi,
      jabatan: emp.jabatan,
      status: emp.status,
      email: emp.email,
      noHp: emp.noHp,
      alamat: emp.alamat,
      tanggalMasuk: emp.tanggalMasuk,
      gajiPokok: emp.gajiPokok,
      tunjanganMakan: emp.tunjanganMakan,
      tunjanganTransport: emp.tunjanganTransport,
      tunjanganJabatan: emp.tunjanganJabatan,
      namaBank: emp.namaBank,
      noRekening: emp.noRekening,
      atasNamaRekening: emp.atasNamaRekening || emp.nama,
      avatarUrl: emp.avatarUrl || '',
    });
    setIsFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFormData((prev) => ({ ...prev, avatarUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nik) {
      alert('Mohon lengkapi NIK dan Nama Karyawan');
      return;
    }

    if (editingId) {
      updateKaryawan(editingId, formData);
    } else {
      addKaryawan(formData);
    }

    setIsFormOpen(false);
  };

  const handleDelete = (emp: Karyawan) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus data karyawan ${emp.nama} (${emp.nik})?`
      )
    ) {
      deleteKaryawan(emp.id);
      if (detailKaryawan?.id === emp.id) {
        setDetailKaryawan(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Data Karyawan ({filteredKaryawan.length} Staf)
          </h2>
          <p className="text-xs text-slate-500">
            Kelola master data karyawan, besaran gaji pokok, dan rekening penggajian
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan Nama, NIK, atau Jabatan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        {/* Divisi Filter */}
        <div className="sm:col-span-3">
          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-medium text-slate-700"
          >
            {DIVISI_OPTIONS.map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs font-medium text-slate-700"
          >
            <option value="Semua">Semua Status</option>
            <option value="Tetap">Karyawan Tetap</option>
            <option value="Kontrak">Karyawan Kontrak</option>
            <option value="Magang">Magang / Internship</option>
          </select>
        </div>
      </div>

      {/* 3. List Content (Grid or Table) */}
      {filteredKaryawan.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">
            Tidak ada data karyawan ditemukan
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau filter yang Anda pilih.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKaryawan.map((emp) => {
            const totalGajiEstimasi =
              emp.gajiPokok +
              emp.tunjanganMakan +
              emp.tunjanganTransport +
              emp.tunjanganJabatan;

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badge & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.nama}
                          className="w-11 h-11 rounded-xl object-cover shadow-xs border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
                          {emp.nama.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                          {emp.nama}
                        </h3>
                        <p className="text-xs font-mono font-medium text-slate-400">
                          {emp.nik}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status === 'Tetap'
                          ? 'bg-emerald-50 text-emerald-700'
                          : emp.status === 'Kontrak'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.jabatan}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.divisi}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {emp.namaBank} - {emp.noRekening || 'Belum ada rek'}
                      </span>
                    </div>
                  </div>

                  {/* Base Salary Highlight */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Gaji Pokok:</span>
                    <span className="font-extrabold text-slate-900">
                      {formatRupiah(emp.gajiPokok)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailKaryawan(emp)}
                    className="flex-1 py-1.5 px-2.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Detail
                  </button>
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Edit Karyawan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Karyawan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Karyawan</th>
                  <th className="py-3.5 px-4">NIK</th>
                  <th className="py-3.5 px-4">Divisi & Jabatan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Gaji Pokok</th>
                  <th className="py-3.5 px-4">Bank & Rekening</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKaryawan.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.nama}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {emp.nama.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{emp.nama}</p>
                          <p className="text-[11px] text-slate-400">{emp.noHp}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {emp.nik}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{emp.jabatan}</p>
                      <p className="text-[11px] text-slate-400">{emp.divisi}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          emp.status === 'Tetap'
                            ? 'bg-emerald-50 text-emerald-700'
                            : emp.status === 'Kontrak'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatRupiah(emp.gajiPokok)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">
                        {emp.namaBank} - {emp.noRekening}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        a/n {emp.atasNamaRekening || emp.nama}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailKaryawan(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus"
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
        </div>
      )}

      {/* 4. MODAL: Form Tambah / Edit Karyawan */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
        subtitle="Lengkapi data personal, jabatan, rekening bank, dan komponen gaji pokok."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5">
          {/* Section 1: Informasi Pokok */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              1. Biodata & Status Kepegawaian
            </h4>

            {/* Upload Foto Karyawan */}
            <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="shrink-0">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Pratinjau Foto"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white font-black text-2xl flex items-center justify-center shadow-sm">
                    {formData.nama ? formData.nama.charAt(0).toUpperCase() : <Camera className="w-6 h-6 text-white/80" />}
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Foto Profil Karyawan
                </label>
                <p className="text-[11px] text-slate-500">
                  Format JPG, PNG atau WEBP (Maksimal 2MB). Foto akan tampil di kartu karyawan.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {formData.avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}
                  </button>
                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk Karyawan (NIK) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  placeholder="Contoh: KTK-2026-001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama lengkap beserta gelar jika ada"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Divisi / Departemen
                </label>
                <select
                  value={formData.divisi}
                  onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                >
                  {DIVISI_OPTIONS.filter((d) => d !== 'Semua Divisi').map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Posisi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Contoh: Senior Frontend Dev"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Karyawan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as StatusKaryawan })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  <option value="Tetap">Karyawan Tetap</option>
                  <option value="Kontrak">Karyawan Kontrak</option>
                  <option value="Magang">Magang (Internship)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Masuk Kerja
                </label>
                <input
                  type="date"
                  value={formData.tanggalMasuk}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggalMasuk: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.noHp}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Kantor / Pribadi
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@kantorku.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Domisili
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Alamat tempat tinggal lengkap"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Struktur Gaji & Tunjangan Default */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              2. Standar Gaji Pokok & Tunjangan Tetap
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gaji Pokok (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={formData.gajiPokok || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, gajiPokok: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Jabatan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.tunjanganJabatan || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tunjanganJabatan: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Makan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.tunjanganMakan || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tunjanganMakan: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tunjangan Transport (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.tunjanganTransport || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tunjanganTransport: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Informasi Rekening Bank */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-600" />
              3. Data Rekening Bank untuk Payroll
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Bank
                </label>
                <select
                  value={formData.namaBank}
                  onChange={(e) => setFormData({ ...formData, namaBank: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                  <option value="Lainnya">Bank Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formData.noRekening}
                  onChange={(e) =>
                    setFormData({ ...formData, noRekening: e.target.value })
                  }
                  placeholder="Nomor rekening transfer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  value={formData.atasNamaRekening}
                  onChange={(e) =>
                    setFormData({ ...formData, atasNamaRekening: e.target.value })
                  }
                  placeholder="Nama pemilik rekening"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL: Detail Profil Karyawan */}
      {detailKaryawan && (
        <Modal
          isOpen={!!detailKaryawan}
          onClose={() => setDetailKaryawan(null)}
          title={`Profil Karyawan: ${detailKaryawan.nama}`}
          subtitle={`NIK: ${detailKaryawan.nik} • ${detailKaryawan.jabatan}`}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {/* Header Profil */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              {detailKaryawan.avatarUrl ? (
                <img
                  src={detailKaryawan.avatarUrl}
                  alt={detailKaryawan.nama}
                  className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-brand-500 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  {detailKaryawan.nama.charAt(0)}
                </div>
              )}
              <div className="space-y-1 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {detailKaryawan.nama}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {detailKaryawan.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {detailKaryawan.jabatan} • <span className="font-semibold">{detailKaryawan.divisi}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Bergabung sejak: {formatTanggal(detailKaryawan.tanggalMasuk)}
                </p>
              </div>

              <button
                onClick={() => {
                  handleOpenEdit(detailKaryawan);
                  setDetailKaryawan(null);
                }}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
              >
                Edit Data
              </button>
            </div>

            {/* Grid Detail Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-brand-700">
                  Kontak & Domisili
                </span>
                <p className="text-slate-600">
                  <strong className="text-slate-900">No HP:</strong> {detailKaryawan.noHp || '-'}
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-900">Email:</strong> {detailKaryawan.email || '-'}
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-900">Alamat:</strong> {detailKaryawan.alamat || '-'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-brand-700">
                  Rekening & Payroll
                </span>
                <p className="text-slate-600">
                  <strong className="text-slate-900">Bank:</strong> {detailKaryawan.namaBank}
                </p>
                <p className="text-slate-600 font-mono">
                  <strong className="text-slate-900 font-sans">No Rek:</strong>{' '}
                  {detailKaryawan.noRekening || '-'}
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-900">Atas Nama:</strong>{' '}
                  {detailKaryawan.atasNamaRekening || detailKaryawan.nama}
                </p>
              </div>
            </div>

            {/* Riwayat Slip Gaji Terakhir */}
            <div className="border border-slate-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>Riwayat Slip Gaji ({detailKaryawan.nama})</span>
              </h4>
              {gajiList.filter((g) => g.karyawanId === detailKaryawan.id).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Belum ada riwayat slip gaji untuk karyawan ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {gajiList
                    .filter((g) => g.karyawanId === detailKaryawan.id)
                    .map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 font-mono block">
                            {g.nomorSlip}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Periode {g.periodeBulan}/{g.periodeTahun} • Dibayar:{' '}
                            {formatTanggal(g.tanggalBayar || g.tanggalCetak)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 block">
                            {formatRupiah(g.gajiBersih)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600">
                            {g.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Riwayat Kasbon */}
            <div className="border border-slate-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>Status Kasbon & Pinjaman</span>
              </h4>
              {kasbonList.filter((k) => k.karyawanId === detailKaryawan.id).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Tidak ada catatan pinjaman kasbon.
                </p>
              ) : (
                <div className="space-y-2">
                  {kasbonList
                    .filter((k) => k.karyawanId === detailKaryawan.id)
                    .map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 font-mono block">
                            {k.nomorKasbon} ({k.skema === 'Cicilan' ? `Cicilan ${k.tenorBulan} bln` : 'Lunas 1x'})
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Keperluan: {k.keterangan}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">
                            Sisa: {formatRupiah(k.sisaPinjaman)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              k.status === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {k.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
