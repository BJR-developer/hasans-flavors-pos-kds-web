'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Trash2,
  Plus,
  Minus,
  Utensils,
  ShoppingBag,
  Bike,
  Printer,
  CreditCard,
  Banknote,
  RotateCcw,
  ReceiptText,
} from 'lucide-react';
import { CartItem, OrderType, PaymentMethod, Order } from '@/types';
import { TABLES, CASH_PRESETS } from '@/data/options';
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

  // Channel & Customer Info
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Table 01');
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Cash Calculation State
  const [cashTendered, setCashTendered] = useState<string>('');

  // Pure Math Calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );
  const tax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const deliveryFee = orderType === 'delivery' ? 65 : 0;
  const total = useMemo(() => subtotal + tax + deliveryFee, [subtotal, tax, deliveryFee]);

  const tenderedNum = parseFloat(cashTendered.replace(/,/g, '')) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  // Set Cash Presets
  const handleSelectPreset = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleExactCash = () => {
    setCashTendered(total.toString());
  };

  // Submit Order & Print Thermal Bill
  const handleSubmitOrder = async (method: PaymentMethod = 'cash') => {
    if (items.length === 0) return;

    try {
      const orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt'> = {
        type: orderType,
        tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
        customerName: customerName.trim() || 'Walk-in Guest',
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
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
        specialNotes: generalNotes.trim() || undefined,
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
    <div className="flex flex-col h-full bg-white border-l border-[#E9E8E7] w-full max-w-[420px] shadow-sm">
      {/* 1. Header & Channel Switcher */}
      <div className="p-4 border-b border-[#E9E8E7] bg-[#FAF9F8]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-[#BA1A20]" />
            <span className="text-xs font-extrabold text-[#2D2926] uppercase tracking-wider">
              Active Order Ticket
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-[11px] font-bold text-[#BA1A1A] hover:text-[#8B0000] flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Order Channel Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4F3F2] rounded-xl border border-[#E9E8E7]">
          <button
            type="button"
            onClick={() => setOrderType('dine_in')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              orderType === 'dine_in'
                ? 'bg-white text-[#BA1A20] shadow-xs'
                : 'text-[#5B403D] hover:text-[#2D2926]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine-In</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('takeout')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              orderType === 'takeout'
                ? 'bg-white text-[#BA1A20] shadow-xs'
                : 'text-[#5B403D] hover:text-[#2D2926]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Takeout</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              orderType === 'delivery'
                ? 'bg-white text-[#BA1A20] shadow-xs'
                : 'text-[#5B403D] hover:text-[#2D2926]'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
        </div>

        {/* Channel Details Inputs */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {orderType === 'dine_in' ? (
            <div>
              <label className="block text-[10px] font-bold text-[#8F6F6C] uppercase mb-1">
                Select Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E8E7] bg-white text-xs font-bold text-[#2D2926] focus:outline-none focus:border-[#BA1A20]"
              >
                {TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-[#8F6F6C] uppercase mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="+63 9xx..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E8E7] bg-white text-xs text-[#2D2926] focus:outline-none focus:border-[#BA1A20]"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#8F6F6C] uppercase mb-1">
              Guest Name
            </label>
            <input
              type="text"
              placeholder="Guest Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E8E7] bg-white text-xs font-medium text-[#2D2926] focus:outline-none focus:border-[#BA1A20]"
            />
          </div>

          {orderType === 'delivery' && (
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#8F6F6C] uppercase mb-1">
                Delivery Address
              </label>
              <input
                type="text"
                placeholder="Unit, Street, Barangay, City..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E8E7] bg-white text-xs text-[#2D2926] focus:outline-none focus:border-[#BA1A20]"
              />
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-[#8F6F6C] uppercase mb-1">
              Kitchen Instructions / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Serve hot, priority table, extra napkins..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E9E8E7] bg-white text-xs text-[#2D2926] focus:outline-none focus:border-[#BA1A20]"
            />
          </div>
        </div>
      </div>

      {/* 2. Cart Items Scroll List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8F6F6C]">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F8] border border-[#E9E8E7] flex items-center justify-center text-[#8F6F6C] mb-3">
              <Utensils className="w-7 h-7 stroke-1" />
            </div>
            <p className="font-bold text-sm text-[#2D2926]">Order Ticket Empty</p>
            <p className="text-xs text-[#8F6F6C] mt-1 max-w-[200px]">
              Tap any dish from the catalog to add it to the ticket.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.cartItemId}
              className="p-3 bg-[#FAF9F8] rounded-xl border border-[#E9E8E7] flex items-start gap-3 transition-all hover:bg-[#F4F3F2]"
            >
              {/* Item Thumbnail */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                <Image
                  src={item.dish.imageUrl}
                  alt={item.dish.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#2D2926] leading-tight truncate">
                    {item.dish.name}
                  </h4>
                  <span className="text-xs font-black text-[#BA1A20]">
                    ₱{item.totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Modifiers & Addons */}
                <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-[#8F6F6C]">
                  {item.portion?.priceDelta > 0 && (
                    <span className="bg-white px-1.5 py-0.5 rounded border border-[#E9E8E7] font-semibold text-[#5B403D]">
                      {item.portion.name}
                    </span>
                  )}
                  {item.spiceLevel && (
                    <span className="bg-[#FFF2F0] text-[#BA1A20] px-1.5 py-0.5 rounded border border-[#FFDAD6] font-bold">
                      Spice Lv.{item.spiceLevel}
                    </span>
                  )}
                  {item.selectedAddons?.map((a) => (
                    <span
                      key={a.id}
                      className="bg-white px-1.5 py-0.5 rounded border border-[#E9E8E7]"
                    >
                      +{a.name}
                    </span>
                  ))}
                </div>

                {item.specialNotes && (
                  <p className="text-[10px] text-[#B45309] italic mt-1 leading-tight">
                    &ldquo;{item.specialNotes}&rdquo;
                  </p>
                )}

                {/* Bottom Row: Stepper & Remove */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200/60">
                  <span className="text-[10px] text-[#8F6F6C] font-medium">
                    ₱{item.unitPrice.toLocaleString()} ea
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="p-1 text-[#8F6F6C] hover:text-[#BA1A1A] transition-all"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center bg-white rounded-lg border border-[#E9E8E7]">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartItemId, -1)}
                        className="px-2 py-0.5 text-xs text-[#2D2926] hover:bg-[#F4F3F2] rounded-l-lg transition-all"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-6 text-center text-[11px] font-extrabold text-[#2D2926]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.cartItemId, 1)}
                        className="px-2 py-0.5 text-xs text-[#2D2926] hover:bg-[#F4F3F2] rounded-r-lg transition-all"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Bottom Financials & Cash Checkout Controls */}
      <div className="p-4 border-t border-[#E9E8E7] bg-[#FAF9F8] space-y-3 shrink-0">
        {/* Subtotal, VAT, Total */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-[#5B403D]">
            <span>Subtotal</span>
            <span className="font-semibold">₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#5B403D]">
            <span>Value Added Tax (5% VAT)</span>
            <span className="font-semibold">₱{tax.toLocaleString()}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-[#5B403D]">
              <span>Delivery Fee</span>
              <span className="font-semibold">₱{deliveryFee}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-[#2D2926] pt-1.5 border-t border-[#E9E8E7]">
            <span>Total Due</span>
            <span className="text-[#BA1A20] text-base font-black">
              ₱{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Cash Presets */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#8F6F6C]">
            <span className="flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-[#2E7D32]" />
              Cash Presets
            </span>
            <button
              type="button"
              onClick={handleExactCash}
              disabled={items.length === 0}
              className="text-[10px] font-extrabold text-[#BA1A20] hover:underline disabled:opacity-40"
            >
              Exact (₱{total.toLocaleString()})
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {CASH_PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleSelectPreset(amount)}
                disabled={items.length === 0}
                className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                  tenderedNum === amount
                    ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]'
                    : 'border-[#E9E8E7] bg-white text-[#5B403D] hover:bg-[#F4F3F2]'
                } disabled:opacity-40`}
              >
                ₱{amount}
              </button>
            ))}
          </div>

          {/* Cash Tendered Input & Change Due Display */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs font-bold text-[#8F6F6C]">₱</span>
              <input
                type="number"
                placeholder="Tendered"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                disabled={items.length === 0}
                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-[#E9E8E7] bg-white text-xs font-bold text-[#2D2926] focus:outline-none focus:border-[#2E7D32] disabled:opacity-40"
              />
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-xs">
              <span className="text-[10px] font-bold text-[#2E7D32] uppercase">Change</span>
              <span className="font-extrabold text-[#2E7D32]">
                ₱{changeDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button: Charge & Print Bill */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleSubmitOrder('cash')}
            disabled={items.length === 0 || createOrderMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>
              {createOrderMutation.isPending
                ? 'Processing Ticket...'
                : `Cash ₱${total.toLocaleString()} & Print Bill`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmitOrder('gcash')}
            disabled={items.length === 0 || createOrderMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-[#F4F3F2] border border-[#E9E8E7] text-[#5B403D] text-xs font-bold transition-all disabled:opacity-40"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#1565C0]" />
            <span>Charge GCash / Online Card (₱{total.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
