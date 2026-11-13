# Transformasi Paket Newcomer ke Trial 7 Hari Fitur Premium

Mengubah model Paket Newcomer dari "Gratis Selamanya" dengan batas 50 nota/bulan menjadi **Masa Percobaan (Trial) 7 Hari** dengan akses fitur setara **Paket Premium**, serta mengunci pembuatan nota baru dan memunculkan modal perpanjangan Paket Premium saat masa percobaan berakhir.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Rencana ini telah direvisi sesuai arahan Anda agar masa percobaan 7 hari dan alur perpanjangan pasca-trial difokuskan ke **Paket Premium** (bukan Paket Pro). Silakan tinjau ringkasan berikut sebelum persetujuan.

- **Level Fitur Selama 7 Hari Percobaan (Setara Paket Premium)**:
  - **Tanpa batas kuota** nota transaksi bulanan, data pelanggan, dan jenis layanan (aturan batas 50 nota/bulan, 50 pelanggan, dan 5 layanan dihapus sepenuhnya).
  - **1 Cabang outlet utama** & **1 akun login kasir lintas HP** (`maxCashiers: 1`), serta **penugasan staf operasional** (cuci, setrika, packing).
  - **Grafik analisis pertumbuhan omzet/laba** serta **kustomisasi logo & tanda tangan struk thermal**.
  - **Fitur eksklusif Paket Pro** (ekspor Excel `.xlsx`, cetak PDF A4 resmi, dan 2 cabang + 2 kasir langsung) tetap terjaga sebagai pembeda di **Paket Pro**; penambahan cabang ekstra pada masa trial/Premium tetap mengikuti opsi tambah cabang Rp 25.000/cabang.
- **Perilaku Setelah Masa Percobaan 7 Hari Berakhir**: Pembuatan **nota transaksi baru dikunci** dan **Modal Perpanjangan Paket Premium** (`Rp 27.000 / 30 hari`) otomatis ditampilkan. Data riwayat transaksi, arsip, laporan, dan pengaturan akun tetap dapat diakses agar pemilik tidak kehilangan data.
- **Aturan Akun Newcomer Lama (Sudah Terdaftar Sebelumnya)**: Masa percobaan dihitung **7 hari sejak akun pertama kali dibuat** (`tanggalPembuatan + 7 hari`). Akun lama yang telah melewati 7 hari langsung berstatus *Trial Habis* hingga diperpanjang ke Paket Premium; akun yang masih berumur di bawah 7 hari langsung menerima sisa hari trial dengan akses penuh fitur Premium.

---

## 1. Overview & Core Concept

- **What It Does**: Memberikan akses penuh operasional harian **Paket Premium** selama **7 hari pertama** bagi setiap pemilik laundry baru tanpa hambatan kuota 50 nota/bulan. Setelah 7 hari berakhir tanpa perpanjangan, sistem mengalihkan akun ke mode *baca & selesaikan antrean lama* yang mengunci pembuatan nota baru dan mengarahkan owner untuk berlangganan Paket Premium.
- **Target Audience / Persona**: Pemilik usaha laundry UMKM yang baru mendaftar dan membutuhkan uji coba operasional nyata tanpa takut kehabisan kuota 50 nota di tengah minggu, termasuk mencoba akun kasir di HP terpisah dan penugasan staf.
- **Key Value**: Menghilangkan batasan transaksi bulanan yang terlalu cepat habis saat uji coba awal, memberikan pengalaman lengkap fitur inti Premium selama 7 hari, sekaligus menjaga proposisi nilai **Paket Pro** (2 cabang langsung, 2 kasir, ekspor Excel & PDF A4) sebagai jenjang lanjutan.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Pendaftaran Akun Baru**: Owner baru otomatis memperoleh status *Newcomer (Trial 7 Hari)* dengan tanggal berakhir `waktuDaftar + 7 hari`. Seluruh fitur Premium (transaksi unlimited, pelanggan unlimited, layanan unlimited, 1 akun login kasir, penugasan staf, grafik pertumbuhan, logo & tanda tangan struk) langsung aktif tanpa gembok.
  2. **Pengalaman Selama Masa Trial Aktif (Hari 1–7)**:
     - Bilah samping desktop, kartu pengaturan, dan halaman Kelola Owner menampilkan hitung mundur hari tersisa (misal `Trial • 7 Hari` hingga `Trial • 1 Hari`, berubah aksen peringatan amber saat `<= 2 Hari`).
     - Indikator kuota `0 / 50 Nota` dan label `Gratis Selamanya` di workspace dashboard, modal paket, serta halaman profil/pengaturan diganti dengan badge status **Trial 7 Hari** dan pintasan tombol **Perpanjang**.
     - Owner dapat langsung membuat hingga **1 akun login kasir** untuk cabang utamanya dan menugaskan staf produksi tanpa terhalang gembok Newcomer.
  3. **Saat Masa Trial Berakhir (Hari > 7)**:
     - Saat membuka aplikasi, banner peringatan maroon tampil di dashboard dan **Modal Perpanjangan Paket Premium** langsung muncul sekali per sesi.
     - Tombol **+ Transaksi Baru** (header, floating button mobile, maupun navigasi langsung) mengarahkan pengguna ke pesan peringatan + membuka Modal Perpanjangan Paket Premium. Layar input transaksi baru menampilkan kartu terkunci jika diakses langsung.
     - Mengedit/menyelesaikan/mengarsipkan nota yang **sudah masuk sebelumnya**, membuka laporan, dan melakukan pembayaran perpanjangan tetap berjalan normal.
     - Akun kasir yang terhubung pada cabang ikut mewarisi status berakhir dari Owner sehingga tidak dapat membuat nota baru hingga Owner memperpanjang langganan.
  4. **Alur Perpanjangan ke Paket Premium**:
     - Melalui **Modal Perpanjangan Paket Premium** (atau menu Upgrade Paket), Owner memilih durasi perpanjangan (30 / 60 / 90 hari dengan tarif dasar Rp 27.000/30 hari) dan menyelesaikan via **Saldo Dompet**, **Midtrans (QRIS/VA/e-Wallet)**, atau **Transfer Manual BRI/DANA + Konfirmasi WA Admin**. Begitu berhasil, kunci pembuatan nota baru otomatis terbuka.

- **Visual Identity & Theme**:
  - Selaras dengan sistem desain aplikasi beraksen maroon (`#800000` / `#991B1B`), latar permukaan bersih (`bg-slate-100`, kartu `bg-white`), aksen hijau zamrud untuk status aktif, amber/oranye untuk sisa hari kritis, dan merah/rose saat masa percobaan habis (`Habis · 0 Hari`).
  - Angka hitung mundur dan nominal paket menggunakan tipografi tabular (`tabular-nums` / `font-mono`) dengan hierarki kartu yang ringkas dan bebas pill berlebihan.

- **Interactive Feedback & Motion**:
  - Animasi kemunculan modal perpanjangan (`animate-fade-in`), transisi badge hitung mundur otomatis setelah sinkronisasi atau pembayaran berhasil, serta toast peringatan jelas setiap kali aksi pembuatan nota baru ditahan.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Menyelaraskan Kapabilitas Newcomer dengan Paket Premium (Bukan Pro)**
  - *Chosen Approach*: Mengatur konfigurasi batas & kapabilitas `newcomer` agar identik dengan **Paket Premium** (transaksi/pelanggan/layanan tanpa batas, `maxBranches: 1`, `maxCashiers: 1`, `maxAdminPerOutlet: 1`, penugasan staf aktif, grafik pertumbuhan aktif, logo & tanda tangan struk aktif, sementara ekspor Excel dan PDF A4 tetap khusus Paket Pro), dengan masa berlaku 7 hari.
  - *Why*: Menjaga konsistensi konversi langsung ke **Paket Premium (Rp 27.000/bulan)** tanpa membuat pengguna kaget fitur Pro (seperti ekspor Excel/PDF atau 2 cabang gratis) tiba-tiba hilang saat mereka memperpanjang ke Paket Premium, sekaligus mempertahankan alasan kuat untuk upgrade ke Paket Pro jika membutuhkan 2 cabang atau ekspor pembukuan.
  - *Alternatives Considered*: Membuka fitur Pro selama trial; ditolak sesuai arahan Anda agar jalur uji coba dan perpanjangan fokus ke Paket Premium.

- **Decision 2: Perhitungan Akhir Masa Trial Akun Lama & Akun Baru**
  - *Chosen Approach*: Pendaftar baru langsung menyimpan `subscriptionEndDate = createdAt + 7 hari` di profil Owner dan dokumen cabang utama. Akun Newcomer lama yang masih memiliki `subscriptionEndDate == null` dihitung secara terpusat dari `createdAt + 7 hari` (dengan cadangan waktu pembuatan akun autentikasi bila field tanggal buat belum ada).
  - *Why*: Menjamin keadilan aturan "7 hari sejak akun pertama kali dibuat" untuk seluruh akun eksisting tanpa perlu skrip migrasi massal ke database.
  - *Alternatives Considered*: Memberi reset 7 hari baru untuk semua akun lama; ditolak agar konsisten dengan keputusan awal Anda.

- **Decision 3: Penyesuaian Aturan Keamanan Database & Blokir Cabang Pasca-Trial**
  - *Chosen Approach*: Memperbarui aturan keamanan database agar: (a) pembuatan profil Owner dan cabang utama baru mengizinkan `subscriptionEndDate` bernilai angka selama masih dalam rentang wajar (`<= request.time + 7 hari`) sehingga klien tidak bisa memanipulasi durasi trial, dan (b) pembuatan serta pengelolaan akun kasir oleh Owner diizinkan selama akun berstatus `premium`, `pro`, atau `newcomer` yang masa percobaannya masih aktif (`subscriptionEndDate > request.time.toMillis()`). Di endpoint tambah cabang backend, akun dengan masa trial habis dicegah menambah cabang baru sampai memperpanjang paket.
  - *Why*: Aturan database saat ini mengunci `subscriptionEndDate == null` pada registrasi Newcomer dan menolak pembuatan akun kasir bagi tier `newcomer`. Tanpa pembaruan aturan keamanan ini, pembuatan akun baru bertanggal berakhir dan pembuatan 1 kasir selama masa trial Premium akan ditolak server.
  - *Alternatives Considered*: Hanya mengandalkan validasi sisi antarmuka; ditolak karena akan langsung gagal terkena `PERMISSION_DENIED` saat menyimpan data kasir atau profil baru ke Firestore.

- **Decision 4: Penguncian Selektif Nota Baru Pasca-Trial**
  - *Chosen Approach*: Memblokir hanya pembuatan nota transaksi baru (`!transaksiToEdit`) di tombol aksi dashboard, handler simpan transaksi, dan rute form transaksi baru sambil langsung memunculkan Modal Perpanjangan Paket Premium. Transaksi lama tetap dapat diselesaikan, diambil, dan diarsipkan.
  - *Why*: Mencegah terhentinya penyerahan pakaian pelanggan yang sudah masuk sebelum hari ke-7 berakhir, sambil menegakkan batas langganan pada order baru.
  - *Alternatives Considered*: Menutup total seluruh halaman aplikasi saat habis; ditolak karena menghambat penyelesaian nota berjalan.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Lapisan Aturan & Backend                          │
├───────────────────────────────────┬─────────────────────────────────────┤
│ Aturan Keamanan Database          │ Endpoint Aktivasi Cabang Backend    │
│ • Validasi trialEndDate <= +7 hr  │ • Cek status aktif / kedaluwarsa    │
│ • Izinkan 1 kasir selama Trial    │ • Blokir tambah cabang saat habis   │
│   aktif (newcomer + endDate > now)│ • Cabang tambahan tetap Rp 25.000   │
└─────────────────┬─────────────────┴──────────────────┬──────────────────┘
                  │                                    │
                  ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                Lapisan Sinkronisasi & Resolusi Langganan                │
│ • Normalisasi Profil: hitung effectiveEndDate (endDate ?? created + 7h) │
│ • Helper Status Terpusat: isTrialExpired / sisaHari                     │
│ • Konfigurasi Tier: Newcomer = kapabilitas Paket Premium (7 hari)       │
│ • Pewarisan Status Trial & Tanggal Berakhir ke Akun Kasir Cabang        │
└─────────────────┬───────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Lapisan Antarmuka & Kontrol Akses                    │
├──────────────────────────────┬──────────────────────────────────────────┤
│ Indikator & Navigasi         │ Penjaga Aksi & Modal Perpanjangan        │
│ • Sidebar: Hitung Mundur 7h  │ • Blokir "+ Transaksi Baru" saat habis   │
│ • Dashboard: Banner Trial /  │ • Kunci Form Tambah Nota (Edit tetap OK) │
│   Expired (hapus 0/50 Nota)  │ • Modal Perpanjangan Paket Premium       │
│ • Profil/Pengaturan/Kasir:   │   (Rp 27.000/30h · Saldo/Midtrans/Manual)│
│   Badge & info Trial Premium │ • Kelola Kasir: buka kuota 1 kasir aktif │
└──────────────────────────────┴──────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Profil Pengguna & Dokumen Cabang**: Tetap memakai `subscriptionType: 'newcomer' | 'premium' | 'pro'` dan `subscriptionEndDate: number | null`. Pendaftar baru menyimpan `subscriptionEndDate = createdAt + 7 * 86400000`.
  - **Helper Resolusi Masa Aktif Terpusat**: Satu fungsi utilitas terpusat mengembalikan `effectiveSubscriptionEndDate` dan status `isSubscriptionExpired` untuk seluruh komponen agar sisa hari (`0..7 hari`) dan status kedaluwarsa konsisten di App root, Sidebar, Dashboard, Pengaturan, Kelola Owner, Modal Top-Up/Perpanjangan, dan panel Super Admin.
  - **Blueprint & Aturan Keamanan**: Blueprint entitas dan aturan keamanan tetap sinkron; pembuatan profil Owner baru membatasi `subscriptionEndDate <= request.time.toMillis() + 7 hari`, dan pembuatan/pembaruan akun kasir menerima Owner dengan `subscriptionType in ['premium', 'pro']` atau `subscriptionType == 'newcomer'` yang belum kedaluwarsa.

- **Interactive Component & State Mapping**:
  - **Saat Masuk Aplikasi / Sinkronisasi Profil**: Modul sinkronisasi menghitung `effectiveEndDate` (memakai `createdAt + 7 hari` jika akun Newcomer lama masih bernilai `null`). Apabila masa trial sudah habis, state kedaluwarsa aktif, banner peringatan tampil, dan Modal Perpanjangan Paket Premium otomatis terbuka sekali per sesi.
  - **Saat Menekan Tombol Buat Nota Baru**: Handler memeriksa status `isSubscriptionExpired`. Jika habis, pembuatan nota dibatalkan, toast peringatan ditampilkan, dan Modal Perpanjangan Paket Premium langsung muncul. Jika form diakses langsung, kartu penguncian tampil dengan tombol buka modal perpanjangan.
  - **Saat Mengelola Kasir & Staf di Masa Trial**: Halaman Kelola Kasir menggunakan kapabilitas setara Premium (`maxCashiers: 1`, `canAssignStaff: true`) selama trial aktif sehingga Owner dapat mendaftarkan 1 akun kasir lintas HP dan menugaskan staf produksi tanpa blokir Newcomer. Jika trial sudah habis, pembuatan kasir baru ikut ditahan dengan ajakan perpanjang Paket Premium.
  - **Saat Menyelesaikan Pembayaran Perpanjangan**: Modal Perpanjangan Paket Premium mengeksekusi potongan saldo dompet, pembayaran Midtrans, atau transfer manual. Setelah status diperbarui menjadi `premium` dengan `subscriptionEndDate` baru (+30/+60/+90 hari), kunci nota baru otomatis terbuka.
