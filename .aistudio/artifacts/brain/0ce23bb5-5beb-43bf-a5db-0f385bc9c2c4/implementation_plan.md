# Konversi Gambar Nota & Opsi Berbagi Tautan Langsung WhatsApp

Pembaruan ini menyempurnakan jendela nota terpadu agar secara otomatis mengubah tampilan nota menjadi gambar tajam berformat PNG (menggunakan pustaka `html-to-image`) sekaligus menyediakan **opsi berbagi tautan langsung ke WhatsApp** yang mengarah tepat ke nomor telepon pelanggan tanpa perlu mencari kontak secara manual.

## Tinjauan Pengguna & Keputusan Utama

> [!IMPORTANT]
> Karena pertanyaan klarifikasi dilewati, rencana ini menerapkan konfigurasi bawaan paling praktis untuk operasional kasir harian di HP Android, iOS, maupun PC/Laptop. Anda dapat langsung menekan **Proceed** atau memberi masukan bila ingin penyesuaian.

- **Pendekatan Bawaan — Dua Mode Berbagi WhatsApp yang Saling Melengkapi**: Menyediakan tombol **Bagikan File Gambar** (mengirim lampiran gambar PNG via menu berbagi perangkat) berdampingan dengan tombol **Chat Langsung WhatsApp** (membuka tautan langsung menuju ruang chat nomor pelanggan berisi rincian nota sekaligus menyalin gambar nota ke *clipboard* agar siap ditempel).
- **Pendekatan Bawaan — Input Cepat Nomor Tujuan WhatsApp**: Jika transaksi belum memiliki nomor telepon pelanggan (atau kasir ingin mengirim ke nomor lain), modal menyediakan kolom nomor WhatsApp cepat yang otomatis mengubah awalan `08` menjadi kode negara `628` sebelum membuat tautan langsung WhatsApp.
- **Pendekatan Bawaan — Tautan Universal WhatsApp Biasa & Business**: Menggunakan format tautan langsung resmi WhatsApp yang kompatibel dengan WhatsApp standar, WhatsApp Business, maupun WhatsApp Web tanpa memicu pemblokiran *popup* di dalam jendela aplikasi.
- **Tanpa RawBT**: Sesuai instruksi sebelumnya, seluruh alur pencetakan tetap bersih tanpa fitur atau tombol RawBT.

---

## 1. Gambaran Umum & Konsep Inti

- **Apa yang Dilakukan**: Mengubah tampilan visual nota transaksi menjadi berkas gambar PNG yang identik 100% dengan pratinjau di layar menggunakan `html-to-image`, lalu menyajikan panel **Opsi Berbagi WhatsApp** yang dapat membuat tautan langsung ke ruang chat nomor pelanggan maupun mengirim berkas gambar nota secara langsung.
- **Pengguna Sasaran**: Pemilik usaha dan staf kasir laundry yang perlu mengirimkan bukti transaksi ke pelanggan dalam hitungan detik melalui HP Android (APK/Chrome/PWA), iPhone/iPad, maupun komputer kasir.
- **Nilai Utama**: Menghilangkan hambatan saat mengirim nota ke pelanggan—baik ketika kasir ingin langsung masuk ke ruang chat nomor WhatsApp pelanggan tanpa menyimpan kontak terlebih dahulu, maupun ketika ingin melampirkan gambar struk resmi beresolusi tinggi.

---

## 2. Pengalaman Pengguna & Desain Visual

### Alur Pengguna Utama
1. **Generate Gambar Nota Otomatis Saat Modal Terbuka**:
   - Begitu kasir membuka struk transaksi, aplikasi merender lembar nota di layar dan langsung mengonversinya di latar belakang menjadi gambar PNG menggunakan `html-to-image` (dengan dimensi penuh tanpa terpotong area gulir modal).
   - Indikator kesiapan gambar memberi kepastian bahwa berkas gambar nota sudah siap dibagikan atau diunduh tanpa jeda tunggu.
2. **Mengirim Nota via Tautan Langsung WhatsApp**:
   - Pada bagian **Opsi Berbagi WhatsApp**, nomor telepon pelanggan otomatis terisi dari data transaksi/pelanggan. Bila nomor masih kosong, kasir cukup mengetik nomor tujuan pada kolom ringkas yang tersedia di dalam modal (atau membiarkannya kosong untuk memilih kontak langsung di aplikasi WhatsApp).
   - Saat kasir menekan **Kirim ke Nomor WhatsApp**, sistem:
     1. Memastikan gambar nota hasil `html-to-image` tersalin ke *clipboard* perangkat (bila didukung browser) sehingga gambar juga dapat langsung ditempel di chat.
     2. Membuka tautan langsung WhatsApp menuju nomor pelanggan dengan format pesan nota yang rapi dan siap kirim.
3. **Membagikan Lampiran File Gambar & Mengunduh PNG**:
   - Kasir juga dapat menekan **Bagikan File Gambar** untuk membuka menu berbagi bawaan sistem operasi yang membawa berkas `.png` asli ke WhatsApp, atau menekan **Simpan PNG** untuk mengunduh gambar nota ke galeri/perangkat.

### Identitas Visual & Tema
- **Arah Estetika**: *Utilitarian POS Precision*—tata letak bersih, kontras tinggi untuk keterbacaan di meja kasir, tanpa dekorasi berlebihan.
- **Palet Warna (Proporsi 60-30-10)**:
  - *60% Kanvas Netral*: Latar pratinjau abu-abu terang (`slate-100`) yang menonjolkan kertas nota putih bersih (`#FFFFFF`) dengan teks gelap tajam (`#0F172A`).
  - *30% Permukaan Struktural*: Panel aksi putih dengan pembatas garis tipis (`1px border-slate-200`) dan permukaan ringkasan lembut (`slate-50`).
  - *10% Aksen Aksi*: Hijau tegas (`#059669`) khusus untuk aksi utama berbagi ke WhatsApp dan marun identitas Kafelas (`#800000`) untuk header serta pencetakan Bluetooth.
- **Tipografi & Kerapian Angka**:
  - Elemen kertas nota menggunakan huruf monospace kasir dengan perataan tabular (`tabular-nums`) pada seluruh kuantitas timbangan, harga satuan, diskon, uang muka, sisa tagihan, dan nomor telepon agar sejajar lurus.
  - Informasi pada bagian atas modal disajikan sebagai teks bersih dengan pemisah titik tengah (`·`) tanpa kotak kapsul statis.
- **Tata Letak Responsif & Ergonomi Sentuh**:
  - **Desktop / Laptop ($\ge 1024\text{px}$)**: Tata letak dua kolom seimbang—pratinjau nota utuh di sisi kiri, serta ringkasan pembayaran, kolom nomor tujuan WhatsApp, dan tombol berbagi/cetak di sisi kanan.
  - **Layar HP ($< 1024\text{px}$)**: Pratinjau nota dapat digulir leluasa di bagian atas, sementara kontrol berbagi WhatsApp dan cetak diletakkan pada bilah bawah yang mudah dijangkau ibu jari dengan tinggi area sentuh minimal `44px` dan label tombol satu baris (`whitespace-nowrap`).

### Umpan Balik Interaktif & Gerak
- Status konversi gambar dan berbagi ditampilkan melalui pesan kontekstual ringkas di dalam modal (tanpa dialog `alert` yang memblokir layar) dengan transisi halus di bawah `200ms`.

---

## 3. Keputusan Produk & Pertimbangan Teknis

- **Keputusan 1: Memadukan Tautan Langsung WhatsApp dengan Penyalinan Gambar Nota (`html-to-image`)**
  - *Pendekatan Terpilih*: Saat tombol tautan langsung WhatsApp ditekan, aplikasi menghasilkan gambar nota (`Blob` PNG) dan menyalinnya ke *clipboard* bila didukung, lalu membuka tautan langsung WhatsApp (`wa.me` / `api.whatsapp.com/send`) dengan nomor tujuan terformat `62...` dan pesan rincian nota. Di sampingnya tetap tersedia tombol *Web Share* khusus lampiran berkas gambar.
  - *Alasan*: Protokol URL resmi WhatsApp memungkinkan pembukaan langsung ruang chat nomor pelanggan beserta teks praisi, namun tidak mengizinkan penyisipan *file* lokal lewat parameter URL. Menggabungkan tautan langsung bernomor tujuan dengan *clipboard* gambar serta tombol *Web Share File* memastikan kasir dapat memilih cara tercepat di situasi apa pun.
  - *Alternatif yang Dilewati*: Hanya mengandalkan tautan teks tanpa menghasilkan gambar, atau hanya mengandalkan *Web Share* tanpa tautan langsung ke nomor pelanggan.

- **Keputusan 2: Normalisasi Nomor & Kolom Nomor Tujuan Fleksibel di Modal**
  - *Pendekatan Terpilih*: Menyediakan input nomor WhatsApp satu baris yang otomatis terisi dari data pelanggan/transaksi, menormalisasi karakter spasi/strip serta awalan `0` atau `+62` menjadi `62`, dan tetap berfungsi membuka pemilihan kontak WhatsApp apabila dikosongkan.
  - *Alasan*: Di lapangan banyak transaksi pelanggan baru dicatat cepat tanpa nomor telepon; input cepat di modal memungkinkan kasir langsung mengetik nomor WA saat hendak mengirim nota tanpa harus keluar mengedit transaksi.

---

## 4. Arsitektur Teknis & Strategi Data

### Diagram Arsitektur & Komponen

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 MODAL NOTA TERPADU (Sumber Tunggal Nota)                 │
│                                                                          │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │   Kanvas DOM Nota (#printable)   │  │    Panel Berbagi & Cetak     │  │
│  │  • Logo Base64 Aman (Bebas CORS) │  │  • Input Nomor WA Tujuan     │  │
│  │  • Header Outlet & Info Nota     │  │  • [Chat WA Langsung (Link)] │  │
│  │  • Rincian Layanan & Pembayaran  │  │  • [Bagikan Gambar (Blob)]   │  │
│  └────────────────┬─────────────────┘  │  • [Simpan PNG] & [Salin]    │  │
│                   │                    │  • [Print BT] & [Print PC]   │  │
│                   ▼                    └──────────────┬───────────────┘  │
│  ┌──────────────────────────────────┐                 │                  │
│  │  Mesin Generate (html-to-image)  │                 │                  │
│  │  • Ukur Dimensi Utuh Non-Clip    │◀────────────────┘                  │
│  │  • Konversi ke PNG Blob & File   │                                    │
│  └────────────────┬─────────────────┘                                    │
└───────────────────┼──────────────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     Jalur Eksekusi Berbagi WhatsApp                      │
│  1. Tautan Langsung WA ──▶ Normalisasi Nomor (62..) + Buat Tautan WA     │
│                            + Salin Gambar Blob ke Clipboard (Opsional)   │
│  2. Lampiran Gambar WA ──▶ Web Share API Murni ({ files: [File PNG] })   │
│  3. Unduh Perangkat    ──▶ Simpan Berkas PNG Lokal (Object URL)          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Model Data & State
- **Data Transaksi & Pelanggan**: Menggunakan nomor nota, daftar layanan, total tagihan, uang muka, status pelunasan, serta nomor telepon dari transaksi atau profil pelanggan terkait.
- **State Internal Modal**:
  - `targetWaPhone`: Nilai nomor WhatsApp tujuan yang terisi otomatis dari data transaksi/pelanggan dan dapat disunting langsung sebelum membuat tautan WhatsApp.
  - `cachedAssets`: Menyimpan hasil *generate* `html-to-image` berupa `Blob` (`image/png`), objek `File`, Data URL, dan nama berkas agar siap dipakai ulang untuk unduh, *clipboard*, maupun *Web Share* tanpa merender ulang berulang kali.
  - `isProcessingAction` & `statusFeedback`: Mengelola status pemrosesan gambar dan pesan umpan balik bagi kasir.

### Pemetaan Komponen Interaktif & State
1. **Inisialisasi Modal & *Pre-Generate* Gambar**: Saat modal dibuka, `targetWaPhone` diisi otomatis dari nomor telepon pelanggan, logo dimuat sebagai Base64, dan elemen nota langsung dikonversi ke PNG `Blob` menggunakan `html-to-image` di latar belakang.
2. **Input Nomor Tujuan WhatsApp**: Memperbarui `targetWaPhone` secara langsung dan membersihkan karakter non-angka saat membangun tautan WhatsApp (`08xx` $\rightarrow$ `628xx`).
3. **Tombol Tautan Langsung WhatsApp**: Memastikan gambar nota telah ter-*generate* (dan menyalin `Blob` PNG ke *clipboard* perangkat bila tersedia), menyusun tautan langsung WhatsApp berisi ringkasan & rincian nota yang rapi ke `targetWaPhone`, lalu membuka tautan melalui elemen jangkar aman (tanpa `window.open` agar kompatibel dengan lingkungan *iframe* dan seluler).
4. **Tombol Bagikan Gambar Nota**: Memicu `navigator.share({ files: [file] })` dengan berkas PNG hasil `html-to-image` agar WhatsApp Android maupun iOS menerima lampiran gambar secara utuh; bila perangkat tidak mendukung *Web Share File*, mengunduh PNG dan menyalinnya ke *clipboard*.
5. **Tombol Simpan PNG & Cetak**: Mengunduh berkas gambar nota ke perangkat atau mencetak ke printer Bluetooth/USB tanpa ketergantungan aplikasi pihak ketiga RawBT.
