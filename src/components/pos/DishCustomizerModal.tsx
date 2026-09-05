'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Flame, Sparkles } from 'lucide-react';
import { Dish, CartItem, PortionOption, AddonOption } from '@/types';
import { PORTION_OPTIONS, ADDON_OPTIONS, SPICE_LEVELS } from '@/data/options';
import { SafeImage } from '@/components/common/SafeImage';

interface DishCustomizerModalProps {
  dish: Dish | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export function DishCustomizerModal({ dish, onClose, onAddToCart }: DishCustomizerModalProps) {
  if (!dish) return null;

  return (
    <DishCustomizerModalContent
      dish={dish}
      onClose={onClose}
      onAddToCart={onAddToCart}
    />
  );
}

function DishCustomizerModalContent({
  dish,
  onClose,
  onAddToCart,
}: {
  dish: Dish;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState<PortionOption>(PORTION_OPTIONS[0]);
  const [selectedSpice, setSelectedSpice] = useState<number>(dish.spiceLevel || 2);
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');

  const toggleAddon = (addon: AddonOption) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) return prev.filter((a) => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = dish.price + selectedPortion.priceDelta + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    let station = 'general';
    const cat = (dish.category || '').toLowerCase();
    const name = (dish.name || '').toLowerCase();
    if (cat.includes('biryani') || cat.includes('rice') || cat.includes('curry') || name.includes('haleem')) {
      station = 'biryani_curry';
    } else if (cat.includes('bbq') || name.includes('kabab') || name.includes('paratha') || name.includes('roll')) {
      station = 'tandoor';
    } else if (cat.includes('lassi') || cat.includes('drink') || cat.includes('snack') || name.includes('puri')) {
      station = 'sides_drinks';
    }

    const cartItem: CartItem = {
      cartItemId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dish,
      quantity,
      portion: selectedPortion,
      spiceLevel: selectedSpice,
      selectedAddons,
      specialNotes: specialNotes.trim() || undefined,
      unitPrice,
      totalPrice,
      station,
      completedInKitchen: false,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E9E8E7] my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header with Image & Title */}
        <div className="relative h-44 bg-[#F4F3F2] overflow-hidden">
          <SafeImage
            src={dish.imageUrl}
            alt={dish.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 500px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#BA1A20] text-white">
                {dish.category}
              </span>
              {dish.isChefSpecial && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#B45309] text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Chef&apos;s Special
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-lg text-white leading-tight drop-shadow-sm">
              {dish.name}
            </h3>
            <p className="text-xs text-white/90 font-bold mt-0.5">
              Base Price: ₱{dish.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Customization Options Body */}
        <div className="p-5 max-h-[58vh] overflow-y-auto space-y-5">
          {/* Portion Selection */}
          <div>
            <label className="block text-xs font-extrabold text-[#2D2926] uppercase tracking-wider mb-2">
              Select Portion Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PORTION_OPTIONS.map((portion) => {
                const isSelected = selectedPortion.id === portion.id;
                return (
                  <button
                    key={portion.id}
                    type="button"
                    onClick={() => setSelectedPortion(portion)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#BA1A20] bg-[#FFF2F0] text-[#BA1A20] shadow-xs'
                        : 'border-[#E9E8E7] bg-white text-[#5B403D] hover:bg-[#F4F3F2]'
                    }`}
                  >
                    <p className="text-xs font-bold leading-snug">{portion.name}</p>
                    <p className="text-[10px] text-[#8F6F6C]">{portion.serves}</p>
                    <p className="text-xs font-extrabold mt-1">
                      {portion.priceDelta === 0 ? 'Included' : `+₱${portion.priceDelta}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spice Level Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold text-[#2D2926] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#BA1A20]" />
                Spice Level
              </label>
              <span className="text-xs font-bold text-[#B45309]">
                {SPICE_LEVELS.find((s) => s.level === selectedSpice)?.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {SPICE_LEVELS.map((spice) => {
                const isSelected = selectedSpice === spice.level;
                return (
                  <button
                    key={spice.level}
                    type="button"
                    onClick={() => setSelectedSpice(spice.level)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#BA1A20] bg-[#FFF2F0] text-[#BA1A20] shadow-xs'
                        : 'border-[#E9E8E7] bg-white text-[#5B403D] hover:bg-[#F4F3F2]'
                    }`}
                  >
                    <div className="text-base">{spice.icon}</div>
                    <p className="text-[10px] font-bold mt-0.5">{spice.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add-ons Checklist */}
          <div>
            <label className="block text-xs font-extrabold text-[#2D2926] uppercase tracking-wider mb-2">
              Optional Sides & Add-ons
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ADDON_OPTIONS.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] shadow-xs'
                        : 'border-[#E9E8E7] bg-white text-[#5B403D] hover:bg-[#F4F3F2]'
                    }`}
                  >
                    <div className="pr-2">
                      <p className="text-xs font-bold leading-tight">{addon.name}</p>
                    </div>
                    <span className="text-xs font-extrabold whitespace-nowrap">
                      +₱{addon.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kitchen Special Notes */}
          <div>
            <label className="block text-xs font-extrabold text-[#2D2926] uppercase tracking-wider mb-1">
              Special Kitchen Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Less oil, extra crispy, no coriander..."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E9E8E7] bg-[#FAF9F8] focus:bg-white focus:border-[#BA1A20] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Footer: Stepper & Add Button */}
        <div className="p-4 bg-white border-t border-[#E9E8E7] flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-[#F4F3F2] rounded-xl border border-[#E9E8E7] p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1.5 rounded-lg hover:bg-white text-[#2D2926] disabled:opacity-30 transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-extrabold text-[#2D2926]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1.5 rounded-lg hover:bg-white text-[#2D2926] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-all shadow-sm"
          >
            <span>Add to Cart</span>
            <span>•</span>
            <span className="font-extrabold">₱{totalPrice.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
