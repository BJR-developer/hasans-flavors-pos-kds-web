'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, X, Flame, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { Dish, CartItem, Order } from '@/types';
import { useDishes, useCategories } from '@/hooks/useRestaurantData';
import { PosCartPane } from './PosCartPane';
import { DishCustomizerModal } from './DishCustomizerModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { PORTION_OPTIONS } from '@/data/options';

export function PosRegister() {
  const { data: dishes = [] } = useDishes();
  const { data: categories = [] } = useCategories();

  // Local State
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customizingDish, setCustomizingDish] = useState<Dish | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Filtered Dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      // Category filter
      if (selectedCatId !== 'all') {
        const cat = categories.find((c) => c.id === selectedCatId);
        if (cat && cat.match) {
          const regex = new RegExp(cat.match, 'i');
          if (!regex.test(dish.name) && !regex.test(dish.category)) {
            return false;
          }
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = dish.name.toLowerCase().includes(q);
        const matchesCat = dish.category.toLowerCase().includes(q);
        const matchesDesc = dish.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [dishes, selectedCatId, searchQuery, categories]);

  // Quick 1-tap add with default portion & spice
  const handleQuickAdd = (dish: Dish, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dish.inStock) return;

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

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.dish.id === dish.id && item.portion.id === 'regular' && item.selectedAddons.length === 0
      );

      if (existing) {
        return prev.map((item) =>
          item.cartItemId === existing.cartItemId
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: item.unitPrice * (item.quantity + 1),
              }
            : item
        );
      }

      const newItem: CartItem = {
        cartItemId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        dish,
        quantity: 1,
        portion: PORTION_OPTIONS[0],
        spiceLevel: dish.spiceLevel || 2,
        selectedAddons: [],
        unitPrice: dish.price,
        totalPrice: dish.price,
        station,
        completedInKitchen: false,
      };

      return [...prev, newItem];
    });
  };

  const handleAddCustomizedItem = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (p) =>
          p.dish.id === item.dish.id &&
          p.portion.id === item.portion.id &&
          p.spiceLevel === item.spiceLevel &&
          p.selectedAddons.length === item.selectedAddons.length &&
          p.specialNotes === item.specialNotes
      );

      if (existing) {
        return prev.map((p) =>
          p.cartItemId === existing.cartItemId
            ? {
                ...p,
                quantity: p.quantity + item.quantity,
                totalPrice: p.unitPrice * (p.quantity + item.quantity),
              }
            : p
        );
      }

      return [...prev, item];
    });
  };

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0
              ? { ...item, quantity: nextQty, totalPrice: item.unitPrice * nextQty }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-[#FAF9F8]">
      {/* LEFT: Menu Catalog & Categories Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Search & Category Filter Bar */}
        <div className="p-4 bg-white border-b border-[#E9E8E7] space-y-3 shrink-0">
          {/* Search Box */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-[#8F6F6C] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Quick search dishes, biryani, curries, cold beverages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#E9E8E7] bg-[#FAF9F8] text-xs font-medium text-[#2D2926] focus:bg-white focus:outline-none focus:border-[#BA1A20] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-0.5 text-[#8F6F6C] hover:text-[#2D2926]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs font-bold text-[#8F6F6C] whitespace-nowrap">
              {filteredDishes.length} items
            </span>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#BA1A20] text-white shadow-xs'
                      : 'bg-[#F4F3F2] text-[#5B403D] hover:bg-[#E9E8E7] hover:text-[#2D2926]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[#8F6F6C]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dish Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {filteredDishes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[#8F6F6C]">
              <AlertCircle className="w-8 h-8 stroke-1 text-[#8F6F6C] mb-2" />
              <p className="font-bold text-sm text-[#2D2926]">No dishes found</p>
              <p className="text-xs text-[#8F6F6C] mt-1">
                Try clearing your search query or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredDishes.map((dish) => {
                const totalInCart = cartItems
                  .filter((item) => item.dish.id === dish.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div
                    key={dish.id}
                    onClick={() => dish.inStock && setCustomizingDish(dish)}
                    className={`group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col cursor-pointer ${
                      dish.inStock
                        ? 'border-[#E9E8E7] hover:border-[#BA1A20] hover:shadow-md'
                        : 'border-[#E9E8E7] opacity-60 cursor-not-allowed'
                    } ${totalInCart > 0 ? 'ring-2 ring-[#BA1A20]' : ''}`}
                  >
                    {/* Dish Image */}
                    <div className="relative h-32 w-full bg-gray-100 overflow-hidden">
                      <Image
                        src={dish.imageUrl}
                        alt={dish.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />

                      {/* In Cart Badge */}
                      {totalInCart > 0 && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#BA1A20] text-white flex items-center justify-center text-xs font-black shadow-sm">
                          {totalInCart}
                        </div>
                      )}

                      {/* Out of stock badge */}
                      {!dish.inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-black uppercase tracking-wider">
                          Out of Stock (86)
                        </div>
                      )}

                      {/* Chef Special Badge */}
                      {dish.isChefSpecial && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#B45309] text-white text-[9px] font-bold flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" /> Special
                        </div>
                      )}
                    </div>

                    {/* Dish Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-[#8F6F6C] font-semibold mb-1">
                          <span className="truncate max-w-[130px]">{dish.category}</span>
                          {dish.spiceLevel > 1 && (
                            <span className="flex items-center text-[#BA1A20] font-bold">
                              <Flame className="w-3 h-3" />
                              <span>Lv.{dish.spiceLevel}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-xs text-[#2D2926] line-clamp-2 leading-snug group-hover:text-[#BA1A20] transition-colors">
                          {dish.name}
                        </h3>
                      </div>

                      {/* Price & Quick Add Button */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F1F0F0]">
                        <span className="text-sm font-black text-[#BA1A20]">
                          ₱{dish.price.toLocaleString()}
                        </span>

                        {dish.inStock && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(dish, e)}
                            className="p-1.5 rounded-lg bg-[#FAF9F8] hover:bg-[#BA1A20] text-[#5B403D] hover:text-white border border-[#E9E8E7] transition-all shadow-2xs"
                            title="Quick add to order"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: POS Cart Pane */}
      <PosCartPane
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderCompleted={(order) => setReceiptOrder(order)}
      />

      {/* Dish Customizer Modal */}
      <DishCustomizerModal
        dish={customizingDish}
        onClose={() => setCustomizingDish(null)}
        onAddToCart={handleAddCustomizedItem}
      />

      {/* Printable Thermal Receipt Modal */}
      <ThermalReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}
