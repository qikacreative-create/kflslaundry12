# Arsitektur Rendering Struk & Penggunaan Library html-to-image

Dokumentasi status teknis dan alur kerja library `html-to-image` dalam proses konversi struk nota laundry menjadi gambar digital siap bagi.

## User Review & Critical Decisions

> [!NOTE]
> Pengguna mengonfirmasi bahwa kebutuhan saat ini bersifat informasional tanpa perubahan atau modifikasi kode sumber yang diperlukan.

- **Status Kode**: Dipertahankan dalam kondisi saat ini (tidak ada perubahan berkas aplikasi).
- **Implementasi Terpasang**: `html-to-image@^1.11.13` tetap aktif digunakan bersama fallback Canvas 2D murni.

---

## 1. Overview & Core Concept

- **Fungsi Utama**: Mengubah elemen DOM HTML struk thermal 58mm menjadi file gambar PNG berkualitas tinggi (3x pixel ratio) secara cepat di sisi klien (browser).
- **Penggunaan di Aplikasi**:
  1. **Bagikan ke WhatsApp**: Menghasilkan file gambar yang dapat dilampirkan langsung lewat Web Share API di perangkat seluler.
  2. **Salin ke Papan Klip**: Memungkinkan kasir melakukan `Ctrl + V` langsung di WhatsApp Web / desktop chat.
  3. **Unduh Struk**: Menyimpan bukti transaksi lokal sebagai cadangan arsip pelanggan.

---

## 2. User Experience & Visual Design

- **Alur Interaksi Pengguna**:
  1. Kasir membuka detail transaksi atau menyelesaikan pembayaran baru.
  2. Modal pratinjau struk (`ReceiptModal`) muncul dengan layout kertas thermal 58mm yang rapi dan proporsional.
  3. Secara transparan di latar belakang, elemen nota dirender menjadi gambar PNG menggunakan `toBlob` dari `html-to-image`.
  4. Pengguna dapat memilih aksi cepat: Cetak Bluetooth, Bagikan ke WhatsApp, Salin Gambar, atau Unduh Gambar.

---

## 3. Key Product Decisions & Trade-Offs

- **Strategi Rendering Dual-Engine**:
  - **Engine Utama (`html-to-image`)**: Menjaga kesamaan 1:1 antara tampilan visual pratinjau React (`ReceiptPaper.tsx`) dengan gambar yang dihasilkan.
  - **Engine Cadangan (`HTML5 Canvas 2D`)**: Disediakan fungsi `generateReceiptCanvas` di `src/utils/receiptCanvas.ts` jika perangkat tertentu atau WebView membatasi render DOM berbasis SVG foreignObject.
- **Dukungan Offline Penuh**: Seluruh proses render berjalan lokal di peramban tanpa memerlukan panggilan API backend atau koneksi internet.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────┐
│               Data Transaksi (Transaksi)                │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
           ┌───────────────────────────────────┐
           │     ReceiptPaper (React DOM)      │
           │  • Header & Logo Monokrom         │
           │  • Rincian Item (Kg/Pcs)          │
           │  • Status Lunas / DP & Sisa       │
           └─────────────────┬─────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │ html-to-image (toBlob, pixelRatio: 3) │
         └───────────────────┬───────────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │    Blob / File (PNG)      │
               └─────────────┬─────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ Web Share /  │    │ Clipboard Copy  │    │ Direct Download  │
│ WhatsApp API │    │ (Ctrl+V di Web) │    │ (Unduh File PNG) │
└──────────────┘    └─────────────────┘    └──────────────────┘
```
