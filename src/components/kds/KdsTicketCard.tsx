'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ArrowRight,
  RotateCcw,
  Printer,
  Edit3,
  XCircle,
  ArrowRightLeft,
  GripVertical,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import {
  useUpdateOrderStatus,
  useToggleItemInKitchen,
  useUpdateOrderEstimatedMinutes,
} from '@/hooks/useRestaurantData';
import { playBumpChime } from '@/lib/audio';
import { ChangeTableModal } from '../tables/ChangeTableModal';
import { getOrderColorTheme } from '@/lib/orderColors';

interface KdsTicketCardProps {
  order: Order;
  stationFilter?: string;
  onPrint?: (order: Order) => void;
  onStatusChange?: (orderId: string, nextStatus: OrderStatus, tableNumber?: string, direction?: 'forward' | 'backward') => void;
  onTriggerFly?: (order: Order, nextStatus: OrderStatus, direction: 'forward' | 'backward') => void;
  onDragStart?: (e: React.DragEvent, order: Order) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isJustMoved?: boolean;
  isFlyingOrigin?: boolean;
}

export function KdsTicketCard({
  order,
  stationFilter = 'all',
  onPrint,
  onStatusChange,
  onTriggerFly,
  onDragStart,
  onDragEnd,
  isJustMoved = false,
  isFlyingOrigin = false,
}: KdsTicketCardProps) {
  const router = useRouter();
  const updateStatus = useUpdateOrderStatus();
  const toggleItem = useToggleItemInKitchen();
  const updateEstimatedMinutes = useUpdateOrderEstimatedMinutes();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isChangeTableOpen, setIsChangeTableOpen] = useState(false);
  const [animatingDirection, setAnimatingDirection] = useState<'forward' | 'backward' | null>(null);

  // Derive distinct, high-contrast visual theme for this order
  const colorTheme = useMemo(() => {
    return getOrderColorTheme(order.id || order.orderNumber);
  }, [order.id, order.orderNumber]);

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
    if (animatingDirection || isFlyingOrigin) return;
    playBumpChime();
    let nextStatus: OrderStatus = 'preparing';
    if (order.status === 'pending' || order.status === 'sent_to_kitchen') nextStatus = 'preparing';
    else if (order.status === 'preparing') nextStatus = 'ready';
    else if (order.status === 'ready') nextStatus = 'served';
    else if (order.status === 'served') nextStatus = 'completed';

    if (onTriggerFly) {
      onTriggerFly(order, nextStatus, 'forward');
      return;
    }

    if (onStatusChange) {
      onStatusChange(order.id, nextStatus, order.tableNumber, 'forward');
    } else {
      updateStatus.mutate({ orderId: order.id, status: nextStatus, tableNumber: order.tableNumber });
    }
  };

  const handleBumpPrevious = () => {
    if (animatingDirection || isFlyingOrigin) return;
    playBumpChime();
    let prevStatus: OrderStatus = 'pending';
    if (order.status === 'completed') prevStatus = 'served';
    else if (order.status === 'served') prevStatus = 'ready';
    else if (order.status === 'ready') prevStatus = 'preparing';
    else if (order.status === 'preparing') prevStatus = 'pending';

    if (onTriggerFly) {
      onTriggerFly(order, prevStatus, 'backward');
      return;
    }

    if (onStatusChange) {
      onStatusChange(order.id, prevStatus, order.tableNumber, 'backward');
    } else {
      updateStatus.mutate({ orderId: order.id, status: prevStatus, tableNumber: order.tableNumber });
    }
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
      id={`kds-ticket-${order.id}`}
      draggable={!animatingDirection && !isFlyingOrigin}
      onDragStart={(e) => onDragStart?.(e, order)}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-xl border flex flex-col overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${isFlyingOrigin
          ? 'opacity-20 scale-95 pointer-events-none'
          : isJustMoved
            ? 'ring-2 ring-emerald-500 shadow-md animate-in fade-in slide-in-from-left-4 duration-300'
            : isUrgent
              ? 'border-red-400 shadow-2xs'
              : 'border-neutral-200 hover:border-neutral-300 hover:shadow-2xs'
        }`}
    >

      {/* Ticket Header with Dynamic High-Contrast Color Theme */}
      <div
        className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 transition-colors ${colorTheme.headerBg
          } ${colorTheme.headerText}`}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3 opacity-60 shrink-0" />
            <span className="font-mono font-black text-sm tracking-tight">
              {order.orderNumber}
            </span>
          </div>

          {order.type === 'dine_in' ? (
            <button
              type="button"
              onClick={() => setIsChangeTableOpen(true)}
              className={`flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs ${colorTheme.badgeBg
                }`}
              title="Click to move to another available table"
            >
              <span>{order.tableNumber || 'Dine-In'}</span>
              <ArrowRightLeft className="w-2.5 h-2.5 opacity-75" />
            </button>
          ) : (
            <span
              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${colorTheme.badgeBg
                }`}
            >
              {order.type === 'delivery' ? 'Delivery' : 'Takeout'}
            </span>
          )}

          <span
            className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${order.paymentStatus === 'paid'
                ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-400/40'
                : 'bg-black/25 text-inherit border border-current/20'
              }`}
          >
            {order.paymentStatus === 'paid' ? '★ PAID' : 'UNPAID'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[11px] font-mono font-bold ${colorTheme.subText}`}
          >
            {elapsedMinutes}m
          </span>

          {/* Quick Staff ETA Control (Live syncs to mobile app) */}
          <div
            className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer"
            title="Click to adjust estimated arrival time for mobile app"
            onClick={(e) => {
              e.stopPropagation();
              const nextVal = window.prompt(
                'Update estimated cooking/delivery time (minutes):',
                String(order.estimatedMinutes || 20)
              );
              if (nextVal !== null) {
                const parsed = parseInt(nextVal.trim(), 10);
                if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
                  updateEstimatedMinutes.mutate({ orderId: order.id, estimatedMinutes: parsed });
                }
              }
            }}
          >
            <Clock className="w-3 h-3 opacity-80 shrink-0" />
            <span>ETA: {order.estimatedMinutes || 20}m</span>
            <div className="flex items-center gap-0.5 ml-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const cur = order.estimatedMinutes || 20;
                  if (cur > 5) {
                    updateEstimatedMinutes.mutate({ orderId: order.id, estimatedMinutes: cur - 5 });
                  }
                }}
                title="Decrease ETA by 5m"
                className="w-3.5 h-3.5 rounded bg-black/30 hover:bg-black/50 flex items-center justify-center text-[10px] font-bold"
              >
                -
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const cur = order.estimatedMinutes || 20;
                  if (cur < 120) {
                    updateEstimatedMinutes.mutate({ orderId: order.id, estimatedMinutes: cur + 5 });
                  }
                }}
                title="Increase ETA by 5m"
                className="w-3.5 h-3.5 rounded bg-black/30 hover:bg-black/50 flex items-center justify-center text-[10px] font-bold"
              >
                +
              </button>
            </div>
          </div>

          {onPrint && (
            <button
              type="button"
              onClick={() => onPrint(order)}
              title="Print Receipt / Bill"
              className="p-1 rounded hover:bg-black/15 transition-colors cursor-pointer"
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
              className={`pt-2 first:pt-0 flex items-start gap-2.5 cursor-pointer select-none group ${isDone ? 'opacity-35' : 'opacity-100'
                }`}
            >
              {/* Minimal Checkbox */}
              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${isDone
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
                    className={`font-bold text-xs ${isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                      }`}
                  >
                    {item.quantity}×
                  </span>
                  <span
                    className={`font-medium text-xs leading-snug ${isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
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
                  {item.spiceLevel &&
                    item.spiceLevel > 0 &&
                    !item.selectedVariants?.some((v) => v.groupName.toLowerCase().includes('spice')) &&
                    getSpiceLabel(item.spiceLevel) && (
                      <span className={`px-1.5 py-0.5 rounded font-bold ${item.spiceLevel >= 4
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

          {/* Change Table action for Dine-In tickets */}
          {order.type === 'dine_in' && (
            <button
              type="button"
              onClick={() => setIsChangeTableOpen(true)}
              title="Move or reassign table"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Table</span>
            </button>
          )}

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
          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-2xs ${order.status === 'pending' || order.status === 'sent_to_kitchen'
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

      {/* Change Dining Table Modal */}
      {isChangeTableOpen && (
        <ChangeTableModal
          isOpen={isChangeTableOpen}
          onClose={() => setIsChangeTableOpen(false)}
          order={order}
        />
      )}
    </div>
  );
}
