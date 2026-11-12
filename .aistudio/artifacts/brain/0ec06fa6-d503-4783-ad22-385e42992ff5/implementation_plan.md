# Rencana Implementasi Drag and Drop Layanan

## 1. Fitur Utama
- Menggantikan atau menyempurnakan tombol naik/turun manual pada daftar layanan di `KelolaLayananView.tsx`.
- Memungkinkan pengguna untuk menyentuh dan menyeret (drag & drop) kartu layanan secara bebas untuk menyusun ulang urutannya.
- Menyimpan perubahan urutan layanan secara otomatis ke penyimpanan lokal dan sinkronisasi cloud.

## 2. Rincian Teknis
- Menambahkan atribut `draggable={true}` pada kartu layanan di `KelolaLayananView.tsx`.
- Mengimplementasikan event handler `onDragStart`, `onDragOver`, `onDrop`, dan `onDragEnd` untuk mengatur penukaran posisi item layanan dalam array.
- Mempertahankan animasi transisi halus dan indikator visual saat kartu diseret.
- Memastikan kompatibilitas sentuh (touch support) pada perangkat mobile/tablet.
