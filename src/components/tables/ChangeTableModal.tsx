'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Loader2, ArrowRightLeft, Users, AlertCircle } from 'lucide-react';
import { Order } from '@/types';
import { useTableSessions, useOrders, useTransferOrderTable } from '@/hooks/useRestaurantData';

interface ChangeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onTableChanged?: (newTable: string) => void;
}

export function ChangeTableModal({
  isOpen,
  onClose,
  order,
  onTableChanged,
}: ChangeTableModalProps) {
  if (!isOpen || !order) return null;

  return (
    <ChangeTableModalContent
      order={order}
      onClose={onClose}
      onTableChanged={onTableChanged}
    />
  );
}

function ChangeTableModalContent({
  order,
  onClose,
  onTableChanged,
}: {
  order: Order;
  onClose: () => void;
  onTableChanged?: (newTable: string) => void;
}) {
  const { data: tableSessions = [] } = useTableSessions();
  const { data: allOrders = [] } = useOrders();
  const transferTableMutation = useTransferOrderTable();

  const currentTable = order.tableNumber || '';
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard shortcut listener (Escape to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // List of all dining tables sorted numerically
  const allTables = useMemo(() => {
    if (tableSessions.length > 0) {
      return [...tableSessions].sort((a, b) => {
        const numA = parseInt(a.tableNumber.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
    }
    return Array.from({ length: 12 }, (_, i) => ({
      tableNumber: `Table ${i + 1}`,
      guestCount: 4,
      status: 'available' as const,
    }));
  }, [tableSessions]);

  // Table occupancy map from active orders
  const activeOrdersByTable = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of allOrders) {
      if (
        o.type === 'dine_in' &&
        o.tableNumber &&
        o.id !== order.id &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
      ) {
        map.set(o.tableNumber, o);
      }
    }
    return map;
  }, [allOrders, order.id]);

  // Available tables list
  const availableTableNumbers = useMemo(() => {
    return allTables
      .map((t) => t.tableNumber)
      .filter((tNum) => {
        if (tNum === currentTable) return false;
        const session = tableSessions.find((ts) => ts.tableNumber === tNum);
        const hasOpenOrder = activeOrdersByTable.has(tNum);
        return (!session || session.status === 'available') && !hasOpenOrder;
      });
  }, [allTables, currentTable, tableSessions, activeOrdersByTable]);

  // Auto-select first available table on mount
  useEffect(() => {
    if (availableTableNumbers.length > 0 && !selectedTable) {
      setSelectedTable(availableTableNumbers[0]);
    }
  }, [availableTableNumbers, selectedTable]);

  const handleConfirmTransfer = async () => {
    if (!selectedTable || selectedTable === currentTable) return;

    setErrorMessage(null);
    try {
      await transferTableMutation.mutateAsync({
        orderId: order.id,
        fromTable: currentTable || undefined,
        toTable: selectedTable,
      });

      if (onTableChanged) {
        onTableChanged(selectedTable);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to change table:', err);
      setErrorMessage(err.message || 'Failed to update table. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E5E5E5] my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F1F1F]">
                Change Dining Table
              </h3>
              <p className="text-[11px] text-[#737373]">
                Order {order.orderNumber} • Currently seated at{' '}
                <strong className="text-neutral-900">{currentTable || 'Unassigned'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#1F1F1F] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Header Metrics */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1F1F1F]">
              Select New Destination Table:
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {availableTableNumbers.length} Available
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tables Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {allTables.map((table) => {
              const tNum = table.tableNumber;
              const isCurrent = tNum === currentTable;
              const activeOrder = activeOrdersByTable.get(tNum);
              const isOccupied = !isCurrent && (activeOrder !== undefined || table.status !== 'available');
              const isAvailable = !isCurrent && !isOccupied;
              const isSelected = selectedTable === tNum;

              if (isCurrent) {
                return (
                  <div
                    key={tNum}
                    className="p-3 rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-500 flex flex-col justify-between select-none opacity-80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-700">{tNum}</span>
                      <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded">
                        Current
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Seated here now</span>
                    </span>
                  </div>
                );
              }

              if (isOccupied) {
                return (
                  <div
                    key={tNum}
                    className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/70 text-neutral-400 select-none opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-neutral-500">{tNum}</span>
                      <span className="text-[9px] font-bold text-neutral-500 bg-neutral-200/80 px-1 py-0.2 rounded">
                        Occupied
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-2 block truncate">
                      {activeOrder ? activeOrder.orderNumber : 'Occupied'}
                    </span>
                  </div>
                );
              }

              // Available table (Clickable)
              return (
                <button
                  key={tNum}
                  type="button"
                  onClick={() => setSelectedTable(tNum)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-[#BA1A20] bg-[#FFF2F0] text-[#BA1A20] shadow-xs ring-2 ring-[#BA1A20]/20'
                      : 'border-[#E5E5E5] bg-white text-[#1F1F1F] hover:border-neutral-400 hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs">{tNum}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#BA1A20]" />}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-neutral-500 mt-2 flex items-center gap-1">
                    <Users className="w-3 h-3 text-neutral-400" />
                    <span>Cap: {table.guestCount || 4} guests</span>
                  </span>
                </button>
              );
            })}
          </div>

          {availableTableNumbers.length === 0 && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-xs text-neutral-600">
              All other tables are currently occupied. Free up a table or settle an order before moving.
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="px-5 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#525252] hover:bg-[#EAEAEA] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedTable || selectedTable === currentTable || transferTableMutation.isPending}
            onClick={handleConfirmTransfer}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#BA1A20] hover:bg-[#8B0000] rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            {transferTableMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Moving Table...</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Move to {selectedTable || 'Selected Table'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
