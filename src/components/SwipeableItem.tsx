import React, { useState, useRef, useCallback } from 'react';
import { Trash2, ArrowRight } from 'lucide-react';

interface SwipeableItemProps {
  id: string;
  onSwipeRightDelete: () => void;
  deleteLabel?: string;
  threshold?: number;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  id,
  onSwipeRightDelete,
  deleteLabel = 'Hapus',
  threshold = 95,
  disabled = false,
  children,
  className = '',
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentOffsetXRef = useRef(0);
  const isSwipingRef = useRef(false);
  const directionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);
  const didSwipeRef = useRef(false);

  const handleClickCapture = (e: React.MouseEvent) => {
    if (didSwipeRef.current) {
      e.stopPropagation();
      e.preventDefault();
      didSwipeRef.current = false;
    }
  };

  // --- TOUCH HANDLERS (Mobile / Tablet) ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || e.touches.length !== 1) return;

    // Abaikan jika menyentuh tombol drag handle, input, atau tombol aksi langsung
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-drag-handle="true"]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a')
    ) {
      return;
    }

    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentOffsetXRef.current = 0;
    isSwipingRef.current = false;
    directionLockedRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - startXRef.current;
    const dy = currentY - startYRef.current;

    // Tentukan arah gesture pada 8px pertama
    if (directionLockedRef.current === null) {
      if (Math.hypot(dx, dy) < 8) return;

      if (Math.abs(dy) >= Math.abs(dx)) {
        // Pengguna sedang menggulir halaman ke atas/bawah, jangan ganggu
        directionLockedRef.current = 'vertical';
        return;
      }

      // Pengguna menggeser ke samping
      if (dx > 0) {
        directionLockedRef.current = 'horizontal';
        isSwipingRef.current = true;
        setIsSwiping(true);
      } else {
        // Abaikan swipe ke kiri karena hanya diminta swipe kanan untuk hapus
        directionLockedRef.current = 'vertical';
        return;
      }
    }

    if (directionLockedRef.current === 'horizontal') {
      // Terapkan resistensi elastis jika ditarik lebih jauh dari 130px
      let effectiveDx = Math.max(0, dx);
      if (effectiveDx > 130) {
        effectiveDx = 130 + (effectiveDx - 130) * 0.35;
      }

      currentOffsetXRef.current = effectiveDx;
      setOffsetX(effectiveDx);
      setIsPastThreshold(effectiveDx >= threshold);
    }
  };

  const handleTouchEnd = () => {
    if (directionLockedRef.current === 'horizontal') {
      const finalOffset = currentOffsetXRef.current;
      setIsSwiping(false);
      isSwipingRef.current = false;
      directionLockedRef.current = null;

      if (finalOffset > 6) {
        didSwipeRef.current = true;
        setTimeout(() => {
          didSwipeRef.current = false;
        }, 300);
      }

      if (finalOffset >= threshold) {
        // Animasi kembali ke posisi awal, lalu picu dialog konfirmasi hapus
        setOffsetX(0);
        setIsPastThreshold(false);
        // Beri jeda sangat singkat agar kartu kembali mulus sebelum modal muncul
        setTimeout(() => {
          onSwipeRightDelete();
        }, 120);
      } else {
        // Balikkan kartu ke posisi semula
        setOffsetX(0);
        setIsPastThreshold(false);
      }
    }
  };

  // --- MOUSE DRAG HANDLERS (Desktop testing / mouse swipe) ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('[data-drag-handle="true"]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a')
    ) {
      return;
    }

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentOffsetXRef.current = 0;
    isSwipingRef.current = true;
    directionLockedRef.current = null;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startXRef.current;
      const dy = moveEvent.clientY - startYRef.current;

      if (directionLockedRef.current === null) {
        if (Math.hypot(dx, dy) < 8) return;
        if (Math.abs(dy) >= Math.abs(dx) || dx < 0) {
          directionLockedRef.current = 'vertical';
          return;
        }
        directionLockedRef.current = 'horizontal';
        setIsSwiping(true);
      }

      if (directionLockedRef.current === 'horizontal') {
        let effectiveDx = Math.max(0, dx);
        if (effectiveDx > 130) {
          effectiveDx = 130 + (effectiveDx - 130) * 0.35;
        }
        currentOffsetXRef.current = effectiveDx;
        setOffsetX(effectiveDx);
        setIsPastThreshold(effectiveDx >= threshold);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (directionLockedRef.current === 'horizontal') {
        const finalOffset = currentOffsetXRef.current;
        setIsSwiping(false);
        isSwipingRef.current = false;
        directionLockedRef.current = null;

        if (finalOffset > 6) {
          didSwipeRef.current = true;
          setTimeout(() => {
            didSwipeRef.current = false;
          }, 300);
        }

        if (finalOffset >= threshold) {
          setOffsetX(0);
          setIsPastThreshold(false);
          setTimeout(() => {
            onSwipeRightDelete();
          }, 120);
        } else {
          setOffsetX(0);
          setIsPastThreshold(false);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl select-none ${className}`}
      onClickCapture={handleClickCapture}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Background Action: Hapus (Swipe Kanan) */}
      <div
        className={`absolute inset-0 rounded-2xl flex items-center justify-between px-4 transition-colors duration-150 ${
          isPastThreshold
            ? 'bg-rose-600 text-white shadow-inner'
            : 'bg-rose-500/90 text-white/95'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isPastThreshold
                ? 'bg-white text-rose-700 scale-110 shadow-md rotate-[-6deg]'
                : 'bg-white/20 text-white scale-95'
            }`}
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-tight leading-none">
              {isPastThreshold ? `Lepas untuk Hapus!` : `Geser ke kanan...`}
            </span>
            <span className="text-[10px] text-white/80 font-medium mt-0.5">
              {deleteLabel}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-white/70">
          <span>Geser</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      {/* Foreground Card Content */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        className="relative bg-white rounded-2xl z-10 w-full touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
};
