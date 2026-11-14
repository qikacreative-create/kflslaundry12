import {
  User,
  Laundry,
  Layanan,
  Transaksi,
  Pelanggan,
  Pengeluaran,
  JenisPengeluaran,
  JenisPemasukan,
  SettingsData,
  SubscriptionHistory,
} from '../types';

const STORAGE_KEY_PREFIX = 'laundry_suci_';

// Initial default settings matching SettingsManager.kt
export const defaultSettings: SettingsData = {
  appTitle: "Kafela's Laundry",
  printerName: 'RPP02N',
  headerStruk: "Kafela's Laundry",
  address: '',
  phoneNumber: '',
  footerStruk: 'Barang yang tidak diambil lebih dari 3 bulan akan disedekahkan.',
  chattyFooter: 'Terima kasih atas kepercayaan Anda!',
  useLogo: false,
  logoPath: null,
  logoSize: 'sedang',
  estimasiDisplayMode: 0, // 0 = per item, 1 = single line
  pengambilanTanpaSelesai: true,
  tampilkanTombolCetak: true,
  tampilkanRincianBayar: true,
  selesaikanSaatDitugaskan: true,
  poinSystemEnabled: false,
  rupiahPerPoin: 10,
  nilaiTukarPoin: 1,
  pemasukanManualEnabled: true,
  waNotificationEnabled: true,
  tampilkanTombolAmbilNotaLama: true,
  hitungKerjaStaf: true,
};

// Default Services (28 layanan standar lengkap untuk pendaftaran akun baru & cabang baru)
export const defaultLayananList: Layanan[] = [
  { id: 'lay-1', laundryId: 'lnd-1', nama: 'Cuci Setrika', harga: 7500, satuanHarga: 'Kg', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 0 },
  { id: 'lay-2', laundryId: 'lnd-1', nama: 'Cuci Setrika Express 24 Jam', harga: 10000, satuanHarga: 'Kg', durasi: '24 Jam', satuanDurasi: 'Jam', hitungBebanKerja: true, urutan: 1 },
  { id: 'lay-3', laundryId: 'lnd-1', nama: 'Cuci Setrika Express 8 jam', harga: 20000, satuanHarga: 'Kg', durasi: '8 Jam', satuanDurasi: 'Jam', hitungBebanKerja: true, urutan: 2 },
  { id: 'lay-4', laundryId: 'lnd-1', nama: 'Setrika', harga: 6000, satuanHarga: 'Kg', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 3 },
  { id: 'lay-5', laundryId: 'lnd-1', nama: 'Setrika Express 24 jam', harga: 8000, satuanHarga: 'Kg', durasi: '24 jam', satuanDurasi: 'Jam', hitungBebanKerja: true, urutan: 4 },
  { id: 'lay-6', laundryId: 'lnd-1', nama: 'Setrika Express 8 jam', harga: 11000, satuanHarga: 'Kg', durasi: '8 Jam', satuanDurasi: 'Jam', hitungBebanKerja: true, urutan: 5 },
  { id: 'lay-7', laundryId: 'lnd-1', nama: 'Cuci Lipat', harga: 6000, satuanHarga: 'Kg', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 6 },
  { id: 'lay-8', laundryId: 'lnd-1', nama: 'Bed Cover Jumbo', harga: 15000, satuanHarga: 'Kg', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 7 },
  { id: 'lay-9', laundryId: 'lnd-1', nama: 'Bed Cover Sedang', harga: 13000, satuanHarga: 'Kg', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 8 },
  { id: 'lay-10', laundryId: 'lnd-1', nama: 'Selimut Tebal', harga: 13000, satuanHarga: 'Kg', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 9 },
  { id: 'lay-11', laundryId: 'lnd-1', nama: 'Selimut Sedang', harga: 11000, satuanHarga: 'Kg', durasi: '5 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 10 },
  { id: 'lay-12', laundryId: 'lnd-1', nama: 'Selimut Tipis', harga: 10000, satuanHarga: 'Kg', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 11 },
  { id: 'lay-13', laundryId: 'lnd-1', nama: 'Karpet Jumbo', harga: 17000, satuanHarga: 'Kg', durasi: '14 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 12 },
  { id: 'lay-14', laundryId: 'lnd-1', nama: 'Karpet Tebal', harga: 15000, satuanHarga: 'Kg', durasi: '14 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 13 },
  { id: 'lay-15', laundryId: 'lnd-1', nama: 'Karpet Tipis', harga: 13000, satuanHarga: 'Kg', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 14 },
  { id: 'lay-16', laundryId: 'lnd-1', nama: 'Karpet Busa', harga: 16000, satuanHarga: 'Kg', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 15 },
  { id: 'lay-17', laundryId: 'lnd-1', nama: 'Karpet Masjid', harga: 17000, satuanHarga: 'Kg', durasi: '14 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 16 },
  { id: 'lay-18', laundryId: 'lnd-1', nama: 'Hordeng Tebal', harga: 16000, satuanHarga: 'Kg', durasi: '14 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 17 },
  { id: 'lay-19', laundryId: 'lnd-1', nama: 'Hordeng Tipis', harga: 13000, satuanHarga: 'Kg', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 18 },
  { id: 'lay-20', laundryId: 'lnd-1', nama: 'Jas', harga: 17000, satuanHarga: 'pcs', durasi: '4 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 19 },
  { id: 'lay-21', laundryId: 'lnd-1', nama: 'Gaun', harga: 25000, satuanHarga: 'pcs', durasi: '4 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 20 },
  { id: 'lay-22', laundryId: 'lnd-1', nama: 'Kebaya', harga: 20000, satuanHarga: 'pcs', durasi: '4 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 21 },
  { id: 'lay-23', laundryId: 'lnd-1', nama: 'Boneka Jumbo', harga: 45000, satuanHarga: 'pcs', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 22 },
  { id: 'lay-24', laundryId: 'lnd-1', nama: 'Boneka Besar', harga: 35000, satuanHarga: 'pcs', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 23 },
  { id: 'lay-25', laundryId: 'lnd-1', nama: 'Boneka Sedang', harga: 25000, satuanHarga: 'pcs', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 24 },
  { id: 'lay-26', laundryId: 'lnd-1', nama: 'Boneka Kecil', harga: 10000, satuanHarga: 'pcs', durasi: '7 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 25 },
  { id: 'lay-27', laundryId: 'lnd-1', nama: 'Tas', harga: 20000, satuanHarga: 'pcs', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 26 },
  { id: 'lay-28', laundryId: 'lnd-1', nama: 'Sepatu', harga: 15000, satuanHarga: 'pcs', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true, urutan: 27 },
];

export function dedupeLayananForBranch(
  list: readonly Layanan[],
  targetLaundryId?: string
): Layanan[] {
  const byId = new Map<string, Layanan>();
  const seenNames = new Set<string>();

  for (const item of list) {
    if (!item || !item.id || !item.nama) continue;
    if (targetLaundryId) {
      if (item.laundryId !== targetLaundryId) continue;
      if (targetLaundryId !== 'lnd-1' && item.laundryId === 'lnd-1') continue;
    }
    if (byId.has(item.id)) continue;
    const normName = item.nama.trim().toLowerCase();
    if (seenNames.has(normName)) continue;
    seenNames.add(normName);
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort(
    (a, b) => (a.urutan ?? 999) - (b.urutan ?? 999)
  );
}

export function buildSeededLayananForBranch(
  laundryId: string,
  templates: readonly Layanan[] = defaultLayananList
): Layanan[] {
  const source = templates.length > 0 ? templates : defaultLayananList;
  const deduped = dedupeLayananForBranch(source);
  return deduped.map((lay, idx) => ({
    ...lay,
    id: `lay-${idx + 1}`,
    laundryId,
    urutan: typeof lay.urutan === 'number' ? lay.urutan : idx,
  }));
}

// Master Jenis Pengeluaran
export const defaultJenisPengeluaran: JenisPengeluaran[] = [
  { id: 'jp-1', nama: 'Deterjen & Parfum', harga: 85000, laundryId: 'lnd-1' },
  { id: 'jp-2', nama: 'Plastik', harga: 35000, laundryId: 'lnd-1' },
  { id: 'jp-3', nama: 'Gas', harga: 22000, laundryId: 'lnd-1' },
  { id: 'jp-4', nama: 'Listrik', harga: 100000, laundryId: 'lnd-1' },
];

// Master Jenis Pemasukan Manual
export const defaultJenisPemasukan: JenisPemasukan[] = [
  { id: 'jpm-3', nama: 'Tip Pelanggan', harga: 10000, laundryId: 'lnd-1' },
  { id: 'jpm-4', nama: 'Pelunasan Bon Kasbon', harga: 50000, laundryId: 'lnd-1' },
];

export const defaultOwnerUser: User = {
  uid: 'own-1',
  emailOrPhone: 'owner@laundry.com',
  displayName: "Kafela's Laundry",
  nomorTelepon: '081234567890',
  role: 'owner',
  laundryId: 'lnd-1',
  laundries: {
    'lnd-1': "Kafela's Laundry",
  },
  walletBalance: 0,
  subscriptionEndDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  subscriptionType: 'premium',
  createdAt: Date.now(),
};

export const defaultLaundries: Laundry[] = [
  {
    id: 'lnd-1',
    ownerId: 'own-1',
    namaLaundry: "-",
    alamat: '-',
    nomorTelepon: '-',
  },
];

// Default Customers (Empty as requested)
export const defaultPelangganList: Pelanggan[] = [];

// Helper to seed initial sample transactions (Empty as requested)
export function getInitialTransactions(): Transaksi[] {
  return [];
}

// Initial Sample Pengeluaran (Empty as requested)
export function getInitialPengeluaran(): Pengeluaran[] {
  return [];
}

export function getInitialSubscriptionHistory(): SubscriptionHistory[] {
  return [];
}

// LocalStorage Helper wrapper
export class StorageService {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (!data) return defaultValue;
      const parsed = JSON.parse(data);

      if (key === 'laundries' && Array.isArray(parsed)) {
        return parsed.map((l: any) => {
          let name = l?.namaLaundry;
          while (typeof name === 'object' && name !== null) {
            name = name.namaLaundry || name.name || "Kafela's Laundry";
          }
          return {
            ...l,
            namaLaundry: typeof name === 'string' && name.trim() ? name : "Kafela's Laundry",
            alamat: typeof l?.alamat === 'string' ? l.alamat : '',
            nomorTelepon: typeof l?.nomorTelepon === 'string' ? l.nomorTelepon : '',
          };
        }) as T;
      }

      if (key === 'active_user' && parsed && typeof parsed === 'object') {
        let name = (parsed as any).displayName;
        while (typeof name === 'object' && name !== null) {
          name = name.namaLaundry || name.displayName || name.name || 'Owner';
        }
        return {
          ...parsed,
          displayName: typeof name === 'string' && name.trim() ? name : 'Owner',
        } as T;
      }

      if (key === 'settings' && parsed && typeof parsed === 'object') {
        let header = (parsed as any).headerStruk;
        while (typeof header === 'object' && header !== null) {
          header = header.namaLaundry || header.headerStruk || "Kafela's Laundry";
        }
        const hasCustomized = Boolean(localStorage.getItem(STORAGE_KEY_PREFIX + 'has_customized_settings'));
        const rawLogoPath = typeof (parsed as any).logoPath === 'string' ? (parsed as any).logoPath.trim() : null;
        const cleanLogoPath =
          !hasCustomized && rawLogoPath === '/logo-kafela.png' ? null : (rawLogoPath || null);
        return {
          ...parsed,
          headerStruk: typeof header === 'string' && header.trim() ? header : "Kafela's Laundry",
          logoPath: cleanLogoPath,
          useLogo: Boolean((parsed as any).useLogo && cleanLogoPath),
        } as T;
      }

      return parsed as T;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set error (mungkin kuota localStorage penuh):', e);
      if (key === 'transaksi' && Array.isArray(value)) {
        try {
          const trimmed = (value as any[]).slice(0, 60);
          localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(trimmed));
        } catch {
          // Abaikan jika masih penuh
        }
      }
    }
  }

  static clearAllDummyData() {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'transaksi');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'pelanggan');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'pengeluaran');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'staff');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'manual_cash_logs');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'transaksi', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'pelanggan', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'pengeluaran', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'laundries', JSON.stringify(defaultLaundries));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(defaultSettings));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized_v3', 'true');
    } catch (e) {
      console.error('Clear dummy error:', e);
    }
  }

  static initData() {
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'initialized_v3')) {
      StorageService.set('settings', defaultSettings);
      StorageService.set('layanan', defaultLayananList);
      StorageService.set('jenis_pengeluaran', defaultJenisPengeluaran);
      StorageService.set('jenis_pemasukan', defaultJenisPemasukan);
      StorageService.set('pelanggan', []);
      StorageService.set('staff', []);
      StorageService.set('owner', defaultOwnerUser);
      StorageService.set('laundries', defaultLaundries);
      StorageService.set('current_laundry_id', 'lnd-1');
      StorageService.set('transaksi', []);
      StorageService.set('pengeluaran', []);
      StorageService.set('manual_cash_logs', []);
      StorageService.set('subscription_history', []);
      StorageService.set('initialized_v3', true);
    }
  }
}
