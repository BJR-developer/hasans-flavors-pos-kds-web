'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  X,
  Printer,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { useOrders, useUpdateOrderStatus, useUpdateOrderPayment } from '@/hooks/useRestaurantData';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';
import { OrderDetailsModal } from './OrderDetailsModal';

export function OrdersTable() {
  const { data: orders = [] } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();
  const updatePaymentMutation = useUpdateOrderPayment();

  // Table UI States
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Modals
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Received', color: 'text-[#B45309]', bg: 'bg-[#FFF8E1]' };
      case 'preparing':
        return { label: 'In Kitchen', color: 'text-[#BA1A20]', bg: 'bg-[#FFF2F0]' };
      case 'ready':
        return { label: 'Ready', color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' };
      case 'completed':
        return { label: 'Served', color: 'text-[#525252]', bg: 'bg-[#F5F5F5]' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' };
    }
  };

  // Pre-filter data by status tabs
  const filteredData = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === 'unpaid') return o.paymentStatus === 'unpaid';
      if (statusFilter === 'active') {
        return o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
      }
      if (statusFilter === 'completed') return o.status === 'completed';
      return true;
    });
  }, [orders, statusFilter]);

  // Define Columns using TanStack Table ColumnDef
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-[#1F1F1F] font-bold text-xs uppercase"
          >
            <span>Order</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div>
              <span className="font-mono font-bold text-xs text-[#1F1F1F]">
                {o.orderNumber}
              </span>
              <span className="text-[11px] text-[#737373] ml-2">
                {o.type === 'dine_in' ? o.tableNumber || 'Dine-In' : o.type === 'delivery' ? 'Delivery' : 'Takeout'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Time',
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <span className="text-xs text-[#525252]">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          );
        },
      },
      {
        id: 'itemsSummary',
        header: 'Items',
        cell: ({ row }) => {
          const o = row.original;
          return (
            <span className="text-xs text-[#525252] truncate max-w-xs block">
              {o.items.map((it) => `${it.quantity}x ${it.dish.name}`).join(', ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-[#1F1F1F] font-bold text-xs uppercase"
          >
            <span>Total</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-xs text-[#1F1F1F]">
            ₱{row.original.total.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => {
          const o = row.original;
          const isPaid = o.paymentStatus === 'paid';
          return (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                isPaid ? 'text-[#2E7D32] bg-[#E8F5E9]' : 'text-[#B45309] bg-[#FFF8E1]'
              }`}
            >
              {o.paymentStatus.toUpperCase()}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const meta = getStatusBadge(row.original.status);
          return (
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
            >
              {meta.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="text-right block">Actions</span>,
        cell: ({ row }) => {
          const o = row.original;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Receipt */}
              <button
                onClick={() => setReceiptOrder(o)}
                title="Print Receipt"
                className="p-1 rounded text-[#737373] hover:text-[#1F1F1F] hover:bg-[#F5F5F5]"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {/* Quick Status Bumps */}
              {o.status === 'pending' && (
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: o.id, status: 'preparing' })}
                  className="px-2 py-1 rounded bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[11px] font-semibold text-[#1F1F1F]"
                >
                  Cook
                </button>
              )}

              {o.status === 'preparing' && (
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: o.id, status: 'ready' })}
                  className="px-2 py-1 rounded bg-[#FFF2F0] hover:bg-[#FFDAD6] text-[11px] font-semibold text-[#BA1A20]"
                >
                  Ready
                </button>
              )}

              {o.status === 'ready' && (
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: o.id, status: 'completed' })}
                  className="px-2 py-1 rounded bg-[#2E7D32] hover:bg-[#1B5E20] text-[11px] font-semibold text-white"
                >
                  Serve
                </button>
              )}

              {o.paymentStatus === 'unpaid' && (
                <button
                  onClick={() =>
                    updatePaymentMutation.mutate({
                      orderId: o.id,
                      paymentStatus: 'paid',
                      cashTendered: o.total,
                      changeDue: 0,
                    })
                  }
                  className="px-2 py-1 rounded bg-[#1F1F1F] hover:bg-[#383838] text-[11px] font-semibold text-white"
                >
                  Pay
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [updateStatusMutation, updatePaymentMutation]
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
    globalFilterFn: (row, columnId, filterValue) => {
      const q = filterValue.toLowerCase();
      const o = row.original;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.tableNumber || '').toLowerCase().includes(q) ||
        o.items.some((it) => it.dish.name.toLowerCase().includes(q))
      );
    },
  });

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Type', 'Table', 'Total', 'Payment', 'Status'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString(),
      o.type,
      o.tableNumber || 'N/A',
      o.total,
      o.paymentStatus,
      o.status,
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 max-w-[1720px] mx-auto w-full space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'active', label: `Active (${orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length})` },
            { id: 'unpaid', label: `Unpaid (${orders.filter((o) => o.paymentStatus === 'unpaid').length})` },
            { id: 'completed', label: `Completed (${orders.filter((o) => o.status === 'completed').length})` },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  table.setPageIndex(0);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[#1F1F1F] text-white'
                    : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Search & Export */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter orders..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[#1F1F1F] placeholder-[#A3A3A3] focus:bg-white focus:outline-none focus:border-[#1F1F1F] transition-colors"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-2 text-[#A3A3A3] hover:text-[#1F1F1F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-[#E5E5E5] text-xs font-medium text-[#525252] hover:text-[#1F1F1F] hover:bg-[#F5F5F5] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#525252]" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Clean TanStack Data Table */}
      <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 text-[11px] font-bold text-[#737373] uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-[#F5F5F5]">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-[#A3A3A3]">
                    No matching orders
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAFAFA] transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Pagination Footer */}
        <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-[#E5E5E5] flex items-center justify-between gap-3 text-xs text-[#737373]">
          <span>
            {table.getFilteredRowModel().rows.length} total orders
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded border border-[#E5E5E5] bg-white text-[#525252] disabled:opacity-30 hover:bg-[#F5F5F5]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-medium text-[#1F1F1F]">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded border border-[#E5E5E5] bg-white text-[#525252] disabled:opacity-30 hover:bg-[#F5F5F5]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ThermalReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />

      <OrderDetailsModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onPrintReceipt={(o) => {
          setDetailOrder(null);
          setReceiptOrder(o);
        }}
      />
    </div>
  );
}
