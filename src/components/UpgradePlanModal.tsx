import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  MessageCircle,
  RefreshCw,
  Zap,
  Building2,
  Wallet,
} from 'lucide-react';
import { User } from '../types';
import {
  normalizeTier,
  HARGA_PREMIUM_BULANAN,
  HARGA_PRO_BULANAN,
  getRemainingSubscriptionDays,
} from '../utils/subscription';
import { formatRupiah } from '../utils/formatters';
import { buildWhatsAppAdminUrl } from '../services/midtransService';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  currentTier?: string | null;
  triggerReason?: string;
  onChoosePayment?: (method: 'midtrans' | 'manual', targetTier?: 'premium' | 'pro') => void;
  onExtendWithWallet?: (targetTier?: 'premium' | 'pro') => Promise<boolean> | boolean | void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentTier,
  triggerReason,
  onChoosePayment,
  onExtendWithWallet,
}) => {
  const [isProcessingWallet, setIsProcessingWallet] = useState(false);
  const [confirmTier, setConfirmTier] = useState<'premium' | 'pro' | null>(null);

  if (!isOpen) return null;

  const activeTier = normalizeTier(currentTier);
  const walletBalance = currentUser?.walletBalance || 0;
  const isOwner = currentUser?.role === 'owner';

  const confirmPrice = confirmTier === 'pro' ? HARGA_PRO_BULANAN : HARGA_PREMIUM_BULANAN;
  const confirmLabel = confirmTier === 'pro' ? 'Paket Pro' : 'Paket Premium';

  const waUrl = buildWhatsAppAdminUrl(
    'Halo Tim Kafelas Laundry, saya ingin konfirmasi aktivasi paket langganan untuk laundry saya.'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      onClick={() => {
        if (!isProcessingWallet) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bersih */}
        <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pilihan Paket Langganan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkatkan kuota dan fitur operasional laundry Anda
            </p>
          </div>
          <button
            type="button"
            disabled={isProcessingWallet}
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifikasi Singkat Alasan Kunci Fitur (Jika ada) */}
        {triggerReason && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-5 py-2.5 text-xs text-amber-900 flex items-center gap-2 shrink-0">
            <span className="font-semibold">Info:</span>
            <span>{triggerReason}</span>
          </div>
        )}

        {/* Konten Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Status Saldo & Paket Saat Ini */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {activeTier === 'pro'
                  ? 'Paket Pro'
                  : activeTier === 'premium'
                  ? 'Paket Premium'
                  : getRemainingSubscriptionDays(currentUser) > 0
                  ? `Trial 7 Hari (${getRemainingSubscriptionDays(currentUser)} Hari Tersisa)`
                  : 'Trial 7 Hari (Habis)'}
              </span>
            </div>
            {isOwner && (
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-[#800000]">{formatRupiah(walletBalance)}</span>
              </div>
            )}
          </div>

          {/* Grid 2 Opsi Berbayar: Premium & Pro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. PAKET PREMIUM */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between bg-white transition ${
                activeTier === 'premium'
                  ? 'border-rose-400 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-bold text-sm text-slate-900">Paket Premium</h3>
                  {activeTier === 'premium' && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>

                <div className="text-xl font-bold text-slate-900 font-mono">
                  {formatRupiah(HARGA_PREMIUM_BULANAN)}
                  <span className="text-xs font-normal text-slate-500 font-sans"> / bulan</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Untuk 1 cabang laundry dengan kuota transaksi tanpa batas.
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Transaksi nota bulanan tanpa batas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Pelanggan & jenis layanan tanpa batas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>1 Cabang outlet utama & 1 akun kasir</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Penugasan staf & cetak logo struk</span>
                  </div>
                </div>
              </div>

              {/* Aksi Pembayaran Premium */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                {isOwner && walletBalance >= HARGA_PREMIUM_BULANAN && onExtendWithWallet ? (
                  <button
                    type="button"
                    disabled={isProcessingWallet}
                    onClick={() => setConfirmTier('premium')}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Potong Saldo ({formatRupiah(HARGA_PREMIUM_BULANAN)})</span>
                  </button>
                ) : null}

              
              </div>
            </div>

            {/* 2. PAKET PRO */}
            <div
              className={`p-4 rounded-xl border-2 flex flex-col justify-between bg-white transition ${
                activeTier === 'pro'
                  ? 'border-amber-400 bg-amber-50/15'
                  : 'border-[#800000]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-900">Paket Pro</h3>
                  </div>
                  {activeTier === 'pro' ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                      Aktif
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#800000] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      Paling Lengkap
                    </span>
                  )}
                </div>

                <div className="text-xl font-bold text-slate-900 font-mono">
                  {formatRupiah(HARGA_PRO_BULANAN)}
                  <span className="text-xs font-normal text-slate-500 font-sans"> / bulan</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Untuk 2 cabang langsung aktif dengan ekspor Excel & PDF.
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2 font-semibold text-slate-900">
                    <Check className="w-3.5 h-3.5 text-[#800000] mt-0.5 shrink-0" />
                    <span>2 Cabang outlet langsung aktif</span>
                  </div>
                  <div className="flex items-start gap-2 font-semibold text-slate-900">
                    <Check className="w-3.5 h-3.5 text-[#800000] mt-0.5 shrink-0" />
                    <span>Ekspor Excel (.xlsx) & Dokumen PDF</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>2 Akun login kasir beda perangkat</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Semua fitur Paket Premium</span>
                  </div>
                </div>
              </div>

              {/* Aksi Pembayaran Pro */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                {isOwner && walletBalance >= HARGA_PRO_BULANAN && onExtendWithWallet ? (
                  <button
                    type="button"
                    disabled={isProcessingWallet}
                    onClick={() => setConfirmTier('pro')}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Potong Saldo ({formatRupiah(HARGA_PRO_BULANAN)})</span>
                  </button>
                ) : null}

              </div>
            </div>
          </div>

        </div>

        {/* Footer Sederhana */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs shrink-0">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Butuh bantuan? Chat WA</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-600 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Dialog Konfirmasi Potong Saldo */}
        {confirmTier && (() => {
          const sisaHariSekarang = getRemainingSubscriptionDays(currentUser);
          const isSwitchingPaidTier =
            activeTier !== 'newcomer' && activeTier !== confirmTier && sisaHariSekarang > 0;
          const isExtendingSameTier = activeTier === confirmTier;

          return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">
                Konfirmasi {isExtendingSameTier ? 'Perpanjangan' : 'Aktivasi'} {confirmLabel}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Saldo Anda sebesar <span className="font-semibold text-slate-900 font-mono">{formatRupiah(walletBalance)}</span> akan dipotong{' '}
                <span className="font-bold text-[#800000] font-mono">{formatRupiah(confirmPrice)}</span> untuk{' '}
                {isExtendingSameTier && sisaHariSekarang > 0
                  ? `menambah +30 hari (menjadi ${sisaHariSekarang + 30} hari masa aktif).`
                  : 'mengaktifkan masa aktif 30 hari.'}
              </p>
              {isSwitchingPaidTier && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium leading-relaxed">
                  Perhatian: Berpindah dari{' '}
                  <strong>{activeTier === 'premium' ? 'Paket Premium' : 'Paket Pro'}</strong> ke{' '}
                  <strong>{confirmLabel}</strong> akan menghanguskan sisa {sisaHariSekarang} hari paket sebelumnya dan memulai masa aktif baru 30 hari.
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessingWallet}
                  onClick={() => setConfirmTier(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isProcessingWallet}
                  onClick={async () => {
                    setIsProcessingWallet(true);
                    try {
                      const ok = await onExtendWithWallet?.(confirmTier);
                      if (ok !== false) {
                        setConfirmTier(null);
                        onClose();
                      }
                    } finally {
                      setIsProcessingWallet(false);
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  {isProcessingWallet && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Ya, Lanjutkan</span>
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
};