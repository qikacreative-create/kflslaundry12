import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  Tag,
  Search,
  Sparkles,
  Scale,
  Clock,
  Zap,
  Shirt,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  GripVertical,
  Lock,
} from 'lucide-react';
import { Layanan, SettingsData } from '../types';
import { formatRupiah, formatRibuanInput, bersihkanTitik } from '../utils/formatters';
import { useToast, useConfirm } from '../components/NotificationContext';
import { isProTier, getLaundryLimits, UNLIMITED_QUOTA } from '../utils/subscription';
import { SwipeableItem } from '../components/SwipeableItem';

interface KelolaLayananViewProps {
  onBack: () => void;
  layananList: Layanan[];
  activeLaundryId: string;
  settings?: SettingsData;
  currentTier?: string | null;
  onSaveLayanan: (layanan: Layanan) => void;
  onDeleteLayanan: (layananId: string) => void;
  onReorderLayanan: (reorderedList: Layanan[]) => void;
  onOpenUpgradeModal?: (reason?: string) => void;
}

// Preset standard services that owners frequently use
const PRESET_STANDAR_LAUNDRY: Omit<Layanan, 'id' | 'laundryId' | 'urutan'>[] = [
  { nama: 'Cuci Setrika Reguler', harga: 7000, satuanHarga: 'Kg', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true },
  { nama: 'Cuci Setrika Kilat', harga: 10000, satuanHarga: 'Kg', durasi: '1 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true },
  { nama: 'Cuci Kering Lipat', harga: 6000, satuanHarga: 'Kg', durasi: '2 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true },
  { nama: 'Setrika Saja', harga: 5000, satuanHarga: 'Kg', durasi: '2 Hari', satuanDurasi: 'Hari', hitungBebanKerja: true },
  { nama: 'Cuci Bedcover Besar', harga: 25000, satuanHarga: 'pcs', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: false },
  { nama: 'Cuci Bedcover Sedang', harga: 20000, satuanHarga: 'pcs', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: false },
  { nama: 'Cuci Selimut Tebal', harga: 15000, satuanHarga: 'pcs', durasi: '2 Hari', satuanDurasi: 'Hari', hitungBebanKerja: false },
  { nama: 'Cuci Sepatu Premium', harga: 25000, satuanHarga: 'Pasang', durasi: '3 Hari', satuanDurasi: 'Hari', hitungBebanKerja: false },
  { nama: 'Cuci Karpet', harga: 15000, satuanHarga: 'Meter', durasi: '14 Hari', satuanDurasi: 'Hari', hitungBebanKerja: false },
];

export const KelolaLayananView: React.FC<KelolaLayananViewProps> = ({
  onBack,
  layananList,
  activeLaundryId,
  settings,
  currentTier,
  onSaveLayanan,
  onDeleteLayanan,
  onReorderLayanan,
  onOpenUpgradeModal,
}) => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [editingLayanan, setEditingLayanan] = useState<Layanan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'kg' | 'satuan' | 'beban'>('all');

  const isPro = isProTier(currentTier);
  const limits = getLaundryLimits(currentTier);
  const isLimitReached = layananList.length >= limits.maxServices;

  // Form states
  const [nama, setNama] = useState('');
  const [hargaStr, setHargaStr] = useState('7.000');
  const [satuanHarga, setSatuanHarga] = useState('Kg');
  const [durasiAngka, setDurasiAngka] = useState('3');
  const [durasiSatuan, setDurasiSatuan] = useState('Hari');
  const [hitungBebanKerja, setHitungBebanKerja] = useState(true);

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    return layananList.filter((lay) => {
      const matchSearch =
        lay.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lay.harga.toString().includes(searchQuery) ||
        lay.satuanHarga.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'kg') return lay.satuanHarga.toLowerCase() === 'kg';
      if (activeFilter === 'satuan') return lay.satuanHarga.toLowerCase() !== 'kg';
      if (activeFilter === 'beban') return lay.hitungBebanKerja;
      return true;
    });
  }, [layananList, searchQuery, activeFilter]);

  const openAddModal = () => {
    if (isLimitReached) {
      toast.warning(`Batas ${limits.maxServices} jenis layanan telah tercapai. Fitur penambahan layanan lebih banyak hanya untuk Paket Premium.`);
      return;
    }
    setEditingLayanan(null);
    setNama('');
    setHargaStr('7.000');
    setSatuanHarga('Kg');
    setDurasiAngka('3');
    setDurasiSatuan('Hari');
    setHitungBebanKerja(true);
    setIsModalOpen(true);
  };

  const openEditModal = (lay: Layanan) => {
    setEditingLayanan(lay);
    setNama(lay.nama);
    setHargaStr(formatRibuanInput(lay.harga));
    setSatuanHarga(lay.satuanHarga);

    const parts = lay.durasi.split(' ');
    setDurasiAngka(parts[0] || '1');
    setDurasiSatuan(parts[1] || 'Hari');
    setHitungBebanKerja(lay.hitungBebanKerja);
    setIsModalOpen(true);
  };

  const applyPreset = (preset: typeof PRESET_STANDAR_LAUNDRY[0]) => {
    setNama(preset.nama);
    setHargaStr(formatRibuanInput(preset.harga));
    setSatuanHarga(preset.satuanHarga);
    const parts = preset.durasi.split(' ');
    setDurasiAngka(parts[0] || '1');
    setDurasiSatuan(parts[1] || 'Hari');
    setHitungBebanKerja(preset.hitungBebanKerja);
  };

  const handleSave = () => {
    const numericHarga = bersihkanTitik(hargaStr);
    if (!nama.trim()) {
      toast.warning('Nama layanan wajib diisi.');
      return;
    }
    if (numericHarga <= 0) {
      toast.warning('Harga harus lebih dari Rp 0.');
      return;
    }

    if (!editingLayanan && isLimitReached) {
      toast.warning(`Batas ${limits.maxServices} jenis layanan telah tercapai. Fitur penambahan layanan lebih banyak hanya untuk Paket Premium.`);
      return;
    }

    const payload: Layanan = {
      id: editingLayanan ? editingLayanan.id : `lay-${Date.now()}`,
      laundryId: activeLaundryId,
      nama: nama.trim(),
      harga: numericHarga,
      satuanHarga,
      durasi: `${durasiAngka} ${durasiSatuan}`,
      satuanDurasi: durasiSatuan,
      hitungBebanKerja,
      urutan: editingLayanan ? editingLayanan.urutan : layananList.length,
    };

    onSaveLayanan(payload);
    setIsModalOpen(false);
    toast.success(editingLayanan ? 'Layanan berhasil diperbarui!' : 'Layanan baru berhasil ditambahkan!');
  };

  const handleToggleBeban = (lay: Layanan) => {
    onSaveLayanan({
      ...lay,
      hitungBebanKerja: !lay.hitungBebanKerja,
    });
  };

  // Drag and Drop state (HTML5 Desktop + Mobile Touch)
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const touchStartIdRef = useRef<string | null>(null);
  const [touchDraggingId, setTouchDraggingId] = useState<string | null>(null);
  const [touchTargetId, setTouchTargetId] = useState<string | null>(null);

  const handleReorderById = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIndex = layananList.findIndex((it) => it.id === sourceId);
    const targetIndex = layananList.findIndex((it) => it.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updated = [...layananList];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((it, idx) => ({ ...it, urutan: idx }));
    onReorderLayanan(reordered);
    toast.success('Urutan layanan berhasil diperbarui!');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      handleReorderById(draggedId, targetId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleTouchDragStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    touchStartIdRef.current = id;
    setTouchDraggingId(id);
    setTouchTargetId(id);
  };

  const handleTouchDragMove = (e: React.TouchEvent) => {
    if (!touchStartIdRef.current) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardElem = elem?.closest('[data-service-id]');
    if (cardElem) {
      const targetId = cardElem.getAttribute('data-service-id');
      if (targetId && targetId !== touchTargetId) {
        setTouchTargetId(targetId);
      }
    }
  };

  const handleTouchDragEnd = () => {
    if (touchStartIdRef.current && touchTargetId && touchStartIdRef.current !== touchTargetId) {
      handleReorderById(touchStartIdRef.current, touchTargetId);
    }
    touchStartIdRef.current = null;
    setTouchDraggingId(null);
    setTouchTargetId(null);
  };

  const handleDeleteLayananConfirm = async (lay: Layanan) => {
    const ok = await confirm({
      title: 'Hapus Layanan',
      message: `Yakin ingin menghapus layanan '${lay.nama}'?`,
      confirmText: 'Ya, Hapus',
      isDestructive: true,
    });
    if (ok) {
      onDeleteLayanan(lay.id);
      toast.success(`Layanan '${lay.nama}' berhasil dihapus.`);
    }
  };

  const handleResetToStandard = async () => {
    if (layananList.length + PRESET_STANDAR_LAUNDRY.length > limits.maxServices) {
      toast.warning(`${limits.label} dibatasi maksimal ${limits.maxServices} jenis layanan.`);
      onOpenUpgradeModal?.(`${limits.label} dibatasi maksimal ${limits.maxServices} jenis layanan. Tingkatkan paket untuk mengimpor seluruh paket standar.`);
      return;
    }

    const ok = await confirm({
      title: 'Tambah Paket Standar',
      message: 'Tambahkan 9 paket layanan standar laundry lengkap (Cuci Setrika, Bedcover, Sepatu, dll.)?',
      confirmText: 'Ya, Tambahkan',
    });
    if (ok) {
      PRESET_STANDAR_LAUNDRY.forEach((preset, idx) => {
        const item: Layanan = {
          ...preset,
          id: `lay-${Date.now()}-${idx}`,
          laundryId: activeLaundryId,
          urutan: layananList.length + idx,
        };
        onSaveLayanan(item);
      });
      toast.success('Paket layanan standar berhasil ditambahkan!');
    }
  };

  // Quick nominal adjustment buttons
  const addNominal = (amt: number) => {
    const currentVal = bersihkanTitik(hargaStr);
    const nextVal = Math.max(0, currentVal + amt);
    setHargaStr(formatRibuanInput(nextVal));
  };

  const setNominal = (amt: number) => {
    setHargaStr(formatRibuanInput(amt));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-8">
      {/* Top Header */}
      <header className="bg-[#800000] text-white shadow-lg sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-xl hover:bg-white/10 active:scale-95 transition"
            title="Kembali ke Pengaturan"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-black text-base tracking-tight leading-tight">Kelola Daftar Harga</h1>
            <p className="text-[11px] text-white/80 font-medium">
              {limits.maxServices < UNLIMITED_QUOTA
                ? `${layananList.length}/${limits.maxServices} Layanan Aktif (${limits.label})`
                : `${layananList.length} Layanan Aktif (Unlimited)`}
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer ${
            isLimitReached
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              : 'bg-white text-[#800000] hover:bg-amber-50'
          }`}
        >
          {isLimitReached ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
          <span>{isLimitReached ? `Batas ${limits.maxServices} Penuh` : 'Tambah Layanan'}</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto w-full px-2 md:px-6 py-1 md:py-6 space-y-1">
        {/* Search & Filter Controls */}
<div className="bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
  
  {/* 1. Kolom Input Pencarian (Flex-1 agar menyesuaikan ruang sisa) */}
  <div className="relative flex-1 min-w-0">
    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Cari nama layanan, tarif, atau satuan..."
      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800000] transition"
    />
    {searchQuery && (
      <button
        type="button"
        onClick={() => setSearchQuery('')}
        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>

  {/* 2. Informasi Jumlah Layanan & Tombol Paket Standar (Di sebelah kanan) */}
  <div className="flex items-center gap-3 shrink-0 text-xs">
    <span className="font-medium text-[11px] text-slate-500 hidden sm:inline">
      Menampilkan <strong className="text-slate-800">{filteredList.length}</strong> dari {layananList.length}
    </span>

    <button
      type="button"
      onClick={handleResetToStandard}
      className="flex items-center gap-1 text-[11px] font-bold text-[#800000] hover:text-[#660000] bg-rose-50/80 border border-rose-100 hover:bg-rose-100 px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span>+ Paket Standar</span>
    </button>
  </div>

</div>

        {/* Tip Banner Panduan Klik Edit, Swipe & Drag */}
        <div className="bg-gradient-to-r from-amber-50 to-rose-50/70 border border-amber-200/80 rounded-2xl p-2 px-2 flex items-center justify-between gap-2 text-[11px] text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
          
            <span className="leading-tight">
              <strong>Klik</strong> untuk edit. <strong>Tarik </strong> untuk ubah urutan, <strong>geser kanan</strong> untuk hapus.
            </span>
          </div>
        </div>

        {/* Services List Card Stack */}
        <main className="space-y-1">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  {searchQuery ? 'Layanan Tidak Ditemukan' : 'Belum Ada Layanan Terdaftar'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? `Tidak ada layanan yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                    : 'Tambahkan paket layanan laundry baru atau muat paket standar lengkap.'}
                </p>
              </div>
              <div className="pt-1 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  + Tambah Layanan Baru
                </button>
                <button
                  onClick={handleResetToStandard}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Muat Preset Standar</span>
                </button>
              </div>
            </div>
          ) : (
            filteredList.map((lay, idx) => {
              const isKg = lay.satuanHarga.toLowerCase() === 'kg';
              const isExpress = lay.durasi.toLowerCase().includes('jam') || lay.durasi.toLowerCase().includes('1 hari');
              const isBeingDragged = draggedId === lay.id || touchDraggingId === lay.id;
              const isDropTarget = (dragOverId === lay.id || touchTargetId === lay.id) && !isBeingDragged;

             return (
  <div
    key={lay.id}
    data-service-id={lay.id}
    draggable={!searchQuery}
    onDragStart={(e) => handleDragStart(e, lay.id)}
    onDragOver={(e) => handleDragOver(e, lay.id)}
    onDrop={(e) => handleDrop(e, lay.id)}
    onDragEnd={handleDragEnd}
    className={`transition-all duration-150 ${
      isBeingDragged ? 'opacity-40 scale-[0.98] ring-2 ring-[#800000] rounded-2xl' : ''
    } ${isDropTarget ? 'border-t-4 border-t-[#800000] -mt-1 pt-1' : ''}`}
  >
<SwipeableItem
      id={lay.id}
      onSwipeRightDelete={() => handleDeleteLayananConfirm(lay)}
      deleteLabel="Hapus Layanan"
      threshold={90}
    >
      <div
        onClick={() => openEditModal(lay)}
        title="Klik untuk mengedit layanan"
        className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-[#800000]/40 hover:bg-slate-50/70 transition cursor-pointer active:scale-[0.99]"
      >


        {/* 2. Badge Durasi */}
        <span className={`text-[10px] font-semibold px-1 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${
          isExpress ? 'bg-amber-100/80 text-amber-800' : 'bg-slate-100 text-slate-600'
        }`}>
          <span>{lay.durasi}</span>
        </span>


        {/* 3. Nama Layanan (Flex-1 agar mengisi ruang tengah & bisa berdampingan dengan harga) */}
        <h4 className="font-bold text-xs text-slate-900 truncate flex-1 min-w-0">
          {lay.nama}
        </h4>

        {/* 4. Harga & Satuan (Rata Kanan di ujung menggunakan ml-auto) */}
        <div className="text-right shrink-0 ml-auto pl-2">
          <span className="text-xs sm:text-sm font-black text-[#800000] tracking-tight">{formatRupiah(lay.harga)}</span>
          <span className="text-[9px] font-medium text-slate-400 ml-1">/ {lay.satuanHarga}</span>
        </div>
                {/* 1. Staff Workload Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleBeban(lay);
          }}
          title="Klik untuk mengubah status hitungan beban staf"
          className={`w-5 h-5 rounded-lg border transition flex items-center justify-center cursor-pointer shrink-0 ${
            lay.hitungBebanKerja
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${lay.hitungBebanKerja ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        </button>

      </div>

      
    </SwipeableItem>
  </div>
);
            })
          )}
        </main>
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#800000] text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">
                    {editingLayanan ? 'Ubah Layanan & Tarif' : 'Tambah Layanan Baru'}
                  </h3>
                  <p className="text-[10px] text-white/80">
                    Atur tarif harga dan durasi untuk nota kasir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition active:scale-90"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Quick Preset Selector for New Items */}
              {!editingLayanan && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Pilihan Cepat Standar Laundry:</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {PRESET_STANDAR_LAUNDRY.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#800000] hover:text-[#800000] text-[11px] font-semibold text-slate-700 transition shadow-2xs"
                      >
                        {p.nama} ({formatRupiah(p.harga)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Cuci Setrika / Cuci Selimut"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Price & Unit Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Price Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tarif Harga (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hargaStr}
                      onChange={(e) => setHargaStr(formatRibuanInput(e.target.value))}
                      placeholder="7.000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-[#800000] focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                    />
                  </div>
           
                </div>

                {/* Unit Select */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Satuan Hitung
                  </label>
                  <select
                    value={satuanHarga}
                    onChange={(e) => setSatuanHarga(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                  >
                    <option value="Kg">Kg (Kilogram)</option>
                    <option value="pcs">Pcs </option>
                    <option value="M">Meter </option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {satuanHarga === 'Kg' ? 'Dihitung per kilogram berat timbangan' : 'Dihitung per barang satuan'}
                  </p>
                </div>
              </div>

              {/* Duration Settings */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estimasi Durasi Pengerjaan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={durasiAngka}
                      onChange={(e) => setDurasiAngka(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-center focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <select
                      value={durasiSatuan}
                      onChange={(e) => setDurasiSatuan(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-[#800000] focus:outline-none transition shadow-2xs"
                    >
                      <option value="Hari">Hari</option>
                      <option value="Jam">Jam (Kilat / Express)</option>
                      <option value="Minggu">Minggu</option>
                    </select>
                  </div>
                </div>

                {/* Duration shortcut chips */}
                <div className="flex gap-1.5 mt-1.5">
               
                  <button
                    type="button"
                    onClick={() => {
                      setDurasiAngka('1');
                      setDurasiSatuan('Hari');
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                  >
                    1 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDurasiAngka('2');
                      setDurasiSatuan('Hari');
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                  >
                    2 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDurasiAngka('3');
                      setDurasiSatuan('Hari');
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                  >
                    3 Hari
                  </button>
                </div>
              </div>

              {/* Hitung Beban Kerja Staf */}
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/80 cursor-pointer hover:bg-slate-100/80 transition">
                <input
                  type="checkbox"
                  checked={hitungBebanKerja}
                  onChange={(e) => setHitungBebanKerja(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#800000] rounded cursor-pointer"
                />
                <div>
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span>Hitung Beban Kerja Harian Staf</span>
                    {settings?.hitungKerjaStaf === false && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                        Global Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {settings?.hitungKerjaStaf === false
                      ? 'Perhitungan kerja staf saat ini sedang dinonaktifkan di Pengaturan. Layanan ini tetap dapat dikonfigurasi dan akan berlaku saat perhitungan kerja staf diaktifkan kembali.'
                      : 'Aktifkan jika jumlah/berat layanan ini dimasukkan ke hitungan beban operasional kerja staf kasir/cuci.'}
                  </p>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-[#800000] hover:bg-[#660000] text-xs font-black text-white shadow-md transition active:scale-98"
                >
                  {editingLayanan ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
