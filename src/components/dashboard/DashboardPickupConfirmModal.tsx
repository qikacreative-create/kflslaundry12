import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Truck, Banknote, CreditCard, Wallet } from 'lucide-react';
import { Transaksi } from '../../types';
import { formatRupiah } from '../../utils/formatters';

export interface PickupPaymentOption {
  metodePembayaran: 'Tunai' | 'Non-Tunai';
  metodePembayaranDetail?: string | null;
}

interface DashboardPickupConfirmModalProps {
  transaksi: Transaksi;
  alamat: string;
  onCancel: () => void;
  onConfirm: (trx: Transaksi, paymentOption?: PickupPaymentOption) => void;
}

const BANK_OPTIONS = ['QRIS', 'BCA', 'BRI', 'Mandiri', 'Lainnya'];

export const DashboardPickupConfirmModal: React.FC<DashboardPickupConfirmModalProps> = ({
  transaksi,
  alamat,
  onCancel,
  onConfirm,
}) => {
  const sisa = Math.max(0, transaksi.totalHarga - (transaksi.jumlahDp || 0));
  const isLunas = transaksi.statusPembayaran === 'Lunas' || sisa <= 0;

  // Pilihan metode pelunasan saat pengambilan jika belum lunas
  const [isTransfer, setIsTransfer] = useState<boolean>(() => {
    return transaksi.metodePembayaran === 'Non-Tunai';
  });
  const [transferDetail, setTransferDetail] = useState<string>(() => {
    return transaksi.metodePembayaranDetail || 'QRIS';
  });

  const servicesDesc =
    Array.isArray(transaksi.items) && transaksi.items.length > 0
      ? transaksi.items
          .map((it) => `${it?.namaLayanan || 'Layanan'} (${it?.berat || 0} ${it?.satuan || ''})`)
          .join(', ')
      : 'Layanan Laundry';

  const handleConfirmClick = () => {
    if (!isLunas && sisa > 0) {
      onConfirm(transaksi, {
        metodePembayaran: isTransfer ? 'Non-Tunai' : 'Tunai',
        metodePembayaranDetail: isTransfer ? transferDetail : 'Tunai',
      });
    } else {
      onConfirm(transaksi);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Truck className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-slate-900 text-center tracking-tight">
          Benar mau diambil?
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1">
          Konfirmasi penyerahan cucian ke pelanggan
        </p>

        {/* Info Rincian Transaksi */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 mt-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Pelanggan:</span>
            <span className="font-bold text-slate-900 truncate max-w-[190px]">
              {transaksi.namaPelanggan}
            </span>
          </div>
          {transaksi.nomorTransaksi && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">No. Nota / Faktur:</span>
              <span className="font-mono font-bold text-slate-700">
                {transaksi.nomorTransaksi}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Alamat:</span>
            <span className="font-medium text-slate-700 truncate max-w-[190px]">
              {alamat || '-'}
            </span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span className="text-slate-500 shrink-0">Layanan:</span>
            <span className="text-slate-800 font-medium text-right line-clamp-2">
              {servicesDesc}
            </span>
          </div>
          {transaksi.diskon && transaksi.diskon > 0 ? (
            <div className="flex justify-between items-center text-rose-700 font-semibold">
              <span>Potongan Diskon:</span>
              <span className="font-mono font-bold">-{formatRupiah(transaksi.diskon)}</span>
            </div>
          ) : null}
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
            <span className="text-slate-500 font-semibold">Total Tagihan:</span>
            <span className="font-extrabold text-slate-900 text-sm tabular-nums">
              {formatRupiah(transaksi.totalHarga)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200">
            <span className="text-slate-500">Status Pembayaran:</span>
            {isLunas ? (
              <span className="px-2 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 text-[11px]">
                LUNAS
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full font-black bg-rose-100 text-rose-800 text-[11px] tabular-nums">
                BELUM LUNAS (SISA {formatRupiah(sisa)})
              </span>
            )}
          </div>
        </div>

        {/* JIKA BELUM LUNAS: PILIHAN PEMBAYARAN TRANSFER ATAU CASH */}
        {!isLunas && sisa > 0 ? (
          <div className="mt-3.5 p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <Wallet className="w-4 h-4 text-amber-700" />
                <span>Pelunasan Sisa Tagihan:</span>
              </div>
              <span className="text-xs font-black text-rose-700 font-mono">
                {formatRupiah(sisa)}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              Pilih metode pelunasan yang diterima dari pelanggan:
            </p>

            {/* Tombol Opsi: Cash (Tunai) vs Transfer */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsTransfer(false)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isTransfer
                    ? 'bg-[#800000] border-[#800000] text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash (Tunai)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTransfer(true)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isTransfer
                    ? 'bg-[#800000] border-[#800000] text-white shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Transfer / QRIS</span>
              </button>
            </div>

            {/* Pilihan Bank jika Transfer Aktif */}
            {isTransfer && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pilih Bank / Saluran Transfer:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {BANK_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTransferDetail(opt)}
                      className={`py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold border transition text-center cursor-pointer ${
                        transferDetail === opt
                          ? 'bg-rose-50 border-[#800000] text-[#800000] ring-1 ring-[#800000]'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-600 pt-0.5 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
              Transaksi akan otomatis ditandai <strong className="text-emerald-700">LUNAS</strong> via{' '}
              <strong className="text-slate-900">
                {isTransfer ? `Transfer (${transferDetail})` : 'Cash (Tunai)'}
              </strong>{' '}
              sebesar <strong className="text-slate-900">{formatRupiah(sisa)}</strong> dan dicatat ke Buku Kas hari ini.
            </div>
          </div>
        ) : (
          <div className="mt-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Cucian sudah lunas dan siap diserahkan kepada pelanggan. Data akan otomatis masuk ke
              arsip cucian selesai diambil.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 transition active:scale-95 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs text-white shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>Ya, Benar Diambil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPickupConfirmModal;
