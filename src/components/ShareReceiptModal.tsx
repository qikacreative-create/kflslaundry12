import React, { useState } from 'react';
import {
  X,
  Share2,
  MessageCircle,
  Download,
  Copy,
  Check,
  Loader2,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Transaksi, SettingsData, Pelanggan } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { generateReceiptBlob } from '../utils/receiptCanvas';

interface ShareReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaksi: Transaksi | null;
  settings: SettingsData;
  pelanggan?: Pelanggan | null;
  laundryName?: string;
  laundryPhone?: string;
  laundryAddress?: string;
  initialBlob?: Blob | null;
  initialFile?: File | null;
  initialUrl?: string | null;
}

/**
 * Normalisasi nomor HP ke format internasional WhatsApp (62xxx)
 */
function cleanWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Membuka chat WhatsApp dengan aman tanpa dependensi eksternal
 */
function openWhatsAppChat(phone: string, text: string, variant: 'regular' | 'business' = 'regular') {
  const encodedText = encodeURIComponent(text);
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  let targetUrl = '';
  if (phone) {
    if (variant === 'business' && isMobile) {
      targetUrl = `whatsapp-smb://send?phone=${phone}&text=${encodedText}`;
    } else if (isMobile) {
      targetUrl = `whatsapp://send?phone=${phone}&text=${encodedText}`;
    } else {
      targetUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
    }
  } else {
    targetUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  const a = document.createElement('a');
  a.href = targetUrl;
  if (!isMobile) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Download file gambar PNG ke penyimpanan perangkat
 */
function triggerFileDownload(dataUrl: string, fileName: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export const ShareReceiptModal: React.FC<ShareReceiptModalProps> = ({
  isOpen,
  onClose,
  transaksi,
  settings,
  pelanggan,
  laundryName,
  laundryPhone,
  laundryAddress,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  if (!isOpen || !transaksi) return null;

  const headerTitle = laundryName || settings.headerStruk || 'Kafelas Laundry';
  const headerAddress = laundryAddress || settings.address || '';
  const headerPhone = laundryPhone || settings.phoneNumber || '';
  const isLunas = transaksi.statusPembayaran === 'Lunas';
  const sisaBayar = isLunas ? 0 : Math.max(0, (transaksi.totalHarga || 0) - (transaksi.jumlahDp || 0));
  const statusFinal = isLunas || sisaBayar <= 0 ? 'LUNAS' : 'BELUM LUNAS';
  const customerPhoneClean = cleanWhatsAppPhone(
    transaksi.nomorTelepon || pelanggan?.nomorTelepon
  );

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  /**
   * Menghasilkan teks deskripsi / caption struk lengkap untuk WhatsApp
   */
  const generateShareText = () => {
    let msg = `*${headerTitle.toUpperCase()}*\n`;
    if (headerAddress) msg += `${headerAddress}\n`;
    if (headerPhone) msg += `Telp: ${headerPhone}\n`;
    msg += `--------------------------------\n`;
    msg += `*No. Nota:* #${transaksi.nomorTransaksi || '-'}\n`;
    msg += `*Pelanggan:* ${transaksi.namaPelanggan}\n`;
    if (transaksi.alamat) msg += `*Alamat:* ${transaksi.alamat}\n`;
    msg += `*Tgl Masuk:* ${formatDateIndo(transaksi.tanggalMasuk, true)}\n`;
    if (transaksi.tanggalSelesai) {
      msg += `*Est. Selesai:* ${formatDateIndo(transaksi.tanggalSelesai)}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `*Rincian Cucian:*\n`;

    const items = Array.isArray(transaksi.items) && transaksi.items.length > 0 ? transaksi.items : [];
    if (items.length > 0) {
      items.forEach((it) => {
        msg += `• ${it?.namaLayanan || 'Layanan'}\n  ${it?.berat || 0} ${it?.satuan || ''} x ${formatRupiah(
          it?.hargaPerKg || it?.hargaSatuan || 0
        )} = *${formatRupiah(it?.subtotal || 0)}*\n`;
      });
    } else {
      msg += `• Cucian Laundry = *${formatRupiah(transaksi.totalHarga)}*\n`;
    }

    msg += `--------------------------------\n`;
    if (transaksi.diskon && transaksi.diskon > 0) {
      msg += `Potongan Diskon: -${formatRupiah(transaksi.diskon)}\n`;
    }
    msg += `*Total Transaksi: ${formatRupiah(transaksi.totalHarga)}*\n`;
    if (transaksi.jumlahDp > 0) {
      msg += `Pembayaran Awal: ${formatRupiah(transaksi.jumlahDp)}\n`;
    }
    if (sisaBayar > 0) {
      msg += `*Sisa Pembayaran: ${formatRupiah(sisaBayar)}*\n`;
    }
    msg += `*Status: ${statusFinal}*\n`;
    if (transaksi.metodePembayaran) {
      msg += `Metode: ${transaksi.metodePembayaran}${
        transaksi.metodePembayaranDetail ? ` (${transaksi.metodePembayaranDetail})` : ''
      }\n`;
    }
    if (transaksi.catatan) {
      msg += `\n*Catatan:* ${transaksi.catatan}\n`;
    }
    if (settings.footerStruk) {
      msg += `\n${settings.footerStruk}\n`;
    }
    return msg;
  };

  /**
   * Mengambil gambar struk ON-DEMAND langsung dari elemen yang tampil di layar
   * (id="printable-receipt-area" / "printable-receipt") dengan skipFonts: true & cacheBust: true
   */
  const captureReceiptImage = async (): Promise<{
    blob: Blob;
    file: File;
    dataUrl: string;
    fileName: string;
  } | null> => {
    const safeName = (transaksi.namaPelanggan || 'Pelanggan').replace(/[^a-zA-Z0-9]/g, '_');
    const safeInv = (transaksi.nomorTransaksi || '001').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Struk_${safeName}_${safeInv}.png`;

    // 1. Ambil langsung elemen struk yang sedang tampil di layar jika ada
    const node =
      document.getElementById('printable-receipt-area') ||
      document.getElementById('printable-receipt');

    try {
      let blob: Blob;
      let dataUrl: string;

      if (node) {
        dataUrl = await toPng(node as HTMLElement, {
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: true,
          style: { transform: 'none' },
        });
        const res = await fetch(dataUrl);
        blob = await res.blob();
      } else {
        blob = await generateReceiptBlob(
          transaksi,
          settings,
          laundryName,
          laundryAddress,
          laundryPhone
        );
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Gagal membaca gambar struk'));
          reader.readAsDataURL(blob);
        });
      }

      const file = new File([blob], fileName, { type: 'image/png' });

      // Salin ke clipboard perangkat jika didukung
      try {
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
        }
      } catch {
        // clipboard write optional di beberapa browser
      }

      return { blob, file, dataUrl, fileName };
    } catch (err) {
      console.error('[ShareReceiptModal] Gagal mengambil gambar struk:', err);
      showStatus('Gagal memproses gambar struk. Coba gunakan fitur Salin Teks.', 'error');
      return null;
    }
  };

  /**
   * Berbagi gambar struk ke WhatsApp / WA Business
   */
  const handleShareWhatsAppImage = async (variant: 'regular' | 'business') => {
    setIsProcessing(true);
    setProcessingAction(variant === 'business' ? 'wa-business' : 'wa-regular');

    const result = await captureReceiptImage();
    if (!result) {
      setIsProcessing(false);
      setProcessingAction(null);
      return;
    }

    const { file, dataUrl, fileName } = result;
    const shareTitle = `${headerTitle} - Struk #${transaksi.nomorTransaksi || ''}`;
    const waCaption = generateShareText();

    // Jalur Utama: Web Share API pada HP / Ponsel
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (nav?.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
      try {
        await nav.share({
          files: [file],
          title: shareTitle,
          text: waCaption,
        });
        showStatus('Struk berhasil dibagikan ke WhatsApp!', 'success');
        setIsProcessing(false);
        setProcessingAction(null);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setIsProcessing(false);
          setProcessingAction(null);
          return;
        }
      }
    }

    // Jalur Cadangan (Desktop / Laptop): Unduh file gambar otomatis lalu buka chat WA
    triggerFileDownload(dataUrl, fileName);
    openWhatsAppChat(customerPhoneClean, waCaption, variant);
    showStatus(
      'Gambar struk telah disalin ke clipboard & diunduh! Tekan Tempel (Ctrl+V) di chat WhatsApp.',
      'success'
    );
    setIsProcessing(false);
    setProcessingAction(null);
  };

  /**
   * Bagikan gambar ke aplikasi lain (Telegram, Drive, Gmail, dll)
   */
  const handleNativeShare = async () => {
    setIsProcessing(true);
    setProcessingAction('native-share');

    const result = await captureReceiptImage();
    if (!result) {
      setIsProcessing(false);
      setProcessingAction(null);
      return;
    }

    const { file, dataUrl, fileName } = result;
    const shareTitle = `${headerTitle} - Struk #${transaksi.nomorTransaksi || ''}`;
    const waCaption = generateShareText();

    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (nav?.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
      try {
        await nav.share({
          files: [file],
          title: shareTitle,
          text: waCaption,
        });
        showStatus('Struk berhasil dibagikan!', 'success');
        setIsProcessing(false);
        setProcessingAction(null);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setIsProcessing(false);
          setProcessingAction(null);
          return;
        }
      }
    }

    // Fallback simpan file
    triggerFileDownload(dataUrl, fileName);
    showStatus('Gambar struk telah disimpan di perangkat Anda & disalin ke clipboard.', 'success');
    setIsProcessing(false);
    setProcessingAction(null);
  };

  /**
   * Simpan file gambar PNG ke galeri/penyimpanan
   */
  const handleDownloadPNG = async () => {
    setIsProcessing(true);
    setProcessingAction('download');

    const result = await captureReceiptImage();
    if (!result) {
      setIsProcessing(false);
      setProcessingAction(null);
      return;
    }

    triggerFileDownload(result.dataUrl, result.fileName);
    showStatus(`Gambar ${result.fileName} berhasil disimpan!`, 'success');
    setIsProcessing(false);
    setProcessingAction(null);
  };

  /**
   * Salin rincian teks nota ke clipboard
   */
  const handleCopyText = async () => {
    try {
      const text = generateShareText();
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      showStatus('Teks nota berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      showStatus('Gagal menyalin teks ke clipboard.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header Modal */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#800000]/10 text-[#800000] flex items-center justify-center font-bold shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Bagikan Gambar Struk
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">
                #{transaksi.nomorTransaksi || 'Nota'} · {transaksi.namaPelanggan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pesan Status Banner Lokal */}
        {statusMessage && (
          <div
            className={`mx-4 mt-3 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border border-emerald-700'
                : statusMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border border-rose-700'
                : 'bg-slate-900 text-slate-100 border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span className="leading-snug truncate">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded ml-2 shrink-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Daftar Tombol Aksi */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto">
          {/* 1. Share WhatsApp Biasa */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleShareWhatsAppImage('regular')}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50 text-left transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {isProcessing && processingAction === 'wa-regular' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <span>Share Gambar ke WhatsApp</span>
                {customerPhoneClean && (
                  <span className="text-[11px] text-emerald-700 font-mono truncate">
                    · +{customerPhoneClean}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 truncate">
                Foto langsung nota layar & buka dialog kirim WhatsApp
              </p>
            </div>
          </button>

          {/* 2. Share WA Business */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleShareWhatsAppImage('business')}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {isProcessing && processingAction === 'wa-business' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Briefcase className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <span>Share Gambar ke WA Business</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Kirim foto struk langsung ke aplikasi WhatsApp Business
              </p>
            </div>
          </button>

          {/* 3. Bagikan ke Aplikasi Lain (Web Share API) */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleNativeShare}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 border-slate-100 hover:border-[#800000]/30 hover:bg-slate-50 text-left transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {isProcessing && processingAction === 'native-share' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                Bagikan ke Aplikasi Lain
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Kirim file foto struk ke Telegram, Gmail, Drive, dll
              </p>
            </div>
          </button>

          {/* 4. Simpan Gambar PNG */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleDownloadPNG}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 text-left transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {isProcessing && processingAction === 'download' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                Simpan Gambar Struk (PNG)
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Unduh file gambar struk resolusi tinggi ke galeri perangkat
              </p>
            </div>
          </button>

          {/* 5. Salin Teks Nota Ringkas */}
          <button
            type="button"
            onClick={handleCopyText}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-left transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {copiedText ? (
                <Check className="w-5 h-5 text-emerald-300" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                {copiedText ? 'Teks Nota Disalin!' : 'Salin Teks Nota'}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Salin rincian teks nota ke clipboard untuk ditempel
              </p>
            </div>
          </button>
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 tabular-nums">
            Total: <strong className="text-slate-900">{formatRupiah(transaksi.totalHarga)}</strong> ·{' '}
            <span
              className={
                statusFinal === 'LUNAS'
                  ? 'text-emerald-700 font-bold'
                  : 'text-rose-700 font-bold'
              }
            >
              {statusFinal}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
