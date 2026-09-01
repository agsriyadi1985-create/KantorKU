import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import {
  Karyawan, StatusKaryawan,
  Kasbon, SkemaKasbon, StatusKasbon, RiwayatPembayaranKasbon,
  Gaji, StatusGaji, KomponenPendapatan, KomponenPotongan,
  PengeluaranRutin, KategoriPengeluaran, MetodeBayar,
  CompanyInfo,
  ActiveTab,
} from '../types';
import {
  initialCompanyInfo, initialKaryawan, initialKasbon, initialGaji, initialPengeluaran,
} from '../utils/initialData';
import { generateId, generateKodeSlip, generateKodeKasbon, generateKodeKwitansi } from '../utils/formatters';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isLoading: boolean;
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;
  karyawanList: Karyawan[];
  addKaryawan: (data: Omit<Karyawan, 'id'>) => Promise<void>;
  updateKaryawan: (id: string, data: Partial<Karyawan>) => Promise<void>;
  deleteKaryawan: (id: string) => Promise<void>;
  getKaryawanById: (id: string) => Karyawan | undefined;
  kasbonList: Kasbon[];
  addKasbon: (data: Omit<Kasbon, 'id' | 'nomorKasbon' | 'sisaPinjaman' | 'sudahDibayar' | 'status' | 'riwayatPembayaran'>) => Promise<void>;
  updateKasbon: (id: string, data: Partial<Kasbon>) => Promise<void>;
  deleteKasbon: (id: string) => Promise<void>;
  bayarKasbonManual: (id: string, nominal: number, keterangan: string) => Promise<void>;
  getActiveKasbonByKaryawan: (karyawanId: string) => Kasbon | undefined;
  gajiList: Gaji[];
  addGaji: (gaji: Omit<Gaji, 'id' | 'nomorSlip' | 'tanggalCetak'>) => Promise<Gaji | null>;
  updateGaji: (id: string, data: Partial<Gaji>) => Promise<void>;
  deleteGaji: (id: string) => Promise<void>;
  markGajiAsPaid: (id: string) => Promise<void>;
  getGajiById: (id: string) => Gaji | undefined;
  pengeluaranList: PengeluaranRutin[];
  addPengeluaran: (data: Omit<PengeluaranRutin, 'id' | 'nomorKwitansi'>) => Promise<PengeluaranRutin | null>;
  updatePengeluaran: (id: string, data: Partial<PengeluaranRutin>) => Promise<void>;
  deletePengeluaran: (id: string) => Promise<void>;
  getPengeluaranById: (id: string) => PengeluaranRutin | undefined;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
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

// ============================================================
// CONTEXT
// ============================================================
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
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

  // ── Individual Fetch Functions ──────────────────────────────
  const fetchCompany = useCallback(async () => {
    const { data } = await supabase.from('company_info').select('*').limit(1).maybeSingle();
    if (data) setCompanyInfo(mapCompanyInfoFromDB(data as Record<string, unknown>));
  }, []);

  const fetchKaryawan = useCallback(async () => {
    const { data, error } = await supabase.from('karyawan').select('*').order('created_at', { ascending: false });
    if (!error && data) setKaryawanList(data.map(r => mapKaryawanFromDB(r as Record<string, unknown>)));
  }, []);

  const fetchKasbon = useCallback(async () => {
    const { data, error } = await supabase.from('kasbon').select('*').order('created_at', { ascending: false });
    if (!error && data) setKasbonList(data.map(r => mapKasbonFromDB(r as Record<string, unknown>)));
  }, []);

  const fetchGaji = useCallback(async () => {
    const { data, error } = await supabase.from('gaji').select('*').order('created_at', { ascending: false });
    if (!error && data) setGajiList(data.map(r => mapGajiFromDB(r as Record<string, unknown>)));
  }, []);

  const fetchPengeluaran = useCallback(async () => {
    const { data, error } = await supabase.from('pengeluaran_rutin').select('*').order('created_at', { ascending: false });
    if (!error && data) setPengeluaranList(data.map(r => mapPengeluaranFromDB(r as Record<string, unknown>)));
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
        })
        .select()
        .single();

      if (companyData) setCompanyInfo(mapCompanyInfoFromDB(companyData as Record<string, unknown>));

      // 2. Karyawan seed
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

      // Map old ID → new UUID
      const idMap: Record<string, string> = {};
      initialKaryawan.forEach((orig, i) => { if (karyawanData[i]) idMap[orig.id] = karyawanData[i].id; });

      // 3. Kasbon seed
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

      // 4. Gaji seed
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

      // 5. Pengeluaran seed
      const pengeluaranInsert = initialPengeluaran.map(p => ({
        nomor_kwitansi: p.nomorKwitansi, tanggal: p.tanggal, kategori: p.kategori,
        nominal: p.nominal, metode_bayar: p.metodeBayar,
        dibayarkan_kepada: p.dibayarkanKepada, petugas: p.petugas,
        keperluan: p.keperluan, catatan: p.catatan || '',
      }));

      await supabase.from('pengeluaran_rutin').insert(pengeluaranInsert);

      // Refresh all
      await Promise.all([fetchKaryawan(), fetchKasbon(), fetchGaji(), fetchPengeluaran()]);

    } catch (err) {
      console.error('Seed error:', err);
    }
  }, [fetchKaryawan, fetchKasbon, fetchGaji, fetchPengeluaran]);

  // ── Initial Load + Realtime Subscriptions ─────────────────
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [{ data: karyawanData }, { data: compData }] = await Promise.all([
          supabase.from('karyawan').select('*').limit(1),
          supabase.from('company_info').select('*').limit(1),
        ]);

        // Seed jika data kosong
        if (!karyawanData || karyawanData.length === 0) {
          await seedInitialData();
        } else {
          await Promise.all([fetchCompany(), fetchKaryawan(), fetchKasbon(), fetchGaji(), fetchPengeluaran()]);
        }
      } catch (err) {
        console.error('Init error:', err);
        addToast('error', 'Koneksi ke database gagal. Cek koneksi internet Anda.');
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // ── Realtime Subscriptions ────────────────────────────────
    const channel = supabase
      .channel('kantorku-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karyawan' },
        () => { fetchKaryawan(); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kasbon' },
        () => { fetchKasbon(); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gaji' },
        () => { fetchGaji(); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pengeluaran_rutin' },
        () => { fetchPengeluaran(); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_info' },
        () => { fetchCompany(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      logo_text: info.logoText, updated_at: new Date().toISOString(),
    };
    // Remove undefined keys
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

    // Auto-sync kasbon jika status Dibayar
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
    const [compRes, karRes, kbRes, gajiRes, pengRes] = await Promise.all([
      supabase.from('company_info').select('*').limit(1).maybeSingle(),
      supabase.from('karyawan').select('*'),
      supabase.from('kasbon').select('*'),
      supabase.from('gaji').select('*'),
      supabase.from('pengeluaran_rutin').select('*'),
    ]);

    const backupData = {
      version: '2.0-supabase',
      exportedAt: new Date().toISOString(),
      companyInfo: compRes.data ? mapCompanyInfoFromDB(compRes.data as Record<string, unknown>) : companyInfo,
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
      // Delete all data (order matters due to FK constraints)
      await supabase.from('gaji').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('kasbon').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('karyawan').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('pengeluaran_rutin').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('company_info').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Re-seed
      await seedInitialData();
      addToast('info', 'Data berhasil direset ke data contoh (Demo)');
    } catch (err) {
      addToast('error', 'Gagal reset data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [seedInitialData, addToast]);

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab, isLoading,
      companyInfo, updateCompanyInfo,
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
