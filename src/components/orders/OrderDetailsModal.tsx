'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Printer,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import {
  useUpdateOrderStatus,
  useOrders,
} from '@/hooks/useRestaurantData';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onPrintReceipt: (order: Order) => void;
  onOpenInPos?: (order: Order) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  onPrintReceipt,
  onOpenInPos,
}: OrderDetailsModalProps) {
  const router = useRouter();
  const updateStatusMutation = useUpdateOrderStatus();
  const { data: allOrders = [] } = useOrders();

  // Keep order reactive so status changes and added items update immediately
  const currentOrder = (order && allOrders.find((o) => o.id === order.id)) || order;

  // Local optimistic status for instantaneous UI response on click
  const [optimisticStatus, setOptimisticStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    setOptimisticStatus(null);
  }, [order?.id]);

  // Keyboard shortcut listener: Escape to close
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

  if (!currentOrder) return null;

  const total = Number(currentOrder.total || 0);
  const amountPaid = Number(currentOrder.amountPaid || (currentOrder.paymentStatus === 'paid' ? total : 0));
  const balanceDue = Number(
    currentOrder.balanceDue !== undefined ? currentOrder.balanceDue : Math.max(0, total - amountPaid)
  );
  const isFullyPaid = currentOrder.paymentStatus === 'paid' || balanceDue === 0;
  const activeStatus = optimisticStatus || currentOrder.status;

  // Spice label helper
  const getSpiceLabel = (level?: number) => {
    switch (level) {
      case 1:
        return 'Mild';
      case 2:
        return 'Medium';
      case 3:
        return 'Hot Spicy';
      case 4:
        return 'Very Spicy';
      default:
        return null;
    }
  };

  // Instant optimistic status progression
  const handleStatusChange = (status: OrderStatus) => {
    if (status === 'completed' && !isFullyPaid) {
      alert(`Please settle the unpaid balance of ₱${balanceDue.toLocaleString()} in POS before closing.`);
      return;
    }
    setOptimisticStatus(status);
    updateStatusMutation.mutate(
      { orderId: currentOrder.id, status, tableNumber: currentOrder.tableNumber },
      {
        onError: () => {
          setOptimisticStatus(null);
        },
      }
    );
  };

  // Open order on POS
  const handleOpenInPos = () => {
    if (onOpenInPos) {
      onOpenInPos(currentOrder);
      onClose();
    } else {
      onClose();
      router.push(`/pos?orderId=${currentOrder.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-neutral-200 my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header: Clean, quiet, minimal */}
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-base text-neutral-900 tracking-tight">
                {currentOrder.orderNumber}
              </h3>
              <span className="text-[11px] font-medium text-neutral-500">
                {currentOrder.type === 'dine_in'
                  ? currentOrder.tableNumber || 'Dine-In'
                  : currentOrder.type === 'delivery'
                  ? 'Delivery'
                  : 'Takeout'}
              </span>
              <span className="text-neutral-300">•</span>
              <span className={`text-[11px] font-semibold ${isFullyPaid ? 'text-emerald-700' : 'text-neutral-900'}`}>
                {isFullyPaid ? 'Paid' : 'Unpaid'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {currentOrder.customerName} · {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPrintReceipt(currentOrder)}
              title="Print Receipt"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">

          {/* Order-Level Special Dining / Cooking Instructions */}
          {currentOrder.specialNotes && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold text-amber-800 uppercase text-[10px] tracking-wide block mb-0.5">Special Instructions:</span>
              <span className="font-medium">{currentOrder.specialNotes}</span>
            </div>
          )}

          {/* Ordered Items List */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Ordered Items ({currentOrder.items.reduce((s, i) => s + i.quantity, 0)})
              </span>
              {!isFullyPaid && (
                <button
                  type="button"
                  onClick={handleOpenInPos}
                  className="text-xs font-medium text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Modify in POS</span>
                </button>
              )}
            </div>

            {/* Line items */}
            <div className="space-y-2.5">
              {currentOrder.items.map((item) => (
                <div key={item.cartItemId} className="flex items-start justify-between text-xs py-1 border-b border-neutral-50 last:border-0">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="font-mono text-neutral-400 text-[11px] w-4 mt-0.5">
                      {item.quantity}×
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-neutral-900 font-medium">{item.dish.name}</span>
                      
                      {/* Variants & Spice details */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10.5px]">
                        {item.selectedVariants && item.selectedVariants.length > 0 ? (
                          item.selectedVariants.map((v, idx) => (
                            <span key={idx} className="bg-neutral-100 text-neutral-800 px-1.5 py-0.2 rounded font-medium">
                              {v.groupName}: {v.optionName}
                            </span>
                          ))
                        ) : (
                          item.portion?.priceDelta > 0 && (
                            <span className="text-neutral-500">• {item.portion.name}</span>
                          )
                        )}

                        {item.spiceLevel && getSpiceLabel(item.spiceLevel) && (
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            item.spiceLevel >= 4
                              ? 'bg-red-100 text-red-700'
                              : item.spiceLevel === 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            Spice: {getSpiceLabel(item.spiceLevel)}
                          </span>
                        )}

                        {item.selectedAddons?.map((a) => (
                          <span key={a.id} className="text-neutral-500">• +{a.name}</span>
                        ))}
                      </div>

                      {item.specialNotes && (
                        <p className="text-[10px] text-amber-800 italic mt-0.5">
                          Note: {item.specialNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-neutral-800 tabular-nums font-semibold shrink-0 ml-2">
                    ₱{item.totalPrice.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financials & Balance */}
          <div className="pt-4 border-t border-neutral-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">₱{currentOrder.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>VAT (5%)</span>
              <span className="font-mono tabular-nums">₱{currentOrder.tax.toLocaleString()}</span>
            </div>
            {currentOrder.deliveryFee > 0 && (
              <div className="flex justify-between text-neutral-500">
                <span>Delivery Fee</span>
                <span className="font-mono tabular-nums">₱{currentOrder.deliveryFee.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100 font-semibold text-neutral-900">
              <span>Total</span>
              <span className="font-mono text-sm tabular-nums">₱{currentOrder.total.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs font-medium text-neutral-600">Balance Due</span>
              <span className={`font-mono font-bold text-base tabular-nums ${isFullyPaid ? 'text-emerald-700' : 'text-neutral-900'}`}>
                ₱{balanceDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Status Progression: Single segmented control with immediate UI feedback */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Status
              </span>
              <span className="text-[11px] text-neutral-500 capitalize">
                {activeStatus}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl">
              {[
                { id: 'pending', label: 'Received' },
                { id: 'preparing', label: 'Kitchen' },
                { id: 'ready', label: 'Ready' },
                { id: 'served', label: 'Served' },
              ].map((st) => {
                const isActive = activeStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStatusChange(st.id as OrderStatus)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer: Clear primary action */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Close
          </button>

          {!isFullyPaid ? (
            <button
              type="button"
              onClick={handleOpenInPos}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Open in POS (₱{balanceDue.toLocaleString()})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            currentOrder.status !== 'completed' && (
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-medium shadow-2xs transition-colors"
              >
                Complete Order
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
}
