# Penyatuan 28 Layanan Default & Pencegahan Duplikasi Layanan

Menjadikan 28 layanan standar laundry sebagai bawaan tunggal saat pendaftaran akun baru maupun pembuatan cabang baru, menghilangkan tombol tambah paket standar agar tidak memicu duplikasi, serta memastikan sinkronisasi awal per cabang bebas dari data ganda.

## User Review & Critical Decisions

> [!IMPORTANT] Seluruh keputusan utama telah dikonfirmasi oleh pengguna dan menjadi acuan implementasi.

- **Tombol Paket Standar**: Tombol "+ Paket Standar" dan "Muat Preset Standar" pada halaman kelola layanan dihilangkan sepenuhnya karena 28 layanan sudah otomatis tersedia sejak awal.
- **Cakupan Default 28 Layanan**: Diterapkan otomatis pada saat pendaftaran akun baru pertama kali dan saat membuat cabang outlet baru (kecuali pengguna memilih menyalin dari cabang lain).
- **Penanganan Duplikasi**: Karena belum ada pengguna produksi, fokus diarahkan pada pencegahan akar penyebab duplikasi sejak pendaftaran awal, sinkronisasi cloud-lokal, dan perpindahan cabang.

## 1. Overview & Core Concept

- **Apa yang Dilakukan**: Menyatukan dua daftar layanan bawaan yang sebelumnya terpisah (6 layanan dasar di penyimpanan awal dan 28 preset di halaman kelola layanan) menjadi satu sumber kebenaran berisi 28 layanan lengkap, lalu memakainya secara konsisten saat inisialisasi akun baru, pembuatan cabang baru, dan fallback sinkronisasi.
- **Target Pengguna**: Pemilik laundry (Owner) yang baru mendaftar atau menambah cabang baru, serta kasir yang langsung memakai daftar tarif di halaman transaksi.
- **Nilai Utama**: Pengguna langsung mendapatkan 28 layanan siap pakai dengan satuan durasi lengkap tanpa perlu menekan tombol impor tambahan dan tanpa risiko munculnya layanan dobel.

## 2. User Experience & Visual Design

- **Alur Pengguna Baru & Cabang Baru**:
  1. Owner mendaftar akun baru (melalui formulir daftar atau Google) atau menambahkan cabang outlet baru.
  2. Sistem langsung mengisi 28 layanan standar ke penyimpanan lokal dan cloud untuk cabang tersebut dengan identitas cabang yang tepat.
  3. Saat membuka halaman **Kelola Daftar Harga** atau **Transaksi Baru**, 28 layanan langsung tampil rapi berurutan tanpa ada item ganda dari penyimpanan sementara pra-login.
- **Tampilan Halaman Kelola Layanan**:
  - Mempertahankan desain, tata letak, warna maroon (`#800000`), bilah pencarian, kartu layanan, drag-and-drop urutan, dan geser-hapus yang sudah ada.
  - Menghilangkan tombol **"+ Paket Standar"** di bilah kontrol kanan serta tombol **"Muat Preset Standar"** pada tampilan kosong, sehingga pengguna cukup memakai tombol **"+ Tambah Layanan"** bila ingin menambah layanan kustom baru.
  - Pada modal tambah layanan baru, chip pilihan cepat tetap bisa memanfaatkan daftar 28 standar sebagai pengisi form cepat (opsional) atau langsung mengisi manual, tanpa membuat entri massal.

## 3. Key Product Decisions & Trade-Offs

- **Satu Sumber Kebenaran untuk 28 Layanan Default**:
  - *Pendekatan*: Memusatkan daftar 28 layanan standar (lengkap dengan field `satuanDurasi` seperti `Hari`/`Jam`) pada lapisan penyimpanan dasar agar dipakai bersama oleh proses inisialisasi awal, pendaftaran akun baru, dan aktivasi cabang baru.
  - *Alasan*: Menghindari perbedaan daftar layanan antara data bawaan lokal dan antarmuka pengelolaan layanan.
- **Pencegahan Duplikasi Saat Sinkronisasi Awal**:
  - *Pendekatan*: Memfilter cache layanan berdasarkan ID cabang aktif (`laundryId`) sebelum digabungkan dengan data server, membuang sisa cache placeholder pra-login (`lnd-1`) saat akun asli masuk, serta menormalkan fallback `fetchLayanan` agar memakai ID cabang target.
  - *Alasan*: Sebelumnya, penggabungan cache lokal dengan data Firestore pasca-registrasi sering mencampur item `lnd-1` dan `lnd-<uid>` atau mencampur layanan antar cabang dalam satu daftar.
- **Penghapusan Tombol Tambah Paket Standar**:
  - *Pendekatan*: Menghapus tombol aksi tambah massal paket standar dan handler-nya di halaman kelola layanan.
  - *Alasan*: Mencegah pengguna menekan tombol impor setelah 28 layanan sudah terbuat otomatis saat pendaftaran, yang sebelumnya langsung menggandakan jumlah layanan menjadi dua kali lipat.

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│             Master 28 Layanan Standar (Tunggal)             │
│   id: lay-1 .. lay-28 | durasi + satuanDurasi | urutan      │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│  Registrasi Akun Baru         │ │  Tambah Cabang Baru       │
│  Seed 28 layanan ke cabang    │ │  Salin cabang asal ATAU   │
│  utama (lnd-<uid>) & batch    │ │  seed 28 layanan ke ID    │
│  simpan ke Firestore          │ │  cabang baru              │
└───────────────┬───────────────┘ └─────────────┬─────────────┘
                │                               │
                └───────────────┬───────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│      Sinkronisasi & Penggabungan Layanan Per Cabang         │
│  • Filter cache hanya untuk laundryId === activeLaundryId   │
│  • Abaikan placeholder pra-login (lnd-1) untuk akun asli    │
│  • Deduplikasi berdasarkan ID & nama layanan per cabang     │
└───────────────────────────────┬─────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│               Tampilan Kelola Layanan & POS                 │
│  • Menampilkan layanan milik cabang aktif tanpa duplikat    │
│  • Tanpa tombol "+ Paket Standar" / "Muat Preset Standar"   │
└─────────────────────────────────────────────────────────────┘
```

- **Model Data & State**:
  - Setiap layanan default menggunakan ID deterministik (`lay-1` sampai `lay-28`), `urutan` `0` sampai `27`, serta `laundryId` yang diikat ke cabang tujuan saat dibuat.
  - Ketika cabang baru dibuat tanpa menyalin cabang lama, ID layanan tetap unik per cabang di koleksi sub-cabang Firestore dan dipetakan ke state lokal dengan filter cabang aktif agar tidak tercampur saat berpindah cabang.
- **Alur Interaksi & Sinkronisasi**:
  - Saat login/daftar selesai, state layanan lokal diperbarui bersih mengikuti cabang aktif (`laundryId === targetLaundryId`) sehingga sisa inisialisasi awal pra-login tidak ikut terbawa ke daftar cabang pemilik.
  - Saat berpindah cabang, penyaringan dan pengurutan layanan tetap menjaga konsistensi per cabang dan menyinkronkan ulang urutan tanpa menghapus data cabang lain.
