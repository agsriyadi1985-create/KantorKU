// Format angka ke format mata uang Rupiah
export const formatRupiah = (angka: number | undefined | null): string => {
  if (angka === undefined || angka === null || isNaN(angka)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};

export const formatAngka = (angka: number | undefined | null): string => {
  if (angka === undefined || angka === null || isNaN(angka)) return '0';
  return new Intl.NumberFormat('id-ID').format(angka);
};

// Daftar nama bulan dalam Bahasa Indonesia
export const DAFTAR_BULAN = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

export const getNamaBulan = (bulan: number): string => {
  const item = DAFTAR_BULAN.find((b) => b.value === bulan);
  return item ? item.label : '';
};

// Format tanggal standar Indonesia
export const formatTanggal = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const formatTanggalSingkat = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

// Generator Terbilang Bahasa Indonesia
export const angkaKeTerbilang = (nominal: number): string => {
  if (nominal === 0) return 'Nol Rupiah';
  if (isNaN(nominal)) return '-';

  const angka = Math.floor(Math.abs(nominal));
  const huruf = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function konversi(n: number): string {
    if (n < 12) {
      return huruf[n];
    } else if (n < 20) {
      return konversi(n - 10) + ' Belas';
    } else if (n < 100) {
      const sisa = n % 10;
      return konversi(Math.floor(n / 10)) + ' Puluh' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    } else if (n < 200) {
      const sisa = n - 100;
      return 'Seratus' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    } else if (n < 1000) {
      const sisa = n % 100;
      return konversi(Math.floor(n / 100)) + ' Ratus' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    } else if (n < 2000) {
      const sisa = n - 1000;
      return 'Seribu' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    } else if (n < 1000000) {
      const sisa = n % 1000;
      return konversi(Math.floor(n / 1000)) + ' Ribu' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    } else if (n < 1000000000) {
      const sisa = n % 1000000;
      return konversi(Math.floor(n / 1000000)) + ' Juta' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    } else if (n < 1000000000000) {
      const sisa = n % 1000000000;
      return konversi(Math.floor(n / 1000000000)) + ' Miliar' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    } else {
      const sisa = n % 1000000000000;
      return konversi(Math.floor(n / 1000000000000)) + ' Triliun' + (sisa > 0 ? ' ' + konversi(sisa) : '');
    }
  }

  const hasil = konversi(angka).replace(/\s+/g, ' ').trim();
  return `${hasil} Rupiah`;
};

// Generate ID unik
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
};

// Generate kode dokumen
export const generateKodeSlip = (tahun: number, bulan: number, count: number): string => {
  const bulanStr = String(bulan).padStart(2, '0');
  const countStr = String(count + 1).padStart(3, '0');
  return `SLIP-${tahun}${bulanStr}-${countStr}`;
};

export const generateKodeKasbon = (count: number): string => {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, '0');
  const countStr = String(count + 1).padStart(3, '0');
  return `KB-${tahun}${bulan}-${countStr}`;
};

export const generateKodeKwitansi = (count: number): string => {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulan = String(now.getMonth() + 1).padStart(2, '0');
  const countStr = String(count + 1).padStart(3, '0');
  return `KW-${tahun}${bulan}-${countStr}`;
};

export const generateKodeTransaksiHarian = (tahun: number, bulan: number, count: number): string => {
  const bulanStr = String(bulan).padStart(2, '0');
  const countStr = String(count + 1).padStart(3, '0');
  return `TRX-${tahun}${bulanStr}-${countStr}`;
};

// Normalisasi NIK (menghapus tanda strip, spasi, dan mengubah ke huruf kapital)
// Contoh: 'KTK2026001' <-> 'KTK-2026-001'
export const normalizeNIK = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.replace(/[^A-Z0-9]/gi, '').toUpperCase();
};

// Format tanggal dan jam lengkap standar Indonesia
export const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const datePart = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
    const timePart = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
    return `${datePart}, ${timePart} WIB`;
  } catch {
    return dateStr;
  }
};

