# Pengiriman Langsung Struk WhatsApp untuk PWA & TWA Android

Menyempurnakan alur pengiriman gambar struk dan rincian nota ke WhatsApp pada lingkungan **PWA / TWA (Chrome & Play Store)** menggunakan mekanisme berbagi berkas sistem Android (`ShareAction` / `FileProvider` bawaan browser) serta Intent langsung tanpa menyentuh *clipboard*, khusus pada **Modal Struk** dan **Modal Bagikan Struk**.

## User Review & Critical Decisions

> [!IMPORTANT]
> Seluruh preferensi hasil konfirmasi Anda telah dikunci ke dalam rencana ini sehingga tidak ada perubahan di luar cakupan yang diminta.

- **Target Runtime Aplikasi (Terkonfirmasi)**: Dioptimalkan khusus untuk **PWA & TWA Android (Chrome dan Google Play Store)** menggunakan jalur berbagi berkas native browser (`ShareAction` sistem Android) dan skema `intent://send` yang aman dari galat skema URL.
- **Cakupan Fungsi Pengiriman (Terkonfirmasi)**: Menggunakan alur terfokus di dalam modal struk yang sudah ada (pratinjau gambar struk dirender lebih awal saat modal terbuka agar eksekusi `ShareAction` selalu instan dalam satu ketukan tanpa kehilangan *user gesture*).
- **Lokasi Tombol Aksi (Terkonfirmasi)**: Tetap bersih dan terpusat hanya pada **Modal Struk Transaksi** dan **Modal Bagikan Gambar Struk**, tanpa menambah tombol baru pada kartu Dashboard maupun halaman Detail Transaksi.

---

## 1. Overview & Core Concept

- **What It Does**: Mengirimkan gambar struk thermal beresolusi tajam (PNG) beserta pesan pengantar tagihan langsung ke WhatsApp atau WhatsApp Business melalui lembar berbagi resmi Android (`ShareAction`), dilengkapi jalur `Intent` langsung ke nomor pelanggan baru yang belum tersimpan di kontak HP kasir—100% bebas dari penyalinan *clipboard* manual.
- **Target Audience / Persona**: Kasir dan pemilik usaha *Kafelas Laundry* yang mengoperasikan aplikasi kasir harian melalui ponsel atau tablet Android dalam mode PWA terpasang maupun paket TWA dari Google Play Store.
- **Key Value**: Menghilangkan total kendala penolakan keamanan Android (`Denying clipboard access`) saat berpindah layar ke WhatsApp, sekaligus memangkas langkah kirim nota pelanggan menjadi satu ketukan cepat.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Kirim Cepat dari Modal Struk**: Kasir membuka pratinjau struk transaksi; sistem langsung menyiapkan berkas gambar struk di latar belakang. Saat kasir mengetuk **Share WhatsApp**, sistem Android seketika menampilkan lembar berbagi (`ShareAction`) dengan lampiran gambar struk PNG dan *caption* tagihan siap kirim.
  2. **Pilihan Lengkap di Modal Bagikan Struk**:
     - **Kirim Gambar Struk (WhatsApp / WA Business)**: Memicu `ShareAction` sistem Android yang membawa berkas gambar struk dan *caption* bersih (tanpa duplikasi judul) untuk dipilih ke WhatsApp Biasa maupun WA Business.
     - **Buka Ruang Chat Nomor Baru (`+628...`)**: Jika nomor pelanggan belum pernah disimpan di kontak HP, kasir dapat mengetuk tombol **Chat WA Biasa** atau **Chat WA Business** yang memicu `intent://send` langsung ke nomor tersebut beserta rincian nota teks lengkap.
     - **Simpan Gambar Struk (PNG)**: Mengunduh berkas PNG struk langsung ke penyimpanan perangkat.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Utilitarian POS bersih khas *Kafelas Laundry* yang mengutamakan keterbacaan cepat di meja kasir dan pengoperasian satu tangan (*thumb-friendly*).
  - *Color Palette & Mood*: Mempertahankan identitas warna utama Maroon (`#800000`) sebagai jangkar merek pada bilah atas, aksen hijau Emerald (`#059669`) dan Teal (`#0F766E`) khusus untuk aksi pengiriman WhatsApp & WA Business, di atas permukaan kartu putih bersih (`#FFFFFF`) dan latar netral (`#F8FAFC`).
  - *Typography & Hierarchy*: Huruf sans-serif tegas untuk tombol aksi kasir yang dipadukan dengan huruf monospace berangka sejajar (`tabular-nums`) pada kertas struk thermal 58mm dan nominal rupiah.
  - *Component Styling & Layout*: Lembar aksi bawah (*bottom sheet* `rounded-t-3xl` pada ponsel dan modal terpusat `rounded-3xl` pada layar lebar) dengan area sentuh minimal `44px` (`min-h-[44px]`) pada setiap tombol utama agar bebas salah ketuk.
- **Interactive Feedback & Motion**:
  - Indikator pemuatan ringkas (`Menyiapkan gambar struk...`) saat kanvas nota sedang dirender di awal modal terbuka, diikuti aktivasi tombol seketika (<400ms).
  - Transisi halus berbasis opasitas dan transformasi (`150ms–200ms`) serta notifikasi konfirmasi penyimpanan gambar dengan tombol pratinjau penuh (*lightbox*).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Menggunakan `ShareAction` Berkas Sistem (`navigator.share` Files) + `intent://send` Dibandingkan `whatsapp://send` Murni**
  - *Chosen Approach*: Mengirim lampiran gambar struk PNG melalui Web Share API Level 2 (yang secara internal memakai `FileProvider` dan `Intent.ACTION_SEND` milik Chrome/TWA Android) serta menggunakan `intent://send?...#Intent;scheme=whatsapp;package=...;S.browser_fallback_url=...;end` untuk membuka chat langsung ke nomor telepon.
  - *Why*: Protokol `whatsapp://send?phone=...` di Android secara teknis hanya menerima teks dan selalu mengabaikan lampiran gambar. Sebaliknya, `ShareAction` browser pada PWA/TWA mengirimkan berkas PNG asli beserta *caption* ke WhatsApp tanpa *clipboard* dan tanpa *paste* manual, sementara `S.browser_fallback_url` mencegah halaman error jika salah satu varian aplikasi WhatsApp tidak terpasang.
  - *Alternatives Considered*: Menyalin gambar ke *clipboard* lalu membuka `whatsapp://send` ditolak oleh sistem keamanan Android 10+ (`Denying clipboard access`) begitu fokus berpindah dari TWA ke WhatsApp.
- **Decision 2: Pra-Komputasi Berkas Gambar Saat Modal Terbuka & Penghapusan Judul Ganda pada Caption**
  - *Chosen Approach*: Merender `Blob` dan `File` PNG segera ketika Modal Struk terbuka, serta hanya mengirimkan `{ files, text }` (tanpa properti `title` pada payload gambar) saat memicu `ShareAction`.
  - *Why*: Chrome/TWA Android mewajibkan pemanggilan `navigator.share` dieksekusi langsung di dalam gestur ketukan pengguna tanpa jeda proses asinkron panjang. Selain itu, mengecualikan `title` pada pengiriman gambar mencegah WhatsApp Android menggabungkan judul di atas *caption* sapaan pelanggan.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Modal Struk & Modal Bagikan Struk                    │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │   Pratinjau Kertas Thermal    │──►│  Generator Gambar Struk (PNG) │  │
│  │  (Logo, Item, Status, Total)  │   │  (Precomputed Blob & File HD) │  │
│  └───────────────────────────────┘   └───────────────┬───────────────┘  │
└──────────────────────────────────────────────────────┼──────────────────┘
                                                       │
                                      Ketukan Tombol Share Kasir (1-Tap)
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               Pengatur Pengiriman Langsung WhatsApp (Tanpa              │
│                           Akses Clipboard)                              │
└──────────────┬───────────────────────────────────────┬──────────────────┘
               │                                       │
   Jalur Utama Gambar + Caption            Jalur Nomor Baru / Teks Nota
   (PWA & TWA Chrome Android)              (Langsung ke Nomor Pelanggan)
               │                                       │
               ▼                                       ▼
┌──────────────────────────────┐        ┌─────────────────────────────────┐
│  Web Share API Level 2       │        │  Android Direct Intent URI      │
│  (FileProvider Chrome/TWA    │        │  intent://send?phone=628...     │
│   + Intent.ACTION_SEND PNG)  │        │  (Paket WA Biasa / WA Business  │
│                              │        │   + Fallback Aman Browser)      │
└──────────────┬───────────────┘        └──────────────┬──────────────────┘
               │                                       │
               └───────────────────┬───────────────────┘
                                   ▼
                 ┌───────────────────────────────────┐
                 │  Aplikasi WhatsApp / WA Business  │
                 │  (Gambar / Nota Siap Dikirim)     │
                 └───────────────────────────────────┘
```

- **Data Model & State**:
  - Menggunakan data `Transaksi`, `Pelanggan`, dan `SettingsData` yang sudah aktif di memori tanpa mengubah skema penyimpanan lokal maupun database.
  - State lokal modal menyimpan objek `Blob`, `File` (`image/png`), dan URL pratinjau sementara yang dibersihkan otomatis (`revokeObjectURL`) saat modal ditutup agar hemat memori perangkat kasir.
- **Interactive Component & State Mapping**:
  - **Saat Modal Terbuka**: Komponen kertas struk merender logo dan rincian transaksi -> memicu pembuatan berkas `File` PNG secara otomatis -> mengaktifkan tombol **Share WhatsApp**.
  - **Saat Tombol Share Gambar Diketuk**: Memanggil `navigator.share({ files: [file], text: caption })` secara sinkron pada *user gesture* aktif sehingga lembar berbagi sistem Android langsung tampil membawa gambar struk dan *caption*. Bila pengguna menutup lembar berbagi (`AbortError`), aplikasi kembali tenang tanpa memunculkan unduhan paksa atau pesan galat.
  - **Saat Tombol Chat Langsung / Teks Nota Diketuk**: Menormalisasi nomor telepon (`08xx` menjadi `628xx`) dan membuka ruang percakapan pelanggan secara langsung melalui `intent://send` menuju paket aplikasi WhatsApp yang dipilih beserta rincian nota lengkap.
  - **Saat Tombol Simpan PNG Diketuk**: Mengunduh berkas `struk-<nomor_nota>.png` ke perangkat dan menampilkan pita konfirmasi hijau beserta akses pratinjau gambar penuh.
