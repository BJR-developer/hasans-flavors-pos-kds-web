'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { useUpdateOrderStatus, useToggleItemInKitchen } from '@/hooks/useRestaurantData';
import { playBumpChime } from '@/lib/audio';

interface KdsTicketCardProps {
  order: Order;
  stationFilter?: string;
}

export function KdsTicketCard({ order, stationFilter = 'all' }: KdsTicketCardProps) {
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
  const isUrgent = order.status !== 'completed' && order.status !== 'cancelled' && elapsedMinutes >= 15;

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
    if (order.status === 'pending') nextStatus = 'preparing';
    else if (order.status === 'preparing') nextStatus = 'ready';
    else if (order.status === 'ready') nextStatus = 'completed';

    updateStatus.mutate({ orderId: order.id, status: nextStatus });
  };

  const handleBumpPrevious = () => {
    playBumpChime();
    let prevStatus: OrderStatus = 'pending';
    if (order.status === 'ready') prevStatus = 'preparing';
    else if (order.status === 'preparing') prevStatus = 'pending';

    updateStatus.mutate({ orderId: order.id, status: prevStatus });
  };

  const handleToggleItem = (cartItemId: string) => {
    playBumpChime();
    toggleItem.mutate({ orderId: order.id, cartItemId });
  };

  return (
    <div
      className={`bg-white rounded-xl border flex flex-col transition-all overflow-hidden ${
        isUrgent
          ? 'border-[#BA1A20] shadow-xs'
          : 'border-[#E5E5E5] hover:border-[#D4D4D4]'
      }`}
    >
      {/* Ticket Header */}
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between ${
          isUrgent
            ? 'bg-[#FFF2F0] border-[#FFDAD6]'
            : 'bg-[#FAFAFA] border-[#E5E5E5]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-sm text-[#1F1F1F]">
            {order.orderNumber}
          </span>
          <span className="text-[11px] font-bold text-[#525252] px-2 py-0.5 rounded-md bg-white border border-[#E5E5E5]">
            {order.type === 'dine_in'
              ? order.tableNumber || 'Dine-In'
              : order.type === 'delivery'
              ? 'Delivery'
              : 'Takeout'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-mono font-bold ${
              isUrgent ? 'text-[#BA1A20]' : 'text-[#737373]'
            }`}
          >
            {elapsedMinutes}m ago
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="p-3.5 flex-1 divide-y divide-[#F5F5F5] space-y-2 overflow-y-auto max-h-[300px]">
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
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                  isDone
                    ? 'bg-[#1F1F1F] border-[#1F1F1F] text-white'
                    : 'border-[#D4D4D4] bg-white group-hover:border-[#1F1F1F]'
                }`}
              >
                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              {/* Dish info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-black text-xs ${
                      isDone ? 'line-through text-[#737373]' : 'text-[#1F1F1F]'
                    }`}
                  >
                    {item.quantity}x
                  </span>
                  <span
                    className={`font-semibold text-xs leading-snug ${
                      isDone ? 'line-through text-[#737373]' : 'text-[#1F1F1F]'
                    }`}
                  >
                    {item.dish.name}
                  </span>
                </div>

                {/* Modifiers */}
                <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[10px] text-[#737373]">
                  {item.portion?.priceDelta > 0 && <span>• {item.portion.name}</span>}
                  {item.spiceLevel && item.spiceLevel > 2 && (
                    <span className="text-[#BA1A20] font-semibold">• Spicy</span>
                  )}
                  {item.selectedAddons?.map((a) => (
                    <span key={a.id}>• +{a.name}</span>
                  ))}
                </div>

                {item.specialNotes && (
                  <p className="text-[10px] text-[#B45309] mt-0.5 font-medium">
                    Note: {item.specialNotes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bump Button */}
      <div className="p-2.5 bg-[#FAFAFA] border-t border-[#E5E5E5] flex items-center gap-2">
        {order.status !== 'pending' && (
          <button
            type="button"
            onClick={handleBumpPrevious}
            title="Undo / Back"
            className="p-2 rounded-lg border border-[#E5E5E5] bg-white text-[#737373] hover:text-[#1F1F1F]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleBumpNext}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white transition-colors ${
            order.status === 'pending'
              ? 'bg-[#BA1A20] hover:bg-[#8B0000]'
              : order.status === 'preparing'
              ? 'bg-[#1F1F1F] hover:bg-[#383838]'
              : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
          }`}
        >
          {order.status === 'pending' && (
            <>
              <span>Start Cooking</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
          {order.status === 'preparing' && (
            <>
              <span>Mark Ready</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
          {order.status === 'ready' && <span>Serve Order</span>}
          {order.status === 'completed' && <span>Archive</span>}
        </button>
      </div>
    </div>
  );
}
