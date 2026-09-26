'use client';

import React from 'react';
import { Bike, ShoppingBag, UtensilsCrossed, Smartphone, Monitor } from 'lucide-react';
import { Order } from '@/types';

interface SessionOrdersTableProps {
  orders: Order[];
  isOwner?: boolean;
}

export function SessionOrdersTable({ orders, isOwner }: SessionOrdersTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
      <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-black text-neutral-900">
          Session Orders Table
        </h3>
        <span className="text-xs text-neutral-500">
          {orders.length} orders found
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Time</th>
              {isOwner && <th className="px-4 py-3">Cashier</th>}
              <th className="px-4 py-3">Type / Destination</th>
              <th className="px-4 py-3">Items Sold</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={isOwner ? 9 : 8}
                  className="px-4 py-12 text-center text-neutral-400"
                >
                  No orders recorded for this session period.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isMobile = order.id?.startsWith('ord_mob_');
                const itemCount = (order.items || []).reduce(
                  (sum, it) => sum + (it.quantity || 1),
                  0
                );
                const itemsSummary = (order.items || [])
                  .map((it) => `${it.dish?.name || 'Item'} ×${it.quantity}`)
                  .join(', ');

                return (
                  <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Order Number */}
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                      {order.orderNumber}
                    </td>

                    {/* Order Origin Channel */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isMobile ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Smartphone className="w-3 h-3 text-indigo-600" />
                          <span>Mobile App</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                          <Monitor className="w-3 h-3 text-neutral-500" />
                          <span>POS Counter</span>
                        </span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-600 font-mono">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Cashier Name (Owner only) */}
                    {isOwner && (
                      <td className="px-4 py-3 font-semibold text-neutral-800">
                        {order.cashierName || 'POS Staff'}
                      </td>
                    )}

                    {/* Type & Destination */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {order.type === 'delivery' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Bike className="w-3 h-3" /> Delivery
                          </span>
                        ) : order.type === 'takeout' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <ShoppingBag className="w-3 h-3" /> Takeout
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <UtensilsCrossed className="w-3 h-3" /> {order.tableNumber || 'Dine-In'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Items Sold */}
                    <td className="px-4 py-3 text-neutral-700 max-w-xs truncate" title={itemsSummary}>
                      <span className="font-bold text-neutral-900">{itemCount} items:</span>{' '}
                      <span className="text-neutral-500">{itemsSummary}</span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-neutral-700 capitalize">
                      {order.paymentMethod || 'Cash'}
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3 whitespace-nowrap text-right font-black text-neutral-900 font-mono">
                      ₱{Number(order.total || 0).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.status === 'ready'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {order.status}
                      </span>
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
