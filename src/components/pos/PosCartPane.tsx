'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  FileText,
} from 'lucide-react';
import { CartItem, OrderType, PaymentMethod, PaymentStatus, Order } from '@/types';
import {
  useCreateOrder,
  useTableSessions,
  useOrders,
  useUpdateOrderItems,
  useUpdateOrderPayment,
} from '@/hooks/useRestaurantData';
import { usePosSettings } from '@/hooks/usePosSettings';
import { ChangeTableModal } from '../tables/ChangeTableModal';
import { PosCartHeader } from './PosCartHeader';
import { PosCartItemList } from './PosCartItemList';
import { PosLoadedOrderActions } from './PosLoadedOrderActions';
import { PosNewOrderActions } from './PosNewOrderActions';

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

  const {
    vatEnabled,
    vatRate,
    paymentEnabled,
    enabledPaymentMethods,
    defaultPaymentTiming,
    calculateTax,
  } = usePosSettings();

  // Channel & Quick Table Picker
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');

  // Payment Selection (Cash or Card)
  const [paymentTiming, setPaymentTiming] = useState<'pay_later' | 'pay_now'>(defaultPaymentTiming || 'pay_later');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('cash');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(10);

  // Cash calculations
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isPayDrawerOpen, setIsPayDrawerOpen] = useState<boolean>(false);
  const [isChangeTableOpen, setIsChangeTableOpen] = useState<boolean>(false);

  // Dynamically populated tables from Supabase dining_tables
  const liveTables = useMemo(() => {
    return [...tableSessions]
      .sort((a, b) => {
        const numA = parseInt(a.tableNumber.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      })
      .map((t) => t.tableNumber);
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



  // Active payment method evaluated for VAT
  const activeMethod = loadedOrder
    ? (isPayDrawerOpen ? settleMethod : loadedOrder.paymentMethod)
    : (paymentTiming === 'pay_now' ? paymentMethod : null);

  // Math for current items in the ticket
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );
  const tax = useMemo(
    () => calculateTax(subtotal, activeMethod),
    [subtotal, activeMethod, calculateTax]
  );
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

  const tenderedNum = cashTendered !== '' ? (parseFloat(cashTendered.replace(/,/g, '')) || 0) : total;
  const changeDue = Math.max(0, tenderedNum - total);



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

    const isPayNow = paymentEnabled && paymentTiming === 'pay_now';
    const isOnlinePay = isPayNow && (paymentMethod === 'gcash' || paymentMethod === 'card');
    const finalPaymentStatus: PaymentStatus = isPayNow ? (isOnlinePay ? 'unpaid' : 'paid') : 'unpaid';

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
        amountPaid: isPayNow && !isOnlinePay ? total : 0,
        balanceDue: isPayNow && !isOnlinePay ? 0 : total,
        status: isOnlinePay ? 'draft' : 'pending',
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        cashTendered: isPayNow && paymentMethod === 'cash' ? (tenderedNum > 0 ? tenderedNum : total) : undefined,
        changeDue: isPayNow && paymentMethod === 'cash' ? (tenderedNum > 0 ? changeDue : 0) : undefined,
        estimatedMinutes: prepTimeMinutes,
      };

      const created = await createOrderMutation.mutateAsync(orderPayload);

      // Launch PayMongo Checkout for GCash / Card if Pay Now
      if (isPayNow && (paymentMethod === 'gcash' || paymentMethod === 'card')) {
        try {
          const res = await fetch('/api/paymongo/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: created.id,
              orderNumber: created.orderNumber,
              amount: total,
              paymentMethod,
              items: items.map((i) => ({
                name: i.dish?.name || 'Food Item',
                price: i.unitPrice || i.dish?.price || 0,
                quantity: i.quantity,
              })),
              customerName: orderPayload.customerName || 'Diner',
            }),
          });
          const payData = await res.json();
          if (payData.checkoutUrl) {
            window.open(payData.checkoutUrl, '_blank');
          }
        } catch (payErr) {
          console.error('PayMongo launch error:', payErr);
        }
      }

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
        tax,
        total,
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
      <PosCartHeader
        loadedOrder={loadedOrder}
        itemsCount={items.reduce((s, i) => s + i.quantity, 0)}
        orderType={orderType}
        selectedTable={selectedTable}
        availableTables={availableTables}
        tableSessions={tableSessions}
        onChannelChange={handleChannelChange}
        onSelectTable={setSelectedTable}
        onClearCart={onClearCart}
        onCancelLoadedOrder={onCancelLoadedOrder}
        onOpenChangeTable={() => setIsChangeTableOpen(true)}
      />

      {/* 2. Items List (Live Stepper & Trash for ALL items) */}
      <PosCartItemList
        items={items}
        onUpdateQty={onUpdateQty}
        onRemoveItem={onRemoveItem}
      />

      {/* 3. Sticky Bottom Action Area */}
      <div className="p-4 border-t border-[#E5E5E5] bg-white space-y-3 shrink-0 sticky bottom-0 z-10 shadow-xs">
        {/* Dynamic Financials */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-[#737373]">
            <span>Subtotal</span>
            <span className="font-mono">₱{subtotal.toLocaleString()}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-[#737373]">
              <span>Tax ({vatRate}% VAT)</span>
              <span className="font-mono">₱{tax.toLocaleString()}</span>
            </div>
          )}
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

        {/* Order Action Controls */}
        {loadedOrder ? (
          <PosLoadedOrderActions
            total={total}
            hasItemsChanged={hasItemsChanged}
            isPayDrawerOpen={isPayDrawerOpen}
            setIsPayDrawerOpen={setIsPayDrawerOpen}
            settleMethod={settleMethod}
            setSettleMethod={setSettleMethod}
            cashTendered={cashTendered}
            setCashTendered={setCashTendered}
            changeDue={changeDue}
            tenderedNum={tenderedNum}
            isUpdatingItems={updateOrderItemsMutation.isPending}
            isSettling={updatePaymentMutation.isPending}
            onSaveItems={handleSaveLoadedOrderChanges}
            onSettle={handleSettleLoadedOrder}
          />
        ) : (
          <PosNewOrderActions
            orderType={orderType}
            selectedTable={selectedTable}
            total={total}
            itemsCount={items.length}
            isPending={createOrderMutation.isPending}
            paymentTiming={paymentTiming}
            setPaymentTiming={setPaymentTiming}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cashTendered={cashTendered}
            setCashTendered={setCashTendered}
            tenderedNum={tenderedNum}
            changeDue={changeDue}
            prepTimeMinutes={prepTimeMinutes}
            setPrepTimeMinutes={setPrepTimeMinutes}
            onSubmit={handleSubmitNewOrder}
          />
        )}

      </div>

      {/* Change Dining Table Modal */}
      {isChangeTableOpen && loadedOrder && (
        <ChangeTableModal
          isOpen={isChangeTableOpen}
          onClose={() => setIsChangeTableOpen(false)}
          order={loadedOrder}
          onTableChanged={() => {
            setIsChangeTableOpen(false);
          }}
        />
      )}
    </div>
  );
}
