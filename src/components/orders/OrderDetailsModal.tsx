'use client';

import React from 'react';
import {
  X,
  Printer,
  MapPin,
  Phone,
  User,
  Utensils,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { useUpdateOrderStatus, useUpdateOrderPayment } from '@/hooks/useRestaurantData';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  onPrintReceipt: (order: Order) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  onPrintReceipt,
}: OrderDetailsModalProps) {
  const updateStatusMutation = useUpdateOrderStatus();
  const updatePaymentMutation = useUpdateOrderPayment();

  if (!order) return null;

  const handleStatusChange = (status: OrderStatus) => {
    updateStatusMutation.mutate({ orderId: order.id, status });
  };

  const handleMarkPaid = () => {
    updatePaymentMutation.mutate({
      orderId: order.id,
      paymentStatus: 'paid',
      cashTendered: order.total,
      changeDue: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-[#E9E8E7] my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF9F8] border-b border-[#E9E8E7] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg text-[#2D2926]">
                {order.orderNumber}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#E9E8E7] text-[#5B403D]">
                {order.type === 'dine_in'
                  ? order.tableNumber || 'Dine-In'
                  : order.type === 'delivery'
                  ? 'Delivery'
                  : 'Takeout'}
              </span>
              <span
                className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                  order.paymentStatus === 'paid'
                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                    : 'bg-[#FFF8E1] text-[#B45309]'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-[#8F6F6C] mt-0.5 font-medium">
              Created {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintReceipt(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#8F6F6C] hover:text-[#2D2926] hover:bg-white border border-transparent hover:border-[#E9E8E7] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {/* Customer & Channel Info */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FAF9F8] rounded-2xl border border-[#E9E8E7] text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#8F6F6C] flex items-center gap-1">
                <User className="w-3 h-3" /> Customer
              </span>
              <p className="font-bold text-[#2D2926]">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-[#5B403D] flex items-center gap-1 text-[11px]">
                  <Phone className="w-3 h-3 text-[#8F6F6C]" /> {order.customerPhone}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#8F6F6C] flex items-center gap-1">
                <Utensils className="w-3 h-3" /> Channel / Location
              </span>
              <p className="font-bold text-[#2D2926]">
                {order.type === 'dine_in'
                  ? order.tableNumber || 'Main Dining Table'
                  : order.type === 'delivery'
                  ? 'Delivery to Address'
                  : 'Takeaway Pickup Counter'}
              </p>
              {order.deliveryAddress && (
                <p className="text-[#5B403D] flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-[#BA1A20]" /> {order.deliveryAddress}
                </p>
              )}
            </div>
          </div>

          {/* Items Breakdown */}
          <div>
            <h4 className="text-xs font-black text-[#2D2926] uppercase tracking-wider mb-2">
              Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)} items)
            </h4>
            <div className="divide-y divide-[#F1F0F0] border border-[#E9E8E7] rounded-2xl overflow-hidden bg-white">
              {order.items.map((item) => (
                <div key={item.cartItemId} className="p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 text-center font-black text-xs text-[#BA1A20] mt-0.5">
                      {item.quantity}x
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-[#2D2926] leading-tight">
                        {item.dish.name}
                      </h5>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#8F6F6C] mt-1">
                        {item.portion?.priceDelta > 0 && (
                          <span className="bg-[#FAF9F8] px-1.5 py-0.5 rounded border border-[#E9E8E7] font-semibold text-[#5B403D]">
                            {item.portion.name}
                          </span>
                        )}
                        {item.spiceLevel && (
                          <span className="bg-[#FFF2F0] text-[#BA1A20] px-1.5 py-0.5 rounded border border-[#FFDAD6] font-bold">
                            Spice Lv.{item.spiceLevel}
                          </span>
                        )}
                        {item.selectedAddons?.map((a) => (
                          <span
                            key={a.id}
                            className="bg-[#FAF9F8] px-1.5 py-0.5 rounded border border-[#E9E8E7]"
                          >
                            +{a.name}
                          </span>
                        ))}
                      </div>
                      {item.specialNotes && (
                        <p className="text-[10px] text-[#B45309] italic mt-1">
                          Note: {item.specialNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="font-black text-xs text-[#2D2926] shrink-0">
                    ₱{item.totalPrice.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 bg-[#FAF9F8] rounded-2xl border border-[#E9E8E7] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#5B403D]">
              <span>Subtotal:</span>
              <span className="font-semibold">₱{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#5B403D]">
              <span>5% Restaurant VAT:</span>
              <span className="font-semibold">₱{order.tax.toLocaleString()}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-[#5B403D]">
                <span>Delivery Fee:</span>
                <span className="font-semibold">₱{order.deliveryFee}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-[#2D2926] pt-2 border-t border-[#E9E8E7]">
              <span>Total Amount:</span>
              <span className="text-[#BA1A20] text-base font-black">
                ₱{order.total.toLocaleString()}
              </span>
            </div>

            {order.cashTendered !== undefined && (
              <div className="pt-2 border-t border-[#E9E8E7] flex justify-between text-xs font-semibold text-[#2E7D32]">
                <span>Cash Tendered / Change:</span>
                <span>
                  ₱{order.cashTendered.toLocaleString()} / Change: ₱
                  {(order.changeDue || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Quick Operations Controls */}
          <div>
            <h4 className="text-xs font-black text-[#2D2926] uppercase tracking-wider mb-2">
              Update Status
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {(['pending', 'preparing', 'ready', 'completed', 'cancelled'] as OrderStatus[]).map(
                (status) => {
                  const isActive = order.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                        isActive
                          ? 'bg-[#BA1A20] text-white border-[#BA1A20] shadow-xs'
                          : 'bg-white text-[#5B403D] border-[#E9E8E7] hover:bg-[#F4F3F2]'
                      }`}
                    >
                      {status === 'pending'
                        ? 'Received'
                        : status === 'preparing'
                        ? 'In Kitchen'
                        : status}
                    </button>
                  );
                }
              )}

              {order.paymentStatus === 'unpaid' && (
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-xs transition-all ml-auto"
                >
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F8] border-t border-[#E9E8E7] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-[#E9E8E7] text-xs font-bold text-[#2D2926] hover:bg-[#F4F3F2] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
