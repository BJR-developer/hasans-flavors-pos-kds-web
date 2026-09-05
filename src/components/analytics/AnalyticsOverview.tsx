'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Receipt,
  Utensils,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useOrders, useDailyStats, useTableSessions } from '@/hooks/useRestaurantData';

export function AnalyticsOverview() {
  const { data: orders = [] } = useOrders();
  const { data: stats } = useDailyStats();
  const { data: tables = [] } = useTableSessions();

  const totalRevenue = stats?.todayRevenue || 0;
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
  const activeTablesCount = tables.filter((t) => t.status !== 'available').length;

  // Channel breakdown
  const dineInOrders = orders.filter((o) => o.type === 'dine_in');
  const deliveryOrders = orders.filter((o) => o.type === 'delivery');
  const takeoutOrders = orders.filter((o) => o.type === 'takeout');

  const dineInRevenue = dineInOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
  const takeoutRevenue = takeoutOrders.reduce((sum, o) => sum + o.total, 0);

  const topItems = stats?.topSellingItems || [];

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1F1F1F]">Owner Daily Overview</h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Key operational metrics and revenue breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-[#525252] hover:text-[#1F1F1F] hover:bg-[#F5F5F5] transition-colors"
          >
            <span>All Orders</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link
            href="/pos"
            className="px-3.5 py-1.5 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-colors shadow-xs"
          >
            Open POS
          </Link>
        </div>
      </div>

      {/* 4 Simple KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Gross Revenue */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Today&apos;s Revenue</span>
            <DollarSign className="w-4 h-4 text-[#BA1A20]" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            ₱{totalRevenue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Paid receipts</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Total Orders</span>
            <Receipt className="w-4 h-4 text-[#B45309]" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            {orderCount}
          </h3>
          <p className="text-[11px] text-[#737373]">
            {orders.filter((o) => o.status === 'completed').length} completed
          </p>
        </div>

        {/* Average Ticket */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Avg. Order Value</span>
            <span className="text-xs font-bold text-[#737373]">₱</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            ₱{avgTicket.toLocaleString()}
          </h3>
          <p className="text-[11px] text-[#737373]">Per transaction</p>
        </div>

        {/* Active Tables */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Floor Tables</span>
            <Utensils className="w-4 h-4 text-[#525252]" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            {activeTablesCount} / {tables.length}
          </h3>
          <p className="text-[11px] text-[#737373]">
            {tables.filter((t) => t.status === 'available').length} tables available
          </p>
        </div>
      </div>

      {/* Channel Sales Summary & Top Dishes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales by Channel Card */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-4">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
            Sales by Channel
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5]">
              <span className="font-semibold text-[#1F1F1F]">Dine-In ({dineInOrders.length})</span>
              <span className="font-black text-[#1F1F1F]">₱{dineInRevenue.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5]">
              <span className="font-semibold text-[#1F1F1F]">Takeout ({takeoutOrders.length})</span>
              <span className="font-black text-[#1F1F1F]">₱{takeoutRevenue.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5]">
              <span className="font-semibold text-[#1F1F1F]">Delivery ({deliveryOrders.length})</span>
              <span className="font-black text-[#1F1F1F]">₱{deliveryRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Top Selling Dishes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
            Top Selling Dishes Today
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[11px] text-[#737373] font-bold">
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Dish</th>
                  <th className="py-2 px-3">Sold</th>
                  <th className="py-2 px-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#A3A3A3]">
                      No orders logged yet today.
                    </td>
                  </tr>
                ) : (
                  topItems.map((item, index) => (
                    <tr key={item.name} className="hover:bg-[#FAFAFA]">
                      <td className="py-2.5 px-3 font-semibold text-[#737373]">#{index + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-[#1F1F1F]">{item.name}</td>
                      <td className="py-2.5 px-3 text-[#525252]">{item.sold} plates</td>
                      <td className="py-2.5 px-3 text-right font-black text-[#BA1A20]">
                        ₱{item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
