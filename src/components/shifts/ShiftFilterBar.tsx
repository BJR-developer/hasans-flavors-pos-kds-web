'use client';

import React from 'react';
import { Calendar, Clock, Search, User, Filter, SlidersHorizontal } from 'lucide-react';
import { StaffUser } from '@/types';

export type ShiftDatePreset = 'today' | 'yesterday' | 'last_7_days' | 'custom';

interface ShiftFilterBarProps {
  datePreset: ShiftDatePreset;
  onSelectPreset: (preset: ShiftDatePreset) => void;
  rangeLabel: string;
  customStartDate: string;
  customStartTime: string;
  customEndDate: string;
  customEndTime: string;
  onStartDateChange: (val: string) => void;
  onStartTimeChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
  isOwner: boolean;
  isCashier: boolean;
  staffList: StaffUser[];
  selectedStaffId: string;
  onSelectStaffId: (id: string) => void;
  orderScope: 'all_session' | 'my_direct';
  onChangeOrderScope: (scope: 'all_session' | 'my_direct') => void;
  allSessionCount: number;
  myDirectCount: number;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
}

export function ShiftFilterBar({
  datePreset,
  onSelectPreset,
  rangeLabel,
  customStartDate,
  customStartTime,
  customEndDate,
  customEndTime,
  onStartDateChange,
  onStartTimeChange,
  onEndDateChange,
  onEndTimeChange,
  isOwner,
  isCashier,
  staffList,
  selectedStaffId,
  onSelectStaffId,
  orderScope,
  onChangeOrderScope,
  allSessionCount,
  myDirectCount,
  searchQuery,
  onSearchQueryChange,
}: ShiftFilterBarProps) {
  const cashierStaff = staffList.filter((s) => s.role === 'cashier' || s.role === 'owner');

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Top Row: Presets & Period Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Today Button */}
          <button
            type="button"
            onClick={() => onSelectPreset('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              datePreset === 'today'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            Today (Default)
          </button>

          {/* Yesterday */}
          <button
            type="button"
            onClick={() => onSelectPreset('yesterday')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              datePreset === 'yesterday'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            Yesterday
          </button>

          {/* Last 7 Days */}
          <button
            type="button"
            onClick={() => onSelectPreset('last_7_days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              datePreset === 'last_7_days'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            Last 7 Days
          </button>

          {/* Custom Range */}
          <button
            type="button"
            onClick={() => onSelectPreset('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              datePreset === 'custom'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Custom Date &amp; Time</span>
          </button>
        </div>

        {/* Selected Period Badge */}
        <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200 self-start lg:self-auto shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#BA1A20]" />
          <span>
            Period: <strong>{rangeLabel}</strong>
          </span>
        </div>
      </div>

      {/* Middle Row: Custom Date & Time Picker Controls (Visible when custom or toggled) */}
      {datePreset === 'custom' && (
        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
          <div className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#BA1A20]" />
            <span>Filter by Exact Date &amp; Time Range</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Start Date & Time */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-500">From (Date &amp; Time):</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-[#BA1A20]"
                />
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className="w-24 px-2 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-[#BA1A20]"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-500">To (Date &amp; Time):</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-[#BA1A20]"
                />
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  className="w-24 px-2 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-[#BA1A20]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls Row: Scope Toggle, Staff Filter & Search */}
      <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Cashier Order Scope Selector */}
        {isCashier && (
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onChangeOrderScope('all_session')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderScope === 'all_session'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All Register &amp; Online Orders ({allSessionCount})
            </button>
            <button
              type="button"
              onClick={() => onChangeOrderScope('my_direct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderScope === 'my_direct'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              My Direct POS Only ({myDirectCount})
            </button>
          </div>
        )}

        {/* Owner Cashier Filter */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Staff:</span>
            </span>
            <select
              value={selectedStaffId}
              onChange={(e) => onSelectStaffId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 font-semibold focus:bg-white focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              <option value="all">All Cashier Accounts &amp; Online (Default)</option>
              {cashierStaff.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName} {staff.username ? `(@${staff.username})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search order # or customer..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
          />
        </div>
      </div>
    </div>
  );
}
