import { Transaksi, SettingsData } from '../types';
import { getLogoBase64 } from './logoHelper';

// Universal Bluetooth Services & Characteristics untuk Printer Thermal Kasir
export const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Thermal Printer Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
];

export const KNOWN_PRINTER_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
];

// Cache perangkat dan karakteristik untuk zero-prompt auto reconnect
let cachedBluetoothDevice: any = null;
let cachedCharacteristic: any = null;

/**
 * Deteksi akurat ketersediaan Web Bluetooth pada lingkungan saat ini.
 * Mencegah pesan menyesatkan seperti "Gunakan Chrome" saat pengguna sudah di Chrome.
 */
export function getBluetoothDiagnostics(): {
  isSupported: boolean;
  isInIframe: boolean;
  isChrome: boolean;
  isIOS: boolean;
  message?: string;
} {
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  const isChrome =
    typeof navigator !== 'undefined' &&
    /Chrome|Chromium|CriOS/i.test(navigator.userAgent);

  let isInIframe = false;
  try {
    isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  // 1. Cek HTTPS / Secure Context
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return {
      isSupported: false,
      isInIframe,
      isChrome,
      isIOS,
      message: 'Web Bluetooth memerlukan koneksi HTTPS aman. Pastikan URL diawali https://.',
    };
  }

  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  const hasBtApi = Boolean(nav?.bluetooth && typeof nav.bluetooth.requestDevice === 'function');

  if (hasBtApi) {
    return { isSupported: true, isInIframe, isChrome, isIOS };
  }

  // 2. Jika di iOS (semua browser di iOS memakai WebKit Safari tanpa Web Bluetooth)
  if (isIOS) {
    return {
      isSupported: false,
      isInIframe,
      isChrome,
      isIOS,
      message:
        'Sistem iOS (iPhone/iPad) belum mendukung Web Bluetooth. Silakan gunakan HP Android / Laptop, atau bagikan nota via WhatsApp / Cetak Browser.',
    };
  }

  // 3. Jika berjalan di dalam iFrame (misal Preview AI Studio / iframe web lain)
  if (isInIframe) {
    return {
      isSupported: false,
      isInIframe,
      isChrome,
      isIOS,
      message:
        'Akses Bluetooth diblokir di dalam jendela pratinjau (iframe). Buka aplikasi langsung di tab baru browser Chrome agar Bluetooth dapat diakses.',
    };
  }

  // 4. Jika di Chrome namun API tidak muncul
  if (isChrome) {
    return {
      isSupported: false,
      isInIframe,
      isChrome,
      isIOS,
      message:
        'Fitur Web Bluetooth belum aktif di Chrome ini. Pastikan Bluetooth HP dinyalakan dan izin lokasi/perangkat sekitar diaktifkan pada setelan Chrome.',
    };
  }

  return {
    isSupported: false,
    isInIframe,
    isChrome,
    isIOS,
    message:
      'Browser ini tidak menyediakan Web Bluetooth API. Gunakan tombol Cetak Browser atau buka di Chrome Android / PC.',
  };
}

/**
 * Buka URL aplikasi saat ini langsung di tab baru browser (keluar dari iframe)
 */
export function openAppInStandaloneTab(): void {
  if (typeof window !== 'undefined') {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = window.location.href;
    }
  }
}

/**
 * Mengambil nama dan ID printer Bluetooth yang tersimpan di localStorage
 */
export function getSavedBluetoothPrinter(): { name: string | null; id: string | null } {
  if (typeof window === 'undefined') return { name: null, id: null };
  const name = localStorage.getItem('saved_bt_printer_name');
  const id = localStorage.getItem('saved_bt_printer_id');
  return { name, id };
}

/**
 * Putus koneksi dan lupakan printer Bluetooth tersimpan
 */
export function disconnectBluetoothPrinter(): void {
  try {
    if (cachedBluetoothDevice?.gatt?.connected) {
      cachedBluetoothDevice.gatt.disconnect();
    }
  } catch (e) {
    console.warn('Disconnect error:', e);
  }
  cachedBluetoothDevice = null;
  cachedCharacteristic = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('saved_bt_printer_name');
    localStorage.removeItem('saved_bt_printer_id');
  }
}

/**
 * Mencari karakteristik yang mendukung penulisan (write)
 * menggunakan daftar universal KNOWN_PRINTER_SERVICES & KNOWN_PRINTER_CHARACTERISTICS
 */
async function findWriteCharacteristic(device: any): Promise<any> {
  const server = await device.gatt.connect();
  let targetChar: any = null;

  // A. Cari berdasarkan kombinasi service dan characteristic yang umum pada printer kasir
  for (const sUuid of KNOWN_PRINTER_SERVICES) {
    if (targetChar) break;
    try {
      const service = await server.getPrimaryService(sUuid);
      for (const cUuid of KNOWN_PRINTER_CHARACTERISTICS) {
        try {
          const ch = await service.getCharacteristic(cUuid);
          if (ch) {
            targetChar = ch;
            break;
          }
        } catch {}
      }

      // Jika belum ketemu ID khusus, periksa setiap karakteristik di service ini
      if (!targetChar) {
        const chars = await service.getCharacteristics();
        for (const ch of chars) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            targetChar = ch;
            break;
          }
        }
      }
    } catch {}
  }

  // B. Fallback: Cari di seluruh services yang disediakan perangkat
  if (!targetChar) {
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        if (targetChar) break;
        try {
          const chars = await service.getCharacteristics();
          for (const ch of chars) {
            if (ch.properties.write || ch.properties.writeWithoutResponse) {
              targetChar = ch;
              break;
            }
          }
        } catch {}
      }
    } catch {}
  }

  if (!targetChar) {
    throw new Error('Karakteristik cetak printer tidak ditemukan.');
  }

  return targetChar;
}

/**
 * Konversi gambar logo Base64 ke perintah ESC/POS raster bit image (GS v 0)
 */
async function convertBase64ToEscPosRaster(base64: string, targetWidth = 240): Promise<Uint8Array | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = (targetWidth + 7) & ~7;
        const scale = w / img.width;
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const xL = (w / 8) & 0xff;
        const xH = ((w / 8) >> 8) & 0xff;
        const yL = h & 0xff;
        const yH = (h >> 8) & 0xff;

        const header = [0x1b, 0x61, 0x01, 0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH];
        const bytesPerRow = w / 8;
        const rasterBytes: number[] = [];

        for (let y = 0; y < h; y++) {
          for (let byteX = 0; byteX < bytesPerRow; byteX++) {
            let byteVal = 0;
            for (let bit = 0; bit < 8; bit++) {
              const pxIndex = (y * w + (byteX * 8 + bit)) * 4;
              const r = data[pxIndex];
              const g = data[pxIndex + 1];
              const b = data[pxIndex + 2];
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              if (gray < 160) {
                byteVal |= 1 << (7 - bit);
              }
            }
            rasterBytes.push(byteVal);
          }
        }

        const fullData = new Uint8Array(header.length + rasterBytes.length + 2);
        fullData.set(header, 0);
        fullData.set(rasterBytes, header.length);
        fullData.set([0x0a, 0x0a], header.length + rasterBytes.length);
        resolve(fullData);
      } catch (e) {
        console.warn('Gagal memproses raster logo:', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  });
}

/**
 * Formatter Perintah ESC/POS Standar (32 Karakter per Baris)
 * Kompatibel dengan semua printer thermal bluetooth kasir (58mm)
 */
export function buildEscPosReceipt(
  transaksi: Transaksi,
  settings: SettingsData,
  laundryName?: string,
  laundryAddress?: string,
  laundryPhone?: string
): string {
  const line = '--------------------------------\n';
  const doubleLine = '================================\n';

  const namaBrand = laundryName || settings.headerStruk || 'Kafelas Laundry';
  const noInvoice = transaksi.nomorTransaksi || 'INV-001';
  const namaAdmin = transaksi.dikerjakanOleh || 'Kasir';
  const namaKlien = transaksi.namaPelanggan || 'Pelanggan';
  const isLunas = transaksi.statusPembayaran === 'Lunas';
  const diskon = transaksi.diskon || 0;
  const totalTarif = transaksi.totalHarga;
  const dpDibayar = transaksi.jumlahDp || 0;
  const sisa = isLunas ? 0 : Math.max(0, totalTarif - dpDibayar);
  const nominalDibayar = isLunas ? totalTarif : dpDibayar;

  const items = Array.isArray(transaksi.items) && transaksi.items.length > 0 ? transaksi.items : [];
  let itemsSection = '';
  if (items.length > 0) {
    itemsSection = items
      .map((it) => {
        const itemLine = `${(it.namaLayanan || 'Layanan').slice(0, 32)}\n`;
        const subLine = `  ${it.berat || 0} ${it.satuan || ''} x ${it.hargaPerKg || it.hargaSatuan || 0} = Rp ${(
          it.subtotal || 0
        ).toLocaleString('id-ID')}\n`;
        return itemLine + subLine;
      })
      .join('');
  } else {
    itemsSection = `Layanan : Cucian Laundry\nTotal   : Rp ${totalTarif.toLocaleString('id-ID')}\n`;
  }

  return [
    '\x1B\x40',         // 1. Reset / Init printer
    '\x1B\x61\x01',     // 2. Rata Tengah (Center)
    '\x1B\x21\x10',     // 3. Teks Besar (Double Height)
    `${namaBrand.toUpperCase()}\n`,
    '\x1B\x21\x00',     // 4. Kembali Teks Normal
    'Struk Pembayaran Resmi\n',
    doubleLine,
    isLunas ? 'BUKTI PELUNASAN\n' : 'BUKTI PEMBAYARAN (DP)\n',
    line,
    '\x1B\x61\x00',     // 5. Rata Kiri
    `No.Inv  : #${noInvoice}\n`,
    `Kasir   : ${namaAdmin}\n`,
    `Klien   : ${namaKlien}\n`,
    line,
    itemsSection,
    diskon > 0 ? `Diskon  : -Rp ${diskon.toLocaleString('id-ID')}\n` : '',
    line,
    `Total   : Rp ${totalTarif.toLocaleString('id-ID')}\n`,
    `Dibayar : Rp ${nominalDibayar.toLocaleString('id-ID')}\n`,
    !isLunas ? `Sisa    : Rp ${sisa.toLocaleString('id-ID')}\n` : '',
    doubleLine,
    '\x1B\x61\x01',     // Rata Tengah
    `STATUS: ${isLunas ? 'LUNAS' : 'BELUM LUNAS'}\n\n`,
    settings.footerStruk ? `${settings.footerStruk.trim()}\n` : '',
    'Terima kasih atas kunjungannya!\n',
    'Simpan struk ini sbg bukti sah.\n',
    '\n\n\n\n',           // Feed kertas kosong sebelum sobek
  ].join('');
}

/**
 * Sandingkan printer Bluetooth baru secara langsung (dialog browser)
 */
export async function pairBluetoothPrinterDirectly(): Promise<{
  success: boolean;
  message: string;
  printerName?: string;
  isIframeBlocked?: boolean;
}> {
  const diag = getBluetoothDiagnostics();
  if (!diag.isSupported) {
    return {
      success: false,
      message: diag.message || 'Web Bluetooth tidak tersedia.',
      isIframeBlocked: diag.isInIframe,
    };
  }

  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  try {
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_PRINTER_SERVICES,
    });

    if (!device || !device.gatt) {
      return { success: false, message: 'Gagal memilih printer Bluetooth.' };
    }

    const char = await findWriteCharacteristic(device);
    cachedBluetoothDevice = device;
    cachedCharacteristic = char;

    const deviceName = device.name || 'Printer Bluetooth';
    localStorage.setItem('saved_bt_printer_name', deviceName);
    if (device.id) {
      localStorage.setItem('saved_bt_printer_id', device.id);
    }

    return {
      success: true,
      message: `Printer ${deviceName} berhasil disambungkan & disimpan otomatis!`,
      printerName: deviceName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('User cancelled') || errorMsg.includes('cancelled')) {
      return { success: false, message: 'Pemilihan printer dibatalkan oleh pengguna.' };
    }
    if (
      errorMsg.includes('permissions policy') ||
      errorMsg.includes('SecurityError') ||
      errorMsg.includes('disallowed by permissions policy')
    ) {
      return {
        success: false,
        message: 'Akses Bluetooth diblokir di dalam frame pratinjau. Silakan buka aplikasi langsung di tab baru browser Chrome.',
        isIframeBlocked: true,
      };
    }
    if (
      errorMsg.includes('Bluetooth adapter not available') ||
      errorMsg.includes('Bluetooth is not enabled') ||
      errorMsg.includes('adapter is off')
    ) {
      return {
        success: false,
        message: 'Bluetooth pada perangkat Anda belum aktif. Silakan nyalakan tombol Bluetooth lalu coba lagi.',
      };
    }
    return { success: false, message: `Gagal menyambungkan printer: ${errorMsg}` };
  }
}

/**
 * Cetak langsung via Web Bluetooth API dengan:
 * 1. Zero-Prompt Auto-Reconnect (otomatis cetak ke printer yang tersimpan tanpa dialog pop-up)
 * 2. Trik Chunking 64-Byte dengan jeda 25ms (Anti-Buffer Overflow / Teks Tidak Terpotong)
 */
export async function cetakViaWebBluetooth(
  transaksi: Transaksi,
  settings: SettingsData,
  laundryName?: string,
  laundryAddress?: string,
  laundryPhone?: string,
  forcePicker = false,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; message: string; printerName?: string; isIframeBlocked?: boolean }> {
  const diag = getBluetoothDiagnostics();
  if (!diag.isSupported) {
    return {
      success: false,
      message: diag.message || 'Web Bluetooth tidak tersedia.',
      isIframeBlocked: diag.isInIframe,
    };
  }

  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  let targetDeviceName =
    (typeof window !== 'undefined' ? localStorage.getItem('saved_bt_printer_name') : null) || 'Printer Bluetooth';

  try {
    // 1. Bangun teks perintah ESC/POS 32-karakter
    const escPosText = buildEscPosReceipt(
      transaksi,
      settings,
      laundryName,
      laundryAddress,
      laundryPhone
    );
    const encoder = new TextEncoder();
    let rawBytes: Uint8Array = encoder.encode(escPosText);

    // Jika logo toko diaktifkan dan tersedia, sisipkan raster logo di awal nota
    if (settings.useLogo && settings.logoPath) {
      try {
        const logoB64 = await getLogoBase64(settings);
        if (logoB64) {
          const logoRaster = await convertBase64ToEscPosRaster(logoB64, 240);
          if (logoRaster && logoRaster.length > 0) {
            const combined = new Uint8Array(logoRaster.length + rawBytes.length);
            combined.set(logoRaster, 0);
            combined.set(rawBytes, logoRaster.length);
            rawBytes = combined;
          }
        }
      } catch (logoErr) {
        console.warn('Gagal memuat logo untuk ESC/POS, melanjutkan teks biasa:', logoErr);
      }
    }

    let activeChar: any = null;

    // 2. Coba Zero-Prompt Auto-Reconnect jika tidak dipaksa buka dialog pemilih
    if (!forcePicker) {
      try {
        if (cachedBluetoothDevice?.gatt) {
          onProgress?.(`Menghubungkan ke ${targetDeviceName}...`);
          if (!cachedBluetoothDevice.gatt.connected) {
            await cachedBluetoothDevice.gatt.connect();
          }
          activeChar = await findWriteCharacteristic(cachedBluetoothDevice);
          targetDeviceName = cachedBluetoothDevice.name || targetDeviceName;
        } else if (typeof nav.bluetooth.getDevices === 'function') {
          const grantedDevices = await nav.bluetooth.getDevices();
          const savedId = localStorage.getItem('saved_bt_printer_id');
          const savedName = localStorage.getItem('saved_bt_printer_name');

          const matched = grantedDevices.find(
            (d: any) => (savedId && d.id === savedId) || (savedName && d.name === savedName)
          );

          if (matched && matched.gatt) {
            onProgress?.(`Menghubungkan ke printer tersimpan (${matched.name || targetDeviceName})...`);
            await matched.gatt.connect();
            activeChar = await findWriteCharacteristic(matched);
            cachedBluetoothDevice = matched;
            targetDeviceName = matched.name || targetDeviceName;
          }
        }
      } catch (autoErr) {
        console.warn('Auto-reconnect printer lama gagal:', autoErr);
        cachedBluetoothDevice = null;
        cachedCharacteristic = null;
        activeChar = null;
        onProgress?.(
          `Printer tersimpan (${targetDeviceName}) tidak merespons. Membuka pencarian baru...`
        );
      }
    }

    // 3. Jika belum terhubung atau dipaksa pilih baru, buka dialog pemilihan printer
    if (!activeChar) {
      onProgress?.('Silakan pilih printer Bluetooth Anda dari daftar...');
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PRINTER_SERVICES,
      });

      if (!device || !device.gatt) {
        return { success: false, message: 'Gagal terhubung ke printer Bluetooth yang dipilih.' };
      }

      onProgress?.(`Menghubungkan ke ${device.name || 'Printer Bluetooth'}...`);
      activeChar = await findWriteCharacteristic(device);
      cachedBluetoothDevice = device;
      targetDeviceName = device.name || 'Printer Bluetooth';

      localStorage.setItem('saved_bt_printer_name', targetDeviceName);
      if (device.id) {
        localStorage.setItem('saved_bt_printer_id', device.id);
      }
    }

    // 4. Eksekusi Pengiriman ke Bluetooth dengan Trik Chunking 64-Byte & Jeda 25ms (Anti-Buffer Overflow)
    onProgress?.(`Mengirim data struk ke ${targetDeviceName}...`);
    const chunkSize = 64;
    for (let i = 0; i < rawBytes.length; i += chunkSize) {
      const chunk = rawBytes.slice(i, i + chunkSize);
      if (activeChar.properties?.writeWithoutResponse) {
        await activeChar.writeValueWithoutResponse(chunk);
      } else {
        await activeChar.writeValue(chunk);
      }
      // Jeda 25 milidetik antar pengiriman chunk
      await new Promise((r) => setTimeout(r, 25));
    }

    return {
      success: true,
      message: `Struk berhasil dicetak ke ${targetDeviceName}!`,
      printerName: targetDeviceName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('User cancelled') || errorMsg.includes('cancelled')) {
      return { success: false, message: 'Pemilihan printer dibatalkan oleh pengguna.' };
    }
    if (
      errorMsg.includes('permissions policy') ||
      errorMsg.includes('SecurityError') ||
      errorMsg.includes('disallowed by permissions policy')
    ) {
      return {
        success: false,
        message: 'Akses Bluetooth diblokir di dalam frame pratinjau. Silakan buka aplikasi langsung di tab baru browser Chrome.',
        isIframeBlocked: true,
      };
    }
    if (
      errorMsg.includes('Bluetooth adapter not available') ||
      errorMsg.includes('Bluetooth is not enabled') ||
      errorMsg.includes('adapter is off')
    ) {
      return {
        success: false,
        message: 'Bluetooth pada perangkat Anda belum aktif. Silakan nyalakan tombol Bluetooth lalu coba lagi.',
      };
    }
    if (
      errorMsg.includes('GATT') ||
      errorMsg.includes('Connection failed') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('disconnected')
    ) {
      return {
        success: false,
        message: `Koneksi ke ${targetDeviceName} terputus atau gagal terhubung. Pastikan printer dalam keadaan HIDUP (ON) dan dalam jarak dekat.`,
      };
    }
    return { success: false, message: `Gagal cetak Bluetooth: ${errorMsg}` };
  }
}

// Alias untuk kompatibilitas
export const printViaWebBluetooth = cetakViaWebBluetooth;
