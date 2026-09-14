'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Clock,
  MapPin,
  Phone,
  Printer,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  DollarSign,
  Package,
  Calendar,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';
import { useOrders, useUpdateOrderStatus, useUpdateOrderPayment, useUpdateOrderEstimatedMinutes } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { ThermalReceiptModal } from '@/components/pos/ThermalReceiptModal';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';

export default function DeliveryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  const updatePaymentMutation = useUpdateOrderPayment();
  const updateEstimatedMinutes = useUpdateOrderEstimatedMinutes();

  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'in_transit' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  // Filter only delivery orders
  const deliveryOrders = useMemo(() => {
    return orders.filter((o) => o.type === 'delivery');
  }, [orders]);

  // Statistics
  const stats = useMemo(() => {
    const active = deliveryOrders.filter(
      (o) => o.status !== 'completed' && o.status !== 'cancelled'
    );
    const pendingDispatch = deliveryOrders.filter(
      (o) => o.status === 'pending' || o.status === 'sent_to_kitchen' || o.status === 'preparing'
    );
    const inTransit = deliveryOrders.filter((o) => o.status === 'ready');
    const completed = deliveryOrders.filter((o) => o.status === 'completed');

    const activeTotal = active.reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      activeCount: active.length,
      pendingCount: pendingDispatch.length,
      inTransitCount: inTransit.length,
      completedCount: completed.length,
      activeTotal,
    };
  }, [deliveryOrders]);

  // Tab & Search filtered orders
  const filteredOrders = useMemo(() => {
    return deliveryOrders.filter((o) => {
      // Tab filter
      if (activeTab === 'active') {
        if (o.status === 'completed' || o.status === 'cancelled') return false;
      } else if (activeTab === 'pending') {
        if (o.status !== 'pending' && o.status !== 'sent_to_kitchen' && o.status !== 'preparing') {
          return false;
        }
      } else if (activeTab === 'in_transit') {
        if (o.status !== 'ready') return false;
      } else if (activeTab === 'completed') {
        if (o.status !== 'completed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchCust = (o.customerName || '').toLowerCase().includes(q);
        const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
        const matchAddr = (o.deliveryAddress || '').toLowerCase().includes(q);
        const matchNotes = (o.specialNotes || '').toLowerCase().includes(q);
        return matchNum || matchCust || matchPhone || matchAddr || matchNotes;
      }

      return true;
    });
  }, [deliveryOrders, activeTab, searchQuery]);

  // Quick Action Handlers
  const handleDispatchOrder = async (orderId: string) => {
    // Mark as "ready" = Out for Delivery / In Transit
    await updateStatusMutation.mutateAsync({
      orderId,
      status: 'ready',
    });
  };

  const handleCompleteOrder = async (orderId: string, currentTotal: number) => {
    // Mark as completed & ensure paid
    await updatePaymentMutation.mutateAsync({
      orderId,
      paymentStatus: 'paid',
      amountPaid: currentTotal,
      closeOrder: true,
    });
    await updateStatusMutation.mutateAsync({
      orderId,
      status: 'completed',
    });
  };

  const handleAdjustEta = (orderId: string, currentEta?: number) => {
    const nextVal = window.prompt(
      'Update rider delivery arrival time (minutes):',
      String(currentEta || 25)
    );
    if (nextVal !== null) {
      const parsed = parseInt(nextVal.trim(), 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
        updateEstimatedMinutes.mutate({ orderId, estimatedMinutes: parsed });
      }
    }
  };

  if (authLoading || ordersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
        <div className="w-6 h-6 border-2 border-[#BA1A20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role === 'customer') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
        <div className="max-w-md w-full p-6 bg-white border border-[#E5E5E5] rounded-xl shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF2F0] text-[#BA1A20] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1F1F1F]">Staff Operations Only</h2>
            <p className="text-xs text-[#737373] mt-1">
              Delivery dispatch is restricted to Cashier and Restaurant Staff.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAF9F8] min-h-[calc(100vh-56px)]">
      {/* Top Banner with Stats */}
      <div className="bg-white border-b border-[#E5E5E5] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Delivery Dispatch &amp; Tracking</span>
                {stats.activeCount > 0 && (
                  <span className="bg-[#BA1A20] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {stats.activeCount} Running
                  </span>
                )}
              </h1>
              <p className="text-xs text-neutral-500">
                Manage door-to-door orders, dispatch riders, and track customer delivery addresses in real-time.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Pending Prep</span>
              <span className="text-sm font-black text-amber-700 font-mono">{stats.pendingCount}</span>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">On The Way</span>
              <span className="text-sm font-black text-blue-700 font-mono">{stats.inTransitCount}</span>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Delivered</span>
              <span className="text-sm font-black text-emerald-700 font-mono">{stats.completedCount}</span>
            </div>
            <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-center">
              <span className="text-[10px] uppercase font-bold text-white/70 block">Active Value</span>
              <span className="text-sm font-black text-white font-mono">₱{stats.activeTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              All Active ({stats.activeCount})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Pending Dispatch ({stats.pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('in_transit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'in_transit'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              In Transit ({stats.inTransitCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Delivered ({stats.completedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order #, address, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
        </div>

        {/* Deliveries Grid */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-neutral-200 space-y-2">
            <Bike className="w-8 h-8 text-neutral-300 mx-auto stroke-1" />
            <h3 className="text-sm font-bold text-neutral-800">No deliveries found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No delivery orders match your search criteria.'
                : 'There are currently no delivery orders in this status category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === 'completed';
              const isInTransit = order.status === 'ready';
              const isPaid = order.paymentStatus === 'paid';

              // Elapsed time calculation
              const createdDate = new Date(order.createdAt).getTime();
              const elapsedMins = Math.max(0, Math.floor((Date.now() - createdDate) / 60000));

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl border flex flex-col justify-between overflow-hidden shadow-2xs transition-all hover:border-neutral-400 ${
                    isInTransit
                      ? 'border-blue-300 ring-1 ring-blue-100'
                      : isDelivered
                      ? 'border-neutral-200 opacity-80'
                      : 'border-neutral-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-neutral-900">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isInTransit
                            ? 'bg-blue-100 text-blue-800'
                            : isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isInTransit ? 'In Transit' : isDelivered ? 'Delivered' : 'Kitchen Prep'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {elapsedMins}m ago
                      </span>

                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        title="Print Delivery Docket"
                        className="p-1 rounded hover:bg-neutral-200 text-neutral-600 transition-colors ml-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="p-3.5 space-y-2.5 flex-1">
                    {/* Customer Identity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {order.customerName || 'Valued Diner'}
                        </span>
                      </div>

                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#BA1A20] hover:underline bg-red-50 px-2 py-0.5 rounded border border-red-100 shrink-0"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                      )}
                    </div>

                    {/* Delivery Address & Landmark */}
                    <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/80 space-y-1">
                      <div className="flex items-start gap-1.5 text-xs text-neutral-800 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          {order.deliveryAddress || 'No address specified'}
                        </span>
                      </div>
                      {order.specialNotes && (
                        <div className="text-[10.5px] text-amber-900 bg-amber-50/80 px-2 py-1 rounded border border-amber-200/60 mt-1 italic">
                          <span className="font-bold text-amber-800">Note: </span>
                          <span>{order.specialNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Ordered Items Preview */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                        Order Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
                      </span>
                      <div className="space-y-0.5 max-h-24 overflow-y-auto">
                        {order.items.map((it) => (
                          <div key={it.cartItemId} className="flex justify-between text-xs text-neutral-700">
                            <span className="truncate">
                              <span className="font-bold text-neutral-900">{it.quantity}x</span> {it.dish.name}
                            </span>
                            <span className="font-mono text-neutral-900 shrink-0 ml-2">
                              ₱{it.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financials & Fast Actions Footer */}
                  <div className="p-3.5 border-t border-neutral-100 bg-neutral-50/50 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-neutral-500 text-[11px] block">Total Bill</span>
                        <span className="text-base font-black text-neutral-900 font-mono">
                          ₱{order.total.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? '★ Paid in Full' : 'Cash on Delivery'}
                        </span>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">
                          Method: {order.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Quick State Transition Actions */}
                    {!isDelivered && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {!isInTransit ? (
                          <button
                            type="button"
                            onClick={() => handleDispatchOrder(order.id)}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>Dispatch / Out for Delivery</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCompleteOrder(order.id, order.total)}
                            disabled={updateStatusMutation.isPending || updatePaymentMutation.isPending}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Delivered &amp; Paid</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAdjustEta(order.id, order.estimatedMinutes)}
                          title="Adjust ETA"
                          className="px-2.5 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          {order.estimatedMinutes || 25}m
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thermal Receipt Print Modal */}
      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Full Order Details Modal */}
      {detailOrder && (
        <OrderDetailsModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onPrintReceipt={(ord) => setReceiptOrder(ord)}
        />
      )}
    </div>
  );
}
