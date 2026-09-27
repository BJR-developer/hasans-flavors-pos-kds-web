'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  Eye,
  CheckCircle2,
  User,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';

interface OrderColumnsProps {
  router: any;
  updateStatusMutation: any;
  setDetailOrder: (o: Order) => void;
  setReceiptOrder: (o: Order) => void;
  getStatusBadge: (status: OrderStatus) => { label: string; color: string; bg: string };
}

export function getOrderColumns({
  router,
  updateStatusMutation,
  setDetailOrder,
  setReceiptOrder,
  getStatusBadge,
}: OrderColumnsProps): ColumnDef<Order>[] {
  return [
    {
      accessorKey: 'orderNumber',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 hover:text-ink font-bold text-xs uppercase"
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
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-xs text-ink">
                {o.orderNumber}
              </span>
              <span className="text-xs uppercase font-bold px-1.5 py-0.2 rounded bg-[#F5F5F5] text-ink-soft">
                {o.type === 'dine_in'
                  ? o.tableNumber || 'Dine-In'
                  : o.type === 'delivery'
                  ? 'Delivery'
                  : 'Takeout'}
              </span>
            </div>
            <span className="text-xs text-muted block truncate max-w-[140px]">
              {o.customerName}
            </span>
            {o.cashierName && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-500 font-medium">
                <User className="w-2.5 h-2.5 text-neutral-400" />
                <span>{o.cashierName}</span>
              </span>
            )}
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
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-neutral-400">
              {d.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      },
    },
    {
      id: 'itemsSummary',
      header: 'Items',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <span className="text-xs text-ink-soft truncate max-w-xs block">
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
          className="flex items-center gap-1 hover:text-ink font-bold text-xs uppercase"
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
        const balance =
          o.balanceDue !== undefined
            ? o.balanceDue
            : o.paymentStatus === 'paid'
            ? 0
            : o.total;

        return (
          <div>
            <span className="font-bold text-xs text-ink block font-mono">
              ₱{o.total.toLocaleString()}
            </span>
            {balance > 0 && o.paymentStatus !== 'paid' && (
              <span className="text-xs font-bold text-brand block font-mono">
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
              className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                isPaid
                  ? 'text-money bg-[#E8F5E9]'
                  : isPartial
                  ? 'text-amber-900 bg-amber-100 border border-amber-300'
                  : 'text-[#B45309] bg-[#FFF8E1] border border-[#FFE082]'
              }`}
            >
              {o.paymentStatus}
            </span>
            <span className="text-xs text-muted uppercase">
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
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${meta.bg} ${meta.color}`}
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
        const balance =
          o.balanceDue !== undefined
            ? o.balanceDue
            : o.paymentStatus === 'paid'
            ? 0
            : o.total;
        const isFullyPaid = o.paymentStatus === 'paid' || balance === 0;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Open in POS / Manage in POS Action */}
            {o.status !== 'completed' && o.status !== 'cancelled' ? (
              <button
                onClick={() => router.push(`/pos?orderId=${o.id}`)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shadow-2xs ${
                  !isFullyPaid
                    ? 'bg-neutral-900 hover:bg-black text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                {!isFullyPaid ? 'Open in POS' : 'Manage in POS'}
              </button>
            ) : null}

            {/* Quick Status Progression */}
            {(o.status === 'pending' || o.status === 'sent_to_kitchen') && (
              <button
                onClick={() =>
                  updateStatusMutation.mutate({ orderId: o.id, status: 'preparing' })
                }
                className="px-2 py-1 rounded bg-[#F5F5F5] hover:bg-line text-xs font-semibold text-ink"
              >
                Cook
              </button>
            )}

            {o.status === 'preparing' && (
              <button
                onClick={() =>
                  updateStatusMutation.mutate({ orderId: o.id, status: 'ready' })
                }
                className="px-2 py-1 rounded bg-brand-soft hover:bg-[#FFDAD6] text-xs font-semibold text-brand"
              >
                Ready
              </button>
            )}

            {o.status === 'ready' && (
              <button
                onClick={() =>
                  updateStatusMutation.mutate({ orderId: o.id, status: 'served' })
                }
                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
              >
                Serve
              </button>
            )}

            {isFullyPaid && o.status === 'served' && (
              <button
                onClick={() =>
                  updateStatusMutation.mutate({
                    orderId: o.id,
                    status: 'completed',
                    tableNumber: o.tableNumber,
                  })
                }
                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Close</span>
              </button>
            )}

            {/* View Details Modal */}
            <button
              onClick={() => setDetailOrder(o)}
              className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-ink-soft hover:text-ink transition-colors"
              title="View Order Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Print Thermal Receipt */}
            <button
              onClick={() => setReceiptOrder(o)}
              className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-ink-soft hover:text-ink transition-colors"
              title="Print Thermal Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];
}
