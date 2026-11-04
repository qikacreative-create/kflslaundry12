# Implementation Plan - Web Profil & Tutorial Site (kafelaslaundry.web.app)

1. **Root Profile & Tutorial Architecture**:
   - Jadikan halaman profil (`profil.html`) sebagai halaman utama root (`/` / `index.html`) untuk `kafelaslaundry.web.app`.
   - Pastikan halaman tutorial tetap tersedia di `/tutorial.html`.

2. **External Link Redirection**:
   - Mengarahkan seluruh tombol "Masuk Aplikasi" atau "Login" di halaman profil dan tutorial agar membuka `https://kflslaundry.web.app` (aplikasi POS terpisah).

3. **Cleanup & Lightweight Optimization**:
   - Menghapus komponen POS, kasir, buku kas, dan database lokal yang tidak lagi diperlukan untuk situs profil/tutorial murni agar loading sangat cepat dan ringan.
   - Mempertahankan struktur build Vite, PWA manifest, dan konfigurasi Firebase hosting.
