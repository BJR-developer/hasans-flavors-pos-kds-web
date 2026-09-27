'use client';

import React from 'react';
import {
  Clock,
  Calendar,
  User,
  Filter,
  RotateCcw,
  Printer,
  DollarSign,
  Receipt,
  CreditCard,
  Percent,
} from 'lucide-react';
import { Order, StaffUser } from '@/types';

export interface TimeFilterState {
  preset: 'all' | 'today' | 'morning_shift' | 'evening_shift' | 'custom';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  cashierName: string; // 'all' or specific name
}

interface TimeFilterControlsProps {
  filters: TimeFilterState;
  onFilterChange: (filters: TimeFilterState) => void;
  staffUsers?: StaffUser[];
  filteredOrders: Order[];
}

export function TimeFilterControls({
  filters,
  onFilterChange,
  staffUsers = [],
  filteredOrders,
}: TimeFilterControlsProps) {
  // Preset handlers
  const handlePresetSelect = (preset: TimeFilterState['preset']) => {
    const todayStr = new Date().toISOString().split('T')[0];

    if (preset === 'all') {
      onFilterChange({
        ...filters,
        preset: 'all',
        startTime: '00:00',
        endTime: '23:59',
      });
    } else if (preset === 'today') {
      onFilterChange({
        ...filters,
        preset: 'today',
        date: todayStr,
        startTime: '00:00',
        endTime: '23:59',
      });
    } else if (preset === 'morning_shift') {
      // 9:00 AM to 5:00 PM (09:00 - 17:00)
      onFilterChange({
        ...filters,
        preset: 'morning_shift',
        date: filters.date || todayStr,
        startTime: '09:00',
        endTime: '17:00',
      });
    } else if (preset === 'evening_shift') {
      // 5:00 PM to 12:00 AM (17:00 - 23:59)
      onFilterChange({
        ...filters,
        preset: 'evening_shift',
        date: filters.date || todayStr,
        startTime: '17:00',
        endTime: '23:59',
      });
    } else {
      onFilterChange({
        ...filters,
        preset: 'custom',
      });
    }
  };

  // Compute live KPI metrics for this filtered dataset
  const metrics = React.useMemo(() => {
    let grossRevenue = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let discountTotal = 0;

    filteredOrders.forEach((o) => {
      grossRevenue += Number(o.total || 0);
      discountTotal += Number(o.discount || 0);
      const method = (o.paymentMethod || '').toLowerCase();
      const paid = Number(o.amountPaid || o.total || 0);
      if (method === 'cash') {
        cashTotal += paid;
      } else {
        cardTotal += paid;
      }
    });

    return {
      orderCount: filteredOrders.length,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      cashTotal: Math.round(cashTotal * 100) / 100,
      cardTotal: Math.round(cardTotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
    };
  }, [filteredOrders]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-neutral-200/90 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-1">
              Time Shift:
            </span>
            <button
              type="button"
              onClick={() => handlePresetSelect('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filters.preset === 'today'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('morning_shift')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filters.preset === 'morning_shift'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Morning (9AM &ndash; 5PM)
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('evening_shift')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filters.preset === 'evening_shift'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Evening (5PM &ndash; 12AM)
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filters.preset === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filters.preset === 'custom'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Custom Window
            </button>
          </div>

          {/* Print Summary Button */}
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>

        {/* Granular Time & Cashier Selector Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-neutral-100">
          {/* Date Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Shift Date</span>
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                onFilterChange({ ...filters, preset: 'custom', date: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Time From */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Start Time (From)</span>
            </label>
            <input
              type="time"
              value={filters.startTime}
              onChange={(e) =>
                onFilterChange({ ...filters, preset: 'custom', startTime: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-900 font-mono"
            />
          </div>

          {/* Time To */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>End Time (To)</span>
            </label>
            <input
              type="time"
              value={filters.endTime}
              onChange={(e) =>
                onFilterChange({ ...filters, preset: 'custom', endTime: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-900 font-mono"
            />
          </div>

          {/* Cashier / Staff Filter */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-600 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>Cashier / Staff</span>
            </label>
            <select
              value={filters.cashierName}
              onChange={(e) =>
                onFilterChange({ ...filters, cashierName: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-900"
            >
              <option value="all">All Cashiers &amp; Staff</option>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.fullName}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Money totals live in Cash & Shifts so every screen shows the same numbers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm">
        <span className="text-neutral-700">
          <strong className="text-neutral-900">{metrics.orderCount}</strong> orders between {filters.startTime} and {filters.endTime}
          {filters.cashierName !== 'all' ? ` by ${filters.cashierName}` : ''}
        </span>
        <a href="/shifts" className="font-semibold text-brand hover:underline">
          Money collected → Cash &amp; Shifts
        </a>
      </div>
    </div>
  );
}
