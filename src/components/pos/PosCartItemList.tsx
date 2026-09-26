'use client';

import React from 'react';
import { Utensils, Plus, Minus, Trash2 } from 'lucide-react';
import { CartItem } from '@/types';

interface PosCartItemListProps {
  items: CartItem[];
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
}

const getSpiceLabel = (level?: number) => {
  switch (level) {
    case 1:
      return 'Mild';
    case 2:
      return 'Medium';
    case 3:
      return 'Hot Spicy';
    case 4:
      return 'Very Spicy';
    default:
      return null;
  }
};

export function PosCartItemList({
  items,
  onUpdateQty,
  onRemoveItem,
}: PosCartItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0 flex flex-col items-center justify-center text-center text-[#A3A3A3]">
        <Utensils className="w-7 h-7 stroke-1 text-[#D4D4D4] mb-2" />
        <p className="text-xs font-semibold text-[#525252]">No items in ticket</p>
        <p className="text-[11px] text-[#A3A3A3] mt-0.5">
          Tap any dish from the menu to add.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
      {items.map((item) => (
        <div
          key={item.cartItemId}
          className="p-2.5 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5] flex items-center justify-between gap-2"
        >
          {/* Item Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-1">
              <h5 className="text-xs font-bold text-[#1F1F1F] truncate">
                {item.dish.name}
              </h5>
              <span className="text-xs font-mono font-bold text-[#1F1F1F] shrink-0">
                ₱{item.totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#737373] mt-0.5">
              <span>₱{item.unitPrice.toLocaleString()}</span>
              {item.selectedVariants && item.selectedVariants.length > 0 ? (
                item.selectedVariants.map((v, idx) => (
                  <span key={idx} className="bg-[#EFEFEF] px-1.5 py-0.2 rounded font-medium text-neutral-800">
                    {v.groupName}: {v.optionName}
                  </span>
                ))
              ) : (
                <>
                  {item.portion?.priceDelta > 0 && <span>• {item.portion.name}</span>}
                </>
              )}
              {item.spiceLevel &&
                item.spiceLevel > 0 &&
                !item.selectedVariants?.some((v) => v.groupName.toLowerCase().includes('spice')) &&
                getSpiceLabel(item.spiceLevel) && (
                <span className={`px-1 py-0.2 rounded font-semibold ${
                  item.spiceLevel >= 4
                    ? 'bg-red-100 text-red-700'
                    : item.spiceLevel === 3
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  Spice: {getSpiceLabel(item.spiceLevel)}
                </span>
              )}
              {item.selectedAddons?.map((a) => (
                <span key={a.id}>• +{a.name}</span>
              ))}
              {item.specialNotes && (
                <span className="text-amber-800 italic block w-full mt-0.5">
                  Note: {item.specialNotes}
                </span>
              )}
            </div>
          </div>

          {/* Live Stepper & Remove */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <div className="flex items-center bg-white border border-[#E5E5E5] rounded-md">
              <button
                type="button"
                onClick={() => onUpdateQty(item.cartItemId, -1)}
                className="px-2 py-1 text-xs text-[#525252] hover:bg-[#F5F5F5] rounded-l-md"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <span className="w-5 text-center text-xs font-bold text-[#1F1F1F]">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(item.cartItemId, 1)}
                className="px-2 py-1 text-xs text-[#525252] hover:bg-[#F5F5F5] rounded-r-md"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onRemoveItem(item.cartItemId)}
              className="p-1 text-[#A3A3A3] hover:text-[#BA1A20] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
