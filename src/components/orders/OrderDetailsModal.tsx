'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  MapPin,
  Phone,
  User,
  Utensils,
  Plus,
  Percent,
  Users,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  History,
} from 'lucide-react';
import { Order, OrderStatus, PaymentMethod, CartItem } from '@/types';
import {
  useUpdateOrderStatus,
  useUpdateOrderPayment,
  useApplyDiscount,
  useAddItemsToOrder,
  useDishes,
} from '@/hooks/useRestaurantData';
import { PORTION_OPTIONS } from '@/data/options';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onPrintReceipt: (order: Order) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  onPrintReceipt,
}: OrderDetailsModalProps) {
  const updateStatusMutation = useUpdateOrderStatus();
  const updatePaymentMutation = useUpdateOrderPayment();
  const applyDiscountMutation = useApplyDiscount();
  const addItemsMutation = useAddItemsToOrder();
  const { data: dishes = [] } = useDishes();

  // Active sub-panels in modal
  const [activePanel, setActivePanel] = useState<'details' | 'pay' | 'discount' | 'split' | 'add_items'>('details');

  // Payment Form States
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payAmount, setPayAmount] = useState<string>('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [closeAfterPay, setCloseAfterPay] = useState<boolean>(false);

  // Discount Form States
  const [customDiscount, setCustomDiscount] = useState<string>('');

  // Split Bill Form States
  const [splitDiners, setSplitDiners] = useState<number>(2);

  // Add Items Form States
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [addQty, setAddQty] = useState<number>(1);

  if (!order) return null;

  const total = Number(order.total || 0);
  const amountPaid = Number(order.amountPaid || (order.paymentStatus === 'paid' ? total : 0));
  const balanceDue = Number(order.balanceDue !== undefined ? order.balanceDue : Math.max(0, total - amountPaid));
  const isFullyPaid = order.paymentStatus === 'paid' || balanceDue === 0;

  // Order status progression
  const handleStatusChange = (status: OrderStatus) => {
    // If attempting to complete an unpaid order, prevent it
    if (status === 'completed' && !isFullyPaid) {
      alert(`Cannot complete order while there is an unpaid balance of ₱${balanceDue.toLocaleString()}. Please settle payment first.`);
      return;
    }
    updateStatusMutation.mutate({ orderId: order.id, status, tableNumber: order.tableNumber });
  };

  // Open Pay panel with defaults
  const handleOpenPay = (presetAmount?: number) => {
    const amt = presetAmount !== undefined ? presetAmount : balanceDue;
    setPayAmount(amt.toString());
    setCashTendered(amt.toString());
    setActivePanel('pay');
  };

  // Submit Payment
  const handleConfirmPayment = async () => {
    const enteredPayAmt = parseFloat(payAmount.replace(/,/g, '')) || 0;
    if (enteredPayAmt <= 0) return;

    const newAmountPaid = amountPaid + enteredPayAmt;
    const isNowPaid = newAmountPaid >= total;
    const paymentStatus = isNowPaid ? 'paid' : 'partially_paid';

    const tenderedNum = parseFloat(cashTendered.replace(/,/g, '')) || enteredPayAmt;
    const changeDue = Math.max(0, tenderedNum - enteredPayAmt);

    const newRecord = {
      id: `pay_${Date.now()}`,
      amount: enteredPayAmt,
      method: payMethod,
      timestamp: new Date().toISOString(),
      note: isNowPaid ? 'Full balance settled' : `Partial payment (₱${enteredPayAmt.toLocaleString()})`,
    };

    const history = [...(order.paymentHistory || []), newRecord];

    await updatePaymentMutation.mutateAsync({
      orderId: order.id,
      paymentStatus,
      paymentMethod: payMethod,
      amountPaid: newAmountPaid,
      paymentHistory: history,
      cashTendered: payMethod === 'cash' ? tenderedNum : undefined,
      changeDue: payMethod === 'cash' ? changeDue : undefined,
      closeOrder: closeAfterPay && isNowPaid,
    });

    setActivePanel('details');
  };

  // Apply Discount
  const handleApplyDiscountPreset = async (percent: number) => {
    const discountVal = Math.round((order.subtotal * percent) / 100);
    await applyDiscountMutation.mutateAsync({
      orderId: order.id,
      discount: discountVal,
    });
    setActivePanel('details');
  };

  const handleApplyCustomDiscount = async () => {
    const discountVal = parseFloat(customDiscount.replace(/,/g, '')) || 0;
    if (discountVal < 0) return;
    await applyDiscountMutation.mutateAsync({
      orderId: order.id,
      discount: discountVal,
    });
    setActivePanel('details');
  };

  // Add Item to Order
  const handleAddItemToOrder = async () => {
    const dish = dishes.find((d) => d.id === selectedDishId);
    if (!dish) return;

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

    const newItem: CartItem = {
      cartItemId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dish,
      quantity: addQty,
      portion: PORTION_OPTIONS[0],
      spiceLevel: dish.spiceLevel || 2,
      selectedAddons: [],
      unitPrice: dish.price,
      totalPrice: dish.price * addQty,
      station,
      completedInKitchen: false,
    };

    await addItemsMutation.mutateAsync({
      orderId: order.id,
      items: [newItem],
    });

    setSelectedDishId('');
    setAddQty(1);
    setActivePanel('details');
  };

  const splitPerPerson = splitDiners > 0 ? Math.ceil(balanceDue / splitDiners) : balanceDue;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#E9E8E7] my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF9F8] border-b border-[#E9E8E7] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg text-[#2D2926]">
                {order.orderNumber}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#E9E8E7] text-[#5B403D]">
                {order.type === 'dine_in'
                  ? order.tableNumber || 'Dine-In'
                  : order.type === 'delivery'
                  ? 'Delivery'
                  : 'Takeout'}
              </span>
              {/* Distinct Status Badges */}
              <span
                className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                  order.status === 'completed'
                    ? 'bg-gray-200 text-gray-800'
                    : order.status === 'served'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'ready'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.status === 'preparing'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Order: {order.status}
              </span>
              <span
                className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                  isFullyPaid
                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                    : order.paymentStatus === 'partially_paid'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-[#FFF8E1] text-[#B45309] border border-[#FFE082]'
                }`}
              >
                Payment: {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-[#8F6F6C] mt-0.5 font-medium">
              Created {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintReceipt(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isFullyPaid ? 'Print Receipt' : 'Print Bill'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#8F6F6C] hover:text-[#2D2926] hover:bg-white border border-transparent hover:border-[#E9E8E7] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Panel Switcher Tabs */}
        <div className="px-6 pt-3 border-b border-[#E5E5E5] flex items-center gap-2 bg-white text-xs">
          <button
            type="button"
            onClick={() => setActivePanel('details')}
            className={`pb-2 px-1 font-bold border-b-2 transition-colors ${
              activePanel === 'details'
                ? 'border-[#BA1A20] text-[#BA1A20]'
                : 'border-transparent text-[#737373] hover:text-[#1F1F1F]'
            }`}
          >
            Order Details
          </button>
          {!isFullyPaid && (
            <>
              <button
                type="button"
                onClick={() => handleOpenPay()}
                className={`pb-2 px-1 font-bold border-b-2 transition-colors ${
                  activePanel === 'pay'
                    ? 'border-[#BA1A20] text-[#BA1A20]'
                    : 'border-transparent text-[#737373] hover:text-[#1F1F1F]'
                }`}
              >
                Pay Bill
              </button>
              <button
                type="button"
                onClick={() => setActivePanel('discount')}
                className={`pb-2 px-1 font-bold border-b-2 transition-colors ${
                  activePanel === 'discount'
                    ? 'border-[#BA1A20] text-[#BA1A20]'
                    : 'border-transparent text-[#737373] hover:text-[#1F1F1F]'
                }`}
              >
                Discount
              </button>
              <button
                type="button"
                onClick={() => setActivePanel('split')}
                className={`pb-2 px-1 font-bold border-b-2 transition-colors ${
                  activePanel === 'split'
                    ? 'border-[#BA1A20] text-[#BA1A20]'
                    : 'border-transparent text-[#737373] hover:text-[#1F1F1F]'
                }`}
              >
                Split Bill
              </button>
              <button
                type="button"
                onClick={() => setActivePanel('add_items')}
                className={`pb-2 px-1 font-bold border-b-2 transition-colors ${
                  activePanel === 'add_items'
                    ? 'border-[#BA1A20] text-[#BA1A20]'
                    : 'border-transparent text-[#737373] hover:text-[#1F1F1F]'
                }`}
              >
                + Add Items
              </button>
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
          {/* 1. Normal Order Details View */}
          {activePanel === 'details' && (
            <>
              {/* Customer & Channel Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FAF9F8] rounded-2xl border border-[#E9E8E7] text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8F6F6C] flex items-center gap-1">
                    <User className="w-3 h-3" /> Customer
                  </span>
                  <p className="font-bold text-[#2D2926]">{order.customerName}</p>
                  {order.customerPhone && (
                    <p className="text-[#5B403D] flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3 text-[#8F6F6C]" /> {order.customerPhone}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#8F6F6C] flex items-center gap-1">
                    <Utensils className="w-3 h-3" /> Location / Table
                  </span>
                  <p className="font-bold text-[#2D2926]">
                    {order.type === 'dine_in'
                      ? order.tableNumber || 'Dine-In'
                      : order.type === 'delivery'
                      ? 'Delivery Address'
                      : 'Takeout Counter'}
                  </p>
                  {order.deliveryAddress && (
                    <p className="text-[#5B403D] flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-[#BA1A20]" /> {order.deliveryAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-[#2D2926] uppercase tracking-wider">
                    Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
                  </h4>
                  {!isFullyPaid && (
                    <button
                      type="button"
                      onClick={() => setActivePanel('add_items')}
                      className="text-[11px] font-bold text-[#BA1A20] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add More Items
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#F1F0F0] border border-[#E9E8E7] rounded-2xl overflow-hidden bg-white">
                  {order.items.map((item) => (
                    <div key={item.cartItemId} className="p-3 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 text-center font-black text-xs text-[#BA1A20] mt-0.5">
                          {item.quantity}x
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-[#2D2926] leading-tight">
                            {item.dish.name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#8F6F6C] mt-1">
                            {item.portion?.priceDelta > 0 && (
                              <span className="bg-[#FAF9F8] px-1.5 py-0.5 rounded border border-[#E9E8E7] font-semibold text-[#5B403D]">
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
                                className="bg-[#FAF9F8] px-1.5 py-0.5 rounded border border-[#E9E8E7]"
                              >
                                +{a.name}
                              </span>
                            ))}
                          </div>
                          {item.specialNotes && (
                            <p className="text-[10px] text-[#B45309] italic mt-1">
                              Note: {item.specialNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="font-black text-xs text-[#2D2926] shrink-0">
                        ₱{item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown with Balance Due */}
              <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-[#E9E8E7] space-y-2 text-xs">
                <div className="flex justify-between text-[#5B403D]">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₱{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#5B403D]">
                  <span>5% Restaurant VAT:</span>
                  <span className="font-semibold">₱{order.tax.toLocaleString()}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-[#5B403D]">
                    <span>Delivery Fee:</span>
                    <span className="font-semibold">₱{order.deliveryFee}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>Discount:</span>
                    <span>-₱{order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-[#2D2926] pt-2 border-t border-[#E9E8E7]">
                  <span>Total Amount:</span>
                  <span className="text-base font-black">
                    ₱{order.total.toLocaleString()}
                  </span>
                </div>

                {/* Amount Paid and Remaining Balance Due */}
                <div className="pt-2 border-t border-[#E9E8E7] space-y-1">
                  <div className="flex justify-between text-[#525252]">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-green-700">₱{amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black">
                    <span>Balance Due:</span>
                    <span className={balanceDue > 0 ? 'text-[#BA1A20]' : 'text-green-700'}>
                      ₱{balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Audit Trail */}
              {order.paymentHistory && order.paymentHistory.length > 0 && (
                <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-[#737373] uppercase flex items-center gap-1">
                    <History className="w-3 h-3" /> Payment History
                  </span>
                  {order.paymentHistory.map((rec) => (
                    <div key={rec.id} className="flex justify-between items-center text-[11px] py-1 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="font-semibold uppercase text-[#1F1F1F]">{rec.method}</span>
                        <span className="text-gray-400 ml-1.5 text-[10px]">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {rec.note && <span className="text-gray-500 ml-1">({rec.note})</span>}
                      </div>
                      <span className="font-bold text-green-700">+₱{rec.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Status Workflow Controls */}
              <div>
                <h4 className="text-xs font-black text-[#2D2926] uppercase tracking-wider mb-2">
                  Progress Order Status
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'pending', label: 'Received' },
                    { id: 'preparing', label: 'In Kitchen' },
                    { id: 'ready', label: 'Ready' },
                    { id: 'served', label: 'Served' },
                    { id: 'completed', label: 'Closed' },
                    { id: 'cancelled', label: 'Cancel' },
                  ].map((st) => {
                    const isActive = order.status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleStatusChange(st.id as OrderStatus)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isActive
                            ? 'bg-[#1F1F1F] text-white border-[#1F1F1F] shadow-xs'
                            : 'bg-white text-[#5B403D] border-[#E9E8E7] hover:bg-[#F4F3F2]'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 2. Pay Bill Sub-Panel */}
          {activePanel === 'pay' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-amber-900 font-semibold">Total Bill:</span>
                  <span className="font-bold">₱{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-900 font-semibold">Already Paid:</span>
                  <span className="font-bold text-green-700">₱{amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-amber-200 font-black text-sm text-amber-900">
                  <span>Balance Due:</span>
                  <span className="text-base text-[#BA1A20]">₱{balanceDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Amount to Pay Input */}
              <div>
                <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                  Payment Amount
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => {
                      setPayAmount(e.target.value);
                      setCashTendered(e.target.value);
                    }}
                    className="flex-1 px-3 py-2 border rounded-xl text-sm font-bold text-[#1F1F1F] focus:outline-none focus:border-[#BA1A20]"
                    placeholder="Enter amount"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmount(balanceDue.toString());
                      setCashTendered(balanceDue.toString());
                    }}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#1F1F1F]"
                  >
                    Full Balance (₱{balanceDue.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'gcash', label: 'GCash', icon: Smartphone },
                    { id: 'card', label: 'Card', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSel = payMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayMethod(m.id as PaymentMethod)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isSel
                            ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                            : 'bg-white text-[#525252] border-[#E5E5E5] hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Tendered & Change Due */}
              {payMethod === 'cash' && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                  <label className="block font-bold text-[#1F1F1F]">
                    Cash Tendered
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold"
                    placeholder="Enter cash handed by diner"
                  />
                  {parseFloat(cashTendered || '0') > parseFloat(payAmount || '0') && (
                    <div className="flex justify-between font-bold text-[#2E7D32] bg-[#E8F5E9] p-2 rounded-lg">
                      <span>Change to Return:</span>
                      <span>₱{(parseFloat(cashTendered || '0') - parseFloat(payAmount || '0')).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Option to Close Order immediately if balance is settled */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1F1F1F]">
                <input
                  type="checkbox"
                  checked={closeAfterPay}
                  onChange={(e) => setCloseAfterPay(e.target.checked)}
                  className="rounded text-[#BA1A20]"
                />
                <span>Automatically mark order as Closed and release table once paid</span>
              </label>

              {/* Submit Payment Action */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePanel('details')}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={updatePaymentMutation.isPending || !payAmount}
                  className="flex-1 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {updatePaymentMutation.isPending
                      ? 'Recording...'
                      : `Confirm Payment (₱${parseFloat(payAmount || '0').toLocaleString()})`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Discount Sub-Panel */}
          {activePanel === 'discount' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Apply a promotional, senior citizen, or manager discount to this open order.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1F1F1F] mb-1.5">
                  Preset Percentage
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyDiscountPreset(pct)}
                      className="py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-bold text-xs text-[#1F1F1F]"
                    >
                      {pct}% Off
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                  Or Custom Amount (₱)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    placeholder="e.g. 50"
                    className="flex-1 px-3 py-2 border rounded-xl text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomDiscount}
                    className="px-4 py-2 rounded-xl bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {order.discount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    applyDiscountMutation.mutate({ orderId: order.id, discount: 0 });
                    setActivePanel('details');
                  }}
                  className="text-xs text-red-600 font-bold hover:underline block pt-2"
                >
                  Remove current discount (₱{order.discount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setActivePanel('details')}
                className="w-full py-2 rounded-xl border text-xs font-bold text-gray-600"
              >
                Back to Details
              </button>
            </div>
          )}

          {/* 4. Split Bill Sub-Panel */}
          {activePanel === 'split' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-blue-900 font-semibold">Remaining Balance to Split:</span>
                  <span className="font-extrabold text-blue-900">₱{balanceDue.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1F1F] mb-1.5">
                  Number of Diners Splitting
                </label>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSplitDiners(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        splitDiners === num
                          ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
                <span className="text-xs text-gray-500 font-semibold">Each Diner Pays:</span>
                <p className="text-2xl font-black text-[#BA1A20]">
                  ₱{splitPerPerson.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400">
                  {splitDiners} shares of ₱{splitPerPerson.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePanel('details')}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPay(splitPerPerson)}
                  className="flex-1 py-2.5 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold"
                >
                  Collect 1 Share (₱{splitPerPerson.toLocaleString()})
                </button>
              </div>
            </div>
          )}

          {/* 5. Add Items Sub-Panel */}
          {activePanel === 'add_items' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Add more food or drinks to this open table ticket.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                  Select Dish
                </label>
                <select
                  value={selectedDishId}
                  onChange={(e) => setSelectedDishId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium text-[#1F1F1F] bg-white"
                >
                  <option value="">-- Choose a dish --</option>
                  {dishes
                    .filter((d) => d.inStock)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (₱{d.price})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1F1F] mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAddQty(q)}
                      className={`w-10 h-10 rounded-xl font-bold text-xs border ${
                        addQty === q
                          ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePanel('details')}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddItemToOrder}
                  disabled={!selectedDishId || addItemsMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold"
                >
                  {addItemsMutation.isPending ? 'Adding...' : 'Add to Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F8] border-t border-[#E9E8E7] flex items-center justify-between">
          <div>
            {!isFullyPaid ? (
              <span className="text-xs font-extrabold text-[#BA1A20] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Unpaid Balance: ₱{balanceDue.toLocaleString()}
              </span>
            ) : (
              <span className="text-xs font-extrabold text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid in Full
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isFullyPaid && (
              <button
                type="button"
                onClick={() => handleOpenPay()}
                className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
              >
                Pay Bill (₱{balanceDue.toLocaleString()})
              </button>
            )}

            {isFullyPaid && order.status !== 'completed' && (
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className="px-4 py-2 rounded-xl bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
              >
                Close Order &amp; Free Table
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#E9E8E7] text-xs font-bold text-[#2D2926] hover:bg-[#F4F3F2] transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
