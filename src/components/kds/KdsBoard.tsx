'use client';

import React, { useState } from 'react';
import {
  Columns3,
  LayoutGrid,
} from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { KdsTicketCard } from './KdsTicketCard';

export function KdsBoard() {
  const { data: orders = [] } = useOrders();

  const [stationFilter, setStationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns');

  // Active tickets
  const pendingOrders = orders
    .filter((o) => o.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const preparingOrders = orders
    .filter((o) => o.status === 'preparing')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const readyOrders = orders
    .filter((o) => o.status === 'ready')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const completedOrders = orders
    .filter((o) => o.status === 'completed')
    .slice(0, 6);

  const allActiveOrders = [...pendingOrders, ...preparingOrders, ...readyOrders];

  const stations = [
    { id: 'all', label: 'All Stations' },
    { id: 'tandoor', label: 'Tandoor & Grill' },
    { id: 'biryani_curry', label: 'Biryani & Curries' },
    { id: 'sides_drinks', label: 'Sides & Drinks' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-[#FAFAFA]">
      {/* Minimal Top Control Bar */}
      <div className="px-5 py-2.5 bg-white border-b border-[#E5E5E5] flex items-center justify-between gap-4 shrink-0">
        {/* Stations Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {stations.map((st) => {
            const isSelected = stationFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#1F1F1F] text-white'
                    : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg">
          <button
            onClick={() => setViewMode('columns')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === 'columns'
                ? 'bg-white text-[#1F1F1F] shadow-xs'
                : 'text-[#737373] hover:text-[#1F1F1F]'
            }`}
            title="Columns view"
          >
            <Columns3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-[#1F1F1F] shadow-xs'
                : 'text-[#737373] hover:text-[#1F1F1F]'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-5">
        {viewMode === 'columns' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full min-w-[960px]">
            {/* 1. Received */}
            <div className="flex flex-col bg-[#F5F5F5] rounded-xl p-3 overflow-hidden border border-[#E5E5E5]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E5]">
                <span className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Received ({pendingOrders.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-[#A3A3A3] text-center py-8">Queue empty</p>
                ) : (
                  pendingOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 2. Cooking */}
            <div className="flex flex-col bg-[#F5F5F5] rounded-xl p-3 overflow-hidden border border-[#E5E5E5]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E5]">
                <span className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Cooking ({preparingOrders.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {preparingOrders.length === 0 ? (
                  <p className="text-xs text-[#A3A3A3] text-center py-8">No active items</p>
                ) : (
                  preparingOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 3. Ready */}
            <div className="flex flex-col bg-[#F5F5F5] rounded-xl p-3 overflow-hidden border border-[#E5E5E5]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E5]">
                <span className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wide">
                  Ready ({readyOrders.length})
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {readyOrders.length === 0 ? (
                  <p className="text-xs text-[#A3A3A3] text-center py-8">No orders ready</p>
                ) : (
                  readyOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 4. Completed */}
            <div className="flex flex-col bg-[#F5F5F5] rounded-xl p-3 overflow-hidden border border-[#E5E5E5]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E5]">
                <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">
                  Served
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {completedOrders.length === 0 ? (
                  <p className="text-xs text-[#A3A3A3] text-center py-8">No recent orders</p>
                ) : (
                  completedOrders.map((order) => (
                    <KdsTicketCard
                      key={order.id}
                      order={order}
                      stationFilter={stationFilter}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto h-full">
            {allActiveOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-[#737373]">
                <p className="text-xs font-semibold text-[#1F1F1F]">No active kitchen orders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allActiveOrders.map((order) => (
                  <KdsTicketCard
                    key={order.id}
                    order={order}
                    stationFilter={stationFilter}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
