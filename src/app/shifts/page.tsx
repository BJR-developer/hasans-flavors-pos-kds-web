'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Receipt,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useOrders } from '@/hooks/useRestaurantData';
import { useStaffUsers } from '@/hooks/useStaffData';
import { useActiveShift } from '@/hooks/useShiftData';
import { SessionOrdersTable } from '@/components/shifts/SessionOrdersTable';
import { SessionDrawerCard } from '@/components/shifts/SessionDrawerCard';
import { ShiftFilterBar, ShiftDatePreset } from '@/components/shifts/ShiftFilterBar';
import { PaymentBreakdownCard, PaymentBreakdownData } from '@/components/shifts/PaymentBreakdownCard';

export default function ShiftsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: staffList = [] } = useStaffUsers();
  const { data: activeShift } = useActiveShift(user?.id);

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

  const [datePreset, setDatePreset] = useState<ShiftDatePreset>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customStartTime, setCustomStartTime] = useState<string>('00:00');
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [customEndTime, setCustomEndTime] = useState<string>('23:59');

  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [orderScope, setOrderScope] = useState<'all_session' | 'my_direct'>('all_session');
  const [searchQuery, setSearchQuery] = useState('');

  const isOwner = user?.role === 'owner';
  const isCashier = user?.role === 'cashier';

  // Handle Preset Selection
  const handleSelectPreset = (preset: ShiftDatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const str = toDateInputString(now);
      setCustomStartDate(str);
      setCustomStartTime('00:00');
      setCustomEndDate(str);
      setCustomEndTime('23:59');
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const str = toDateInputString(yest);
      setCustomStartDate(str);
      setCustomStartTime('00:00');
      setCustomEndDate(str);
      setCustomEndTime('23:59');
    } else if (preset === 'last_7_days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setCustomStartDate(toDateInputString(start));
      setCustomStartTime('00:00');
      setCustomEndDate(toDateInputString(now));
      setCustomEndTime('23:59');
    }
  };

  // Filter orders by date/time range and cashier attribution
  const { filteredOrders, rangeLabel, allSessionCount, myDirectCount } = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'draft');

    // 1. Calculate time bounds
    let startTs: number;
    let endTs: number;
    let label = 'Today (All Day)';

    if (datePreset === 'today') {
      startTs = new Date(`${todayStr}T00:00:00`).getTime();
      endTs = new Date(`${todayStr}T23:59:59.999`).getTime();
      label = 'Today (All Day)';
    } else if (customStartDate && customEndDate) {
      const sTime = customStartTime || '00:00';
      const eTime = customEndTime || '23:59';
      startTs = new Date(`${customStartDate}T${sTime}:00`).getTime();
      endTs = new Date(`${customEndDate}T${eTime}:59.999`).getTime();

      const startFormatted = new Date(startTs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const endFormatted = new Date(endTs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (datePreset === 'yesterday') {
        label = `Yesterday (${startFormatted})`;
      } else if (datePreset === 'last_7_days') {
        label = `Last 7 Days (${startFormatted} – ${endFormatted})`;
      } else {
        label = customStartDate === customEndDate ? `${startFormatted} (${sTime}–${eTime})` : `${startFormatted} – ${endFormatted}`;
      }
    } else {
      startTs = new Date(`${todayStr}T00:00:00`).getTime();
      endTs = new Date(`${todayStr}T23:59:59.999`).getTime();
    }

    // Time window filter
    const timeFiltered = validOrders.filter((o) => {
      const orderTs = new Date(o.createdAt).getTime();
      return orderTs >= startTs && orderTs <= endTs;
    });

    // Counts for scope switcher
    let allSessionTotal = 0;
    let myDirectTotal = 0;
    if (isCashier && user) {
      timeFiltered.forEach((o) => {
        const isMyDirect =
          (o.cashierId && o.cashierId === user.id) ||
          (o.cashierName && user.name && o.cashierName.toLowerCase() === user.name.toLowerCase());
        const isOtherCashier = o.cashierId && o.cashierId !== user.id;

        if (isMyDirect) myDirectTotal += 1;
        if (!isOtherCashier) allSessionTotal += 1;
      });
    }

    // 2. Staff Attribution Filter
    let filtered = timeFiltered;
    if (isCashier && user) {
      if (orderScope === 'my_direct') {
        filtered = filtered.filter((o) => {
          if (o.cashierId && o.cashierId === user.id) return true;
          if (o.cashierName && user.name && o.cashierName.toLowerCase() === user.name.toLowerCase()) return true;
          return false;
        });
      } else {
        // all_session: include cashier's orders AND unassigned/mobile orders during session
        // exclude ONLY orders explicitly taken by a different cashier
        filtered = filtered.filter((o) => {
          if (o.cashierId && o.cashierId !== user.id) return false;
          return true;
        });
      }
    } else if (isOwner && selectedStaffId !== 'all') {
      const selectedStaffObj = staffList.find((s) => s.id === selectedStaffId);
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

    return {
      filteredOrders: filtered,
      rangeLabel: label,
      allSessionCount: allSessionTotal,
      myDirectCount: myDirectTotal,
    };
  }, [
    orders,
    datePreset,
    activeShift,
    todayStr,
    customStartDate,
    customStartTime,
    customEndDate,
    customEndTime,
    isCashier,
    isOwner,
    user,
    orderScope,
    selectedStaffId,
    staffList,
    searchQuery,
  ]);

  // Aggregate Metrics
  const totalSales = useMemo(
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

  const paymentBreakdown: PaymentBreakdownData = useMemo(() => {
    const cash = { amount: 0, count: 0 };
    const gcash = { amount: 0, count: 0 };
    const card = { amount: 0, count: 0 };
    const inr = { amount: 0, count: 0 };
    const online = { amount: 0, count: 0 };

    filteredOrders.forEach((o) => {
      const method = (o.paymentMethod || '').toLowerCase();
      const amt = Number(o.amountPaid || o.total || 0);

      if (method === 'cash') {
        cash.amount += amt;
        cash.count += 1;
      } else if (method === 'gcash') {
        gcash.amount += amt;
        gcash.count += 1;
      } else if (method === 'card') {
        card.amount += amt;
        card.count += 1;
      } else if (method === 'inr_qr' || method === 'inr' || method === 'upi') {
        inr.amount += amt;
        inr.count += 1;
      } else {
        online.amount += amt;
        online.count += 1;
      }
    });

    return { cash, gcash, card, inr, online };
  }, [filteredOrders]);

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
                className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer"
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
                : `Orders and sales recorded for your session (${user.name || user.email})`}
            </p>
          </div>
        </div>

        {/* Date Filter & Staff Selection Bar */}
        <ShiftFilterBar
          datePreset={datePreset}
          onSelectPreset={handleSelectPreset}
          rangeLabel={rangeLabel}
          customStartDate={customStartDate}
          customStartTime={customStartTime}
          customEndDate={customEndDate}
          customEndTime={customEndTime}
          onStartDateChange={(val) => {
            setCustomStartDate(val);
            setDatePreset('custom');
          }}
          onStartTimeChange={(val) => {
            setCustomStartTime(val);
            setDatePreset('custom');
          }}
          onEndDateChange={(val) => {
            setCustomEndDate(val);
            setDatePreset('custom');
          }}
          onEndTimeChange={(val) => {
            setCustomEndTime(val);
            setDatePreset('custom');
          }}
          isOwner={isOwner}
          isCashier={isCashier}
          staffList={staffList}
          selectedStaffId={selectedStaffId}
          onSelectStaffId={setSelectedStaffId}
          orderScope={orderScope}
          onChangeOrderScope={setOrderScope}
          allSessionCount={allSessionCount}
          myDirectCount={myDirectCount}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

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
              <span>Total Sales</span>
              <DollarSign className="w-4 h-4 text-[#BA1A20]" />
            </div>
            <p className="text-2xl font-black text-neutral-900">
              ₱{totalSales.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-500 font-medium">
              Cash: ₱{paymentBreakdown.cash.amount.toLocaleString()} • GCash: ₱{paymentBreakdown.gcash.amount.toLocaleString()}{paymentBreakdown.card.amount > 0 ? ` • Card: ₱${paymentBreakdown.card.amount.toLocaleString()}` : ''}{paymentBreakdown.inr.amount > 0 ? ` • INR: ₱${paymentBreakdown.inr.amount.toLocaleString()}` : ''}
            </p>
          </div>
        </div>

        {/* Payment Channels & Tender Breakdown */}
        <PaymentBreakdownCard
          breakdown={paymentBreakdown}
          totalSales={totalSales}
          totalOrders={filteredOrders.length}
        />

        {/* Initial Drawer Float & Audit Tracking */}
        <SessionDrawerCard cashierId={selectedStaffId} isOwner={isOwner} />

        {/* Session Orders Table */}
        <SessionOrdersTable orders={filteredOrders} isOwner={isOwner} />
      </div>
    </div>
  );
}
