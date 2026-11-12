# Paket Pro Laundry (Rp 49.000/Bulan)

Penambahan tingkat langganan baru **Paket Pro** di atas Paket Premium dengan harga Rp 49.000/bulan, dilengkapi alokasi langsung 2 cabang outlet tanpa biaya tambahan, kuota 2 akun kasir aktif, serta fitur ekspor laporan resmi Excel (.xlsx) dan PDF (.pdf) eksklusif untuk Paket Pro.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi yang telah diberikan pada sesi tanya-jawab sebelumnya, berikut keputusan spesifikasi Paket Pro yang disepakati:

- **Confirmed Decision 1 (Alokasi Cabang)**: Paket Pro seharga Rp 49.000 sudah termasuk 2 cabang outlet langsung aktif tanpa perlu membayar biaya cabang tambahan Rp 25.000 (cabang ke-3 dst tetap mengikuti ketentuan penambahan cabang).
- **Confirmed Decision 2 (Eksklusivitas Ekspor Dokumen)**: Fitur ekspor Excel Spreadsheet (.xlsx) dan Cetak Laporan Keuangan Resmi PDF A4 dipindahkan menjadi fitur eksklusif khusus Paket Pro. Pengguna Paket Premium atau Newcomer yang mencoba menekan tombol ekspor akan diarahkan untuk upgrade ke Paket Pro.
- **Confirmed Decision 3 (Akun Kasir)**: Paket Pro mendapatkan kuota 2 akun login kasir sinkron (sesuai untuk operasional 2 cabang outlet).

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**: Tingkat langganan ketiga (`pro`) melengkapi `newcomer` (Gratis) dan `premium` (Rp 27.000). Paket Pro ditujukan untuk pengusaha laundry yang memiliki 2 cabang atau membutuhkan rekap pembukuan ekspor formal.
- **Target Persona**: Pemilik laundry berkembang dengan multi-outlet (2 cabang) dan kebutuhan akuntansi/pajak yang membutuhkan file spreadsheet Excel dan dokumen cetak audit PDF.
- **Nilai Utama**: Lebih hemat dibanding membeli Premium (Rp 27.000) + Extra Cabang (Rp 25.000) = Rp 52.000, serta mendapatkan bonus 2 akun kasir sekaligus akses ekspor dokumen laporan.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Eksplorasi & Upgrade Paket (`UpgradePlanModal`)**:
   - Pemilik laundry membuka modal Upgrade Paket dari Header/Sidebar/Pengaturan.
   - Ditampilkan 3 kartu pilihan paket berurutan: **Newcomer** (Gratis), **Premium** (Rp 27.000/bln), dan **Pro** (Rp 49.000/bln) dengan aksen warna marun keemasan dan badge penanda "Paling Lengkap / Rekomendasi 2 Cabang".
   - Pengguna dapat memilih durasi langganan Paket Pro (30, 60, 90, 180, 360 hari) dengan kalkulasi otomatis via Dompet Saldo atau Gateway Pembayaran Midtrans (QRIS/Transfer).
2. **Pengelolaan Cabang Outlet (`KelolaOwnerView` / `SwitchBranchModal`)**:
   - Pengguna Paket Pro dapat langsung membuat dan mengaktifkan cabang ke-2 tanpa potongan saldo dompet tambahan Rp 25.000.
   - Peringatan kuota cabang hanya muncul jika pengguna Pro ingin menambah cabang ke-3.
3. **Pengelolaan Akun Kasir (`KelolaKasirView`)**:
   - Pengguna Paket Pro dapat mendaftarkan hingga 2 akun kasir untuk bertugas di cabang 1 dan cabang 2.
4. **Proteksi & Gateway Ekspor Laporan (`LaporanView`)**:
   - Tombol **Ekspor Excel** dan **Cetak PDF Resmi** memiliki penanda status: aktif untuk Pro, dan terkunci dengan dialog edukatif penawaran upgrade ke Pro jika pengguna berada di tier Newcomer atau Premium.

### Visual Styling & Theme

- **Aesthetic Direction**: Antarmuka kasir & billing profesional, mengusung palet primer Kafelas `#800000` (deep maroon), aksen amber/emas `#D97706` khusus untuk tier Pro, dan slate netral `#0F172A` untuk keterbacaan data.
- **Tipografi**: Angka finansial dan kuota cabang selalu menggunakan format tabular (`font-mono font-bold tabular-nums`) untuk konsistensi baris.
- **Card Hierarchy**: Kartu Paket Pro ditonjolkan dengan ring border 2px beraksen maroon/amber dan daftar keunggulan fitur yang jelas tanpa icon slop berlebihan.

---

## 3. Key Product Decisions & Trade-Offs

- **Struktur Tier & Type Definition**:
  - *Pendekatan*: Menambahkan nilai `'pro'` ke dalam union type `LaundryTier = 'newcomer' | 'premium' | 'pro'`.
  - *Rasional*: Memastikan TypeScript type-safety di seluruh kode (Vite frontend dan Node backend) tanpa memecah logika subscription yang sudah stabil.
- **Normalisasi Backward Compatibility**:
  - *Pendekatan*: Fungsi `normalizeTier` mengenali `'pro'`, `'PRO'`, `'Paket Pro'` dan memetakannya ke batas limit `PRO_LIMITS`. Akun lama dengan tier `premium` tetap berjalan normal tanpa gangguan kuota transaksi tak terbatas mereka.
- **Pintu Akses Ekspor di LaporanView**:
  - *Pendekatan*: Memeriksa `limits.canExportExcel` dan `limits.canExportOfficialPdf`. Jika `false`, tombol tetap terlihat namun memunculkan toast/modal informasi bahwa ekspor adalah fitur eksklusif Paket Pro. Hal ini mendorong konversi (upsell) secara elegan tanpa membingungkan kasir.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KAFELAS LAUNDRY SYSTEM                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [UI Layer: UpgradePlanModal / LaporanView / KelolaOwner / Kasir]     │
│         │                                        │                     │
│         ▼                                        ▼                     │
│  [subscription.ts]                        [billingService.ts]          │
│  • LaundryTier: 'newcomer'|'premium'|'pro'• Purpose: 'extend_pro'      │
│  • PRO_LIMITS: 2 cabang, 2 kasir, export  • Durasi: 30-360 hari        │
│         │                                        │                     │
│         ▼                                        ▼                     │
│  [IndexedDB / Local Storage Cache]        [server.ts API Routes]       │
│  • Local fallback data                    • /api/midtrans/create-trx   │
│  • Instant offline UI updates             • /api/wallet/extend         │
│                                           • /api/admin/billing/grant   │
│                                                  │                     │
│                                                  ▼                     │
│                                           [Cloud Firestore]            │
│                                           • users/{uid}.subType='pro'  │
│                                           • laundries/{id}.subType     │
│                                           • firestore.rules validation │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & File Mapping

1. `src/utils/subscription.ts`:
   - Tambah `'pro'` ke `LaundryTier`.
   - Tambah konstanta `HARGA_PRO_BULANAN = 49000`.
   - Buat konfigurasi `PRO_LIMITS` dengan `priceMonthly: 49000`, `maxBranches: 2`, `maxCashiers: 2`, `canExportExcel: true`, `canExportOfficialPdf: true`.
   - Perbarui `PREMIUM_LIMITS` dengan `canExportExcel: false` dan `canExportOfficialPdf: false`.
   - Update `normalizeTier` dan `getLaundryLimits`.
2. `src/components/UpgradePlanModal.tsx`:
   - Tampilkan tab/kartu Paket Pro berdampingan dengan Paket Premium.
   - Pilihan durasi pembayaran Paket Pro (kelipatan Rp 49.000).
   - Penjelasan komparasi fitur jelas antara Newcomer, Premium, dan Pro.
3. `server.ts`:
   - Tambah konstanta `HARGA_PRO_BULANAN = 49000`.
   - Update validasi pembuatan tagihan Midtrans dan potong saldo dompet untuk `purpose === 'extend_pro'`.
   - Sinkronisasi status `'pro'` ke semua cabang outlet milik owner (`syncOwnerBranchesSubscription`).
4. `firestore.rules` & `firebase-blueprint.json`:
   - Perbarui validasi aturan keamanan agar kolom `subscriptionType` dan `subscriptionTypeAfter` mengizinkan nilai `'pro'`.
5. `src/views/LaporanView.tsx`:
   - Integrasikan pengecekan `canExcel` & `canPdf` agar memandu pengguna upgrade ke Pro jika belum berlangganan Pro.
6. `src/components/SuperAdminBillingModal.tsx` & `src/components/SuperAdminDashboard.tsx`:
   - Tambahkan opsi aktivasi Paket Pro manual via transfer untuk Super Admin.
