'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Plus,
  Minus,
  Utensils,
  ShoppingBag,
  Printer,
  RotateCcw,
  Send,
  AlertCircle,
  FileText,
  Check,
  Save,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { CartItem, OrderType, PaymentMethod, PaymentStatus, Order } from '@/types';
import {
  useCreateOrder,
  useTableSessions,
  useOrders,
  useUpdateOrderItems,
  useUpdateOrderPayment,
} from '@/hooks/useRestaurantData';

interface PosCartPaneProps {
  items: CartItem[];
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order) => void;
  onViewOrderDetails?: (order: Order) => void;
  loadedOrder?: Order | null;
  onCancelLoadedOrder?: () => void;
}

export function PosCartPane({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
  onViewOrderDetails,
  loadedOrder,
  onCancelLoadedOrder,
}: PosCartPaneProps) {
  const router = useRouter();
  const createOrderMutation = useCreateOrder();
  const updateOrderItemsMutation = useUpdateOrderItems();
  const updatePaymentMutation = useUpdateOrderPayment();
  const { data: tableSessions = [] } = useTableSessions();
  const { data: allOrders = [] } = useOrders();

  // Channel & Quick Table Picker
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');

  // Payment Selection (Cash or Card)
  const [paymentTiming, setPaymentTiming] = useState<'pay_later' | 'pay_now'>('pay_later');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('cash');

  // Cash calculations
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isPayDrawerOpen, setIsPayDrawerOpen] = useState<boolean>(false);

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

  // Only tables that are genuinely available (not occupied, no open active orders)
  const availableTables = useMemo(() => {
    return liveTables.filter((t) => {
      const isOccupiedInSession = tableSessions.some(
        (ts) => ts.tableNumber === t && ts.status !== 'available'
      );
      const hasOpenOrder = allOrders.some(
        (o) =>
          o.type === 'dine_in' &&
          o.tableNumber === t &&
          o.status !== 'completed' &&
          o.status !== 'cancelled'
      );
      return !isOccupiedInSession && !hasOpenOrder;
    });
  }, [liveTables, tableSessions, allOrders]);

  // Ensure selectedTable defaults to the first available table
  React.useEffect(() => {
    if (availableTables.length > 0 && !availableTables.includes(selectedTable)) {
      setSelectedTable(availableTables[0]);
    }
  }, [availableTables, selectedTable]);

  // Find if selected table has an active order (for new orders)
  const activeTableOrder = useMemo(() => {
    if (loadedOrder || orderType !== 'dine_in') return null;
    return allOrders.find(
      (o) =>
        o.type === 'dine_in' &&
        o.tableNumber === selectedTable &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
    );
  }, [allOrders, orderType, selectedTable, loadedOrder]);

  // Math for current items in the ticket
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );
  const tax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const deliveryFee = loadedOrder?.deliveryFee || 0;
  const total = useMemo(() => subtotal + tax + deliveryFee, [subtotal, tax, deliveryFee]);

  // Check if items changed compared to loaded order
  const hasItemsChanged = useMemo(() => {
    if (!loadedOrder) return false;
    const origItems = loadedOrder.items || [];
    if (origItems.length !== items.length) return true;
    for (const it of items) {
      const match = origItems.find((o) => o.cartItemId === it.cartItemId || o.dish.id === it.dish.id);
      if (!match || match.quantity !== it.quantity) return true;
    }
    return false;
  }, [loadedOrder, items]);

  const tenderedNum = parseFloat(cashTendered.replace(/,/g, '')) || total;
  const changeDue = Math.max(0, tenderedNum - total);

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

  // Switch channel handler
  const handleChannelChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'dine_in') {
      setPaymentTiming('pay_later');
    } else if (type === 'takeout') {
      setPaymentTiming('pay_now');
    }
  };

  // Submit Brand New Order
  const handleSubmitNewOrder = async () => {
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
            : 'Takeout Guest',
        items,
        subtotal,
        tax,
        serviceFee: 0,
        deliveryFee,
        discount: 0,
        total,
        amountPaid: isPayNow ? total : 0,
        balanceDue: isPayNow ? 0 : total,
        status: 'pending',
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        cashTendered: isPayNow && paymentMethod === 'cash' ? (tenderedNum > 0 ? tenderedNum : total) : undefined,
        changeDue: isPayNow && paymentMethod === 'cash' ? (tenderedNum > 0 ? changeDue : 0) : undefined,
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

  // Update loaded order items and return to /orders page
  const handleSaveLoadedOrderChanges = async () => {
    if (!loadedOrder) return;
    try {
      const updated = await updateOrderItemsMutation.mutateAsync({
        orderId: loadedOrder.id,
        items,
      });
      onOrderCompleted(updated);
      onClearCart();
      onCancelLoadedOrder?.();
      router.push('/orders');
    } catch (err) {
      console.error('Failed to save order changes', err);
    }
  };

  // Settle & Complete loaded order (Cash or Card)
  const handleSettleLoadedOrder = async () => {
    if (!loadedOrder) return;

    try {
      // 1. If items were changed, update them in DB first
      if (hasItemsChanged) {
        await updateOrderItemsMutation.mutateAsync({
          orderId: loadedOrder.id,
          items,
        });
      }

      // 2. Mark as paid & completed
      await updatePaymentMutation.mutateAsync({
        orderId: loadedOrder.id,
        paymentStatus: 'paid',
        paymentMethod: settleMethod,
        amountPaid: total,
        cashTendered: settleMethod === 'cash' ? tenderedNum : total,
        changeDue: settleMethod === 'cash' ? changeDue : 0,
        closeOrder: true,
      });

      const updatedOrder: Order = {
        ...loadedOrder,
        items,
        subtotal,
        tax,
        total,
        paymentStatus: 'paid',
        paymentMethod: settleMethod,
        amountPaid: total,
        balanceDue: 0,
        status: 'completed',
        cashTendered: settleMethod === 'cash' ? tenderedNum : total,
        changeDue: settleMethod === 'cash' ? changeDue : 0,
      };

      onOrderCompleted(updatedOrder);
      onClearCart();
      onCancelLoadedOrder?.();
      router.push('/orders');
    } catch (err) {
      console.error('Failed to settle order', err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* 1. Ticket Header */}
      <div className="p-4 border-b border-[#E5E5E5] bg-white space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1F1F1F] tracking-tight">
              Order Ticket
            </span>
            {loadedOrder ? (
              <span className="text-[11px] font-semibold bg-neutral-900 text-white px-2 py-0.5 rounded-md">
                Active Order
              </span>
            ) : items.length > 0 ? (
              <span className="text-[11px] font-semibold bg-[#F5F5F5] text-[#525252] px-2 py-0.5 rounded-md">
                {items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            ) : null}
          </div>

          {loadedOrder ? (
            <button
              type="button"
              onClick={onCancelLoadedOrder}
              className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              New Ticket
            </button>
          ) : (
            items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] font-medium text-[#737373] hover:text-[#BA1A20] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )
          )}
        </div>

        {/* Loaded Order Banner vs New Order Channel Selector */}
        {loadedOrder ? (
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-neutral-900">
                {loadedOrder.orderNumber}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                  loadedOrder.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {loadedOrder.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Customer:</span>
              <span className="font-medium text-neutral-700">
                {loadedOrder.type === 'dine_in'
                  ? loadedOrder.tableNumber || 'Dine-In'
                  : loadedOrder.customerName}
              </span>
            </div>
            {loadedOrder.specialNotes && (
              <div className="pt-1 border-t border-neutral-200 text-[10.5px] text-amber-900 font-medium">
                <span className="font-bold text-amber-800">Instruction: </span>
                <span>{loadedOrder.specialNotes}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 2 Channel Buttons: Dine-In & Takeout */}
            <div className="grid grid-cols-2 gap-1 bg-[#F5F5F5] p-1 rounded-lg">
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
            </div>

            {/* Table Chips for Dine-In (Available Tables) */}
            {orderType === 'dine_in' && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#737373] mb-1.5">
                  <span className="font-semibold text-neutral-800">
                    Available Tables ({availableTables.length})
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    Ready to Seat
                  </span>
                </div>
                {availableTables.length === 0 ? (
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-500 text-center font-medium">
                    All tables are currently occupied
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {availableTables.map((t) => {
                      const short = t.replace('Table ', 'T');
                      const isSelected = selectedTable === t;

                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTable(t)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#1F1F1F] text-white shadow-2xs'
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
            )}
          </>
        )}
      </div>

      {/* 2. Items List (Live Stepper & Trash for ALL items) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
        {items.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-[#A3A3A3]">
            <Utensils className="w-7 h-7 stroke-1 text-[#D4D4D4] mb-2" />
            <p className="text-xs font-semibold text-[#525252]">No items in ticket</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">
              Tap any dish from the menu to add.
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
          ))
        )}
      </div>

      {/* 3. Sticky Bottom Action Area */}
      <div className="p-4 border-t border-[#E5E5E5] bg-white space-y-3 shrink-0 sticky bottom-0 z-10 shadow-xs">
        {/* Dynamic Financials */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-[#737373]">
            <span>Subtotal</span>
            <span className="font-mono">₱{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[#737373]">
            <span>Tax (5% VAT)</span>
            <span className="font-mono">₱{tax.toLocaleString()}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-[#737373]">
              <span>Delivery Fee</span>
              <span className="font-mono">₱{deliveryFee}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1.5 border-t border-[#E5E5E5]">
            <span className="font-bold text-xs text-[#1F1F1F]">Total Due</span>
            <span className="text-xl font-black text-neutral-900 font-mono">
              ₱{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Existing Loaded Order Controls */}
        {loadedOrder ? (
          <div className="space-y-2">
            {/* If Pay Drawer is open */}
            {isPayDrawerOpen ? (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5 animate-in fade-in duration-100">
                {/* Method selector: Cash or Card */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettleMethod('cash')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      settleMethod === 'cash'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleMethod('card')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      settleMethod === 'card'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>
                </div>

                {settleMethod === 'cash' ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700">Cash Tendered</span>
                      {changeDue > 0 && (
                        <span className="text-emerald-700 font-bold font-mono">
                          Change: ₱{changeDue.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Fast Cash Presets */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCashTendered(total.toString())}
                        className="flex-1 py-1 text-xs font-semibold rounded-md border border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5]"
                      >
                        Exact
                      </button>
                      {[100, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashTendered(amt.toString())}
                          className={`flex-1 py-1 text-xs font-semibold rounded-md border border-[#E5E5E5] transition-colors ${
                            tenderedNum === amt
                              ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                              : 'bg-white text-[#525252] hover:bg-[#F5F5F5]'
                          }`}
                        >
                          ₱{amt}
                        </button>
                      ))}
                    </div>

                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={`Custom cash (₱${total.toLocaleString()})`}
                      className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:outline-none focus:border-neutral-400"
                    />
                  </>
                ) : (
                  <div className="p-2.5 bg-white rounded-lg border border-neutral-200 text-center space-y-1">
                    <span className="text-xs font-medium text-neutral-600 block">
                      Swipe or tap card on POS terminal
                    </span>
                    <span className="font-mono font-bold text-sm text-neutral-900 block">
                      Charge: ₱{total.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPayDrawerOpen(false)}
                    className="flex-1 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSettleLoadedOrder}
                    disabled={updatePaymentMutation.isPending}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Print</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Update Order (if items were edited) */}
                {hasItemsChanged && (
                  <button
                    type="button"
                    onClick={handleSaveLoadedOrderChanges}
                    disabled={updateOrderItemsMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updateOrderItemsMutation.isPending ? 'Updating...' : 'Update Order'}</span>
                  </button>
                )}

                {/* Settle Bill Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCashTendered(total.toString());
                    setIsPayDrawerOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Pay &amp; Close (₱{total.toLocaleString()})</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Brand New Order Timing & Actions */
          <div className="space-y-2">
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
                <span>Pay Now</span>
              </button>
            </div>

            {paymentTiming === 'pay_now' && (
              <div className="space-y-2 pt-1">
                {/* Method selector for Pay Now: Cash or Card */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      paymentMethod === 'cash'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      paymentMethod === 'card'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>
                </div>

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
                      <div className="flex justify-between text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-md font-mono">
                        <span>Change Due:</span>
                        <span>₱{changeDue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {paymentTiming === 'pay_later' ? (
              <button
                type="button"
                onClick={handleSubmitNewOrder}
                disabled={items.length === 0 || createOrderMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
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
                onClick={handleSubmitNewOrder}
                disabled={items.length === 0 || createOrderMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
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
        )}

      </div>
    </div>
  );
}
