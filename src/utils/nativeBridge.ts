import { Transaksi, SettingsData } from '../types';
import { formatDateIndo, formatReceiptDate } from './formatters';
import { generateFormattedReceiptText, generateEscPosReceiptBytes } from './receiptFormatter';

import { getLogoBase64, convertBase64ToEscPosRaster } from './logoHelper';

declare global {
  interface Window {
    MesinPrint?: {
      /**
       * Metode Standar Cetak: print(data, logoBase64?)
       */
      print?: (data?: any, logoBase64?: string) => void;

      /**
       * Metode Baru Rekomendasi: Menerima teks nota lengkap yang sudah terformat
       * persis sama dengan preview (32 karakter per baris), beserta logo opsional.
       */
      cetakTeksStruk?: (rawText: string, logoBase64?: string) => void;

      /**
       * Cetak Logo Terpisah jika didukung APK
       */
      cetakLogoBluetooth?: (logoBase64: string) => void;

      /**
       * Metode Biner ESC/POS langsung (Base64)
       */
      cetakEscPosBase64?: (base64EscPos: string) => void;

      /**
       * Metode Kompatibilitas Mundur (22 Parameter)
       */
      prosesCetakBluetooth?: (
        namaAcara: string,
        namaKlien: string,
        paketDipilih: string,
        hargaPaketDasar: number,
        namaTambahan: string,
        hargaTambahan: number,
        lokasi: string,
        tanggalBayar: string,
        waktuEvent: number,
        totalTarif: number,
        nominalDibayar: number,
        nominalDiskon: number,
        dpDibayar: number,
        isLunas: boolean,
        noStruk: string,
        catatan: string,
        metodeBayar: string,
        isArsip: boolean,
        namaBrand: string,
        namaAdmin: string,
        logoBase64: string,
        ttdBase64: string
      ) => void;

      cetakStrukDariWeb?: (
        namaAcara: string,
        namaKlien: string,
        paketDipilih: string,
        hargaPaketDasar: number,
        namaTambahan: string,
        hargaTambahan: number,
        lokasi: string,
        tanggalBayar: string,
        waktuEvent: number,
        totalTarif: number,
        nominalDibayar: number,
        nominalDiskon: number,
        dpDibayar: number,
        isLunas: boolean,
        noStruk: string,
        catatan: string,
        metodeBayar: string,
        isArsip: boolean
      ) => void;

      keluarAplikasi?: () => void;
      resetPrinter?: () => void;
      gantiPrinter?: () => void;
    };
    WebAppInterface?: any;
  }
}

/**
 * Cek apakah aplikasi web sedang dibuka di dalam WebView Android yang memiliki interface MesinPrint
 */
export function isAndroidPrintAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const bridge = window.MesinPrint;
  if (!bridge) return false;

  return (
    typeof bridge.print === 'function' ||
    typeof bridge.cetakTeksStruk === 'function' ||
    typeof bridge.prosesCetakBluetooth === 'function' ||
    typeof (bridge as any).cetakStrukDariWeb === 'function'
  );
}

/**
 * Preload gambar logo ke Base64 agar siap dicetak seketika oleh printer Bluetooth
 */
export async function preloadLogoBase64(logoPath?: string | null): Promise<string> {
  if (!logoPath || !logoPath.trim()) {
    return '';
  }
  const dummySettings = {
    useLogo: true,
    logoPath: logoPath.trim(),
  } as SettingsData;
  return getLogoBase64(dummySettings);
}

/**
 * Kirim data transaksi langsung ke Printer Bluetooth fisik Android melalui interface MesinPrint
 * dengan susunan dan posisi yang 100% SAMA dengan tampilan Preview di aplikasi,
 * TERMASUK LOGO TOKO FISIK di bagian atas nota!
 */
export async function printViaAndroidBluetooth(
  transaksi: Transaksi,
  settings: SettingsData,
  laundryName?: string,
  laundryAddress?: string,
  laundryPhone?: string,
  preloadedLogoBase64?: string
): Promise<{ success: boolean; message: string }> {
  // Pastikan pemanggilan window.MesinPrint dibungkus dalam kondisi yang aman
  if (typeof window !== 'undefined' && window.MesinPrint) {
    try {
      // Dapatkan Base64 logo toko secara instan (100% siap tanpa delay)
      let logoBase64 = '';
      if (settings.useLogo && settings.logoPath) {
        logoBase64 = preloadedLogoBase64 !== undefined ? preloadedLogoBase64 : await getLogoBase64(settings);
      }

      // 1. Generate teks lengkap 32 karakter yang susunan posisinya 100% sama dengan preview
      const fullReceiptText = generateFormattedReceiptText(
        transaksi,
        settings,
        laundryName,
        laundryAddress,
        laundryPhone
      );

      // 1. Prioritaskan cetakTeksStruk (Metode 1 Rekomendasi Utama di WebPrintInterface Kotlin)
      if (typeof window.MesinPrint.cetakTeksStruk === 'function') {
        try {
          window.MesinPrint.cetakTeksStruk(fullReceiptText);
        } catch {
          window.MesinPrint.cetakTeksStruk(fullReceiptText, logoBase64);
        }
        return { success: true, message: 'Struk berhasil dicetak lewat socket Bluetooth APK!' };
      }

      // 2. Jika APK mendukung interface print(...) langsung
      if (typeof window.MesinPrint.print === 'function') {
        try {
          window.MesinPrint.print(fullReceiptText, logoBase64);
        } catch {
          window.MesinPrint.print(fullReceiptText);
        }
        return { success: true, message: 'Struk berhasil dikirim ke printer Bluetooth APK!' };
      }

      // 3. Jika APK menggunakan prosesCetakBluetooth (metode 22 parameter)
      if (typeof window.MesinPrint.prosesCetakBluetooth === 'function') {
        const isLunas = transaksi.statusPembayaran === 'Lunas';
        const items = Array.isArray(transaksi.items) ? transaksi.items : [];

        // Susun ringkasan item yang rapi per baris sesuai preview
        const itemsDesc =
          items.length > 0
            ? items
                .map((it) => `${it.namaLayanan}\n  ${it.berat} ${it.satuan} x ${it.hargaPerKg} = Rp ${it.subtotal}`)
                .join('\n')
            : 'Cucian Laundry';

        const firstItem = items[0];
        const firstItemPrice = firstItem?.subtotal || transaksi.totalHarga;
        const restItems = items.slice(1);
        const restDesc = restItems
          .map((it) => `${it.namaLayanan} (${it.berat} ${it.satuan})`)
          .join(', ');
        const restPrice = restItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);

        const brand = laundryName || settings.headerStruk || "Kafela's Laundry";
        const address = laundryAddress || settings.address || '';
        const phone = laundryPhone || settings.phoneNumber || '';
        const lokasi = [address, phone ? `Telp: ${phone}` : ''].filter(Boolean).join(' - ') || 'Outlet Laundry';
        const tanggalBayarStr = formatReceiptDate(transaksi.tanggalMasuk, true);
        const waktuEvent = transaksi.tanggalSelesai || transaksi.tanggalMasuk;
        const nominalDibayar = isLunas ? transaksi.totalHarga : transaksi.jumlahDp || 0;
        const dpDibayar = transaksi.jumlahDp || 0;

        // Susun Catatan, Footer Struk (Syarat & Ketentuan), dan Chatty Footer
        const footerLines: string[] = [];
        if (transaksi.catatan && transaksi.catatan.trim()) {
          footerLines.push(`Catatan: ${transaksi.catatan.trim()}`);
        }
        if (settings.footerStruk && settings.footerStruk.trim()) {
          footerLines.push(settings.footerStruk.trim());
        }
        if (settings.chattyFooter && settings.chattyFooter.trim()) {
          footerLines.push(settings.chattyFooter.trim());
        }
        const combinedCatatanAndFooter = footerLines.join('\n');

        window.MesinPrint.prosesCetakBluetooth(
          itemsDesc,
          transaksi.namaPelanggan || 'Pelanggan',
          firstItem?.namaLayanan || 'Laundry',
          firstItemPrice,
          restDesc,
          restPrice,
          lokasi,
          tanggalBayarStr,
          waktuEvent,
          transaksi.totalHarga,
          nominalDibayar,
          0,
          dpDibayar,
          isLunas,
          transaksi.nomorTransaksi || '-',
          combinedCatatanAndFooter,
          transaksi.metodePembayaran || 'Tunai',
          transaksi.status === 'Diambil',
          brand,
          transaksi.dikerjakanOleh || 'Kasir',
          logoBase64,
          ''
        );
        return { success: true, message: 'Struk berhasil dikirim ke printer Bluetooth via prosesCetakBluetooth!' };
      }


      return {
        success: false,
        message: 'Layanan antarmuka MesinPrint di APK tidak memiliki metode cetak yang dikenali.',
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Gagal mencetak lewat MesinPrint Android:', error);
      return {
        success: false,
        message: `Gagal mencetak via Bluetooth APK: ${errMsg}`,
      };
    }
  } else {
    return {
      success: false,
      message: 'Antarmuka cetak printer native APK Android (window.MesinPrint) tidak terdeteksi.',
    };
  }
}

// Cached Web Bluetooth device and characteristic for zero-prompt auto-reconnect
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedBluetoothDevice: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedCharacteristic: any = null;

export const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
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

/**
 * Ambil nama dan ID printer Bluetooth yang saat ini tersimpan di memori / localStorage
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
 * Mencari characteristic yang mendukung operasi penulisan (write)
 * menggunakan daftar universal KNOWN_PRINTER_SERVICES & KNOWN_PRINTER_CHARACTERISTICS
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * Formatter Format ESC/POS (Maksimal 32 Karakter per Baris)
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

  const namaBrand = laundryName || settings.headerStruk || "Kafelas Laundry";
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
        const subLine = `  ${it.berat || 0} ${it.satuan || ''} x ${it.hargaPerKg || it.hargaSatuan || 0} = Rp ${(it.subtotal || 0).toLocaleString('id-ID')}\n`;
        return itemLine + subLine;
      })
      .join('');
  } else {
    itemsSection = `Layanan : Cucian Laundry\nTotal   : Rp ${totalTarif.toLocaleString('id-ID')}\n`;
  }

  return [
    '\x1B\x40',         // 1. Reset/Init printer
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
 * Sandingkan printer Bluetooth baru secara langsung (misal dari menu Pengaturan / tombol Ganti)
 */
export async function pairBluetoothPrinterDirectly(): Promise<{
  success: boolean;
  message: string;
  printerName?: string;
}> {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return {
      success: false,
      message: 'Web Bluetooth memerlukan koneksi aman (HTTPS). Pastikan situs diakses melalui HTTPS.',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (!nav?.bluetooth || typeof nav.bluetooth.requestDevice !== 'function') {
    return {
      success: false,
      message: 'Browser Anda tidak mendukung Web Bluetooth. Buka lewat Google Chrome di Android/PC atau gunakan aplikasi APK.',
    };
  }

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
      errorMsg.includes('Bluetooth adapter not available') ||
      errorMsg.includes('Bluetooth is not enabled') ||
      errorMsg.includes('adapter is off')
    ) {
      return {
        success: false,
        message: 'Bluetooth pada perangkat Anda belum aktif. Silakan nyalakan Bluetooth lalu coba lagi.',
      };
    }
    return { success: false, message: `Gagal menyambungkan printer: ${errorMsg}` };
  }
}

/**
 * Cetak langsung via Web Bluetooth API dengan:
 * 1. Zero-Prompt Auto-Reconnect: Jika printer sudah pernah tersimpan, langsung cetak tanpa dialog.
 * 2. Trik Chunking 64-Byte dengan jeda 25ms (Anti-Buffer Overflow)
 */
export async function printViaWebBluetooth(
  transaksi: Transaksi,
  settings: SettingsData,
  laundryName?: string,
  laundryAddress?: string,
  laundryPhone?: string,
  forcePicker = false,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; message: string; printerName?: string }> {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return {
      success: false,
      message: 'Web Bluetooth memerlukan koneksi aman (HTTPS). Pastikan situs diakses melalui HTTPS.',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (!nav?.bluetooth || typeof nav.bluetooth.requestDevice !== 'function') {
    return {
      success: false,
      message: 'Browser Anda tidak mendukung Web Bluetooth. Buka lewat Google Chrome di Android/PC atau gunakan aplikasi APK.',
    };
  }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeChar: any = null;

    // 2. Coba Zero-Prompt Auto-Reconnect jika tidak dipaksa buka dialog pemilih
    if (!forcePicker) {
      try {
        // A. Gunakan cachedBluetoothDevice jika masih aktif di memori
        if (cachedBluetoothDevice?.gatt) {
          onProgress?.(`Menghubungkan ke ${targetDeviceName}...`);
          if (!cachedBluetoothDevice.gatt.connected) {
            await cachedBluetoothDevice.gatt.connect();
          }
          activeChar = await findWriteCharacteristic(cachedBluetoothDevice);
          targetDeviceName = cachedBluetoothDevice.name || targetDeviceName;
        } else if (typeof nav.bluetooth.getDevices === 'function') {
          // B. Periksa perangkat yang sudah diberi izin sebelumnya oleh browser Chrome
          const grantedDevices = await nav.bluetooth.getDevices();
          const savedId = localStorage.getItem('saved_bt_printer_id');
          const savedName = localStorage.getItem('saved_bt_printer_name');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matched = grantedDevices.find((d: any) =>
            (savedId && d.id === savedId) || (savedName && d.name === savedName)
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
        // Reset cache untuk trigger pemilihan baru
        cachedBluetoothDevice = null;
        cachedCharacteristic = null;
        activeChar = null;
        onProgress?.(
          `Printer tersimpan (${targetDeviceName}) tidak merespons (mungkin mati atau di luar jangkauan). Membuka pencarian baru...`
        );
      }
    }

    // 3. Jika belum terhubung atau dipaksa pilih baru, buka dialog pemilihan printer
    if (!activeChar) {
      onProgress?.('Silakan pilih printer Bluetooth Anda dari daftar dialog browser...');
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

      // Simpan untuk cetak otomatis berikutnya tanpa dialog
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
      errorMsg.includes('Bluetooth adapter not available') ||
      errorMsg.includes('Bluetooth is not enabled') ||
      errorMsg.includes('adapter is off')
    ) {
      return {
        success: false,
        message: 'Bluetooth pada perangkat Anda belum aktif. Silakan nyalakan Bluetooth lalu coba lagi.',
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

