import React, { useState } from 'react';
import { ArrowLeft, Printer, Share2, MessageCircle, Edit3, Trash2, CheckCircle2, Clock, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { Transaksi, SettingsData, Pelanggan, User } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { ReceiptModal } from '../components/ReceiptModal';
import { ShareReceiptModal } from '../components/ShareReceiptModal';
import { DashboardPickupConfirmModal, PickupPaymentOption } from '../components/dashboard/DashboardPickupConfirmModal';
import { useToast, useConfirm } from '../components/NotificationContext';

interface DetailTransaksiViewProps {
  onBack: () => void;
  transaksi: Transaksi;
  settings: SettingsData;
  currentUser: User;
  pelanggan?: Pelanggan | null;
  laundryName?: string;
  laundryPhone?: string;
  laundryAddress?: string;
  onEdit: (transaksi: Transaksi) => void;
  onDelete: (transaksiId: string) => void;
  onAmbil?: (transaksi: Transaksi, paymentOption?: PickupPaymentOption) => void;
}

export const DetailTransaksiView: React.FC<DetailTransaksiViewProps> = ({
  onBack,
  transaksi,
  settings,
  currentUser,
  pelanggan,
  laundryName,
  laundryPhone,
  laundryAddress,
  onEdit,
  onDelete,
  onAmbil,
}) => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConfirmAmbil, setShowConfirmAmbil] = useState(false);

  const isOwner = currentUser.role === 'owner';
  const isLunas = transaksi.statusPembayaran === 'Lunas';
  const sisaBayar = isLunas ? 0 : Math.max(0, transaksi.totalHarga - transaksi.jumlahDp);
  const isArchived = transaksi.status === 'Diambil';

  const handleDeleteConfirm = async () => {
    if (!isOwner) {
      toast.warning('Akses Dibatasi: Penghapusan nota hanya dapat dilakukan oleh akun Pemilik (Owner).');
      return;
    }
    const ok = await confirm({
      title: 'Hapus Transaksi',
      message: `Anda yakin ingin menghapus transaksi '${transaksi.nomorTransaksi}'? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Transaksi',
      isDestructive: true,
    });
    if (ok) {
      onDelete(transaksi.id);
      toast.success(`Transaksi '${transaksi.nomorTransaksi}' berhasil dihapus.`);
      onBack();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-12">
      {/* Top Header */}
      <header className="bg-[#800000] text-white shadow-md sticky top-0 z-30 flex items-center px-4 h-14">
        <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition mr-3">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="font-bold text-base tracking-wide">Detail Transaksi</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-2 md:p-6 space-y-2 md:space-y-4 max-w-lg md:max-w-3xl mx-auto w-full overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2">
          {/* Customer & Invoice Number header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <p className="text-[11px] text-slate-400">Yth. Bapak/Ibu</p>
              <h2 className="text-xl font-black text-slate-900">{transaksi.namaPelanggan}</h2>
              {transaksi.alamat && (
                <p className="text-xs text-slate-500 italic mt-0.5">{transaksi.alamat}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-block bg-[#800000] text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                {transaksi.nomorTransaksi || '-'}
              </span>
              {transaksi.dikerjakanOleh && (settings.hitungKerjaStaf ?? true) && (
                <p className="text-[10px] text-slate-500 italic mt-1">
                  Oleh: {transaksi.dikerjakanOleh}
                </p>
              )}
            </div>
          </div>
<div className="flex flex-col gap-1 text-xs">
  {/* Baris 1: Masuk */}
  <div className="flex justify-between items-center text-slate-600">
    <span className="font-semibold">Masuk</span>
    <span className="font-medium">{formatDateIndo(transaksi.tanggalMasuk, true)}</span>
  </div>

  {/* Baris 2: Est. Selesai */}
  {transaksi.tanggalSelesai && (
    <div className="flex justify-between items-center text-red-600 font-bold">
      <span>Est. Selesai</span>
      <span>{formatDateIndo(transaksi.tanggalSelesai)}</span>
    </div>
  )}
</div>
          {transaksi.tanggalPengambilan && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold text-center">
              Diambil pada: {formatDateIndo(transaksi.tanggalPengambilan, true)}
            </div>
          )}

          {/* Services list */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700">Rincian Layanan:</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {(transaksi.items || []).map((it, idx) => (
                <div key={idx} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{it?.namaLayanan || 'Layanan'}</div>
                    <div className="text-slate-500 text-[11px]">
                      {it?.berat || 0} {it?.satuan || ''} x {formatRupiah(it?.hargaPerKg || it?.hargaSatuan || 0)}
                    </div>
                  </div>
                  <div className="font-extrabold text-slate-900">{formatRupiah(it?.subtotal || 0)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Badge */}
          <div className="text-center py-0">
            <div
              className={`text-xl font-black ${
                isLunas ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
            </div>
            {transaksi.metodePembayaran && (
              <p className="text-xs text-slate-500 mt-0.5">
                Metode: {transaksi.metodePembayaran}
                {transaksi.metodePembayaranDetail ? ` (${transaksi.metodePembayaranDetail})` : ''}
              </p>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-600">Total Transaksi:</span>
              <span className="text-slate-900 font-bold">{formatRupiah(transaksi.totalHarga)}</span>
            </div>
            {transaksi.jumlahDp > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Pembayaran Awal:</span>
                <span className="text-slate-800 font-medium">{formatRupiah(transaksi.jumlahDp)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-200">
              <span className={sisaBayar > 0 ? 'text-red-600' : 'text-emerald-600'}>
                {sisaBayar > 0 ? 'Sisa Pembayaran:' : 'Sisa Tagihan:'}
              </span>
              <span className={sisaBayar > 0 ? 'text-red-600' : 'text-emerald-600'}>
                {sisaBayar > 0 ? formatRupiah(sisaBayar) : 'Rp 0 (Lunas)'}
              </span>
            </div>
          </div>

          {/* Notes */}
          {transaksi.catatan && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs italic text-slate-700">
              <strong>Catatan:</strong> {transaksi.catatan}
            </div>
          )}

          {transaksi.terakhirDieditPada && (
            <p className="text-[10px] text-slate-400 text-center italic">
              Diedit pada: {formatDateIndo(transaksi.terakhirDieditPada, true)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              data-tour="btn-cetak-nota"
              className="min-h-[44px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#800000] hover:bg-[#660000] text-white font-bold text-xs shadow-xs transition active:scale-98 whitespace-nowrap"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Lihat Struk</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="min-h-[44px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition active:scale-98 whitespace-nowrap"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Share Struk / WA</span>
            </button>
          </div>

          {!isArchived && onAmbil && (
            <button
              onClick={() => setShowConfirmAmbil(true)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-98 whitespace-nowrap"
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>Ambil Cucian</span>
            </button>
          )}
        </div>


        {/* Edit & Delete Buttons for Owner */}
        {isOwner && !isArchived && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onEdit(transaksi)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition"
            >
              <Edit3 className="w-4 h-4" />
              Edit Transaksi
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Transaksi
            </button>
          </div>
        )}
      </main>

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        transaksi={transaksi}
        settings={settings}
        pelanggan={pelanggan}
        laundryName={laundryName || settings.headerStruk}
        laundryPhone={laundryPhone || settings.phoneNumber}
        laundryAddress={laundryAddress || settings.address}
      />

      {/* Share Receipt Action Sheet / Modal */}
      <ShareReceiptModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        transaksi={transaksi}
        settings={settings}
        pelanggan={pelanggan}
        laundryName={laundryName || settings.headerStruk}
        laundryPhone={laundryPhone || settings.phoneNumber}
        laundryAddress={laundryAddress || settings.address}
      />

      {/* MODAL KONFIRMASI PENGAMBILAN TRANSAKSI */}
      {showConfirmAmbil && (
        <DashboardPickupConfirmModal
          transaksi={transaksi}
          alamat={pelanggan?.alamat || pelanggan?.alamatLengkap || transaksi.alamat || '-'}
          onCancel={() => setShowConfirmAmbil(false)}
          onConfirm={(trx, paymentOption) => {
            setShowConfirmAmbil(false);
            onAmbil?.(trx, paymentOption);
          }}
        />
      )}
    </div>
  );
};
