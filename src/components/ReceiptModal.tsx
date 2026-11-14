import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Share2, RefreshCw, MessageCircle, Loader2 } from 'lucide-react';
import { Transaksi, SettingsData, Pelanggan } from '../types';
import { useToast } from './NotificationContext';
import {
  isAndroidPrintAvailable,
  printViaAndroidBluetooth,
  preloadLogoBase64,
} from '../utils/nativeBridge';
import {
  cetakViaWebBluetooth,
  getSavedBluetoothPrinter,
  pairBluetoothPrinterDirectly,
  openAppInStandaloneTab,
} from '../utils/printer';
import {
  generateReceiptBlob,
  getReceiptFileName,
  triggerBlobDownload,
  tryCopyImageBlobToClipboard,
  bagikanGambarNota,
} from '../utils/receiptCanvas';
import {
  normalizeWhatsAppPhone,
  isMobileBrowser,
  canWebShareFiles,
  buildWhatsAppReceiptCaption,
  openDirectWhatsAppChat,
} from '../utils/whatsappHelper';
import { ReceiptPaper } from './ReceiptPaper';
import { ShareReceiptModal } from './ShareReceiptModal';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaksi: Transaksi | null;
  settings: SettingsData;
  pelanggan?: Pelanggan | null;
  laundryName?: string;
  laundryPhone?: string;
  laundryAddress?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaksi,
  settings,
  pelanggan,
  laundryName,
  laundryPhone,
  laundryAddress,
}) => {
  const toast = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const ownedUrlRef = useRef<string | null>(null);

  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLogoReady, setIsLogoReady] = useState(false);

  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [savedPrinterName, setSavedPrinterName] = useState<string | null>(() => {
    return getSavedBluetoothPrinter().name || settings.printerName || null;
  });

  useEffect(() => {
    if (!isOpen || !transaksi) {
      setIsLogoReady(false);
      setReceiptBlob(null);
      setReceiptFile(null);
      setReceiptUrl(null);
      if (ownedUrlRef.current) {
        URL.revokeObjectURL(ownedUrlRef.current);
        ownedUrlRef.current = null;
      }
      return;
    }

    const current = getSavedBluetoothPrinter().name || settings.printerName || null;
    setSavedPrinterName(current);
    if (settings.useLogo && settings.logoPath) {
      preloadLogoBase64(settings.logoPath);
    }

    setIsGeneratingImg(true);
    const fallbackTimer = setTimeout(() => {
      setIsLogoReady(true);
    }, 400);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [isOpen, transaksi?.id, settings.useLogo, settings.logoPath, settings.printerName]);

  useEffect(() => {
    if (!isOpen || !transaksi || !isLogoReady) return;

    let active = true;
    setIsGeneratingImg(true);

    const raf = requestAnimationFrame(() => {
      const fileName = getReceiptFileName(transaksi);
      generateReceiptBlob(
        transaksi,
        settings,
        laundryName,
        laundryAddress,
        laundryPhone,
        receiptRef.current
      )
        .then((blob) => {
          if (!active) return;
          if (ownedUrlRef.current) {
            URL.revokeObjectURL(ownedUrlRef.current);
          }
          const url = URL.createObjectURL(blob);
          ownedUrlRef.current = url;
          setReceiptBlob(blob);
          setReceiptFile(new File([blob], fileName, { type: 'image/png' }));
          setReceiptUrl(url);
          setIsGeneratingImg(false);
        })
        .catch(() => {
          if (active) setIsGeneratingImg(false);
        });
    });

    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [isOpen, isLogoReady, transaksi, settings, laundryName, laundryAddress, laundryPhone]);

  if (!isOpen || !transaksi) return null;

  const headerTitle = laundryName || settings.headerStruk || 'Kafelas Laundry';
  const isLunas = transaksi.statusPembayaran === 'Lunas';
  const sisaBayar = isLunas ? 0 : Math.max(0, transaksi.totalHarga - transaksi.jumlahDp);
  const statusFinal = isLunas || sisaBayar <= 0 ? 'LUNAS' : 'BELUM LUNAS';

  const handlePrint = async (forcePicker = false) => {
    // 1. Cek jika di lingkungan APK Android (window.MesinPrint)
    if (typeof window !== 'undefined' && window.MesinPrint) {
      const hasLogo = Boolean(settings.useLogo && settings.logoPath);
      toast.info(
        hasLogo
          ? 'Mengirim struk & logo ke printer Bluetooth APK...'
          : 'Mengirim struk ke printer Bluetooth APK...',
        2500
      );
      setPrintFeedback('Mengirim struk ke printer Bluetooth APK...');

      const res = await printViaAndroidBluetooth(
        transaksi,
        settings,
        laundryName,
        laundryAddress,
        laundryPhone
      );

      if (res.success) {
        toast.success(res.message);
        setPrintFeedback(res.message);
        setTimeout(() => setPrintFeedback(null), 3500);
      } else {
        toast.error(res.message, 4500);
        setPrintFeedback(res.message);
        setTimeout(() => setPrintFeedback(null), 4500);
      }
      return;
    }

    // 2. Eksekusi cetak termal via Web Bluetooth API
    if (forcePicker) {
      toast.info('Membuka dialog pencarian printer Bluetooth...', 2000);
      setPrintFeedback('Membuka dialog pencarian printer baru...');
    } else if (savedPrinterName) {
      toast.info(`Menghubungkan otomatis ke ${savedPrinterName}...`, 2000);
      setPrintFeedback(`Menghubungkan otomatis ke ${savedPrinterName}...`);
    } else {
      toast.info('Mencari printer Bluetooth thermal...', 2000);
      setPrintFeedback('Mencari printer Bluetooth thermal...');
    }

    setIsPrinting(true);

    const res = await cetakViaWebBluetooth(
      transaksi,
      settings,
      laundryName,
      laundryAddress,
      laundryPhone,
      forcePicker,
      (statusMsg) => {
        toast.info(statusMsg, 2500);
        setPrintFeedback(statusMsg);
      }
    );

    setIsPrinting(false);

    if (res.success) {
      if (res.printerName) {
        setSavedPrinterName(res.printerName);
      }
      toast.success(res.message);
      setPrintFeedback(res.message);
      setTimeout(() => setPrintFeedback(null), 3500);
    } else if (res.message.includes('dibatalkan')) {
      toast.info(res.message, 2500);
      setPrintFeedback(null);
    } else {
      toast.error(res.message, 5000);
      setPrintFeedback(res.message);
      setTimeout(() => setPrintFeedback(null), 6000);
    }
  };

  const handleQuickShareWhatsApp = async () => {
    setIsGeneratingImg(true);
    toast.info('Menyiapkan gambar nota resmi...', 1500);

    const res = await bagikanGambarNota({
      elementId: 'printable-receipt-area',
      namaKlien: transaksi.namaPelanggan || 'Pelanggan',
      noInvoice: transaksi.nomorTransaksi || '001',
    });

    setIsGeneratingImg(false);

    if (res.success) {
      toast.success(res.message);
      setPrintFeedback(res.message);
      setTimeout(() => setPrintFeedback(null), 4000);
    } else if (res.message && !res.message.includes('dibatalkan')) {
      toast.error(res.message);
    }
  };

  const handleSwitchPrinter = async () => {
    if (typeof window !== 'undefined' && window.MesinPrint) {
      if (typeof window.MesinPrint.resetPrinter === 'function') {
        window.MesinPrint.resetPrinter();
      } else if (typeof window.MesinPrint.gantiPrinter === 'function') {
        window.MesinPrint.gantiPrinter();
      }
      toast.info('Pilihan printer APK di-reset. Silakan klik Cetak untuk memilih printer baru.', 3000);
      setPrintFeedback('Pilihan printer di-reset. Klik Cetak untuk memilih printer baru.');
      setTimeout(() => setPrintFeedback(null), 3500);
      return;
    }
        toast.info('Membuka dialog pencarian printer Bluetooth...', 2000);
    const res = await pairBluetoothPrinterDirectly();
    if (res.success && res.printerName) {
      setSavedPrinterName(res.printerName);
      toast.success(res.message);
      setPrintFeedback(res.message);
      setTimeout(() => setPrintFeedback(null), 3500);
    } else if (res.message.includes('dibatalkan')) {
      toast.info(res.message, 2500);
      setPrintFeedback(null);
    } else {
      toast.error(res.message, 4500);
      setPrintFeedback(res.message);
      setTimeout(() => setPrintFeedback(null), 4000);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto animate-fade-in">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          <div className="bg-[#800000] text-white p-4 flex items-center justify-between no-print">
            <div>
              <h3 className="font-bold text-sm">Struk Transaksi</h3>
              <p className="text-xs text-white/80">{transaksi.nomorTransaksi || 'Preview Struk'}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="px-4 pt-3 pb-1 bg-slate-50 border-b border-slate-200/80 no-print flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  savedPrinterName ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-400'
                }`}
              />
              <div className="text-xs text-slate-700 truncate">
                <span className="text-slate-500">Printer: </span>
                <strong className="text-slate-900 font-semibold">
                  {savedPrinterName || 'Belum Terhubung'}
                </strong>
                {savedPrinterName && (
                  <span className="text-[10px] text-emerald-700 font-semibold ml-1.5">
                    · Tersimpan
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitchPrinter}
              className="text-[11px] font-bold text-[#800000] hover:text-[#660000] hover:bg-[#800000]/10 px-2 py-1 rounded-lg transition shrink-0 flex items-center gap-1 whitespace-nowrap cursor-pointer"
              title="Ganti printer Bluetooth yang digunakan"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{savedPrinterName ? 'Ganti' : 'Pilih'}</span>
            </button>
          </div>

          <div className="p-4 overflow-y-auto bg-slate-100 flex justify-center">
            <ReceiptPaper
              ref={receiptRef}
              id="printable-receipt-area"
              transaksi={transaksi}
              settings={settings}
              laundryName={laundryName}
              laundryPhone={laundryPhone}
              laundryAddress={laundryAddress}
              onLogoReady={() => setIsLogoReady(true)}
            />
          </div>

          {printFeedback && (
            <div className="mx-4 mb-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in shadow-md no-print">
              <span className="leading-snug flex-1">{printFeedback}</span>
              {printFeedback.includes('tab baru') && (
                <button
                  type="button"
                  onClick={() => openAppInStandaloneTab()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Buka Tab Baru
                </button>
              )}
              <button
                onClick={() => setPrintFeedback(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded shrink-0 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-2 no-print">
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                disabled={isPrinting}
                onClick={() => handlePrint(false)}
                className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] disabled:opacity-60 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                title="Cetak langsung ke printer Bluetooth thermal kasir"
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Printer className="w-4 h-4 shrink-0" />
                )}
                <span>Print Bluetooth</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingImg}
                onClick={handleQuickShareWhatsApp}
                className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
                title="Bagikan gambar struk nota resmi ke WhatsApp / Telegram"
              >
                {isGeneratingImg ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <MessageCircle className="w-4 h-4 shrink-0" />
                )}
                <span>Share WhatsApp</span>
              </button>
            </div>

      
          </div>
        </div>
      </div>

      <ShareReceiptModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        transaksi={transaksi}
        settings={settings}
        pelanggan={pelanggan}
        laundryName={laundryName}
        laundryPhone={laundryPhone}
        laundryAddress={laundryAddress}
        initialBlob={receiptBlob}
        initialFile={receiptFile}
        initialUrl={receiptUrl}
      />
    </>
  );
};

