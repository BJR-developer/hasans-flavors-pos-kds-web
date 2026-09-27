'use client';

import React from 'react';
import { Utensils, ShoppingBag, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { Order, OrderType, TableSession } from '@/types';

interface PosCartHeaderProps {
  loadedOrder?: Order | null;
  itemsCount: number;
  orderType: OrderType;
  selectedTable: string;
  availableTables: string[];
  tableSessions: TableSession[];
  onChannelChange: (type: OrderType) => void;
  onSelectTable: (table: string) => void;
  onClearCart: () => void;
  onCancelLoadedOrder?: () => void;
  onOpenChangeTable: () => void;
}

export function PosCartHeader({
  loadedOrder,
  itemsCount,
  orderType,
  selectedTable,
  availableTables,
  tableSessions,
  onChannelChange,
  onSelectTable,
  onClearCart,
  onCancelLoadedOrder,
  onOpenChangeTable,
}: PosCartHeaderProps) {
  return (
    <div className="p-4 border-b border-line bg-white space-y-3 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink tracking-tight">
            Order Ticket
          </span>
          {loadedOrder ? (
            <span className="text-xs font-semibold bg-neutral-900 text-white px-2 py-0.5 rounded-md">
              Active Order
            </span>
          ) : itemsCount > 0 ? (
            <span className="text-xs font-semibold bg-[#F5F5F5] text-ink-soft px-2 py-0.5 rounded-md">
              {itemsCount} items
            </span>
          ) : null}
        </div>

        {loadedOrder ? (
          <button
            type="button"
            onClick={onCancelLoadedOrder}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            New Ticket
          </button>
        ) : (
          itemsCount > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-xs font-medium text-muted hover:text-brand flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )
        )}
      </div>

      {/* Loaded Order Banner vs New Order Channel Selector */}
      {loadedOrder ? (
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-neutral-900">
              {loadedOrder.orderNumber}
            </span>
            <span
              className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-md ${
                loadedOrder.paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {loadedOrder.paymentStatus}
            </span>
          </div>

          {loadedOrder.type === 'dine_in' ? (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-neutral-500">Dining Table:</span>
              <button
                type="button"
                onClick={onOpenChangeTable}
                className="inline-flex items-center gap-1 font-bold text-neutral-900 bg-white border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs"
                title="Click to move to another available table"
              >
                <span>{loadedOrder.tableNumber || 'Dine-In'}</span>
                <ArrowRightLeft className="w-2.5 h-2.5 text-neutral-400" />
                <span className="text-xs text-neutral-500 font-normal underline ml-0.5">Change</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Customer:</span>
              <span className="font-medium text-neutral-700">
                {loadedOrder.customerName || 'Takeout Customer'}
              </span>
            </div>
          )}

          {loadedOrder.specialNotes && (
            <div className="pt-1 border-t border-neutral-200 text-xs text-amber-900 font-medium">
              <span className="font-bold text-amber-800">Instruction: </span>
              <span>{loadedOrder.specialNotes}</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 3 Channel Buttons: Dine-In, Takeout, & Delivery */}
          <div className="grid grid-cols-3 gap-1 bg-[#F5F5F5] p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onChannelChange('dine_in')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                orderType === 'dine_in'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>

            <button
              type="button"
              onClick={() => onChannelChange('takeout')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                orderType === 'takeout'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Takeout</span>
            </button>

            <button
              type="button"
              onClick={() => onChannelChange('delivery')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                orderType === 'delivery'
                  ? 'bg-white text-ink shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>Delivery</span>
            </button>
          </div>

          {/* Table Chips for Dine-In (Available Tables) */}
          {orderType === 'dine_in' && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted mb-1.5">
                <span className="font-semibold text-neutral-800">
                  Available Tables ({availableTables.length})
                </span>
                <span className="text-xs text-emerald-700 font-medium">
                  Ready to Seat
                </span>
              </div>
              {availableTables.length === 0 ? (
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-500 text-center font-medium">
                  All tables are currently occupied
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {availableTables.map((t) => {
                    const short = t.replace('Table ', 'T');
                    const isSelected = selectedTable === t;
                    const session = tableSessions.find((ts) => ts.tableNumber === t);
                    const cap = session?.capacity || session?.guestCount || 4;

                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onSelectTable(t)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-ink text-white shadow-2xs'
                            : 'bg-[#F5F5F5] text-ink-soft hover:bg-line'
                        }`}
                      >
                        <span>{short}</span>
                        <span
                          className={`text-xs font-normal ${
                            isSelected ? 'text-white/70' : 'text-neutral-400'
                          }`}
                        >
                          ({cap}p)
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
