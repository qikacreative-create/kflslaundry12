import React from 'react';
import {
  Printer,
  Smartphone,
  Share2,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  Download,
  HelpCircle,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface ProfilePageViewProps {
  onOpenLogin: () => void;
  onOpenApkModal?: () => void;
  onInstallPwa?: () => void;
  isInstallable?: boolean;
}

export const ProfilePageView: React.FC<ProfilePageViewProps> = ({
  onOpenLogin,
  onOpenApkModal,
  onInstallPwa,
  isInstallable = false,
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-[#800000] selection:text-white">
      {/* TOP NAVIGATION BAR (3-Zone Single Row) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Lockup */}
          <a href="/profil.html" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white p-0.5 flex items-center justify-center overflow-hidden">
              <img
                src="/logo-kafela.png"
                alt="Logo Kafelas Laundry"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight text-slate-900 whitespace-nowrap">
              Kafelas Laundry
            </span>
          </a>

          {/* Zone 2: Primary Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#fitur" className="whitespace-nowrap hover:text-slate-900 transition-colors">Fitur</a>
            <a href="#alur" className="whitespace-nowrap hover:text-slate-900 transition-colors">Alur</a>
            <a href="#paket" className="whitespace-nowrap hover:text-slate-900 transition-colors">Paket</a>
            <a href="/tutorial.html" className="whitespace-nowrap hover:text-[#800000] transition-colors">Tutorial</a>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/tutorial.html"
              className="md:hidden text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap transition-colors"
            >
              Tutorial
            </a>
            <button
              type="button"
              onClick={onOpenLogin}
              className="h-9 px-4 rounded-lg bg-[#800000] hover:bg-[#680000] text-white text-xs sm:text-[13px] font-semibold inline-flex items-center justify-center whitespace-nowrap transition-colors cursor-pointer shadow-xs"
            >
              Masuk Aplikasi
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-medium text-slate-500 tracking-wide">
                Kasir POS &middot; Pembukuan &middot; Web, Android &amp; PC
              </p>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Kasir dan pembukuan laundry yang rapi, cepat, praktis.
              </h1>

              <p className="text-[15px] sm:text-base text-slate-600 leading-relaxed max-w-[46ch]">
                Catat cucian kiloan atau satuan, cetak struk Bluetooth, kirim nota gambar ke WhatsApp, dan pantau kas harian otomatis.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="h-11 px-5 rounded-xl bg-[#800000] hover:bg-[#680000] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <span>Buka Aplikasi Kasir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="/tutorial.html"
                  className="h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold inline-flex items-center justify-center transition-colors"
                >
                  Lihat Tutorial
                </a>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <div className="text-sm font-bold text-slate-900 tabular-nums">58mm</div>
                  <div className="text-xs text-slate-500 mt-0.5">Struk Bluetooth</div>
                </div>
                <div className="border-l border-slate-200/80 pl-4">
                  <div className="text-sm font-bold text-slate-900">1 Ketuk</div>
                  <div className="text-xs text-slate-500 mt-0.5">Nota Gambar WA</div>
                </div>
                <div className="border-l border-slate-200/80 pl-4">
                  <div className="text-sm font-bold text-slate-900">Cloud + Lokal</div>
                  <div className="text-xs text-slate-500 mt-0.5">Siap Saat Offline</div>
                </div>
              </div>
            </div>

            {/* Right Real App Preview */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-[260px] sm:max-w-[280px] rounded-[34px] border border-slate-200 bg-slate-950 p-2 shadow-sm">
                <div className="rounded-[26px] overflow-hidden bg-slate-100 aspect-[9/19.5]">
                  <img
                    src="/dashboard_tutorial_screen1.jpg"
                    alt="Tampilan Aplikasi Kasir Kafelas Laundry"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CORE FEATURES (ASYMMETRIC BENTO) */}
        <section id="fitur" className="py-16 sm:py-20 bg-slate-50/70 border-y border-slate-200/70">
          <div className="max-w-5xl mx-auto px-5 sm:px-6">
            <div className="max-w-xl space-y-2 mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#800000]">
                Fitur Utama
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Empat modul inti untuk harian outlet.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-2.5">
                <div className="font-mono text-xs font-bold text-[#800000]">01</div>
                <h3 className="text-base font-bold text-slate-900">Kasir &amp; Cetak Struk 58mm</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Input berat desimal atau jumlah satuan, pilih pembayaran lunas atau DP, lalu cetak langsung ke printer thermal Bluetooth.
                </p>
              </div>

              <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-2.5">
                <div className="font-mono text-xs font-bold text-[#800000]">02</div>
                <h3 className="text-base font-bold text-slate-900">Struk Gambar WhatsApp</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Kirim gambar struk persis cetakan kertas langsung ke WhatsApp pelanggan tanpa ketik ulang.
                </p>
              </div>

              <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-2.5">
                <div className="font-mono text-xs font-bold text-[#800000]">03</div>
                <h3 className="text-base font-bold text-slate-900">Status Cucian &amp; Staf</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pantau cucian dari diterima, diproses, selesai, hingga diambil beserta pencatatan beban kerja staf.
                </p>
              </div>

              <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-2.5">
                <div className="font-mono text-xs font-bold text-[#800000]">04</div>
                <h3 className="text-base font-bold text-slate-900">Buku Kas &amp; Laporan</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Uang masuk dan biaya operasional terekap otomatis. Unduh laporan kapan saja dalam format Excel (.xlsx) atau PDF A4.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. WORKFLOW (3 CONCISE STEPS) */}
        <section id="alur" className="py-16 sm:py-20 bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#800000]">
                  Alur Kerja
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Tiga langkah sederhana di meja kasir.
                </h2>
              </div>
              <a
                href="/tutorial.html"
                className="text-xs font-semibold text-[#800000] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Buka peta tombol interaktif</span>
                <span>&rarr;</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-200/80">
              <div className="space-y-2">
                <div className="font-mono text-xs font-bold text-slate-400">01</div>
                <h3 className="text-base font-bold text-slate-900">Terima Cucian</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pilih pelanggan dan layanan, lalu masukkan berat timbangan atau jumlah pakaian.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs font-bold text-slate-400">02</div>
                <h3 className="text-base font-bold text-slate-900">Cetak atau Kirim WA</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Simpan transaksi untuk mencetak struk 58mm atau membagikan gambar nota ke pelanggan.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs font-bold text-slate-400">03</div>
                <h3 className="text-base font-bold text-slate-900">Serahkan &amp; Rekap</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tandai diambil saat pelunasan. Pemasukan dan saldo kas laci langsung terhitung rapi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PRICING (TRANSPARENT & MINIMAL) */}
        <section id="paket" className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-200/70">
          <div className="max-w-5xl mx-auto px-5 sm:px-6">
            <div className="max-w-xl space-y-2 mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#800000]">
                Pilihan Paket
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Coba penuh 7 hari, lanjut sesuai kebutuhan.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              {/* Trial 7 Hari */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">Trial 7 Hari</h3>
                    <span className="text-xs text-slate-500">Otomatis saat daftar</span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-900 tabular-nums">Rp 0</span>
                    <span className="text-xs text-slate-500">/ 7 hari pertama</span>
                  </div>

                  <ul className="space-y-2.5 text-sm text-slate-600 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2.5">
                      <span className="text-slate-400">&bull;</span>
                      <span>Semua fitur Paket Premium terbuka penuh</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-slate-400">&bull;</span>
                      <span>Nota, pelanggan &amp; layanan tanpa batas</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-slate-400">&bull;</span>
                      <span>1 akun Kasir (sinkron beda HP) &amp; staf</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-slate-400">&bull;</span>
                      <span>Cetak Bluetooth, logo struk &amp; nota WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-colors cursor-pointer"
                >
                  Coba Gratis 7 Hari
                </button>
              </div>

              {/* Premium */}
              <div className="bg-white border-2 border-[#800000] rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">Premium</h3>
                    <span className="text-xs font-semibold text-[#800000]">Tanpa batas kuota</span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-900 tabular-nums">Rp 27.000</span>
                    <span className="text-xs text-slate-500">/ 30 hari</span>
                  </div>

                  <ul className="space-y-2.5 text-sm text-slate-700 pt-4 border-t border-slate-100">
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#800000]">&bull;</span>
                      <span>Transaksi, pelanggan &amp; layanan tanpa batas</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#800000]">&bull;</span>
                      <span>Akun Kasir terpisah (sinkron beda HP)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#800000]">&bull;</span>
                      <span>Penugasan &amp; hitung beban kerja staf</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#800000]">&bull;</span>
                      <span>Ekspor laporan Excel (.xlsx) &amp; PDF A4</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#800000]">&bull;</span>
                      <span className="tabular-nums">Tambah cabang opsional Rp 25.000/cabang</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="h-10 px-4 rounded-xl bg-[#800000] hover:bg-[#680000] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                >
                  Mulai Sekarang
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CONCISE CTA BLOCK */}
        <section className="bg-white border-t border-slate-200/80">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 py-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Siap merapikan kasir laundry Anda?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Langsung daftar dari browser atau hubungi admin kami via WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onOpenLogin}
                className="h-10 px-5 rounded-xl bg-[#800000] hover:bg-[#680000] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              >
                Masuk / Daftar
              </button>
              <a
                href="https://api.whatsapp.com/send?phone=6285659781477&text=Halo%20Admin%20Kafelas%20Laundry%2C%20saya%20ingin%20bertanya%20tentang%20aplikasi%20kasir%20laundry."
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-colors"
              >
                WhatsApp Admin
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            &copy; 2026 Kafelas Laundry &middot; Sistem Kasir &amp; Operasional Laundry
          </div>
          <div className="flex items-center gap-5 font-medium text-slate-600">
            <button type="button" onClick={onOpenLogin} className="hover:text-slate-900 transition-colors cursor-pointer">
              Aplikasi Kasir
            </button>
            <a href="/tutorial.html" className="hover:text-slate-900 transition-colors">Tutorial</a>
            <a
              href="https://api.whatsapp.com/send?phone=6285659781477&text=Halo%20Admin%20Kafelas%20Laundry"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              Kontak
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
