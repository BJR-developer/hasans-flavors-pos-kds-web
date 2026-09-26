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
  Clock,
  User,
} from 'lucide-react';
import { useOrders, useTableSessions } from '@/hooks/useRestaurantData';
import { useStaffUsers } from '@/hooks/useStaffData';

type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'custom';

export function AnalyticsOverview() {
  const { data: orders = [] } = useOrders();
  const { data: tables = [] } = useTableSessions();
  const { data: staffList = [] } = useStaffUsers();

  // Helper to format local YYYY-MM-DD string
  const toDateInputString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = useMemo(() => toDateInputString(new Date()), []);

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

  // Filter staff list to cashiers and owners only
  const activeStaffMembers = useMemo(() => {
    return staffList.filter((s) => s.role === 'cashier' || s.role === 'owner');
  }, [staffList]);

  // Quick Preset Handlers
  const handleSelectPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const str = toDateInputString(now);
      setCustomStartDate(str);
      setCustomEndDate(str);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const str = toDateInputString(yest);
      setCustomStartDate(str);
      setCustomEndDate(str);
    } else if (preset === 'last_7_days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setCustomStartDate(toDateInputString(start));
      setCustomEndDate(toDateInputString(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setCustomStartDate(toDateInputString(start));
      setCustomEndDate(toDateInputString(end));
    }
  };

  const selectedStaff = useMemo(() => {
    if (selectedStaffId === 'all') return null;
    return activeStaffMembers.find((s) => s.id === selectedStaffId) || null;
  }, [selectedStaffId, activeStaffMembers]);

  // Filter orders strictly by chosen date range and selected cashier account
  const { filteredOrders, rangeLabel } = useMemo(() => {
    let filtered = orders;

    if (customStartDate && customEndDate) {
      const start = new Date(`${customStartDate}T00:00:00`);
      const end = new Date(`${customEndDate}T23:59:59.999`);
      filtered = filtered.filter((o) => {
        const orderTime = new Date(o.createdAt).getTime();
        return orderTime >= start.getTime() && orderTime <= end.getTime();
      });
    }

    if (selectedStaffId !== 'all') {
      filtered = filtered.filter((o) => {
        if (o.cashierId === selectedStaffId) return true;
        if (selectedStaff) {
          const matchName = o.cashierName && selectedStaff.fullName &&
            o.cashierName.toLowerCase() === selectedStaff.fullName.toLowerCase();
          const matchUsername = o.cashierName && selectedStaff.username &&
            o.cashierName.toLowerCase() === selectedStaff.username.toLowerCase();
          return matchName || matchUsername;
        }
        return false;
      });
    }

    let label = 'Today';
    if (customStartDate && customEndDate) {
      const start = new Date(`${customStartDate}T00:00:00`);
      const end = new Date(`${customEndDate}T23:59:59.999`);
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
      label = customStartDate === customEndDate ? startFormatted : `${startFormatted} – ${endFormatted}`;
    }

    return { filteredOrders: filtered, rangeLabel: label };
  }, [orders, customStartDate, customEndDate, selectedStaffId, selectedStaff]);

  // Aggregate Range Metrics
  const paidOrders = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled'),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [paidOrders]
  );

  const completedCount = useMemo(
    () => filteredOrders.filter((o) => o.status === 'completed').length,
    [filteredOrders]
  );

  const totalOrdersCount = filteredOrders.length;
  const avgTicket = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const activeTablesCount = tables.filter((t) => t.status !== 'available').length;

  // Channel Breakdown
  const dineInOrders = useMemo(
    () => paidOrders.filter((o) => o.type === 'dine_in'),
    [paidOrders]
  );
  const takeoutOrders = useMemo(
    () => paidOrders.filter((o) => o.type === 'takeout'),
    [paidOrders]
  );

  const dineInRevenue = dineInOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const takeoutRevenue = takeoutOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Bar with Quick Navigation to Shifts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1F1F1F] tracking-tight">
            Owner Financial Dashboard
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Real-time sales revenue, verified orders, and cashier account performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/shifts"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Cashier Shifts &amp; Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Simplified Controls: Timeline Selection, Exact Dates & Staff Account Filter */}
      <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Timeline Presets & Exact Dates */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'today', label: 'Today (Default)' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last_7_days', label: 'Last 7 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'custom', label: 'Custom Range' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  datePreset === preset.id
                    ? 'bg-[#1F1F1F] text-white shadow-xs'
                    : 'bg-[#FAFAFA] text-[#525252] hover:bg-[#F5F5F5] border border-[#E5E5E5]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#737373] font-medium bg-[#FAFAFA] px-3 py-1.5 rounded-lg border border-[#E5E5E5]">
            <Calendar className="w-3.5 h-3.5 text-[#BA1A20]" />
            <span>Period: <strong>{rangeLabel}</strong></span>
          </div>
        </div>

        {/* Date Inputs & Cashier Account Filter */}
        <div className="pt-3 border-t border-[#F5F5F5] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Exact Date From / To */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider shrink-0">
              Dates:
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
            <span className="text-[#A3A3A3]">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            />
          </div>

          {/* Staff Account Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-neutral-500" />
              <span>Staff:</span>
            </span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] font-semibold focus:bg-white focus:outline-none focus:border-[#1F1F1F]"
            >
              <option value="all">All Cashier Accounts (Default)</option>
              {activeStaffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName} {staff.username ? `(@${staff.username})` : `(${staff.role})`}
                </option>
              ))}
            </select>
          </div>

          {/* Orders Count Summary */}
          <div className="flex items-center justify-start lg:justify-end text-xs text-[#737373]">
            <span>
              Showing <strong>{filteredOrders.length}</strong> orders {selectedStaff ? `for ${selectedStaff.fullName}` : 'across all staff'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Revenue */}
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

        {/* Total Orders */}
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

        {/* Average Order Value */}
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

        {/* Floor Tables Now */}
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

      {/* 4. Sales Channel Breakdown & Floor Table Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales by Channel */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
            Sales Channel Breakdown ({rangeLabel})
          </h3>

          <div className="space-y-4 text-xs">
            {/* Dine-In */}
            <div>
              <div className="flex items-center justify-between font-semibold text-[#1F1F1F] mb-1.5">
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
              <div className="flex items-center justify-between font-semibold text-[#1F1F1F] mb-1.5">
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
    </div>
  );
}
