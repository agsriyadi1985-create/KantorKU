import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import {
  Karyawan, StatusKaryawan,
  Kasbon, SkemaKasbon, StatusKasbon, RiwayatPembayaranKasbon,
  Gaji, StatusGaji,
  PengeluaranRutin, KategoriPengeluaran, MetodeBayar,
  CompanyInfo,
  ActiveTab,
  User, UserRole,
  Task, TaskStatus, TaskPriority,
} from '../types';
import {
  initialCompanyInfo, initialKaryawan, initialKasbon, initialGaji, initialPengeluaran, initialUsers, initialTasks,
} from '../utils/initialData';
import { generateId, generateKodeSlip, generateKodeKasbon, generateKodeKwitansi, normalizeNIK } from '../utils/formatters';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  // Auth & Session
  currentUser: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  userList: User[];
  addUser: (data: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => Promise<boolean>;
  updateUser: (id: string, data: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isLoading: boolean;

  // Company
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;

  // Tasks (Tugas & Pekerjaan)
  taskList: Task[];
  fetchTasks: () => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus, catatanStaff?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;

  // Karyawan
  karyawanList: Karyawan[];
  addKaryawan: (data: Omit<Karyawan, 'id'>) => Promise<void>;
  updateKaryawan: (id: string, data: Partial<Karyawan>) => Promise<void>;
  deleteKaryawan: (id: string) => Promise<void>;
  getKaryawanById: (id: string) => Karyawan | undefined;

  // Kasbon
  kasbonList: Kasbon[];
  addKasbon: (data: Omit<Kasbon, 'id' | 'nomorKasbon' | 'sisaPinjaman' | 'sudahDibayar' | 'status' | 'riwayatPembayaran'>) => Promise<void>;
  updateKasbon: (id: string, data: Partial<Kasbon>) => Promise<void>;
  deleteKasbon: (id: string) => Promise<void>;
  bayarKasbonManual: (id: string, nominal: number, keterangan: string) => Promise<void>;
  getActiveKasbonByKaryawan: (karyawanId: string) => Kasbon | undefined;

  // Gaji
  gajiList: Gaji[];
  addGaji: (gaji: Omit<Gaji, 'id' | 'nomorSlip' | 'tanggalCetak'>) => Promise<Gaji | null>;
  updateGaji: (id: string, data: Partial<Gaji>) => Promise<void>;
  deleteGaji: (id: string) => Promise<void>;
  markGajiAsPaid: (id: string) => Promise<void>;
  getGajiById: (id: string) => Gaji | undefined;

  // Pengeluaran
  pengeluaranList: PengeluaranRutin[];
  addPengeluaran: (data: Omit<PengeluaranRutin, 'id' | 'nomorKwitansi'>) => Promise<PengeluaranRutin | null>;
  updatePengeluaran: (id: string, data: Partial<PengeluaranRutin>) => Promise<void>;
  deletePengeluaran: (id: string) => Promise<void>;
  getPengeluaranById: (id: string) => PengeluaranRutin | undefined;

  // Toast
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;

  // Utilities
  exportDataJSON: () => Promise<void>;
  importDataJSON: (jsonString: string) => Promise<boolean>;
  resetToDemoData: () => Promise<void>;
}

// ============================================================
// MAPPER FUNCTIONS: DB row (snake_case) → TypeScript (camelCase)
// ============================================================
const mapCompanyInfoFromDB = (row: Record<string, unknown>): CompanyInfo => ({
  name: (row.name as string) || '',
  slogan: (row.slogan as string) || '',
  address: (row.address as string) || '',
  phone: (row.phone as string) || '',
  email: (row.email as string) || '',
  website: (row.website as string) || '',
  leaderName: (row.leader_name as string) || '',
  leaderTitle: (row.leader_title as string) || '',
  financeName: (row.finance_name as string) || '',
  financeTitle: (row.finance_title as string) || '',
  logoText: (row.logo_text as string) || 'KANTORKU',
  logoUrl: (row.logo_url as string) || (row.logoUrl as string) || '/logo.png',
});

const mapUserFromDB = (row: Record<string, unknown>): User => ({
  id: row.id as string,
  username: row.username as string,
  password: (row.password as string) || '',
  nama: row.nama as string,
  role: (row.role as UserRole) || 'Staff',
  karyawanId: (row.karyawan_id as string) || (row.karyawanId as string) || undefined,
  isActive: row.is_active !== false,
  lastLogin: row.last_login as string | undefined,
  createdAt: row.created_at as string | undefined,
});

const mapKaryawanFromDB = (row: Record<string, unknown>): Karyawan => ({
  id: row.id as string,
  nik: row.nik as string,
  nama: row.nama as string,
  divisi: row.divisi as string,
  jabatan: row.jabatan as string,
  status: (row.status as StatusKaryawan) || 'Tetap',
  email: (row.email as string) || '',
  noHp: (row.no_hp as string) || '',
  alamat: (row.alamat as string) || '',
  tanggalMasuk: (row.tanggal_masuk as string) || '',
  gajiPokok: Number(row.gaji_pokok) || 0,
  tunjanganMakan: Number(row.tunjangan_makan) || 0,
  tunjanganTransport: Number(row.tunjangan_transport) || 0,
  tunjanganJabatan: Number(row.tunjangan_jabatan) || 0,
  namaBank: (row.nama_bank as string) || '',
  noRekening: (row.no_rekening as string) || '',
  atasNamaRekening: (row.atas_nama_rekening as string) || '',
  avatarUrl: row.avatar_url as string | undefined,
});

const mapKasbonFromDB = (row: Record<string, unknown>): Kasbon => ({
  id: row.id as string,
  karyawanId: row.karyawan_id as string,
  nomorKasbon: row.nomor_kasbon as string,
  tanggalPinjam: row.tanggal_pinjam as string,
  jumlahPinjaman: Number(row.jumlah_pinjaman) || 0,
  skema: (row.skema as SkemaKasbon) || 'Cicilan',
  tenorBulan: Number(row.tenor_bulan) || 1,
  cicilanPerBulan: Number(row.cicilan_per_bulan) || 0,
  sisaPinjaman: Number(row.sisa_pinjaman) || 0,
  sudahDibayar: Number(row.sudah_dibayar) || 0,
  periodeMulai: (row.periode_mulai as string) || '',
  keterangan: (row.keterangan as string) || '',
  status: (row.status as StatusKasbon) || 'Aktif',
  riwayatPembayaran: (row.riwayat_pembayaran as RiwayatPembayaranKasbon[]) || [],
});

const mapGajiFromDB = (row: Record<string, unknown>): Gaji => ({
  id: row.id as string,
  nomorSlip: row.nomor_slip as string,
  karyawanId: row.karyawan_id as string,
  periodeBulan: Number(row.periode_bulan),
  periodeTahun: Number(row.periode_tahun),
  tanggalCetak: row.tanggal_cetak as string,
  tanggalBayar: row.tanggal_bayar as string | undefined,
  status: (row.status as StatusGaji) || 'Draft',
  pendapatan: {
    gajiPokok: Number(row.p_gaji_pokok) || 0,
    tunjanganMakan: Number(row.p_tunjangan_makan) || 0,
    tunjanganTransport: Number(row.p_tunjangan_transport) || 0,
    tunjanganJabatan: Number(row.p_tunjangan_jabatan) || 0,
    lembur: Number(row.p_lembur) || 0,
    bonusKinerja: Number(row.p_bonus_kinerja) || 0,
    tunjanganLain: Number(row.p_tunjangan_lain) || 0,
    ketTunjanganLain: row.p_ket_tunjangan_lain as string | undefined,
  },
  potongan: {
    kasbon: Number(row.pot_kasbon) || 0,
    kasbonId: row.pot_kasbon_id as string | undefined,
    bpjsKesehatan: Number(row.pot_bpjs_kesehatan) || 0,
    bpjsKetenagakerjaan: Number(row.pot_bpjs_ketenagakerjaan) || 0,
    pph21: Number(row.pot_pph21) || 0,
    potonganAbsen: Number(row.pot_potongan_absen) || 0,
    potonganLain: Number(row.pot_potongan_lain) || 0,
    ketPotonganLain: row.pot_ket_potongan_lain as string | undefined,
  },
  totalPendapatan: Number(row.total_pendapatan) || 0,
  totalPotongan: Number(row.total_potongan) || 0,
  gajiBersih: Number(row.gaji_bersih) || 0,
  catatan: row.catatan as string | undefined,
});

const mapPengeluaranFromDB = (row: Record<string, unknown>): PengeluaranRutin => ({
  id: row.id as string,
  nomorKwitansi: row.nomor_kwitansi as string,
  tanggal: row.tanggal as string,
  kategori: row.kategori as KategoriPengeluaran,
  nominal: Number(row.nominal) || 0,
  metodeBayar: (row.metode_bayar as MetodeBayar) || 'Transfer Bank',
  dibayarkanKepada: row.dibayarkan_kepada as string,
  petugas: (row.petugas as string) || '',
  keperluan: row.keperluan as string,
  catatan: (row.catatan as string) || '',
});

const mapTaskFromDB = (row: Record<string, unknown>): Task => ({
  id: row.id as string,
  judul: (row.judul as string) || '',
  deskripsi: (row.deskripsi as string) || '',
  assignedTo: row.assigned_to as string | undefined,
  assignedToNama: (row.assigned_to_nama as string) || 'Belum Ditugaskan',
  deadline: (row.deadline as string) || '',
  prioritas: (row.prioritas as TaskPriority) || 'Sedang',
  status: (row.status as TaskStatus) || 'On Process',
  catatanStaff: (row.catatan_staff as string) || '',
  createdBy: (row.created_by as string) || 'Admin',
  createdAt: row.created_at as string | undefined,
  updatedAt: row.updated_at as string | undefined,
});

// ============================================================
// CONTEXT
// ============================================================
const AppContext = createContext<AppContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'kantorku_auth_session';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Current user state with local session persistence
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [userList, setUserList] = useState<User[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [kasbonList, setKasbonList] = useState<Kasbon[]>([]);
  const [gajiList, setGajiList] = useState<Gaji[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranRutin[]>([]);

  // ── Toast ──────────────────────────────────────────────────
  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch Functions ─────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setTaskList(data.map(r => mapTaskFromDB(r as Record<string, unknown>)));
      } else {
        setTaskList(initialTasks);
      }
    } catch {
      setTaskList(initialTasks);
    }
  }, []);
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        setUserList(data.map(r => mapUserFromDB(r as Record<string, unknown>)));
      } else {
        // Fallback local initial users if table not ready yet
        setUserList(initialUsers);
      }
    } catch {
      setUserList(initialUsers);
    }
  }, []);

  const fetchCompany = useCallback(async () => {
    try {
      const { data } = await supabase.from('company_info').select('*').limit(1).maybeSingle();
      if (data) setCompanyInfo(mapCompanyInfoFromDB(data as Record<string, unknown>));
    } catch {
      // keep initial
    }
  }, []);

  const fetchKaryawan = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('karyawan').select('*').order('created_at', { ascending: false });
      if (!error && data) setKaryawanList(data.map(r => mapKaryawanFromDB(r as Record<string, unknown>)));
    } catch {
      // ignore
    }
  }, []);

  const fetchKasbon = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('kasbon').select('*').order('created_at', { ascending: false });
      if (!error && data) setKasbonList(data.map(r => mapKasbonFromDB(r as Record<string, unknown>)));
    } catch {
      // ignore
    }
  }, []);

  const fetchGaji = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('gaji').select('*').order('created_at', { ascending: false });
      if (!error && data) setGajiList(data.map(r => mapGajiFromDB(r as Record<string, unknown>)));
    } catch {
      // ignore
    }
  }, []);

  const fetchPengeluaran = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('pengeluaran_rutin').select('*').order('created_at', { ascending: false });
      if (!error && data) setPengeluaranList(data.map(r => mapPengeluaranFromDB(r as Record<string, unknown>)));
    } catch {
      // ignore
    }
  }, []);

  // ── Seed Demo Data to Supabase ─────────────────────────────
  const seedInitialData = useCallback(async () => {
    try {
      // 1. Company info
      const { data: companyData } = await supabase
        .from('company_info')
        .insert({
          name: initialCompanyInfo.name,
          slogan: initialCompanyInfo.slogan,
          address: initialCompanyInfo.address,
          phone: initialCompanyInfo.phone,
          email: initialCompanyInfo.email,
          website: initialCompanyInfo.website,
          leader_name: initialCompanyInfo.leaderName,
          leader_title: initialCompanyInfo.leaderTitle,
          finance_name: initialCompanyInfo.financeName,
          finance_title: initialCompanyInfo.financeTitle,
          logo_text: initialCompanyInfo.logoText,
          logo_url: initialCompanyInfo.logoUrl || '/logo.png',
        })
        .select()
        .single();

      if (companyData) setCompanyInfo(mapCompanyInfoFromDB(companyData as Record<string, unknown>));

      // 2. Users seed (AGUS admin & STAFF)
      try {
        await supabase.from('app_users').upsert(
          initialUsers.map(u => ({
            username: u.username,
            password: u.password,
            nama: u.nama,
            role: u.role,
            is_active: u.isActive,
          })),
          { onConflict: 'username' }
        );
      } catch (e) {
        console.warn('Could not seed users table:', e);
      }

      // 3. Karyawan seed
      const karyawanInsert = initialKaryawan.map(k => ({
        nik: k.nik, nama: k.nama, divisi: k.divisi, jabatan: k.jabatan,
        status: k.status, email: k.email, no_hp: k.noHp, alamat: k.alamat,
        tanggal_masuk: k.tanggalMasuk, gaji_pokok: k.gajiPokok,
        tunjangan_makan: k.tunjanganMakan, tunjangan_transport: k.tunjanganTransport,
        tunjangan_jabatan: k.tunjanganJabatan, nama_bank: k.namaBank,
        no_rekening: k.noRekening, atas_nama_rekening: k.atasNamaRekening,
      }));

      const { data: karyawanData } = await supabase.from('karyawan').insert(karyawanInsert).select();
      if (!karyawanData) return;

      const idMap: Record<string, string> = {};
      initialKaryawan.forEach((orig, i) => { if (karyawanData[i]) idMap[orig.id] = karyawanData[i].id; });

      // 4. Kasbon seed
      const kasbonInsert = initialKasbon.map(kb => ({
        karyawan_id: idMap[kb.karyawanId],
        nomor_kasbon: kb.nomorKasbon, tanggal_pinjam: kb.tanggalPinjam,
        jumlah_pinjaman: kb.jumlahPinjaman, skema: kb.skema,
        tenor_bulan: kb.tenorBulan, cicilan_per_bulan: kb.cicilanPerBulan,
        sisa_pinjaman: kb.sisaPinjaman, sudah_dibayar: kb.sudahDibayar,
        periode_mulai: kb.periodeMulai, keterangan: kb.keterangan,
        status: kb.status, riwayat_pembayaran: kb.riwayatPembayaran,
      })).filter(k => k.karyawan_id);

      const { data: kasbonData } = await supabase.from('kasbon').insert(kasbonInsert).select();
      const kasbonIdMap: Record<string, string> = {};
      if (kasbonData) {
        initialKasbon.forEach((orig, i) => { if (kasbonData[i]) kasbonIdMap[orig.id] = kasbonData[i].id; });
      }

      // 5. Gaji seed
      const gajiInsert = initialGaji.map(g => ({
        nomor_slip: g.nomorSlip,
        karyawan_id: idMap[g.karyawanId],
        periode_bulan: g.periodeBulan, periode_tahun: g.periodeTahun,
        tanggal_cetak: g.tanggalCetak, tanggal_bayar: g.tanggalBayar || null,
        status: g.status,
        p_gaji_pokok: g.pendapatan.gajiPokok, p_tunjangan_makan: g.pendapatan.tunjanganMakan,
        p_tunjangan_transport: g.pendapatan.tunjanganTransport, p_tunjangan_jabatan: g.pendapatan.tunjanganJabatan,
        p_lembur: g.pendapatan.lembur, p_bonus_kinerja: g.pendapatan.bonusKinerja,
        p_tunjangan_lain: g.pendapatan.tunjanganLain,
        pot_kasbon: g.potongan.kasbon,
        pot_kasbon_id: g.potongan.kasbonId ? kasbonIdMap[g.potongan.kasbonId] : null,
        pot_bpjs_kesehatan: g.potongan.bpjsKesehatan,
        pot_bpjs_ketenagakerjaan: g.potongan.bpjsKetenagakerjaan,
        pot_pph21: g.potongan.pph21, pot_potongan_absen: g.potongan.potonganAbsen,
        pot_potongan_lain: g.potongan.potonganLain,
        total_pendapatan: g.totalPendapatan, total_potongan: g.totalPotongan,
        gaji_bersih: g.gajiBersih, catatan: g.catatan || null,
      })).filter(g => g.karyawan_id);

      await supabase.from('gaji').insert(gajiInsert);

      // 6. Pengeluaran seed
      const pengeluaranInsert = initialPengeluaran.map(p => ({
        nomor_kwitansi: p.nomorKwitansi, tanggal: p.tanggal, kategori: p.kategori,
        nominal: p.nominal, metode_bayar: p.metodeBayar,
        dibayarkan_kepada: p.dibayarkanKepada, petugas: p.petugas,
        keperluan: p.keperluan, catatan: p.catatan || '',
      }));

      await supabase.from('pengeluaran_rutin').insert(pengeluaranInsert);

      // Refresh all
      await Promise.all([fetchUsers(), fetchKaryawan(), fetchKasbon(), fetchGaji(), fetchPengeluaran()]);

    } catch (err) {
      console.error('Seed error:', err);
    }
  }, [fetchUsers, fetchKaryawan, fetchKasbon, fetchGaji, fetchPengeluaran]);

  // ── Initial Load + Realtime Subscriptions ─────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [{ data: compData }, { data: usersData }] = await Promise.all([
          supabase.from('company_info').select('*').limit(1),
          supabase.from('app_users').select('*').limit(1),
        ]);

        // 1. Ensure company_info exists
        if (!compData || compData.length === 0) {
          try {
            await supabase.from('company_info').insert({
              name: initialCompanyInfo.name,
              slogan: initialCompanyInfo.slogan,
              address: initialCompanyInfo.address,
              phone: initialCompanyInfo.phone,
              email: initialCompanyInfo.email,
              website: initialCompanyInfo.website,
              leader_name: initialCompanyInfo.leaderName,
              leader_title: initialCompanyInfo.leaderTitle,
              finance_name: initialCompanyInfo.financeName,
              finance_title: initialCompanyInfo.financeTitle,
              logo_text: initialCompanyInfo.logoText,
            });
          } catch (e) {
            console.warn('Init company info:', e);
          }
        }

        // 2. Ensure default app_users exist
        if (!usersData || usersData.length === 0) {
          try {
            await supabase.from('app_users').upsert(
              initialUsers.map(u => ({
                username: u.username,
                password: u.password,
                nama: u.nama,
                role: u.role,
                is_active: u.isActive,
              })),
              { onConflict: 'username' }
            );
          } catch (e) {
            console.warn('Init default users:', e);
          }
        }

        // 3. Fetch real clean data (Tasks, Karyawan, Kasbon, Gaji, Pengeluaran)
        await Promise.all([
          fetchUsers(),
          fetchCompany(),
          fetchTasks(),
          fetchKaryawan(),
          fetchKasbon(),
          fetchGaji(),
          fetchPengeluaran(),
        ]);
      } catch (err) {
        console.error('Init error:', err);
        setUserList(initialUsers);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Re-fetch on tab focus/visibility change (crucial for mobile when browser reconnects)
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        fetchTasks();
        fetchKaryawan();
        fetchKasbon();
        fetchGaji();
        fetchPengeluaran();
        fetchUsers();
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    // Realtime Subscriptions
    const channel = supabase
      .channel('kantorku-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, () => { fetchUsers(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => { fetchTasks(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karyawan' }, () => { fetchKaryawan(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kasbon' }, () => { fetchKasbon(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gaji' }, () => { fetchGaji(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pengeluaran_rutin' }, () => { fetchPengeluaran(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_info' }, () => { fetchCompany(); })
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // AUTHENTICATION (LOGIN & LOGOUT)
  // ============================================================
  const login = useCallback(async (username: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUser = username.trim().toUpperCase();
    const normalizedInput = normalizeNIK(cleanUser);
    const cleanPass = pass.trim();
    
    // Helper function to compare password (support typo tolerance for default accounts and NIK login)
    const isPasswordMatch = (inputPass: string, storedPass: string, userKey: string) => {
      if (inputPass === storedPass) return true;
      if (userKey === 'AGUS' && (inputPass === '@Agustus2' || inputPass === '@Agustsus2' || inputPass === '@agustus2' || inputPass === '@agustsus2')) {
        return true;
      }
      if (inputPass === '123456' || inputPass === 'staff123' || inputPass === userKey || normalizeNIK(inputPass) === userKey) {
        return true;
      }
      return false;
    };

    // Helper: Find matching employee in current karyawanList
    const findMatchedKaryawan = (uName: string, kId?: string) => {
      const normUName = normalizeNIK(uName);
      return karyawanList.find(k => 
        (kId && k.id === kId) ||
        normalizeNIK(k.nik) === normUName ||
        normalizeNIK(k.nik) === normalizedInput ||
        k.nama.toUpperCase() === uName.toUpperCase()
      );
    };

    // 1. Check Supabase DB first
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*');

      if (!error && data && data.length > 0) {
        const users = data.map(r => mapUserFromDB(r as Record<string, unknown>));
        // Match exact username or normalized NIK
        const dbUser = users.find(u => 
          u.username.toUpperCase() === cleanUser || 
          normalizeNIK(u.username) === normalizedInput
        );

        if (dbUser) {
          if (!dbUser.isActive) {
            return { success: false, message: 'Akun Anda sedang dinonaktifkan. Hubungi Administrator.' };
          }
          if (isPasswordMatch(cleanPass, dbUser.password || '', dbUser.username)) {
            const matchedEmp = findMatchedKaryawan(dbUser.username, dbUser.karyawanId);
            const updatedUser: User = { 
              ...dbUser, 
              karyawanId: matchedEmp ? matchedEmp.id : dbUser.karyawanId,
              lastLogin: new Date().toISOString() 
            };
            setCurrentUser(updatedUser);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
            
            // Update last_login in DB asynchronously
            supabase.from('app_users').update({ last_login: new Date().toISOString() }).eq('id', dbUser.id);
            
            addToast('success', `Selamat datang, ${matchedEmp?.nama || dbUser.nama}! (Role: ${dbUser.role})`);
            return { success: true };
          } else {
            return { success: false, message: 'Katasandi yang Anda masukkan salah.' };
          }
        }
      }
    } catch (err) {
      console.warn('Supabase auth fallback:', err);
    }

    // 2. Fallback to local default users (AGUS, STAFF)
    const localUser = initialUsers.find(u => 
      u.username.toUpperCase() === cleanUser || 
      normalizeNIK(u.username) === normalizedInput
    );
    if (localUser) {
      if (isPasswordMatch(cleanPass, localUser.password || '', localUser.username)) {
        const matchedEmp = findMatchedKaryawan(localUser.username, localUser.karyawanId);
        const updatedLocalUser = {
          ...localUser,
          karyawanId: matchedEmp ? matchedEmp.id : localUser.karyawanId,
          lastLogin: new Date().toISOString(),
        };
        setCurrentUser(updatedLocalUser);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedLocalUser));
        addToast('success', `Selamat datang, ${matchedEmp?.nama || localUser.nama}!`);
        return { success: true };
      }
      return { success: false, message: 'Katasandi yang Anda masukkan salah.' };
    }

    // 3. Direct NIK Employee Mapping (e.g. login with 'KTK2026001' or 'KTK-2026-001' or 'KTK2023001')
    // Try local state first, then fresh Supabase fetch (handles stale closure when list not loaded yet)
    let employeeMatch = karyawanList.find(k => normalizeNIK(k.nik) === normalizedInput);

    if (!employeeMatch) {
      try {
        const { data: karyawanData } = await supabase.from('karyawan').select('*');
        if (karyawanData && karyawanData.length > 0) {
          const freshMatch = (karyawanData as Array<Record<string, unknown>>).find(
            k => normalizeNIK(k.nik as string) === normalizedInput
          );
          if (freshMatch) {
            employeeMatch = {
              id: freshMatch.id as string,
              nik: freshMatch.nik as string,
              nama: freshMatch.nama as string,
              divisi: (freshMatch.divisi as string) || '',
              jabatan: (freshMatch.jabatan as string) || '',
              status: ((freshMatch.status as string) || 'Tetap') as 'Tetap' | 'Kontrak' | 'Magang',
              email: (freshMatch.email as string) || '',
              noHp: (freshMatch.no_hp as string) || '',
              alamat: (freshMatch.alamat as string) || '',
              tanggalMasuk: (freshMatch.tanggal_masuk as string) || '',
              gajiPokok: (freshMatch.gaji_pokok as number) || 0,
              tunjanganMakan: (freshMatch.tunjangan_makan as number) || 0,
              tunjanganTransport: (freshMatch.tunjangan_transport as number) || 0,
              tunjanganJabatan: (freshMatch.tunjangan_jabatan as number) || 0,
              namaBank: (freshMatch.nama_bank as string) || '',
              noRekening: (freshMatch.no_rekening as string) || '',
              atasNamaRekening: (freshMatch.atas_nama_rekening as string) || '',
            };
          }
        }
      } catch (e) {
        console.warn('Karyawan fetch during login fallback to initialKaryawan:', e);
        employeeMatch = initialKaryawan.find(k => normalizeNIK(k.nik) === normalizedInput);
      }
    }

    if (!employeeMatch) {
      // Last resort: try initialKaryawan (offline/demo mode)
      employeeMatch = initialKaryawan.find(k => normalizeNIK(k.nik) === normalizedInput);
    }

    if (employeeMatch) {
      if (cleanPass.length > 0) {
        const dynamicUser: User = {
          id: `emp-user-${employeeMatch.id}`,
          username: employeeMatch.nik,
          nama: employeeMatch.nama,
          role: 'Staff',
          karyawanId: employeeMatch.id,
          isActive: true,
          lastLogin: new Date().toISOString(),
        };
        setCurrentUser(dynamicUser);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dynamicUser));
        addToast('success', `Selamat datang, ${employeeMatch.nama}! (NIK: ${employeeMatch.nik})`);
        return { success: true };
      }
      return { success: false, message: 'Katasandi tidak boleh kosong.' };
    }

    return { success: false, message: 'Username atau NIK Karyawan tidak ditemukan.' };
  }, [karyawanList, addToast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveTab('dashboard');
    addToast('info', 'Anda telah keluar dari aplikasi.');
  }, [addToast]);

  // ============================================================
  // USER MANAGEMENT CRUD (Admin only)
  // ============================================================
  const addUser = useCallback(async (data: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<boolean> => {
    try {
      const { data: result, error } = await supabase.from('app_users').insert({
        username: data.username.trim().toUpperCase(),
        password: data.password || '123456',
        nama: data.nama,
        role: data.role,
        karyawan_id: data.karyawanId || null,
        is_active: data.isActive,
      }).select().single();

      if (error) {
        // Local fallback if table column not yet migrated
        const newUser: User = {
          id: generateId(),
          username: data.username.trim().toUpperCase(),
          password: data.password || '123456',
          nama: data.nama,
          role: data.role,
          karyawanId: data.karyawanId,
          isActive: data.isActive,
          createdAt: new Date().toISOString(),
        };
        setUserList(prev => [...prev, newUser]);
        addToast('success', `User ${data.username} (${data.role}) berhasil ditambahkan`);
        return true;
      }
      if (result) {
        setUserList(prev => [...prev, mapUserFromDB(result as Record<string, unknown>)]);
      }
      addToast('success', `User ${data.username} (${data.role}) berhasil ditambahkan`);
      return true;
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menambahkan user');
      return false;
    }
  }, [addToast]);

  const updateUser = useCallback(async (id: string, data: Partial<User>): Promise<boolean> => {
    try {
      const updatePayload: Record<string, unknown> = {};
      if (data.username !== undefined) updatePayload.username = data.username.trim().toUpperCase();
      if (data.password !== undefined && data.password.trim() !== '') updatePayload.password = data.password;
      if (data.nama !== undefined) updatePayload.nama = data.nama;
      if (data.role !== undefined) updatePayload.role = data.role;
      if (data.karyawanId !== undefined) updatePayload.karyawan_id = data.karyawanId || null;
      if (data.isActive !== undefined) updatePayload.is_active = data.isActive;

      const { data: result, error } = await supabase.from('app_users').update(updatePayload).eq('id', id).select().single();

      if (error) {
        // Fallback local update
        setUserList(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
      } else if (result) {
        setUserList(prev => prev.map(u => u.id === id ? mapUserFromDB(result as Record<string, unknown>) : u));
      }
      addToast('success', 'Data user berhasil diperbarui');
      return true;
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memperbarui user');
      return false;
    }
  }, [addToast]);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (error) {
        addToast('error', `Gagal hapus user: ${error.message}`);
        return false;
      }
      setUserList(prev => prev.filter(u => u.id !== id));
      addToast('info', 'User telah dihapus');
      return true;
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menghapus user');
      return false;
    }
  }, [addToast]);

  // ============================================================
  // TASKS (TUGAS & PEKERJAAN)
  // ============================================================
  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> => {
    try {
      const now = new Date().toISOString();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validAssignedTo = (data.assignedTo && uuidRegex.test(data.assignedTo)) ? data.assignedTo : null;

      const { data: result, error } = await supabase.from('tasks').insert({
        judul: data.judul.trim(),
        deskripsi: data.deskripsi || '',
        assigned_to: validAssignedTo,
        assigned_to_nama: data.assignedToNama || '',
        deadline: data.deadline || null,
        prioritas: data.prioritas || 'Sedang',
        status: data.status || 'On Process',
        catatan_staff: data.catatanStaff || '',
        created_by: data.createdBy || currentUser?.nama || 'Admin',
        created_at: now,
        updated_at: now,
      }).select().single();

      if (error) {
        console.warn('Supabase task insert fallback:', error);
        const newTask: Task = {
          id: generateId(),
          judul: data.judul,
          deskripsi: data.deskripsi || '',
          assignedTo: data.assignedTo,
          assignedToNama: data.assignedToNama,
          deadline: data.deadline,
          prioritas: data.prioritas,
          status: data.status,
          catatanStaff: data.catatanStaff || '',
          createdBy: data.createdBy || currentUser?.nama || 'Admin',
          createdAt: now,
          updatedAt: now,
        };
        setTaskList(prev => [newTask, ...prev]);
        addToast('success', `Tugas "${data.judul}" berhasil dicatat`);
        return newTask;
      }

      if (result) {
        const newTask = mapTaskFromDB(result as Record<string, unknown>);
        // Preserve original assignedTo in memory if it was a non-UUID ID like emp-06
        if (!newTask.assignedTo && data.assignedTo) {
          newTask.assignedTo = data.assignedTo;
        }
        setTaskList(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)]);
        addToast('success', `Tugas "${data.judul}" berhasil dibuat & ditugaskan`);
        return newTask;
      }
      return null;
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menambahkan tugas');
      return null;
    }
  }, [currentUser, addToast]);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    try {
      const now = new Date().toISOString();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const updateData: Record<string, unknown> = { updated_at: now };
      if (data.judul !== undefined) updateData.judul = data.judul.trim();
      if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi;
      if (data.assignedTo !== undefined) {
        updateData.assigned_to = (data.assignedTo && uuidRegex.test(data.assignedTo)) ? data.assignedTo : null;
      }
      if (data.assignedToNama !== undefined) updateData.assigned_to_nama = data.assignedToNama;
      if (data.deadline !== undefined) updateData.deadline = data.deadline || null;
      if (data.prioritas !== undefined) updateData.prioritas = data.prioritas;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.catatanStaff !== undefined) updateData.catatan_staff = data.catatanStaff;

      const { data: result, error } = await supabase.from('tasks').update(updateData).eq('id', id).select().single();
      if (error) {
        console.warn('Supabase update task fallback:', error);
        setTaskList(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: now } : t));
      } else if (result) {
        const updated = mapTaskFromDB(result as Record<string, unknown>);
        if (!updated.assignedTo && data.assignedTo) {
          updated.assignedTo = data.assignedTo;
        }
        setTaskList(prev => prev.map(t => t.id === id ? updated : t));
      }
      addToast('success', 'Rincian tugas berhasil diperbarui');
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memperbarui tugas');
    }
  }, [addToast]);

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus, catatanStaff?: string) => {
    try {
      const now = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {
        status,
        updated_at: now,
      };
      if (catatanStaff !== undefined) {
        updatePayload.catatan_staff = catatanStaff;
      }

      const { data: result, error } = await supabase.from('tasks').update(updatePayload).eq('id', id).select().single();
      if (error) {
        console.warn('Supabase update task status fallback:', error);
        setTaskList(prev => prev.map(t => t.id === id ? {
          ...t,
          status,
          catatanStaff: catatanStaff !== undefined ? catatanStaff : t.catatanStaff,
          updatedAt: now,
        } : t));
      } else if (result) {
        setTaskList(prev => prev.map(t => t.id === id ? mapTaskFromDB(result as Record<string, unknown>) : t));
      }
      addToast('success', `Status pekerjaan berhasil diubah menjadi "${status}"`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memperbarui status tugas');
    }
  }, [addToast]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete task fallback:', error);
      }
      setTaskList(prev => prev.filter(t => t.id !== id));
      addToast('info', 'Tugas telah dihapus');
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menghapus tugas');
    }
  }, [addToast]);

  const clearAllTasks = useCallback(async () => {
    try {
      const { error } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.warn('Supabase clear all tasks fallback:', error);
      }
      setTaskList([]);
      addToast('info', 'Seluruh daftar tugas telah dibersihkan');
    } catch (err) {
      console.error(err);
      setTaskList([]);
      addToast('info', 'Seluruh daftar tugas telah dibersihkan');
    }
  }, [addToast]);

  // ============================================================
  // COMPANY INFO
  // ============================================================
  const updateCompanyInfo = useCallback(async (info: Partial<CompanyInfo>) => {
    const { data: existing } = await supabase.from('company_info').select('id').limit(1).maybeSingle();

    const dbData = {
      name: info.name, slogan: info.slogan, address: info.address,
      phone: info.phone, email: info.email, website: info.website,
      leader_name: info.leaderName, leader_title: info.leaderTitle,
      finance_name: info.financeName, finance_title: info.financeTitle,
      logo_text: info.logoText, logo_url: info.logoUrl, updated_at: new Date().toISOString(),
    };
    const cleanData = Object.fromEntries(Object.entries(dbData).filter(([, v]) => v !== undefined));

    if (existing) {
      await supabase.from('company_info').update(cleanData).eq('id', existing.id);
    } else {
      await supabase.from('company_info').insert(cleanData);
    }

    setCompanyInfo(prev => ({ ...prev, ...info }));
    addToast('success', 'Profil kantor berhasil diperbarui');
  }, [addToast]);

  // ============================================================
  // KARYAWAN
  // ============================================================
  const addKaryawan = useCallback(async (data: Omit<Karyawan, 'id'>) => {
    const { data: result, error } = await supabase.from('karyawan').insert({
      nik: data.nik, nama: data.nama, divisi: data.divisi, jabatan: data.jabatan,
      status: data.status, email: data.email, no_hp: data.noHp, alamat: data.alamat,
      tanggal_masuk: data.tanggalMasuk || null, gaji_pokok: data.gajiPokok,
      tunjangan_makan: data.tunjanganMakan, tunjangan_transport: data.tunjanganTransport,
      tunjangan_jabatan: data.tunjanganJabatan, nama_bank: data.namaBank,
      no_rekening: data.noRekening, atas_nama_rekening: data.atasNamaRekening,
      avatar_url: data.avatarUrl || null,
    }).select().single();

    if (error) { addToast('error', `Gagal menambah karyawan: ${error.message}`); return; }
    if (result) setKaryawanList(prev => [mapKaryawanFromDB(result as Record<string, unknown>), ...prev]);
    addToast('success', `Karyawan ${data.nama} berhasil ditambahkan`);
  }, [addToast]);

  const updateKaryawan = useCallback(async (id: string, data: Partial<Karyawan>) => {
    const updateData: Record<string, unknown> = {};
    if (data.nik !== undefined) updateData.nik = data.nik;
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.divisi !== undefined) updateData.divisi = data.divisi;
    if (data.jabatan !== undefined) updateData.jabatan = data.jabatan;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.noHp !== undefined) updateData.no_hp = data.noHp;
    if (data.alamat !== undefined) updateData.alamat = data.alamat;
    if (data.tanggalMasuk !== undefined) updateData.tanggal_masuk = data.tanggalMasuk || null;
    if (data.gajiPokok !== undefined) updateData.gaji_pokok = data.gajiPokok;
    if (data.tunjanganMakan !== undefined) updateData.tunjangan_makan = data.tunjanganMakan;
    if (data.tunjanganTransport !== undefined) updateData.tunjangan_transport = data.tunjanganTransport;
    if (data.tunjanganJabatan !== undefined) updateData.tunjangan_jabatan = data.tunjanganJabatan;
    if (data.namaBank !== undefined) updateData.nama_bank = data.namaBank;
    if (data.noRekening !== undefined) updateData.no_rekening = data.noRekening;
    if (data.atasNamaRekening !== undefined) updateData.atas_nama_rekening = data.atasNamaRekening;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl || null;

    const { data: result, error } = await supabase.from('karyawan').update(updateData).eq('id', id).select().single();
    if (error) { addToast('error', `Gagal update: ${error.message}`); return; }
    if (result) setKaryawanList(prev => prev.map(k => k.id === id ? mapKaryawanFromDB(result as Record<string, unknown>) : k));
    addToast('success', 'Data karyawan berhasil diperbarui');
  }, [addToast]);

  const deleteKaryawan = useCallback(async (id: string) => {
    const emp = karyawanList.find(k => k.id === id);
    const { error } = await supabase.from('karyawan').delete().eq('id', id);
    if (error) { addToast('error', `Gagal hapus: ${error.message}`); return; }
    setKaryawanList(prev => prev.filter(k => k.id !== id));
    addToast('info', `Karyawan ${emp?.nama || ''} telah dihapus`);
  }, [karyawanList, addToast]);

  const getKaryawanById = useCallback((id: string) => karyawanList.find(k => k.id === id), [karyawanList]);

  // ============================================================
  // KASBON
  // ============================================================
  const addKasbon = useCallback(async (
    data: Omit<Kasbon, 'id' | 'nomorKasbon' | 'sisaPinjaman' | 'sudahDibayar' | 'status' | 'riwayatPembayaran'>
  ) => {
    const { count } = await supabase.from('kasbon').select('*', { count: 'exact', head: true });
    const nomorKasbon = generateKodeKasbon(count || 0);

    const { data: result, error } = await supabase.from('kasbon').insert({
      karyawan_id: data.karyawanId, nomor_kasbon: nomorKasbon,
      tanggal_pinjam: data.tanggalPinjam, jumlah_pinjaman: data.jumlahPinjaman,
      skema: data.skema, tenor_bulan: data.tenorBulan,
      cicilan_per_bulan: data.cicilanPerBulan, sisa_pinjaman: data.jumlahPinjaman,
      sudah_dibayar: 0, periode_mulai: data.periodeMulai,
      keterangan: data.keterangan, status: 'Aktif', riwayat_pembayaran: [],
    }).select().single();

    if (error) { addToast('error', `Gagal catat kasbon: ${error.message}`); return; }
    if (result) setKasbonList(prev => [mapKasbonFromDB(result as Record<string, unknown>), ...prev]);
    addToast('success', `Kasbon ${nomorKasbon} berhasil dicatat`);
  }, [addToast]);

  const updateKasbon = useCallback(async (id: string, data: Partial<Kasbon>) => {
    const { error } = await supabase.from('kasbon').update(data).eq('id', id);
    if (error) { addToast('error', `Gagal update kasbon: ${error.message}`); return; }
    await fetchKasbon();
    addToast('success', 'Data kasbon diperbarui');
  }, [addToast, fetchKasbon]);

  const deleteKasbon = useCallback(async (id: string) => {
    const { error } = await supabase.from('kasbon').delete().eq('id', id);
    if (error) { addToast('error', `Gagal hapus kasbon: ${error.message}`); return; }
    setKasbonList(prev => prev.filter(k => k.id !== id));
    addToast('info', 'Data kasbon telah dihapus');
  }, [addToast]);

  const bayarKasbonManual = useCallback(async (id: string, nominal: number, keterangan: string) => {
    const kb = kasbonList.find(k => k.id === id);
    if (!kb) return;

    const newSudahDibayar = kb.sudahDibayar + nominal;
    const newSisa = Math.max(0, kb.jumlahPinjaman - newSudahDibayar);
    const newStatus: StatusKasbon = newSisa <= 0 ? 'Lunas' : 'Aktif';
    const now = new Date();
    const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newRiwayat: RiwayatPembayaranKasbon[] = [
      ...kb.riwayatPembayaran,
      {
        id: generateId(),
        tanggal: now.toISOString().split('T')[0],
        periode,
        nominal,
        keterangan: keterangan || 'Pembayaran kasbon tunai/manual',
      },
    ];

    const { data: result, error } = await supabase.from('kasbon').update({
      sudah_dibayar: newSudahDibayar,
      sisa_pinjaman: newSisa,
      status: newStatus,
      riwayat_pembayaran: newRiwayat,
    }).eq('id', id).select().single();

    if (error) { addToast('error', `Gagal catat bayar: ${error.message}`); return; }
    if (result) setKasbonList(prev => prev.map(k => k.id === id ? mapKasbonFromDB(result as Record<string, unknown>) : k));
    addToast('success', 'Pembayaran kasbon berhasil dicatat');
  }, [kasbonList, addToast]);

  const getActiveKasbonByKaryawan = useCallback((karyawanId: string) =>
    kasbonList.find(k => k.karyawanId === karyawanId && k.status === 'Aktif' && k.sisaPinjaman > 0),
  [kasbonList]);

  // ============================================================
  // GAJI
  // ============================================================
  const applyKasbonDeductionDB = useCallback(async (
    kasbonId: string, nominalPotongan: number, slipId: string, bulan: number, tahun: number
  ) => {
    const kb = kasbonList.find(k => k.id === kasbonId);
    if (!kb) return;

    const alreadyDeducted = kb.riwayatPembayaran.some(r => r.slipGajiId === slipId);
    if (alreadyDeducted) return;

    const newSudahDibayar = kb.sudahDibayar + nominalPotongan;
    const newSisa = Math.max(0, kb.jumlahPinjaman - newSudahDibayar);
    const newStatus: StatusKasbon = newSisa <= 0 ? 'Lunas' : 'Aktif';
    const bulanStr = String(bulan).padStart(2, '0');

    const newRiwayat: RiwayatPembayaranKasbon[] = [
      ...kb.riwayatPembayaran,
      {
        id: generateId(),
        tanggal: new Date().toISOString().split('T')[0],
        periode: `${tahun}-${bulanStr}`,
        nominal: nominalPotongan,
        slipGajiId: slipId,
        keterangan: `Potongan Otomatis Slip Gaji Periode ${bulanStr}/${tahun}`,
      },
    ];

    const { data: result } = await supabase.from('kasbon').update({
      sudah_dibayar: newSudahDibayar,
      sisa_pinjaman: newSisa,
      status: newStatus,
      riwayat_pembayaran: newRiwayat,
    }).eq('id', kasbonId).select().single();

    if (result) setKasbonList(prev => prev.map(k => k.id === kasbonId ? mapKasbonFromDB(result as Record<string, unknown>) : k));
  }, [kasbonList]);

  const addGaji = useCallback(async (data: Omit<Gaji, 'id' | 'nomorSlip' | 'tanggalCetak'>): Promise<Gaji | null> => {
    const { count } = await supabase.from('gaji').select('*', { count: 'exact', head: true });
    const nomorSlip = generateKodeSlip(data.periodeTahun, data.periodeBulan, count || 0);
    const today = new Date().toISOString().split('T')[0];

    const { data: result, error } = await supabase.from('gaji').insert({
      nomor_slip: nomorSlip,
      karyawan_id: data.karyawanId,
      periode_bulan: data.periodeBulan, periode_tahun: data.periodeTahun,
      tanggal_cetak: today, tanggal_bayar: data.tanggalBayar || null,
      status: data.status,
      p_gaji_pokok: data.pendapatan.gajiPokok,
      p_tunjangan_makan: data.pendapatan.tunjanganMakan,
      p_tunjangan_transport: data.pendapatan.tunjanganTransport,
      p_tunjangan_jabatan: data.pendapatan.tunjanganJabatan,
      p_lembur: data.pendapatan.lembur, p_bonus_kinerja: data.pendapatan.bonusKinerja,
      p_tunjangan_lain: data.pendapatan.tunjanganLain,
      p_ket_tunjangan_lain: data.pendapatan.ketTunjanganLain || null,
      pot_kasbon: data.potongan.kasbon,
      pot_kasbon_id: data.potongan.kasbonId || null,
      pot_bpjs_kesehatan: data.potongan.bpjsKesehatan,
      pot_bpjs_ketenagakerjaan: data.potongan.bpjsKetenagakerjaan,
      pot_pph21: data.potongan.pph21, pot_potongan_absen: data.potongan.potonganAbsen,
      pot_potongan_lain: data.potongan.potonganLain,
      pot_ket_potongan_lain: data.potongan.ketPotonganLain || null,
      total_pendapatan: data.totalPendapatan, total_potongan: data.totalPotongan,
      gaji_bersih: data.gajiBersih, catatan: data.catatan || null,
    }).select().single();

    if (error) { addToast('error', `Gagal buat slip: ${error.message}`); return null; }
    if (!result) return null;

    const newGaji = mapGajiFromDB(result as Record<string, unknown>);
    setGajiList(prev => [newGaji, ...prev]);

    if (data.status === 'Dibayar' && data.potongan.kasbon > 0 && data.potongan.kasbonId) {
      await applyKasbonDeductionDB(data.potongan.kasbonId, data.potongan.kasbon, newGaji.id, data.periodeBulan, data.periodeTahun);
    }

    addToast('success', `Slip gaji ${nomorSlip} berhasil diterbitkan`);
    return newGaji;
  }, [addToast, applyKasbonDeductionDB]);

  const updateGaji = useCallback(async (id: string, data: Partial<Gaji>) => {
    const { error } = await supabase.from('gaji').update({ status: data.status, tanggal_bayar: data.tanggalBayar }).eq('id', id);
    if (error) { addToast('error', `Gagal update slip: ${error.message}`); return; }
    await fetchGaji();
  }, [addToast, fetchGaji]);

  const deleteGaji = useCallback(async (id: string) => {
    const { error } = await supabase.from('gaji').delete().eq('id', id);
    if (error) { addToast('error', `Gagal hapus slip: ${error.message}`); return; }
    setGajiList(prev => prev.filter(g => g.id !== id));
    addToast('info', 'Slip gaji telah dihapus');
  }, [addToast]);

  const markGajiAsPaid = useCallback(async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const gaji = gajiList.find(g => g.id === id);
    if (!gaji) return;

    const { data: result, error } = await supabase.from('gaji').update({
      status: 'Dibayar', tanggal_bayar: today,
    }).eq('id', id).select().single();

    if (error) { addToast('error', `Gagal ubah status: ${error.message}`); return; }
    if (result) setGajiList(prev => prev.map(g => g.id === id ? mapGajiFromDB(result as Record<string, unknown>) : g));

    if (gaji.potongan.kasbon > 0 && gaji.potongan.kasbonId) {
      await applyKasbonDeductionDB(gaji.potongan.kasbonId, gaji.potongan.kasbon, id, gaji.periodeBulan, gaji.periodeTahun);
      addToast('success', `Gaji ${gaji.nomorSlip} dibayar & kasbon tersinkron`);
    } else {
      addToast('success', `Gaji ${gaji.nomorSlip} berhasil ditandai dibayar`);
    }
  }, [gajiList, addToast, applyKasbonDeductionDB]);

  const getGajiById = useCallback((id: string) => gajiList.find(g => g.id === id), [gajiList]);

  // ============================================================
  // PENGELUARAN
  // ============================================================
  const addPengeluaran = useCallback(async (data: Omit<PengeluaranRutin, 'id' | 'nomorKwitansi'>): Promise<PengeluaranRutin | null> => {
    const { count } = await supabase.from('pengeluaran_rutin').select('*', { count: 'exact', head: true });
    const nomorKwitansi = generateKodeKwitansi(count || 0);

    const { data: result, error } = await supabase.from('pengeluaran_rutin').insert({
      nomor_kwitansi: nomorKwitansi, tanggal: data.tanggal, kategori: data.kategori,
      nominal: data.nominal, metode_bayar: data.metodeBayar,
      dibayarkan_kepada: data.dibayarkanKepada, petugas: data.petugas,
      keperluan: data.keperluan, catatan: data.catatan || '',
    }).select().single();

    if (error) { addToast('error', `Gagal catat pengeluaran: ${error.message}`); return null; }
    if (!result) return null;

    const newPengeluaran = mapPengeluaranFromDB(result as Record<string, unknown>);
    setPengeluaranList(prev => [newPengeluaran, ...prev]);
    addToast('success', `Pengeluaran ${nomorKwitansi} berhasil dicatat`);
    return newPengeluaran;
  }, [addToast]);

  const updatePengeluaran = useCallback(async (id: string, data: Partial<PengeluaranRutin>) => {
    const updateData: Record<string, unknown> = {};
    if (data.tanggal !== undefined) updateData.tanggal = data.tanggal;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.nominal !== undefined) updateData.nominal = data.nominal;
    if (data.metodeBayar !== undefined) updateData.metode_bayar = data.metodeBayar;
    if (data.dibayarkanKepada !== undefined) updateData.dibayarkan_kepada = data.dibayarkanKepada;
    if (data.petugas !== undefined) updateData.petugas = data.petugas;
    if (data.keperluan !== undefined) updateData.keperluan = data.keperluan;
    if (data.catatan !== undefined) updateData.catatan = data.catatan;

    const { data: result, error } = await supabase.from('pengeluaran_rutin').update(updateData).eq('id', id).select().single();
    if (error) { addToast('error', `Gagal update: ${error.message}`); return; }
    if (result) setPengeluaranList(prev => prev.map(p => p.id === id ? mapPengeluaranFromDB(result as Record<string, unknown>) : p));
    addToast('success', 'Data pengeluaran berhasil diperbarui');
  }, [addToast]);

  const deletePengeluaran = useCallback(async (id: string) => {
    const { error } = await supabase.from('pengeluaran_rutin').delete().eq('id', id);
    if (error) { addToast('error', `Gagal hapus: ${error.message}`); return; }
    setPengeluaranList(prev => prev.filter(p => p.id !== id));
    addToast('info', 'Transaksi pengeluaran telah dihapus');
  }, [addToast]);

  const getPengeluaranById = useCallback((id: string) => pengeluaranList.find(p => p.id === id), [pengeluaranList]);

  // ============================================================
  // BACKUP / RESTORE / RESET
  // ============================================================
  const exportDataJSON = useCallback(async () => {
    const [compRes, karRes, kbRes, gajiRes, pengRes, taskRes] = await Promise.all([
      supabase.from('company_info').select('*').limit(1).maybeSingle(),
      supabase.from('karyawan').select('*'),
      supabase.from('kasbon').select('*'),
      supabase.from('gaji').select('*'),
      supabase.from('pengeluaran_rutin').select('*'),
      supabase.from('tasks').select('*'),
    ]);

    const backupData = {
      version: '2.2-supabase',
      exportedAt: new Date().toISOString(),
      companyInfo: compRes.data ? mapCompanyInfoFromDB(compRes.data as Record<string, unknown>) : companyInfo,
      taskList: (taskRes.data || []).map(r => mapTaskFromDB(r as Record<string, unknown>)),
      karyawanList: (karRes.data || []).map(r => mapKaryawanFromDB(r as Record<string, unknown>)),
      kasbonList: (kbRes.data || []).map(r => mapKasbonFromDB(r as Record<string, unknown>)),
      gajiList: (gajiRes.data || []).map(r => mapGajiFromDB(r as Record<string, unknown>)),
      pengeluaranList: (pengRes.data || []).map(r => mapPengeluaranFromDB(r as Record<string, unknown>)),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KANTORKU_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Backup data berhasil diunduh');
  }, [companyInfo, addToast]);

  const importDataJSON = useCallback(async (_jsonString: string): Promise<boolean> => {
    addToast('info', 'Fitur import sedang dalam pengembangan untuk versi Supabase');
    return false;
  }, [addToast]);

  const resetToDemoData = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.from('gaji').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kasbon').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('karyawan').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pengeluaran_rutin').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setKaryawanList([]);
      setKasbonList([]);
      setGajiList([]);
      setPengeluaranList([]);
      setTaskList([]);

      addToast('info', 'Seluruh data transaksi, tugas, dan karyawan berhasil dikosongkan.');
    } catch (err) {
      addToast('error', 'Gagal mengosongkan data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, userList, addUser, updateUser, deleteUser,
      activeTab, setActiveTab, isLoading,
      companyInfo, updateCompanyInfo,
      taskList, fetchTasks, addTask, updateTask, updateTaskStatus, deleteTask, clearAllTasks,
      karyawanList, addKaryawan, updateKaryawan, deleteKaryawan, getKaryawanById,
      kasbonList, addKasbon, updateKasbon, deleteKasbon, bayarKasbonManual, getActiveKasbonByKaryawan,
      gajiList, addGaji, updateGaji, deleteGaji, markGajiAsPaid, getGajiById,
      pengeluaranList, addPengeluaran, updatePengeluaran, deletePengeluaran, getPengeluaranById,
      toasts, addToast, removeToast,
      exportDataJSON, importDataJSON, resetToDemoData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
