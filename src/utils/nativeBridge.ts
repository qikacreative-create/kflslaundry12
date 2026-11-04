import { Transaksi, SettingsData } from '../types';
import { formatDateIndo, formatReceiptDate } from './formatters';
import { generateFormattedReceiptText, generateEscPosReceiptBytes } from './receiptFormatter';
import { getLogoBase64, convertBase64ToEscPosRaster } from './logoHelper';
import { DEFAULT_KAFELA_LOGO_BASE64 } from './defaultLogo';
import {
  cetakViaWebBluetooth,
  pairBluetoothPrinterDirectly as pairPrinterDirectly,
  KNOWN_PRINTER_SERVICES as KNOWN_SERVICES,
  KNOWN_PRINTER_CHARACTERISTICS as KNOWN_CHARACTERISTICS,
} from './printer';

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
       * Metode Khusus Kasir Laundry (22 Parameter Istilah Laundry Asli)
       */
      prosesCetakLaundry?: (
        rincianCucian: string,
        namaPelanggan: string,
        layananUtama: string,
        hargaLayananUtama: number,
        layananTambahan: string,
        hargaLayananTambahan: number,
        lokasiOutlet: string,
        tanggalTransaksi: string,
        estimasiSelesai: number,
        totalTarif: number,
        nominalDibayar: number,
        nominalDiskon: number,
        dpDibayar: number,
        isLunas: boolean,
        noNota: string,
        catatanTambahan: string,
        metodeBayar: string,
        isSelesaiDiambil: boolean,
        namaLaundry: string,
        namaKasir: string,
        logoBase64: string,
        ttdBase64: string
      ) => void;

      /**
       * Metode Kompatibilitas Mundur (dengan alias istilah laundry)
       */
      prosesCetakBluetooth?: (
        rincianCucian: string,
        namaPelanggan: string,
        layananUtama: string,
        hargaLayananUtama: number,
        layananTambahan: string,
        hargaLayananTambahan: number,
        lokasiOutlet: string,
        tanggalTransaksi: string,
        estimasiSelesai: number,
        totalTarif: number,
        nominalDibayar: number,
        nominalDiskon: number,
        dpDibayar: number,
        isLunas: boolean,
        noNota: string,
        catatanTambahan: string,
        metodeBayar: string,
        isSelesaiDiambil: boolean,
        namaLaundry?: string,
        namaKasir?: string,
        logoBase64?: string,
        ttdBase64?: string
      ) => void;

      cetakStrukDariWeb?: (
        rincianCucian: string,
        namaPelanggan: string,
        layananUtama: string,
        hargaLayananUtama: number,
        layananTambahan: string,
        hargaLayananTambahan: number,
        lokasiOutlet: string,
        tanggalTransaksi: string,
        estimasiSelesai: number,
        totalTarif: number,
        nominalDibayar: number,
        nominalDiskon: number,
        dpDibayar: number,
        isLunas: boolean,
        noNota: string,
        catatanTambahan: string,
        metodeBayar: string,
        isSelesaiDiambil: boolean
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
      if (settings.useLogo !== false) {
        logoBase64 =
          preloadedLogoBase64 !== undefined && preloadedLogoBase64 !== ''
            ? preloadedLogoBase64
            : (await getLogoBase64(settings)) || DEFAULT_KAFELA_LOGO_BASE64;
      }

      // 1. Generate teks lengkap 32 karakter yang susunan posisinya 100% sama dengan preview
      const fullReceiptText = generateFormattedReceiptText(
        transaksi,
        settings,
        laundryName,
        laundryAddress,
        laundryPhone
      );

      // 1. Prioritas Utama: Jika APK mendukung pengiriman biner ESC/POS langsung (100% plek ketiplek bit-by-bit dengan Web)
      if (typeof window.MesinPrint.cetakEscPosBase64 === 'function') {
        try {
          let logoRaster: Uint8Array | null = null;
          if (logoBase64) {
logoRaster = await convertBase64ToEscPosRaster(logoBase64, 240);
          }
          const escPosBytes = generateEscPosReceiptBytes(
            transaksi,
            settings,
            laundryName,
            laundryAddress,
            laundryPhone,
            logoRaster
          );
          let binary = '';
          for (let i = 0; i < escPosBytes.length; i++) {
            binary += String.fromCharCode(escPosBytes[i]);
          }
          const base64EscPos = btoa(binary);
          window.MesinPrint.cetakEscPosBase64(base64EscPos);
          return { success: true, message: 'Struk biner ESC/POS berhasil dicetak lewat Bluetooth APK!' };
        } catch (rawErr) {
          console.warn('[NativeBridge] cetakEscPosBase64 gagal, beralih ke cetakTeksStruk:', rawErr);
        }
      }

      // 2. Prioritas Kedua: cetakTeksStruk (Metode Teks Terformat di WebPrintInterface Kotlin)
      if (typeof window.MesinPrint.cetakTeksStruk === 'function') {
        try {
          window.MesinPrint.cetakTeksStruk(fullReceiptText, logoBase64);
        } catch {
          window.MesinPrint.cetakTeksStruk(fullReceiptText);
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

      // 3. Jika APK menggunakan prosesCetakLaundry atau prosesCetakBluetooth (metode 22 parameter)
      const cetak22Method = window.MesinPrint.prosesCetakLaundry || window.MesinPrint.prosesCetakBluetooth;
      if (typeof cetak22Method === 'function') {
        const isLunas = transaksi.statusPembayaran === 'Lunas';
        const items = Array.isArray(transaksi.items) ? transaksi.items : [];

        // Susun rincian cucian laundry per baris sesuai nota
        const rincianCucian =
          items.length > 0
            ? items
                .map((it) => `${it.namaLayanan}\n  ${it.berat} ${it.satuan} x ${it.hargaPerKg} = Rp ${it.subtotal}`)
                .join('\n')
            : 'Cucian Laundry';

        const firstItem = items[0];
        const hargaLayananUtama = firstItem?.subtotal || transaksi.totalHarga;
        const restItems = items.slice(1);
        const layananTambahan = restItems
          .map((it) => `${it.namaLayanan} (${it.berat} ${it.satuan})`)
          .join(', ');
        const hargaLayananTambahan = restItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);

        const namaLaundry = laundryName || settings.headerStruk || "Kafela's Laundry";
        const address = laundryAddress || settings.address || '';
        const phone = laundryPhone || settings.phoneNumber || '';
        const lokasiOutlet = [address, phone ? `Telp: ${phone}` : ''].filter(Boolean).join(' - ') || 'Outlet Laundry';
        const tanggalTransaksiStr = formatReceiptDate(transaksi.tanggalMasuk, true);
        const estimasiSelesaiCuci = transaksi.tanggalSelesai || transaksi.tanggalMasuk;
        const nominalDibayar = isLunas ? transaksi.totalHarga : transaksi.jumlahDp || 0;
        const dpDibayar = transaksi.jumlahDp || 0;

        // Susun Catatan, Syarat Ketentuan Laundry, dan Chatty Footer
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
        const catatanTambahan = footerLines.join('\n');

        cetak22Method(
          rincianCucian,
          transaksi.namaPelanggan || 'Pelanggan',
          firstItem?.namaLayanan || 'Laundry',
          hargaLayananUtama,
          layananTambahan,
          hargaLayananTambahan,
          lokasiOutlet,
          tanggalTransaksiStr,
          estimasiSelesaiCuci,
          transaksi.totalHarga,
          nominalDibayar,
          0,
          dpDibayar,
          isLunas,
          transaksi.nomorTransaksi || '-',
          catatanTambahan,
          transaksi.metodePembayaran || 'Tunai',
          transaksi.status === 'Diambil',
          namaLaundry,
          transaksi.dikerjakanOleh || 'Kasir',
          logoBase64,
          ''
        );
        return { success: true, message: 'Struk berhasil dikirim ke printer Bluetooth APK via metode parameter laundry!' };
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
}> {
  return pairPrinterDirectly();
}

/**
 * Cetak langsung via Web Bluetooth API (diselaraskan 100% dengan Android StrukHelper.kt)
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
  return cetakViaWebBluetooth(
    transaksi,
    settings,
    laundryName,
    laundryAddress,
    laundryPhone,
    forcePicker,
    onProgress
  );
}


