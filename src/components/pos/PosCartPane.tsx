'use client';

import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Utensils,
  ShoppingBag,
  Bike,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { CartItem, OrderType, PaymentMethod, Order } from '@/types';
import { TABLES } from '@/data/options';
import { useCreateOrder } from '@/hooks/useRestaurantData';

interface PosCartPaneProps {
  items: CartItem[];
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
}

export function PosCartPane({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
}: PosCartPaneProps) {
  const createOrderMutation = useCreateOrder();

  // Channel & Quick Table Picker
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Table 01');

  // Cash calculation
  const [cashTendered, setCashTendered] = useState<string>('');

  // Math
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );
  const tax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const deliveryFee = orderType === 'delivery' ? 65 : 0;
  const total = useMemo(() => subtotal + tax + deliveryFee, [subtotal, tax, deliveryFee]);

  const tenderedNum = parseFloat(cashTendered.replace(/,/g, '')) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  // Fast Checkout
  const handleSubmitOrder = async (method: PaymentMethod = 'cash') => {
    if (items.length === 0) return;

    try {
      const orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt'> = {
        type: orderType,
        tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
        customerName: orderType === 'dine_in' ? selectedTable : orderType === 'takeout' ? 'Takeout Guest' : 'Delivery Order',
        items,
        subtotal,
        tax,
        serviceFee: 0,
        deliveryFee,
        discount: 0,
        total,
        status: 'pending',
        paymentMethod: method,
        paymentStatus: 'paid',
        cashTendered: method === 'cash' ? (tenderedNum > 0 ? tenderedNum : total) : undefined,
        changeDue: method === 'cash' ? (tenderedNum > 0 ? changeDue : 0) : undefined,
        estimatedMinutes: 20,
      };

      const created = await createOrderMutation.mutateAsync(orderPayload);
      onOrderCompleted(created);
      onClearCart();
      setCashTendered('');
    } catch (err) {
      console.error('Failed to create order', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E5E5E5] w-full max-w-[380px] shrink-0">
      {/* 1. Minimal Header & Service Mode */}
      <div className="p-4 border-b border-[#E5E5E5] bg-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1F1F1F] tracking-tight">
            Order Ticket {items.length > 0 ? `(${items.reduce((s, i) => s + i.quantity, 0)} items)` : ''}
          </span>
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-[11px] font-medium text-[#737373] hover:text-[#BA1A20] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* 3 Clean Channel Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-[#F5F5F5] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setOrderType('dine_in')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              orderType === 'dine_in'
                ? 'bg-white text-[#1F1F1F] shadow-xs'
                : 'text-[#737373] hover:text-[#1F1F1F]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine-In</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('takeout')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              orderType === 'takeout'
                ? 'bg-white text-[#1F1F1F] shadow-xs'
                : 'text-[#737373] hover:text-[#1F1F1F]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Takeout</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              orderType === 'delivery'
                ? 'bg-white text-[#1F1F1F] shadow-xs'
                : 'text-[#737373] hover:text-[#1F1F1F]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {/* Quick Table Chips (for Dine-In) */}
        {orderType === 'dine_in' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {TABLES.slice(0, 10).map((t) => {
              const short = t.replace('Table ', 'T');
              const isSelected = selectedTable === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTable(t)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#1F1F1F] text-white'
                      : 'bg-[#F5F5F5] text-[#525252] hover:bg-[#E5E5E5]'
                  }`}
                >
                  {short}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Fast Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#A3A3A3]">
            <Utensils className="w-7 h-7 stroke-1 text-[#D4D4D4] mb-2" />
            <p className="text-xs font-semibold text-[#525252]">No items selected</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Tap any dish on the left to add.</p>
          </div>
        ) : (
          items.map((item) => (
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
                  <span className="text-xs font-black text-[#1F1F1F] shrink-0">
                    ₱{item.totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Subtitle details */}
                <div className="flex items-center gap-1.5 text-[10px] text-[#737373] mt-0.5">
                  <span>₱{item.unitPrice.toLocaleString()}</span>
                  {item.portion?.priceDelta > 0 && <span>• {item.portion.name}</span>}
                  {item.spiceLevel && item.spiceLevel > 2 && (
                    <span className="text-[#BA1A20] font-semibold">• Spicy</span>
                  )}
                </div>
              </div>

              {/* Fast Stepper */}
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
          ))
        )}
      </div>

      {/* 3. Streamlined Bottom Checkout */}
      <div className="p-4 border-t border-[#E5E5E5] bg-white space-y-3 shrink-0">
        {/* Total Display */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-[#737373]">
            <span>Subtotal</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#737373]">
            <span>Tax (5% VAT)</span>
            <span>₱{tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline pt-1.5 border-t border-[#E5E5E5]">
            <span className="font-bold text-xs text-[#1F1F1F]">Total Due</span>
            <span className="text-xl font-black text-[#BA1A20]">
              ₱{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Cash Presets */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCashTendered(total.toString())}
            disabled={items.length === 0}
            className="flex-1 py-1.5 text-xs font-semibold rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5] disabled:opacity-40"
          >
            Exact
          </button>
          {[100, 500, 1000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setCashTendered(amt.toString())}
              disabled={items.length === 0}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md border border-[#E5E5E5] transition-colors disabled:opacity-40 ${
                tenderedNum === amt
                  ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                  : 'bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5]'
              }`}
            >
              ₱{amt}
            </button>
          ))}
        </div>

        {tenderedNum > total && (
          <div className="flex justify-between text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-md">
            <span>Change Due:</span>
            <span>₱{changeDue.toLocaleString()}</span>
          </div>
        )}

        {/* Big Single Action Button */}
        <button
          type="button"
          onClick={() => handleSubmitOrder('cash')}
          disabled={items.length === 0 || createOrderMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>
            {createOrderMutation.isPending
              ? 'Processing...'
              : `Charge Cash • ₱${total.toLocaleString()}`}
          </span>
        </button>
      </div>
    </div>
  );
}
