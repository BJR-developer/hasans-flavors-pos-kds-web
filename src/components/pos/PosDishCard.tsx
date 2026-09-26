'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Dish } from '@/types';
import { SafeImage } from '@/components/common/SafeImage';

interface PosDishCardProps {
  dish: Dish;
  inCartQty: number;
  onQuickAdd: (dish: Dish) => void;
  onCustomize: (dish: Dish) => void;
}

export function PosDishCard({
  dish,
  inCartQty,
  onQuickAdd,
  onCustomize,
}: PosDishCardProps) {
  const stockQty = dish.stockQuantity !== undefined ? dish.stockQuantity : (dish.inStock ? 50 : 0);
  const isAvailable = dish.inStock && stockQty > 0;

  return (
    <div
      onClick={() => isAvailable && onQuickAdd(dish)}
      className={`group relative p-2.5 rounded-xl border bg-white cursor-pointer transition-all duration-150 flex flex-col justify-between ${
        isAvailable
          ? inCartQty > 0
            ? 'border-[#BA1A20] shadow-xs'
            : 'border-[#E5E5E5] hover:border-[#A3A3A3] hover:shadow-xs'
          : 'border-[#E5E5E5] opacity-50 cursor-not-allowed'
      }`}
    >
      {/* Item Thumbnail */}
      <div className="relative h-24 sm:h-28 w-full rounded-lg overflow-hidden bg-[#F5F5F5] mb-2">
        <SafeImage
          src={dish.imageUrl}
          alt={dish.name}
          fill
          className="object-cover group-hover:scale-103 transition-transform duration-200"
          sizes="(max-width: 768px) 50vw, 20vw"
        />

        {/* Stock Count Badge for Cashier */}
        {isAvailable && (
          <div
            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold backdrop-blur-xs ${
              stockQty <= 5
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-black/60 text-white'
            }`}
          >
            {stockQty <= 5 ? `Low: ${stockQty}` : `${stockQty} left`}
          </div>
        )}

        {/* In-cart count badge */}
        {inCartQty > 0 && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#BA1A20] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            {inCartQty}
          </div>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold tracking-wide uppercase">
            Out of Stock
          </div>
        )}

        {/* Small subtle customize trigger */}
        {isAvailable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCustomize(dish);
            }}
            title="Customize portion / spice"
            className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-white/90 hover:bg-white text-[#525252] hover:text-[#1F1F1F] shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div>
        <h4 className="font-semibold text-xs text-[#1F1F1F] line-clamp-2 leading-tight">
          {dish.name}
        </h4>
      </div>

      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F5F5F5]">
        <span className="text-xs font-bold text-[#BA1A20]">
          ₱{dish.price.toLocaleString()}
        </span>
        <span className="text-[10px] text-[#A3A3A3] font-medium">+ Add</span>
      </div>
    </div>
  );
}
