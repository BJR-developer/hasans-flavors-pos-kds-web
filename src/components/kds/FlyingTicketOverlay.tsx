'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Order, OrderStatus } from '@/types';
import { getOrderColorTheme } from '@/lib/orderColors';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export interface FlyingCardInfo {
  order: Order;
  startRect: { left: number; top: number; width: number; height: number };
  targetRect: { left: number; top: number; width: number; height: number };
  nextStatus: OrderStatus;
  direction: 'forward' | 'backward';
}

interface FlyingTicketOverlayProps {
  flight: FlyingCardInfo | null;
  onAnimationComplete: () => void;
}

export function FlyingTicketOverlay({ flight, onAnimationComplete }: FlyingTicketOverlayProps) {
  if (!flight) return null;

  const { order, startRect, targetRect, nextStatus, direction } = flight;
  const colorTheme = getOrderColorTheme(order.id || order.orderNumber);

  const statusLabel =
    nextStatus === 'preparing'
      ? 'Moving to Cooking...'
      : nextStatus === 'ready'
      ? 'Moving to Ready...'
      : nextStatus === 'served'
      ? 'Moving to Served...'
      : nextStatus === 'completed'
      ? 'Completing Order...'
      : 'Reverting Order...';

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <motion.div
        initial={{
          position: 'fixed',
          top: startRect.top,
          left: startRect.left,
          width: startRect.width,
          height: startRect.height,
          scale: 1,
          rotate: 0,
          opacity: 1,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
        animate={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          scale: [1, 1.05, 1],
          rotate: direction === 'forward' ? [0, 2.5, 0] : [0, -2.5, 0],
          opacity: nextStatus === 'completed' ? [1, 0.9, 0] : 1,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        }}
        transition={{
          duration: 0.42,
          ease: [0.22, 1, 0.36, 1], // snappy glide
        }}
        onAnimationComplete={onAnimationComplete}
        className="bg-white rounded-xl border-2 border-neutral-900 flex flex-col overflow-hidden shadow-2xl ring-4 ring-neutral-950/20"
      >
        {/* Flying Beacon Ribbon */}
        <div className="bg-neutral-900 text-white text-[10px] font-black px-2.5 py-1 flex items-center justify-between tracking-wide uppercase">
          <span className="flex items-center gap-1 text-amber-300">
            {direction === 'forward' ? <ArrowRight className="w-3 h-3 animate-pulse" /> : <ArrowLeft className="w-3 h-3 animate-pulse" />}
            {statusLabel}
          </span>
          <span className="flex items-center gap-1 text-white font-mono text-[9px]">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Gliding
          </span>
        </div>

        {/* Cloned Ticket Header */}
        <div
          className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 ${colorTheme.headerBg} ${colorTheme.headerText}`}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm">{order.orderNumber}</span>
            {order.type === 'dine_in' ? (
              <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded ${colorTheme.badgeBg}`}>
                {order.tableNumber || 'Dine-In'}
              </span>
            ) : (
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${colorTheme.badgeBg}`}>
                {order.type === 'delivery' ? 'Delivery' : 'Takeout'}
              </span>
            )}
          </div>
          <span className="text-[10.5px] font-bold font-mono">
            {order.items.length} item{order.items.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Cloned Ticket Items summary preview */}
        <div className="p-3 bg-white flex-1 overflow-hidden space-y-1.5 opacity-90">
          {order.items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-semibold text-neutral-800">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono font-black text-neutral-900">{item.quantity}x</span>
                <span className="truncate">{item.dish.name}</span>
              </div>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-[10px] text-neutral-500 font-medium italic">
              +{order.items.length - 3} more items...
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
