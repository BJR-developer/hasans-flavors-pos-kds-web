'use client';

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, X, ArrowRight, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { playIncomingOrderBell } from '@/lib/audio';
import { QUERY_KEYS } from '@/hooks/useRestaurantData';
import { useRouter } from 'next/navigation';
import { isMobileOrder } from '@/lib/orderUtils';
import { markNotificationAsRead } from '@/lib/orderNotifications';

interface IncomingOrderToast {
  id: string;
  orderNumber: string;
  type: string;
  total: number;
  customerName?: string;
  tableNumber?: string;
  notes?: string;
}

export function OrderNotificationListener() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeToast, setActiveToast] = useState<IncomingOrderToast | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Listen for new orders inserted in Supabase
    const channel = supabase
      .channel('public:orders:realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => {
          const newRow = payload.new;
          if (!newRow) return;

          // Always invalidate orders cache so tables, KDS, & POS stay in background sync
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });

          // STRICT FILTER: Only trigger notifications/chimes for orders originating from MOBILE
          if (!isMobileOrder(newRow)) {
            return;
          }

          // DRAFT EXCLUSION: If an online order is just starting checkout, DO NOT notify staff yet!
          if (newRow.status === 'draft') {
            return;
          }

          // Play loud restaurant service bell for incoming mobile order
          if (soundEnabled) {
            try {
              playIncomingOrderBell();
            } catch (e) {
              console.error('Audio chime error:', e);
            }
          }

          // Show floating visual alert toast for incoming mobile order
          setActiveToast({
            id: String(newRow.id),
            orderNumber: newRow.order_number || '#New',
            type: newRow.type || 'dine_in',
            total: Number(newRow.total || 0),
            customerName: newRow.customer_name || 'Mobile Customer',
            tableNumber: newRow.table_number || undefined,
            notes: newRow.notes || undefined,
          });

          // Auto dismiss toast after 10 seconds
          setTimeout(() => {
            setActiveToast((cur) => (cur?.id === String(newRow.id) ? null : cur));
          }, 10000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload: any) => {
          const newRow = payload.new;
          const oldRow = payload.old;
          if (!newRow) return;

          // When an online checkout is paid, the webhook/verify transitions status from 'draft' to 'pending'
          const isPromotedFromDraft =
            (!oldRow || oldRow.status === 'draft') &&
            (newRow.status === 'pending' || newRow.status === 'preparing');

          if (isPromotedFromDraft) {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders });

            if (!isMobileOrder(newRow)) return;

            if (soundEnabled) {
              try {
                playIncomingOrderBell();
              } catch (e) {
                console.error('Audio chime error:', e);
              }
            }

            setActiveToast({
              id: String(newRow.id),
              orderNumber: newRow.order_number || '#New',
              type: newRow.type || 'dine_in',
              total: Number(newRow.total || 0),
              customerName: newRow.customer_name || 'Mobile Customer',
              tableNumber: newRow.table_number || undefined,
              notes: newRow.notes || undefined,
            });

            setTimeout(() => {
              setActiveToast((cur) => (cur?.id === String(newRow.id) ? null : cur));
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, soundEnabled]);

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#1F1F1F] text-white p-4 rounded-xl shadow-2xl border border-neutral-700 max-w-sm w-full flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#BA1A20] text-white flex items-center justify-center shrink-0 shadow-md">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>New Mobile Order!</span>
            </span>
            <button
              onClick={() => setActiveToast(null)}
              className="text-neutral-400 hover:text-white p-0.5 rounded transition-colors"
              title="Close alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-1">
            <h4 className="font-extrabold text-sm text-white truncate">
              {activeToast.orderNumber} • ₱{activeToast.total.toLocaleString()}
            </h4>
            <p className="text-xs text-neutral-300 mt-0.5">
              {activeToast.type === 'delivery'
                ? `🛵 Delivery • ${activeToast.customerName}`
                : activeToast.type === 'dine_in'
                ? `🍽️ Mobile Dine-In • ${activeToast.tableNumber || 'Table'}`
                : `🛍️ Mobile Takeout • ${activeToast.customerName}`}
            </p>
            {activeToast.notes && (
              <p className="text-[11px] text-amber-300/90 italic truncate mt-0.5">
                &ldquo;{activeToast.notes}&rdquo;
              </p>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                markNotificationAsRead(activeToast.id);
                if (activeToast.type === 'delivery') {
                  router.push('/delivery');
                } else {
                  router.push('/kds');
                }
                setActiveToast(null);
              }}
              className="flex-1 py-1.5 px-3 bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <span>View Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                markNotificationAsRead(activeToast.id);
                setActiveToast(null);
              }}
              title="Dismiss & Mark Read"
              className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? 'Mute Order Chime' : 'Unmute Order Chime'}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
