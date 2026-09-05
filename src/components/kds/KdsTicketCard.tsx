'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Check,
  Flame,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { useUpdateOrderStatus, useToggleItemInKitchen } from '@/hooks/useRestaurantData';
import { playBumpChime } from '@/lib/audio';

interface KdsTicketCardProps {
  order: Order;
  stationFilter?: string; // 'all' | 'tandoor' | 'biryani_curry' | 'sides_drinks'
}

export function KdsTicketCard({ order, stationFilter = 'all' }: KdsTicketCardProps) {
  const updateStatus = useUpdateOrderStatus();
  const toggleItem = useToggleItemInKitchen();

  // Elapsed Time Counter
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const created = new Date(order.createdAt).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - created) / 1000)));
    };

    calculateElapsed();
    const timer = setInterval(calculateElapsed, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;
  const timeFormatted = `${elapsedMinutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;

  // Urgency classification: Green (<10m), Amber (10-20m), Red (>20m)
  let urgencyTheme = {
    headerBg: 'bg-[#2E7D32]',
    headerText: 'text-white',
    badgeBg: 'bg-[#E8F5E9]',
    badgeText: 'text-[#2E7D32]',
    cardBorder: 'border-[#2E7D32]/30',
    pulse: false,
  };

  if (order.status !== 'completed' && order.status !== 'cancelled') {
    if (elapsedMinutes >= 20) {
      urgencyTheme = {
        headerBg: 'bg-[#BA1A20]',
        headerText: 'text-white',
        badgeBg: 'bg-[#FFDAD6]',
        badgeText: 'text-[#BA1A20]',
        cardBorder: 'border-[#BA1A20]',
        pulse: true,
      };
    } else if (elapsedMinutes >= 10) {
      urgencyTheme = {
        headerBg: 'bg-[#B45309]',
        headerText: 'text-white',
        badgeBg: 'bg-[#FFF8E1]',
        badgeText: 'text-[#B45309]',
        cardBorder: 'border-[#B45309]/50',
        pulse: false,
      };
    }
  } else {
    urgencyTheme = {
      headerBg: 'bg-[#5B403D]',
      headerText: 'text-white',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-600',
      cardBorder: 'border-[#E9E8E7]',
      pulse: false,
    };
  }

  // Filter items if specific kitchen station is selected
  const displayedItems = order.items.filter((it) => {
    if (stationFilter === 'all') return true;
    return it.station === stationFilter;
  });

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

  const handleToggleItemCheckbox = (cartItemId: string) => {
    playBumpChime();
    toggleItem.mutate({ orderId: order.id, cartItemId });
  };

  if (displayedItems.length === 0 && stationFilter !== 'all') {
    return null; // No items for this station in this order
  }

  return (
    <div
      className={`bg-white rounded-2xl border-2 overflow-hidden flex flex-col shadow-sm transition-all ${
        urgencyTheme.cardBorder
      } ${urgencyTheme.pulse ? 'ring-2 ring-[#BA1A20]/40' : ''}`}
    >
      {/* 1. Ticket Header */}
      <div className={`px-4 py-3 ${urgencyTheme.headerBg} ${urgencyTheme.headerText} flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-base tracking-wider">
              {order.orderNumber}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wide">
              {order.type === 'dine_in'
                ? order.tableNumber || 'Dine-In'
                : order.type === 'delivery'
                ? 'Delivery'
                : 'Takeout'}
            </span>
          </div>
          <p className="text-[11px] text-white/90 font-medium truncate max-w-[180px]">
            {order.customerName}
          </p>
        </div>

        {/* Live Elapsed Urgency Badge */}
        <div className="flex flex-col items-end">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
              urgencyTheme.badgeBg
            } ${urgencyTheme.badgeText}`}
          >
            {elapsedMinutes >= 20 ? (
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>{timeFormatted}</span>
          </div>
          <span className="text-[9px] text-white/80 font-bold uppercase mt-0.5 tracking-wider">
            {order.status === 'pending'
              ? '● Received'
              : order.status === 'preparing'
              ? '● In Kitchen'
              : order.status === 'ready'
              ? '● Ready'
              : '● Done'}
          </span>
        </div>
      </div>

      {/* 2. Order Ticket Items */}
      <div className="p-3.5 flex-1 divide-y divide-[#F1F0F0] space-y-2.5 overflow-y-auto max-h-[360px]">
        {displayedItems.map((item) => {
          const isItemDone = !!item.completedInKitchen;

          return (
            <div
              key={item.cartItemId}
              onClick={() => handleToggleItemCheckbox(item.cartItemId)}
              className={`pt-2.5 first:pt-0 cursor-pointer flex items-start gap-2.5 group transition-opacity ${
                isItemDone ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {/* Interactive Line-Cook Checkbox */}
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  isItemDone
                    ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                    : 'border-[#8F6F6C] bg-white group-hover:border-[#2D2926]'
                }`}
              >
                {isItemDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-sm font-black ${
                        isItemDone ? 'line-through text-[#8F6F6C]' : 'text-[#BA1A20]'
                      }`}
                    >
                      {item.quantity}x
                    </span>
                    <span
                      className={`text-xs font-bold leading-tight ${
                        isItemDone ? 'line-through text-[#8F6F6C]' : 'text-[#2D2926]'
                      }`}
                    >
                      {item.dish.name}
                    </span>
                  </div>
                </div>

                {/* Modifiers & Cooking Badges */}
                <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                  {item.portion?.priceDelta > 0 && (
                    <span className="px-1.5 py-0.2 rounded font-bold bg-[#FAF9F8] border border-[#E9E8E7] text-[#5B403D]">
                      {item.portion.name}
                    </span>
                  )}
                  {item.spiceLevel && (
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 ${
                        item.spiceLevel >= 3
                          ? 'bg-[#FFF2F0] text-[#BA1A20] border border-[#FFDAD6]'
                          : 'bg-[#FFF8E1] text-[#B45309]'
                      }`}
                    >
                      <Flame className="w-2.5 h-2.5" />
                      <span>
                        {item.spiceLevel === 1
                          ? 'Mild'
                          : item.spiceLevel === 2
                          ? 'Med'
                          : item.spiceLevel === 3
                          ? 'Spicy'
                          : 'Fiery'}
                      </span>
                    </span>
                  )}
                  {item.selectedAddons?.map((a) => (
                    <span
                      key={a.id}
                      className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-medium"
                    >
                      +{a.name}
                    </span>
                  ))}
                </div>

                {/* Item-specific Notes */}
                {item.specialNotes && (
                  <p className="mt-1 text-[11px] font-bold text-[#B45309] bg-[#FFF8E1] px-2 py-0.5 rounded border border-[#FFE082]/60 leading-snug">
                    ★ {item.specialNotes}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* General Order Ticket Notes */}
        {order.specialNotes && (
          <div className="pt-2 text-[11px] font-bold text-[#BA1A20] bg-[#FFF2F0] p-2 rounded-xl border border-[#FFDAD6]">
            ⚠️ Order Note: {order.specialNotes}
          </div>
        )}
      </div>

      {/* 3. Kitchen Bump Bar Controls */}
      <div className="p-3 bg-[#FAF9F8] border-t border-[#E9E8E7] flex items-center gap-2">
        {order.status !== 'pending' && (
          <button
            type="button"
            onClick={handleBumpPrevious}
            title="Recall to previous stage"
            className="p-2.5 rounded-xl border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] text-[#8F6F6C] hover:text-[#2D2926] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleBumpNext}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-xs transition-all ${
            order.status === 'pending'
              ? 'bg-[#BA1A20] hover:bg-[#8B0000]'
              : order.status === 'preparing'
              ? 'bg-[#B45309] hover:bg-[#8E6A00]'
              : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
          }`}
        >
          {order.status === 'pending' && (
            <>
              <Flame className="w-4 h-4" />
              <span>Start Cooking</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
          {order.status === 'preparing' && (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mark Ready</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
          {order.status === 'ready' && (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Complete / Served</span>
            </>
          )}
          {order.status === 'completed' && <span>Archive Ticket</span>}
        </button>
      </div>
    </div>
  );
}
