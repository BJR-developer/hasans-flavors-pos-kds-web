'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useShifts } from '@/hooks/useShiftData';
import { Shift } from '@/types';

export function ShiftAuditSection() {
  const { data: shifts = [], isLoading, refetch, isRefetching } = useShifts();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShifts = shifts.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.cashierName.toLowerCase().includes(q) ||
      (s.notes && s.notes.toLowerCase().includes(q)) ||
      s.status.toLowerCase().includes(q)
    );
  });

  const formatTime = (iso?: string) => {
    if (!iso) return 'Active';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-900">
              Cashier Shift Handovers &amp; Audits
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            Verify cashier shift calculations, starting cash floats, closing drawer counts, and cash variances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            title="Refresh shifts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors"
          >
            <span>Time-Filtered Orders</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="pt-1">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shift by cashier name or notes..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
          />
        </div>
      </div>

      {/* Shifts Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Date &amp; Shift Hours</th>
              <th className="px-4 py-3">Opening Float</th>
              <th className="px-4 py-3">Total Sales</th>
              <th className="px-4 py-3">Cash in Drawer</th>
              <th className="px-4 py-3">Variance</th>
              <th className="px-4 py-3">Status &amp; Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading cashier shifts...</span>
                </td>
              </tr>
            ) : filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  No shifts recorded yet. Shifts started by cashiers in the POS will appear here.
                </td>
              </tr>
            ) : (
              filteredShifts.map((shift) => {
                const isClosed = shift.status === 'closed';
                const diff = shift.cashDifference || 0;

                return (
                  <tr key={shift.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Cashier Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-[11px]">
                          {shift.cashierName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-neutral-900">{shift.cashierName}</span>
                      </div>
                    </td>

                    {/* Date & Shift Hours */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900">
                          {formatDate(shift.startTime)}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {formatTime(shift.startTime)} &ndash; {formatTime(shift.endTime)}
                        </span>
                      </div>
                    </td>

                    {/* Opening Float */}
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-700">
                      ₱{shift.openingCash.toLocaleString()}
                    </td>

                    {/* Total Sales */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-neutral-900">
                          ₱{shift.grossSales.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {shift.totalOrders} orders
                        </span>
                      </div>
                    </td>

                    {/* Expected vs Actual Cash in Drawer */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-neutral-900">
                          Counted: ₱{(shift.closingCash ?? shift.expectedCash ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Expected: ₱{(shift.expectedCash ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Variance */}
                    <td className="px-4 py-3">
                      {!isClosed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Shift Active
                        </span>
                      ) : diff === 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                          Balanced (₱0)
                        </span>
                      ) : diff > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                          +₱{diff.toLocaleString()} (Over)
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
                          -₱{Math.abs(diff).toLocaleString()} (Short)
                        </span>
                      )}
                    </td>

                    {/* Notes & Status */}
                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            shift.status === 'open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {shift.status}
                        </span>
                        {shift.notes && (
                          <p className="text-[11px] text-neutral-500 truncate mt-1" title={shift.notes}>
                            {shift.notes}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
