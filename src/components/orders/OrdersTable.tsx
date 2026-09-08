'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  Eye,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { useOrders, useUpdateOrderStatus, useUpdateOrderPayment } from '@/hooks/useRestaurantData';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';
import { OrderDetailsModal } from './OrderDetailsModal';

export function OrdersTable() {
  const router = useRouter();
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

  // Pre-filter data by status tabs
  const filteredData = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === 'completed') return o.status === 'completed';
      if (statusFilter === 'cancelled') return o.status === 'cancelled';
      if (statusFilter === 'open') {
        return o.status !== 'completed' && o.status !== 'cancelled';
      }
      if (statusFilter === 'unpaid') {
        return o.paymentStatus === 'unpaid' || o.paymentStatus === 'partially_paid';
      }
      return true;
    });
  }, [orders, statusFilter]);

  // Count unpaid orders for banner
  const unpaidDineInOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.type === 'dine_in' &&
        (o.paymentStatus === 'unpaid' || o.paymentStatus === 'partially_paid') &&
        o.status !== 'cancelled'
    );
  }, [orders]);

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
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-[#1F1F1F]">
                  {o.orderNumber}
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#F5F5F5] text-[#525252]">
                  {o.type === 'dine_in'
                    ? o.tableNumber || 'Dine-In'
                    : o.type === 'delivery'
                    ? 'Delivery'
                    : 'Takeout'}
                </span>
              </div>
              <span className="text-[11px] text-[#737373] block truncate max-w-[140px]">
                {o.customerName}
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
            <span>Amount</span>
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
          const balance = o.balanceDue !== undefined ? o.balanceDue : o.paymentStatus === 'paid' ? 0 : o.total;

          return (
            <div>
              <span className="font-bold text-xs text-[#1F1F1F] block">
                ₱{o.total.toLocaleString()}
              </span>
              {balance > 0 && o.paymentStatus !== 'paid' && (
                <span className="text-[10px] font-bold text-[#BA1A20] block">
                  Due: ₱{balance.toLocaleString()}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment Status',
        cell: ({ row }) => {
          const o = row.original;
          const isPaid = o.paymentStatus === 'paid';
          const isPartial = o.paymentStatus === 'partially_paid';

          return (
            <div className="flex flex-col items-start gap-0.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isPaid
                    ? 'text-[#2E7D32] bg-[#E8F5E9]'
                    : isPartial
                    ? 'text-amber-900 bg-amber-100 border border-amber-300'
                    : 'text-[#B45309] bg-[#FFF8E1] border border-[#FFE082]'
                }`}
              >
                {o.paymentStatus}
              </span>
              <span className="text-[10px] text-[#737373] uppercase">
                {o.paymentMethod || 'cash'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Order Status',
        cell: ({ row }) => {
          const meta = getStatusBadge(row.original.status);
          return (
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${meta.bg} ${meta.color}`}
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
          const balance = o.balanceDue !== undefined ? o.balanceDue : o.paymentStatus === 'paid' ? 0 : o.total;
          const isFullyPaid = o.paymentStatus === 'paid' || balance === 0;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Left: Open in POS / Manage in POS Action */}
              {o.status !== 'completed' && o.status !== 'cancelled' ? (
                <button
                  onClick={() => router.push(`/pos?orderId=${o.id}`)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shadow-2xs ${
                    !isFullyPaid
                      ? 'bg-neutral-900 hover:bg-black text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {!isFullyPaid ? 'Open in POS' : 'Manage in POS'}
                </button>
              ) : null}

              {/* Middle: Quick Status Progression Buttons */}
              {(o.status === 'pending' || o.status === 'sent_to_kitchen') && (
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
                  onClick={() => updateStatusMutation.mutate({ orderId: o.id, status: 'served' })}
                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-[11px] font-semibold text-white"
                >
                  Serve
                </button>
              )}

              {/* Close Order when Served & Paid */}
              {isFullyPaid && o.status === 'served' && (
                <button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      orderId: o.id,
                      status: 'completed',
                      tableNumber: o.tableNumber,
                    })
                  }
                  className="px-2 py-1 rounded bg-[#1F1F1F] hover:bg-black text-[11px] font-semibold text-white"
                >
                  Close
                </button>
              )}

              {/* Right: Print Slip (Bill if unpaid, Receipt if paid) */}
              <button
                onClick={() => setReceiptOrder(o)}
                title={isFullyPaid ? 'Print Receipt' : 'Print Bill'}
                className="p-1.5 rounded-lg text-[#525252] hover:text-[#1F1F1F] hover:bg-[#F5F5F5] transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
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
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-neutral-200">
        <div>
          <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
            Order History &amp; Archive
          </h1>
          <p className="text-xs text-neutral-500">
            Durable audit log of all completed, cancelled, and active dining tickets
          </p>
        </div>
      </div>

      {/* Top Warning Banner for Unpaid Dine-in Orders */}
      {unpaidDineInOrders.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs font-bold text-amber-900">
              {unpaidDineInOrders.length} Unpaid Dine-In Table{unpaidDineInOrders.length > 1 ? 's' : ''} currently open or served
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {unpaidDineInOrders.slice(0, 6).map((o) => (
              <button
                key={o.id}
                onClick={() => router.push(`/pos?orderId=${o.id}`)}
                className="px-2 py-1 rounded-md bg-white border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                {o.tableNumber || o.orderNumber}: ₱{o.total.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: `All History (${orders.length})` },
            {
              id: 'completed',
              label: `Completed (${orders.filter((o) => o.status === 'completed').length})`,
            },
            {
              id: 'cancelled',
              label: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})`,
            },
            {
              id: 'open',
              label: `Active (${
                orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length
              })`,
            },
            {
              id: 'unpaid',
              label: `Unpaid (${
                orders.filter(
                  (o) => o.paymentStatus === 'unpaid' || o.paymentStatus === 'partially_paid'
                ).length
              })`,
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

      {/* Main Table Container */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-xs font-bold text-[#525252] select-none"
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
                  <td
                    colSpan={columns.length}
                    className="h-48 text-center text-xs text-[#A3A3A3]"
                  >
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#FAFAFA] transition-colors group cursor-pointer"
                    onClick={() => setDetailOrder(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-xs text-[#1F1F1F]"
                        onClick={(e) => {
                          // Prevent triggering row click if an action button was clicked
                          if ((e.target as HTMLElement).closest('button')) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Footer Pagination */}
        <div className="px-4 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#737373]">
          <div>
            Showing{' '}
            <span className="font-semibold text-[#1F1F1F]">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-[#1F1F1F]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                filteredData.length
              )}
            </span>{' '}
            of <span className="font-semibold text-[#1F1F1F]">{filteredData.length}</span> orders
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded border border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {Math.max(1, table.getPageCount())}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded border border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals - OrderDetailsModal first, ThermalReceiptModal on top (z-[70]) */}
      <OrderDetailsModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onPrintReceipt={(order) => {
          setReceiptOrder(order);
        }}
      />

      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}
