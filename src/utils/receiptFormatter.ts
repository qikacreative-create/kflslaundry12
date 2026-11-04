import { Transaksi, SettingsData } from '../types';
import { formatDateIndo, formatReceiptDate, formatNumberOnly } from './formatters';

const LINE_WIDTH = 32;

/**
 * Posisikan teks tepat di tengah (Center alignment) dengan padding spasi
 */
export function centerText(text: string, width = LINE_WIDTH): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length >= width) return trimmed;
  const leftPadding = Math.floor((width - trimmed.length) / 2);
  const rightPadding = width - trimmed.length - leftPadding;
  return ' '.repeat(leftPadding) + trimmed + ' '.repeat(rightPadding);
}

/**
 * Posisikan teks rata kiri dan rata kanan dalam 1 baris (32 karakter)
 */
export function alignLeftRight(left: string, right: string, width = LINE_WIDTH): string {
  const l = left.trim();
  const r = right.trim();
  const totalLength = l.length + r.length;
  if (totalLength >= width) {
    // Jika terlalu panjang, potong sisi kiri dan sisakan 3 titik
    const maxLeft = Math.max(4, width - r.length - 2);
    const safeLeft = l.length > maxLeft ? l.slice(0, maxLeft - 2) + '..' : l;
    const spaces = Math.max(1, width - safeLeft.length - r.length);
    return safeLeft + ' '.repeat(spaces) + r;
  }
  const spaces = width - totalLength;
  return l + ' '.repeat(spaces) + r;
}

/**
 * Bungkus teks panjang menjadi beberapa baris yang muat di lebar thermal (32 karakter)
 */
export function wrapText(text: string, width = LINE_WIDTH, align: 'center' | 'left' = 'center'): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= width) {
      currentLine += ' ' + word;
    } else {
      lines.push(align === 'center' ? centerText(currentLine, width) : currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(align === 'center' ? centerText(currentLine, width) : currentLine);
  }
  return lines;
}

/**
 * Generate teks nota lengkap 32-karakter yang 100% PERSIS posisinya dengan Preview Struk di layar
 */
export function generateFormattedReceiptText(
  transaksi: Transaksi,
  settings: SettingsData,
  laundryName?: string,
  laundryAddress?: string,
  laundryPhone?: string
): string {
  const isLunas = transaksi.statusPembayaran === 'Lunas';
  const sisaBayar = isLunas ? 0 : Math.max(0, transaksi.totalHarga - (transaksi.jumlahDp || 0));
  const statusFinal = isLunas || sisaBayar <= 0 ? 'LUNAS' : 'BELUM LUNAS';

  const brand = laundryName || settings.headerStruk || 'Kafelas Laundry';
  const address = laundryAddress || settings.address || '';
  const phone = laundryPhone || settings.phoneNumber || '';

  const divider = '--------------------------------';
  const lines: string[] = [];

  // 1. Header Toko (Center)
  for (const line of wrapText(brand.toUpperCase(), LINE_WIDTH, 'center')) {
    lines.push(line);
  }
  if (phone) {
    lines.push(centerText(phone, LINE_WIDTH));
  }
  if (address) {
    for (const line of wrapText(address, LINE_WIDTH, 'center')) {
      lines.push(line);
    }
  }

  // 2. Garis Pemisah
  lines.push(divider);

  // 3. Metadata Nota (No, Terima, Selesai, Yth. Bapak/Ibu)
  lines.push(alignLeftRight('No.', transaksi.nomorTransaksi || '-', LINE_WIDTH));
  lines.push(alignLeftRight('Terima', formatReceiptDate(transaksi.tanggalMasuk, true), LINE_WIDTH));
  if (transaksi.tanggalSelesai) {
    lines.push(alignLeftRight('Selesai', formatReceiptDate(transaksi.tanggalSelesai), LINE_WIDTH));
  }
  lines.push('Yth. Bapak/Ibu');

  // 4. Garis Pemisah
  lines.push(divider);

  // 5. Nama Pelanggan (Center) & Status Pembayaran
  const custName = (transaksi.namaPelanggan || 'Pelanggan').toUpperCase();
  for (const line of wrapText(custName, LINE_WIDTH, 'center')) {
    lines.push(line);
  }
  if (transaksi.alamat) {
    for (const line of wrapText(`(${transaksi.alamat})`, LINE_WIDTH, 'center')) {
      lines.push(line);
    }
  }
  lines.push(centerText(statusFinal, LINE_WIDTH));
  if (sisaBayar > 0) {
    lines.push(centerText(`Rp.${formatNumberOnly(sisaBayar)},-`, LINE_WIDTH));
  }

  // 6. Garis Pemisah
  lines.push(divider);

  // 7. Daftar Item Layanan Cucian
  const items = Array.isArray(transaksi.items) && transaksi.items.length > 0 ? transaksi.items : [];
  if (items.length > 0) {
    for (const item of items) {
      // Baris 1: Nama Layanan
      lines.push((item?.namaLayanan || 'Layanan').slice(0, LINE_WIDTH));
      // Baris 2: Qty x Harga   = Subtotal
      const leftCol = `${item?.berat || 0} ${item?.satuan || ''} x ${formatNumberOnly(item?.hargaPerKg || item?.hargaSatuan || 0)}`;
      const rightCol = `= ${formatNumberOnly(item?.subtotal || 0)}`;
      lines.push(alignLeftRight(leftCol, rightCol, LINE_WIDTH));
    }
  } else {
    lines.push('Cucian Laundry');
    lines.push(alignLeftRight('1 Paket', `= ${formatNumberOnly(transaksi.totalHarga)}`, LINE_WIDTH));
  }

  // 8. Garis Pemisah
  lines.push(divider);

  // 9. Rincian Keuangan / Pembayaran
  lines.push(alignLeftRight('Total Transaksi', `Rp ${formatNumberOnly(transaksi.totalHarga)}`, LINE_WIDTH));
  if (transaksi.jumlahDp > 0) {
    lines.push(alignLeftRight('Pembayaran Awal', `Rp ${formatNumberOnly(transaksi.jumlahDp)}`, LINE_WIDTH));
  }
  if (sisaBayar > 0) {
    lines.push(alignLeftRight('Sisa Pembayaran', `Rp ${formatNumberOnly(sisaBayar)}`, LINE_WIDTH));
  } else if (isLunas && transaksi.jumlahDp > 0 && transaksi.jumlahDp < transaksi.totalHarga) {
    lines.push(alignLeftRight('Pelunasan', `Rp ${formatNumberOnly(transaksi.totalHarga - transaksi.jumlahDp)}`, LINE_WIDTH));
  }

  // 10. Garis Pemisah
  lines.push(divider);

  // 11. Metode Pembayaran, Catatan & Catatan Kaki (Center)
  const isTunai =
    !transaksi.metodePembayaran ||
    ['tunai', 'cash'].includes(transaksi.metodePembayaran.trim().toLowerCase());

  if (!isTunai) {
    const detail = transaksi.metodePembayaranDetail ? ` (${transaksi.metodePembayaranDetail})` : '';
    lines.push(centerText(`Metode: ${transaksi.metodePembayaran}${detail}`, LINE_WIDTH));
  }
  if (transaksi.catatan) {
    for (const line of wrapText(`Catatan: ${transaksi.catatan}`, LINE_WIDTH, 'center')) {
      lines.push(line);
    }
  }
  if (settings.footerStruk) {
    for (const line of wrapText(settings.footerStruk, LINE_WIDTH, 'center')) {
      lines.push(line);
    }
  }
  if (settings.chattyFooter) {
    for (const line of wrapText(settings.chattyFooter, LINE_WIDTH, 'center')) {
      lines.push(line);
    }
  }

  // Jarak penutup feed kertas yang rapat & hemat kertas
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate biner ESC/POS lengkap untuk printer thermal Bluetooth 58mm
 */
export function generateEscPosReceiptBytes(
  transaksi: Transaksi,
  settings: SettingsData,
  laundryName?: string,
  laundryAddress?: string,
  laundryPhone?: string,
  logoRasterBytes?: Uint8Array | null
): Uint8Array {
  const isLunas = transaksi.statusPembayaran === 'Lunas';
  const sisaBayar = isLunas ? 0 : Math.max(0, transaksi.totalHarga - (transaksi.jumlahDp || 0));
  const statusFinal = isLunas || sisaBayar <= 0 ? 'LUNAS' : 'BELUM LUNAS';

  const brand = laundryName || settings.headerStruk || 'Kafelas Laundry';
  const address = laundryAddress || settings.address || '';
  const phone = laundryPhone || settings.phoneNumber || '';

  const bytes: number[] = [];
  const textEncoder = new TextEncoder();

  const writeText = (str: string) => {
    const encoded = textEncoder.encode(str);
    for (let i = 0; i < encoded.length; i++) {
      bytes.push(encoded[i]);
    }
  };

  const divider = '--------------------------------\n';

  // Perintah ESC/POS Standar Printer Kasir Thermal
  const ESC_INIT = [0x1b, 0x40];
  const CHARSET_PC437 = [0x1b, 0x74, 0x00]; // Standar USA / Indonesia
  const LINE_SPACING_DEFAULT = [0x1b, 0x32]; // Spasi baris 1/6 inci
  const ALIGN_CENTER = [0x1b, 0x61, 0x01];
  const ALIGN_LEFT = [0x1b, 0x61, 0x00];
  const BOLD_ON = [0x1b, 0x45, 0x01];
  const BOLD_OFF = [0x1b, 0x45, 0x00];
  const FONT_LARGE = [0x1d, 0x21, 0x11]; // Double width & height (Persis APK)
  const FONT_NORMAL = [0x1d, 0x21, 0x00];
  const FEED_PAPER_1 = [0x1b, 0x64, 0x01]; // Feed 1 baris kertas rapat (hemat kertas & tanpa jarak kosong bawah)

  // 0. Inisialisasi printer fisik (langsung tanpa jarak atas kosong)
  bytes.push(...ESC_INIT);
  bytes.push(...CHARSET_PC437);
  bytes.push(...LINE_SPACING_DEFAULT);

  // Logo Toko (Center) jika tersedia (langsung menempel ke nama toko tanpa baris kosong pemisah)
  if (logoRasterBytes && logoRasterBytes.length > 0) {
    bytes.push(...ALIGN_CENTER);
    for (let i = 0; i < logoRasterBytes.length; i++) {
      bytes.push(logoRasterBytes[i]);
    }
  }

  bytes.push(...ALIGN_CENTER);

  // 1. Header Toko (Center + BOLD)
  bytes.push(...BOLD_ON);
  writeText(`${brand.toUpperCase()}\r\n`);
  bytes.push(...BOLD_OFF);

  if (address) {
    for (const line of wrapText(address, LINE_WIDTH, 'center')) {
      writeText(`${line}\r\n`);
    }
  }

  if (phone) {
    const formattedPhone = phone.toLowerCase().startsWith('telp') ? phone : `Telp: ${phone}`;
    writeText(`${centerText(formattedPhone, LINE_WIDTH)}\r\n`);
  }

  // 2. Garis Pemisah
  writeText(divider);

  // 3. Metadata Nota (No, Terima, Selesai, Yth. Bapak/Ibu)
  bytes.push(...ALIGN_LEFT);
  const invoiceNo = transaksi.nomorTransaksi ? `#${transaksi.nomorTransaksi.replace(/^#/, '')}` : '-';
  writeText(`${alignLeftRight('No.', invoiceNo, LINE_WIDTH)}\r\n`);
  writeText(`${alignLeftRight('Terima', formatReceiptDate(transaksi.tanggalMasuk, true), LINE_WIDTH)}\r\n`);
  if (transaksi.tanggalSelesai) {
    writeText(`${alignLeftRight('Selesai', formatReceiptDate(transaksi.tanggalSelesai), LINE_WIDTH)}\r\n`);
  }
  writeText('Yth. Bapak/Ibu\r\n');

  // 4. Garis Pemisah
  writeText(divider);

  // 5. Nama Pelanggan & Status Pembayaran (Center + BOLD + FONT_LARGE persis APK)
  bytes.push(...ALIGN_CENTER);
  bytes.push(...BOLD_ON);
  bytes.push(...FONT_LARGE);
  writeText(`${(transaksi.namaPelanggan || 'PELANGGAN').toUpperCase()}\r\n`);
  bytes.push(...FONT_NORMAL);

  if (transaksi.alamat) {
    writeText(`(${transaksi.alamat})\r\n`);
  }

  writeText(`${statusFinal}\r\n`);
  if (sisaBayar > 0) {
    writeText(`Rp.${formatNumberOnly(sisaBayar)},-\r\n`);
  }
  bytes.push(...BOLD_OFF);

  // 6. Garis Pemisah
  writeText(divider);

  // 7. Daftar Item Layanan Cucian
  bytes.push(...ALIGN_LEFT);
  const items = Array.isArray(transaksi.items) && transaksi.items.length > 0 ? transaksi.items : [];
  if (items.length > 0) {
    for (const item of items) {
      bytes.push(...BOLD_ON);
      writeText(`${(item?.namaLayanan || 'Layanan').slice(0, LINE_WIDTH)}\r\n`);
      bytes.push(...BOLD_OFF);
      const leftCol = `${item?.berat || 0} ${item?.satuan || ''} x ${formatNumberOnly(item?.hargaPerKg || item?.hargaSatuan || 0)}`;
      const rightCol = `= ${formatNumberOnly(item?.subtotal || 0)}`;
      writeText(`${alignLeftRight(leftCol, rightCol, LINE_WIDTH)}\r\n`);
    }
  } else {
    bytes.push(...BOLD_ON);
    writeText('Cucian Laundry\r\n');
    bytes.push(...BOLD_OFF);
    writeText(`${alignLeftRight('1 Paket', `= ${formatNumberOnly(transaksi.totalHarga)}`, LINE_WIDTH)}\r\n`);
  }

  // 8. Garis Pemisah
  writeText(divider);

  // 9. Rincian Keuangan / Total Transaksi
  bytes.push(...BOLD_ON);
  writeText(`${alignLeftRight('Total Transaksi', 'Rp ' + formatNumberOnly(transaksi.totalHarga), LINE_WIDTH)}\r\n`);
  bytes.push(...BOLD_OFF);

  if (transaksi.jumlahDp > 0) {
    writeText(`${alignLeftRight('Pembayaran Awal', 'Rp ' + formatNumberOnly(transaksi.jumlahDp), LINE_WIDTH)}\r\n`);
  }
  if (sisaBayar > 0) {
    bytes.push(...BOLD_ON);
    writeText(`${alignLeftRight('Sisa Pembayaran', 'Rp ' + formatNumberOnly(sisaBayar), LINE_WIDTH)}\r\n`);
    bytes.push(...BOLD_OFF);
  } else if (isLunas && transaksi.jumlahDp > 0 && transaksi.jumlahDp < transaksi.totalHarga) {
    bytes.push(...BOLD_ON);
    writeText(`${alignLeftRight('Pelunasan', 'Rp ' + formatNumberOnly(transaksi.totalHarga - transaksi.jumlahDp), LINE_WIDTH)}\r\n`);
    bytes.push(...BOLD_OFF);
  }

  // 10. Garis Pemisah
  writeText(divider);

  // 11. Metode Pembayaran (Hanya tampil jika non-tunai seperti Transfer / QRIS) & Catatan
  bytes.push(...ALIGN_CENTER);
  const isMetodeTunai =
    !transaksi.metodePembayaran ||
    ['tunai', 'cash'].includes(transaksi.metodePembayaran.trim().toLowerCase());

  if (!isMetodeTunai) {
    const detail = transaksi.metodePembayaranDetail ? ` (${transaksi.metodePembayaranDetail})` : '';
    writeText(`Metode: ${transaksi.metodePembayaran}${detail}\r\n`);
  }
  if (transaksi.catatan) {
    for (const line of wrapText(`Catatan: ${transaksi.catatan}`, LINE_WIDTH, 'center')) {
      writeText(`${line}\r\n`);
    }
  }
  if (settings.footerStruk) {
    for (const line of wrapText(settings.footerStruk, LINE_WIDTH, 'center')) {
      writeText(`${line}\r\n`);
    }
  }
  if (settings.chattyFooter) {
    for (const line of wrapText(settings.chattyFooter, LINE_WIDTH, 'center')) {
      writeText(`${line}\r\n`);
    }
  }

  // Feed kertas 1 baris minimal rapat (menghilangkan jarak kosong bawah)
  bytes.push(...FEED_PAPER_1);
  writeText('\r\n');

  return new Uint8Array(bytes);
}
