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
  Send,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { CartItem, OrderType, PaymentMethod, PaymentStatus, Order } from '@/types';
import {
  useCreateOrder,
  useTableSessions,
  useOrders,
  useAddItemsToOrder,
} from '@/hooks/useRestaurantData';

interface PosCartPaneProps {
  items: CartItem[];
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
  onViewOrderDetails?: (order: Order) => void;
}

export function PosCartPane({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
  onViewOrderDetails,
}: PosCartPaneProps) {
  const createOrderMutation = useCreateOrder();
  const addItemsMutation = useAddItemsToOrder();
  const { data: tableSessions = [] } = useTableSessions();
  const { data: allOrders = [] } = useOrders();

  // Channel & Quick Table Picker
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');

  // Payment Timing Selection
  // For dine-in: default is 'pay_later' (Unpaid)
  // For takeout: default is 'pay_now' (Paid) with option 'pay_on_pickup'
  // For delivery: default is 'pay_later' (Cash on delivery) with option 'pay_now'
  const [paymentTiming, setPaymentTiming] = useState<'pay_later' | 'pay_now'>('pay_later');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Cash calculation
  const [cashTendered, setCashTendered] = useState<string>('');

  // Dynamically populated tables from Supabase dining_tables
  const liveTables = useMemo(() => {
    if (tableSessions.length > 0) {
      return [...tableSessions]
        .sort((a, b) => {
          const numA = parseInt(a.tableNumber.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        })
        .map((t) => t.tableNumber);
    }
    return Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`);
  }, [tableSessions]);

  // Find if selected table has an active order
  const activeTableOrder = useMemo(() => {
    if (orderType !== 'dine_in') return null;
    return allOrders.find(
      (o) =>
        o.type === 'dine_in' &&
        o.tableNumber === selectedTable &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
    );
  }, [allOrders, orderType, selectedTable]);

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

  // Switch channel handler
  const handleChannelChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'dine_in') {
      setPaymentTiming('pay_later');
    } else if (type === 'takeout') {
      setPaymentTiming('pay_now');
    } else if (type === 'delivery') {
      setPaymentTiming('pay_later'); // Cash on delivery
    }
  };

  // Submit New Order (Pay Later or Pay Now)
  const handleSubmitOrder = async () => {
    if (items.length === 0) return;

    const isPayNow = paymentTiming === 'pay_now';
    const finalPaymentStatus: PaymentStatus = isPayNow ? 'paid' : 'unpaid';

    try {
      const orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt'> = {
        type: orderType,
        tableNumber: orderType === 'dine_in' ? selectedTable : undefined,
        customerName:
          orderType === 'dine_in'
            ? selectedTable
            : orderType === 'takeout'
            ? 'Takeout Guest'
            : 'Delivery Order',
        items,
        subtotal,
        tax,
        serviceFee: 0,
        deliveryFee,
        discount: 0,
        total,
        amountPaid: isPayNow ? total : 0,
        balanceDue: isPayNow ? 0 : total,
        status: 'pending', // Sent to Kitchen
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        cashTendered:
          isPayNow && paymentMethod === 'cash'
            ? tenderedNum > 0
              ? tenderedNum
              : total
            : undefined,
        changeDue:
          isPayNow && paymentMethod === 'cash' ? (tenderedNum > 0 ? changeDue : 0) : undefined,
        estimatedMinutes: orderType === 'delivery' ? 35 : 20,
      };

      const created = await createOrderMutation.mutateAsync(orderPayload);
      onOrderCompleted(created);
      onClearCart();
      setCashTendered('');
    } catch (err) {
      console.error('Failed to create order', err);
    }
  };

  // Append items to existing active table order
  const handleAppendToActiveOrder = async () => {
    if (!activeTableOrder || items.length === 0) return;

    try {
      const updated = await addItemsMutation.mutateAsync({
        orderId: activeTableOrder.id,
        items,
      });
      onClearCart();
      onOrderCompleted(updated);
    } catch (err) {
      console.error('Failed to append items to active table order', err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* 1. Ticket Header & Channel Switcher */}
      <div className="p-4 border-b border-[#E5E5E5] bg-white space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1F1F1F] tracking-tight">
              Order Ticket
            </span>
            {items.length > 0 && (
              <span className="text-[11px] font-semibold bg-[#F5F5F5] text-[#525252] px-2 py-0.5 rounded-md">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>
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
            onClick={() => handleChannelChange('dine_in')}
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
            onClick={() => handleChannelChange('takeout')}
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
            onClick={() => handleChannelChange('delivery')}
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
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] mb-1">
              <span>Select Table</span>
              {activeTableOrder && (
                <span className="text-[#B45309] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Has Active Order
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {liveTables.slice(0, 12).map((t) => {
                const short = t.replace('Table ', 'T');
                const isSelected = selectedTable === t;
                const isOccupied = tableSessions.some(
                  (ts) => ts.tableNumber === t && ts.status !== 'available'
                );

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTable(t)}
                    className={`relative px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#1F1F1F] text-white'
                        : isOccupied
                        ? 'bg-[#FFF8E1] text-[#B45309] border border-[#FFE082]'
                        : 'bg-[#F5F5F5] text-[#525252] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    {short}
                    {isOccupied && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B45309] ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Order Notice for Occupied Table */}
        {activeTableOrder && (
          <div className="p-2.5 bg-[#FFF8E1] border border-[#FFE082] rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#78350F] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> {activeTableOrder.orderNumber}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-[#78350F] uppercase">
                  {activeTableOrder.status}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    activeTableOrder.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {activeTableOrder.paymentStatus}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#92400E]">
              <span>Existing Bill Total:</span>
              <span className="font-extrabold text-[#78350F]">
                ₱{activeTableOrder.total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={handleAppendToActiveOrder}
                  disabled={addItemsMutation.isPending}
                  className="flex-1 py-1.5 px-2 rounded-md bg-[#B45309] hover:bg-[#92400E] text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>
                    {addItemsMutation.isPending
                      ? 'Adding...'
                      : `Add to Active Bill (+₱${total.toLocaleString()})`}
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onViewOrderDetails?.(activeTableOrder)}
                className="py-1 px-2.5 rounded-md border border-[#D97706] bg-white text-[#92400E] hover:bg-[#FEF3C7] text-[11px] font-bold transition-colors"
              >
                View / Pay Bill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Fast Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
        {items.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-[#A3A3A3]">
            <Utensils className="w-7 h-7 stroke-1 text-[#D4D4D4] mb-2" />
            <p className="text-xs font-semibold text-[#525252]">No items selected</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">
              Tap any dish on the left to add to ticket.
            </p>
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
                  {item.selectedAddons?.length > 0 && (
                    <span>• +{item.selectedAddons.length} addons</span>
                  )}
                </div>
              </div>

              {/* Stepper */}
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

      {/* 3. Sticky Bottom Action & Checkout Area */}
      <div className="p-4 border-t border-[#E5E5E5] bg-white space-y-3 shrink-0 sticky bottom-0 z-10 shadow-xs">
        {/* Total Breakdown */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-[#737373]">
            <span>Subtotal</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#737373]">
            <span>Tax (5% VAT)</span>
            <span>₱{tax.toLocaleString()}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-[#737373]">
              <span>Delivery Fee</span>
              <span>₱{deliveryFee}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1.5 border-t border-[#E5E5E5]">
            <span className="font-bold text-xs text-[#1F1F1F]">Total Due</span>
            <span className="text-xl font-black text-[#BA1A20]">
              ₱{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Timing Options (Pay Later vs Pay Now) */}
        <div className="bg-[#F5F5F5] p-1 rounded-lg flex items-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPaymentTiming('pay_later')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
              paymentTiming === 'pay_later'
                ? 'bg-white text-[#1F1F1F] shadow-xs'
                : 'text-[#737373] hover:text-[#1F1F1F]'
            }`}
          >
            <span>
              {orderType === 'dine_in'
                ? 'Pay Later (Standard)'
                : orderType === 'delivery'
                ? 'Cash on Delivery'
                : 'Pay on Pickup'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentTiming('pay_now')}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
              paymentTiming === 'pay_now'
                ? 'bg-white text-[#1F1F1F] shadow-xs'
                : 'text-[#737373] hover:text-[#1F1F1F]'
            }`}
          >
            <span>Pay Now (Prepaid)</span>
          </button>
        </div>

        {/* If Pay Now is selected: show payment method & cash quick-amounts */}
        {paymentTiming === 'pay_now' && (
          <div className="space-y-2 pt-1">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'gcash', label: 'GCash', icon: Smartphone },
                { id: 'card', label: 'Card', icon: CreditCard },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                      isSelected
                        ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                        : 'bg-white text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Cash Presets (for cash payments) */}
            {paymentMethod === 'cash' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCashTendered(total.toString())}
                    disabled={items.length === 0}
                    className="flex-1 py-1 text-xs font-semibold rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5] disabled:opacity-40"
                  >
                    Exact
                  </button>
                  {[100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      disabled={items.length === 0}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md border border-[#E5E5E5] transition-colors disabled:opacity-40 ${
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
              </div>
            )}
          </div>
        )}

        {/* Primary Action Button */}
        {paymentTiming === 'pay_later' ? (
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={items.length === 0 || createOrderMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {createOrderMutation.isPending
                ? 'Sending Order...'
                : orderType === 'dine_in'
                ? `Send to Kitchen (${selectedTable} • Pay Later)`
                : `Place Order (Pay Later • ₱${total.toLocaleString()})`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={items.length === 0 || createOrderMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {createOrderMutation.isPending
                ? 'Processing Payment...'
                : `Charge & Send • ₱${total.toLocaleString()}`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
