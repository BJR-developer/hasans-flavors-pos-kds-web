'use client';

import React, { useState } from 'react';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Volume2,
  Maximize2,
  Minimize2,
  Columns3,
  LayoutGrid,
} from 'lucide-react';
import { useOrders } from '@/hooks/useRestaurantData';
import { KdsTicketCard } from './KdsTicketCard';
import { playOrderChime } from '@/lib/audio';

export function KdsBoard() {
  const { data: orders = [] } = useOrders();

  // Controls
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active tickets (Pending, Preparing, Ready)
  const pendingOrders = orders
    .filter((o) => o.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const preparingOrders = orders
    .filter((o) => o.status === 'preparing')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const readyOrders = orders
    .filter((o) => o.status === 'ready')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const completedOrders = orders
    .filter((o) => o.status === 'completed')
    .slice(0, 6);

  const allActiveOrders = [...pendingOrders, ...preparingOrders, ...readyOrders];

  // Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const stations = [
    { id: 'all', label: 'All Kitchen Stations' },
    { id: 'tandoor', label: '🔥 Tandoor & Grill' },
    { id: 'biryani_curry', label: '🍚 Biryani & Curries' },
    { id: 'sides_drinks', label: '🥤 Sides, Snacks & Drinks' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#FAF9F8]">
      {/* Top Kitchen Ops Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-[#E9E8E7] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        {/* Left: Summary Metrics */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#BA1A20]" />
            <h2 className="text-sm font-extrabold text-[#2D2926] tracking-tight">
              Kitchen Display System (KDS)
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-[#FFDAD6] text-[#BA1A20] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#BA1A20] animate-pulse" />
              <span>{pendingOrders.length} Received</span>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-[#FFF8E1] text-[#B45309] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>{preparingOrders.length} In Kitchen</span>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-[#E8F5E9] text-[#2E7D32] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{readyOrders.length} Ready</span>
            </span>
          </div>
        </div>

        {/* Center: Station Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F4F3F2] rounded-xl border border-[#E9E8E7]">
          {stations.map((st) => {
            const isSelected = stationFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-white text-[#BA1A20] shadow-xs'
                    : 'text-[#5B403D] hover:text-[#2D2926]'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: View Switcher, Audio Test, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Test Kitchen Chime */}
          <button
            type="button"
            onClick={playOrderChime}
            title="Test Kitchen Audio Chime"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] text-xs font-bold text-[#5B403D] transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#B45309]" />
            <span className="hidden md:inline">Test Chime</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#F4F3F2] p-1 rounded-xl border border-[#E9E8E7]">
            <button
              onClick={() => setViewMode('columns')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'columns'
                  ? 'bg-white text-[#BA1A20] shadow-xs'
                  : 'text-[#8F6F6C] hover:text-[#2D2926]'
              }`}
              title="Column Stages View"
            >
              <Columns3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#BA1A20] shadow-xs'
                  : 'text-[#8F6F6C] hover:text-[#2D2926]'
              }`}
              title="Ticket Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Mode */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Kitchen Mode"
            className="p-2 rounded-xl border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] text-[#8F6F6C] hover:text-[#2D2926] transition-all"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main KDS Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 lg:p-6">
        {viewMode === 'columns' ? (
          /* Column Stages View */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full min-w-[1050px]">
            {/* 1. Received / Pending Column */}
            <div className="flex flex-col bg-[#F4F3F2] rounded-2xl border border-[#E9E8E7] p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E8E7]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#BA1A20]" />
                  <span className="text-xs font-black uppercase text-[#2D2926] tracking-wider">
                    Received Tickets
                  </span>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white text-[#BA1A20] border border-[#E9E8E7]">
                  {pendingOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {pendingOrders.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-[#8F6F6C] p-4">
                    <p className="text-xs font-bold">No tickets waiting</p>
                    <p className="text-[11px] mt-1 text-[#8F6F6C]">
                      New orders from POS and Dine-In QR will pop up here.
                    </p>
                  </div>
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

            {/* 2. In Kitchen / Cooking Column */}
            <div className="flex flex-col bg-[#F4F3F2] rounded-2xl border border-[#E9E8E7] p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E8E7]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#B45309]" />
                  <span className="text-xs font-black uppercase text-[#2D2926] tracking-wider">
                    Cooking Now
                  </span>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white text-[#B45309] border border-[#E9E8E7]">
                  {preparingOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {preparingOrders.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-[#8F6F6C] p-4">
                    <p className="text-xs font-bold">Kitchen idle</p>
                    <p className="text-[11px] mt-1 text-[#8F6F6C]">
                      Tap &ldquo;Start Cooking&rdquo; on received tickets.
                    </p>
                  </div>
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

            {/* 3. Ready for Service Column */}
            <div className="flex flex-col bg-[#F4F3F2] rounded-2xl border border-[#E9E8E7] p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E8E7]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2E7D32]" />
                  <span className="text-xs font-black uppercase text-[#2D2926] tracking-wider">
                    Ready for Serving
                  </span>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white text-[#2E7D32] border border-[#E9E8E7]">
                  {readyOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {readyOrders.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-[#8F6F6C] p-4">
                    <p className="text-xs font-bold">No orders waiting pickup</p>
                    <p className="text-[11px] mt-1 text-[#8F6F6C]">
                      Completed dishes ready to be served to tables or riders.
                    </p>
                  </div>
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

            {/* 4. Completed History Summary Column */}
            <div className="flex flex-col bg-[#F4F3F2] rounded-2xl border border-[#E9E8E7] p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E8E7]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#5B403D]" />
                  <span className="text-xs font-black uppercase text-[#2D2926] tracking-wider">
                    Recently Served
                  </span>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white text-[#5B403D] border border-[#E9E8E7]">
                  {completedOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {completedOrders.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-[#8F6F6C] p-4">
                    <p className="text-xs font-bold">No completed orders</p>
                  </div>
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
          /* Ticket Grid View */
          <div className="overflow-y-auto h-full pr-2">
            {allActiveOrders.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center text-[#8F6F6C]">
                <CheckCircle2 className="w-12 h-12 stroke-1 text-[#2E7D32] mb-3" />
                <h3 className="font-extrabold text-base text-[#2D2926]">Kitchen Queue Clear</h3>
                <p className="text-xs text-[#8F6F6C] mt-1">
                  All incoming kitchen orders have been prepared and served.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
