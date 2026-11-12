import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, Copy, Check, Sparkles, User, FileText } from 'lucide-react';
import { Transaksi } from '../types';
import { formatRupiah } from '../utils/formatters';
import { buildWhatsAppSelesaiMessage, sendToWhatsApp } from '../utils/whatsappHelper';
import { useToast } from './NotificationContext';

interface AutoFinishWaModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaksi: Transaksi;
  phone: string;
  laundryName: string;
  laundryAddress?: string;
  laundryPhone?: string;
}

export const AutoFinishWaModal: React.FC<AutoFinishWaModalProps> = ({
  isOpen,
  onClose,
  transaksi,
  phone,
  laundryName,
  laundryAddress,
  laundryPhone,
}) => {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && transaksi) {
      const defaultMsg = buildWhatsAppSelesaiMessage(
        transaksi,
        laundryName || 'Kafelas Laundry',
        laundryAddress,
        laundryPhone
      );
      setMessage(defaultMsg);
      setIsCopied(false);
    }
  }, [isOpen, transaksi, laundryName, laundryAddress, laundryPhone]);

  if (!isOpen || !transaksi) return null;

  const sisa = Math.max(0, (transaksi.totalHarga || 0) - (transaksi.jumlahDp || 0));
  const isLunas = transaksi.statusPembayaran === 'Lunas' || sisa <= 0;

  const handleSendWa = () => {
    if (!phone || !phone.trim()) {
      toast.warning('Nomor WhatsApp pelanggan belum terisi.');
      return;
    }
    sendToWhatsApp(phone, message);
    toast.success(`Notifikasi WhatsApp siap dikirim ke Kak ${transaksi.namaPelanggan}!`);
    onClose();
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
        setIsCopied(true);
        toast.info('Pesan notifikasi berhasil disalin ke clipboard.');
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch {
      toast.error('Gagal menyalin teks ke clipboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Auto-Finish: Notifikasi WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Siap Ambil
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kirim pemberitahuan otomatis bahwa cucian sudah selesai
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan Singkat Pelanggan & Nota */}
        <div className="mt-3.5 bg-slate-50 rounded-2xl p-3 border border-slate-200/90 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Pelanggan:
            </span>
            <span className="font-bold text-slate-900 truncate max-w-[220px]">
              {transaksi.namaPelanggan}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> No. Nota:
            </span>
            <span className="font-mono font-bold text-slate-700">
              {transaksi.nomorTransaksi || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">No. WhatsApp:</span>
            <span className="font-mono font-bold text-emerald-700">
              {phone || 'Belum terdaftar'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-500">Status Tagihan:</span>
            {isLunas ? (
              <span className="font-black text-emerald-700">
                LUNAS ({formatRupiah(transaksi.totalHarga)})
              </span>
            ) : (
              <span className="font-black text-rose-700">
                SISA {formatRupiah(sisa)} (Total: {formatRupiah(transaksi.totalHarga)})
              </span>
            )}
          </div>
        </div>

        {/* Area Pesan WhatsApp (Dapat Diedit Jika Diperlukan) */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700">
              Isi Pesan Notifikasi WhatsApp:
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Pesan</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            className="w-full p-2.5 rounded-xl border border-slate-300 text-[11px] leading-relaxed text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none font-sans resize-none"
            placeholder="Tulis pesan..."
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer active:scale-95"
          >
            Nanti Saja / Lewati
          </button>
          <button
            type="button"
            onClick={handleSendWa}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Notifikasi WA</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AutoFinishWaModal;
