'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Receipt,
  Utensils,
  ArrowRight,
  TrendingUp,
  Calendar,
  ShoppingBag,
  Bike,
} from 'lucide-react';
import { useOrders, useTableSessions } from '@/hooks/useRestaurantData';

type DatePreset = 'this_month' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_month' | 'custom';

export function AnalyticsOverview() {
  const { data: orders = [] } = useOrders();
  const { data: tables = [] } = useTableSessions();

  // Helper to get local YYYY-MM-DD string
  const toDateInputString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute Initial "This Month" default dates (e.g. Sept 1 to Sept 30)
  const defaultRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    return {
      start: toDateInputString(start),
      end: toDateInputString(end),
    };
  }, []);

  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>(defaultRange.start);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultRange.end);

  // Quick Preset Handlers
  const handleSelectPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setCustomStartDate(toDateInputString(start));
      setCustomEndDate(toDateInputString(end));
    } else if (preset === 'today') {
      const todayStr = toDateInputString(now);
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = toDateInputString(yest);
      setCustomStartDate(yestStr);
      setCustomEndDate(yestStr);
    } else if (preset === 'last_7_days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setCustomStartDate(toDateInputString(start));
      setCustomEndDate(toDateInputString(now));
    } else if (preset === 'last_30_days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      setCustomStartDate(toDateInputString(start));
      setCustomEndDate(toDateInputString(now));
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setCustomStartDate(toDateInputString(start));
      setCustomEndDate(toDateInputString(end));
    }
  };

  // Filter orders strictly by the chosen date range
  const { filteredOrders, rangeLabel } = useMemo(() => {
    if (!customStartDate || !customEndDate) {
      return { filteredOrders: orders, rangeLabel: 'All Time' };
    }

    const start = new Date(`${customStartDate}T00:00:00`);
    const end = new Date(`${customEndDate}T23:59:59.999`);

    const filtered = orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      return orderTime >= start.getTime() && orderTime <= end.getTime();
    });

    const startFormatted = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endFormatted = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const label =
      customStartDate === customEndDate
        ? startFormatted
        : `${startFormatted} – ${endFormatted}`;

    return { filteredOrders: filtered, rangeLabel: label };
  }, [orders, customStartDate, customEndDate]);

  // Aggregate Range Metrics
  const paidOrders = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled'),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + o.total, 0),
    [paidOrders]
  );

  const totalOrdersCount = filteredOrders.length;
  const completedCount = filteredOrders.filter((o) => o.status === 'completed').length;
  const avgTicket = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const activeTablesCount = tables.filter((t) => t.status !== 'available').length;

  // Channel breakdown
  const dineInOrders = filteredOrders.filter((o) => o.type === 'dine_in');
  const deliveryOrders = filteredOrders.filter((o) => o.type === 'delivery');
  const takeoutOrders = filteredOrders.filter((o) => o.type === 'takeout');

  const dineInRevenue = dineInOrders.reduce((sum, o) => sum + o.total, 0);
  const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
  const takeoutRevenue = takeoutOrders.reduce((sum, o) => sum + o.total, 0);

  // Payment Breakdown
  const cashCount = filteredOrders.filter((o) => o.paymentMethod === 'cash').length;
  const gcashCount = filteredOrders.filter((o) => o.paymentMethod === 'gcash').length;
  const cardCount = filteredOrders.filter((o) => o.paymentMethod === 'card').length;

  // Top Selling Items in Range
  const topSellingItems = useMemo(() => {
    const itemMap: Record<string, { name: string; sold: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      if (o.status === 'cancelled') return;
      o.items.forEach((item) => {
        const key = item.dish.name;
        if (!itemMap[key]) {
          itemMap[key] = { name: key, sold: 0, revenue: 0 };
        }
        itemMap[key].sold += item.quantity;
        itemMap[key].revenue += item.totalPrice;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6);
  }, [filteredOrders]);

  // Day by Day Revenue Breakdown for the Range
  const dailyBreakdown = useMemo(() => {
    const dayMap: Record<string, { dateStr: string; label: string; revenue: number; ordersCount: number }> = {};

    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });

      if (!dayMap[key]) {
        dayMap[key] = { dateStr: key, label, revenue: 0, ordersCount: 0 };
      }
      dayMap[key].revenue += o.total;
      dayMap[key].ordersCount += 1;
    });

    return Object.values(dayMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [paidOrders]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
      {/* 1. Header with Title & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1F1F1F]">Owner Operations Overview</h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Default view calculates full month-to-month range • Custom date filterable
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-xs font-semibold text-[#525252] hover:text-[#1F1F1F] hover:bg-[#F5F5F5] transition-colors"
          >
            <span>Orders Table</span>
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

      {/* 2. Date Range Filter Controls Bar */}
      <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] space-y-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'this_month', label: 'This Month (Default)' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last_7_days', label: 'Last 7 Days' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((preset) => {
              const isSelected = datePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id as DatePreset)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#1F1F1F] text-white shadow-xs'
                      : 'bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5] hover:text-[#1F1F1F] border border-[#E5E5E5]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Active Range Display Badge */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#525252] bg-[#FAFAFA] px-3 py-1.5 rounded-lg border border-[#E5E5E5] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#BA1A20]" />
            <span>Range:</span>
            <span className="font-bold text-[#1F1F1F]">{rangeLabel}</span>
          </div>
        </div>

        {/* Custom Date Pickers (Visible when custom range or for fine-tuning) */}
        <div className="pt-2 border-t border-[#F5F5F5] flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
            Select Exact Dates:
          </span>

          <div className="flex items-center gap-2">
            <label className="text-[#525252] text-[11px] font-medium">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2.5 py-1 text-xs rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[#525252] text-[11px] font-medium">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2.5 py-1 text-xs rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          <span className="text-[11px] text-[#A3A3A3] ml-auto">
            {filteredOrders.length} orders found in this period
          </span>
        </div>
      </div>

      {/* 3. Primary KPI Cards for Selected Date Range */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Revenue in Range */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-[#BA1A20]" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            ₱{totalRevenue.toLocaleString()}
          </h3>
          <p className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{paidOrders.length} paid receipts</span>
          </p>
        </div>

        {/* Total Orders Logged in Range */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Total Orders</span>
            <Receipt className="w-4 h-4 text-[#B45309]" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            {totalOrdersCount}
          </h3>
          <p className="text-[11px] text-[#737373]">
            {completedCount} fulfilled orders
          </p>
        </div>

        {/* Average Order Value in Range */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Average Order Value</span>
            <span className="text-xs font-bold text-[#737373]">₱</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            ₱{avgTicket.toLocaleString()}
          </h3>
          <p className="text-[11px] text-[#737373]">Per guest transaction</p>
        </div>

        {/* Live Tables Status */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Floor Tables Now</span>
            <Utensils className="w-4 h-4 text-[#525252]" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
            {activeTablesCount} / {tables.length}
          </h3>
          <p className="text-[11px] text-[#737373]">
            {tables.filter((t) => t.status === 'available').length} free right now
          </p>
        </div>
      </div>

      {/* 4. Sales by Channel & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales by Channel */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
            Sales Channel Breakdown ({rangeLabel})
          </h3>

          <div className="space-y-3 text-xs">
            {/* Dine-In */}
            <div>
              <div className="flex items-center justify-between font-semibold text-[#1F1F1F] mb-1">
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#BA1A20]" /> Dine-In ({dineInOrders.length})
                </span>
                <span className="font-bold">₱{dineInRevenue.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#BA1A20] rounded-full transition-all"
                  style={{
                    width: `${totalRevenue > 0 ? Math.round((dineInRevenue / totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Takeout */}
            <div>
              <div className="flex items-center justify-between font-semibold text-[#1F1F1F] mb-1">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#B45309]" /> Takeout ({takeoutOrders.length})
                </span>
                <span className="font-bold">₱{takeoutRevenue.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B45309] rounded-full transition-all"
                  style={{
                    width: `${totalRevenue > 0 ? Math.round((takeoutRevenue / totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <div className="flex items-center justify-between font-semibold text-[#1F1F1F] mb-1">
                <span className="flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-[#2E7D32]" /> Delivery ({deliveryOrders.length})
                </span>
                <span className="font-bold">₱{deliveryRevenue.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2E7D32] rounded-full transition-all"
                  style={{
                    width: `${totalRevenue > 0 ? Math.round((deliveryRevenue / totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
            Tender Share ({rangeLabel})
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-center">
              <span className="text-[10px] font-bold text-[#737373] uppercase">Cash</span>
              <p className="text-lg font-black text-[#1F1F1F] mt-1">{cashCount}</p>
              <p className="text-[10px] text-[#737373]">
                {totalOrdersCount > 0 ? Math.round((cashCount / totalOrdersCount) * 100) : 0}% share
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-center">
              <span className="text-[10px] font-bold text-[#737373] uppercase">GCash</span>
              <p className="text-lg font-black text-[#1565C0] mt-1">{gcashCount}</p>
              <p className="text-[10px] text-[#737373]">
                {totalOrdersCount > 0 ? Math.round((gcashCount / totalOrdersCount) * 100) : 0}% share
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-center">
              <span className="text-[10px] font-bold text-[#737373] uppercase">Card</span>
              <p className="text-lg font-black text-[#5B403D] mt-1">{cardCount}</p>
              <p className="text-[10px] text-[#737373]">
                {totalOrdersCount > 0 ? Math.round((cardCount / totalOrdersCount) * 100) : 0}% share
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F5F5F5] text-xs text-[#525252]">
            <p className="text-[11px] text-[#737373]">
              All POS transactions reflect verified register totals.
            </p>
          </div>
        </div>

        {/* Live Dining Room Table Map */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
              Dining Floor Table Map
            </h3>
            <span className="text-[10px] text-[#2E7D32] font-bold">
              {tables.filter((t) => t.status === 'available').length} Available
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {tables.map((t) => (
              <div
                key={t.tableNumber}
                className={`p-2 rounded-lg border text-center transition-all ${
                  t.status === 'occupied'
                    ? 'bg-[#FFF2F0] border-[#FFDAD6] text-[#BA1A20]'
                    : t.status === 'billing'
                    ? 'bg-[#FFF8E1] border-[#FFE082] text-[#B45309]'
                    : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#525252]'
                }`}
              >
                <p className="text-[11px] font-extrabold leading-tight">
                  {t.tableNumber.replace('Table ', 'T')}
                </p>
                <p className="text-[9px] font-bold capitalize mt-0.5">
                  {t.status === 'available' ? 'Free' : t.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Daily Revenue Breakdown List for Selected Month / Range */}
      {dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
              Daily Revenue Timeline in Selected Period
            </h3>
            <span className="text-[11px] text-[#737373] font-medium">
              {dailyBreakdown.length} active sales days
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {dailyBreakdown.map((day) => (
              <div
                key={day.dateStr}
                className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] space-y-1"
              >
                <span className="text-[10px] font-bold text-[#737373] uppercase block truncate">
                  {day.label}
                </span>
                <span className="text-sm font-black text-[#1F1F1F] block">
                  ₱{day.revenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#737373] block">
                  {day.ordersCount} orders
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Top Selling Dishes in Selected Range */}
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
            Top Selling Dishes in Selected Range
          </h3>
          <span className="text-xs text-[#737373]">
            {topSellingItems.length} top performing dishes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[11px] text-[#737373] font-bold">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Dish</th>
                <th className="py-2.5 px-3">Plates Sold</th>
                <th className="py-2.5 px-3 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {topSellingItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#A3A3A3]">
                    No dishes sold in this date range.
                  </td>
                </tr>
              ) : (
                topSellingItems.map((item, index) => (
                  <tr key={item.name} className="hover:bg-[#FAFAFA] transition-colors">
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
  );
}
