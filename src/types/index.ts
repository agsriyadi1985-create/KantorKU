export type StatusKaryawan = 'Tetap' | 'Kontrak' | 'Magang';

export interface Karyawan {
  id: string;
  nik: string;
  nama: string;
  divisi: string;
  jabatan: string;
  status: StatusKaryawan;
  email: string;
  noHp: string;
  alamat: string;
  tanggalMasuk: string;
  gajiPokok: number;
  tunjanganMakan: number;
  tunjanganTransport: number;
  tunjanganJabatan: number;
  namaBank: string;
  noRekening: string;
  atasNamaRekening: string;
  avatarUrl?: string;
}

export type StatusKasbon = 'Aktif' | 'Lunas' | 'Dibatalkan';
export type SkemaKasbon = 'Sekali_Lunas' | 'Cicilan';

export interface RiwayatPembayaranKasbon {
  id: string;
  tanggal: string;
  periode: string; // "YYYY-MM"
  nominal: number;
  slipGajiId?: string;
  keterangan: string;
}

export interface Kasbon {
  id: string;
  karyawanId: string;
  nomorKasbon: string;
  tanggalPinjam: string;
  jumlahPinjaman: number;
  skema: SkemaKasbon;
  tenorBulan: number;
  cicilanPerBulan: number;
  sisaPinjaman: number;
  sudahDibayar: number;
  periodeMulai: string; // "YYYY-MM"
  keterangan: string;
  status: StatusKasbon;
  riwayatPembayaran: RiwayatPembayaranKasbon[];
}

export type StatusGaji = 'Draft' | 'Disetujui' | 'Dibayar';

export interface KomponenPendapatan {
  gajiPokok: number;
  tunjanganMakan: number;
  tunjanganTransport: number;
  tunjanganJabatan: number;
  lembur: number;
  bonusKinerja: number;
  tunjanganLain: number;
  ketTunjanganLain?: string;
}

export interface KomponenPotongan {
  kasbon: number;
  kasbonId?: string;
  bpjsKesehatan: number;
  bpjsKetenagakerjaan: number;
  pph21: number;
  potonganAbsen: number;
  potonganLain: number;
  ketPotonganLain?: string;
}

export interface Gaji {
  id: string;
  nomorSlip: string;
  karyawanId: string;
  periodeBulan: number; // 1 - 12
  periodeTahun: number; // e.g. 2026
  tanggalCetak: string;
  tanggalBayar?: string;
  status: StatusGaji;
  pendapatan: KomponenPendapatan;
  potongan: KomponenPotongan;
  totalPendapatan: number;
  totalPotongan: number;
  gajiBersih: number; // Take Home Pay
  catatan?: string;
}

export type KategoriPengeluaran =
  | 'Listrik PLN'
  | 'Air PDAM'
  | 'Internet & Wifi'
  | 'ATK & Cetak'
  | 'Sewa Tempat & Kantor'
  | 'Konsumsi & Dapur'
  | 'Transportasi & BBM'
  | 'Kebersihan & Keamanan'
  | 'Maintenance & Peralatan'
  | 'Pemasaran & Iklan'
  | 'Lain-lain';

export type MetodeBayar = 'Kas Tunai' | 'Transfer Bank' | 'Petty Cash';

export interface PengeluaranRutin {
  id: string;
  nomorKwitansi: string;
  tanggal: string;
  kategori: KategoriPengeluaran;
  nominal: number;
  metodeBayar: MetodeBayar;
  dibayarkanKepada: string;
  petugas: string;
  keperluan: string;
  catatan?: string;
  buktiLampiran?: string;
}

export interface CompanyInfo {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  leaderName: string;
  leaderTitle: string;
  financeName: string;
  financeTitle: string;
  logoText: string;
  logoUrl?: string;
}

export type UserRole = 'Admin' | 'Staff';

export interface User {
  id: string;
  username: string;
  password?: string;
  nama: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'karyawan'
  | 'gaji'
  | 'kasbon'
  | 'pengeluaran'
  | 'users'
  | 'pengaturan';

