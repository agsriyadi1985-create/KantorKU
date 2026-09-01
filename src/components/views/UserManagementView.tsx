import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  Users, UserPlus, Shield, ShieldCheck, Key, Edit, Trash2, CheckCircle2,
  XCircle, Lock, Search, Sparkles, Check, AlertTriangle
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { StatCard } from '../common/StatCard';

export const UserManagementView: React.FC = () => {
  const { userList, addUser, updateUser, deleteUser, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Staff');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'Admin';

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    setFormNama('');
    setFormRole('Staff');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormPassword(''); // leave blank if unchanged
    setFormNama(user.nama);
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formNama.trim()) {
      alert('Mohon lengkapi Username dan Nama Lengkap.');
      return;
    }

    if (!editingUser && !formPassword) {
      alert('Mohon masukkan Katasandi untuk user baru.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updatePayload: Partial<User> = {
          username: formUsername.trim().toUpperCase(),
          nama: formNama.trim(),
          role: formRole,
          isActive: formIsActive,
        };
        if (formPassword.trim()) {
          updatePayload.password = formPassword.trim();
        }
        const success = await updateUser(editingUser.id, updatePayload);
        if (success) setIsModalOpen(false);
      } else {
        const success = await addUser({
          username: formUsername.trim().toUpperCase(),
          password: formPassword.trim(),
          nama: formNama.trim(),
          role: formRole,
          isActive: formIsActive,
        });
        if (success) setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id || user.username.toUpperCase() === 'AGUS') {
      alert('User Admin utama tidak dapat dihapus.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${user.username}" (${user.nama})?`)) {
      await deleteUser(user.id);
    }
  };

  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = userList.length;
  const totalAdmin = userList.filter((u) => u.role === 'Admin').length;
  const totalStaff = userList.filter((u) => u.role === 'Staff').length;
  const totalActive = userList.filter((u) => u.isActive).length;

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-sm max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-sm text-slate-600 mt-2">
          Menu <strong>Manajemen User</strong> hanya dapat diakses oleh pengguna dengan role <strong>Admin</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen User & Hak Akses</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akun petugas, kata sandi, serta hak akses modul untuk Staff dan Admin
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm shadow-brand-500/20 transition-all cursor-pointer transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total User"
          value={totalUsers}
          icon={<Users className="w-5 h-5 text-brand-600" />}
          iconBgColor="bg-brand-50"
          iconTextColor="text-brand-600"
          subtitle="Terdaftar di sistem"
        />
        <StatCard
          title="Admin"
          value={totalAdmin}
          icon={<ShieldCheck className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
          subtitle="Akses seluruh menu"
        />
        <StatCard
          title="Staff"
          value={totalStaff}
          icon={<Shield className="w-5 h-5 text-sky-600" />}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-600"
          subtitle="Akses operasional"
        />
        <StatCard
          title="User Aktif"
          value={totalActive}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          subtitle="Dapat login"
        />
      </div>

      {/* 3. Hak Akses Matrix Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 text-white border border-slate-700 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm sm:text-base font-bold">Matriks Hak Akses Modul</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Admin Role */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-brand-500/30 text-brand-300 font-bold text-xs">
                Role: Admin
              </span>
              <span className="text-slate-400 text-xs">(Akses Penuh)</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Dapat mengakses <strong>Semua Menu</strong>: Dashboard, <strong>Tugas (Task)</strong>, Karyawan, Gaji, Kasbon, Pengeluaran Rutin, <strong>Manajemen User</strong>, dan <strong>Pengaturan Kantor</strong>.
            </p>
          </div>

          {/* Staff Role */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-sky-500/30 text-sky-300 font-bold text-xs">
                Role: Staff
              </span>
              <span className="text-slate-400 text-xs">(Akses Terbatas)</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Dapat mengakses menu: <strong>Dashboard, Tugas (Task - edit status pekerjaan), Gaji, Kasbon, dan Pengeluaran Rutin</strong>. (Menu Karyawan, Manajemen User & Pengaturan disembunyikan).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari username atau nama..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Filter Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Semua Role</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
      </div>

      {/* 5. User Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">User & Username</th>
                <th className="py-3.5 px-4 sm:px-6">Role</th>
                <th className="py-3.5 px-4 sm:px-6">Hak Akses Modul</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Tidak ada user yang sesuai</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          user.role === 'Admin'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-sky-100 text-sky-700 border border-sky-200'
                        }`}>
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{user.username}</span>
                            {user.id === currentUser?.id && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-semibold">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{user.nama}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.role === 'Admin'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {user.role === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        {user.role}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6">
                      <div className="text-xs text-slate-600">
                        {user.role === 'Admin' ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Akses Penuh (8 Menu)
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-sky-600" />
                            Dashboard, Task, Gaji, Kasbon, Pengeluaran
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {user.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit User & Password"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={user.username.toUpperCase() === 'AGUS'}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal Tambah / Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.username}` : 'Tambah User Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Username *
            </label>
            <input
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="Contoh: PETUGAS1"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap Petugas *
            </label>
            <input
              type="text"
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Contoh: Rian Pratama"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {editingUser ? 'Katasandi Baru (Kosongkan jika tidak diubah)' : 'Katasandi *'}
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? 'Biarkan kosong untuk mempertahankan' : 'Masukkan katasandi'}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required={!editingUser}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Role & Hak Akses *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                formRole === 'Staff'
                  ? 'bg-sky-50 border-sky-400 text-sky-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="userRole"
                  value="Staff"
                  checked={formRole === 'Staff'}
                  onChange={() => setFormRole('Staff')}
                  className="mt-0.5 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <div className="text-xs font-bold">Staff</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Operasional (Dashboard, Gaji, Kasbon, Pengeluaran)</div>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                formRole === 'Admin'
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="userRole"
                  value="Admin"
                  checked={formRole === 'Admin'}
                  onChange={() => setFormRole('Admin')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-bold">Admin</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Akses Penuh Seluruh Menu & Pengaturan</div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span className="text-xs font-semibold text-slate-700">Akun Aktif (Dapat Login)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Tambah User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
