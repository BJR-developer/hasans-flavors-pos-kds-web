'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { useOrders, useUpdateOrderStatus, useUpdateOrderPayment } from '@/hooks/useRestaurantData';
import { useStaffUsers } from '@/hooks/useStaffData';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';
import { OrderDetailsModal } from './OrderDetailsModal';
import { TimeFilterControls, TimeFilterState } from './TimeFilterControls';
import { getOrderColumns } from './OrderColumns';

export function OrdersTable() {
  const router = useRouter();
  const { data: orders = [] } = useOrders();
  const { data: staffUsers = [] } = useStaffUsers();
  const updateStatusMutation = useUpdateOrderStatus();
  const updatePaymentMutation = useUpdateOrderPayment();

  // Table UI States
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });

  // Time & Cashier Filters State (Defaults to Today Full Day)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [timeFilters, setTimeFilters] = useState<TimeFilterState>({
    preset: 'today',
    date: todayStr,
    startTime: '00:00',
    endTime: '23:59',
    cashierName: 'all',
  });

  // Modals
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' };
      case 'pending':
      case 'sent_to_kitchen':
        return { label: 'Received', color: 'text-[#B45309]', bg: 'bg-[#FFF8E1]' };
      case 'preparing':
        return { label: 'In Kitchen', color: 'text-[#BA1A20]', bg: 'bg-[#FFF2F0]' };
      case 'ready':
        return { label: 'Ready', color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' };
      case 'served':
        return { label: 'Served', color: 'text-blue-700', bg: 'bg-blue-50' };
      case 'completed':
        return { label: 'Closed', color: 'text-[#525252]', bg: 'bg-[#F5F5F5]' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' };
    }
  };

  // Pre-filter data by status tabs AND time range AND cashier
  const filteredData = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter
      if (statusFilter === 'completed' && o.status !== 'completed') return false;
      if (statusFilter === 'cancelled' && o.status !== 'cancelled') return false;
      if (statusFilter === 'open') {
        if (o.status === 'completed' || o.status === 'cancelled' || o.status === 'draft') return false;
      }
      if (statusFilter === 'unpaid') {
        if (o.status === 'draft' || (o.paymentStatus !== 'unpaid' && o.paymentStatus !== 'partially_paid')) return false;
      }
      if (o.status === 'draft') return false;

      // 2. Cashier Filter
      if (timeFilters.cashierName !== 'all') {
        const orderCashier = (o.cashierName || '').toLowerCase();
        if (orderCashier !== timeFilters.cashierName.toLowerCase()) {
          return false;
        }
      }

      // 3. Time / Date Filter
      if (timeFilters.preset !== 'all') {
        const orderDateObj = new Date(o.createdAt);
        const orderDateStr = orderDateObj.toISOString().split('T')[0];

        // Match date if specified
        if (timeFilters.date && orderDateStr !== timeFilters.date) {
          return false;
        }

        // Match time window
        const [startH, startM] = timeFilters.startTime.split(':').map(Number);
        const [endH, endM] = timeFilters.endTime.split(':').map(Number);

        const orderH = orderDateObj.getHours();
        const orderM = orderDateObj.getMinutes();
        const orderMinutes = orderH * 60 + orderM;
        const startMinutes = startH * 60 + (startM || 0);
        const endMinutes = endH * 60 + (endM || 0);

        if (orderMinutes < startMinutes || orderMinutes > endMinutes) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, timeFilters]);

  // Unpaid Dine-In banner count
  const unpaidDineInOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.type === 'dine_in' &&
        (o.paymentStatus === 'unpaid' || o.paymentStatus === 'partially_paid') &&
        o.status !== 'cancelled'
    );
  }, [orders]);

  // Columns definition
  const columns = useMemo(
    () =>
      getOrderColumns({
        router,
        updateStatusMutation,
        setDetailOrder,
        setReceiptOrder,
        getStatusBadge,
      }),
    [router, updateStatusMutation]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFA] p-4 sm:p-6 space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F1F1F] tracking-tight">
            Order History &amp; Shift Register
          </h1>
          <p className="text-xs text-[#737373]">
            Filter orders by cashier shift time windows, view financial breakdown, and manage orders
          </p>
        </div>

        {unpaidDineInOrders.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{unpaidDineInOrders.length} Unsettled Dine-In Tables</span>
          </div>
        )}
      </div>

      {/* Time & Shift Filtering Controls with Live KPI Banner */}
      <TimeFilterControls
        filters={timeFilters}
        onFilterChange={setTimeFilters}
        staffUsers={staffUsers}
        filteredOrders={filteredData}
      />

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
        {/* Status Tabs & Global Search */}
        <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'open', label: 'In Progress' },
              { id: 'unpaid', label: 'Unpaid / Partial' },
              { id: 'completed', label: 'Closed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search order #, customer..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* TanStack Table Rendering */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-400">
                    No orders found matching the selected time shift or filter.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/60 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-neutral-100 flex items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            Showing <span className="font-bold text-neutral-800">{filteredData.length}</span> matching orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-neutral-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {detailOrder && (
        <OrderDetailsModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onPrintReceipt={(o) => setReceiptOrder(o)}
          onOpenInPos={(o) => router.push(`/pos?orderId=${o.id}`)}
        />
      )}

      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
