'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  User,
  Calendar,
  DollarSign,
  Receipt,
  ShoppingBag,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useShifts } from '@/hooks/useShiftData';
import { useStaffUsers } from '@/hooks/useStaffData';
import { Shift } from '@/types';

type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'all';

export function OwnerShiftAuditView() {
  const { data: shifts = [], isLoading, refetch, isRefetching } = useShifts();
  const { data: staffList = [] } = useStaffUsers();

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active cashier accounts
  const cashierStaff = useMemo(() => {
    return staffList.filter((s) => s.role === 'cashier' || s.role === 'owner');
  }, [staffList]);

  // Helper to format duration in hours & minutes
  const formatDuration = (startIso: string, endIso?: string) => {
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    const diffMins = Math.max(0, Math.floor((end - start) / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (iso?: string) => {
    if (!iso) return 'Active Now';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter shifts based on Date Preset, Staff Account, and Search Query
  const filteredShifts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return shifts.filter((s) => {
      const shiftTime = new Date(s.startTime).getTime();

      // 1. Date Filter
      if (datePreset === 'today') {
        if (shiftTime < startOfToday) return false;
      } else if (datePreset === 'yesterday') {
        if (shiftTime < startOfYesterday || shiftTime >= startOfToday) return false;
      } else if (datePreset === 'last_7_days') {
        if (shiftTime < startOf7Days) return false;
      } else if (datePreset === 'this_month') {
        if (shiftTime < startOfMonth) return false;
      }

      // 2. Staff Account Filter
      if (selectedStaffId !== 'all') {
        if (s.cashierId && s.cashierId !== selectedStaffId) return false;
        if (!s.cashierId) {
          const staffObj = cashierStaff.find((c) => c.id === selectedStaffId);
          if (staffObj && s.cashierName.toLowerCase() !== staffObj.fullName.toLowerCase()) {
            return false;
          }
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.cashierName.toLowerCase().includes(q);
        const matchesNotes = s.notes && s.notes.toLowerCase().includes(q);
        if (!matchesName && !matchesNotes) return false;
      }

      return true;
    });
  }, [shifts, datePreset, selectedStaffId, searchQuery, cashierStaff]);

  // Aggregate metrics for filtered shifts
  const totalShiftRevenue = useMemo(
    () => filteredShifts.reduce((sum, s) => sum + (s.grossSales || 0), 0),
    [filteredShifts]
  );
  const totalShiftOrders = useMemo(
    () => filteredShifts.reduce((sum, s) => sum + (s.totalOrders || 0), 0),
    [filteredShifts]
  );
  const totalShiftProducts = useMemo(
    () => filteredShifts.reduce((sum, s) => sum + (s.totalItemsSold || 0), 0),
    [filteredShifts]
  );

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-4">
        {/* Date Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'today', label: 'Today (Default)' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last_7_days', label: 'Last 7 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'all', label: 'All History' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id)}
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

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors self-end sm:self-auto"
            title="Refresh shift records"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Staff Filter & Search */}
        <div className="pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Cashier Account Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Cashier:</span>
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

          {/* Search Notes / Cashier */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by cashier name or notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Aggregate Stats Summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
          <span className="text-xs text-neutral-500 font-medium">Shift Revenue</span>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            ₱{totalShiftRevenue.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
          <span className="text-xs text-neutral-500 font-medium">Orders Fulfilled</span>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {totalShiftOrders}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1">
          <span className="text-xs text-neutral-500 font-medium">Products Sold</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">
            {totalShiftProducts}
          </p>
        </div>
      </div>

      {/* Shifts Audit Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-neutral-900">
              Cashier Login / Logout Session Logs
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Showing {filteredShifts.length} shift logs in selected filter
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Login / Logout</th>
                <th className="px-4 py-3">Active Duration</th>
                <th className="px-4 py-3">Products Sold</th>
                <th className="px-4 py-3">Total Sales</th>
                <th className="px-4 py-3">Cash Drawer</th>
                <th className="px-4 py-3">Variance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-neutral-400">
                    <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading cashier shifts...</span>
                  </td>
                </tr>
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-neutral-400">
                    No cashier shifts found for this filter.
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const isClosed = shift.status === 'closed';
                  const diff = shift.cashDifference || 0;

                  return (
                    <tr key={shift.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Cashier Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {shift.cashierName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block truncate">
                              {shift.cashierName}
                            </span>
                            {shift.cashierId && (
                              <span className="text-[10px] text-neutral-400">Verified Cashier</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-neutral-700 font-medium">
                        {formatDate(shift.startTime)}
                      </td>

                      {/* Login / Logout times */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-neutral-800">
                        <div>
                          <span className="text-emerald-700 font-semibold">In: {formatTime(shift.startTime)}</span>
                        </div>
                        <div>
                          <span className={isClosed ? 'text-neutral-500' : 'text-amber-600 font-bold'}>
                            Out: {formatTime(shift.endTime)}
                          </span>
                        </div>
                      </td>

                      {/* Active Duration */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono font-semibold text-neutral-800">
                        {formatDuration(shift.startTime, shift.endTime)}
                      </td>

                      {/* Products Sold */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-emerald-700">
                        {shift.totalItemsSold || 0} items
                      </td>

                      {/* Total Sales */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-black text-neutral-900">
                        ₱{Number(shift.grossSales || 0).toLocaleString()}
                        <span className="text-[10px] text-neutral-400 font-normal block">
                          {shift.totalOrders} orders
                        </span>
                      </td>

                      {/* Cash Drawer Count */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-neutral-700 font-mono">
                        {isClosed ? (
                          <div>
                            <span className="font-bold text-neutral-900">
                              ₱{Number(shift.closingCash || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                              Exp: ₱{Number(shift.expectedCash || 0).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold">In Progress</span>
                        )}
                      </td>

                      {/* Variance */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                        {isClosed ? (
                          diff === 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>₱0 (Exact)</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 font-bold ${
                                diff > 0 ? 'text-blue-700' : 'text-rose-700'
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{diff > 0 ? `+₱${diff}` : `-₱${Math.abs(diff)}`}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isClosed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Now
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
