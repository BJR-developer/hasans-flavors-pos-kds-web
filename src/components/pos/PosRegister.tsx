'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, X, SlidersHorizontal, AlertCircle, Keyboard } from 'lucide-react';
import { Dish, CartItem, Order } from '@/types';
import { useDishes, useCategories } from '@/hooks/useRestaurantData';
import { PosCartPane } from './PosCartPane';
import { DishCustomizerModal } from './DishCustomizerModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
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
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true');

      // '?' opens shortcuts training modal
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 'Escape' closes modals or blurs search
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
        if (customizingDish) setCustomizingDish(null);
        if (receiptOrder) setReceiptOrder(null);
        if (isTyping && searchInputRef.current) {
          searchInputRef.current.blur();
        }
        return;
      }

      // '/' or 'F' jumps to search box
      if ((e.key === '/' || e.key === 'f' || e.key === 'F') && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsModalOpen, customizingDish, receiptOrder]);

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

    let station: 'tandoor' | 'biryani_curry' | 'sides_drinks' | 'general' = 'general';
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
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-56px)] lg:h-[calc(100vh-56px)] overflow-y-auto lg:overflow-hidden bg-[#FAFAFA] relative">
      {/* Menu Catalog Pane */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Minimal Category & Search Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-[#E5E5E5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 sticky top-0 lg:static z-10">
          {/* Categories with IMAGES for Fast Visual Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* All Dishes Category Chip */}
            <button
              onClick={() => setSelectedCatId('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCatId === 'all'
                  ? 'bg-[#1F1F1F] text-white border-[#1F1F1F] shadow-xs'
                  : 'bg-white text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
              }`}
            >
              <span className="w-5 h-5 rounded-md bg-[#FAF9F8] border border-[#E5E5E5] flex items-center justify-center text-[10px] font-black text-[#BA1A20]">
                All
              </span>
              <span>All Dishes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${selectedCatId === 'all' ? 'bg-white/20 text-white' : 'bg-[#F5F5F5] text-[#737373]'}`}>
                {dishes.length}
              </span>
            </button>

            {/* Individual Categories with Photo Thumbnails */}
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-[#1F1F1F] text-white border-[#1F1F1F] shadow-xs'
                      : 'bg-white text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
                  }`}
                >
                  {cat.imageUrl ? (
                    <div className="relative w-5 h-5 rounded-md overflow-hidden bg-gray-200 shrink-0 border border-black/10">
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        sizes="20px"
                      />
                    </div>
                  ) : null}
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#F5F5F5] text-[#737373]'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search & Shortcuts Help Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search dish (Press /)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] placeholder-[#A3A3A3] focus:bg-white focus:outline-none focus:border-[#1F1F1F] transition-colors"
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

            {/* Keyboard Shortcuts Trigger Button */}
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              title="Keyboard Shortcuts & Training Help (Press ?)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-[#525252] hover:text-[#1F1F1F] hover:bg-[#F5F5F5] transition-colors text-xs font-semibold"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Shortcuts (?)</span>
            </button>
          </div>
        </div>

        {/* Fast Dish Grid (Responsive 2 to 5 columns) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">
          {filteredDishes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[#737373]">
              <AlertCircle className="w-6 h-6 stroke-1 text-[#A3A3A3] mb-1.5" />
              <p className="text-xs font-semibold text-[#1F1F1F]">No items found</p>
              <p className="text-[11px] text-[#A3A3A3] mt-0.5">Try a different category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {filteredDishes.map((dish) => {
                const inCartQty = cartItems
                  .filter((i) => i.dish.id === dish.id)
                  .reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <div
                    key={dish.id}
                    onClick={() => handleFastAdd(dish)}
                    className={`group relative bg-white rounded-xl border p-2 sm:p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                      dish.inStock
                        ? inCartQty > 0
                          ? 'border-[#BA1A20] shadow-xs'
                          : 'border-[#E5E5E5] hover:border-[#A3A3A3] hover:shadow-xs'
                        : 'border-[#E5E5E5] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Item Thumbnail */}
                    <div className="relative h-24 sm:h-28 w-full rounded-lg overflow-hidden bg-[#F5F5F5] mb-2">
                      <Image
                        src={dish.imageUrl}
                        alt={dish.name}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-200"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />

                      {/* In-cart count badge */}
                      {inCartQty > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#BA1A20] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                          {inCartQty}
                        </div>
                      )}

                      {!dish.inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold tracking-wide uppercase">
                          Out of Stock
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

      {/* Fast Order Ticket Pane (Sticky Right) */}
      <div id="pos-order-ticket" className="shrink-0">
        <PosCartPane
          items={cartItems}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClearCart={() => setCartItems([])}
          onOrderCompleted={(order) => setReceiptOrder(order)}
        />
      </div>

      {/* Mobile Sticky Bottom Summary Bar */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xs border-t border-[#E5E5E5] shadow-lg flex items-center justify-between z-30 px-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1F1F1F]">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} items
              </span>
              <span className="text-[#D4D4D4]">•</span>
              <span className="text-sm font-black text-[#BA1A20]">
                ₱{cartItems.reduce((s, i) => s + i.totalPrice, 0).toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-[#737373]">+5% VAT included</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('pos-order-ticket');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold shadow-xs transition-colors"
          >
            Review Ticket &amp; Pay
          </button>
        </div>
      )}

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

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
