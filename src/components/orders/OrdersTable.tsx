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
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Clock,
  Flame,
  AlertCircle,
  Utensils,
  ShoppingBag,
  Bike,
  Receipt,
  FileSpreadsheet,
  Check,
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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });

  // Modals
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Received',
          bg: 'bg-[#FFF8E1]',
          text: 'text-[#B45309]',
          border: 'border-[#FFE082]',
          icon: Clock,
        };
      case 'preparing':
        return {
          label: 'In Kitchen',
          bg: 'bg-[#FFF2F0]',
          text: 'text-[#BA1A20]',
          border: 'border-[#FFDAD6]',
          icon: Flame,
        };
      case 'ready':
        return {
          label: 'Ready for Service',
          bg: 'bg-[#E8F5E9]',
          text: 'text-[#2E7D32]',
          border: 'border-[#C8E6C9]',
          icon: CheckCircle2,
        };
      case 'completed':
        return {
          label: 'Delivered / Completed',
          bg: 'bg-[#F4F3F2]',
          text: 'text-[#5B403D]',
          border: 'border-[#E9E8E7]',
          icon: Check,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: AlertCircle,
        };
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
      if (statusFilter === 'cancelled') return o.status === 'cancelled';
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
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Order #</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div>
              <div className="font-mono font-black text-xs text-[#2D2926]">
                {o.orderNumber}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F3F2] border border-[#E9E8E7] text-[#5B403D] flex items-center gap-1">
                  {o.type === 'dine_in' ? (
                    <>
                      <Utensils className="w-2.5 h-2.5" />
                      <span>{o.tableNumber || 'Dine-In'}</span>
                    </>
                  ) : o.type === 'delivery' ? (
                    <>
                      <Bike className="w-2.5 h-2.5 text-[#BA1A20]" />
                      <span>Delivery</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-2.5 h-2.5 text-[#B45309]" />
                      <span>Takeout</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Date & Time</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <div className="text-xs">
              <p className="font-bold text-[#2D2926]">
                {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] text-[#8F6F6C]">
                {d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Customer & Channel</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="text-xs">
              <p className="font-bold text-[#2D2926] leading-snug">{o.customerName}</p>
              <p className="text-[11px] text-[#8F6F6C] truncate max-w-[160px]">
                {o.tableNumber || o.deliveryAddress || (o.type === 'delivery' ? 'Delivery' : 'Takeaway')}
              </p>
            </div>
          );
        },
      },
      {
        id: 'itemsSummary',
        header: 'Items Summary',
        cell: ({ row }) => {
          const o = row.original;
          const firstItem = o.items[0];
          const remainingCount = o.items.length - 1;
          const totalQty = o.items.reduce((sum, it) => sum + it.quantity, 0);

          return (
            <div className="text-xs max-w-xs">
              <p className="font-bold text-[#2D2926] truncate">
                {firstItem ? `${firstItem.quantity}x ${firstItem.dish.name}` : 'Order items'}
              </p>
              <p className="text-[10px] text-[#8F6F6C]">
                {remainingCount > 0
                  ? `+ ${remainingCount} other dish${remainingCount > 1 ? 'es' : ''} (${totalQty} items total)`
                  : `${totalQty} item total`}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Total</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-xs">
              <span className="font-black text-[#BA1A20] text-sm">
                ₱{row.original.total.toLocaleString()}
              </span>
              <p className="text-[9px] text-[#8F6F6C]">Inc. 5% VAT</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Payment</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const o = row.original;
          const isPaid = o.paymentStatus === 'paid';

          return (
            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isPaid
                    ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                    : 'bg-[#FFF8E1] text-[#B45309] border-[#FFE082]'
                }`}
              >
                {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span>{o.paymentStatus}</span>
              </span>

              <p className="text-[10px] text-[#8F6F6C] font-semibold uppercase">
                {o.paymentMethod}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1.5 hover:text-[#BA1A20] font-black text-xs uppercase"
          >
            <span>Kitchen Status</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const meta = getStatusBadge(row.original.status);
          const Icon = meta.icon;

          return (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{meta.label}</span>
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
              {/* View / Print Receipt */}
              <button
                onClick={() => setReceiptOrder(o)}
                title="Print 80mm Receipt Slip"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E9E8E7] bg-white hover:bg-[#FFF2F0] hover:border-[#FFDAD6] text-xs font-bold text-[#BA1A20] transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Receipt</span>
              </button>

              {/* View Details */}
              <button
                onClick={() => setDetailOrder(o)}
                title="View Full Order Details"
                className="p-1.5 rounded-xl border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] text-[#5B403D] hover:text-[#2D2926] transition-all"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Quick Mark Paid button if unpaid */}
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
                  title="Mark Paid"
                  className="px-2 py-1 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Pay
                </button>
              )}

              {/* Quick bump to Complete if ready */}
              {o.status === 'ready' && (
                <button
                  onClick={() =>
                    updateStatusMutation.mutate({ orderId: o.id, status: 'completed' })
                  }
                  title="Complete Order"
                  className="px-2 py-1 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Done
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [updateStatusMutation, updatePaymentMutation]
  );

  // Global search filter matching
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
      const numMatch = o.orderNumber.toLowerCase().includes(q);
      const custMatch = o.customerName.toLowerCase().includes(q);
      const tableMatch = (o.tableNumber || '').toLowerCase().includes(q);
      const itemMatch = o.items.some((it) => it.dish.name.toLowerCase().includes(q));
      return numMatch || custMatch || tableMatch || itemMatch;
    },
  });

  // Export Table Data to CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Type', 'Table', 'Customer', 'Items Count', 'Total', 'Payment', 'Status'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString(),
      o.type,
      o.tableNumber || 'N/A',
      `"${o.customerName}"`,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.total,
      o.paymentStatus,
      o.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hasans_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8 max-w-[1720px] mx-auto w-full space-y-5">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#BA1A20]" />
            <h1 className="text-xl font-extrabold text-[#2D2926] tracking-tight">
              Orders Management Table
            </h1>
          </div>
          <p className="text-xs text-[#8F6F6C] font-medium mt-0.5">
            Powered by TanStack Table &amp; TanStack Query • Live auto-syncing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E9E8E7] hover:bg-[#F4F3F2] text-xs font-bold text-[#5B403D] transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E9E8E7] p-4 space-y-3.5 stitch-shadow">
        {/* Search & Rows Per Page */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 relative max-w-md flex items-center">
            <Search className="w-4 h-4 text-[#8F6F6C] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order #, customer, table, or ordered dish..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#E9E8E7] bg-[#FAF9F8] text-xs font-medium text-[#2D2926] focus:bg-white focus:outline-none focus:border-[#BA1A20] transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 p-0.5 text-[#8F6F6C] hover:text-[#2D2926]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Rows Per Page Selector */}
          <div className="flex items-center gap-2 text-xs text-[#5B403D] font-bold">
            <span>Show:</span>
            {[8, 15, 25, 50].map((size) => (
              <button
                key={size}
                onClick={() => table.setPageSize(size)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                  table.getState().pagination.pageSize === size
                    ? 'bg-[#BA1A20] text-white border-[#BA1A20] shadow-xs'
                    : 'bg-[#FAF9F8] text-[#5B403D] border-[#E9E8E7] hover:bg-[#F4F3F2]'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F0F0]">
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            {
              id: 'unpaid',
              label: `Unpaid (${orders.filter((o) => o.paymentStatus === 'unpaid').length})`,
            },
            {
              id: 'active',
              label: `In Progress (${
                orders.filter(
                  (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
                ).length
              })`,
            },
            {
              id: 'completed',
              label: `Completed (${orders.filter((o) => o.status === 'completed').length})`,
            },
            {
              id: 'cancelled',
              label: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})`,
            },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  table.setPageIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#FFF2F0] text-[#BA1A20] border border-[#FFDAD6] font-extrabold shadow-2xs'
                    : 'bg-[#FAF9F8] text-[#5B403D] hover:bg-[#F4F3F2] border border-[#E9E8E7]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TanStack Data Table Container */}
      <div className="bg-white rounded-2xl border border-[#E9E8E7] overflow-hidden stitch-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* Header */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[#FAF9F8] border-b border-[#E9E8E7]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-5 py-3.5 text-xs font-extrabold text-[#5B403D] uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#F1F0F0]">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-[#8F6F6C]">
                    <AlertCircle className="w-8 h-8 stroke-1 mx-auto text-[#8F6F6C] mb-2" />
                    <p className="font-bold text-sm text-[#2D2926]">No orders match your filter</p>
                    <p className="text-xs text-[#8F6F6C] mt-0.5">
                      Try clearing the search box or selecting another status tab.
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#FAF9F8] transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TanStack Table Pagination Footer */}
        <div className="px-5 py-3.5 bg-[#FAF9F8] border-t border-[#E9E8E7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#8F6F6C] font-medium">
            Showing{' '}
            <span className="font-bold text-[#2D2926]">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[#2D2926]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{' '}
            of{' '}
            <span className="font-bold text-[#2D2926]">
              {table.getFilteredRowModel().rows.length}
            </span>{' '}
            orders
          </span>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First Page"
              className="p-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 disabled:hover:bg-white text-[#2D2926] transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous Page"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 disabled:hover:bg-white text-xs font-bold text-[#2D2926] transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Page indicator pill */}
            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#E9E8E7] text-xs font-bold text-[#2D2926]">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Next Page"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 disabled:hover:bg-white text-xs font-bold text-[#2D2926] transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Last Page"
              className="p-1.5 rounded-lg border border-[#E9E8E7] bg-white hover:bg-[#F4F3F2] disabled:opacity-30 disabled:hover:bg-white text-[#2D2926] transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Printable Thermal Receipt Modal */}
      <ThermalReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />

      {/* Order Deep Details Modal */}
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
