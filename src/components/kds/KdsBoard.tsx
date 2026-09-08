'use client';

import React, { useState, useMemo } from 'react';
import {
  Columns3,
  LayoutGrid,
  Search,
  X,
  Clock,
} from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { KdsTicketCard } from './KdsTicketCard';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';
import { Order } from '@/types';

export function KdsBoard() {
  const { data: orders = [] } = useOrders();

  const [stationFilter, setStationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

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
            {/* 1. Received */}
            <div className="flex flex-col bg-neutral-200/60 rounded-xl p-3 overflow-hidden border border-neutral-300/70">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Received ({pendingOrders.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">Queue empty</p>
                ) : (
                  pendingOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                      onPrint={(o) => setReceiptOrder(o)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 2. Cooking */}
            <div className="flex flex-col bg-neutral-200/60 rounded-xl p-3 overflow-hidden border border-neutral-300/70">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Cooking ({preparingOrders.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {preparingOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">No items cooking</p>
                ) : (
                  preparingOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                      onPrint={(o) => setReceiptOrder(o)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 3. Ready */}
            <div className="flex flex-col bg-neutral-200/60 rounded-xl p-3 overflow-hidden border border-neutral-300/70">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Ready ({readyOrders.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {readyOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">No orders ready</p>
                ) : (
                  readyOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                      onPrint={(o) => setReceiptOrder(o)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 4. Served */}
            <div className="flex flex-col bg-neutral-200/60 rounded-xl p-3 overflow-hidden border border-neutral-300/70">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300/70">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Served ({servedOrders.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {servedOrders.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8 font-medium">No served orders</p>
                ) : (
                  servedOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                      onPrint={(o) => setReceiptOrder(o)}
                    />
                  ))
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
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
