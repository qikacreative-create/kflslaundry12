export type LaundryTier = 'newcomer' | 'premium' | 'pro';

export interface LaundrySubscriptionLimits {
  tier: LaundryTier;
  label: string;
  tagline: string;
  badgeText: string;
  priceMonthly: number;
  maxBranches: number;
  pricePerExtraBranch?: number;
  maxCashiers: number;
  maxAdminPerOutlet: number;
  maxOwnerPerOutlet: number;
  maxCustomers: number;
  maxMonthlyTransactions: number;
  maxServices: number;
  canAssignStaff: boolean;
  canExportExcel: boolean;
  canExportOfficialPdf: boolean;
  canViewComparisonGrowth: boolean;
  canUseCustomLogoOnReceipt: boolean;
  canUseSignatureOnReceipt: boolean;
  highlights: string[];
}

export const EXTRA_BRANCH_PRICE = 25000;
export const HARGA_PREMIUM_BULANAN = 27000;
export const HARGA_Premium_BULANAN = 27000;
export const HARGA_PRO_BULANAN = 49000;
export const UNLIMITED_QUOTA = Number.MAX_SAFE_INTEGER;
export const NEWCOMER_TRIAL_DAYS = 7;
export const NEWCOMER_TRIAL_DURATION_MS = NEWCOMER_TRIAL_DAYS * 24 * 60 * 60 * 1000;

const PREMIUM_LIMITS: LaundrySubscriptionLimits = {
  tier: 'premium',
  label: 'Paket Premium',
  tagline: 'Akses penuh tanpa batas kuota transaksi bulanan, kasir lintas HP & penugasan staf',
  badgeText: 'Paket Premium',
  priceMonthly: 27000,
  maxBranches: 1,
  pricePerExtraBranch: 25000,
  maxCashiers: 1,
  maxAdminPerOutlet: 1,
  maxOwnerPerOutlet: 1,
  maxCustomers: UNLIMITED_QUOTA,
  maxMonthlyTransactions: UNLIMITED_QUOTA,
  maxServices: UNLIMITED_QUOTA,
  canAssignStaff: true,
  canExportExcel: false,
  canExportOfficialPdf: false,
  canViewComparisonGrowth: true,
  canUseCustomLogoOnReceipt: true,
  canUseSignatureOnReceipt: true,
  highlights: [
    'Tanpa Batas Kuota Nota Transaksi Bulanan (Unlimited)',
    'Tanpa Batas Data Pelanggan & Jenis Layanan Cucian',
    '1 Cabang Outlet Utama (Bisa Tambah Cabang Rp 25.000/cabang)',
    '1 Akun Login Kasir (Sinkron Beda HP) & 1 Owner per Outlet',
    'Penugasan Staf Pengerjaan Cucian (Cuci, Setrika, Packing)',
    'Grafik Analisis Komparasi Pertumbuhan Omzet & Laba (MoM & YoY)',
    'Kustomisasi Logo & Tanda Tangan di Struk Thermal',
    'Tingkatkan ke Paket Pro untuk Ekspor Excel, Cetak PDF & 2 Cabang',
  ],
};

const PRO_LIMITS: LaundrySubscriptionLimits = {
  tier: 'pro',
  label: 'Paket Pro',
  tagline: 'Paket terlengkap untuk 2 cabang outlet langsung, 2 kasir & ekspor laporan PDF/Excel',
  badgeText: 'Paket Pro',
  priceMonthly: 49000,
  maxBranches: 2,
  pricePerExtraBranch: 25000,
  maxCashiers: 2,
  maxAdminPerOutlet: 1,
  maxOwnerPerOutlet: 1,
  maxCustomers: UNLIMITED_QUOTA,
  maxMonthlyTransactions: UNLIMITED_QUOTA,
  maxServices: UNLIMITED_QUOTA,
  canAssignStaff: true,
  canExportExcel: true,
  canExportOfficialPdf: true,
  canViewComparisonGrowth: true,
  canUseCustomLogoOnReceipt: true,
  canUseSignatureOnReceipt: true,
  highlights: [
    'Semua Fitur Paket Premium Termasuk Lengkap',
    '2 Cabang Outlet Langsung Aktif (Termasuk dalam Paket)',
    '2 Akun Login Kasir Sinkron Beda HP (1 Kasir per Cabang)',
    'Ekspor Pembukuan Lengkap ke Excel Spreadsheet (.xlsx)',
    'Cetak Dokumen Laporan Keuangan Resmi A4 Siap Audit (.pdf)',
    'Tanpa Batas Kuota Nota Transaksi, Pelanggan, & Layanan',
    'Penugasan Staf Pengerjaan di Semua Cabang',
    'Grafik Analisis Komparasi Pertumbuhan Antar Cabang',
    'Kustomisasi Logo & Tanda Tangan Struk Thermal',
  ],
};

export const LAUNDRY_TIER_CONFIG: Record<LaundryTier | 'Premium' | 'Pro' | 'pro', LaundrySubscriptionLimits> = {
  newcomer: {
    tier: 'newcomer',
    label: 'Trial 7 Hari',
    tagline: 'Masa percobaan 7 hari dengan seluruh fitur Paket Premium',
    badgeText: 'Trial 7 Hari',
    priceMonthly: 0,
    maxBranches: 1,
    pricePerExtraBranch: 25000,
    maxCashiers: 1,
    maxAdminPerOutlet: 1,
    maxOwnerPerOutlet: 1,
    maxCustomers: UNLIMITED_QUOTA,
    maxMonthlyTransactions: UNLIMITED_QUOTA,
    maxServices: UNLIMITED_QUOTA,
    canAssignStaff: true,
    canExportExcel: false,
    canExportOfficialPdf: false,
    canViewComparisonGrowth: true,
    canUseCustomLogoOnReceipt: true,
    canUseSignatureOnReceipt: true,
    highlights: [
      'Masa Percobaan Penuh 7 Hari Sejak Pendaftaran',
      'Seluruh Fitur Paket Premium Terbuka Selama Masa Trial',
      'Tanpa Batas Kuota Nota Transaksi, Pelanggan & Jenis Layanan',
      '1 Akun Login Kasir (Sinkron Beda HP) & Penugasan Staf',
      'Grafik Analisis Pertumbuhan Omzet & Kustomisasi Struk',
      'Lanjutkan dengan Paket Premium (Rp 27.000 / 30 Hari) setelah Trial berakhir',
    ],
  },
  premium: PREMIUM_LIMITS,
  Premium: PREMIUM_LIMITS,
  pro: PRO_LIMITS,
  Pro: PRO_LIMITS,
};

export function normalizeTier(rawTier?: string | null): LaundryTier {
  if (!rawTier) return 'newcomer';
  const clean = rawTier.toLowerCase().trim();
  if (clean === 'pro' || clean === 'paket pro') {
    return 'pro';
  }
  if (
    clean === 'newcomer' ||
    clean === 'pemula' ||
    clean === 'gratis' ||
    clean === 'free' ||
    clean === 'trial' ||
    clean === 'starter'
  ) {
    return 'newcomer';
  }
  return 'premium';
}

export function resolveEffectiveSubscriptionEndDate(params?: {
  subscriptionType?: string | null;
  subscriptionEndDate?: number | null;
  createdAt?: number | null;
  fallbackAuthCreationTime?: number | null;
} | null): number | null {
  if (!params) return null;
  if (
    typeof params.subscriptionEndDate === 'number' &&
    Number.isFinite(params.subscriptionEndDate) &&
    params.subscriptionEndDate > 0
  ) {
    return params.subscriptionEndDate;
  }

  if (normalizeTier(params.subscriptionType) === 'newcomer') {
    const baseCreatedAt =
      typeof params.createdAt === 'number' && Number.isFinite(params.createdAt) && params.createdAt > 0
        ? params.createdAt
        : typeof params.fallbackAuthCreationTime === 'number' &&
          Number.isFinite(params.fallbackAuthCreationTime) &&
          params.fallbackAuthCreationTime > 0
        ? params.fallbackAuthCreationTime
        : null;

    if (baseCreatedAt !== null) {
      return baseCreatedAt + NEWCOMER_TRIAL_DURATION_MS;
    }
  }

  return null;
}

export function getRemainingSubscriptionDays(
  user?: {
    subscriptionType?: string | null;
    subscriptionEndDate?: number | null;
    createdAt?: number | null;
  } | null,
  now: number = Date.now()
): number {
  const effectiveEnd = resolveEffectiveSubscriptionEndDate(user);
  if (effectiveEnd === null) return 0;
  const diffMs = effectiveEnd - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isSubscriptionExpiredForUser(
  user?: {
    subscriptionType?: string | null;
    subscriptionEndDate?: number | null;
    createdAt?: number | null;
  } | null,
  now: number = Date.now()
): boolean {
  if (!user) return false;
  const effectiveEnd = resolveEffectiveSubscriptionEndDate(user);
  if (effectiveEnd !== null) {
    return effectiveEnd <= now;
  }
  return normalizeTier(user.subscriptionType) === 'newcomer';
}

export function canDowngradeToNewcomer(): boolean {
  return false;
}

/**
 * Menghitung tanggal berakhirnya langganan baru:
 * - Jika paket tetap sama (Premium -> Premium atau Pro -> Pro), tambahkan durasi ke sisa hari yang ada.
 * - Jika berpindah paket (mis. Premium -> Pro, Pro -> Premium, atau Newcomer -> berbayar),
 *   hanguskan sisa hari paket sebelumnya dan mulai masa aktif baru dari waktu sekarang.
 */
export function calculateNextSubscriptionEndDate(params: {
  currentTier?: string | null;
  currentEndDate?: number | null;
  targetTier: 'premium' | 'pro';
  durationDays: number;
  now?: number;
}): number {
  const now = params.now ?? Date.now();
  const currentNormalized = normalizeTier(params.currentTier);
  const isSameTier = currentNormalized === params.targetTier;
  const currentEnd = typeof params.currentEndDate === 'number' ? params.currentEndDate : 0;
  const baseEnd = isSameTier ? Math.max(now, currentEnd) : now;
  return baseEnd + params.durationDays * 24 * 60 * 60 * 1000;
}

export function getLaundryLimits(rawTier?: string | null): LaundrySubscriptionLimits {
  const tier = normalizeTier(rawTier);
  return LAUNDRY_TIER_CONFIG[tier] || LAUNDRY_TIER_CONFIG.premium;
}

export function isProTier(rawTier?: string | null): boolean {
  return normalizeTier(rawTier) === 'pro';
}

export function isNewcomerTier(rawTier?: string | null): boolean {
  return normalizeTier(rawTier) === 'newcomer';
}

export function canAddBranch(
  currentBranchCount: number,
  rawTier?: string | null
): { allowed: boolean; requiresPayment?: boolean; cost?: number; reason?: string } {
  const limits = getLaundryLimits(rawTier);
  const requiresPayment = currentBranchCount >= limits.maxBranches;
  return {
    allowed: true,
    requiresPayment,
    cost: EXTRA_BRANCH_PRICE,
    reason: requiresPayment
      ? `Cabang ke-${currentBranchCount + 1} diaktifkan dengan biaya tambahan Rp ${EXTRA_BRANCH_PRICE.toLocaleString('id-ID')} per cabang.`
      : undefined,
  };
}

export function canAddCashierToBranch(
  branchId: string,
  staffList: { laundryId?: string | null; role: string }[],
  rawTier?: string | null
): { allowed: boolean; reason?: string } {
  const limits = getLaundryLimits(rawTier);

  if (limits.maxCashiers <= 0) {
    return {
      allowed: false,
      reason: 'Pembuatan akun kasir memerlukan Paket Premium yang aktif.',
    };
  }

  const branchCashiers = staffList.filter(
    (s) => s.laundryId === branchId && (s.role === 'admin' || s.role === 'karyawan')
  );
  if (branchCashiers.length >= limits.maxAdminPerOutlet) {
    return {
      allowed: false,
      reason: 'Cabang outlet ini sudah memiliki 1 admin kasir aktif.',
    };
  }

  const totalCashiers = staffList.filter(
    (s) => s.role === 'admin' || s.role === 'karyawan'
  );
  if (totalCashiers.length >= limits.maxCashiers) {
    return {
      allowed: false,
      reason: `Batas kuota akun kasir untuk ${limits.label} (${limits.maxCashiers} akun kasir) telah tercapai.${limits.tier !== 'pro' ? ' Tingkatkan ke Paket Pro untuk kuota 2 akun kasir.' : ''}`,
    };
  }

  return { allowed: true };
}

export function canAddCustomer(currentCustomerCount: number, rawTier?: string | null): { allowed: boolean; reason?: string } {
  const limits = getLaundryLimits(rawTier);
  if (currentCustomerCount >= limits.maxCustomers) {
    return {
      allowed: false,
      reason: `Batas maksimal ${limits.maxCustomers} data pelanggan untuk ${limits.label} telah tercapai.`,
    };
  }
  return { allowed: true };
}

export function canAddService(currentServiceCount: number, rawTier?: string | null): { allowed: boolean; reason?: string } {
  const limits = getLaundryLimits(rawTier);
  if (currentServiceCount >= limits.maxServices) {
    return {
      allowed: false,
      reason: `Batas maksimal ${limits.maxServices} jenis layanan untuk ${limits.label} telah tercapai.`,
    };
  }
  return { allowed: true };
}

export function canAddMonthlyTransaction(monthlyTransactionCount: number, rawTier?: string | null): { allowed: boolean; reason?: string } {
  const limits = getLaundryLimits(rawTier);
  if (monthlyTransactionCount >= limits.maxMonthlyTransactions) {
    return {
      allowed: false,
      reason: `Batas kuota ${limits.maxMonthlyTransactions} nota transaksi per bulan untuk ${limits.label} telah tercapai.`,
    };
  }
  return { allowed: true };
}

export type SubscriptionLimits = {
  maxSchedulesPerMonth: number;
  maxAdmins: number;
  maxCrew: number;
  canAccessWebsiteSettings: boolean;
  canAccessBookingLink: boolean;
  canManageTeam: boolean;
  canChangeTheme: boolean;
  maxWebsites: number;
  maxDailyActions: number;
  maxDailyVisits: number;
};

export const SUBSCRIPTION_CONFIG: Record<string, SubscriptionLimits> = {
  standar: {
    maxSchedulesPerMonth: 100,
    maxAdmins: 1,
    maxCrew: 0,
    canAccessWebsiteSettings: false,
    canAccessBookingLink: false,
    canManageTeam: false,
    canChangeTheme: false,
    maxWebsites: 0,
    maxDailyActions: 0,
    maxDailyVisits: 10,
  },
  Premium: {
    maxSchedulesPerMonth: UNLIMITED_QUOTA,
    maxAdmins: 3,
    maxCrew: 0,
    canAccessWebsiteSettings: true,
    canAccessBookingLink: true,
    canManageTeam: true,
    canChangeTheme: true,
    maxWebsites: 1,
    maxDailyActions: 5,
    maxDailyVisits: 50,
  },
  Pro: {
    maxSchedulesPerMonth: UNLIMITED_QUOTA,
    maxAdmins: 5,
    maxCrew: 0,
    canAccessWebsiteSettings: true,
    canAccessBookingLink: true,
    canManageTeam: true,
    canChangeTheme: true,
    maxWebsites: 2,
    maxDailyActions: 10,
    maxDailyVisits: 100,
  },
};

export const getLimits = (tier: string): SubscriptionLimits => {
  const normalizedTier = tier.toLowerCase();
  return SUBSCRIPTION_CONFIG[normalizedTier] || SUBSCRIPTION_CONFIG.standar;
};
