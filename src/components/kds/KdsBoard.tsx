'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Columns3,
  LayoutGrid,
  Search,
  X,
  Clock,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useRestaurantData';
import { KdsTicketCard } from './KdsTicketCard';
import { FlyingTicketOverlay, FlyingCardInfo } from './FlyingTicketOverlay';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';
import { Order, OrderStatus } from '@/types';
import { playBumpChime } from '@/lib/audio';
import { motion, AnimatePresence } from 'framer-motion';

export function KdsBoard() {
  const { data: orders = [] } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  const [stationFilter, setStationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Drag-and-Drop & Visual Transition Animation State
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null);
  const [justMovedIds, setJustMovedIds] = useState<Record<string, boolean>>({});
  const [activeFlight, setActiveFlight] = useState<FlyingCardInfo | null>(null);

  // Trigger smooth highlight beacon when an order arrives in a new column
  const markOrderAsJustMoved = useCallback((orderId: string) => {
    setJustMovedIds((prev) => ({ ...prev, [orderId]: true }));
    setTimeout(() => {
      setJustMovedIds((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, 2500);
  }, []);

  // Handle animated button bumps with smooth visible flight across columns
  const handleTriggerFly = useCallback(
    (order: Order, nextStatus: OrderStatus, direction: 'forward' | 'backward') => {
      const cardEl = document.getElementById(`kds-ticket-${order.id}`);
      let targetEl: HTMLElement | null = null;

      if (nextStatus === 'pending' || nextStatus === 'sent_to_kitchen') {
        targetEl = document.getElementById('kds-col-pending');
      } else if (nextStatus === 'preparing') {
        targetEl = document.getElementById('kds-col-preparing');
      } else if (nextStatus === 'ready') {
        targetEl = document.getElementById('kds-col-ready');
      } else if (nextStatus === 'served') {
        targetEl = document.getElementById('kds-col-served');
      }

      if (cardEl) {
        const startRect = cardEl.getBoundingClientRect();
        let targetRect = {
          left: startRect.left + (direction === 'forward' ? 320 : -320),
          top: startRect.top,
          width: startRect.width,
          height: startRect.height,
        };

        if (targetEl) {
          const colRect = targetEl.getBoundingClientRect();
          targetRect = {
            left: colRect.left + 12,
            top: colRect.top + 48,
            width: startRect.width,
            height: startRect.height,
          };
        } else if (nextStatus === 'completed') {
          // Fly out towards upper right settled archive
          targetRect = {
            left: window.innerWidth + 80,
            top: startRect.top - 80,
            width: startRect.width,
            height: startRect.height,
          };
        }

        setActiveFlight({
          order,
          startRect: {
            left: startRect.left,
            top: startRect.top,
            width: startRect.width,
            height: startRect.height,
          },
          targetRect,
          nextStatus,
          direction,
        });
        return;
      }

      // Fallback if no DOM element found
      markOrderAsJustMoved(order.id);
      updateStatusMutation.mutate({ orderId: order.id, status: nextStatus, tableNumber: order.tableNumber });
    },
    [markOrderAsJustMoved, updateStatusMutation]
  );

  const handleFlightAnimationComplete = useCallback(() => {
    if (!activeFlight) return;
    const { order, nextStatus } = activeFlight;
    playBumpChime();
    markOrderAsJustMoved(order.id);
    updateStatusMutation.mutate({
      orderId: order.id,
      status: nextStatus,
      tableNumber: order.tableNumber,
    });
    setActiveFlight(null);
  }, [activeFlight, markOrderAsJustMoved, updateStatusMutation]);

  // Handle direct status change
  const handleStatusChange = useCallback(
    (orderId: string, nextStatus: OrderStatus, tableNumber?: string) => {
      markOrderAsJustMoved(orderId);
      updateStatusMutation.mutate({ orderId, status: nextStatus, tableNumber });
    },
    [markOrderAsJustMoved, updateStatusMutation]
  );

  // Handle Drag-and-Drop between Kanban columns
  const handleDropToColumn = useCallback(
    (targetStatus: OrderStatus) => {
      if (!draggingOrderId) return;
      const order = orders.find((o) => o.id === draggingOrderId);
      if (order && order.status !== targetStatus) {
        playBumpChime();
        markOrderAsJustMoved(order.id);
        updateStatusMutation.mutate({
          orderId: order.id,
          status: targetStatus,
          tableNumber: order.tableNumber,
        });
      }
      setDraggingOrderId(null);
      setDragOverColumn(null);
    },
    [draggingOrderId, orders, markOrderAsJustMoved, updateStatusMutation]
  );

  // Scope: Last 24 hours only
  const recent24hOrders = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
  }, [orders]);

  // Search filter across order #, table, customer, dish names
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return recent24hOrders;
    const q = searchQuery.trim().toLowerCase();

    return recent24hOrders.filter((o) => {
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchTable = (o.tableNumber || '').toLowerCase().includes(q);
      const matchCustomer = (o.customerName || '').toLowerCase().includes(q);
      const matchDishes = o.items.some((it) => it.dish.name.toLowerCase().includes(q));
      return matchNumber || matchTable || matchCustomer || matchDishes;
    });
  }, [recent24hOrders, searchQuery]);

  // Active Kanban Columns - Newest orders at the top, older orders at the bottom
  const pendingOrders = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'pending' || o.status === 'sent_to_kitchen')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  const preparingOrders = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'preparing')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  const readyOrders = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'ready')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  const servedOrders = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'served')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders]);

  const allActiveOrders = [...pendingOrders, ...preparingOrders, ...readyOrders, ...servedOrders];

  const stations = [
    { id: 'all', label: 'All Stations' },
    { id: 'tandoor', label: 'Tandoor & Grill' },
    { id: 'biryani_curry', label: 'Biryani & Curries' },
    { id: 'sides_drinks', label: 'Sides & Drinks' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-neutral-100">
      {/* Top Control Bar: Search & Filters */}
      <div className="px-4 sm:px-5 py-2.5 bg-white border-b border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        
        {/* Left: Stations & Scope indicator */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 p-0.5 bg-neutral-100 rounded-lg">
            {stations.map((st) => {
              const isSelected = stationFilter === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setStationFilter(st.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          <span className="hidden md:flex items-center gap-1 text-[11px] font-medium text-neutral-400 pl-1">
            <Clock className="w-3 h-3" />
            <span>Last 24h</span>
          </span>
        </div>

        {/* Right: Search & View toggles */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order, table, or dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('columns')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'columns'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Columns view"
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-4 lg:p-5">
        {viewMode === 'columns' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-w-[960px]">
            {/* 1. Received Column */}
            <div
              id="kds-col-pending"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn('pending');
              }}
              onDragLeave={() => {
                if (dragOverColumn === 'pending') setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropToColumn('pending');
              }}
              className={`flex flex-col rounded-xl p-3 overflow-hidden transition-all duration-200 ${
                dragOverColumn === 'pending' || activeFlight?.nextStatus === 'pending'
                  ? 'border-2 border-dashed border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-neutral-200/60 border border-neutral-300/70'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Received ({pendingOrders.length})
                </span>
                {dragOverColumn === 'pending' && (
                  <span className="text-[10px] font-bold text-amber-800 animate-pulse flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" /> Drop here
                  </span>
                )}
                {activeFlight?.nextStatus === 'pending' && (
                  <span className="text-[10px] font-bold text-amber-800 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Incoming...
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">Queue empty</p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {pendingOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      >
                        <KdsTicketCard
                          order={order}
                          stationFilter={stationFilter}
                          onPrint={(o) => setReceiptOrder(o)}
                          onStatusChange={handleStatusChange}
                          onTriggerFly={handleTriggerFly}
                          isFlyingOrigin={activeFlight?.order.id === order.id}
                          onDragStart={(e, o) => {
                            setDraggingOrderId(o.id);
                            e.dataTransfer.setData('text/plain', o.id);
                          }}
                          onDragEnd={() => {
                            setDraggingOrderId(null);
                            setDragOverColumn(null);
                          }}
                          isJustMoved={!!justMovedIds[order.id]}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* 2. Cooking Column */}
            <div
              id="kds-col-preparing"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn('preparing');
              }}
              onDragLeave={() => {
                if (dragOverColumn === 'preparing') setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropToColumn('preparing');
              }}
              className={`flex flex-col rounded-xl p-3 overflow-hidden transition-all duration-200 ${
                dragOverColumn === 'preparing' || activeFlight?.nextStatus === 'preparing'
                  ? 'border-2 border-dashed border-neutral-900 bg-neutral-100/90 shadow-md ring-2 ring-neutral-900/20'
                  : 'bg-neutral-200/60 border border-neutral-300/70'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Cooking ({preparingOrders.length})
                </span>
                {dragOverColumn === 'preparing' && (
                  <span className="text-[10px] font-bold text-neutral-800 animate-pulse flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" /> Drop here
                  </span>
                )}
                {activeFlight?.nextStatus === 'preparing' && (
                  <span className="text-[10px] font-bold text-neutral-900 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Incoming...
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {preparingOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">No items cooking</p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {preparingOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      >
                        <KdsTicketCard
                          order={order}
                          stationFilter={stationFilter}
                          onPrint={(o) => setReceiptOrder(o)}
                          onStatusChange={handleStatusChange}
                          onTriggerFly={handleTriggerFly}
                          isFlyingOrigin={activeFlight?.order.id === order.id}
                          onDragStart={(e, o) => {
                            setDraggingOrderId(o.id);
                            e.dataTransfer.setData('text/plain', o.id);
                          }}
                          onDragEnd={() => {
                            setDraggingOrderId(null);
                            setDragOverColumn(null);
                          }}
                          isJustMoved={!!justMovedIds[order.id]}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* 3. Ready Column */}
            <div
              id="kds-col-ready"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn('ready');
              }}
              onDragLeave={() => {
                if (dragOverColumn === 'ready') setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropToColumn('ready');
              }}
              className={`flex flex-col rounded-xl p-3 overflow-hidden transition-all duration-200 ${
                dragOverColumn === 'ready' || activeFlight?.nextStatus === 'ready'
                  ? 'border-2 border-dashed border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-neutral-200/60 border border-neutral-300/70'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Ready ({readyOrders.length})
                </span>
                {dragOverColumn === 'ready' && (
                  <span className="text-[10px] font-bold text-blue-700 animate-pulse flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" /> Drop here
                  </span>
                )}
                {activeFlight?.nextStatus === 'ready' && (
                  <span className="text-[10px] font-bold text-blue-800 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" /> Incoming...
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {readyOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">No orders ready</p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {readyOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      >
                        <KdsTicketCard
                          order={order}
                          stationFilter={stationFilter}
                          onPrint={(o) => setReceiptOrder(o)}
                          onStatusChange={handleStatusChange}
                          onTriggerFly={handleTriggerFly}
                          isFlyingOrigin={activeFlight?.order.id === order.id}
                          onDragStart={(e, o) => {
                            setDraggingOrderId(o.id);
                            e.dataTransfer.setData('text/plain', o.id);
                          }}
                          onDragEnd={() => {
                            setDraggingOrderId(null);
                            setDragOverColumn(null);
                          }}
                          isJustMoved={!!justMovedIds[order.id]}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* 4. Served Column */}
            <div
              id="kds-col-served"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn('served');
              }}
              onDragLeave={() => {
                if (dragOverColumn === 'served') setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropToColumn('served');
              }}
              className={`flex flex-col rounded-xl p-3 overflow-hidden transition-all duration-200 ${
                dragOverColumn === 'served' || activeFlight?.nextStatus === 'served'
                  ? 'border-2 border-dashed border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-neutral-200/60 border border-neutral-300/70'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Served ({servedOrders.length})
                </span>
                {dragOverColumn === 'served' && (
                  <span className="text-[10px] font-bold text-emerald-700 animate-pulse flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" /> Drop here
                  </span>
                )}
                {activeFlight?.nextStatus === 'served' && (
                  <span className="text-[10px] font-bold text-emerald-800 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> Incoming...
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {servedOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">No served orders</p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {servedOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      >
                        <KdsTicketCard
                          order={order}
                          stationFilter={stationFilter}
                          onPrint={(o) => setReceiptOrder(o)}
                          onStatusChange={handleStatusChange}
                          onTriggerFly={handleTriggerFly}
                          isFlyingOrigin={activeFlight?.order.id === order.id}
                          onDragStart={(e, o) => {
                            setDraggingOrderId(o.id);
                            e.dataTransfer.setData('text/plain', o.id);
                          }}
                          onDragEnd={() => {
                            setDraggingOrderId(null);
                            setDragOverColumn(null);
                          }}
                          isJustMoved={!!justMovedIds[order.id]}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto h-full">
            {allActiveOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-neutral-400">
                <p className="text-xs font-semibold text-neutral-700">No active kitchen orders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allActiveOrders.map((order) => (
                  <KdsTicketCard
                    key={order.id}
                    order={order}
                    stationFilter={stationFilter}
                    onPrint={(o) => setReceiptOrder(o)}
                    onStatusChange={handleStatusChange}
                    onTriggerFly={handleTriggerFly}
                    onDragStart={(e, o) => {
                      setDraggingOrderId(o.id);
                      e.dataTransfer.setData('text/plain', o.id);
                    }}
                    onDragEnd={() => {
                      setDraggingOrderId(null);
                      setDragOverColumn(null);
                    }}
                    isJustMoved={!!justMovedIds[order.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Ticket Flight Animation Overlay */}
      <FlyingTicketOverlay
        flight={activeFlight}
        onAnimationComplete={handleFlightAnimationComplete}
      />

      {/* Thermal Receipt Modal (z-[70] for clean topmost layer) */}
      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
