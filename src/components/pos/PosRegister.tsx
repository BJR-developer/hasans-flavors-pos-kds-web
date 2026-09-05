'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Dish, CartItem, Order } from '@/types';
import { useDishes, useCategories } from '@/hooks/useRestaurantData';
import { PosCartPane } from './PosCartPane';
import { DishCustomizerModal } from './DishCustomizerModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { PORTION_OPTIONS } from '@/data/options';

export function PosRegister() {
  const { data: dishes = [] } = useDishes();
  const { data: categories = [] } = useCategories();

  // Filters
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Modals
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customizingDish, setCustomizingDish] = useState<Dish | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCatId !== 'all') {
        const cat = categories.find((c) => c.id === selectedCatId);
        if (cat && cat.match) {
          const regex = new RegExp(cat.match, 'i');
          if (!regex.test(dish.name) && !regex.test(dish.category)) {
            return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchCat = dish.category.toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }

      return true;
    });
  }, [dishes, selectedCatId, searchQuery, categories]);

  // Fast 1-tap add directly to cart
  const handleFastAdd = (dish: Dish) => {
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
      const existingIndex = prev.findIndex(
        (i) => i.dish.id === dish.id && i.portion.id === 'regular' && i.selectedAddons.length === 0 && !i.specialNotes
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          totalPrice: item.unitPrice * newQty,
        };
        return updated;
      }

      const newItem: CartItem = {
        cartItemId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    setCartItems((prev) => [...prev, item]);
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

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-56px)] overflow-hidden bg-[#FAFAFA]">
      {/* Menu Catalog Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Minimal Category & Search Bar */}
        <div className="px-5 py-3 bg-white border-b border-[#E5E5E5] flex items-center justify-between gap-4 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCatId === 'all'
                  ? 'bg-[#1F1F1F] text-white'
                  : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#1F1F1F] text-white'
                      : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-48 sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] placeholder-[#A3A3A3] focus:bg-white focus:outline-none focus:border-[#1F1F1F] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#A3A3A3] hover:text-[#1F1F1F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Fast Dish Grid */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5">
          {filteredDishes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[#737373]">
              <AlertCircle className="w-6 h-6 stroke-1 text-[#A3A3A3] mb-1.5" />
              <p className="text-xs font-semibold text-[#1F1F1F]">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredDishes.map((dish) => {
                const inCartQty = cartItems
                  .filter((i) => i.dish.id === dish.id)
                  .reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <div
                    key={dish.id}
                    onClick={() => handleFastAdd(dish)}
                    className={`group relative bg-white rounded-xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                      dish.inStock
                        ? inCartQty > 0
                          ? 'border-[#BA1A20] shadow-xs'
                          : 'border-[#E5E5E5] hover:border-[#A3A3A3] hover:shadow-xs'
                        : 'border-[#E5E5E5] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Item Thumbnail */}
                    <div className="relative h-24 w-full rounded-lg overflow-hidden bg-[#F5F5F5] mb-2">
                      <Image
                        src={dish.imageUrl}
                        alt={dish.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />

                      {/* In-cart count badge */}
                      {inCartQty > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#BA1A20] text-white flex items-center justify-center text-[10px] font-bold">
                          {inCartQty}
                        </div>
                      )}

                      {!dish.inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold tracking-wide uppercase">
                          86 Out of Stock
                        </div>
                      )}

                      {/* Small subtle customize trigger */}
                      {dish.inStock && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomizingDish(dish);
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
                      <span className="text-[10px] text-[#A3A3A3] font-medium">
                        + Add
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fast Order Ticket Pane */}
      <PosCartPane
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        onOrderCompleted={(order) => setReceiptOrder(order)}
      />

      {/* Modals */}
      <DishCustomizerModal
        dish={customizingDish}
        onClose={() => setCustomizingDish(null)}
        onAddToCart={handleAddCustomizedItem}
      />

      <ThermalReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}
