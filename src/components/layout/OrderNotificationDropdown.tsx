'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Smartphone,
  Check,
  CheckCheck,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { Order } from '@/types';
import { isMobileOrder } from '@/lib/orderUtils';
import { useOrderNotifications } from '@/lib/orderNotifications';

interface OrderNotificationDropdownProps {
  orders: Order[];
  onShareOrder: (order: Order) => void;
}

export function OrderNotificationDropdown({
  orders,
  onShareOrder,
}: OrderNotificationDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { isRead, markAsRead, markAllAsRead } = useOrderNotifications();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const recent24hCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recentMobileOrders = orders.filter(
    (o) =>
      isMobileOrder(o) &&
      o.status !== 'cancelled' &&
      o.status !== 'draft' &&
      new Date(o.createdAt).getTime() >= recent24hCutoff
  );

  const unreadMobileOrders = recentMobileOrders.filter((o) => !isRead(o.id));
  const readMobileOrders = recentMobileOrders.filter((o) => isRead(o.id));
  const unreadCount = unreadMobileOrders.length;

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (60 * 1000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Mobile Order Notifications"
        className={`relative p-2 rounded-lg border transition-colors flex items-center justify-center ${
          unreadCount > 0
            ? 'border-red-300 bg-red-50 text-brand hover:bg-red-100 shadow-xs'
            : 'border-line bg-white text-ink-soft hover:bg-[#F5F5F5]'
        }`}
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-brand' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-brand text-white text-xs font-black flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-84 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-neutral-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                <Smartphone className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold tracking-tight">Mobile Order Alerts</h4>
                <p className="text-xs text-neutral-400">
                  {unreadCount > 0 ? `${unreadCount} unread incoming` : 'All caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  markAllAsRead(unreadMobileOrders.map((o) => o.id));
                }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 p-2 space-y-2">
            {unreadMobileOrders.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="text-xs font-bold text-neutral-800">No Unread Mobile Orders</p>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-[240px] mx-auto">
                  When customers order from mobile, you will be alerted here.
                </p>
              </div>
            ) : (
              unreadMobileOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          order.type === 'delivery'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : order.type === 'takeout'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {order.type === 'delivery' ? (
                          <>
                            <Bike className="w-3 h-3" />
                            <span>Delivery</span>
                          </>
                        ) : order.type === 'takeout' ? (
                          <>
                            <ShoppingBag className="w-3 h-3" />
                            <span>Takeout</span>
                          </>
                        ) : (
                          <>
                            <UtensilsCrossed className="w-3 h-3" />
                            <span>{order.tableNumber || 'Dine-In'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-400 font-medium">
                        {formatTimeAgo(order.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => markAsRead(order.id)}
                        title="Mark as Read"
                        className="p-1 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition-colors ml-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <div className="font-semibold text-neutral-800 truncate">
                      {order.customerName || 'Mobile Guest'}
                    </div>
                    <div className="font-bold text-brand font-mono">
                      ₱{order.total.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-xs text-neutral-600 line-clamp-1">
                    <span className="font-medium text-neutral-700">
                      {order.items.reduce((s, i) => s + (i.quantity || 1), 0)} items:
                    </span>{' '}
                    {order.items.map((it) => `${it.dish?.name || 'Item'} ×${it.quantity}`).join(', ')}
                  </div>

                  {order.specialNotes && (
                    <div className="p-1.5 rounded bg-white/80 border border-amber-200 text-xs text-amber-950 italic">
                      &ldquo;{order.specialNotes}&rdquo;
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        markAsRead(order.id);
                        setIsOpen(false);
                        if (order.type === 'delivery') {
                          router.push('/delivery');
                        } else {
                          router.push('/kds');
                        }
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <span>View in {order.type === 'delivery' ? 'Delivery' : 'Kitchen (KDS)'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onShareOrder(order)}
                      title="Share order"
                      className="py-1.5 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Share2 className="w-3 h-3 text-brand" />
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => markAsRead(order.id)}
                      className="py-1.5 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            {readMobileOrders.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowHistory((v) => !v)}
                  className="w-full text-center py-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  {showHistory
                    ? 'Hide dismissed orders'
                    : `View ${readMobileOrders.length} recently dismissed order${readMobileOrders.length > 1 ? 's' : ''}`}
                </button>

                {showHistory && (
                  <div className="mt-2 space-y-1.5 opacity-70">
                    {readMobileOrders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="p-2 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-neutral-700">{order.orderNumber}</span>
                          <span className="text-neutral-500 truncate max-w-[120px]">{order.customerName}</span>
                        </div>
                        <span className="font-mono text-neutral-700 font-semibold">₱{order.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
