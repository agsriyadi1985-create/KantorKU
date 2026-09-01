import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Karyawan,
  Kasbon,
  Gaji,
  PengeluaranRutin,
  CompanyInfo,
  ActiveTab,
} from '../types';
import {
  initialCompanyInfo,
  initialKaryawan,
  initialKasbon,
  initialGaji,
  initialPengeluaran,
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
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
  
  // Karyawan
  karyawanList: Karyawan[];
  addKaryawan: (karyawan: Omit<Karyawan, 'id'>) => void;
  updateKaryawan: (id: string, data: Partial<Karyawan>) => void;
  deleteKaryawan: (id: string) => void;
  getKaryawanById: (id: string) => Karyawan | undefined;

  // Kasbon
  kasbonList: Kasbon[];
  addKasbon: (data: Omit<Kasbon, 'id' | 'nomorKasbon' | 'sisaPinjaman' | 'sudahDibayar' | 'status' | 'riwayatPembayaran'>) => void;
  updateKasbon: (id: string, data: Partial<Kasbon>) => void;
  deleteKasbon: (id: string) => void;
  bayarKasbonManual: (id: string, nominal: number, keterangan: string) => void;
  getActiveKasbonByKaryawan: (karyawanId: string) => Kasbon | undefined;

  // Gaji
  gajiList: Gaji[];
  addGaji: (gaji: Omit<Gaji, 'id' | 'nomorSlip' | 'tanggalCetak'>) => Gaji;
  updateGaji: (id: string, data: Partial<Gaji>) => void;
  deleteGaji: (id: string) => void;
  markGajiAsPaid: (id: string) => void;
  getGajiById: (id: string) => Gaji | undefined;

  // Pengeluaran
  pengeluaranList: PengeluaranRutin[];
  addPengeluaran: (data: Omit<PengeluaranRutin, 'id' | 'nomorKwitansi'>) => PengeluaranRutin;
  updatePengeluaran: (id: string, data: Partial<PengeluaranRutin>) => void;
  deletePengeluaran: (id: string) => void;
  getPengeluaranById: (id: string) => PengeluaranRutin | undefined;

  // Utilities
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetToDemoData: () => void;
}

const STORAGE_KEYS = {
  COMPANY: 'kantorku_company_info',
  KARYAWAN: 'kantorku_karyawan_list',
  KASBON: 'kantorku_kasbon_list',
  GAJI: 'kantorku_gaji_list',
  PENGELUARAN: 'kantorku_pengeluaran_list',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initialize from LocalStorage or seed data
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANY);
    return saved ? JSON.parse(saved) : initialCompanyInfo;
  });

  const [karyawanList, setKaryawanList] = useState<Karyawan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KARYAWAN);
    return saved ? JSON.parse(saved) : initialKaryawan;
  });

  const [kasbonList, setKasbonList] = useState<Kasbon[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KASBON);
    return saved ? JSON.parse(saved) : initialKasbon;
  });

  const [gajiList, setGajiList] = useState<Gaji[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GAJI);
    return saved ? JSON.parse(saved) : initialGaji;
  });

  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranRutin[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PENGELUARAN);
    return saved ? JSON.parse(saved) : initialPengeluaran;
  });

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KARYAWAN, JSON.stringify(karyawanList));
  }, [karyawanList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KASBON, JSON.stringify(kasbonList));
  }, [kasbonList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAJI, JSON.stringify(gajiList));
  }, [gajiList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PENGELUARAN, JSON.stringify(pengeluaranList));
  }, [pengeluaranList]);

  // Toast Helpers
  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Company Info Actions
  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    setCompanyInfo((prev) => ({ ...prev, ...info }));
    addToast('success', 'Profil kantor berhasil diperbarui');
  };

  // Karyawan Actions
  const addKaryawan = (data: Omit<Karyawan, 'id'>) => {
    const newKaryawan: Karyawan = {
      ...data,
      id: `emp-${generateId()}`,
    };
    setKaryawanList((prev) => [newKaryawan, ...prev]);
    addToast('success', `Karyawan ${data.nama} berhasil ditambahkan`);
  };

  const updateKaryawan = (id: string, data: Partial<Karyawan>) => {
    setKaryawanList((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...data } : emp))
    );
    addToast('success', 'Data karyawan berhasil diperbarui');
  };

  const deleteKaryawan = (id: string) => {
    const emp = karyawanList.find((e) => e.id === id);
    setKaryawanList((prev) => prev.filter((e) => e.id !== id));
    addToast('info', `Karyawan ${emp?.nama || ''} telah dihapus`);
  };

  const getKaryawanById = (id: string) => {
    return karyawanList.find((k) => k.id === id);
  };

  // Kasbon Actions
  const addKasbon = (
    data: Omit<
      Kasbon,
      'id' | 'nomorKasbon' | 'sisaPinjaman' | 'sudahDibayar' | 'status' | 'riwayatPembayaran'
    >
  ) => {
    const nomorKasbon = generateKodeKasbon(kasbonList.length);
    const newKasbon: Kasbon = {
      ...data,
      id: `kb-${generateId()}`,
      nomorKasbon,
      sisaPinjaman: data.jumlahPinjaman,
      sudahDibayar: 0,
      status: 'Aktif',
      riwayatPembayaran: [],
    };
    setKasbonList((prev) => [newKasbon, ...prev]);
    addToast('success', `Pengajuan kasbon ${nomorKasbon} berhasil dicatat`);
  };

  const updateKasbon = (id: string, data: Partial<Kasbon>) => {
    setKasbonList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
    addToast('success', 'Data kasbon diperbarui');
  };

  const deleteKasbon = (id: string) => {
    setKasbonList((prev) => prev.filter((item) => item.id !== id));
    addToast('info', 'Data kasbon telah dihapus');
  };

  const bayarKasbonManual = (id: string, nominal: number, keterangan: string) => {
    setKasbonList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newSudahDibayar = item.sudahDibayar + nominal;
        const newSisa = Math.max(0, item.jumlahPinjaman - newSudahDibayar);
        const newStatus = newSisa <= 0 ? 'Lunas' : 'Aktif';

        const riwayatBaru = [
          ...item.riwayatPembayaran,
          {
            id: generateId(),
            tanggal: new Date().toISOString().split('T')[0],
            periode: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            nominal,
            keterangan: keterangan || 'Pembayaran kasbon tunai/manual',
          },
        ];

        return {
          ...item,
          sudahDibayar: newSudahDibayar,
          sisaPinjaman: newSisa,
          status: newStatus,
          riwayatPembayaran: riwayatBaru,
        };
      })
    );
    addToast('success', 'Pembayaran kasbon manual berhasil dicatat');
  };

  const getActiveKasbonByKaryawan = (karyawanId: string) => {
    return kasbonList.find((k) => k.karyawanId === karyawanId && k.status === 'Aktif' && k.sisaPinjaman > 0);
  };

  // Gaji Actions
  const addGaji = (data: Omit<Gaji, 'id' | 'nomorSlip' | 'tanggalCetak'>): Gaji => {
    const nomorSlip = generateKodeSlip(data.periodeTahun, data.periodeBulan, gajiList.length);
    const today = new Date().toISOString().split('T')[0];
    const newGaji: Gaji = {
      ...data,
      id: `slip-${generateId()}`,
      nomorSlip,
      tanggalCetak: today,
    };

    setGajiList((prev) => [newGaji, ...prev]);

    // If status is Dibayar, sync with Kasbon directly
    if (data.status === 'Dibayar' && data.potongan.kasbon > 0 && data.potongan.kasbonId) {
      applyKasbonDeduction(data.potongan.kasbonId, data.potongan.kasbon, newGaji.id, data.periodeBulan, data.periodeTahun);
    }

    addToast('success', `Slip gaji ${nomorSlip} berhasil dibuat`);
    return newGaji;
  };

  const updateGaji = (id: string, data: Partial<Gaji>) => {
    setGajiList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data } : g))
    );
    addToast('success', 'Slip gaji berhasil diperbarui');
  };

  const deleteGaji = (id: string) => {
    setGajiList((prev) => prev.filter((g) => g.id !== id));
    addToast('info', 'Slip gaji telah dihapus');
  };

  const applyKasbonDeduction = (
    kasbonId: string,
    nominalPotongan: number,
    slipId: string,
    bulan: number,
    tahun: number
  ) => {
    setKasbonList((prev) =>
      prev.map((item) => {
        if (item.id !== kasbonId) return item;
        // Check if already paid for this slip to prevent duplicate deduction
        const alreadyDeducted = item.riwayatPembayaran.some((r) => r.slipGajiId === slipId);
        if (alreadyDeducted) return item;

        const newSudahDibayar = item.sudahDibayar + nominalPotongan;
        const newSisa = Math.max(0, item.jumlahPinjaman - newSudahDibayar);
        const newStatus = newSisa <= 0 ? 'Lunas' : 'Aktif';

        const bulanStr = String(bulan).padStart(2, '0');
        const riwayatBaru = [
          ...item.riwayatPembayaran,
          {
            id: generateId(),
            tanggal: new Date().toISOString().split('T')[0],
            periode: `${tahun}-${bulanStr}`,
            nominal: nominalPotongan,
            slipGajiId: slipId,
            keterangan: `Potongan Otomatis Slip Gaji Periode ${bulanStr}/${tahun}`,
          },
        ];

        return {
          ...item,
          sudahDibayar: newSudahDibayar,
          sisaPinjaman: newSisa,
          status: newStatus,
          riwayatPembayaran: riwayatBaru,
        };
      })
    );
  };

  const markGajiAsPaid = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const gaji = gajiList.find((g) => g.id === id);
    if (!gaji) return;

    setGajiList((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, status: 'Dibayar', tanggalBayar: today } : g
      )
    );

    // If there is kasbon deduction, sync now
    if (gaji.potongan.kasbon > 0 && gaji.potongan.kasbonId) {
      applyKasbonDeduction(
        gaji.potongan.kasbonId,
        gaji.potongan.kasbon,
        gaji.id,
        gaji.periodeBulan,
        gaji.periodeTahun
      );
      addToast('success', `Gaji ${gaji.nomorSlip} dibayar & kasbon otomatis tersinkron`);
    } else {
      addToast('success', `Gaji ${gaji.nomorSlip} berhasil ditandai telah dibayar`);
    }
  };

  const getGajiById = (id: string) => {
    return gajiList.find((g) => g.id === id);
  };

  // Pengeluaran Rutin Actions
  const addPengeluaran = (
    data: Omit<PengeluaranRutin, 'id' | 'nomorKwitansi'>
  ): PengeluaranRutin => {
    const nomorKwitansi = generateKodeKwitansi(pengeluaranList.length);
    const newPengeluaran: PengeluaranRutin = {
      ...data,
      id: `peng-${generateId()}`,
      nomorKwitansi,
    };
    setPengeluaranList((prev) => [newPengeluaran, ...prev]);
    addToast('success', `Pengeluaran ${nomorKwitansi} berhasil dicatat`);
    return newPengeluaran;
  };

  const updatePengeluaran = (id: string, data: Partial<PengeluaranRutin>) => {
    setPengeluaranList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    addToast('success', 'Data pengeluaran berhasil diperbarui');
  };

  const deletePengeluaran = (id: string) => {
    setPengeluaranList((prev) => prev.filter((p) => p.id !== id));
    addToast('info', 'Transaksi pengeluaran telah dihapus');
  };

  const getPengeluaranById = (id: string) => {
    return pengeluaranList.find((p) => p.id === id);
  };

  // Backup and Restore
  const exportDataJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      companyInfo,
      karyawanList,
      kasbonList,
      gajiList,
      pengeluaranList,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KANTORKU_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Backup data berhasil diunduh (JSON)');
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.companyInfo) setCompanyInfo(data.companyInfo);
      if (Array.isArray(data.karyawanList)) setKaryawanList(data.karyawanList);
      if (Array.isArray(data.kasbonList)) setKasbonList(data.kasbonList);
      if (Array.isArray(data.gajiList)) setGajiList(data.gajiList);
      if (Array.isArray(data.pengeluaranList)) setPengeluaranList(data.pengeluaranList);
      addToast('success', 'Data berhasil dipulihkan dari file backup');
      return true;
    } catch (e) {
      console.error(e);
      addToast('error', 'Gagal memproses file backup. Format tidak valid.');
      return false;
    }
  };

  const resetToDemoData = () => {
    setCompanyInfo(initialCompanyInfo);
    setKaryawanList(initialKaryawan);
    setKasbonList(initialKasbon);
    setGajiList(initialGaji);
    setPengeluaranList(initialPengeluaran);
    localStorage.clear();
    addToast('info', 'Data aplikasi berhasil direset ke data contoh (Demo)');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        companyInfo,
        updateCompanyInfo,
        karyawanList,
        addKaryawan,
        updateKaryawan,
        deleteKaryawan,
        getKaryawanById,
        kasbonList,
        addKasbon,
        updateKasbon,
        deleteKasbon,
        bayarKasbonManual,
        getActiveKasbonByKaryawan,
        gajiList,
        addGaji,
        updateGaji,
        deleteGaji,
        markGajiAsPaid,
        getGajiById,
        pengeluaranList,
        addPengeluaran,
        updatePengeluaran,
        deletePengeluaran,
        getPengeluaranById,
        toasts,
        addToast,
        removeToast,
        exportDataJSON,
        importDataJSON,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
