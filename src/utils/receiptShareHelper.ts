import { toBlob, toPng } from 'html-to-image';
import { openDirectWhatsAppChat, normalizeWhatsAppPhone, WhatsAppVariant } from './whatsappHelper';

/**
 * Mencari elemen preview struk di DOM dengan fallback ID yang kompatibel.
 */
function findReceiptElement(elementId: string = 'printable-receipt-area'): HTMLElement {
  let node = document.getElementById(elementId);
  if (!node) {
    node =
      document.getElementById('printable-receipt-area') ||
      document.getElementById('printable-receipt-area-share') ||
      document.getElementById('printable-receipt') ||
      (document.querySelector('[data-receipt-capture="true"]') as HTMLElement | null) ||
      (document.querySelector('#printable-receipt-area') as HTMLElement | null);
  }

  if (!node) {
    throw new Error(`Elemen struk #${elementId} tidak ditemukan di tampilan.`);
  }

  return node;
}

/**
 * 1. FUNGSI GENERATE HIGH-QUALITY PNG BLOB (html-to-image)
 * Menghasilkan biner Blob PNG jernih (pixelRatio: 2) bebas freeze/font-hang.
 */
export const generateReceiptBlob = async (
  elementId: string = 'printable-receipt-area'
): Promise<Blob> => {
  const node = findReceiptElement(elementId);

  // Konfigurasi bulletproof anti-buram & anti-freeze
  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 2,
    skipFonts: true,
    backgroundColor: '#ffffff',
    style: {
      transform: 'none',
    },
  });

  if (!blob) {
    throw new Error('Gagal merender elemen struk ke format gambar Blob PNG.');
  }

  return blob;
};

/**
 * 2. FUNGSI RENDER ELEMEN DOM KE DATA URL GAMBAR PNG (Base64)
 */
export const renderReceiptToPng = async (
  elementId: string = 'printable-receipt-area'
): Promise<string> => {
  const node = findReceiptElement(elementId);

  return await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    skipFonts: true,
    backgroundColor: '#ffffff',
    style: {
      transform: 'none',
    },
  });
};

/**
 * 3. FUNGSI DOWNLOAD BERKAS (GRACEFUL DOWNLOAD FALLBACK)
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.className = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const downloadBase64Image = (dataUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.className = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * FUNGSI SALIN GAMBAR KE CLIPBOARD PERANGKAT
 */
export const copyImageBlobToClipboard = async (blob: Blob): Promise<boolean> => {
  try {
    if (
      typeof navigator === 'undefined' ||
      !navigator.clipboard ||
      typeof navigator.clipboard.write !== 'function' ||
      typeof ClipboardItem === 'undefined'
    ) {
      return false;
    }
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
};

export interface ShareReceiptImageOptions {
  elementId?: string;
  fileName?: string;
  shareTitle?: string;
  shareText?: string;
  phoneNumber?: string;
  waVariant?: WhatsAppVariant;
  forceWhatsAppDirect?: boolean;
  onStatusChange?: (status: string | null) => void;
}

/**
 * 4. FUNGSI BAGIKAN GAMBAR STRUK (WEB SHARE API DENGAN FALLBACK UNDUHAN)
 * 
 * - Menggunakan `html-to-image` untuk menghasilkan Blob PNG resolusi tinggi secara on-demand.
 * - Membentuk File Object biner dari Blob (`image/png`).
 * - Menggunakan Web Share API (`navigator.share`) dengan dukungan files untuk integrasi native Android & iOS.
 * - Menyediakan graceful download fallback untuk browser yang tidak mendukung Web Share API berkas (PC/desktop/browser lama).
 * - Menangani pembatalan pengguna (`AbortError`) secara hening tanpa menampilkan pesan error.
 */
export const shareReceiptImage = async ({
  elementId = 'printable-receipt-area',
  fileName = 'Struk_Pembayaran.png',
  shareTitle = 'Struk Pembayaran',
  shareText = 'Berikut bukti transaksi pembayaran Anda.',
  phoneNumber = '',
  waVariant = 'universal',
  forceWhatsAppDirect = false,
  onStatusChange,
}: ShareReceiptImageOptions): Promise<boolean> => {
  let generatedBlob: Blob | null = null;

  try {
    onStatusChange?.('Menyiapkan gambar struk...');

    // A. Generate high-quality PNG Blob on-demand menggunakan html-to-image
    generatedBlob = await generateReceiptBlob(elementId);
    const file = new File([generatedBlob], fileName, { type: 'image/png' });

    // B. Cek ketersediaan Web Share API dengan validasi lampiran file
    const nav = typeof navigator !== 'undefined'
      ? (navigator as Navigator & { canShare?: (data?: ShareData) => boolean })
      : null;

    // JALUR 1: Integrasi Native Android & iOS (Chrome Mobile, Safari iOS)
    if (!forceWhatsAppDirect && nav?.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
      await nav.share({
        title: shareTitle,
        text: shareText,
        files: [file], // Melampirkan file gambar asli ke WhatsApp/Telegram/sosmed
      });

      onStatusChange?.('✓ Gambar struk berhasil dibagikan!');
      setTimeout(() => onStatusChange?.(null), 3500);
      return true;
    }

    // JALUR 2: Graceful Download Fallback (Browser Desktop / Tanpa Dukungan Web Share File)
    await copyImageBlobToClipboard(generatedBlob);
    downloadBlob(generatedBlob, fileName);

    const cleanPhone = normalizeWhatsAppPhone(phoneNumber);
    if (cleanPhone || shareText) {
      openDirectWhatsAppChat(cleanPhone, shareText, waVariant);
      onStatusChange?.('✓ Gambar struk diunduh & membuka WhatsApp (Tekan Ctrl+V untuk tempel).');
    } else {
      onStatusChange?.('✓ Gambar struk diunduh (Siap dilampirkan ke WhatsApp / medsos).');
    }
    setTimeout(() => onStatusChange?.(null), 4500);
    return false;

  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string } | undefined;

    // JALUR 3: Pengguna sengaja membatalkan popup share (klik tombol batal)
    if (errorObj?.name === 'AbortError') {
      onStatusChange?.(null); // Silent cancel, tidak menampilkan error
      return false;
    }

    // Fallback otomatis jika terjadi kegagalan tak terduga saat Web Share
    try {
      const fallbackBlob = generatedBlob || (await generateReceiptBlob(elementId));
      downloadBlob(fallbackBlob, fileName);
      if (phoneNumber) {
        openDirectWhatsAppChat(phoneNumber, shareText, waVariant);
        onStatusChange?.('✓ Gambar struk diunduh & membuka chat.');
      } else {
        onStatusChange?.('✓ Gambar struk berhasil diunduh ke perangkat.');
      }
    } catch {
      onStatusChange?.('⚠️ Gagal memproses gambar struk.');
    }
    setTimeout(() => onStatusChange?.(null), 3500);
    return false;
  }
};

/**
 * 5. FUNGSI SIMPAN GAMBAR STRUK KE PENYIMPANAN / GALERI (ON-DEMAND)
 */
export const saveReceiptImagePng = async ({
  elementId = 'printable-receipt-area',
  fileName = 'Struk_Pembayaran.png',
  onStatusChange,
}: {
  elementId?: string;
  fileName?: string;
  onStatusChange?: (status: string | null) => void;
}): Promise<string> => {
  try {
    onStatusChange?.('Membuat gambar struk...');
    const blob = await generateReceiptBlob(elementId);
    downloadBlob(blob, fileName);
    onStatusChange?.('✓ Gambar struk berhasil disimpan ke galeri/unduhan!');
    setTimeout(() => onStatusChange?.(null), 3000);
    return URL.createObjectURL(blob);
  } catch {
    onStatusChange?.('⚠️ Gagal menyimpan gambar struk.');
    setTimeout(() => onStatusChange?.(null), 3000);
    throw new Error('Gagal menyimpan gambar struk');
  }
};
