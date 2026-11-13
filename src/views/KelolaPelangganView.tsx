import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Phone,
  MapPin,
  Trash2,
  Award,
  UserPlus,
  X,
  Lock,
  ArrowDownAZ,
  ArrowUpZA,
} from 'lucide-react';
import { Pelanggan, SettingsData } from '../types';
import { useToast, useConfirm } from '../components/NotificationContext';
import { isProTier, getLaundryLimits } from '../utils/subscription';
import { SwipeableItem } from '../components/SwipeableItem';

interface KelolaPelangganViewProps {
  onBack: () => void;
  pelangganList: Pelanggan[];
  settings: SettingsData;
  activeLaundryId: string;
  currentTier?: string | null;
  onSavePelanggan: (pelanggan: Pelanggan) => void;
  onDeletePelanggan: (pelangganId: string) => void;
  onOpenUpgradeModal?: (reason?: string) => void;
}

export const KelolaPelangganView: React.FC<KelolaPelangganViewProps> = ({
  onBack,
  pelangganList,
  settings,
  activeLaundryId,
  currentTier,
  onSavePelanggan,
  onDeletePelanggan,
  onOpenUpgradeModal,
}) => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingPelanggan, setEditingPelanggan] = useState<Pelanggan | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for modal
  const [nama, setNama] = useState('');
  const [telepon, setTelepon] = useState('62');
  const [alamat, setAlamat] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [catatani, setCatatani] = useState('');

  const isPro = isProTier(currentTier);
  const limits = getLaundryLimits(currentTier);
  const isCustomerLimitReached = pelangganList.length >= limits.maxCustomers;

  const openAddModal = () => {
    if (isCustomerLimitReached) {
      toast.warning(`Batas ${limits.maxCustomers} data pelanggan telah tercapai. Fitur kapasitas pelanggan lebih besar hanya untuk Paket Premium.`);
      return;
    }
    setEditingPelanggan(null);
    setNama('');
    setTelepon('62');
    setAlamat('');
    setAlamatLengkap('');
    setCatatani('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Pelanggan) => {
    setEditingPelanggan(p);
    setNama(p.nama);
    setTelepon(p.nomorTelepon || '62');
    setAlamat(p.alamat || '');
    setAlamatLengkap(p.alamatLengkap || '');
    setCatatani(p.catatani || '');
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!nama.trim()) {
      toast.warning('Nama pelanggan tidak boleh kosong.');
      return;
    }

    if (!editingPelanggan && isCustomerLimitReached) {
      toast.warning(`Batas ${limits.maxCustomers} data pelanggan telah tercapai. Fitur kapasitas pelanggan lebih besar hanya untuk Paket Premium.`);
      return;
    }

    const payload: Pelanggan = {
      id: editingPelanggan ? editingPelanggan.id : `pel-${Date.now()}`,
      laundryId: activeLaundryId,
      nama: nama.trim(),
      nomorTelepon: telepon.trim() || null,
      alamat: alamat.trim() || null,
      alamatLengkap: alamatLengkap.trim() || null,
      catatani: catatani.trim() || null,
      poin: editingPelanggan ? editingPelanggan.poin : 0,
    };

    onSavePelanggan(payload);
    setIsAddModalOpen(false);
  };

  const handleDeletePelangganConfirm = async (p: Pelanggan) => {
    const ok = await confirm({
      title: 'Hapus Pelanggan',
      message: `Yakin ingin menghapus data pelanggan '${p.nama}'?`,
      confirmText: 'Ya, Hapus',
      isDestructive: true,
    });
    if (ok) {
      onDeletePelanggan(p.id);
      toast.success(`Pelanggan '${p.nama}' berhasil dihapus.`);
    }
  };

  // Diurutkan berdasarkan abjad secara default (A-Z) dan dapat dibalik (Z-A) dengan pencarian cerdas nama & telepon
  const filtered = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ) {
      return [...pelangganList].sort((a, b) => {
        const nameA = (a.nama || '').trim();
        const nameB = (b.nama || '').trim();
        const comp = nameA.localeCompare(nameB, 'id', { sensitivity: 'base', numeric: true });
        return sortOrder === 'asc' ? comp : -comp;
      });
    }

    // Bersihkan karakter non-digit untuk pencarian nomor telepon fleksibel (format 08 vs 628)
    const digitsQ = rawQ.replace(/[^0-9]/g, '');
    const normQ = digitsQ.startsWith('0') ? '62' + digitsQ.slice(1) : digitsQ;
    const zeroQ = digitsQ.startsWith('62') ? '0' + digitsQ.slice(2) : digitsQ;

    const list = pelangganList.filter((p) => {
      const nama = (p.nama || '').toLowerCase();
      if (nama.includes(rawQ)) return true;

      const rawPhone = (p.nomorTelepon || '').toLowerCase();
      if (rawPhone.includes(rawQ)) return true;

      if (digitsQ.length >= 2) {
        const phoneDigits = rawPhone.replace(/[^0-9]/g, '');
        if (
          phoneDigits.includes(digitsQ) ||
          (normQ && phoneDigits.includes(normQ)) ||
          (zeroQ && phoneDigits.includes(zeroQ))
        ) {
          return true;
        }
      }

      const alamat = (p.alamat || '').toLowerCase();
      const alamatLengkap = (p.alamatLengkap || '').toLowerCase();
      const catatan = (p.catatani || '').toLowerCase();
      if (alamat.includes(rawQ) || alamatLengkap.includes(rawQ) || catatan.includes(rawQ)) {
        return true;
      }

      return false;
    });

    return [...list].sort((a, b) => {
      const nameA = (a.nama || '').trim();
      const nameB = (b.nama || '').trim();
      const comp = nameA.localeCompare(nameB, 'id', { sensitivity: 'base', numeric: true });
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [pelangganList, searchQuery, sortOrder]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-8">
      {/* Top Header */}
      <header className="bg-[#800000] text-white shadow-md sticky top-0 z-30 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-bold text-sl tracking-wide">Kelola Pelanggan</h1>
      
          </div>
        </div>
        <button
          onClick={openAddModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            isCustomerLimitReached
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
        >
          {isCustomerLimitReached ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
          <span>{isCustomerLimitReached ? 'Batas Penuh' : 'Tambah'}</span>
        </button>
      </header>

  {/* Kolom Input Pencarian & Tombol Urutkan dalam Satu Baris */}
<div className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-14 z-20 px-3 py-1 md:px-6">
  <div className="max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto w-full flex items-center gap-2">
    
    {/* Input Pencarian (Flex-1 agar mengambil sisa ruang yang ada) */}
    <div className="relative flex items-center flex-1 min-w-0">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Cari nama atau nomor telepon / WhatsApp pelanggan..."
        className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 focus:border-[#800000] rounded-xl py-2 pl-10 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#800000]/20 focus:outline-none transition"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          title="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

    {/* Tombol Sortir Abjad (Shrink-0 agar ukuran tombol tidak ikut mengecil) */}
    <button
      type="button"
      onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
      className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-[#800000] hover:border-[#800000] text-[11px] font-bold shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
      title={`Urutan abjad saat ini: ${sortOrder === 'asc' ? 'A ke Z' : 'Z ke A'}. Klik untuk membalikkan.`}
    >
      {sortOrder === 'asc' ? (
        <>
          <ArrowDownAZ className="w-3.5 h-3.5 text-[#800000] shrink-0" />
          <span>A - Z</span>
        </>
      ) : (
        <>
          <ArrowUpZA className="w-3.5 h-3.5 text-[#800000] shrink-0" />
          <span>Z - A</span>
        </>
      )}
    </button>

  </div>
</div>


      {/* Helper Tip Bar (Klik Edit & Swipe Kanan Hapus) */}
      <div className="px-3 md:px-6 py-1 max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-r from-amber-50 to-rose-50/70 border border-amber-200/80 rounded-2xl p-1 px-3 flex items-center justify-between gap-1 text-[11px] text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
         
            <span className="leading-tight">
              <strong>Klik </strong> untuk edit , <strong>geser ke kanan</strong> untuk hapus.
            </span>
               <span className="text-[11px]  md:text-xs ml-auto">
                
           <strong className="text-slate-800">- {pelangganList.length} Pelanggan</strong> 
          {searchQuery && ` (Ditemukan: ${filtered.length})`}
        </span>

          </div>
        </div>
      </div>

      <main className="flex-1 px-1 md:px-1 space-y-1 overflow-y-auto max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl text-center text-xs text-slate-500 border border-slate-200 shadow-2xs space-y-2">
            <p className="font-medium">
              {searchQuery
                ? `Tidak ada pelanggan yang cocok dengan pencarian "${searchQuery}".`
                : 'Belum ada pelanggan ditemukan.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-xl bg-[#800000] text-white font-bold text-xs hover:bg-[#660000] transition shadow-2xs cursor-pointer"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          filtered.map((p) => {
            const initial = (p.nama || '?').trim().charAt(0).toUpperCase();
return (
  <SwipeableItem
    key={p.id}
    id={p.id}
    onSwipeRightDelete={() => handleDeletePelangganConfirm(p)}
    deleteLabel="Hapus Pelanggan"
    threshold={90}
  >
    <div
      onClick={() => openEditModal(p)}
      title="Klik untuk mengedit data pelanggan"
      className="bg-white px-1 py-1 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1 hover:border-[#800000]/40 hover:bg-slate-50/70 transition w-full cursor-pointer active:scale-[0.99]"
    >
      {/* 1. Inisial Abjad Avatar */}
      <div className="w-6 h-6 rounded-xl bg-rose-50 text-[#800000] font-black text-[9px] flex items-center justify-center shrink-0 border border-rose-100">
        {initial}
      </div>

      {/* 2. Nama Pelanggan */}
      <span className="font-bold text-xs text-slate-900 truncate shrink-0 max-w-[120px] sm:max-w-[150px]">
        {p.nama}
      </span>

      <span className="text-slate-300 shrink-0">•</span>

      {/* 3. Alamat / Catatan (Mengambil sisa ruang dengan flex-1 dan truncate) */}
      <div className="min-w-0 flex-1 truncate">
        {p.catatani ? (
          <p className="text-[10px] text-amber-700 italic truncate">
            Catatan: {p.catatani}
          </p>
        ) : p.alamat ? (
          <span className="text-[10px] text-slate-500 truncate block">
            {p.alamat}
          </span>
        ) : (
          <span className="text-[10px] text-slate-300 italic">Tidak ada alamat/catatan</span>
        )}
      </div>

      {/* 4. Nomor Telepon (Di ujung kanan) */}
      {p.nomorTelepon && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-slate-600 shrink-0 font-medium bg-slate-100/80 px-2 py-1 rounded-xl"
        >
          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>{p.nomorTelepon}</span>
        </div>
      )}
    </div>
  </SwipeableItem>
);
          })
        )}
      </main>

      {/* Add / Edit Customer Dialog (Matches dialog_add_edit_pelanggan.xml) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#800000] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingPelanggan ? 'Ubah Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama lengkap..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nomor Telepon (awali dengan 62)
                </label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="62812..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Alamat Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Mawar No. 12"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Alamat Lengkap (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  placeholder="Perumahan, Blok, RT/RW, Patokan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Catatan Khusus Pelanggan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatani}
                  onChange={(e) => setCatatani(e.target.value)}
                  placeholder="Catatan kebiasaan cucian pelanggan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-xs font-bold text-white shadow-xs transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
