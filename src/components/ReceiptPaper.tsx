import React, { useEffect, useRef, useState } from 'react';
import { Transaksi, SettingsData } from '../types';
import { formatDateIndo } from '../utils/formatters';
import { getCachedThermalLogoDataUrl, getThermalLogoDataUrl } from '../utils/logoHelper';

export interface ReceiptPaperProps {
  transaksi: Transaksi;
  settings: SettingsData;
  laundryName?: string;
  laundryPhone?: string;
  laundryAddress?: string;
  id?: string;
  isCaptureNode?: boolean;
  className?: string;
  onLogoReady?: () => void;
}

export const ReceiptPaper = React.forwardRef<HTMLDivElement, ReceiptPaperProps>(
  (
    {
      transaksi,
      settings,
      laundryName,
      laundryPhone,
      laundryAddress,
      id = 'printable-receipt-area',
      isCaptureNode = false,
      className = '',
      onLogoReady,
    },
    ref
  ) => {
    const logoImgRef = useRef<HTMLImageElement | null>(null);
    const hasLogoEnabled = Boolean(settings.useLogo && settings.logoPath && settings.logoPath.trim());
    const [thermalLogoSrc, setThermalLogoSrc] = useState<string>(() =>
      hasLogoEnabled ? getCachedThermalLogoDataUrl(settings) : ''
    );

    useEffect(() => {
      let active = true;

      if (!hasLogoEnabled) {
        setThermalLogoSrc('');
        const raf = requestAnimationFrame(() => {
          if (active) onLogoReady?.();
        });
        return () => {
          active = false;
          cancelAnimationFrame(raf);
        };
      }

      const cached = getCachedThermalLogoDataUrl(settings);
      if (cached) {
        setThermalLogoSrc(cached);
        const raf = requestAnimationFrame(() => {
          if (active && (!logoImgRef.current || logoImgRef.current.complete)) {
            onLogoReady?.();
          }
        });
        return () => {
          active = false;
          cancelAnimationFrame(raf);
        };
      }

      getThermalLogoDataUrl(settings)
        .then((url) => {
          if (!active) return;
          if (url) {
            setThermalLogoSrc(url);
            requestAnimationFrame(() => {
              if (active && logoImgRef.current?.complete) {
                onLogoReady?.();
              }
            });
          } else {
            setThermalLogoSrc('');
            requestAnimationFrame(() => {
              if (active) onLogoReady?.();
            });
          }
        })
        .catch(() => {
          if (!active) return;
          setThermalLogoSrc('');
          requestAnimationFrame(() => {
            if (active) onLogoReady?.();
          });
        });

      return () => {
        active = false;
      };
    }, [transaksi.id, hasLogoEnabled, settings.logoPath, settings.useLogo]);

    // Data Mapping
    const namaBrand = laundryName || settings.headerStruk || "Kafelas Laundry";
    const teleponBrand = laundryPhone || settings.phoneNumber || '';
    const alamatBrand = laundryAddress || settings.address || '';
    const namaAdmin = transaksi.dikerjakanOleh || 'Kasir';
    const namaKlien = transaksi.namaPelanggan || 'Pelanggan';
    const noInvoice = transaksi.nomorTransaksi || '001';

    // Logika Keuangan Nota
    const totalTarif = transaksi.totalHarga;
    const diskon = transaksi.diskon || 0;
    const totalTagihan = Math.max(0, totalTarif);
    const isLunas = transaksi.statusPembayaran === 'Lunas';
    const dpDibayar = transaksi.jumlahDp || 0;
    const sisaPelunasan = isLunas ? 0 : Math.max(0, totalTagihan - dpDibayar);
    const nominalDibayar = isLunas ? totalTagihan : dpDibayar;

    const items = Array.isArray(transaksi.items) && transaksi.items.length > 0 ? transaksi.items : [];

    return (
      <div
        ref={ref}
        id={id}
        data-receipt-capture={isCaptureNode ? 'true' : undefined}
        data-trx-id={transaksi.id}
        className={`w-[320px] sm:w-[350px] bg-white text-slate-900 px-4 pt-3 pb-3 rounded-xl shadow-2xl border border-slate-200 relative font-mono text-[11px] leading-tight select-none ${className}`}
        style={{ fontFamily: '"Courier New", Courier, monospace' }}
      >
        {/* A. WATERMARK DIAGONAL BERULANG (Gaya Fintech / DANA) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04] z-0 flex flex-wrap content-start"
          style={{ transform: 'rotate(-20deg) scale(1.3)', transformOrigin: 'center center' }}
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="text-[11px] font-black text-slate-950 m-2.5 whitespace-nowrap">
              {namaBrand.toUpperCase()} •
            </div>
          ))}
        </div>

        {/* B. KONTEN STRUK */}
        <div className="relative z-10 space-y-1.5">
          {/* Header Toko (Rapat tanpa jarak atas berlebih) */}
          <div className="flex items-center gap-2.5">
            {hasLogoEnabled && thermalLogoSrc && (
              <img
                ref={logoImgRef}
                src={thermalLogoSrc}
                alt="Logo"
                referrerPolicy="no-referrer"
                onLoad={() => requestAnimationFrame(() => onLogoReady?.())}
                onError={() => requestAnimationFrame(() => onLogoReady?.())}
                className="h-9 w-auto max-w-[75px] object-contain shrink-0 my-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-black uppercase text-slate-950 truncate leading-snug">{namaBrand}</h2>
              {teleponBrand && <p className="text-[9px] text-slate-600 truncate">{teleponBrand}</p>}
              {alamatBrand && <p className="text-[9px] text-slate-600 line-clamp-2">{alamatBrand}</p>}
            </div>
          </div>

          <div className="border-b border-dashed border-slate-700 my-2" />

          {/* Metadata Transaksi */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-600">No. Invoice</span>
              <span className="font-bold">#{noInvoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Kasir</span>
              <span>{namaAdmin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Pelanggan</span>
              <span className="font-bold">{namaKlien}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tanggal</span>
              <span>{formatDateIndo(transaksi.tanggalMasuk, true)}</span>
            </div>
            {transaksi.tanggalSelesai && (
              <div className="flex justify-between text-rose-700 font-semibold">
                <span>Est. Selesai</span>
                <span>{formatDateIndo(transaksi.tanggalSelesai)}</span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-700 my-2" />

          {/* Badge Status Lunas / Belum Lunas */}
          <div className="text-center py-1">
            <div
              className={`text-xs font-black tracking-widest py-1 px-3 rounded inline-block ${
                isLunas
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {isLunas ? '✓ LUNAS' : 'BELUM LUNAS'}
            </div>
            {!isLunas && (
              <div className="text-xs font-black text-rose-700 mt-1">
                Sisa: Rp {sisaPelunasan.toLocaleString('id-ID')}
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-700 my-2" />

          {/* Rincian Tagihan */}
          <div className="space-y-1 text-[11px]">
            {items.length > 0 ? (
              items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold truncate pr-2">{it.namaLayanan || 'Layanan'}</span>
                    <span className="shrink-0 font-bold">
                      Rp {(it.subtotal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {it.berat || 0} {it.satuan || ''} x Rp{' '}
                    {(it.hargaPerKg || it.hargaSatuan || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-between">
                <span>Cucian Laundry</span>
                <span>Rp {totalTagihan.toLocaleString('id-ID')}</span>
              </div>
            )}

            {diskon > 0 && (
              <div className="flex justify-between text-rose-700 text-[10px] pt-1">
                <span>Diskon</span>
                <span>-Rp {diskon.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="border-t border-slate-300 pt-1 flex justify-between font-bold">
              <span>Total Tagihan</span>
              <span>Rp {totalTagihan.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between text-slate-700">
              <span>Dibayar</span>
              <span>Rp {nominalDibayar.toLocaleString('id-ID')}</span>
            </div>

            {!isLunas && sisaPelunasan > 0 && (
              <div className="flex justify-between font-bold text-rose-700">
                <span>Sisa Tagihan</span>
                <span>Rp {sisaPelunasan.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-700 my-2" />

          {/* Info Pembayaran (Hanya tampil jika non-tunai seperti Transfer / QRIS) */}
          {transaksi.metodePembayaran &&
            !['tunai', 'cash'].includes(transaksi.metodePembayaran.trim().toLowerCase()) && (
              <p className="text-[9px] text-center font-bold text-slate-800">
                Metode: {transaksi.metodePembayaran}
                {transaksi.metodePembayaranDetail ? ` (${transaksi.metodePembayaranDetail})` : ''}
              </p>
            )}

          {transaksi.catatan && (
            <p className="text-[9px] text-center text-slate-700 italic">
              Catatan: {transaksi.catatan}
            </p>
          )}

          {settings.footerStruk && (
            <p className="text-[9px] text-center text-slate-600 leading-tight">
              {settings.footerStruk}
            </p>
          )}

          {settings.chattyFooter && (
            <p className="text-[9px] text-center font-bold text-slate-800">
              {settings.chattyFooter}
            </p>
          )}

          <p className="text-center text-[8px] text-slate-500 italic mt-1">
            Simpan struk ini sebagai bukti transaksi yang sah.
          </p>
        </div>
      </div>
    );
  }
);

ReceiptPaper.displayName = 'ReceiptPaper';
