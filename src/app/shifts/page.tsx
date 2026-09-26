'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  DollarSign,
  Receipt,
  ShoppingBag,
  User,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useOrders } from '@/hooks/useRestaurantData';
import { useStaffUsers } from '@/hooks/useStaffData';
import { SessionOrdersTable } from '@/components/shifts/SessionOrdersTable';

type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'custom';

export default function ShiftsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: staffList = [] } = useStaffUsers();

  // Redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  // Helper for local YYYY-MM-DD string
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
  const [searchQuery, setSearchQuery] = useState('');

  const isOwner = user?.role === 'owner';
  const isCashier = user?.role === 'cashier';

  // Handle Preset Selection
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
    }
  };

  // Filter staff list to cashiers & managers
  const cashierStaff = useMemo(() => {
    return staffList.filter((s) => s.role === 'cashier' || s.role === 'owner');
  }, [staffList]);

  // Filter orders by date range and cashier attribution
  const { filteredOrders, rangeLabel } = useMemo(() => {
    let filtered = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'draft');

    // 1. Date Range Filter
    if (customStartDate && customEndDate) {
      const start = new Date(`${customStartDate}T00:00:00`).getTime();
      const end = new Date(`${customEndDate}T23:59:59.999`).getTime();
      filtered = filtered.filter((o) => {
        const orderTs = new Date(o.createdAt).getTime();
        return orderTs >= start && orderTs <= end;
      });
    }

    // 2. Staff Attribution
    if (isCashier && user) {
      filtered = filtered.filter((o) => {
        if (o.cashierId && o.cashierId === user.id) return true;
        if (o.cashierName && user.name && o.cashierName.toLowerCase() === user.name.toLowerCase()) return true;
        return false;
      });
    } else if (isOwner && selectedStaffId !== 'all') {
      const selectedStaffObj = cashierStaff.find((s) => s.id === selectedStaffId);
      filtered = filtered.filter((o) => {
        if (o.cashierId && o.cashierId === selectedStaffId) return true;
        if (selectedStaffObj && o.cashierName) {
          const matchName = o.cashierName.toLowerCase() === selectedStaffObj.fullName.toLowerCase();
          const matchUsername =
            selectedStaffObj.username &&
            o.cashierName.toLowerCase() === selectedStaffObj.username.toLowerCase();
          return matchName || matchUsername;
        }
        return false;
      });
    }

    // 3. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((o) => {
        const matchesNum = (o.orderNumber || '').toLowerCase().includes(q);
        const matchesCust = (o.customerName || '').toLowerCase().includes(q);
        const matchesType = (o.type || '').toLowerCase().includes(q);
        return matchesNum || matchesCust || matchesType;
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
  }, [orders, customStartDate, customEndDate, isCashier, isOwner, user, selectedStaffId, cashierStaff, searchQuery]);

  // Aggregate Metrics
  const totalRevenue = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [filteredOrders]
  );

  const totalItemsSold = useMemo(
    () =>
      filteredOrders.reduce((sum, o) => {
        const orderItemQty = (o.items || []).reduce((q, it) => q + (it.quantity || 1), 0);
        return sum + orderItemQty;
      }, 0),
    [filteredOrders]
  );

  const cashSales = useMemo(
    () =>
      filteredOrders
        .filter((o) => (o.paymentMethod || '').toLowerCase() === 'cash')
        .reduce((sum, o) => sum + (o.total || 0), 0),
    [filteredOrders]
  );

  const cardSales = useMemo(
    () =>
      filteredOrders
        .filter((o) => (o.paymentMethod || '').toLowerCase() === 'card')
        .reduce((sum, o) => sum + (o.total || 0), 0),
    [filteredOrders]
  );

  if (authLoading || ordersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
        <div className="w-6 h-6 border-2 border-[#BA1A20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
      <div className="max-w-[1720px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                {isOwner ? 'Staff Sessions & Orders' : 'My Session'}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {isOwner
                ? 'Review cashier order fulfillment and sales performance'
                : `Orders and sales automatically recorded under your account (${user.name || user.email})`}
            </p>
          </div>
        </div>

        {/* Date Filter & Staff Selection Bar */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'today', label: 'Today (Default)' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last_7_days', label: 'Last 7 Days' },
                  { id: 'custom', label: 'Custom Range' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    datePreset === preset.id
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 self-start lg:self-auto">
              <Calendar className="w-3.5 h-3.5 text-[#BA1A20]" />
              <span>Period: <strong>{rangeLabel}</strong></span>
            </div>
          </div>

          {/* Date Pickers & Cashier Filter (if Owner) */}
          <div className="pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Exact Date From / To */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0">
                Dates:
              </span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
              />
              <span className="text-neutral-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
              />
            </div>

            {/* Owner Cashier Filter */}
            {isOwner ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Staff:</span>
                </span>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:border-neutral-900"
                >
                  <option value="all">All Cashier Accounts (Default)</option>
                  {cashierStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName} {staff.username ? `(@${staff.username})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order number or customer..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>
            )}

            {/* Search if owner */}
            {isOwner && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order # or customer..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3 Simple KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Orders Fulfilled</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-neutral-900">
              {filteredOrders.length}
            </p>
            <p className="text-[11px] text-neutral-400">Total completed orders</p>
          </div>

          <div className="p-4 sm:p-5 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Items / Products Sold</span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">
              {totalItemsSold}
            </p>
            <p className="text-[11px] text-neutral-400">Total plates &amp; items served</p>
          </div>

          <div className="p-4 sm:p-5 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-[#BA1A20]" />
            </div>
            <p className="text-2xl font-black text-neutral-900">
              ₱{totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-500 font-medium">
              Cash: ₱{cashSales.toLocaleString()} • Card: ₱{cardSales.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Minimal Orders Table */}
        <SessionOrdersTable orders={filteredOrders} isOwner={isOwner} />
      </div>
    </div>
  );
}
