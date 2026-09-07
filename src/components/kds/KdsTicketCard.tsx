'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ArrowRight,
  RotateCcw,
  Printer,
  Edit3,
  XCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { useUpdateOrderStatus, useToggleItemInKitchen } from '@/hooks/useRestaurantData';
import { playBumpChime } from '@/lib/audio';

interface KdsTicketCardProps {
  order: Order;
  stationFilter?: string;
  onPrint?: (order: Order) => void;
}

export function KdsTicketCard({
  order,
  stationFilter = 'all',
  onPrint,
}: KdsTicketCardProps) {
  const router = useRouter();
  const updateStatus = useUpdateOrderStatus();
  const toggleItem = useToggleItemInKitchen();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const created = new Date(order.createdAt).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - created) / 1000)));
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  // Minimal urgency indicator: standard vs urgent (>15m)
  const isUrgent =
    order.status !== 'completed' && order.status !== 'cancelled' && elapsedMinutes >= 15;

  // Spice label helper
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

  const displayedItems = order.items.filter((it) => {
    if (stationFilter === 'all') return true;
    return it.station === stationFilter;
  });

  if (displayedItems.length === 0 && stationFilter !== 'all') {
    return null;
  }

  const handleBumpNext = () => {
    playBumpChime();
    let nextStatus: OrderStatus = 'preparing';
    if (order.status === 'pending' || order.status === 'sent_to_kitchen') nextStatus = 'preparing';
    else if (order.status === 'preparing') nextStatus = 'ready';
    else if (order.status === 'ready') nextStatus = 'served';
    else if (order.status === 'served') nextStatus = 'completed';

    updateStatus.mutate({ orderId: order.id, status: nextStatus, tableNumber: order.tableNumber });
  };

  const handleBumpPrevious = () => {
    playBumpChime();
    let prevStatus: OrderStatus = 'pending';
    if (order.status === 'completed') prevStatus = 'served';
    else if (order.status === 'served') prevStatus = 'ready';
    else if (order.status === 'ready') prevStatus = 'preparing';
    else if (order.status === 'preparing') prevStatus = 'pending';

    updateStatus.mutate({ orderId: order.id, status: prevStatus, tableNumber: order.tableNumber });
  };

  const handleCancelOrder = () => {
    if (window.confirm(`Are you sure you want to cancel ${order.orderNumber}? This will free the table.`)) {
      updateStatus.mutate({ orderId: order.id, status: 'cancelled', tableNumber: order.tableNumber });
    }
  };

  const handleToggleItem = (cartItemId: string) => {
    playBumpChime();
    toggleItem.mutate({ orderId: order.id, cartItemId });
  };

  return (
    <div
      className={`bg-white rounded-xl border flex flex-col transition-all overflow-hidden ${
        isUrgent
          ? 'border-red-400 shadow-2xs'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {/* Ticket Header */}
      <div
        className={`px-3.5 py-2 border-b flex items-center justify-between gap-2 ${
          isUrgent
            ? 'bg-red-50/70 border-red-100'
            : 'bg-neutral-50/80 border-neutral-100'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono font-bold text-xs text-neutral-900">
            {order.orderNumber}
          </span>
          <span className="text-[10px] font-semibold text-neutral-600 px-1.5 py-0.5 rounded bg-white border border-neutral-200">
            {order.type === 'dine_in'
              ? order.tableNumber || 'Dine-In'
              : order.type === 'delivery'
              ? 'Delivery'
              : 'Takeout'}
          </span>
          <span
            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
              order.paymentStatus === 'paid'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[11px] font-mono font-medium ${
              isUrgent ? 'text-red-700 font-bold' : 'text-neutral-500'
            }`}
          >
            {elapsedMinutes}m ago
          </span>

          {onPrint && (
            <button
              type="button"
              onClick={() => onPrint(order)}
              title="Print Receipt / Bill"
              className="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Order-Level Special Dining / Cooking Instructions */}
      {order.specialNotes && (
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 font-semibold flex items-start gap-1">
          <span className="text-amber-700 uppercase text-[10px] tracking-wide font-black">Instruction:</span>
          <span>{order.specialNotes}</span>
        </div>
      )}

      {/* Items List */}
      <div className="p-3.5 flex-1 divide-y divide-neutral-100 space-y-2 overflow-y-auto max-h-[260px]">
        {displayedItems.map((item) => {
          const isDone = !!item.completedInKitchen;

          return (
            <div
              key={item.cartItemId}
              onClick={() => handleToggleItem(item.cartItemId)}
              className={`pt-2 first:pt-0 flex items-start gap-2.5 cursor-pointer select-none group ${
                isDone ? 'opacity-35' : 'opacity-100'
              }`}
            >
              {/* Minimal Checkbox */}
              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                  isDone
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'border-neutral-300 bg-white group-hover:border-neutral-600'
                }`}
              >
                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              {/* Dish info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-bold text-xs ${
                      isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                    }`}
                  >
                    {item.quantity}×
                  </span>
                  <span
                    className={`font-medium text-xs leading-snug ${
                      isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                    }`}
                  >
                    {item.dish.name}
                  </span>
                </div>

                {/* Modifiers: Variants, Portions, Spice, Addons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-neutral-500">
                  {/* Custom Variants if present */}
                  {item.selectedVariants && item.selectedVariants.length > 0 ? (
                    item.selectedVariants.map((v, idx) => (
                      <span key={idx} className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800 font-medium">
                        {v.groupName}: {v.optionName}
                      </span>
                    ))
                  ) : (
                    <>
                      {item.portion?.priceDelta > 0 && <span>• {item.portion.name}</span>}
                    </>
                  )}

                  {/* Explicit Human-Readable Spice Level */}
                  {item.spiceLevel && getSpiceLabel(item.spiceLevel) && (
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      item.spiceLevel >= 4
                        ? 'bg-red-100 text-red-700'
                        : item.spiceLevel === 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      Spice: {getSpiceLabel(item.spiceLevel)}
                    </span>
                  )}

                  {item.selectedAddons?.map((a) => (
                    <span key={a.id}>• +{a.name}</span>
                  ))}
                </div>

                {item.specialNotes && (
                  <p className="text-[10px] text-amber-800 mt-0.5 font-medium">
                    Note: {item.specialNotes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Footer Actions */}
      <div className="p-2.5 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          {/* Undo Status Step */}
          {order.status !== 'pending' && order.status !== 'sent_to_kitchen' && (
            <button
              type="button"
              onClick={handleBumpPrevious}
              title="Revert Status"
              className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Update Order in POS */}
          <button
            type="button"
            onClick={() => router.push(`/pos?orderId=${order.id}`)}
            title="Open in POS to add/remove items or settle bill"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-[11px] font-semibold transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            <span>Update Order</span>
          </button>

          {/* Cancel Order with explicit text */}
          <button
            type="button"
            onClick={handleCancelOrder}
            title="Cancel this order"
            className="px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Bump Next Status Button */}
        <button
          type="button"
          onClick={handleBumpNext}
          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-2xs ${
            order.status === 'pending' || order.status === 'sent_to_kitchen'
              ? 'bg-red-600 hover:bg-red-700'
              : order.status === 'preparing'
              ? 'bg-neutral-900 hover:bg-black'
              : order.status === 'ready'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {(order.status === 'pending' || order.status === 'sent_to_kitchen') && (
            <>
              <span>Cook</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
          {order.status === 'preparing' && (
            <>
              <span>Ready</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
          {order.status === 'ready' && (
            <>
              <span>Serve</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
          {order.status === 'served' && <span>Complete</span>}
          {order.status === 'completed' && <span>Archived</span>}
        </button>
      </div>
    </div>
  );
}
