import { Transaksi, SettingsData } from '../types';
import { getLogoBase64, convertBase64ToEscPosRaster } from './logoHelper';
import { DEFAULT_KAFELA_LOGO_BASE64 } from './defaultLogo';
import { generateFormattedReceiptText, generateEscPosReceiptBytes } from './receiptFormatter';

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
  const server = device.gatt?.connected ? device.gatt : await device.gatt.connect();
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

// Export konversi raster logo dengan kanvas 384-dot
export { convertBase64ToEscPosRaster };

/**
 * Formatter Perintah ESC/POS Standar (32 Karakter per Baris)
 * 100% PERSIS susunannya dengan Android APK (StrukHelper.kt) dan Preview Struk
 */
export function buildEscPosReceipt(
  transaksi: Transaksi,
  settings: SettingsData,
  laundryName?: string,
  laundryAddress?: string,
  laundryPhone?: string
): string {
  return generateFormattedReceiptText(
    transaksi,
    settings,
    laundryName,
    laundryAddress,
    laundryPhone
  );
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
    // Siapkan raster logo monokrom 240px (jika logo diaktifkan)
    let logoRaster: Uint8Array | null = null;
    if (settings.useLogo !== false) {
      try {
        let logoB64 = '';
        if (settings.useLogo && settings.logoPath) {
          logoB64 = await getLogoBase64(settings);
        }
        if (!logoB64) {
          logoB64 = DEFAULT_KAFELA_LOGO_BASE64;
        }
        if (logoB64) {
          logoRaster = await convertBase64ToEscPosRaster(logoB64, 240);
        }
      } catch (logoErr) {
        console.warn('Gagal memproses raster logo Web Bluetooth:', logoErr);
      }
    }

    // Susun payload biner ESC/POS lengkap yang 100% identik ("plek ketiplek") dengan cetak fisik StrukHelper di APK
    const rawBytes = generateEscPosReceiptBytes(
      transaksi,
      settings,
      laundryName,
      laundryAddress,
      laundryPhone,
      logoRaster
    );


    let activeChar: any = null;
    const savedName = typeof window !== 'undefined' ? localStorage.getItem('saved_bt_printer_name') : null;
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('saved_bt_printer_id') : null;
    const hasPreviousPrinter = Boolean(cachedBluetoothDevice || savedName || savedId);

    // 2. ZERO-PROMPT AUTO-RECONNECT: JIKA SUDAH PERNAH PRINT, GUNAKAN ITU SAJA (JANGAN TANYA LAGI)
    if (!forcePicker) {
      // Prioritas A: Gunakan perangkat printer yang tersimpan di memori sesi aktif
      if (cachedBluetoothDevice?.gatt) {
        targetDeviceName = cachedBluetoothDevice.name || savedName || targetDeviceName;
        try {
          if (cachedBluetoothDevice.gatt.connected && cachedCharacteristic) {
            activeChar = cachedCharacteristic;
          } else {
            onProgress?.(`Menghubungkan ke ${targetDeviceName}...`);
            if (!cachedBluetoothDevice.gatt.connected) {
              await cachedBluetoothDevice.gatt.connect();
            }
            activeChar = await findWriteCharacteristic(cachedBluetoothDevice);
            cachedCharacteristic = activeChar;
          }
        } catch (memErr) {
          console.warn('[WebBluetooth] Percobaan 1 reconnect memori gagal, mencoba 1x lagi:', memErr);
          try {
            await new Promise((r) => setTimeout(r, 350));
            if (!cachedBluetoothDevice.gatt.connected) {
              await cachedBluetoothDevice.gatt.connect();
            }
            activeChar = await findWriteCharacteristic(cachedBluetoothDevice);
            cachedCharacteristic = activeChar;
          } catch (retryErr) {
            console.warn('[WebBluetooth] Reconnect memori gagal:', retryErr);
          }
        }
      }

      // Prioritas B: Gunakan navigator.bluetooth.getDevices() jika browser mendukung (misal setelah refresh)
      if (!activeChar && typeof nav.bluetooth?.getDevices === 'function') {
        try {
          const grantedDevices = await nav.bluetooth.getDevices();
          let matched = grantedDevices.find(
            (d: any) => (savedId && d.id === savedId) || (savedName && d.name === savedName)
          );
          if (!matched && grantedDevices.length === 1 && savedName) {
            matched = grantedDevices[0];
          }

          if (matched?.gatt) {
            targetDeviceName = matched.name || savedName || targetDeviceName;
            onProgress?.(`Menghubungkan ke ${targetDeviceName}...`);
            if (!matched.gatt.connected) {
              await matched.gatt.connect();
            }
            activeChar = await findWriteCharacteristic(matched);
            cachedBluetoothDevice = matched;
            cachedCharacteristic = activeChar;
          }
        } catch (getDevErr) {
          console.warn('[WebBluetooth] getDevices() gagal:', getDevErr);
        }
      }

      // JIKA PRINTER SUDAH PERNAH DIPILIH TETAPI HARDWARE MATI / TIDAK MERESPONS:
      // JANGAN PERNAH MUNCULKAN POP-UP PILIH PRINTER SECARA PAKSA!
      if (!activeChar && hasPreviousPrinter) {
        return {
          success: false,
          message: `Printer '${targetDeviceName}' tidak merespons. Pastikan printer MENYALA dan Bluetooth aktif. (Klik tombol 'Ganti' di atas jika ingin memilih printer lain)`,
        };
      }
    }

    // 3. Hanya buka dialog pemilih printer jika BELUM PERNAH ADA PRINTER yang dipilih sama sekali,
    // atau jika kasir secara sengaja menekan tombol 'Ganti' (forcePicker = true)
    if (!activeChar) {
      onProgress?.('Silakan pilih printer Bluetooth Anda...');
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PRINTER_SERVICES,
      });

      if (!device || !device.gatt) {
        return { success: false, message: 'Gagal memilih printer Bluetooth.' };
      }

      targetDeviceName = device.name || 'Printer Bluetooth';
      onProgress?.(`Menghubungkan ke ${targetDeviceName}...`);

      if (!device.gatt.connected) {
        await device.gatt.connect();
      }
      activeChar = await findWriteCharacteristic(device);
      cachedBluetoothDevice = device;
      cachedCharacteristic = activeChar;

      try {
        device.addEventListener('gattserverdisconnected', () => {
          console.log('[WebBluetooth] Printer Bluetooth terputus / standby.');
          cachedCharacteristic = null;
        });
      } catch {}

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
