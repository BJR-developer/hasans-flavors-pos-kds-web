'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  DollarSign,
  Receipt,
  Utensils,
  TrendingUp,
  ShoppingBag,
  Bike,
  CheckCircle2,
  ArrowRight,
  Sparkles,
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

  // Breakdown by channel
  const dineInOrders = orders.filter((o) => o.type === 'dine_in');
  const deliveryOrders = orders.filter((o) => o.type === 'delivery');
  const takeoutOrders = orders.filter((o) => o.type === 'takeout');

  const dineInRevenue = dineInOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
  const takeoutRevenue = takeoutOrders.reduce((sum, o) => sum + o.total, 0);

  // Payment Breakdown
  const cashCount = orders.filter((o) => o.paymentMethod === 'cash').length;
  const gcashCount = orders.filter((o) => o.paymentMethod === 'gcash').length;
  const cardCount = orders.filter((o) => o.paymentMethod === 'card').length;

  const topItems = stats?.topSellingItems || [];

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8 max-w-[1720px] mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#BA1A20]" />
            <h1 className="text-xl font-extrabold text-[#2D2926] tracking-tight">
              Owner Overview &amp; Operational Analytics
            </h1>
          </div>
          <p className="text-xs text-[#8F6F6C] font-medium mt-0.5">
            Real-time sales velocity, kitchen throughput, and dining floor overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E9E8E7] hover:bg-[#F4F3F2] text-xs font-bold text-[#5B403D] transition-all shadow-xs"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-xs font-bold text-white transition-all shadow-xs"
          >
            <span>Open POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Gross Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-[#E9E8E7] stitch-shadow flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F6F6C]">
              Today&apos;s Gross Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF2F0] text-[#BA1A20] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#2D2926] tracking-tight">
              ₱{totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Paid &amp; verified receipts</span>
            </p>
          </div>
        </div>

        {/* 2. Total Orders Completed */}
        <div className="p-5 bg-white rounded-2xl border border-[#E9E8E7] stitch-shadow flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F6F6C]">
              Total Orders Logged
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF8E1] text-[#B45309] flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#2D2926] tracking-tight">
              {orderCount} Tickets
            </h3>
            <p className="text-[11px] text-[#8F6F6C] mt-1 font-medium">
              {orders.filter((o) => o.status === 'completed').length} fulfilled,{' '}
              {orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length} in progress
            </p>
          </div>
        </div>

        {/* 3. Average Order Value */}
        <div className="p-5 bg-white rounded-2xl border border-[#E9E8E7] stitch-shadow flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F6F6C]">
              Average Ticket Size
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#2D2926] tracking-tight">
              ₱{avgTicket.toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#8F6F6C] mt-1 font-medium">
              Per dining party / transaction
            </p>
          </div>
        </div>

        {/* 4. Active Floor Capacity */}
        <div className="p-5 bg-white rounded-2xl border border-[#E9E8E7] stitch-shadow flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F6F6C]">
              Dine-In Floor Occupancy
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F4F3F2] text-[#5B403D] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#2D2926] tracking-tight">
              {activeTablesCount} / {tables.length} Tables
            </h3>
            <p className="text-[11px] text-[#8F6F6C] mt-1 font-medium">
              {Math.round((activeTablesCount / Math.max(1, tables.length)) * 100)}% floor capacity
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: Channel Split & Payment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Channel Volume Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E9E8E7] p-5 stitch-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#2D2926] uppercase tracking-wider">
              Sales Channel Breakdown
            </h3>
            <span className="text-[10px] text-[#8F6F6C] font-semibold">Today</span>
          </div>

          <div className="space-y-3">
            {/* Dine-In */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-[#5B403D]">
                  <Utensils className="w-3.5 h-3.5 text-[#BA1A20]" /> Dine-In Guests
                </span>
                <span className="text-[#2D2926]">
                  ₱{dineInRevenue.toLocaleString()} ({dineInOrders.length} orders)
                </span>
              </div>
              <div className="w-full h-2 bg-[#F4F3F2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#BA1A20] rounded-full"
                  style={{
                    width: `${
                      totalRevenue > 0 ? Math.round((dineInRevenue / totalRevenue) * 100) : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Takeout */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-[#5B403D]">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#B45309]" /> Takeout Counter
                </span>
                <span className="text-[#2D2926]">
                  ₱{takeoutRevenue.toLocaleString()} ({takeoutOrders.length} orders)
                </span>
              </div>
              <div className="w-full h-2 bg-[#F4F3F2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B45309] rounded-full"
                  style={{
                    width: `${
                      totalRevenue > 0 ? Math.round((takeoutRevenue / totalRevenue) * 100) : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-[#5B403D]">
                  <Bike className="w-3.5 h-3.5 text-[#2E7D32]" /> Online Delivery
                </span>
                <span className="text-[#2D2926]">
                  ₱{deliveryRevenue.toLocaleString()} ({deliveryOrders.length} orders)
                </span>
              </div>
              <div className="w-full h-2 bg-[#F4F3F2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2E7D32] rounded-full"
                  style={{
                    width: `${
                      totalRevenue > 0 ? Math.round((deliveryRevenue / totalRevenue) * 100) : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E9E8E7] p-5 stitch-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#2D2926] uppercase tracking-wider">
              Payment Method Share
            </h3>
            <span className="text-[10px] text-[#8F6F6C] font-semibold">Tender Types</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E9E8E7] text-center">
              <span className="text-[10px] font-bold text-[#8F6F6C] uppercase">Cash</span>
              <p className="text-lg font-black text-[#2E7D32] mt-1">{cashCount}</p>
              <p className="text-[10px] text-[#8F6F6C]">
                {orderCount > 0 ? Math.round((cashCount / orderCount) * 100) : 0}% share
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E9E8E7] text-center">
              <span className="text-[10px] font-bold text-[#8F6F6C] uppercase">GCash</span>
              <p className="text-lg font-black text-[#1565C0] mt-1">{gcashCount}</p>
              <p className="text-[10px] text-[#8F6F6C]">
                {orderCount > 0 ? Math.round((gcashCount / orderCount) * 100) : 0}% share
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E9E8E7] text-center">
              <span className="text-[10px] font-bold text-[#8F6F6C] uppercase">Card</span>
              <p className="text-lg font-black text-[#5B403D] mt-1">{cardCount}</p>
              <p className="text-[10px] text-[#8F6F6C]">
                {orderCount > 0 ? Math.round((cardCount / orderCount) * 100) : 0}% share
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F1F0F0] text-xs text-[#5B403D]">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Daily cash register drawer balanced.</span>
            </p>
          </div>
        </div>

        {/* Floor Table Map Quick Glance */}
        <div className="bg-white rounded-2xl border border-[#E9E8E7] p-5 stitch-shadow space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#2D2926] uppercase tracking-wider">
              Dining Tables Live Status
            </h3>
            <span className="text-[10px] text-[#2E7D32] font-bold">
              {tables.filter((t) => t.status === 'available').length} Free
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {tables.map((t) => (
              <div
                key={t.tableNumber}
                className={`p-2 rounded-xl border text-center transition-all ${
                  t.status === 'occupied'
                    ? 'bg-[#FFF2F0] border-[#FFDAD6] text-[#BA1A20]'
                    : t.status === 'billing'
                    ? 'bg-[#FFF8E1] border-[#FFE082] text-[#B45309]'
                    : 'bg-[#FAF9F8] border-[#E9E8E7] text-[#5B403D]'
                }`}
              >
                <p className="text-[11px] font-extrabold leading-tight">
                  {t.tableNumber.replace('Table ', 'T-')}
                </p>
                <p className="text-[9px] font-bold capitalize mt-0.5">
                  {t.status === 'available' ? 'Free' : t.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Top Selling Dishes Table */}
      <div className="bg-white rounded-2xl border border-[#E9E8E7] p-5 stitch-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-[#2D2926] uppercase tracking-wider">
            Top Selling Dishes (Revenue &amp; Velocity)
          </h3>
          <span className="text-xs text-[#8F6F6C] font-semibold">Today&apos;s Favorites</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E9E8E7] text-[10px] font-extrabold uppercase text-[#8F6F6C]">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Dish Name</th>
                <th className="py-2.5 px-3">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Gross Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F0F0]">
              {topItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#8F6F6C]">
                    No sales data logged yet today.
                  </td>
                </tr>
              ) : (
                topItems.map((item, index) => (
                  <tr key={item.name} className="hover:bg-[#FAF9F8] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#8F6F6C]">#{index + 1}</td>
                    <td className="py-3 px-3 font-bold text-[#2D2926]">{item.name}</td>
                    <td className="py-3 px-3 font-semibold text-[#5B403D]">{item.sold} plates</td>
                    <td className="py-3 px-3 text-right font-black text-[#BA1A20]">
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
  );
}
